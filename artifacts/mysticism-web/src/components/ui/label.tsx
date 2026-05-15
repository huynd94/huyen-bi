"use client"

import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * `class-variance-authority` recipe của {@link Label}.
 *
 * Mục đích: đặt typography mặc định (`text-sm font-medium leading-none`)
 * và rule `peer-disabled:*` để label tự dim khi input liên kết bị
 * `disabled`. Hiện chưa có biến thể nhưng dùng cva để dễ mở rộng sau.
 */
const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
)

/**
 * Label — nhãn của form control dựa trên Radix Label.
 *
 * Mục đích: gắn nhãn cho `<input>`, `<Checkbox>`, `<Switch>`,
 * `<RadioGroup>`,... Khi click vào label, focus sẽ chuyển vào control
 * tương ứng — giúp tăng vùng tap và trải nghiệm desktop.
 *
 * Props: kế thừa props của `LabelPrimitive.Root` (giống `<label>`) —
 * `htmlFor` để liên kết với `id` của control. Hỗ trợ `asChild` qua
 * Radix Slot khi cần render thẻ khác.
 *
 * Lưu ý a11y: ưu tiên `htmlFor` thay vì bọc control để tránh nested
 * interactive; với form ngắn có thể bọc `<Label><input /></Label>` —
 * Radix sẽ vẫn forward focus đúng. Khi cặp với `peer` Tailwind, bố
 * cục cho phép `peer-disabled:opacity-70` tự động dim label.
 *
 * @example
 * ```tsx
 * <div className="grid gap-1">
 *   <Label htmlFor="email">Email</Label>
 *   <Input id="email" type="email" />
 * </div>
 * ```
 */
const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
