import * as React from "react"
import * as ToastPrimitives from "@radix-ui/react-toast"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * ToastProvider — root của hệ toast (re-export `ToastPrimitives.Provider`).
 *
 * Mục đích: đặt một lần ở mức cao trong cây React để cung cấp context
 * điều phối hiển thị/ẩn toast. Mọi `Toast` con cần nằm trong provider này.
 *
 * Lưu ý a11y: Radix tự gắn `aria-live` cho viewport bên dưới (mặc định
 * `polite`), giúp screen reader thông báo nội dung toast khi xuất hiện.
 * Có thể tinh chỉnh `duration`, `swipeDirection` qua props của Radix.
 */
const ToastProvider = ToastPrimitives.Provider

/**
 * ToastViewport — vùng cố định trên màn hình hiển thị toast.
 *
 * Mục đích: chỉ định vị trí render danh sách toast (mặc định góc trên
 * mobile, góc phải-dưới desktop). Đặt một lần cùng `ToastProvider`.
 *
 * Lưu ý a11y: phần tử nhận `role="region"` và `aria-label` từ Radix; toast
 * con sẽ được thông báo với chế độ live region. Tránh đặt nhiều viewport
 * trùng vị trí gây overlap khó dùng cho người dùng bàn phím.
 */
const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default: "border bg-background text-foreground",
        destructive:
          "destructive group border-destructive bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Toast — một thông báo toast đơn lẻ (Radix `Toast.Root`).
 *
 * Mục đích: hiển thị thông báo ngắn (thành công/lỗi) tự ẩn sau khoảng
 * thời gian. Hỗ trợ `variant` `default` và `destructive` cho cảnh báo.
 *
 * Lưu ý a11y: Radix tự gán `role="status"`/`role="alert"` (tuỳ `type`),
 * người dùng có thể swipe ngang để dismiss; với bàn phím, `Escape` đóng
 * toast hoặc dùng `ToastClose`. Khi dùng `destructive`, dữ liệu nội dung
 * cần đủ ngữ cảnh — tránh chỉ dựa vào màu đỏ.
 *
 * @example
 * ```tsx
 * <ToastProvider>
 *   <Toast>
 *     <div className="grid gap-1">
 *       <ToastTitle>Đã lưu lá số</ToastTitle>
 *       <ToastDescription>Bạn có thể xem lại trong "Lịch sử".</ToastDescription>
 *     </div>
 *     <ToastAction altText="Mở lịch sử">Mở</ToastAction>
 *     <ToastClose />
 *   </Toast>
 *   <ToastViewport />
 * </ToastProvider>
 * ```
 */
const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), className)}
      {...props}
    />
  )
})
Toast.displayName = ToastPrimitives.Root.displayName

/**
 * ToastAction — nút hành động chính trong toast (ví dụ "Hoàn tác").
 *
 * Mục đích: cho phép người dùng phản ứng nhanh với toast mà không cần
 * mở dialog hay điều hướng trang.
 *
 * Lưu ý a11y: Radix yêu cầu `altText` để cung cấp nhãn dự phòng cho
 * trợ năng (đọc khi trình bày dạng text-only). Đảm bảo nội dung nút và
 * `altText` mô tả chính xác hành động (ví dụ "Mở lịch sử lá số").
 */
const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
      className
    )}
    {...props}
  />
))
ToastAction.displayName = ToastPrimitives.Action.displayName

/**
 * ToastClose — nút đóng toast (icon X góc trên phải).
 *
 * Mục đích: cho phép người dùng chủ động đóng toast trước khi tự ẩn.
 *
 * Lưu ý a11y: nút chỉ chứa icon, nên Radix gán `aria-label` mặc định
 * (có thể override). Focus ring được thiết kế để hiển thị qua
 * `focus:ring-2`. Nút chỉ hiện rõ khi hover/focus trên toast cha
 * (`opacity-0` → `group-hover/focus:opacity-100`) — vẫn tab-focus được
 * cho người dùng bàn phím.
 */
const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
      className
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
))
ToastClose.displayName = ToastPrimitives.Close.displayName

/**
 * ToastTitle — tiêu đề ngắn của toast.
 *
 * Mục đích: dòng text chính tóm tắt nội dung thông báo.
 *
 * Lưu ý a11y: Radix render với `<div>` mang ngữ nghĩa "title" của toast;
 * khi toast được announce qua live region, title được đọc trước description.
 */
const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn("text-sm font-semibold", className)}
    {...props}
  />
))
ToastTitle.displayName = ToastPrimitives.Title.displayName

/**
 * ToastDescription — mô tả phụ của toast.
 *
 * Mục đích: cung cấp chi tiết thêm hoặc ngữ cảnh hành động dưới `ToastTitle`.
 *
 * Lưu ý a11y: được liên kết với toast root như description; screen reader
 * đọc sau title. Giữ nội dung ngắn để toast tự ẩn vẫn đủ thời gian đọc.
 */
const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn("text-sm opacity-90", className)}
    {...props}
  />
))
ToastDescription.displayName = ToastPrimitives.Description.displayName

/**
 * ToastProps — kiểu props của `Toast`, để dùng khi viết hook `useToast`
 * hoặc utility tạo toast theo style chuẩn của dự án.
 */
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>

/**
 * ToastActionElement — kiểu của một React element `ToastAction`, dùng
 * khi truyền action như tham số trong API tạo toast.
 */
type ToastActionElement = React.ReactElement<typeof ToastAction>

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
}
