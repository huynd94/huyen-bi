import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

/**
 * Toaster cũ (radix-ui based) — render danh sách `toast` đến từ hook
 * {@link useToast}. Component được giữ lại để các trang chưa migrate
 * vẫn hoạt động; mã nguồn mới nên dùng wrapper `sonner` qua
 * `@/components/ui/sonner` và helper `showToast` ở `@/lib/toast`.
 *
 * Lưu ý a11y: bên trong `ToastProvider`, từng `<Toast>` đã gắn
 * `role="status"`/`role="alert"` tuỳ variant; `<ToastViewport>` được
 * focus-managed bởi Radix nên người dùng có thể `F6` để di chuyển vào
 * vùng toast.
 *
 * @example
 * ```tsx
 * // Trong root layout (chỉ mount một lần):
 * <Toaster />
 * ```
 */
export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
