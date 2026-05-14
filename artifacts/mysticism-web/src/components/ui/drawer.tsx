import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

/**
 * Drawer — wrapper trên thư viện `vaul` cho drawer kéo từ dưới lên.
 *
 * Mục đích: bottom sheet di động dùng cho chọn lựa nhanh, form ngắn,
 * hoặc menu phụ trên mobile. Hỗ trợ kéo (drag) để đóng và scale
 * background để tạo cảm giác chiều sâu.
 *
 * Props:
 * - `shouldScaleBackground` (mặc định `true`): co nhỏ trang chính khi
 *   drawer mở để có hiệu ứng chiều sâu (chỉ hoạt động khi
 *   `<body data-vaul-drawer-wrapper>` được set).
 * - Kế thừa toàn bộ props của `vaul` Root — `open`, `onOpenChange`,
 *   `defaultOpen`, `dismissible`, `snapPoints`, `modal`,...
 *
 * Lưu ý a11y: vaul tự gắn `role="dialog"`, focus trap, và đóng bằng
 * Esc. Cần lồng {@link DrawerTitle} cho screen reader (dùng `sr-only`
 * nếu muốn ẩn thị giác). Drag-to-dismiss tôn trọng
 * `prefers-reduced-motion`.
 *
 * @example
 * ```tsx
 * <Drawer>
 *   <DrawerTrigger asChild><Button>Mở menu</Button></DrawerTrigger>
 *   <DrawerContent>
 *     <DrawerHeader>
 *       <DrawerTitle>Chọn loại bói</DrawerTitle>
 *       <DrawerDescription>Chọn một loại bói để tiếp tục.</DrawerDescription>
 *     </DrawerHeader>
 *     <div className="p-4">...</div>
 *     <DrawerFooter>
 *       <DrawerClose asChild><Button variant="outline">Huỷ</Button></DrawerClose>
 *     </DrawerFooter>
 *   </DrawerContent>
 * </Drawer>
 * ```
 */
const Drawer = ({
  shouldScaleBackground = true,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    {...props}
  />
)
Drawer.displayName = "Drawer"

/** Trigger mở {@link Drawer}. Dùng `asChild` để render component tuỳ ý. */
const DrawerTrigger = DrawerPrimitive.Trigger

/** Portal render drawer vào cuối `<body>` để tránh stacking context. */
const DrawerPortal = DrawerPrimitive.Portal

/** Nút đóng drawer có thể đặt ở bất kỳ đâu trong nội dung. */
const DrawerClose = DrawerPrimitive.Close

/** Lớp phủ (overlay) tối nền khi drawer mở. */
const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
))
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName

/**
 * Container chính của drawer. Tự kèm Portal + Overlay và một thanh
 * "grab handle" nhỏ ở trên cùng để gợi ý có thể kéo để đóng.
 *
 * Lưu ý a11y: bắt buộc lồng {@link DrawerTitle}. Mặc định pin xuống
 * cạnh dưới (`bottom-0`), bo góc trên `rounded-t-[10px]`.
 */
const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DrawerPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",
        className
      )}
      {...props}
    >
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />
      {children}
    </DrawerPrimitive.Content>
  </DrawerPortal>
))
DrawerContent.displayName = "DrawerContent"

/** Phần header của drawer — chứa Title và Description, padding `p-4`. */
const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}
    {...props}
  />
)
DrawerHeader.displayName = "DrawerHeader"

/**
 * Footer chứa action buttons. Mặc định xếp dọc (`flex-col`) hợp với
 * tay đặt ngón cái trên mobile; `mt-auto` đẩy footer xuống đáy khi
 * content ngắn.
 */
const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}
    {...props}
  />
)
DrawerFooter.displayName = "DrawerFooter"

/** Tiêu đề drawer. Liên kết với content qua `aria-labelledby` (vaul tự gắn). */
const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
DrawerTitle.displayName = DrawerPrimitive.Title.displayName

/** Mô tả ngắn — liên kết với content qua `aria-describedby` (vaul tự gắn). */
const DrawerDescription = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DrawerDescription.displayName = DrawerPrimitive.Description.displayName

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
}
