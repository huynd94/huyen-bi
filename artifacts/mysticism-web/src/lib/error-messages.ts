/**
 * Centralised Vietnamese error / status microcopy for the UX/UI upgrade.
 *
 * The shape is the one defined verbatim in `.kiro/specs/ux-ui-upgrade/design.md`
 * → "Thông điệp tiếng Việt chuẩn". Components (ErrorState, OfflineBanner,
 * sonner toasts, AuthRequiredDialog, DeleteConfirmDialog, fetchWithTimeout,
 * useAiSseChat, react-hook-form resolvers, …) MUST import from here instead
 * of inlining strings so that microcopy stays consistent in tone, formatting
 * and Vietnamese diacritics.
 *
 * Voice & tone (Requirements 19.1, 19.2, 19.3):
 *   - Tiếng Việt có dấu, sentence case, formal-warm, ngôi xưng "bạn".
 *   - Acronyms (AI, PDF, PNG, TXT) viết hoa; tên thương hiệu giữ nguyên.
 *
 * Requirements coverage:
 *   - 5.4   — generic 4xx/5xx error copy (`server_error`, `client_error`)
 *   - 5.5   — AI rate-limit copy with `Retry-After` minutes (`rate_limit`)
 *   - 6.1   — required field validation (`validation.required`)
 *   - 6.2   — specific input constraint copy (date / year / hour / phone)
 *   - 18.1  — offline banner copy (`network_offline`)
 *   - 19.1  — Vietnamese-with-diacritics surface copy
 *   - 19.2  — formal-warm tone, "bạn" addressing
 *
 * Related design rows:
 *   - "Network 4xx (validation, auth)"            → `client_error`
 *   - "Network 5xx (server)"                      → `server_error`
 *   - "Network 429 (rate-limit AI)"               → `rate_limit(mins)`
 *   - "Mất kết nối khi đang stream AI"            → `network_lost_during_stream`
 *   - "Mạng offline (toàn cục)"                   → `network_offline`
 *   - "Reconnect"                                 → `network_reconnected`
 *   - "Fetch timeout (≥ 30s)"                     → `timeout`
 *   - "Save reading khi unauth"                   → `unauth_save`
 *   - "Delete reading"                            → `delete_irreversible`
 *   - "Clipboard write fail"                      → `clipboard_fail`
 *   - "Validation form (client)"                  → `validation.*`
 */
export const ERROR_MESSAGES = {
  /** Banner sticky khi mất kết nối mạng toàn cục. Requirement 18.1. */
  network_offline:
    "Bạn đang offline. Một số tính năng tạm thời không khả dụng.",
  /** Inline cảnh báo khi SSE stream bị ngắt giữa chừng (auto-retry). */
  network_lost_during_stream: "Mất kết nối — đang thử lại…",
  /** Toast hiển thị ≤ 4s khi network trở lại online. */
  network_reconnected: "Đã kết nối lại",
  /**
   * Thông điệp HTTP 429 cho AI streaming. Tham số `mins` được tính bằng
   * `Math.ceil(parseRetryAfter(header) / 60)` từ header `Retry-After`.
   * Requirement 5.5.
   */
  rate_limit: (mins: number) =>
    `Đã đạt giới hạn lượt gọi AI. Vui lòng thử lại sau ${mins} phút.`,
  /** Lỗi server 5xx. Requirement 5.4. */
  server_error: "Đã có lỗi từ máy chủ. Vui lòng thử lại sau ít phút.",
  /** Lỗi client 4xx (trừ 401/429 — xử lý riêng). Requirement 5.4. */
  client_error: "Yêu cầu chưa hợp lệ. Vui lòng kiểm tra lại thông tin.",
  /** Fetch timeout ≥ 30s sau khi `AbortController` hoàn tất huỷ. */
  timeout: "Hết thời gian chờ. Vui lòng thử lại.",
  /** Dialog khi nhấn "Lưu lá số" mà chưa đăng nhập. */
  unauth_save: "Bạn cần đăng nhập để lưu lá số.",
  /** Dòng cảnh báo trong dialog xác nhận xoá lá số. */
  delete_irreversible: "Thao tác xoá không thể hoàn tác. Bạn chắc chắn?",
  /** Toast khi `navigator.clipboard.writeText` từ chối / không khả dụng. */
  clipboard_fail: "Không thể sao chép. Hãy chọn và sao chép thủ công.",
  /**
   * Microcopy cho validation phía client (react-hook-form / zod).
   * Bám đúng các ràng buộc ở Requirement 6.1 và 6.2.
   */
  validation: {
    /** Trường bắt buộc bị bỏ trống (Requirement 6.1). */
    required: "Vui lòng nhập trường này",
    /** Ngày không đúng định dạng `dd/MM/yyyy` hoặc không tồn tại. */
    invalidDate: "Ngày không hợp lệ (định dạng dd/MM/yyyy)",
    /** Năm nằm ngoài khoảng [1900, 2100] (Requirement 6.2). */
    yearRange: "Năm phải trong khoảng 1900–2100",
    /** Giờ nằm ngoài khoảng [0, 23] (Requirement 6.2). */
    hourRange: "Giờ phải trong khoảng 0–23",
    /** Số điện thoại < 10 chữ số (Requirement 6.2). */
    phoneLength: "Số điện thoại phải có ít nhất 10 chữ số",
  },
} as const;

/**
 * Type tiện ích để consumer reference đúng key cố định, ví dụ:
 * `key: ErrorMessageKey` thay vì `key: string`.
 */
export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;

/**
 * Type tiện ích cho key con bên trong `ERROR_MESSAGES.validation`.
 */
export type ValidationMessageKey = keyof typeof ERROR_MESSAGES.validation;
