import * as React from "react"

import { cn } from "@/lib/utils"
import { ERROR_MESSAGES } from "@/lib/error-messages"

/**
 * Mã trạng thái mà {@link ErrorState} biết cách hiển thị mặc định.
 *
 * - `"4xx"` — lỗi client thông thường (validation, không tìm thấy, …).
 * - `"5xx"` — lỗi máy chủ.
 * - `"429"` — biến thể `rate-limit` cho luồng AI streaming.
 * - `"network"` — mất kết nối / offline / fetch không thể tới máy chủ.
 *
 * Mã không nằm trong tập này có thể truyền dưới dạng số nguyên `[400, 599]`
 * và được phân loại theo tầng trăm.
 */
export type ErrorStateStatus = "4xx" | "5xx" | "429" | "network" | number

/**
 * Props cho {@link ErrorState}.
 *
 * `title` và `description` chỉ là override; nếu không cấp, component dùng
 * microcopy chuẩn từ `src/lib/error-messages.ts` (Requirements 19.1, 19.2).
 */
export interface ErrorStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title" | "role"> {
  /**
   * Mã trạng thái lỗi. Quyết định microcopy mặc định và biến thể `rate-limit`.
   * Khi truyền số, mọi giá trị `≥ 500` ánh xạ sang `"5xx"`,
   * `=== 429` sang `"429"`, còn lại trong `[400, 599]` sang `"4xx"`.
   */
  status: ErrorStateStatus
  /**
   * Tiêu đề tiếng Việt override mặc định. Render trong `<h2>` có `tabIndex={-1}`
   * và được focus khi component mount để trình đọc màn hình thông báo lỗi.
   */
  title?: string
  /**
   * Mô tả ngắn nguyên nhân lỗi. Override microcopy mặc định. Có thể là chuỗi
   * hoặc nội dung React tự do (ví dụ chứa `<code>` chi tiết lỗi).
   */
  description?: React.ReactNode
  /**
   * Callback gắn vào nút "Thử lại". Khi truyền, nút retry hiển thị; khi không
   * truyền, chỉ hiển thị liên kết "Về trang chủ".
   *
   * Theo Requirement 5.4, nút này SHOULD gọi lại cùng request đã thất bại.
   */
  onRetry?: () => void
  /**
   * Đích cho liên kết "Về trang chủ". Mặc định `"/"` (Requirement 5.4).
   * Render bằng thẻ `<a>` thuần để primitive không phụ thuộc router context.
   */
  homeHref?: string
  /**
   * Số giây từ header HTTP `Retry-After`. Chỉ dùng cho `status === "429"`
   * (hoặc `429`); component tính `Math.ceil(retryAfterSeconds / 60)` rồi
   * chèn vào microcopy `ERROR_MESSAGES.rate_limit(mins)` (Requirement 5.5).
   *
   * Giá trị `≤ 0` hoặc không xác định ánh xạ sang `1` phút (sàn UX).
   */
  retryAfterSeconds?: number
}

/**
 * Chuẩn hoá `status` về một trong bốn nhánh microcopy: `"4xx" | "5xx" |
 * "429" | "network"`. Mã số ngoài `[400, 599]` (ngoại trừ `0` được hiểu là
 * mạng không sẵn sàng) ánh xạ sang `"network"` để tránh hiển thị màn hình
 * trống khi stack network throw lỗi không có HTTP status.
 */
function normalizeStatus(
  status: ErrorStateStatus,
): "4xx" | "5xx" | "429" | "network" {
  if (typeof status === "string") return status
  if (!Number.isFinite(status)) return "network"
  if (status === 429) return "429"
  if (status >= 500 && status <= 599) return "5xx"
  if (status >= 400 && status <= 499) return "4xx"
  return "network"
}

/**
 * Tính số phút hiển thị trong microcopy `rate-limit`.
 *
 * `Math.ceil(retryAfterSeconds / 60)` để luôn làm tròn lên (ví dụ 61 giây →
 * 2 phút) và clamp tối thiểu `1` phút để không hiển thị "0 phút".
 */
function computeRateLimitMinutes(retryAfterSeconds: number | undefined): number {
  if (retryAfterSeconds == null || !Number.isFinite(retryAfterSeconds)) return 1
  if (retryAfterSeconds <= 0) return 1
  return Math.max(1, Math.ceil(retryAfterSeconds / 60))
}

/**
 * Tiêu đề và mô tả tiếng Việt mặc định cho từng nhánh status.
 * Tách riêng để property test (Property 15) có thể assert một cách ổn định.
 */
function defaultCopy(
  status: "4xx" | "5xx" | "429" | "network",
  retryAfterSeconds: number | undefined,
): { title: string; description: string } {
  switch (status) {
    case "429": {
      const mins = computeRateLimitMinutes(retryAfterSeconds)
      return {
        title: "Đã đạt giới hạn lượt gọi AI",
        description: ERROR_MESSAGES.rate_limit(mins),
      }
    }
    case "5xx":
      return {
        title: "Đã có lỗi từ máy chủ",
        description: ERROR_MESSAGES.server_error,
      }
    case "4xx":
      return {
        title: "Yêu cầu chưa hợp lệ",
        description: ERROR_MESSAGES.client_error,
      }
    case "network":
    default:
      return {
        title: "Không thể kết nối",
        description: ERROR_MESSAGES.network_offline,
      }
  }
}

/**
 * Trạng thái lỗi (Error State) hiển thị khi backend trả `4xx`/`5xx`/`429`
 * hoặc khi mạng mất kết nối. Theo Requirements 5.4, 5.5, 5.8, component:
 *
 * - Render `role="alert"` để trình đọc màn hình thông báo ngay lập tức.
 * - Focus tiêu đề `<h2 tabIndex={-1}>` khi mount để cursor SR đến nội dung lỗi.
 * - Hiển thị nút **Thử lại** khi `onRetry` được cấp (gọi lại cùng request).
 * - Hiển thị liên kết **Về trang chủ** (`homeHref`, mặc định `"/"`).
 * - Với `status === "429"` (hoặc `429`), hiển thị microcopy rate-limit kèm
 *   số phút tính bằng `ceil(retryAfterSeconds / 60)` (sàn 1 phút).
 *
 * Component không tự render icon mặc định để tránh ràng buộc một bộ icon cụ
 * thể; consumer có thể bọc `<ErrorState>` trong layout chứa icon `lucide-react`
 * tuỳ ý. Mọi class đều dùng design tokens — không hex, không spacing tuỳ ý.
 *
 * @example
 * ```tsx
 * <ErrorState
 *   status="5xx"
 *   onRetry={() => refetch()}
 * />
 *
 * <ErrorState
 *   status="429"
 *   retryAfterSeconds={185}
 *   onRetry={() => retryStream()}
 * />
 * // → "Đã đạt giới hạn lượt gọi AI. Vui lòng thử lại sau 4 phút."
 * ```
 *
 * Validates: Requirements 5.4, 5.5, 5.8.
 */
export const ErrorState = React.forwardRef<HTMLDivElement, ErrorStateProps>(
  (
    {
      status,
      title,
      description,
      onRetry,
      homeHref = "/",
      retryAfterSeconds,
      className,
      ...props
    },
    ref,
  ) => {
    const normalized = normalizeStatus(status)
    const fallback = defaultCopy(normalized, retryAfterSeconds)
    const resolvedTitle = title ?? fallback.title
    const resolvedDescription = description ?? fallback.description

    const headingRef = React.useRef<HTMLHeadingElement | null>(null)

    // Focus tiêu đề khi mount để screen reader đọc thông báo lỗi ngay; tránh
    // ép focus khi component re-render với cùng status để không "ngắt" cursor.
    React.useEffect(() => {
      headingRef.current?.focus()
    }, [normalized])

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="assertive"
        data-status={normalized}
        className={cn(
          "flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/40 bg-card p-6 text-center md:p-12",
          className,
        )}
        {...props}
      >
        <div className="flex max-w-md flex-col items-center gap-2">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-lg font-semibold leading-tight tracking-tight text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {resolvedTitle}
          </h2>
          {resolvedDescription ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {resolvedDescription}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-primary-border bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
            >
              Thử lại
            </button>
          ) : null}
          <a
            href={homeHref}
            className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-border bg-transparent px-4 py-2 text-sm font-medium text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    )
  },
)
ErrorState.displayName = "ErrorState"
