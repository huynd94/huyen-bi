/**
 * AI Chat persistence store.
 *
 * Cung cấp ba thao tác thuần đối với mảng tin nhắn AI chat:
 * - {@link loadMessages} đọc từ `localStorage["ai-chat-messages"]`,
 *   parse JSON, validate qua zod schema, drop entry hỏng và trả mảng
 *   thuần (`[]` khi không có hoặc bất hợp lệ).
 * - {@link saveMessages} stringify và persist (giới hạn
 *   {@link MAX_MESSAGES} entry gần nhất).
 * - {@link clearMessages} xoá khoá khỏi `localStorage`.
 *
 * Module thuần: không có side-effect ở phạm vi module (không đọc / ghi
 * `localStorage`, không lập listener khi import). Mọi I/O xảy ra trong
 * hàm xuất ra ngoài, đảm bảo unit test có thể stub `localStorage` mà
 * không cần reset module cache.
 *
 * Schema bắt buộc với mỗi tin nhắn:
 * `{ id: string; role: "user" | "assistant"; content: string;
 *    timestamp: number; status?: "pending" | "complete" | "error" }`.
 *
 * Validates: Requirements 13.8 (persist hội thoại AI round-trip qua
 * `localStorage` cho phiên unauth, đồng bộ qua API khi đăng nhập).
 *
 * @example
 * ```ts
 * import { loadMessages, saveMessages, type Message } from "@/lib/ai-chat-store";
 *
 * const history = loadMessages();
 * const next: Message[] = [...history, {
 *   id: crypto.randomUUID(),
 *   role: "user",
 *   content: "Số 7 mệnh gì?",
 *   timestamp: Date.now(),
 * }];
 * saveMessages(next);
 * ```
 *
 * @module
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Khoá `localStorage` chứa mảng tin nhắn AI chat. Cố định theo design
 * (`ai-chat-messages`) — đồng nhất với Requirement 13.8.
 */
export const STORAGE_KEY = "ai-chat-messages";

/**
 * Giới hạn số tin nhắn lưu trong `localStorage` để tránh phình
 * không kiểm soát (mỗi tin nhắn AI có thể dài hàng KB markdown).
 *
 * Khi `saveMessages` nhận mảng dài hơn `MAX_MESSAGES`, chỉ
 * **{@link MAX_MESSAGES} entry cuối cùng** được persist (mới nhất).
 */
export const MAX_MESSAGES = 200;

/**
 * Endpoint mặc định khi đẩy tin nhắn lên server cho user đã đăng nhập.
 *
 * Endpoint thực sẽ do backend cung cấp (Task 13.4 / 13.5); ở đây giữ
 * dưới dạng hằng số để consumer có thể override khi cần.
 */
export const DEFAULT_SYNC_ENDPOINT = "/api/ai-chat/sync";

// ---------------------------------------------------------------------------
// Schema & types
// ---------------------------------------------------------------------------

/**
 * Vai trò của một tin nhắn trong hội thoại AI chat.
 *
 * - `"user"` — tin nhắn do người dùng gửi (bubble căn phải, nền
 *   `--secondary`).
 * - `"assistant"` — tin nhắn do AI trả về (bubble căn trái, nền
 *   `--card`).
 *
 * Tham chiếu Requirement 13.1.
 */
export type MessageRole = "user" | "assistant";

/**
 * Trạng thái giao vận của một tin nhắn.
 *
 * - `"pending"` — đang stream / đang gửi; bubble hiển thị typing
 *   indicator (Requirement 13.3).
 * - `"complete"` — đã nhận đầy đủ, bubble render markdown.
 * - `"error"` — gửi/stream thất bại, UI có thể hiển thị nút retry.
 *
 * Trường này tuỳ chọn; tin nhắn không có `status` được coi như
 * `"complete"` (mặc định khi tải lịch sử cũ).
 */
export type MessageStatus = "pending" | "complete" | "error";

/**
 * Một tin nhắn AI chat đã chuẩn hoá.
 *
 * - `id`: định danh duy nhất phía client (ví dụ `crypto.randomUUID()`).
 * - `role`: vai trò người gửi (xem {@link MessageRole}).
 * - `content`: nội dung markdown thô — chuỗi rỗng hợp lệ (bubble
 *   placeholder trong giai đoạn streaming).
 * - `timestamp`: epoch milliseconds — số nguyên không âm.
 * - `status`: tuỳ chọn (xem {@link MessageStatus}).
 */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  status?: MessageStatus;
}

/**
 * Zod schema cho một {@link Message}. Dùng cho validation entry-by-entry
 * khi {@link loadMessages} parse dữ liệu từ `localStorage` (drop entry
 * hỏng thay vì throw để UX không bị chặn vì cache cũ).
 *
 * Schema yêu cầu `id` và `content` là string (cho phép rỗng), `role`
 * thuộc `{ "user", "assistant" }`, `timestamp` là số hữu hạn ≥ 0 và
 * `status` (tuỳ chọn) thuộc `{ "pending", "complete", "error" }`.
 */
const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number().int().nonnegative().finite(),
  status: z.enum(["pending", "complete", "error"]).optional(),
});

// ---------------------------------------------------------------------------
// Helpers (private)
// ---------------------------------------------------------------------------

/**
 * Lấy `localStorage` an toàn. Trả `null` khi runtime là môi trường
 * không có `window` (SSR, Node test) hoặc khi truy cập storage bị
 * chặn (private browsing throws `SecurityError`).
 */
function getStorage(): Storage | null {
  try {
    if (typeof globalThis === "undefined") return null;
    const ls = (globalThis as { localStorage?: Storage }).localStorage;
    return ls ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API: load / save / clear
// ---------------------------------------------------------------------------

/**
 * Đọc mảng tin nhắn AI chat từ `localStorage`.
 *
 * - Trả `[]` khi khoá chưa tồn tại, JSON parse fail, hoặc giá trị
 *   không phải mảng.
 * - Mỗi entry được validate qua zod; entry hỏng bị **drop** (giữ phần
 *   còn lại) thay vì throw — đảm bảo cache hỏng không khoá UX.
 *
 * Idempotent với {@link saveMessages}: với mọi mảng `messages` hợp lệ,
 * `loadMessages()` sau khi `saveMessages(messages)` trả về mảng deep-
 * equal `messages.slice(-MAX_MESSAGES)` (Property 19).
 */
export function loadMessages(): Message[] {
  const storage = getStorage();
  if (!storage) return [];

  let raw: string | null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return [];
  }
  if (raw == null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const result: Message[] = [];
  for (const entry of parsed) {
    const valid = messageSchema.safeParse(entry);
    if (valid.success) result.push(valid.data);
  }
  return result;
}

/**
 * Persist mảng tin nhắn vào `localStorage`.
 *
 * - Giữ tối đa {@link MAX_MESSAGES} entry **mới nhất** (cắt đầu mảng).
 * - Validate qua zod trước khi serialize: entry hỏng bị bỏ qua (cùng
 *   chính sách "drop, không throw" như {@link loadMessages}) để hành vi
 *   của round-trip ổn định.
 * - Bắt mọi exception (storage full, quota, browser private mode) và
 *   nuốt im lặng — caller không cần try/catch.
 */
export function saveMessages(messages: readonly Message[]): void {
  const storage = getStorage();
  if (!storage) return;

  const validated: Message[] = [];
  for (const entry of messages) {
    const valid = messageSchema.safeParse(entry);
    if (valid.success) validated.push(valid.data);
  }
  const trimmed =
    validated.length > MAX_MESSAGES
      ? validated.slice(validated.length - MAX_MESSAGES)
      : validated;

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage quota / private mode / iframe sandbox — ignore.
  }
}

/**
 * Xoá toàn bộ lịch sử AI chat khỏi `localStorage`. An toàn khi gọi
 * trên runtime không có `localStorage`.
 */
export function clearMessages(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Sync (server) API — stub
// ---------------------------------------------------------------------------

/**
 * Kết quả của một lần đồng bộ tin nhắn lên server.
 */
export interface SyncResult {
  /** `true` khi server xác nhận persist thành công. */
  ok: boolean;
  /** Mã HTTP cuối cùng (nếu có). */
  status?: number;
  /** Thông điệp tiếng Việt mô tả lý do thất bại (nếu có). */
  error?: string;
}

/**
 * Hợp đồng để đồng bộ tin nhắn với backend khi user đã đăng nhập.
 *
 * Implementation thực sẽ do task sau cung cấp (POST `/api/ai-chat/sync`).
 * Ở đây ta định nghĩa interface để hook {@link useAiChatStore} có thể
 * dependency-inject — vừa thuận tiện cho test (mock thuần) vừa cho
 * phép wire dần khi backend sẵn sàng.
 */
export type SyncMessages = (
  userId: string,
  messages: readonly Message[],
  signal?: AbortSignal,
) => Promise<SyncResult>;

/**
 * Stub mặc định cho {@link SyncMessages}.
 *
 * Chưa gọi backend (endpoint sẽ ráp ở task 13.4/13.5); trả `ok: true`
 * để hook hiện hữu không tự coi là lỗi. Khi backend sẵn sàng, thay stub
 * này bằng implementation thật hoặc inject qua tham số hook.
 */
export const stubSyncMessages: SyncMessages = async () => ({ ok: true });

// ---------------------------------------------------------------------------
// React hook
// ---------------------------------------------------------------------------

/**
 * Tham số cho {@link useAiChatStore}.
 */
export interface UseAiChatStoreOptions {
  /**
   * `userId` của người dùng đã đăng nhập (qua Clerk).
   *
   * - `null` / `undefined` ⇒ phiên chưa đăng nhập, hook chỉ dùng
   *   `localStorage`.
   * - Chuỗi không rỗng ⇒ hook gọi `sync` mỗi khi mảng tin nhắn thay
   *   đổi (debounced về dạng hợp lệ — chỉ sync sau khi state ổn định
   *   trong cùng tick render).
   */
  userId?: string | null;
  /**
   * Hàm đồng bộ tin nhắn với backend. Bỏ trống để dùng
   * {@link stubSyncMessages}.
   */
  sync?: SyncMessages;
}

/**
 * Giá trị hook {@link useAiChatStore} trả về.
 */
export interface UseAiChatStoreResult {
  /** Mảng tin nhắn hiện tại (đã hydrate từ `localStorage`). */
  messages: Message[];
  /**
   * Cập nhật mảng tin nhắn. Chấp nhận mảng mới hoặc updater function
   * (giống chữ ký của `useState`). Sau mỗi lần gọi:
   * - persist xuống `localStorage` qua {@link saveMessages}, và
   * - nếu `userId` được set, gọi `sync(userId, messages)` (best-effort,
   *   lỗi không throw lên UI).
   */
  setMessages: (next: Message[] | ((prev: Message[]) => Message[])) => void;
  /** Xoá toàn bộ lịch sử (cả state + storage). */
  clear: () => void;
}

/**
 * Hook phía React để đọc/ghi lịch sử AI chat với hai tier persist:
 *
 * 1. **`localStorage`** — luôn là source of truth phía client; hook
 *    initialise state từ {@link loadMessages} và lưu lại sau mỗi update.
 * 2. **Server sync** — khi `options.userId` được truyền (user đã đăng
 *    nhập qua Clerk), hook gọi `options.sync(userId, messages)` để đẩy
 *    bản sao lên backend. Lỗi sync **không** rollback state local.
 *
 * Hook không tự call `useUser()` để giữ bản thân nó độc lập với Clerk
 * — caller wire-up: `useAiChatStore({ userId: useUser().user?.id })`.
 *
 * @example
 * ```tsx
 * function ChatPage() {
 *   const { user } = useUser();
 *   const { messages, setMessages, clear } = useAiChatStore({
 *     userId: user?.id ?? null,
 *   });
 *   // ...
 * }
 * ```
 */
export function useAiChatStore(
  options: UseAiChatStoreOptions = {},
): UseAiChatStoreResult {
  const { userId = null, sync = stubSyncMessages } = options;

  // Initial state lazy: chỉ chạy `loadMessages` 1 lần ở mount đầu.
  const [messages, setMessagesState] = useState<Message[]>(() => loadMessages());

  // Đồng bộ ref với userId/sync hiện tại để effect dưới đọc giá trị
  // mới nhất mà không cần dependency trigger lại.
  const userIdRef = useRef(userId);
  const syncRef = useRef(sync);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);
  useEffect(() => {
    syncRef.current = sync;
  }, [sync]);

  // Bỏ qua lần effect đầu tiên để khỏi lưu chính giá trị vừa load.
  const isFirstSync = useRef(true);

  useEffect(() => {
    if (isFirstSync.current) {
      isFirstSync.current = false;
      return;
    }

    saveMessages(messages);

    const currentUserId = userIdRef.current;
    if (!currentUserId) return;

    const controller = new AbortController();
    void (async () => {
      try {
        await syncRef.current(currentUserId, messages, controller.signal);
      } catch {
        // Best-effort: lỗi sync không lan ra UI; localStorage đã giữ
        // state nên user vẫn không mất dữ liệu.
      }
    })();

    return () => {
      controller.abort();
    };
  }, [messages]);

  const setMessages = useCallback<UseAiChatStoreResult["setMessages"]>(
    (next) => {
      setMessagesState((prev) =>
        typeof next === "function"
          ? (next as (p: Message[]) => Message[])(prev)
          : next,
      );
    },
    [],
  );

  const clear = useCallback(() => {
    clearMessages();
    setMessagesState([]);
  }, []);

  return { messages, setMessages, clear };
}
