import * as React from "react"
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"
import { Circle } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * RadioGroup — wrapper trực tiếp `@radix-ui/react-radio-group` Root.
 *
 * Mục đích: nhóm chọn-một (single-select) cho danh sách lựa chọn
 * loại trừ lẫn nhau (ví dụ: chọn giới tính, chọn ngôn ngữ, chọn cấp
 * độ chi tiết của lá số). Khác native radio ở chỗ Radix gắn
 * `role="radiogroup"`, tự quản lý roving tabindex giữa các item.
 *
 * Props: kế thừa props của Radix Root — `value`, `onValueChange`,
 * `defaultValue`, `name`, `disabled`, `required`, `orientation`,
 * `dir`, `loop`.
 *
 * Lưu ý a11y: bàn phím hỗ trợ `↑/↓` (hoặc `←/→`) để di chuyển và
 * chọn item kế tiếp/trước, `Tab` chỉ vào/ra group (không di giữa
 * item). Khi validate fail, gắn `aria-invalid="true"` lên Root và
 * dùng `aria-describedby` trỏ tới message lỗi. Toàn bộ group nên đi
 * kèm `<FieldLegend>` hoặc `aria-labelledby` để screen reader hiểu
 * mục đích.
 *
 * @example
 * ```tsx
 * <RadioGroup value={value} onValueChange={setValue}>
 *   <div className="flex items-center gap-2">
 *     <RadioGroupItem value="male" id="r-male" />
 *     <Label htmlFor="r-male">Nam</Label>
 *   </div>
 *   <div className="flex items-center gap-2">
 *     <RadioGroupItem value="female" id="r-female" />
 *     <Label htmlFor="r-female">Nữ</Label>
 *   </div>
 * </RadioGroup>
 * ```
 */
const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn("grid gap-2", className)}
      {...props}
      ref={ref}
    />
  )
})
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName

/**
 * RadioGroupItem — một lựa chọn radio bên trong {@link RadioGroup}.
 * Render `<button role="radio">` với indicator hình tròn (icon
 * `Circle`) khi `data-state="checked"`.
 *
 * Props: `value` (bắt buộc, duy nhất trong group), `id` (gắn vào
 * `<Label htmlFor>` để click label cũng chọn), `disabled`.
 *
 * Lưu ý a11y: cần `id` để liên kết với label kế bên qua `htmlFor`.
 * Khi `disabled`, tự áp `cursor-not-allowed` và `opacity-50`. Focus
 * ring chỉ hiện qua `focus-visible` (tránh outline khi click chuột).
 */
const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>
>(({ className, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Circle className="h-3.5 w-3.5 fill-primary" />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
})
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName

export { RadioGroup, RadioGroupItem }
