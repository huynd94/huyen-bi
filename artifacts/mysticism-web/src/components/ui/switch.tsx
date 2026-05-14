import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

/**
 * Switch — công tắc bật/tắt dựa trên Radix Switch.
 *
 * Mục đích: bật/tắt tức thì một thiết lập (ví dụ: chế độ tối, nhận
 * thông báo, hiển thị nâng cao). Dùng Switch khi thay đổi áp dụng
 * ngay lập tức; nếu cần "Lưu" để xác nhận, ưu tiên {@link Checkbox}.
 *
 * Props: kế thừa toàn bộ props của `SwitchPrimitives.Root` —
 * `checked`, `defaultChecked`, `onCheckedChange`, `disabled`,
 * `required`, `name`, `value`, `id`,...
 *
 * Lưu ý a11y: Radix render `<button role="switch">` với `aria-checked`
 * đồng bộ trạng thái; bàn phím `Space`/`Enter` toggle. Luôn ghép với
 * `<Label htmlFor>` để screen reader đọc được ý nghĩa của switch;
 * tránh chỉ đặt nhãn "Bật/Tắt" trừu tượng.
 *
 * @example
 * ```tsx
 * <div className="flex items-center gap-2">
 *   <Switch id="dark-mode" checked={dark} onCheckedChange={setDark} />
 *   <Label htmlFor="dark-mode">Chế độ tối</Label>
 * </div>
 * ```
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
