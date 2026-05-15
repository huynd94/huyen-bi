import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Props for {@link SkipLink}.
 *
 * Skip link là một `<a>` được render đầu tiên trong cây DOM của mọi trang.
 * Mặc định nó "ẩn về mặt thị giác" với người dùng chuột nhưng vẫn nằm trong
 * tab order; khi nhận focus đầu tiên (tab lần đầu của bàn phím) nó hiện lên
 * và cho phép người dùng nhảy thẳng tới khu vực nội dung chính, bỏ qua
 * navbar và breadcrumb.
 */
export interface SkipLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  /**
   * `id` của phần tử nội dung chính trên trang. Skip link sẽ navigate tới
   * `#${targetId}` qua hash navigation chuẩn của trình duyệt.
   *
   * Phần tử đích nên có cùng `id` và `tabIndex={-1}` để có thể nhận focus
   * theo lập trình sau khi hash thay đổi (xem task 8.6).
   *
   * @defaultValue `"main"`
   */
  targetId?: string
}

/**
 * Skip link tuân thủ WCAG 2.4.1 — "Bỏ qua điều hướng, đến nội dung chính".
 *
 * Render một `<a>` ẩn (qua `sr-only`) cho người dùng chuột; khi người dùng
 * bàn phím nhấn `Tab` lần đầu, link nhận focus và bật visible (`focus:not-sr-only`)
 * ở góc trên-trái viewport với nền `--background`, viền `--border`, và
 * focus ring `--ring` để đạt độ tương phản ≥ 3:1 trong cả light và dark mode.
 *
 * Click hoặc nhấn `Enter` sẽ navigate tới `#${targetId}` (mặc định `#main`),
 * đưa focus về phần tử có id tương ứng (yêu cầu phần tử đích đặt
 * `tabIndex={-1}` — phần này thuộc task 8.6).
 *
 * Component chỉ dùng design tokens (`bg-background`, `text-foreground`,
 * `border-border`, `ring-ring`), không có giá trị màu hard-code.
 *
 * @example
 * ```tsx
 * // Trong root layout, ngay sau <body>:
 * <SkipLink />
 * <Navbar />
 * <main id="main" tabIndex={-1}>...</main>
 * ```
 *
 * Validates: Requirements 3.10.
 */
export const SkipLink = React.forwardRef<HTMLAnchorElement, SkipLinkProps>(
  ({ targetId = "main", className, children, ...props }, ref) => {
    return (
      <a
        ref={ref}
        href={`#${targetId}`}
        className={cn(
          // Ẩn mặc định, hiện khi nhận focus.
          "sr-only focus:not-sr-only",
          // Định vị trên cùng bên trái viewport khi hiện.
          "focus:fixed focus:left-4 focus:top-4 focus:z-50",
          // Ngoại hình: nền + viền + chữ dùng design tokens.
          "focus:inline-flex focus:items-center focus:rounded-md focus:border focus:border-border focus:bg-background focus:px-4 focus:py-2",
          "focus:text-sm focus:font-medium focus:text-foreground",
          // Focus ring đạt contrast ≥ 3:1 với nền (Requirement 3.2).
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          className
        )}
        {...props}
      >
        {children ?? "Bỏ qua điều hướng, đến nội dung chính"}
      </a>
    )
  }
)
SkipLink.displayName = "SkipLink"
