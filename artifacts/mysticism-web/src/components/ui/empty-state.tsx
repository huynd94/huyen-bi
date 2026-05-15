import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Props for {@link EmptyState}.
 *
 * Tất cả giá trị màu / khoảng cách được lấy từ design tokens; component
 * không nhận `style` ngoài để tránh hex / giá trị tuỳ ý.
 */
export interface EmptyStateProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title" | "role"> {
  /**
   * Icon minh hoạ căn giữa, hiển thị phía trên tiêu đề.
   * Khuyến nghị icon từ `lucide-react` (ngôi sao, mặt trăng, la bàn) thay vì emoji.
   */
  icon?: React.ReactNode
  /**
   * Tiêu đề tiếng Việt mô tả trạng thái rỗng. Render trong `<h3>`.
   */
  title: string
  /**
   * Một dòng mô tả ngắn (≤ 120 ký tự) giải thích nguyên nhân danh sách rỗng
   * và hành động được đề xuất tiếp theo.
   */
  description?: React.ReactNode
  /**
   * Khu vực hành động — thường là một CTA chính dẫn người dùng tới Module_Page
   * tương ứng (ví dụ "Bắt đầu tra cứu Bát Tự").
   */
  cta?: React.ReactNode
}

/**
 * Trạng thái rỗng (Empty State) hiển thị khi danh sách dữ liệu không có mục nào
 * (lịch sử tra cứu trống, không có lá số đã lưu, kết quả tìm kiếm `tu-dien` rỗng).
 *
 * Component gắn `role="status"` và `aria-live="polite"` để trình đọc màn hình
 * thông báo trạng thái khi nội dung được swap vào DOM mà không làm gián đoạn.
 *
 * Bố cục: icon căn giữa → tiêu đề `<h3>` → mô tả `<p>` → khu vực CTA.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   icon={<Sparkles aria-hidden="true" />}
 *   title="Chưa có lá số nào được lưu"
 *   description="Lưu kết quả tra cứu để xem lại bất cứ lúc nào."
 *   cta={<Button asChild><Link to="/than-so-hoc">Bắt đầu tra cứu</Link></Button>}
 * />
 * ```
 *
 * Validates: Requirements 5.7, 5.8.
 */
export const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, cta, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className={cn(
          "flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card/40 p-6 text-center md:p-12",
          className
        )}
        {...props}
      >
        {icon ? (
          <EmptyStateIcon aria-hidden="true">{icon}</EmptyStateIcon>
        ) : null}
        <div className="flex max-w-md flex-col items-center gap-2">
          <h3 className="text-lg font-semibold leading-tight tracking-tight text-foreground">
            {title}
          </h3>
          {description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        {cta ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {cta}
          </div>
        ) : null}
      </div>
    )
  }
)
EmptyState.displayName = "EmptyState"

/**
 * Vùng chứa icon trang trí của {@link EmptyState}, căn giữa với nền `bg-muted`.
 *
 * Tách thành component nội bộ để giữ kích thước icon nhất quán (size-6 trong
 * khung 10x10) và áp `aria-hidden` mặc định — icon thuần trang trí, không
 * thêm nội dung cho trình đọc màn hình.
 */
const EmptyStateIcon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    aria-hidden="true"
    className={cn(
      "flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6",
      className
    )}
    {...props}
  />
))
EmptyStateIcon.displayName = "EmptyStateIcon"
