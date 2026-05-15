"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

/**
 * TooltipProvider — cấu hình toàn cục cho Tooltip.
 *
 * Mục đích: đặt ở gần root app để chia sẻ `delayDuration`,
 * `skipDelayDuration` và đồng bộ trạng thái mở giữa nhiều tooltip
 * lân cận (giúp di chuyển giữa icon button không phải chờ delay lại).
 *
 * Props: kế thừa props của `TooltipPrimitive.Provider` —
 * `delayDuration`, `skipDelayDuration`, `disableHoverableContent`.
 *
 * @example
 * ```tsx
 * <TooltipProvider delayDuration={200}>
 *   <App />
 * </TooltipProvider>
 * ```
 */
const TooltipProvider = TooltipPrimitive.Provider

/**
 * Tooltip — wrapper Radix Tooltip Root.
 *
 * Mục đích: bong bóng gợi ý ngắn (≤ 1 câu) khi hover/focus vào icon
 * hoặc button không đi kèm nhãn rõ ràng. Với nội dung tương tác hoặc
 * dài, dùng {@link HoverCard} hoặc {@link Popover} thay thế.
 *
 * Props: kế thừa props của `TooltipPrimitive.Root` — `open`,
 * `defaultOpen`, `onOpenChange`, `delayDuration`,
 * `disableHoverableContent`.
 *
 * Lưu ý a11y: tooltip kích hoạt cả bằng pointer hover lẫn keyboard
 * focus; không phù hợp với màn hình cảm ứng — luôn cung cấp nhãn thay
 * thế (ví dụ `aria-label`) cho mobile/screen reader. Tránh đặt nội
 * dung tương tác bên trong `TooltipContent`.
 *
 * @example
 * ```tsx
 * <Tooltip>
 *   <TooltipTrigger asChild>
 *     <Button size="icon" aria-label="Lưu">
 *       <SaveIcon />
 *     </Button>
 *   </TooltipTrigger>
 *   <TooltipContent>Lưu lá số</TooltipContent>
 * </Tooltip>
 * ```
 */
const Tooltip = TooltipPrimitive.Root

/**
 * Phần tử kích hoạt {@link Tooltip}. Mặc định render `<button>`; dùng
 * `asChild` để gắn vào button/icon-button có sẵn mà không thêm thẻ bọc.
 */
const TooltipTrigger = TooltipPrimitive.Trigger

/**
 * Bong bóng nội dung của {@link Tooltip}, render qua `Portal`. Mặc
 * định `sideOffset={4}`; áp animation fade/zoom/slide theo `data-state`
 * và `data-side`. Giữ nội dung ngắn gọn, không tương tác.
 */
const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-tooltip-content-transform-origin]",
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
