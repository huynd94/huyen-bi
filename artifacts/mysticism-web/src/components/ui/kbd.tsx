import { cn } from "@/lib/utils"

/**
 * Kbd — wrap phần tử `<kbd>` chuẩn HTML để hiển thị phím bấm/shortcut.
 *
 * Mục đích: minh hoạ các phím tắt (ví dụ `Ctrl + K`) trong UI hướng dẫn,
 * tooltip hoặc command palette với style đồng nhất theo hệ design.
 *
 * Lưu ý a11y: phần tử `<kbd>` đã có ngữ nghĩa "keyboard input"; screen
 * reader sẽ đọc đúng nội dung bên trong. Thiết kế đặt `pointer-events-none`
 * để không cản trở thao tác chuột với phần tử cha. Khi nhóm nhiều phím,
 * dùng `KbdGroup` để screen reader hiểu là một tổ hợp duy nhất; nội dung
 * vẫn nên là text thuần (ví dụ "Ctrl") thay vì biểu tượng đơn lẻ.
 *
 * @example
 * ```tsx
 * <KbdGroup>
 *   <Kbd>Ctrl</Kbd>
 *   <span aria-hidden>+</span>
 *   <Kbd>K</Kbd>
 * </KbdGroup>
 * ```
 */
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "bg-muted text-muted-foreground pointer-events-none inline-flex h-5 w-fit min-w-5 select-none items-center justify-center gap-1 rounded-sm px-1 font-sans text-xs font-medium",
        "[&_svg:not([class*='size-'])]:size-3",
        "[[data-slot=tooltip-content]_&]:bg-background/20 [[data-slot=tooltip-content]_&]:text-background dark:[[data-slot=tooltip-content]_&]:bg-background/10",
        className
      )}
      {...props}
    />
  )
}

/**
 * KbdGroup — container ngang gom nhiều `Kbd` thành một tổ hợp phím.
 *
 * Mục đích: trình bày các shortcut nhiều phím (ví dụ `Cmd + Shift + P`)
 * với khoảng cách thống nhất và bao bọc ngữ nghĩa duy nhất.
 *
 * Lưu ý a11y: phần tử dùng tag `<kbd>` lồng nhau, hợp lệ về mặt HTML
 * và giúp công cụ trợ năng nhận diện đây là khối input bàn phím.
 */
function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <kbd
      data-slot="kbd-group"
      className={cn("inline-flex items-center gap-1", className)}
      {...props}
    />
  )
}

export { Kbd, KbdGroup }
