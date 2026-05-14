import * as React from "react"
import {
  FocusScope as RadixFocusScope,
  type FocusScopeProps as RadixFocusScopeProps,
} from "@radix-ui/react-focus-scope"

/**
 * Props for {@link FocusTrap}.
 *
 * Component là wrapper mỏng quanh `@radix-ui/react-focus-scope` nên nhận đầy
 * đủ các thuộc tính DOM của một `<div>` (className, style, data-*, role,...)
 * để tiêu thụ phía trên (drawer mobile menu, dialog tuỳ biến) có thể bố cục
 * thoải mái mà không cần thêm một wrapper trung gian.
 *
 * Các prop kế thừa từ Radix Focus Scope:
 * - `onMountAutoFocus`: handler khi auto-focus phần tử đầu tiên lúc mount.
 *   Có thể `event.preventDefault()` để tự kiểm soát focus.
 * - `onUnmountAutoFocus`: handler khi trả focus về trigger lúc unmount.
 *   Có thể `event.preventDefault()` nếu component cha muốn focus tới nơi khác.
 */
export interface FocusTrapProps
  extends Omit<RadixFocusScopeProps, "loop" | "trapped"> {
  /**
   * Khi `false`, FocusTrap render thẳng `children` mà không gắn focus scope —
   * không bẫy focus, không auto-focus khi mount, không trả focus khi unmount.
   *
   * Khi prop chuyển từ `true` sang `false` lúc runtime, focus scope sẽ bị
   * unmount; Radix sẽ trả focus về `document.activeElement` lúc trước khi
   * scope mount (mặc định là trigger element).
   *
   * @defaultValue `true`
   */
  enabled?: boolean
  /**
   * Khi `true`, nhấn `Tab` từ phần tử focusable cuối cùng sẽ vòng về phần tử
   * đầu tiên, và `Shift+Tab` từ phần tử đầu tiên sẽ vòng về phần tử cuối —
   * yêu cầu kinh điển cho dialog / drawer modal.
   *
   * @defaultValue `true`
   */
  loop?: boolean
  /**
   * Khi `true`, focus không thể thoát khỏi scope qua keyboard, pointer, hay
   * programmatic focus. Khi không được truyền, mặc định bằng giá trị của
   * {@link FocusTrapProps.enabled} để hai cờ hành xử nhất quán: bật trap khi
   * và chỉ khi component đang được "bật".
   */
  trapped?: boolean
  /**
   * Nội dung được bẫy focus. Component bao bọc trong một `<div>` (do Radix
   * Focus Scope render) — nếu cần render trực tiếp trên child, dùng
   * {@link FocusTrapProps.asChild}.
   */
  children: React.ReactNode
  /**
   * Khi `true`, FocusTrap chuyển toàn bộ prop và ref sang child duy nhất
   * thay vì render `<div>` bao ngoài (Radix Slot pattern). Hữu ích khi child
   * đã là một thẻ ngữ nghĩa (`<nav>`, `<aside>`, `<dialog>`).
   */
  asChild?: boolean
}

/**
 * `FocusTrap` bẫy focus bàn phím và con trỏ trong cây con được bao bọc, và
 * trả focus về phần tử đã focus trước đó (thường là trigger) khi component
 * unmount hoặc khi prop {@link FocusTrapProps.enabled} chuyển sang `false`.
 *
 * Component này là wrapper mỏng quanh `@radix-ui/react-focus-scope`, đặt
 * mặc định `loop={true}` và `trapped={enabled}` để khớp hành vi mong đợi
 * của dialog / drawer / popover trong ứng dụng Huyền Bí (xem `Requirements
 * 3.6` và `Requirements 3.7`):
 *
 * - 3.6: Khi dialog hoặc dropdown menu mở ra, chuyển focus vào phần tử
 *   focusable đầu tiên bên trong và bẫy focus cho đến khi đóng.
 * - 3.7: Khi nhấn Escape, panel đóng và focus được trả về trigger element
 *   (bản thân FocusTrap chỉ phụ trách phần *trả focus* khi unmount; xử lý
 *   phím Escape thuộc trách nhiệm của container — Radix `Dialog`,
 *   `DropdownMenu`,... hoặc handler tuỳ biến trong drawer mobile menu).
 *
 * Ví dụ sử dụng trong drawer mobile menu:
 *
 * @example
 * ```tsx
 * <FocusTrap enabled={open} onUnmountAutoFocus={(e) => {
 *   // Để trigger nhận lại focus tự nhiên — đừng preventDefault.
 * }}>
 *   <nav aria-label="Menu chính">
 *     {links.map((link) => <a key={link.href} href={link.href}>{link.label}</a>)}
 *   </nav>
 * </FocusTrap>
 * ```
 *
 * Lưu ý:
 * - Khi `enabled === false`, component render `children` trần (không bao
 *   `<div>` Radix) để tránh thay đổi cây DOM khi không cần bẫy focus.
 * - Component không tự lắng nghe phím Escape; container cha quyết định khi
 *   nào đóng panel và unmount FocusTrap.
 *
 * Validates: Requirements 3.6, 3.7.
 */
export const FocusTrap = React.forwardRef<HTMLDivElement, FocusTrapProps>(
  function FocusTrap(
    { enabled = true, loop = true, trapped, children, ...rest },
    ref,
  ) {
    if (!enabled) {
      return <>{children}</>
    }

    return (
      <RadixFocusScope
        ref={ref}
        loop={loop}
        trapped={trapped ?? enabled}
        {...rest}
      >
        {children}
      </RadixFocusScope>
    )
  },
)
FocusTrap.displayName = "FocusTrap"
