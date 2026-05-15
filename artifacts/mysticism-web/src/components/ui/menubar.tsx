import * as React from "react"
import * as MenubarPrimitive from "@radix-ui/react-menubar"
import { Check, ChevronRight, Circle } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Một menu (cột) bên trong {@link Menubar} — wrapper trực tiếp Radix
 * `Menu`. Bọc một cặp {@link MenubarTrigger} + {@link MenubarContent}.
 */
function MenubarMenu({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {
  return <MenubarPrimitive.Menu {...props} />
}

/** Gom nhóm các item liên quan trong cùng menu (không thêm style mặc định). */
function MenubarGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {
  return <MenubarPrimitive.Group {...props} />
}

/** Portal render nội dung menu vào cuối `<body>` để tránh stacking context. */
function MenubarPortal({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {
  return <MenubarPrimitive.Portal {...props} />
}

/** Group cho các {@link MenubarRadioItem} — chỉ một item được chọn tại một thời điểm. */
function MenubarRadioGroup({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {
  return <MenubarPrimitive.RadioGroup {...props} />
}

/** Wrapper cho sub-menu lồng nhau — dùng cùng {@link MenubarSubTrigger} và {@link MenubarSubContent}. */
function MenubarSub({
  ...props
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />
}

/**
 * Menubar — wrapper trực tiếp `@radix-ui/react-menubar` Root.
 *
 * Mục đích: thanh menu ngang dạng desktop app (File / Edit / View /
 * Help) chứa nhiều {@link MenubarMenu} song song. Khi mở một menu rồi
 * di chuột sang trigger khác, menu tương ứng sẽ tự mở.
 *
 * Props: kế thừa props của Radix Root — `value`, `onValueChange`,
 * `defaultValue`, `dir`, `loop`.
 *
 * Lưu ý a11y: Radix gắn `role="menubar"` cho thanh và `role="menuitem"`,
 * `role="menuitemcheckbox"`, `role="menuitemradio"` cho các item; bàn
 * phím hỗ trợ `←/→` di chuyển giữa các menu, `↑/↓` di chuyển trong
 * menu mở, `Enter`/`Space` chọn, `→`/`←` mở/đóng sub-menu, `Esc` đóng,
 * `Home`/`End` về đầu/cuối, type-ahead theo ký tự đầu.
 *
 * @example
 * ```tsx
 * <Menubar>
 *   <MenubarMenu>
 *     <MenubarTrigger>File</MenubarTrigger>
 *     <MenubarContent>
 *       <MenubarItem>Mới<MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
 *       <MenubarSeparator />
 *       <MenubarItem>Lưu<MenubarShortcut>⌘S</MenubarShortcut></MenubarItem>
 *     </MenubarContent>
 *   </MenubarMenu>
 * </Menubar>
 * ```
 */
const Menubar = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Root
    ref={ref}
    className={cn(
      "flex h-9 items-center space-x-1 rounded-md border bg-background p-1 shadow-sm",
      className
    )}
    {...props}
  />
))
Menubar.displayName = MenubarPrimitive.Root.displayName

/**
 * Trigger top-level mở một {@link MenubarMenu} (ví dụ "File", "Edit").
 * Chỉ cần focus và bấm `↓` để mở menu tương ứng.
 */
const MenubarTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex cursor-default select-none items-center rounded-sm px-3 py-1 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
      className
    )}
    {...props}
  />
))
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName

/**
 * Trigger để mở sub-menu lồng nhau bên trong {@link MenubarSub}.
 * Tự render icon `ChevronRight` ở cuối để hint hướng mở.
 *
 * Props bổ sung:
 * - `inset`: `boolean` — thêm `pl-8` để align với các item có icon/indicator.
 */
const MenubarSubTrigger = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {
    inset?: boolean
  }
>(({ className, inset, children, ...props }, ref) => (
  <MenubarPrimitive.SubTrigger
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
  </MenubarPrimitive.SubTrigger>
))
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName

/** Container cho các item của sub-menu lồng nhau, áp animation slide-in theo `data-side`. */
const MenubarSubContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.SubContent
    ref={ref}
    className={cn(
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-menubar-content-transform-origin]",
      className
    )}
    {...props}
  />
))
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName

/**
 * Container chính cho nội dung của một {@link MenubarMenu} — render
 * qua Portal, áp animation slide-in theo `data-side`.
 *
 * Props chính:
 * - `align` (mặc định `"start"`): căn theo cạnh trái/phải/giữa của trigger.
 * - `alignOffset` (mặc định `-4`), `sideOffset` (mặc định `8`): tinh
 *   chỉnh khoảng cách từ trigger.
 */
const MenubarContent = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>
>(
  (
    { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },
    ref
  ) => (
    <MenubarPrimitive.Portal>
      <MenubarPrimitive.Content
        ref={ref}
        align={align}
        alignOffset={alignOffset}
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-menubar-content-transform-origin]",
          className
        )}
        {...props}
      />
    </MenubarPrimitive.Portal>
  )
)
MenubarContent.displayName = MenubarPrimitive.Content.displayName

/**
 * Item thường trong menu — `role="menuitem"`. Click hoặc `Enter`
 * kích hoạt và đóng menu (trừ khi `event.preventDefault()` trong `onSelect`).
 *
 * Props bổ sung:
 * - `inset`: `boolean` — thêm `pl-8` để align với các item có icon/indicator.
 */
const MenubarItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarItem.displayName = MenubarPrimitive.Item.displayName

/**
 * Item dạng checkbox — `role="menuitemcheckbox"` với `aria-checked`.
 * Hiển thị icon `Check` khi `checked`. Dùng `checked` + `onCheckedChange`
 * để controlled.
 */
const MenubarCheckboxItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <MenubarPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.CheckboxItem>
))
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName

/**
 * Item dạng radio — `role="menuitemradio"`. Phải đặt trong
 * {@link MenubarRadioGroup} để chia sẻ trạng thái. Hiển thị `Circle`
 * solid khi item được chọn.
 */
const MenubarRadioItem = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>
>(({ className, children, ...props }, ref) => (
  <MenubarPrimitive.RadioItem
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <MenubarPrimitive.ItemIndicator>
        <Circle className="h-4 w-4 fill-current" />
      </MenubarPrimitive.ItemIndicator>
    </span>
    {children}
  </MenubarPrimitive.RadioItem>
))
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName

/**
 * Label cho nhóm item (tiêu đề section) — không nhận focus, không
 * kích hoạt được.
 *
 * Props bổ sung:
 * - `inset`: `boolean` — thêm `pl-8` để align với các item có icon/indicator.
 */
const MenubarLabel = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {
    inset?: boolean
  }
>(({ className, inset, ...props }, ref) => (
  <MenubarPrimitive.Label
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-semibold",
      inset && "pl-8",
      className
    )}
    {...props}
  />
))
MenubarLabel.displayName = MenubarPrimitive.Label.displayName

/** Đường kẻ ngang phân cách các nhóm item (`role="separator"`). */
const MenubarSeparator = React.forwardRef<
  React.ElementRef<typeof MenubarPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <MenubarPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
))
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName

/**
 * Hiển thị phím tắt bên cạnh item (ví dụ `⌘N`) — chỉ thuần thị giác,
 * không tự bind shortcut. App phải tự xử lý keyboard handler tương ứng.
 */
const MenubarShortcut = ({
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
MenubarShortcut.displayname = "MenubarShortcut"

export {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarLabel,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarPortal,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarGroup,
  MenubarSub,
  MenubarShortcut,
}
