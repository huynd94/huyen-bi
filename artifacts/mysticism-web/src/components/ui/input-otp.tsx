import * as React from "react"
import { OTPInput, OTPInputContext } from "input-otp"
import { Minus } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * InputOTP — wrapper trực tiếp `OTPInput` của thư viện `input-otp`.
 *
 * Mục đích: nhập mã OTP (one-time password) gồm nhiều ký tự, hiển
 * thị từng ô riêng biệt nhưng phía sau là một `<input>` ẩn duy nhất
 * — paste/auto-fill từ SMS đều hoạt động giống native input.
 *
 * Props chính: `maxLength` (số ô), `value`, `onChange`, `pattern`
 * (regex giới hạn ký tự, ví dụ `REGEXP_ONLY_DIGITS`),
 * `containerClassName`, `disabled`.
 *
 * Lưu ý a11y: input thật là `<input>` ẩn nên hỗ trợ đầy đủ keyboard
 * (gõ ký tự, Backspace xoá lùi, ←/→ di chuyển caret), screen reader
 * đọc placeholder/label như input thường. Khi disabled, container tự
 * giảm opacity 50% qua `has-[:disabled]`.
 *
 * @example
 * ```tsx
 * <InputOTP maxLength={6} value={code} onChange={setCode}>
 *   <InputOTPGroup>
 *     <InputOTPSlot index={0} />
 *     <InputOTPSlot index={1} />
 *     <InputOTPSlot index={2} />
 *   </InputOTPGroup>
 *   <InputOTPSeparator />
 *   <InputOTPGroup>
 *     <InputOTPSlot index={3} />
 *     <InputOTPSlot index={4} />
 *     <InputOTPSlot index={5} />
 *   </InputOTPGroup>
 * </InputOTP>
 * ```
 */
const InputOTP = React.forwardRef<
  React.ElementRef<typeof OTPInput>,
  React.ComponentPropsWithoutRef<typeof OTPInput>
>(({ className, containerClassName, ...props }, ref) => (
  <OTPInput
    ref={ref}
    containerClassName={cn(
      "flex items-center gap-2 has-[:disabled]:opacity-50",
      containerClassName
    )}
    className={cn("disabled:cursor-not-allowed", className)}
    {...props}
  />
))
InputOTP.displayName = "InputOTP"

/**
 * InputOTPGroup — gom nhóm các {@link InputOTPSlot} liền nhau (không
 * có separator giữa). Áp `flex items-center` để các slot dính sát
 * nhau và bo góc đầu/cuối qua selector `first:`/`last:` của slot.
 */
const InputOTPGroup = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center", className)} {...props} />
))
InputOTPGroup.displayName = "InputOTPGroup"

/**
 * InputOTPSlot — một ô hiển thị ký tự tại vị trí `index`.
 *
 * Đọc state từ `OTPInputContext` (qua context của thư viện
 * `input-otp`) để biết:
 * - `char`: ký tự hiện tại trong ô (hiển thị).
 * - `hasFakeCaret`: có vẽ caret giả (animation nhấp nháy) khi ô đang
 *   active mà ô chưa có ký tự.
 * - `isActive`: ô có đang được focus — áp `ring-1 ring-ring` để
 *   highlight.
 *
 * Lưu ý a11y: slot chỉ là phần hiển thị; tương tác bàn phím được xử
 * lý bởi `<input>` ẩn của {@link InputOTP}, nên không cần gắn focus
 * handler hay tabindex thủ công.
 */
const InputOTPSlot = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div"> & { index: number }
>(({ index, className, ...props }, ref) => {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",
        isActive && "z-10 ring-1 ring-ring",
        className
      )}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />
        </div>
      )}
    </div>
  )
})
InputOTPSlot.displayName = "InputOTPSlot"

/**
 * InputOTPSeparator — dấu ngăn cách giữa hai {@link InputOTPGroup}
 * (ví dụ: `123-456` chia thành 3+3 ký tự). Render `role="separator"`
 * và icon `Minus`.
 */
const InputOTPSeparator = React.forwardRef<
  React.ElementRef<"div">,
  React.ComponentPropsWithoutRef<"div">
>(({ ...props }, ref) => (
  <div ref={ref} role="separator" {...props}>
    <Minus />
  </div>
))
InputOTPSeparator.displayName = "InputOTPSeparator"

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
