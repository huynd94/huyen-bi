import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils"

/**
 * HoverCard — wrapper Radix HoverCard Root.
 *
 * Mục đích: hiển thị card preview khi người dùng hover vào trigger
 * (giới thiệu lá bài, tooltip giàu nội dung, profile mini,...). Khác với
 * {@link Tooltip} ở chỗ HoverCard cho phép nội dung phong phú (ảnh,
 * link, button) và mở khi cả hover lẫn focus.
 *
 * Props: kế thừa props của `HoverCardPrimitive.Root` — `open`,
 * `defaultOpen`, `onOpenChange`, `openDelay`, `closeDelay`.
 *
 * Lưu ý a11y: HoverCard chỉ kích hoạt bằng pointer/focus, không phù hợp
 * với màn hình cảm ứng — luôn cung cấp đường truy cập thay thế (link
 * thường, button mở dialog) cho mobile và screen reader.
 *
 * @example
 * ```tsx
 * <HoverCard>
 *   <HoverCardTrigger asChild>
 *     <a href="/cards/the-fool">The Fool</a>
 *   </HoverCardTrigger>
 *   <HoverCardContent>Lá Khờ — biểu tượng khởi đầu mới.</HoverCardContent>
 * </HoverCard>
 * ```
 */
const HoverCard = HoverCardPrimitive.Root

/**
 * Phần tử kích hoạt HoverCard. Mặc định render thẻ con; dùng `asChild`
 * để gắn vào link/button có sẵn mà không thêm thẻ bọc.
 */
const HoverCardTrigger = HoverCardPrimitive.Trigger

/**
 * Nội dung popup của {@link HoverCard}. Mặc định `align="center"` và
 * `sideOffset={4}`; có thể override qua props. Áp animation
 * fade/zoom/slide theo `data-state` và `data-side`.
 */
const HoverCardContent = React.forwardRef<
  React.ElementRef<typeof HoverCardPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <HoverCardPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-hover-card-content-transform-origin]",
      className
    )}
    {...props}
  />
))
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName

export { HoverCard, HoverCardTrigger, HoverCardContent }
