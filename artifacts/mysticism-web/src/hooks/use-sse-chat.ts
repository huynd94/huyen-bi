import { useState } from 'react';
import { readSseStream } from '@/lib/sse-stream';
import { UNAUTHENTICATED_AI_MESSAGE } from '@/lib/ai-auth-messages';
import { parseRetryAfter } from '@/lib/network/retry-after';

export interface SSEHeaders {
  provider?: string;
  apiKey?: string;
  model?: string;
}

/**
 * Trạng thái kết nối tới backend AI streaming, phơi bày từ {@link useSSEChat}
 * và `useAISSEChat`.
 *
 * - `"online"`: trạng thái mặc định — chưa stream, đang stream bình thường,
 *   hoặc stream đã kết thúc (kể cả với lỗi không phải mất kết nối giữa
 *   chừng).
 * - `"reconnecting"`: đang trong khoảng backoff giữa các lần retry sau khi
 *   kết nối bị ngắt giữa chừng. Page consumer (`/ai-chat`) render banner
 *   "Mất kết nối — đang thử lại…" theo Requirement 5.6.
 */
export type ConnectionStatus = 'online' | 'reconnecting';

/**
 * Thông tin lỗi rate-limit (HTTP 429) được phơi bày từ hook để consumer
 * render `<ErrorState status="429">` với số phút chờ (Requirement 5.5).
 *
 * `null` khi không có lỗi rate-limit hiện hành.
 */
export interface RateLimitError {
  /** Số giây phải chờ, tính từ header `Retry-After`. `0` nếu header thiếu. */
  retryAfterSeconds: number;
}

/**
 * Khoảng backoff (ms) giữa các lần retry sau khi mất kết nối giữa chừng.
 *
 * Số phần tử của mảng = số lần retry tối đa. Theo Requirement 5.6 (retry
 * tối đa 2 lần với backoff 1s rồi 2s). Nếu cả hai lần retry đều thất bại,
 * hook nhả `connectionStatus` về `"online"` và để lại text đã stream được
 * trong bubble assistant (không reset).
 */
const MID_STREAM_RETRY_DELAYS_MS: readonly number[] = [1000, 2000] as const;

/**
 * Sleep `ms` mili-giây nhưng huỷ ngay khi `signal` bị abort. Dùng cho
 * khoảng backoff giữa các lần retry — nếu user nhấn nút "Dừng"
 * (`AbortController.abort()`) trong lúc đang chờ, ta thoát ra ngay thay
 * vì giam người dùng trong toàn bộ backoff.
 *
 * Promise resolve khi `setTimeout` chạy xong **hoặc** khi `signal` fire
 * sự kiện `abort`. Giá trị resolve cho biết đã abort hay timer hoàn tất.
 */
function delayWithAbort(
  ms: number,
  signal: AbortSignal | undefined,
): Promise<'aborted' | 'elapsed'> {
  return new Promise((resolve) => {
    if (signal?.aborted) {
      resolve('aborted');
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      resolve('aborted');
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve('elapsed');
    }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/**
 * Phân loại lỗi "ngắt kết nối giữa chừng" — chỉ những lỗi này mới đủ
 * điều kiện retry theo Requirement 5.6.
 *
 * - `AbortError` được loại trừ vì abort do user chủ động (nút "Dừng" trên
 *   `/ai-chat`); retry sẽ vi phạm hợp đồng giữa user và UI.
 * - Các lỗi `TypeError` của fetch/stream (ví dụ "Failed to fetch", "network
 *   error") thường biểu hiện disconnection. Bao gồm cả lỗi bất ngờ khác
 *   trong khi đọc stream (RangeError, JSON parse, ...) cũng coi là retry
 *   candidate vì chúng phát sinh sau khi response body đã mở — tức user
 *   đã thấy ít nhất một phần text.
 *
 * Không retry với `Response.ok === false` hoặc các lỗi phía server đã
 * trả status code (4xx/5xx) — những trường hợp đó đã có ErrorState riêng
 * (Requirement 5.4, 5.5).
 */
function isRetriableMidStreamError(err: unknown): boolean {
  if (err instanceof DOMException && err.name === 'AbortError') return false;
  if (err instanceof Error && err.name === 'AbortError') return false;
  return true;
}

/**
 * Hook quản lý lifecycle của một SSE chat stream tới backend mysticism.
 *
 * Trả về:
 * - `messages`: danh sách bubble `{ role, content }` đã render. Bubble user
 *   và placeholder assistant được append ngay khi {@link streamResponse}
 *   bắt đầu, sau đó nội dung assistant được append theo từng SSE chunk.
 * - `streamResponse(url, body, signal?)`: thực thi POST + đọc SSE. Caller
 *   truyền `AbortSignal` để cho phép user huỷ stream qua nút "Dừng".
 * - `isStreaming`: `true` trong khoảng từ lúc bắt đầu fetch đến khi stream
 *   kết thúc / lỗi không retry / abort.
 * - `setMessages`: dispatcher để consumer (ví dụ `/ai-chat`) hydrate từ
 *   `localStorage` hoặc xoá hội thoại.
 * - `connectionStatus`: `"online" | "reconnecting"` theo
 *   {@link ConnectionStatus}. Consumer render banner "Mất kết nối — đang
 *   thử lại…" khi giá trị là `"reconnecting"` (Requirement 5.6).
 *
 * Hợp đồng retry (Requirement 5.6):
 * - Lỗi mid-stream (sau khi response body đã mở) sẽ retry tối đa 2 lần với
 *   backoff 1s rồi 2s, gửi lại cùng request.
 * - Lỗi ban đầu của `fetch()` (network failure trước khi có response) KHÔNG
 *   retry — giữ nguyên hành vi cũ để không phá vỡ Property 2c của
 *   `use-sse-chat-preservation.test.ts`.
 * - Trong khi retry, text đã stream được giữ nguyên trong bubble assistant
 *   (không reset placeholder); chunk mới sẽ append tiếp khi retry thành
 *   công. User vì thế không bao giờ thấy nội dung biến mất.
 * - Abort trong khi đang chờ backoff sẽ thoát retry ngay (tôn trọng yêu
 *   cầu của user).
 */
export function useSSEChat(sseHeaders?: SSEHeaders) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('online');
  const [rateLimitError, setRateLimitError] = useState<RateLimitError | null>(null);

  /**
   * Build header map cho mỗi attempt. Hàm thường (không qua `useCallback`)
   * vì hook test harness ở `use-sse-chat-unauth.exploration.test.ts` chỉ
   * stub `useState` / `useContext` — và đây là một hàm thuần đọc tham
   * chiếu mới mỗi render, không cần memoization để giữ ổn định cho
   * effect downstream (không có effect nào dùng nó).
   */
  const buildHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (sseHeaders?.provider) {
      headers['x-ai-provider'] = sseHeaders.provider;
    }
    // Không gửi x-ai-key khi dùng server key
    if (sseHeaders?.apiKey && sseHeaders.provider !== 'server') {
      headers['x-ai-key'] = sseHeaders.apiKey;
    }
    if (sseHeaders?.model && sseHeaders.provider !== 'server') {
      headers['x-ai-model'] = sseHeaders.model;
    }
    return headers;
  };

  const streamResponse = async (
    url: string,
    body: any,
    signal?: AbortSignal,
  ) => {
    setIsStreaming(true);
    setConnectionStatus('online');
    setRateLimitError(null);
    setMessages((prev) => [...prev, { role: 'user', content: body.context || body.content }]);
    setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

    try {
      // ---- Lần fetch đầu ---------------------------------------------------
      // Lỗi ở giai đoạn này (trước khi đọc body) KHÔNG retry: giữ nguyên
      // hành vi của `use-sse-chat-preservation.test.ts` Property 2c — fetch
      // ném exception ⇒ swallow + isStreaming=false, không có text mới.
      const response = await fetch(url, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(body),
        signal,
      });

      if (!response.ok) {
        if (response.status === 401) {
          setMessages((prev) => {
            const copy = [...prev];
            const last = copy[copy.length - 1];
            if (last?.role === 'assistant') last.content = UNAUTHENTICATED_AI_MESSAGE;
            return copy;
          });
          return;
        }
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get('Retry-After');
          const retryAfterSeconds = parseRetryAfter(retryAfterHeader);
          setRateLimitError({ retryAfterSeconds });
          // Remove the empty assistant placeholder — ErrorState will render instead.
          setMessages((prev) => {
            const copy = [...prev];
            if (copy[copy.length - 1]?.role === 'assistant') copy.pop();
            return copy;
          });
          return;
        }
        const err = await response.json().catch(() => ({ error: 'Lỗi kết nối' }));
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant') last.content = `Lỗi: ${err.error || 'Không thể kết nối AI'}`;
          return copy;
        });
        return;
      }

      if (!response.body) throw new Error('No response body');

      // ---- Đọc SSE stream với mid-stream retry -----------------------------
      // Vòng `while` cho phép tối đa 1 + MID_STREAM_RETRY_DELAYS_MS.length
      // attempts. Mỗi attempt đọc tới khi stream xong (`break`), hoặc gặp
      // lỗi mid-stream (chuyển vào nhánh retry trong `catch`).
      let activeBody: ReadableStream<Uint8Array> | null = response.body;
      let attempt = 0;

      streamLoop: while (activeBody !== null) {
        try {
          for await (const { data } of readSseStream(activeBody)) {
            const content = (data as { content?: unknown })?.content;
            if (typeof content === 'string' && content.length > 0) {
              setMessages((prev) => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                  lastMessage.content += content;
                }
                return newMessages;
              });
            }
          }
          // Stream kết thúc sạch sẽ — thoát vòng retry.
          break streamLoop;
        } catch (streamErr) {
          // Abort do user → không retry, thoát ngay.
          if (signal?.aborted || !isRetriableMidStreamError(streamErr)) {
            throw streamErr;
          }

          // Hết hạn ngạch retry → log và thoát; text đã stream vẫn còn
          // trong bubble assistant (không reset).
          if (attempt >= MID_STREAM_RETRY_DELAYS_MS.length) {
            console.error('SSE Error (retries exhausted):', streamErr);
            break streamLoop;
          }

          // Vào trạng thái reconnecting + chờ backoff.
          setConnectionStatus('reconnecting');
          const waitResult = await delayWithAbort(
            MID_STREAM_RETRY_DELAYS_MS[attempt],
            signal,
          );
          if (waitResult === 'aborted') {
            // User huỷ trong lúc chờ backoff — thoát ngay.
            break streamLoop;
          }
          attempt += 1;

          // Gửi lại request. Nếu fetch lần retry này tự ném exception, ta
          // catch tại đây để vòng `while` tiếp tục đánh giá quota retry kế
          // tiếp. Khi không còn quota, `activeBody` sẽ là `null` và vòng
          // `while` thoát.
          try {
            const retryResponse = await fetch(url, {
              method: 'POST',
              headers: buildHeaders(),
              body: JSON.stringify(body),
              signal,
            });
            if (!retryResponse.ok || !retryResponse.body) {
              console.error(
                'SSE retry failed: response not ok or empty body',
                retryResponse.status,
              );
              activeBody = null;
              break streamLoop;
            }
            activeBody = retryResponse.body;
            // Quay lại đầu vòng `while` để đọc body mới.
            setConnectionStatus('online');
          } catch (retryFetchErr) {
            // Abort được tôn trọng tuyệt đối; ngoài ra coi như mid-stream
            // failure mới và rơi vào catch của vòng `while` kế tiếp.
            if (signal?.aborted) break streamLoop;
            console.error('SSE retry fetch error:', retryFetchErr);
            // `activeBody` không đổi (vẫn là body cũ đã đóng); đặt về null
            // và thoát — đã dùng một slot retry, không hợp lý "miễn phí"
            // thêm slot nữa khi fetch thất bại.
            activeBody = null;
            break streamLoop;
          }
        }
      }
    } catch (err) {
      console.error('SSE Error:', err);
    } finally {
      setConnectionStatus('online');
      setIsStreaming(false);
    }
  };

  return { messages, streamResponse, isStreaming, setMessages, connectionStatus, rateLimitError, clearRateLimitError: () => setRateLimitError(null) };
}
