import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

/**
 * ItemGroup — container nhóm nhiều `Item` thành một danh sách.
 *
 * Mục đích: trình bày danh sách các item theo cột (ví dụ list lá số đã
 * lưu, list cài đặt). Đặt `role="list"` để screen reader hiểu cấu trúc.
 *
 * Lưu ý a11y: vì root đã set `role="list"`, các con `Item` trực tiếp nên
 * mang ý nghĩa "list item"; nếu không thêm role tự động, screen reader
 * vẫn xem chúng như mục trong list nhờ semantic của `role="list"` cha.
 */
function ItemGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="list"
      data-slot="item-group"
      className={cn("group/item-group flex flex-col", className)}
      {...props}
    />
  )
}

/**
 * ItemSeparator — đường kẻ ngang giữa các `Item` (dùng `Separator` Radix).
 *
 * Mục đích: phân tách trực quan giữa các item liên tiếp trong một group.
 *
 * Lưu ý a11y: `Separator` của Radix mặc định gắn `role="separator"`; nếu
 * separator chỉ mang tính trang trí, có thể truyền `decorative` để bỏ
 * role nhằm tránh ồn cho screen reader.
 */
function ItemSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="item-separator"
      orientation="horizontal"
      className={cn("my-0", className)}
      {...props}
    />
  )
}

const itemVariants = cva(
  "group/item [a]:hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-ring/50 [a]:transition-colors flex flex-wrap items-center rounded-md border border-transparent text-sm outline-none transition-colors duration-100 focus-visible:ring-[3px]",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        outline: "border-border",
        muted: "bg-muted/50",
      },
      size: {
        default: "gap-4 p-4 ",
        sm: "gap-2.5 px-4 py-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Item — một dòng/ô nội dung gồm media + title + description + actions.
 *
 * Mục đích: dùng cho các danh sách giàu thông tin (ví dụ từng lá bài
 * trong lịch sử rút, từng feature trong trang setting). Hỗ trợ `asChild`
 * để render dưới dạng `<a>`/`<button>` tuỳ ngữ cảnh.
 *
 * Lưu ý a11y: khi item là link/button (`asChild` với `<a>` hoặc
 * `<button>`), focus ring đã được cấu hình qua `focus-visible:ring`
 * giúp người dùng bàn phím dễ định vị. Đảm bảo nội dung text chính nằm
 * trong `ItemTitle` và mô tả phụ trong `ItemDescription` để screen reader
 * đọc theo thứ tự ngữ nghĩa.
 *
 * @example
 * ```tsx
 * <ItemGroup>
 *   <Item asChild>
 *     <a href="/readings/123">
 *       <ItemMedia variant="icon"><Sparkles /></ItemMedia>
 *       <ItemContent>
 *         <ItemTitle>Lá Tử Vi #123</ItemTitle>
 *         <ItemDescription>Bốc lúc 21:00 hôm qua</ItemDescription>
 *       </ItemContent>
 *       <ItemActions>
 *         <Button size="sm">Mở</Button>
 *       </ItemActions>
 *     </a>
 *   </Item>
 * </ItemGroup>
 * ```
 */
function Item({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof itemVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div"
  return (
    <Comp
      data-slot="item"
      data-variant={variant}
      data-size={size}
      className={cn(itemVariants({ variant, size, className }))}
      {...props}
    />
  )
}

const itemMediaVariants = cva(
  "flex shrink-0 items-center justify-center gap-2 group-has-[[data-slot=item-description]]/item:translate-y-0.5 group-has-[[data-slot=item-description]]/item:self-start [&_svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "bg-muted size-8 rounded-sm border [&_svg:not([class*='size-'])]:size-4",
        image:
          "size-10 overflow-hidden rounded-sm [&_img]:size-full [&_img]:object-cover",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * ItemMedia — vùng hiển thị media phụ ở đầu `Item` (icon, ảnh, hoặc SVG).
 *
 * Mục đích: chuẩn hoá kích thước và padding cho các loại media đi kèm
 * item: `default` (không nền), `icon` (khung 32px), `image` (khung 40px).
 *
 * Lưu ý a11y: media thường thuần trang trí; thêm `aria-hidden` cho SVG
 * khi item đã có tiêu đề mô tả đầy đủ. Với `<img>`, luôn cung cấp `alt`
 * (chuỗi rỗng nếu trang trí).
 */
function ItemMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>) {
  return (
    <div
      data-slot="item-media"
      data-variant={variant}
      className={cn(itemMediaVariants({ variant, className }))}
      {...props}
    />
  )
}

/**
 * ItemContent — vùng nội dung chính (title + description) của một `Item`.
 *
 * Mục đích: chiếm phần flex-1 còn lại trong item, xếp các text con theo
 * cột với khoảng cách hợp lý.
 *
 * Lưu ý a11y: là vùng trình bày, không thêm role. Khi đặt nhiều block
 * `ItemContent` cạnh nhau (ví dụ phần meta phụ ở phải), block kế tiếp
 * tự `flex-none` nhờ selector `[&+[data-slot=item-content]]:flex-none`.
 */
function ItemContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-content"
      className={cn(
        "flex flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none",
        className
      )}
      {...props}
    />
  )
}

/**
 * ItemTitle — tiêu đề ngắn của một item.
 *
 * Mục đích: dòng text chính nhận diện item; cho phép kèm icon nhỏ.
 *
 * Lưu ý a11y: render dưới dạng `<div>` không phải heading; nếu item nằm
 * trong landmark có cấu trúc heading riêng, không cần đổi tag. Khi cần
 * cấp bậc heading rõ ràng, bọc thêm `<h3>`/`<h4>` bên ngoài.
 */
function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-title"
      className={cn(
        "flex w-fit items-center gap-2 text-sm font-medium leading-snug",
        className
      )}
      {...props}
    />
  )
}

/**
 * ItemDescription — mô tả phụ cho một item.
 *
 * Mục đích: cung cấp ngữ cảnh thêm (ví dụ thời gian, trạng thái) bên
 * dưới `ItemTitle`. Tự động giới hạn 2 dòng (`line-clamp-2`).
 *
 * Lưu ý a11y: vì có `line-clamp` cắt nội dung, nội dung dài có thể bị
 * ẩn về mặt thị giác — đảm bảo text quan trọng nằm trong khoảng nhìn
 * thấy hoặc cung cấp tooltip để truy cập đầy đủ.
 */
function ItemDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="item-description"
      className={cn(
        "text-muted-foreground line-clamp-2 text-balance text-sm font-normal leading-normal",
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",
        className
      )}
      {...props}
    />
  )
}

/**
 * ItemActions — vùng chứa các nút thao tác ở cuối `Item`.
 *
 * Mục đích: nhóm các button thứ cấp (ví dụ "Mở", "Xoá") canh phải item
 * với khoảng cách đều.
 *
 * Lưu ý a11y: để không trùng nhãn với toàn bộ item (đặc biệt khi item
 * là link `asChild`), cân nhắc gắn `aria-label` mô tả ngữ cảnh hoặc
 * dùng `event.stopPropagation()` để click action không kích hoạt link
 * cha (tuỳ UX dự định).
 */
function ItemActions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-actions"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}

/**
 * ItemHeader — hàng header tuỳ chọn ở đầu một `Item` phức hợp.
 *
 * Mục đích: dùng cho các item nhiều dòng nơi cần dòng tiêu đề riêng,
 * ví dụ hiển thị nhãn + actions tách biệt khỏi body.
 *
 * Lưu ý a11y: là wrapper trình bày, không thêm role. Bên trong nếu có
 * heading thật sự, dùng tag heading chuẩn để giữ cấu trúc.
 */
function ItemHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-header"
      className={cn(
        "flex basis-full items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
}

/**
 * ItemFooter — hàng footer tuỳ chọn ở cuối một `Item` phức hợp.
 *
 * Mục đích: phù hợp cho meta phụ (ví dụ timestamp, badge trạng thái)
 * nằm dưới phần body chính của item.
 *
 * Lưu ý a11y: thuần wrapper trình bày, không thêm role.
 */
function ItemFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="item-footer"
      className={cn(
        "flex basis-full items-center justify-between gap-2",
        className
      )}
      {...props}
    />
  )
}

export {
  Item,
  ItemMedia,
  ItemContent,
  ItemActions,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  ItemDescription,
  ItemHeader,
  ItemFooter,
}
