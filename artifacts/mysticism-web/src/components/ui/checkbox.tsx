import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Checkbox — wrapper Radix Checkbox Root.
 *
 * Mục đích: ô tick/bỏ tick dạng nhỏ (16×16) cho form, danh sách lọc,
 * điều khoản đồng ý,... Hỗ trợ cả trạng thái `indeterminate` qua prop
 * `checked={"indeterminate"}`.
 *
 * Props: kế thừa toàn bộ props của `CheckboxPrimitive.Root` —
 * `checked`, `defaultChecked`, `onCheckedChange`, `disabled`, `required`,
 * `name`, `value`, `id`,...
 *
 * Lưu ý a11y: Radix render thẻ `<button role="checkbox">` với
 * `aria-checked` đồng bộ trạng thái; bàn phím `Space` toggle. Luôn cặp
 * với `<Label htmlFor>` hoặc bọc trong `<Label>` để screen reader đọc
 * được nhãn; tránh chỉ dùng text bên cạnh không liên kết.
 *
 * @example
 * ```tsx
 * <div className="flex items-center gap-2">
 *   <Checkbox id="agree" checked={agreed} onCheckedChange={setAgreed} />
 *   <Label htmlFor="agree">Tôi đồng ý với điều khoản</Label>
 * </div>
 * ```
 */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("grid place-content-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
))
Checkbox.displayName = CheckboxPrimitive.Root.displayName

export { Checkbox }
