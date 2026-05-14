"use client"

import * as React from "react"
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * DropdownMenu — wrapper trực tiếp `@radix-ui/react-dropdown-menu` Root.
 *
 * Mục đích: menu thả xuống kích hoạt từ một nút (action menu, user
 * menu, more options). Hỗ trợ item thường, checkbox, radio, sub-menu
 * lồng nhau, và keyboard shortcuts hiển thị qua {@link DropdownMenuShortcut}.
 *
 * Props: kế thừa props của Radix Root — `open`, `onOpenChange`,
 * `defaultOpen`, `modal` (mặc định `true`), `dir`.
 *
 * Lưu ý a11y: Radix gắn `role="menu"`, `role="menuitem"`,
 * `role="menuitemcheckbox"`, `role="menuitemradio"` tự động; bàn phím
 * hỗ trợ `↑/↓` di chuyển, `Enter`/`Space` chọn, `→` mở sub-menu, `←`
 * đóng sub-menu, `Esc` đóng menu, ký tự đầu để type-ahead.
 *
 * @example
 * ```tsx
 * <DropdownMenu>
 *   <DropdownMenuTrigger asChild>
 *     <Button variant="outline">Thao tác</Button>
 *   </DropdownMenuTrigger>
 *   <DropdownMenuContent>
 *     <DropdownMenuLabel>Quản lý lá số</DropdownMenuLabel>
 *     <DropdownMenuSeparator />
 *     <DropdownMenuItem>Xem chi tiết</DropdownMenuItem>
 *     <DropdownMenuItem>Chia sẻ</DropdownMenuItem>
 *     <DropdownMenuItem className="text-destructive">Xoá</DropdownMenuItem>
 *   </DropdownMenuContent>
 * </DropdownMenu>
 * ```
 */
const DropdownMenu = DropdownMenuPrimitive.Root

/** Trigger mở {@link DropdownMenu}. Dùng `asChild` để render component tuỳ ý. */
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

/** Gom nhóm các item liên quan trong cùng menu (không thêm style mặc định). */
const DropdownMenuGroup = DropdownMenuPrimitive.Group

/** Portal render nội dung menu vào cuối `<body>` để tránh stacking context. */
const DropdownMenuPortal = DropdownMenuPrimitive.Portal

/** Wrapper cho sub-menu lồng nhau — dùng cùng {@link DropdownMenuSubTrigger} và {@link DropdownMenuSubContent}. */
const DropdownMenuSub = DropdownMenuPrimitive.Sub

/** Group cho các {@link DropdownMenuRadioItem} — chỉ một item được chọn tại một thời điểm. */
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup

/**
 * Trigger để mở sub-menu lồng nhau bên trong {@link DropdownMenuSub}.
 * Tự render icon `ChevronRight` ở cuối để hint hướng mở.
 *
 * Props bổ sung:
 * - `inset`: `boolean` — thêm `pl-8` để align với các item có icon/indicator.
 *
 * Lưu ý a11y: nhấn `→` (hoặc hover) để mở sub-menu, `←` để đóng.
 */
const DropdownMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto" />
  </DropdownMenuPrimitive.SubTrigger>
))
DropdownMenuSubTrigger.displayName =
  DropdownMenuPrimitive.SubTrigger.displayName

/** Container cho các item của sub-menu lồng nhau, áp animation slide-in theo `data-side`. */
const DropdownMenuSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
      className
    )}
    {...props}
  />
))
DropdownMenuSubContent.displayName =
  DropdownMenuPrimitive.SubContent.displayName

/**
 * Container chính của menu — render qua Portal, áp animation slide-in
 * theo `data-side`, giới hạn chiều cao tối đa bằng
 * `--radix-dropdown-menu-content-available-height` để tránh tràn viewport.
 *
 * Props chính:
 * - `sideOffset` (mặc định `4`): khoảng cách giữa content và trigger.
 * - `side`, `align`: vị trí relative tới trigger (Radix tính lại nếu
 *   bị che, ví dụ chuyển từ `bottom` sang `top`).
 */
const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",
        className
      )}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
))
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName

/**
 * Item thường trong menu — `role="menuitem"`. Click hoặc `Enter`
 * kích hoạt và đóng menu (trừ khi `event.preventDefault()` trong `onSelect`).
 *
 * Props bổ sung:
 * - `inset`: `boolean` — thêm `pl-8` để align với các item có icon/indicator.
 */
const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName

/**
 * Item dạng checkbox — `role="menuitemcheckbox"` với
 * `aria-checked`. Hiển thị icon `Check` khi `checked`. Dùng `checked`
 * + `onCheckedChange` để controlled.
 */
const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
))
DropdownMenuCheckboxItem.displayName =
  DropdownMenuPrimitive.CheckboxItem.displayName

/**
 * Item dạng radio — `role="menuitemradio"`. Phải đặt trong
 * {@link DropdownMenuRadioGroup} để chia sẻ trạng thái. Hiển thị
 * `Circle` solid khi item được chọn.
 */
const DropdownMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-current" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
))
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName

/**
 * Label cho nhóm item (ví dụ tiêu đề section) — không nhận focus,
 * không kích hoạt được.
 *
 * Props bổ sung:
 * - `inset`: `boolean` — thêm `pl-8` để align với các item có icon/indicator.
 */
const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName

/** Đường kẻ ngang phân cách các nhóm item (`role="separator"`). */
const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName

/**
 * Hiển thị phím tắt bên cạnh item (ví dụ `⌘K`) — chỉ thuần thị giác,
 * không tự bind shortcut. App phải tự xử lý keyboard handler tương ứng.
 */
const DropdownMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
      {...props}
    />
  )
}
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
}
