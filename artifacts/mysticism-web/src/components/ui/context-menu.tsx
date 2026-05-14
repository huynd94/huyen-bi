import * as React from "react"
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * ContextMenu — wrapper trực tiếp `@radix-ui/react-context-menu` Root.
 *
 * Mục đích: menu hiện ra khi user right-click (hoặc long-press trên
 * mobile) lên vùng {@link ContextMenuTrigger}. Khác {@link DropdownMenu}
 * ở cách kích hoạt (right-click/long-press thay vì click).
 *
 * Props: kế thừa props của Radix Root — `dir`, `modal`, `onOpenChange`.
 *
 * Lưu ý a11y: Radix gắn `role="menu"`, `role="menuitem"`,
 * `role="menuitemcheckbox"`, `role="menuitemradio"` tự động; bàn phím
 * hỗ trợ `↑/↓` di chuyển, `Enter`/`Space` chọn, `→` mở sub-menu, `←`
 * đóng sub-menu, `Esc` đóng menu. Mở qua phím `Shift+F10` hoặc phím
 * Context (Menu key) trên Windows.
 *
 * @example
 * ```tsx
 * <ContextMenu>
 *   <ContextMenuTrigger className="block p-4 border">
 *     Nhấp chuột phải lên vùng này
 *   </ContextMenuTrigger>
 *   <ContextMenuContent>
 *     <ContextMenuItem>Sao chép</ContextMenuItem>
 *     <ContextMenuItem>Dán</ContextMenuItem>
 *     <ContextMenuSeparator />
 *     <ContextMenuItem className="text-destructive">Xoá</ContextMenuItem>
 *   </ContextMenuContent>
 * </ContextMenu>
 * ```
 */
const ContextMenu = ContextMenuPrimitive.Root

/** Vùng kích hoạt context menu — right-click/long-press để mở menu. */
const ContextMenuTrigger = ContextMenuPrimitive.Trigger

/** Gom nhóm các item liên quan trong cùng menu (không thêm style mặc định). */
const ContextMenuGroup = ContextMenuPrimitive.Group

/** Portal render nội dung menu vào cuối `<body>` để tránh stacking context. */
const ContextMenuPortal = ContextMenuPrimitive.Portal

/** Wrapper cho sub-menu lồng nhau — dùng cùng {@link ContextMenuSubTrigger} và {@link ContextMenuSubContent}. */
const ContextMenuSub = ContextMenuPrimitive.Sub

/** Group cho các {@link ContextMenuRadioItem} — chỉ một item được chọn tại một thời điểm. */
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup

/**
 * Trigger để mở sub-menu lồng nhau bên trong {@link ContextMenuSub}.
 * Tự render icon `ChevronRight` ở cuối để hint hướng mở.
 *
 * Props bổ sung:
 * - `inset`: `boolean` — thêm `pl-8` để align với các item có icon/indicator.
 *
 * Lưu ý a11y: nhấn `→` (hoặc hover) để mở sub-menu, `←` để đóng.
 */
const ContextMenuSubTrigger = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <ContextMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </ContextMenuPrimitive.SubTrigger>
))
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName

/** Container cho các item của sub-menu lồng nhau, áp animation slide-in theo `data-side`. */
const ContextMenuSubContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-context-menu-content-transform-origin]",
      className
    )}
    {...props}
  />
))
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName

/**
 * Container chính của context menu — render qua Portal, áp animation
 * slide-in theo `data-side`, giới hạn chiều cao tối đa bằng
 * `--radix-context-menu-content-available-height` để tránh tràn viewport.
 *
 * Vị trí được Radix tính dựa trên toạ độ con trỏ chuột tại thời điểm
 * right-click; tự động flip nếu sát mép viewport.
 */
const ContextMenuContent = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Portal>
    <ContextMenuPrimitive.Content
      ref={ref}
      className={cn(
        "z-50 max-h-[--radix-context-menu-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-context-menu-content-transform-origin]",
        className
      )}
      {...props}
    />
  </ContextMenuPrimitive.Portal>
))
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName

/**
 * Item thường trong menu — `role="menuitem"`. Click hoặc `Enter`
 * kích hoạt và đóng menu (trừ khi `event.preventDefault()` trong `onSelect`).
 *
 * Props bổ sung:
 * - `inset`: `boolean` — thêm `pl-8` để align với các item có icon/indicator.
 */
const ContextMenuItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName

/**
 * Item dạng checkbox — `role="menuitemcheckbox"` với `aria-checked`.
 * Hiển thị icon `Check` khi `checked`. Dùng `checked` + `onCheckedChange`
 * để controlled.
 */
const ContextMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <ContextMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.CheckboxItem>
))
ContextMenuCheckboxItem.displayName =
  ContextMenuPrimitive.CheckboxItem.displayName

/**
 * Item dạng radio — `role="menuitemradio"`. Phải đặt trong
 * {@link ContextMenuRadioGroup} để chia sẻ trạng thái. Hiển thị
 * `Circle` solid khi item được chọn.
 */
const ContextMenuRadioItem = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <ContextMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <ContextMenuPrimitive.ItemIndicator>
        <Circle className="h-4 w-4 fill-current" />
      </ContextMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </ContextMenuPrimitive.RadioItem>
))
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName

/**
 * Label cho nhóm item (tiêu đề section) — không nhận focus, không
 * kích hoạt được.
 *
 * Props bổ sung:
 * - `inset`: `boolean` — thêm `pl-8` để align với các item có icon/indicator.
 */
const ContextMenuLabel = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <ContextMenuPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold text-foreground",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName

/** Đường kẻ ngang phân cách các nhóm item (`role="separator"`). */
const ContextMenuSeparator = React.forwardRef<
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <ContextMenuPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-border", className)}
    {...props}
  />
))
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName

/**
 * Hiển thị phím tắt bên cạnh item (ví dụ `⌘C`) — chỉ thuần thị giác,
 * không tự bind shortcut. App phải tự xử lý keyboard handler tương ứng.
 */
const ContextMenuShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
ContextMenuShortcut.displayName = "ContextMenuShortcut"

export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
}
