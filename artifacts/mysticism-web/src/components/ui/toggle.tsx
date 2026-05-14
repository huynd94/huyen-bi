import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * `class-variance-authority` recipe của {@link Toggle}.
 *
 * Mục đích: cấu hình `variant` (`default | outline`) và `size`
 * (`default | sm | lg`) cho nút toggle on/off. Export riêng để consumer
 * có thể tái sử dụng cùng look-and-feel cho các button toggle dạng
 * `<button data-state="on">` không bắt buộc dùng Radix.
 */
const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline:
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Toggle — nút bật/tắt độc lập dựa trên Radix Toggle.
 *
 * Mục đích: nút có hai trạng thái on/off cho toolbar (in đậm, in
 * nghiêng, mute, pin,...). Khác {@link Switch} ở chỗ Toggle thường
 * mang icon và đứng trong hàng nhóm action; khác {@link Checkbox} ở
 * chỗ Toggle không nhằm gửi dữ liệu form.
 *
 * Props:
 * - kế thừa props của `TogglePrimitive.Root` — `pressed`,
 *   `defaultPressed`, `onPressedChange`, `disabled`.
 * - `variant` / `size` từ {@link toggleVariants}.
 *
 * Lưu ý a11y: Radix render `<button>` với `aria-pressed` đồng bộ
 * `pressed`; bàn phím `Space`/`Enter` toggle. Khi chỉ có icon, hãy
 * thêm `aria-label` mô tả hành động (ví dụ "In đậm").
 *
 * @example
 * ```tsx
 * <Toggle aria-label="In đậm" pressed={bold} onPressedChange={setBold}>
 *   <BoldIcon />
 * </Toggle>
 * ```
 */
const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={cn(toggleVariants({ variant, size, className }))}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
