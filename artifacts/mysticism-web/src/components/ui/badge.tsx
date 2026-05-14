import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Recipe class-variance-authority cho {@link Badge}.
 *
 * Mọi biến thể đều dùng design token (`bg-primary`, `bg-secondary`,
 * `bg-destructive`, `--badge-outline`) và tránh shadow-xl/2xl theo lint
 * `no-banned-shadow`. Hover thực hiện qua tiện ích `hover-elevate` thay vì
 * thay đổi màu nền để giữ tương phản WCAG ổn định trên cả light/dark.
 *
 * Export riêng giúp các primitive khác (`<Pagination>`, `<Tabs>`,…) tái sử
 * dụng cùng kiểu chữ và viền mà không cần render `<Badge>` thật.
 *
 * @example
 * ```tsx
 * <span className={cn(badgeVariants({ variant: "secondary" }))}>Beta</span>
 * ```
 */
const badgeVariants = cva(
  // @replit
  // Whitespace-nowrap: Badges should never wrap.
  "whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" +
  " hover-elevate ",
  {
    variants: {
      variant: {
        default:
          // @replit shadow-xs instead of shadow, no hover because we use hover-elevate
          "border-transparent bg-primary text-primary-foreground shadow-xs",
        secondary:
          // @replit no hover because we use hover-elevate
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          // @replit shadow-xs instead of shadow, no hover because we use hover-elevate
          "border-transparent bg-destructive text-destructive-foreground shadow-xs",
          // @replit shadow-xs" - use badge outline variable
        outline: "text-foreground border [border-color:var(--badge-outline)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Props của {@link Badge}.
 *
 * Mở rộng `<div>` chuẩn cộng với prop `variant` từ {@link badgeVariants}.
 * Component không phải interactive primitive — không tự thêm
 * `role="button"`. Khi cần hành động, bọc Badge trong `<button>` hoặc
 * `<a>`.
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Nhãn ngắn (Badge) hiển thị trạng thái, thẻ phân loại, hoặc đánh dấu mới.
 *
 * Render `<div>` không-tương-tác có thang chữ `text-xs`, `font-semibold`
 * và bám design token màu nền/foreground (`primary`, `secondary`,
 * `destructive`, `outline`). Sử dụng `whitespace-nowrap` để không bao giờ
 * xuống dòng — Badge ngắn theo thiết kế.
 *
 * Lưu ý a11y:
 * - Khi nội dung chỉ là icon hoặc số đếm (ví dụ `<Badge>3</Badge>`), bao
 *   ngoài bằng `<span aria-label="3 thông báo">` hoặc thêm
 *   `aria-label`/`role="status"` để screen reader hiểu ngữ cảnh.
 * - Variant `outline` dùng `border-color: var(--badge-outline)` để giữ
 *   tương phản viền ≥ 3:1 trên cả light/dark theme (WCAG 1.4.11).
 *
 * @example
 * ```tsx
 * <Badge>Mới</Badge>
 * <Badge variant="destructive">Hết hạn</Badge>
 * ```
 */
function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
