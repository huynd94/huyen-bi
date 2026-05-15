"use client"

import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"

/**
 * Collapsible — wrapper trực tiếp của `@radix-ui/react-collapsible` Root.
 *
 * Mục đích: vùng nội dung có thể gập-mở bằng một trigger duy nhất,
 * dùng cho "Xem thêm", FAQ đơn lẻ, panel cấu hình thu gọn,... Khác với
 * {@link Accordion} ở chỗ Collapsible chỉ có một item.
 *
 * Props: kế thừa props của `CollapsiblePrimitive.Root` — `open`,
 * `defaultOpen`, `onOpenChange`, `disabled`,...
 *
 * Lưu ý a11y: Radix tự gắn `aria-expanded` cho trigger và `aria-controls`
 * trỏ tới content; bàn phím `Space`/`Enter` toggle khi trigger được focus.
 *
 * @example
 * ```tsx
 * <Collapsible>
 *   <CollapsibleTrigger>Xem thêm chi tiết</CollapsibleTrigger>
 *   <CollapsibleContent>Nội dung gập-mở.</CollapsibleContent>
 * </Collapsible>
 * ```
 */
const Collapsible = CollapsiblePrimitive.Root

/**
 * Trigger để toggle nội dung của {@link Collapsible}. Render `<button>`
 * mặc định; dùng `asChild` để đổi sang phần tử khác (ví dụ `<Button>`).
 */
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

/**
 * Phần nội dung gập-mở. Khi đóng, Radix gắn `data-state="closed"` và
 * `hidden` để loại khỏi tab order; tận dụng các selector `data-[state=…]`
 * để áp animation trong className của consumer.
 */
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
