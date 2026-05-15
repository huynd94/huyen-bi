import { useEffect, useMemo, useRef, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { ErrorState } from "@/components/ui/error-state";
import { Square, Send, Trash2, ArrowDown, Sparkles, WifiOff } from "lucide-react";
import { useAISSEChat } from "@/hooks/use-ai-sse-chat";
import {
  loadMessages,
  saveMessages,
  type Message,
  type MessageRole,
} from "@/lib/ai-chat-store";
import { cn } from "@/lib/utils";
import { ERROR_MESSAGES } from "@/lib/error-messages";

/**
 * 14 câu gợi ý cố định cho ô input của trang `/ai-chat` (Requirement 13.5).
 * Hiển thị thành chip phía trên `<form>` gửi tin nhắn; khi click sẽ điền
 * text vào textarea và đặt focus chờ user chỉnh sửa trước khi gửi.
 */
const SUGGESTED_QUESTIONS: readonly string[] = [
  "Số vận mệnh 7 có ý nghĩa gì và hợp nghề nghiệp nào?",
  "Người sinh năm Giáp Tý có tính cách và vận mệnh ra sao?",
  "Quẻ Địa Thiên Thái có nghĩa gì khi hỏi về tình duyên?",
  "Số điện thoại kết thúc 8686 tốt hay xấu? Ý nghĩa từng số?",
  "Sao Thái Dương chiếu mệnh năm nay ảnh hưởng gì?",
  "Ngũ Hành Hỏa thiếu cần bổ sung màu sắc và vật phẩm gì?",
  "Người sinh giờ Ngọ tuổi Mùi tứ trụ thế nào?",
  "Cung Mệnh Thiên Đồng Cự Môn hội chiếu mang lại gì?",
  "Sao La Hầu chiếu cần hóa giải như thế nào?",
  "Đại Vận Kim có lợi hay bất lợi cho người mệnh Mộc?",
  "Hợp tuổi Dần và Ngọ có phải Tam Hợp không?",
  "Xem ngày cưới tháng 6 âm lịch ngày nào tốt nhất?",
  "Phong thuỷ hướng Tây Nam tốt cho người Mệnh Quái nào?",
  "Tên có tổng nét 25 theo Hán Tự mang vận khí gì?",
];

/**
 * Khoảng cách (px) tối đa từ đáy mà trang vẫn coi như đã ở "bottom".
 * Khi `scrollHeight - scrollTop - clientHeight < SCROLL_BOTTOM_THRESHOLD_PX`
 * trang tự động cuộn xuống tin mới; ngược lại hiện nút "Tin nhắn mới ↓"
 * để user chủ động cuộn (Requirement 13.4).
 */
const SCROLL_BOTTOM_THRESHOLD_PX = 100;

/**
 * Endpoint AI streaming hiện đang dùng cho luận giải mysticism. Cùng route
 * này phục vụ cả AI chat ở giai đoạn này — `useAISSEChat` đã wire-up để
 * gắn x-ai-provider/key/model headers và xử lý Clerk auth gate.
 */
const AI_INTERPRET_ENDPOINT = "/api/mysticism/ai-interpret";

/**
 * Tạo id ngẫu nhiên cho một {@link Message}. Dùng `crypto.randomUUID` khi
 * có (mọi trình duyệt thông dụng năm 2024+); fallback về Math.random cho
 * môi trường test cổ.
 */
function makeMessageId(): string {
  if (
    typeof globalThis !== "undefined" &&
    typeof globalThis.crypto?.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Hiển thị thời gian tương đối tiếng Việt — "vừa xong",
 * "n phút trước", "n giờ trước", "n ngày trước" — để gắn dưới mỗi
 * bubble. Tooltip kèm bubble vẫn hiển thị ngày-giờ đầy đủ qua
 * {@link formatFullDateTime} (Requirement 13.2).
 */
function formatRelativeTime(timestamp: number, now: number): string {
  const diffSec = Math.max(0, Math.round((now - timestamp) / 1000));
  if (diffSec < 60) return "vừa xong";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.round(diffHour / 24);
  return `${diffDay} ngày trước`;
}

/**
 * Hiển thị ngày-giờ đầy đủ cho tooltip — `dd/MM/yyyy HH:mm` theo locale
 * `vi-VN` để screen reader và user hover đều đọc được.
 */
function formatFullDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Build the AI request body. The `/api/mysticism/ai-interpret` endpoint is
 * stateless per-message (zod schema accepts `type`, `context`, optional
 * `question` only). To keep the UX bubble matching the user's raw input,
 * we send the latest user text as `context` directly. Multi-turn memory
 * lives on the client side via `loadMessages`/`saveMessages` and is not
 * forwarded to the model in this iteration — Requirement 13 focuses on
 * UX, not stateful chains. A future task may switch to a dedicated chat
 * endpoint that accepts a message array.
 */
function buildRequestBody(text: string): { type: string; context: string } {
  // Defensively cap the user message to the schema's `context` max so a
  // pathological paste cannot 400 the request silently.
  const trimmed = text.length > 7800 ? text.slice(0, 7800) : text;
  return { type: "ai-chat", context: trimmed };
}

/**
 * Trang `/ai-chat` — Trợ Lý Tâm Linh Huyền Bí.
 *
 * Layout cố định:
 *
 * - Navbar + Breadcrumb đầu trang.
 * - `<ul role="log" aria-live="polite">` chứa lịch sử hội thoại; mỗi
 *   bubble là `<li role="listitem">` (Requirement 13.1). Bubble user
 *   căn phải nền `--secondary`, bubble AI căn trái nền `--card`.
 * - Auto-scroll-to-bottom với guard 100px; khi user đã cuộn lên, hiện
 *   nút "Tin nhắn mới ↓" (Requirement 13.4).
 * - Khi không có tin nhắn nào: hiển thị 14 chip gợi ý lớn ở trung tâm.
 * - Phía trên ô input (luôn hiển thị): 14 chip gợi ý cuốn ngang
 *   (Requirement 13.5). Click chip điền vào textarea và focus.
 * - Textarea + nút gửi/Dừng. Enter gửi tin, Shift+Enter xuống dòng
 *   (Requirement 13.6).
 * - Khi đang stream: nút "Dừng" thay nút Gửi, dùng AbortController để
 *   huỷ; phần text đã nhả vẫn được giữ (Requirement 13.7).
 * - Persist hội thoại qua `localStorage` (`loadMessages`/`saveMessages`
 *   từ `@/lib/ai-chat-store`) — Requirement 13.8.
 *
 * Validates: Requirements 5.3, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7.
 */
export default function AIChatPage() {
  // ---------------------------------------------------------------------
  // Streaming + auth: useAISSEChat handles Clerk gate + AI key headers.
  // ---------------------------------------------------------------------
  const {
    messages: hookMessages,
    streamResponse,
    isStreaming,
    setMessages: setHookMessages,
    connectionStatus,
    rateLimitError,
    clearRateLimitError,
  } = useAISSEChat();

  // metadata (id, timestamp) song song với hookMessages — index-aligned.
  // Ref vì nó phải ổn định qua re-render mà không trigger thêm effect.
  const metaRef = useRef<{ id: string; timestamp: number }[]>([]);

  // Hydrate hook state + meta từ localStorage chỉ MỘT lần ở mount.
  useEffect(() => {
    const persisted = loadMessages();
    if (persisted.length > 0) {
      metaRef.current = persisted.map((m) => ({
        id: m.id,
        timestamp: m.timestamp,
      }));
      setHookMessages(persisted.map((m) => ({ role: m.role, content: m.content })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tin nhắn được hiển thị: gộp hookMessages với meta. Mọi entry mới (do
  // streamResponse append) tự nhận id/timestamp tươi.
  const messages: Message[] = useMemo(() => {
    return hookMessages.map((m, i) => {
      let meta = metaRef.current[i];
      if (!meta) {
        meta = { id: makeMessageId(), timestamp: Date.now() };
        metaRef.current[i] = meta;
      }
      return {
        id: meta.id,
        role: m.role as MessageRole,
        content: m.content,
        timestamp: meta.timestamp,
        status: i === hookMessages.length - 1 && isStreaming && m.role === "assistant"
          ? ("pending" as const)
          : ("complete" as const),
      };
    });
  }, [hookMessages, isStreaming]);

  // Đồng bộ độ dài metaRef khi mảng hook bị thu nhỏ (ví dụ user xoá hội
  // thoại). Đặt trong effect để không gây side-effect ở render path khi
  // tính `messages` ở trên.
  useEffect(() => {
    if (metaRef.current.length > hookMessages.length) {
      metaRef.current.length = hookMessages.length;
    }
  }, [hookMessages.length]);

  // Persist sau mỗi khi state ổn định (không streaming) — tránh thrashing
  // localStorage trên từng token. Bỏ qua nếu hệ runtime không có
  // localStorage (SSR / private mode handled bên trong saveMessages).
  useEffect(() => {
    if (isStreaming) return;
    saveMessages(messages);
  }, [messages, isStreaming]);

  // ---------------------------------------------------------------------
  // Composer state.
  // ---------------------------------------------------------------------
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ---------------------------------------------------------------------
  // Auto-scroll + "Tin nhắn mới ↓" button (Requirement 13.4).
  // ---------------------------------------------------------------------
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isAtBottomRef = useRef(true);
  const [hasNewBelow, setHasNewBelow] = useState(false);

  // Theo dõi vị trí cuộn để biết user có đang ở đáy không.
  useEffect(() => {
    const node = scrollContainerRef.current;
    if (!node) return;
    const onScroll = () => {
      const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
      isAtBottomRef.current = distance < SCROLL_BOTTOM_THRESHOLD_PX;
      if (isAtBottomRef.current) setHasNewBelow(false);
    };
    node.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => node.removeEventListener("scroll", onScroll);
  }, []);

  // Khi messages đổi: nếu user đang ở đáy thì cuộn xuống; nếu không, hiển
  // thị badge "Tin nhắn mới ↓".
  useEffect(() => {
    const node = scrollContainerRef.current;
    if (!node) return;
    if (isAtBottomRef.current) {
      node.scrollTop = node.scrollHeight;
    } else if (messages.length > 0) {
      setHasNewBelow(true);
    }
  }, [messages]);

  const scrollToBottom = () => {
    const node = scrollContainerRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
    setHasNewBelow(false);
    isAtBottomRef.current = true;
  };

  // ---------------------------------------------------------------------
  // Tick `now` mỗi 30s để cập nhật relative time hiển thị trong bubble.
  // ---------------------------------------------------------------------
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // ---------------------------------------------------------------------
  // Send / Stop handlers.
  // ---------------------------------------------------------------------
  const sendMessage = async (raw: string) => {
    const text = raw.trim();
    if (!text || isStreaming) return;

    // Gán meta cho user + placeholder assistant TRƯỚC khi gọi hook —
    // hook sẽ append đúng 2 entry vào hookMessages, ta đồng bộ index ngay.
    const baseLen = hookMessages.length;
    const userTs = Date.now();
    metaRef.current[baseLen] = { id: makeMessageId(), timestamp: userTs };
    metaRef.current[baseLen + 1] = {
      id: makeMessageId(),
      timestamp: userTs + 1,
    };

    setInput("");
    // Cuộn xuống ngay khi user bấm gửi — UX kỳ vọng tin của mình hiện ở đáy.
    isAtBottomRef.current = true;

    const controller = new AbortController();
    abortControllerRef.current = controller;
    try {
      await streamResponse(
        AI_INTERPRET_ENDPOINT,
        buildRequestBody(text),
        controller.signal,
      );
    } finally {
      // Dù stream xong bình thường hay bị abort, đều nhả AbortController
      // để dispatcher Clerk + GC dọn dẹp.
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
    }
  };

  const stopStreaming = () => {
    abortControllerRef.current?.abort();
  };

  const clearConversation = () => {
    setHookMessages([]);
    metaRef.current = [];
    saveMessages([]);
    isAtBottomRef.current = true;
    setHasNewBelow(false);
  };

  const handleSuggestion = (q: string) => {
    setInput(q);
    // Focus textarea để user chỉnh sửa nếu cần (Requirement 13.5).
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  // ---------------------------------------------------------------------
  // Composer: Enter gửi, Shift+Enter xuống dòng (Requirement 13.6).
  // ---------------------------------------------------------------------
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void sendMessage(input);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />

      <div className="container mx-auto px-4 pt-20">
        <Breadcrumb />
      </div>

      <div className="container mx-auto flex-1 flex flex-col px-4 pb-4 pt-4 max-w-4xl w-full min-h-0">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary">Trợ Lý Huyền Học AI</h1>
            <p className="text-sm text-muted-foreground">
              Đặt câu hỏi về thần số học, kinh dịch, lá số bát tự, tử vi hay vận
              mệnh — phản hồi theo thời gian thực.
            </p>
          </div>
          {hasMessages ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearConversation}
              aria-label="Xoá toàn bộ hội thoại"
              disabled={isStreaming}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Xoá hội thoại</span>
            </Button>
          ) : null}
        </header>

        {/* ------------------------------------------------------------- */}
        {/* Banner "Mất kết nối — đang thử lại…" (Requirement 5.6).        */}
        {/* ------------------------------------------------------------- */}
        {connectionStatus === "reconnecting" ? (
          <div
            role="status"
            aria-live="polite"
            data-testid="ai-chat-reconnecting-banner"
            className={cn(
              "mb-3 flex items-center gap-2 rounded-md border px-3 py-2 text-sm",
              "border-destructive/40 bg-destructive/10 text-destructive-foreground",
            )}
          >
            <WifiOff aria-hidden="true" className="size-4 shrink-0" />
            <span>{ERROR_MESSAGES.network_lost_during_stream}</span>
          </div>
        ) : null}

        {/* ------------------------------------------------------------- */}
        {/* Chat log — `<ul role="log">` (Requirement 13.1)                */}
        {/* ------------------------------------------------------------- */}
        <div
          ref={scrollContainerRef}
          className="relative flex-1 min-h-0 overflow-y-auto rounded-lg border border-border/40 bg-card/30 p-4 md:p-6"
        >
          {!hasMessages ? (
            <SuggestionGrid onPick={handleSuggestion} disabled={isStreaming} />
          ) : (
            <ul
              role="log"
              aria-live="polite"
              aria-label="Lịch sử hội thoại với trợ lý AI"
              className="flex flex-col gap-4"
            >
              {messages.map((msg, idx) => (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  now={now}
                  isLatestStreamingAssistant={
                    idx === messages.length - 1 &&
                    isStreaming &&
                    msg.role === "assistant"
                  }
                />
              ))}
            </ul>
          )}

          {/* ErrorState cho HTTP 429 rate-limit (Requirement 5.5) */}
          {rateLimitError ? (
            <div className="mt-4">
              <ErrorState
                status="429"
                retryAfterSeconds={rateLimitError.retryAfterSeconds}
                onRetry={() => {
                  clearRateLimitError();
                  // Re-send the last user message if available
                  const lastUserMsg = messages.filter((m) => m.role === "user").pop();
                  if (lastUserMsg) {
                    void sendMessage(lastUserMsg.content);
                  }
                }}
              />
            </div>
          ) : null}

          {hasNewBelow ? (
            <button
              type="button"
              onClick={scrollToBottom}
              className="sticky bottom-2 left-1/2 z-10 -translate-x-1/2 inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background/90 px-4 py-2 text-xs font-medium text-primary shadow-sm backdrop-blur-md hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <ArrowDown className="size-3" aria-hidden="true" />
              Tin nhắn mới
            </button>
          ) : null}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* Suggestion chips trên ô input (Requirement 13.5)               */}
        {/* ------------------------------------------------------------- */}
        <SuggestionChips
          questions={SUGGESTED_QUESTIONS}
          onPick={handleSuggestion}
          disabled={isStreaming}
        />

        {/* ------------------------------------------------------------- */}
        {/* Composer — Enter gửi, Shift+Enter xuống dòng (Req 13.6)        */}
        {/* ------------------------------------------------------------- */}
        <form onSubmit={handleSubmit} className="mt-3 flex items-end gap-2">
          <label htmlFor="ai-chat-input" className="sr-only">
            Tin nhắn cho trợ lý AI
          </label>
          <Textarea
            id="ai-chat-input"
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi về vận mệnh, thần số học, kinh dịch... (Enter gửi, Shift+Enter xuống dòng)"
            rows={2}
            className="flex-1 resize-none"
            disabled={isStreaming}
            aria-describedby="ai-chat-input-help"
          />
          <span id="ai-chat-input-help" className="sr-only">
            Nhấn Enter để gửi, Shift+Enter để xuống dòng.
          </span>
          {isStreaming ? (
            <Button
              type="button"
              variant="destructive"
              size="default"
              onClick={stopStreaming}
              aria-label="Dừng phản hồi đang stream"
            >
              <Square className="size-4" aria-hidden="true" />
              Dừng
            </Button>
          ) : (
            <Button
              type="submit"
              size="default"
              disabled={!input.trim()}
              aria-label="Gửi tin nhắn"
            >
              <Send className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Gửi</span>
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}

// =====================================================================
// Sub-components
// =====================================================================

interface ChatBubbleProps {
  message: Message;
  now: number;
  isLatestStreamingAssistant: boolean;
}

/**
 * Một bubble trong `<ul role="log">`. User căn phải nền `--secondary`;
 * AI căn trái nền `--card`. Timestamp tương đối + tooltip ngày-giờ
 * đầy đủ (Requirement 13.2). Khi `isLatestStreamingAssistant=true` và
 * content rỗng, hiển thị 3 chấm pulse (Requirement 13.3 / 5.3).
 */
function ChatBubble({
  message,
  now,
  isLatestStreamingAssistant,
}: ChatBubbleProps) {
  const isUser = message.role === "user";
  const showTypingIndicator =
    isLatestStreamingAssistant && message.content.length === 0;
  const relative = formatRelativeTime(message.timestamp, now);
  const full = formatFullDateTime(message.timestamp);

  return (
    <li
      role="listitem"
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "flex max-w-[88%] flex-col gap-1",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-lg border px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "rounded-tr-sm bg-secondary text-secondary-foreground border-secondary-border"
              : "rounded-tl-sm bg-card text-card-foreground border-border/60",
          )}
        >
          {showTypingIndicator ? (
            <TypingIndicator />
          ) : isUser ? (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded"
              aria-label={`Gửi lúc ${full}`}
            >
              <time dateTime={new Date(message.timestamp).toISOString()}>
                {relative}
              </time>
            </button>
          </TooltipTrigger>
          <TooltipContent side={isUser ? "left" : "right"}>{full}</TooltipContent>
        </Tooltip>
      </div>
    </li>
  );
}

/**
 * Typing indicator — 3 chấm pulse cách nhau 150ms (Requirement 13.3).
 * `aria-label` tiếng Việt để screen reader đọc trạng thái đang suy nghĩ.
 */
function TypingIndicator() {
  return (
    <div
      className="flex items-center gap-1 py-1"
      role="status"
      aria-label="Đang suy nghĩ"
    >
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1.5 rounded-full bg-primary/70 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
          aria-hidden="true"
        />
      ))}
      <span className="ml-2 text-xs text-muted-foreground">Đang suy nghĩ…</span>
    </div>
  );
}

interface SuggestionChipsProps {
  questions: readonly string[];
  onPick: (q: string) => void;
  disabled: boolean;
}

/**
 * 14 chip gợi ý cuốn ngang phía trên ô input. Sử dụng overflow-x-auto
 * vì spec cho phép trên thanh chip dạng track (Requirement 4.7 ngoại lệ
 * cho thanh dài hữu hạn). Mỗi chip cao tối thiểu 40px → đảm bảo tap
 * target nhưng không chiếm chiều cao (Requirement 4.3 áp cho composer).
 */
function SuggestionChips({ questions, onPick, disabled }: SuggestionChipsProps) {
  return (
    <div
      className="mt-3 flex gap-2 overflow-x-auto pb-1"
      role="group"
      aria-label="Câu hỏi gợi ý"
    >
      {questions.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => onPick(q)}
          disabled={disabled}
          className="shrink-0 rounded-full border border-border/60 bg-card/40 px-3 py-2 text-xs text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {q}
        </button>
      ))}
    </div>
  );
}

interface SuggestionGridProps {
  onPick: (q: string) => void;
  disabled: boolean;
}

/**
 * Hero gợi ý hiển thị khi hội thoại trống — 14 câu hỏi xếp theo grid 2
 * cột (sm+) / 1 cột (mobile) cho user mới chưa biết bắt đầu từ đâu.
 */
function SuggestionGrid({ onPick, disabled }: SuggestionGridProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 border border-primary/30">
          <Sparkles className="size-5 text-primary" aria-hidden="true" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          Bắt đầu một câu hỏi
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Chọn một gợi ý phía dưới hoặc tự gõ câu hỏi vào ô bên dưới. Hội
          thoại sẽ được lưu trên thiết bị của bạn.
        </p>
      </div>
      <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
        {SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onPick(q)}
            disabled={disabled}
            className="rounded-lg border border-border/60 bg-card/40 px-4 py-3 text-left text-sm text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
