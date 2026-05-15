import * as React from "react"
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/**
 * Alert Dialog — wrapper trực tiếp `@radix-ui/react-alert-dialog` Root.
 *
 * Mục đích: dialog xác nhận cho hành động không thể hoàn tác (ví dụ:
 * xoá lá số, đăng xuất). Khác `Dialog` thông thường ở chỗ
 * Radix gắn `role="alertdialog"` và yêu cầu user phải tương tác
 * (xác nhận/huỷ) trước khi đóng — không đóng được khi click outside.
 *
 * Props: kế thừa props của Radix Root — `open`, `onOpenChange`,
 * `defaultOpen`.
 *
 * Lưu ý a11y: Radix tự bẫy focus và trả focus về trigger sau khi đóng.
 * Cặp Title/Description liên kết với content qua `aria-labelledby` /
 * `aria-describedby`.
 *
 * @example
 * ```tsx
 * <AlertDialog>
 *   <AlertDialogTrigger asChild>
 *     <Button variant="destructive">Xoá lá số</Button>
 *   </AlertDialogTrigger>
 *   <AlertDialogContent>
 *     <AlertDialogHeader>
 *       <AlertDialogTitle>Xoá lá số này?</AlertDialogTitle>
 *       <AlertDialogDescription>
 *         Hành động này không thể hoàn tác.
 *       </AlertDialogDescription>
 *     </AlertDialogHeader>
 *     <AlertDialogFooter>
 *       <AlertDialogCancel>Huỷ</AlertDialogCancel>
 *       <AlertDialogAction onClick={onDelete}>Xoá</AlertDialogAction>
 *     </AlertDialogFooter>
 *   </AlertDialogContent>
 * </AlertDialog>
 * ```
 */
const AlertDialog = AlertDialogPrimitive.Root

/** Trigger mở {@link AlertDialog}. Dùng `asChild` để render component tuỳ ý. */
const AlertDialogTrigger = AlertDialogPrimitive.Trigger

/** Portal render dialog vào cuối `<body>` để tránh stacking context. */
const AlertDialogPortal = AlertDialogPrimitive.Portal

/** Lớp phủ (overlay) tối nền khi dialog mở. */
const AlertDialogOverlay = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName

/**
 * Container chính của Alert Dialog. Tự động kèm Portal + Overlay,
 * focus trap, và animation slide-in từ giữa.
 *
 * Lưu ý a11y: bắt buộc lồng `<AlertDialogTitle>` và
 * `<AlertDialogDescription>` để Radix có target cho `aria-labelledby` /
 * `aria-describedby`.
 */
const AlertDialogContent = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>
>(({ className, ...props }, ref) => (
  <AlertDialogPortal>
    <AlertDialogOverlay />
    <AlertDialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    />
  </AlertDialogPortal>
))
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName

/** Phần header của dialog — chứa Title và Description. */
const AlertDialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

/**
 * Footer chứa cặp nút Cancel/Action. Trên mobile xếp dọc
 * (Cancel ở dưới), từ `sm:` trở lên xếp ngang về phải.
 */
const AlertDialogFooter = ({
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
AlertDialogFooter.displayName = "AlertDialogFooter"

/** Tiêu đề dialog. Liên kết với content qua `aria-labelledby` (Radix tự gắn). */
const AlertDialogTitle = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold", className)}
    {...props}
  />
))
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName

/** Mô tả ngắn — liên kết với content qua `aria-describedby` (Radix tự gắn). */
const AlertDialogDescription = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
AlertDialogDescription.displayName =
  AlertDialogPrimitive.Description.displayName

/**
 * Nút xác nhận hành động. Áp `buttonVariants()` mặc định (variant primary).
 * Click sẽ tự đóng dialog; gắn `onClick` để chạy hành động trước khi đóng.
 */
const AlertDialogAction = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Action>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Action
    ref={ref}
    className={cn(buttonVariants(), className)}
    {...props}
  />
))
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName

/**
 * Nút huỷ. Mặc định dùng `variant="outline"` để tách biệt thị giác
 * khỏi nút Action. `Esc` cũng kích hoạt nút Cancel theo a11y mặc định
 * của Radix.
 */
const AlertDialogCancel = React.forwardRef<
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>
>(({ className, ...props }, ref) => (
  <AlertDialogPrimitive.Cancel
    ref={ref}
    className={cn(
      buttonVariants({ variant: "outline" }),
      "mt-2 sm:mt-0",
      className
    )}
    {...props}
  />
))
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
}
