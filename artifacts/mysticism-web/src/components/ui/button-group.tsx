import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

/**
 * CVA recipe cho {@link ButtonGroup}: tạo nhóm button dính liền nhau
 * (segmented control) bằng cách bỏ bo góc và viền giáp ranh.
 *
 * - `horizontal` — mặc định, các button xếp ngang.
 * - `vertical`   — xếp dọc, dùng cho menu mobile compact.
 */
const buttonGroupVariants = cva(
  "flex w-fit items-stretch has-[>[data-slot=button-group]]:gap-2 [&>*]:focus-visible:relative [&>*]:focus-visible:z-10 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
  {
    variants: {
      orientation: {
        horizontal:
          "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
        vertical:
          "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
    },
  }
)

/**
 * Nhóm các `<Button>` (hoặc input/select) thành segmented control.
 *
 * Mục đích: gộp nhiều hành động liên quan vào cùng cụm UI mà
 * bỏ vạch ngăn lặp lại (border-radius giữa các button).
 *
 * Props:
 * - `orientation`: `"horizontal" | "vertical"` (mặc định `"horizontal"`).
 * - Tất cả thuộc tính `<div>` chuẩn.
 *
 * Lưu ý a11y: render `<div role="group">` — khi nhóm có ngữ nghĩa
 * (ví dụ "Lọc theo trạng thái"), gắn `aria-label` để screen reader
 * thông báo nhóm đó. Tab order vẫn theo từng button con.
 *
 * @example
 * ```tsx
 * <ButtonGroup aria-label="Lọc">
 *   <Button>Tất cả</Button>
 *   <Button>Chưa xem</Button>
 *   <Button>Đã xem</Button>
 * </ButtonGroup>
 * ```
 */
function ButtonGroup({
  className,
  orientation,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>) {
  return (
    <div
      role="group"
      data-slot="button-group"
      data-orientation={orientation}
      className={cn(buttonGroupVariants({ orientation }), className)}
      {...props}
    />
  )
}

/**
 * Khối text/icon tĩnh hiển thị bên trong {@link ButtonGroup} (ví dụ:
 * "https://" cố định trước input URL). Hỗ trợ `asChild` để đổi sang
 * thẻ ngữ nghĩa tuỳ ý.
 */
function ButtonGroupText({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & {
  asChild?: boolean
}) {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      className={cn(
        "bg-muted shadow-xs flex items-center gap-2 rounded-md border px-4 text-sm font-medium [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none",
        className
      )}
      {...props}
    />
  )
}

/**
 * Vạch ngăn cách giữa hai vùng trong {@link ButtonGroup}. Wrapper mỏng
 * quanh `<Separator>` với `orientation` mặc định `"vertical"`.
 */
function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        "bg-input relative !m-0 self-stretch data-[orientation=vertical]:h-auto",
        className
      )}
      {...props}
    />
  )
}

export {
  ButtonGroup,
  ButtonGroupSeparator,
  ButtonGroupText,
  buttonGroupVariants,
}
