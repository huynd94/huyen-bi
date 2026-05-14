import * as React from "react"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"

import { cn } from "@/lib/utils"

/**
 * ScrollArea — wrapper `@radix-ui/react-scroll-area` Root, render
 * vùng cuộn với scrollbar tuỳ biến nhưng vẫn giữ a11y native.
 *
 * Mục đích: thay thế scrollbar mặc định của hệ điều hành bằng
 * scrollbar có style đồng nhất giữa các nền tảng (ví dụ: list lá số,
 * panel chi tiết sao). Ẩn scrollbar khi không hover, fade-in mượt khi
 * cuộn — tự dùng `<div>` có `overflow-auto` ở bên trong nên bàn phím
 * (`PageUp`/`PageDown`/`Home`/`End`) và scroll wheel/touch hoạt động
 * như native.
 *
 * Props: kế thừa props của Radix Root — `type` (`"auto" | "always" |
 * "scroll" | "hover"`, mặc định `"hover"`), `scrollHideDelay`, `dir`.
 *
 * Lưu ý a11y: KHÔNG đặt `tabIndex` thủ công lên Viewport — Radix tự
 * xử lý focus và scroll-into-view. Khi nội dung dài, cân nhắc thêm
 * `aria-label` để screen reader hiểu vùng cuộn (ví dụ: "Danh sách
 * lá số gần đây").
 *
 * @example
 * ```tsx
 * <ScrollArea className="h-72 w-48 rounded-md border">
 *   <div className="p-4">
 *     {items.map((item) => (
 *       <div key={item.id} className="text-sm">{item.name}</div>
 *     ))}
 *   </div>
 * </ScrollArea>
 * ```
 */
const ScrollArea = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn("relative overflow-hidden", className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName

/**
 * ScrollBar — thanh cuộn tuỳ biến của {@link ScrollArea}. Mặc định
 * orientation `"vertical"` (cột bên phải), có thể đổi thành
 * `"horizontal"` (hàng dưới) khi nội dung tràn ngang.
 *
 * Hỗ trợ kéo thumb để cuộn, click vào track để nhảy trang.
 * `touch-none select-none` để không làm gián đoạn touch-scroll trên
 * mobile. Khi {@link ScrollArea} có cả vertical và horizontal, render
 * 2 `ScrollBar` riêng và Radix tự render `Corner` ở góc giao.
 */
const ScrollBar = React.forwardRef<
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = "vertical", ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      "flex touch-none select-none transition-colors",
      orientation === "vertical" &&
        "h-full w-2.5 border-l border-l-transparent p-[1px]",
      orientation === "horizontal" &&
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName

export { ScrollArea, ScrollBar }
