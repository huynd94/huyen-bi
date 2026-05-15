"use client"

import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"

/**
 * Command — wrapper trực tiếp của `cmdk` Command Root.
 *
 * Mục đích: command palette / fuzzy-search list dùng cho các flow tìm
 * kiếm và lệnh nhanh (ví dụ: "Mở lá số…", "Đi tới…", picker cho
 * autocomplete). Render filter theo input và tự động đánh dấu kết quả
 * tốt nhất qua `data-[selected=true]`.
 *
 * Props: kế thừa props của `cmdk` Root — `value`, `onValueChange`,
 * `filter`, `shouldFilter`, `loop`, `vimBindings`,...
 *
 * Lưu ý a11y: `cmdk` gắn `role="combobox"` cho input và `role="listbox"`
 * cho list; bàn phím hỗ trợ `↑/↓` di chuyển item, `Enter` chọn,
 * `PageUp`/`PageDown` nhảy nhanh, `Home`/`End` về đầu/cuối.
 *
 * @example
 * ```tsx
 * <Command>
 *   <CommandInput placeholder="Tìm lệnh hoặc lá số..." />
 *   <CommandList>
 *     <CommandEmpty>Không có kết quả.</CommandEmpty>
 *     <CommandGroup heading="Lệnh">
 *       <CommandItem onSelect={() => router.push("/new")}>Tạo lá số mới</CommandItem>
 *       <CommandItem onSelect={() => router.push("/history")}>Lịch sử</CommandItem>
 *     </CommandGroup>
 *   </CommandList>
 * </Command>
 * ```
 */
const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

/**
 * Command palette dạng modal — bọc {@link Command} trong {@link Dialog}
 * để mở qua phím tắt (ví dụ `⌘K`). Tự strip padding mặc định của
 * `DialogContent` và áp các style chuyên biệt cho item/group/input.
 *
 * Props: kế thừa props của Radix `DialogProps` — `open`, `onOpenChange`,
 * `defaultOpen`, `modal`.
 *
 * @example
 * ```tsx
 * const [open, setOpen] = React.useState(false)
 * useEffect(() => {
 *   const onKey = (e: KeyboardEvent) => {
 *     if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
 *       e.preventDefault(); setOpen((v) => !v)
 *     }
 *   }
 *   document.addEventListener("keydown", onKey)
 *   return () => document.removeEventListener("keydown", onKey)
 * }, [])
 * return (
 *   <CommandDialog open={open} onOpenChange={setOpen}>
 *     <CommandInput placeholder="Tìm..." />
 *     <CommandList>...</CommandList>
 *   </CommandDialog>
 * )
 * ```
 */
const CommandDialog = ({ children, ...props }: DialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Ô nhập tìm kiếm — render `<input role="combobox">` kèm icon `Search`
 * decorative bên trái. Filter list tự động cập nhật khi gõ.
 *
 * Lưu ý a11y: nên đặt `placeholder` rõ ràng; `disabled` áp
 * `disabled:cursor-not-allowed disabled:opacity-50` và ngăn focus.
 */
const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

/**
 * Container `<div role="listbox">` chứa các {@link CommandGroup} và
 * {@link CommandItem}. Giới hạn chiều cao tối đa `300px` và bật scroll
 * dọc khi danh sách dài.
 */
const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
))

CommandList.displayName = CommandPrimitive.List.displayName

/**
 * Hiển thị thông báo "không có kết quả" khi filter không khớp item nào.
 * `cmdk` tự ẩn/hiện dựa trên trạng thái filter hiện tại.
 */
const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm"
    {...props}
  />
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

/**
 * Gom nhóm các {@link CommandItem} liên quan, có thể có tiêu đề qua
 * prop `heading`. `cmdk` tự ẩn group nếu tất cả item bên trong bị
 * filter loại bỏ.
 */
const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    )}
    {...props}
  />
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

/** Đường kẻ ngang phân cách các nhóm item. */
const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

/**
 * Một item trong palette — `role="option"`. Dùng `onSelect` thay vì
 * `onClick` để xử lý cả trường hợp chọn bằng `Enter`. Item bị filter
 * loại bỏ tự ẩn khỏi DOM; item disabled áp
 * `data-[disabled=true]:opacity-50` và không nhận focus.
 *
 * Lưu ý: prop `value` (string) là khoá filter — nếu không truyền,
 * `cmdk` sẽ dùng text content của children.
 */
const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
      className
    )}
    {...props}
  />
))

CommandItem.displayName = CommandPrimitive.Item.displayName

/**
 * Hiển thị phím tắt bên cạnh item (ví dụ `⌘K`) — chỉ thuần thị giác,
 * không tự bind shortcut. App phải tự xử lý keyboard handler tương ứng.
 */
const CommandShortcut = ({
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
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
}
