"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Select — wrapper trực tiếp của `@radix-ui/react-select` Root.
 *
 * Mục đích: dropdown chọn-một dùng cho form controls có sẵn danh sách
 * lựa chọn cố định (ví dụ: chọn loại bói, múi giờ, ngôn ngữ). Khác
 * `<select>` HTML thuần ở chỗ Radix render menu tuỳ biến hoàn toàn,
 * vẫn giữ đầy đủ semantics và keyboard support.
 *
 * Props: kế thừa props của Radix Root — `value`, `onValueChange`,
 * `defaultValue`, `open`, `onOpenChange`, `disabled`, `required`,
 * `name`, `dir`.
 *
 * Lưu ý a11y: Radix gắn `role="combobox"` cho trigger và
 * `role="listbox"` cho content; bàn phím hỗ trợ `↑/↓` di chuyển giữa
 * item, `Enter`/`Space` chọn, `Esc` đóng menu, type-ahead theo ký tự
 * đầu để nhảy nhanh tới item.
 *
 * @example
 * ```tsx
 * <Select value={value} onValueChange={setValue}>
 *   <SelectTrigger className="w-[200px]">
 *     <SelectValue placeholder="Chọn loại bói" />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="tarot">Tarot</SelectItem>
 *     <SelectItem value="bazi">Bát tự</SelectItem>
 *     <SelectItem value="iching">Kinh Dịch</SelectItem>
 *   </SelectContent>
 * </Select>
 * ```
 */
const Select = SelectPrimitive.Root

/** Gom nhóm các {@link SelectItem} có liên quan, dùng cùng {@link SelectLabel} cho tiêu đề nhóm. */
const SelectGroup = SelectPrimitive.Group

/**
 * Hiển thị giá trị đã chọn bên trong {@link SelectTrigger}. Khi chưa
 * chọn, render `placeholder` (style `data-[placeholder]:text-muted-foreground`).
 */
const SelectValue = SelectPrimitive.Value

/**
 * Nút mở dropdown — render `<button role="combobox">` chứa
 * {@link SelectValue} và icon `ChevronDown`. Tự áp `aria-expanded`,
 * `aria-haspopup="listbox"` qua Radix.
 *
 * Lưu ý a11y: hỗ trợ keyboard tự động — `Space`/`Enter`/`↓` mở menu,
 * `disabled` dùng style `disabled:cursor-not-allowed disabled:opacity-50`.
 */
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

/**
 * Nút cuộn lên đầu danh sách khi nội dung menu cao hơn viewport — chỉ
 * hiển thị khi danh sách còn item phía trên. Hover/focus để cuộn tự động.
 */
const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

/**
 * Nút cuộn xuống cuối danh sách khi nội dung menu cao hơn viewport — chỉ
 * hiển thị khi danh sách còn item phía dưới. Hover/focus để cuộn tự động.
 */
const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

/**
 * Container chính của menu dropdown — render qua Portal, áp animation
 * slide-in theo `data-side`, giới hạn chiều cao tối đa bằng
 * `--radix-select-content-available-height` để tránh tràn viewport.
 *
 * Props chính:
 * - `position` (mặc định `"popper"`): `"popper"` (positioning theo
 *   trigger, có flip) hoặc `"item-aligned"` (align item đang chọn với
 *   trigger, kiểu native). Khi `popper`, content có chiều rộng tối
 *   thiểu bằng trigger qua `--radix-select-trigger-width`.
 */
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

/**
 * Tiêu đề cho một {@link SelectGroup} — không nhận focus, không kích
 * hoạt được, dùng để gắn label cho nhóm item liên quan.
 */
const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

/**
 * Một lựa chọn trong menu — `role="option"` với `value` duy nhất.
 * Hiển thị icon `Check` ở phía phải khi item đang được chọn.
 *
 * Lưu ý a11y: nội dung text dùng cho type-ahead phải nằm trong
 * `<SelectPrimitive.ItemText>` (component này tự bọc qua `children`).
 * Item disabled qua prop `disabled` sẽ áp `data-[disabled]:opacity-50`
 * và không nhận focus.
 */
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

/** Đường kẻ ngang phân cách các nhóm item (`role="separator"`). */
const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
