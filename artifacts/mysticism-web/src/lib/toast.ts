import { toast as sonnerToast, type ExternalToast } from "sonner";

/**
 * Các biến thể toast được hỗ trợ.
 *
 * - `success`: thao tác thành công (lưu lá số, copy link, xuất file).
 * - `error`: lỗi cần người dùng chú ý; thường đi kèm `retry`.
 * - `info`: thông báo trung tính (đã kết nối lại, đã đăng xuất, …).
 * - `warning`: cảnh báo nhẹ (clipboard fail, tính năng giới hạn, …).
 *
 * Mapping trực tiếp sang các phương thức của `sonner`:
 * `toast.success`, `toast.error`, `toast.info`, `toast.warning`.
 */
export type ToastVariant = "success" | "error" | "info" | "warning";

/**
 * CTA "Thử lại" gắn vào toast (thường dùng cho variant `error`).
 *
 * Theo Requirement 19.3 (giọng điệu microcopy), `label` mặc định là
 * `"Thử lại"` — sentence case, không viết hoa toàn bộ. Người gọi có
 * thể override để phù hợp ngữ cảnh (ví dụ `"Tải lại"`, `"Đăng nhập"`).
 *
 * Khi có `retry`, wrapper truyền xuống sonner dưới dạng prop `action`,
 * giữ ARIA của nút action sonner (button có label).
 */
export interface ToastRetry {
  /** Nhãn nút CTA. Mặc định `"Thử lại"`. */
  label?: string;
  /** Handler khi người dùng click. */
  onClick: () => void;
}

/**
 * Tham số cho {@link showToast}.
 *
 * - `title` bắt buộc, viết bằng tiếng Việt sentence case (Req 19.3).
 * - `description` mô tả ngắn nguyên nhân hoặc bước tiếp theo; tối đa
 *   1–2 câu để toast vẫn vừa khung 4 giây mặc định.
 * - `retry` chỉ nên dùng cho variant `error` để đáp ứng Req 19.3
 *   ("CTA thử lại sau khi xảy ra lỗi"). Nếu truyền cho variant khác,
 *   wrapper vẫn forward — nhưng UX team không khuyến khích.
 * - `durationMs` tùy chỉnh thời lượng (ms). Bỏ trống dùng mặc định
 *   của Toaster (4000ms, theo Req 5.9).
 */
export interface ShowToastOptions {
  variant: ToastVariant;
  title: string;
  description?: string;
  retry?: ToastRetry;
  durationMs?: number;
}

/**
 * Mapping `variant -> sonner method`. Tách ra constant để giữ kiểu
 * tĩnh và tránh `switch` tại runtime.
 */
const VARIANT_TO_METHOD: Record<ToastVariant, typeof sonnerToast.success> = {
  success: sonnerToast.success,
  error: sonnerToast.error,
  info: sonnerToast.info,
  warning: sonnerToast.warning,
};

/** Nhãn mặc định cho CTA retry — giữ tiếng Việt sentence case. */
const DEFAULT_RETRY_LABEL = "Thử lại";

/**
 * Hiện một toast bằng `sonner` theo cấu hình của hệ thiết kế Huyền Bí.
 *
 * - Map `variant` sang `toast.success | toast.error | toast.info | toast.warning`.
 * - Khi truyền `retry`, gắn nút action gọi `retry.onClick` (Req 19.3 —
 *   surface CTA "Thử lại" sau khi lỗi xảy ra). Wrapper truyền nguyên
 *   `onClick` cho sonner mà không tự dismiss, để chính handler quyết
 *   định có muốn đóng toast hay không.
 * - `description` được render bên dưới `title` với class
 *   `text-muted-foreground` (theo `Toaster` config).
 * - Trả về `id` của toast (string|number) để consumer có thể gọi
 *   `dismiss(id)` qua API của `sonner` nếu cần.
 *
 * Phụ thuộc: component `<Toaster />` (sonner) phải đã mount ở root
 * (xem `App.tsx`). Nếu chưa mount, gọi hàm này không gây lỗi nhưng
 * toast sẽ không hiển thị.
 *
 * @example
 * // Toast thành công sau khi lưu lá số.
 * showToast({ variant: "success", title: "Đã lưu lá số" });
 *
 * @example
 * // Toast lỗi kèm CTA thử lại (Req 19.3).
 * showToast({
 *   variant: "error",
 *   title: "Không thể lưu lá số",
 *   description: "Vui lòng kiểm tra kết nối và thử lại.",
 *   retry: { onClick: () => saveReadingMutation.mutate() },
 * });
 */
export function showToast({
  variant,
  title,
  description,
  retry,
  durationMs,
}: ShowToastOptions): string | number {
  const method = VARIANT_TO_METHOD[variant];

  const data: ExternalToast = {};
  if (description !== undefined) {
    data.description = description;
  }
  if (durationMs !== undefined) {
    data.duration = durationMs;
  }
  if (retry) {
    data.action = {
      label: retry.label ?? DEFAULT_RETRY_LABEL,
      onClick: () => {
        retry.onClick();
      },
    };
  }

  return method(title, data);
}

/**
 * Đóng một toast đã hiển thị (hoặc tất cả nếu `id` không truyền).
 *
 * Đây là wrapper mỏng quanh `sonner.toast.dismiss` để consumer không
 * cần import trực tiếp từ `sonner`.
 *
 * @param id `id` trả về từ {@link showToast}. Bỏ trống để dismiss tất cả.
 */
export function dismissToast(id?: string | number): void {
  sonnerToast.dismiss(id);
}
