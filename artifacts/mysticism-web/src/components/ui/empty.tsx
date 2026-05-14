import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Empty — container hiển thị trạng thái rỗng (không có dữ liệu).
 *
 * Mục đích: đóng vai trò khung ngoài cho khu vực thông báo "không có nội
 * dung", thường gồm một icon, tiêu đề, mô tả và một CTA. Dùng khi danh
 * sách lá số, lịch sử bốc bài hoặc kết quả tìm kiếm trống.
 *
 * Lưu ý a11y: Empty là một vùng nội dung trang trí + thông tin; mặc định
 * không thêm `role`. Khi cần thông báo cho screen reader rằng khu vực này
 * đang ở trạng thái rỗng, gắn `role="status"` hoặc `aria-live="polite"`
 * tại Empty (hoặc bên trong `EmptyTitle`/`EmptyDescription`) để tin được
 * đọc khi state thay đổi.
 *
 * @example
 * ```tsx
 * <Empty>
 *   <EmptyHeader>
 *     <EmptyMedia variant="icon"><Inbox /></EmptyMedia>
 *     <EmptyTitle>Chưa có lá số nào</EmptyTitle>
 *     <EmptyDescription>Hãy bốc lá đầu tiên để bắt đầu.</EmptyDescription>
 *   </EmptyHeader>
 *   <EmptyContent>
 *     <Button>Bốc bài ngay</Button>
 *   </EmptyContent>
 * </Empty>
 * ```
 */
function Empty({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty"
      className={cn(
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 text-balance rounded-lg border-dashed p-6 text-center md:p-12",
        className
      )}
      {...props}
    />
  )
}

/**
 * EmptyHeader — phần đầu của `Empty`, gom icon + title + description.
 *
 * Mục đích: nhóm các phần tử trình bày tiêu đề trạng thái rỗng theo cột,
 * canh giữa và giới hạn bề ngang để dễ đọc.
 *
 * Lưu ý a11y: là wrapper trình bày, không thêm role. Đảm bảo bên trong
 * có một heading (qua `EmptyTitle`) để người dùng trợ năng nắm cấu trúc.
 */
function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn(
        "flex max-w-sm flex-col items-center gap-2 text-center",
        className
      )}
      {...props}
    />
  )
}

const emptyMediaVariants = cva(
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-transparent",
        icon: "bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg:not([class*='size-'])]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * EmptyMedia — vùng hiển thị media (icon hoặc minh hoạ) cho `Empty`.
 *
 * Mục đích: bọc icon hoặc ảnh minh hoạ trạng thái rỗng. Variant `icon`
 * tạo nền tròn nhỏ làm nổi icon; variant `default` không có nền.
 *
 * Lưu ý a11y: media thường mang tính trang trí; nếu icon SVG bên trong
 * không đóng vai trò thông tin chính, đặt `aria-hidden` cho SVG đó để
 * tránh đọc dư thừa. Nếu là ảnh có ngữ nghĩa, dùng `<img alt>` thật.
 */
function EmptyMedia({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
  return (
    <div
      data-slot="empty-icon"
      data-variant={variant}
      className={cn(emptyMediaVariants({ variant, className }))}
      {...props}
    />
  )
}

/**
 * EmptyTitle — tiêu đề chính cho trạng thái rỗng.
 *
 * Mục đích: hiển thị câu nhận diện trạng thái (ví dụ "Không có kết quả").
 *
 * Lưu ý a11y: mặc định render `<div>`. Nếu Empty là khu vực landmark
 * chính của trang, cân nhắc đổi tag thành `<h2>`/`<h3>` (qua `asChild`
 * của framework hoặc bọc heading riêng) để screen reader có cấu trúc
 * heading rõ ràng.
 */
function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-title"
      className={cn("text-lg font-medium tracking-tight", className)}
      {...props}
    />
  )
}

/**
 * EmptyDescription — mô tả phụ giải thích trạng thái rỗng.
 *
 * Mục đích: cho thông tin bổ sung (vì sao trống, gợi ý hành động kế tiếp).
 * Hỗ trợ link inline với gạch chân và màu primary khi hover.
 *
 * Lưu ý a11y: link bên trong giữ underline mặc định để dễ phân biệt khỏi
 * text thường, đáp ứng tiêu chí "không chỉ dùng màu để truyền tải nghĩa".
 */
function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <div
      data-slot="empty-description"
      className={cn(
        "text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4",
        className
      )}
      {...props}
    />
  )
}

/**
 * EmptyContent — vùng chứa CTA hoặc hành động kế tiếp dưới phần header.
 *
 * Mục đích: nhóm các button/link gợi ý hành động (ví dụ "Tạo lá số đầu tiên")
 * theo cột, canh giữa, có khoảng cách đều với header phía trên.
 *
 * Lưu ý a11y: là vùng tương tác — đảm bảo các button bên trong có nhãn
 * rõ ràng và tab order tự nhiên (theo thứ tự DOM).
 */
function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn(
        "flex w-full min-w-0 max-w-sm flex-col items-center gap-4 text-balance text-sm",
        className
      )}
      {...props}
    />
  )
}

export {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
  EmptyMedia,
}
