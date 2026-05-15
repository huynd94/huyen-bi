import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

/**
 * Popover — wrapper Radix Popover Root.
 *
 * Mục đích: hiển thị nội dung tương tác (form mini, picker, menu nâng
 * cao) bên cạnh trigger — khác với {@link Tooltip} ở chỗ Popover chứa
 * được focusable element và mở bằng click thay vì hover.
 *
 * Props: kế thừa props của `PopoverPrimitive.Root` — `open`,
 * `defaultOpen`, `onOpenChange`, `modal`.
 *
 * Lưu ý a11y: Radix bẫy focus về bên trong content khi mở (nếu
 * `modal=true`), trả focus về trigger khi đóng; bàn phím `Esc` đóng
 * popover, `Tab` xoay vòng trong content.
 *
 * @example
 * ```tsx
 * <Popover>
 *   <PopoverTrigger asChild>
 *     <Button variant="outline">Bộ lọc</Button>
 *   </PopoverTrigger>
 *   <PopoverContent>
 *     <FilterForm />
 *   </PopoverContent>
 * </Popover>
 * ```
 */
const Popover = PopoverPrimitive.Root

/**
 * Phần tử kích hoạt {@link Popover}. Mặc định render `<button>`; dùng
 * `asChild` để gắn vào button/icon-button có sẵn.
 */
const PopoverTrigger = PopoverPrimitive.Trigger

/**
 * Anchor tuỳ chọn để định vị {@link PopoverContent} dựa trên một phần
 * tử khác (không phải trigger). Hữu ích khi trigger là button nổi
 * nhưng popover cần neo theo input phía trên.
 */
const PopoverAnchor = PopoverPrimitive.Anchor

/**
 * Nội dung popup của {@link Popover}, render qua `Portal` để thoát
 * khỏi overflow của container cha. Mặc định `align="center"` và
 * `sideOffset={4}`; áp animation fade/zoom/slide theo `data-state`
 * và `data-side`.
 *
 * Lưu ý a11y: nội dung nên có heading/label đầu tiên để screen reader
 * có ngữ cảnh khi focus tự động chuyển vào.
 */
const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",
        className
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
