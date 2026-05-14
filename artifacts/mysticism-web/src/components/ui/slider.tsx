import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

/**
 * Slider — wrapper trực tiếp `@radix-ui/react-slider` Root, render
 * thanh trượt giá trị số (single-thumb).
 *
 * Mục đích: chọn giá trị trong một khoảng số (ví dụ: lọc theo năm
 * sinh, độ chi tiết, mức độ phân tích). Khác `<input type="range">`
 * native ở chỗ render hoàn toàn tuỳ biến nhưng vẫn giữ semantics
 * `role="slider"` của Radix.
 *
 * Props chính (kế thừa Radix Root): `value`, `defaultValue`,
 * `onValueChange`, `min`, `max`, `step`, `disabled`, `orientation`
 * (`"horizontal"` | `"vertical"`), `dir`, `inverted`, `name`.
 *
 * Range slider: implementation hiện tại chỉ render một Thumb. Để có
 * range hai-thumb, render slider tuỳ biến với hai
 * `<SliderPrimitive.Thumb />` thay cho component này.
 *
 * Lưu ý a11y: bàn phím hỗ trợ `←/↓` giảm theo `step`, `→/↑` tăng theo
 * `step`, `PageUp`/`PageDown` nhảy lớn, `Home`/`End` về min/max.
 * Radix tự gắn `aria-valuemin`, `aria-valuemax`, `aria-valuenow`.
 * Khi validate fail, gắn `aria-invalid="true"` lên Root. Cần kèm
 * label (qua `<Label htmlFor>` hoặc `aria-label`/`aria-labelledby`)
 * để screen reader đọc mục đích. Khi `disabled`, thumb tự áp
 * `pointer-events-none` và `opacity-50`.
 *
 * @example
 * ```tsx
 * <Slider
 *   value={[volume]}
 *   onValueChange={([v]) => setVolume(v)}
 *   min={0}
 *   max={100}
 *   step={1}
 *   aria-label="Âm lượng"
 * />
 * ```
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
