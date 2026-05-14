"use client"

import * as React from "react"
import * as SheetPrimitive from "@radix-ui/react-dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Sheet — wrapper trực tiếp của `@radix-ui/react-dialog` Root, render
 * như một panel trượt từ một trong bốn cạnh màn hình (top/right/bottom/left).
 *
 * Mục đích: panel phụ/side drawer cho navigation, filter, hoặc form
 * dài; khác {@link Dialog} ở chỗ Sheet pin vào cạnh màn hình thay vì
 * căn giữa, hợp với các flow phụ trợ không cần chiếm trọn vùng nhìn.
 *
 * Props: kế thừa props của Radix Dialog Root — `open`, `onOpenChange`,
 * `defaultOpen`, `modal` (mặc định `true`).
 *
 * Lưu ý a11y: Radix tự bẫy focus, gắn `role="dialog"` /
 * `aria-modal="true"`, đóng bằng `Esc`, và trả focus về trigger sau khi
 * đóng. Bắt buộc lồng {@link SheetTitle} bên trong {@link SheetContent}
 * — dùng `sr-only` nếu muốn ẩn về mặt thị giác.
 *
 * @example
 * ```tsx
 * <Sheet>
 *   <SheetTrigger asChild>
 *     <Button variant="outline">Mở bộ lọc</Button>
 *   </SheetTrigger>
 *   <SheetContent side="right">
 *     <SheetHeader>
 *       <SheetTitle>Bộ lọc lá số</SheetTitle>
 *       <SheetDescription>Tinh chỉnh kết quả hiển thị.</SheetDescription>
 *     </SheetHeader>
 *     <div className="py-4">...</div>
 *     <SheetFooter>
 *       <SheetClose asChild><Button>Áp dụng</Button></SheetClose>
 *     </SheetFooter>
 *   </SheetContent>
 * </Sheet>
 * ```
 */
const Sheet = SheetPrimitive.Root

/** Trigger mở {@link Sheet}. Dùng `asChild` để render component tuỳ ý. */
const SheetTrigger = SheetPrimitive.Trigger

/** Nút đóng sheet — có thể đặt ở bất kỳ đâu trong nội dung. */
const SheetClose = SheetPrimitive.Close

/** Portal render sheet vào cuối `<body>` để tránh stacking context. */
const SheetPortal = SheetPrimitive.Portal

/** Lớp phủ (overlay) tối nền khi sheet mở, fade in/out theo `data-state`. */
const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
))
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName

const sheetVariants = cva(
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

/**
 * Container chính của sheet. Tự động kèm Portal + Overlay, focus trap,
 * animation slide-in/out từ cạnh tương ứng `side`, và nút "X" đóng ở
 * góc trên phải (kèm `<span class="sr-only">Close</span>` cho screen
 * reader).
 *
 * Props bổ sung:
 * - `side`: `"top" | "right" | "bottom" | "left"` (mặc định `"right"`)
 *   — chọn cạnh màn hình mà panel pin vào.
 *
 * Lưu ý a11y: bắt buộc lồng {@link SheetTitle}; cân nhắc thêm
 * {@link SheetDescription} để Radix có target cho `aria-describedby`.
 */
const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => (
  <SheetPortal>
    <SheetOverlay />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(sheetVariants({ side }), className)}
      {...props}
    >
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </SheetPrimitive.Close>
      {children}
    </SheetPrimitive.Content>
  </SheetPortal>
))
SheetContent.displayName = SheetPrimitive.Content.displayName

/** Phần header của sheet — chứa Title và Description. */
const SheetHeader = ({
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
SheetHeader.displayName = "SheetHeader"

/**
 * Footer chứa action buttons. Trên mobile xếp dọc (`flex-col-reverse`),
 * từ `sm:` trở lên xếp ngang về phải.
 */
const SheetFooter = ({
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
SheetFooter.displayName = "SheetFooter"

/** Tiêu đề sheet. Liên kết với content qua `aria-labelledby` (Radix tự gắn). */
const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
))
SheetTitle.displayName = SheetPrimitive.Title.displayName

/** Mô tả ngắn — liên kết với content qua `aria-describedby` (Radix tự gắn). */
const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
SheetDescription.displayName = SheetPrimitive.Description.displayName

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
