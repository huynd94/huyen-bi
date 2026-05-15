import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Dialog — wrapper trực tiếp của `@radix-ui/react-dialog` Root.
 *
 * Mục đích: hộp thoại modal cho các flow ngắn (form chỉnh sửa,
 * xác nhận, chi tiết item). Khác {@link AlertDialog} ở chỗ Dialog
 * thường có thể đóng bằng click outside / phím Esc và không yêu cầu
 * người dùng phải xác nhận.
 *
 * Props: kế thừa props của Radix Root — `open`, `onOpenChange`,
 * `defaultOpen`, `modal` (mặc định `true`).
 *
 * Lưu ý a11y: Radix tự bẫy focus, gắn `role="dialog"` /
 * `aria-modal="true"`, và trả focus về trigger sau khi đóng. Phải
 * lồng {@link DialogTitle} bên trong {@link DialogContent} —
 * nếu muốn ẩn tiêu đề về mặt thị giác, dùng class `sr-only`.
 *
 * @example
 * ```tsx
 * <Dialog>
 *   <DialogTrigger asChild>
 *     <Button>Chỉnh sửa lá số</Button>
 *   </DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>Chỉnh sửa lá số</DialogTitle>
 *       <DialogDescription>Cập nhật thông tin ngày sinh.</DialogDescription>
 *     </DialogHeader>
 *     <form>...</form>
 *     <DialogFooter>
 *       <DialogClose asChild><Button variant="outline">Huỷ</Button></DialogClose>
 *       <Button type="submit">Lưu</Button>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 * ```
 */
const Dialog = DialogPrimitive.Root

/** Trigger mở {@link Dialog}. Dùng `asChild` để render component tuỳ ý. */
const DialogTrigger = DialogPrimitive.Trigger

/** Portal render dialog vào cuối `<body>` để tránh stacking context. */
const DialogPortal = DialogPrimitive.Portal

/** Nút đóng dialog có thể đặt ở bất kỳ đâu trong nội dung. */
const DialogClose = DialogPrimitive.Close

/** Lớp phủ (overlay) tối nền khi dialog mở, fade in/out theo `data-state`. */
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

/**
 * Container chính của dialog. Tự động kèm Portal + Overlay, focus
 * trap, animation slide-in/zoom từ giữa, và nút "X" đóng ở góc trên
 * phải (có `<span class="sr-only">Close</span>` cho screen reader).
 *
 * Lưu ý a11y: bắt buộc lồng {@link DialogTitle}; cân nhắc thêm
 * {@link DialogDescription} để Radix có target cho `aria-describedby`.
 */
const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

/** Phần header của dialog — chứa Title và Description. */
const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

/**
 * Footer chứa action buttons (Lưu/Huỷ). Trên mobile xếp dọc
 * (button đầu tiên ở dưới do `flex-col-reverse`), từ `sm:` trở lên
 * xếp ngang về phải.
 */
const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

/** Tiêu đề dialog. Liên kết với content qua `aria-labelledby` (Radix tự gắn). */
const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

/** Mô tả ngắn — liên kết với content qua `aria-describedby` (Radix tự gắn). */
const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
