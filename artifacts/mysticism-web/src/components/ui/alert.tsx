import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * CVA recipe cho {@link Alert}.
 *
 * - `default` — alert thông tin nền `--background`, viền nhẹ.
 * - `destructive` — alert lỗi/cảnh báo dùng token `--destructive` cho viền,
 *   chữ và icon.
 *
 * Selectors `[&>svg]:absolute …` đặt icon ở góc trái và pad nội dung
 * thuận tiện cho icon `lucide-react` cỡ `h-4 w-4`.
 */
const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Alert tĩnh hiển thị thông báo trạng thái (info / lỗi / cảnh báo).
 *
 * Mục đích: bao nhanh một khối thông báo có icon + tiêu đề + mô tả,
 * không tự động ẩn — khác với Toast (sonner). Dùng cho cảnh báo
 * inline như "Phiên đăng nhập đã hết hạn", "Không tìm thấy lá số",...
 *
 * Props:
 * - `variant`: `"default" | "destructive"` (mặc định `"default"`).
 * - Tất cả thuộc tính `<div>` chuẩn.
 *
 * Lưu ý a11y: render `<div role="alert">` nên trình đọc màn hình sẽ
 * thông báo nội dung khi component xuất hiện. Nếu component đã có sẵn
 * khi trang load, screen reader có thể không thông báo lại — trong
 * trường hợp đó dùng `<ErrorState>` (tự focus tiêu đề) hoặc Toast.
 *
 * @example
 * ```tsx
 * <Alert variant="destructive">
 *   <AlertCircle className="h-4 w-4" />
 *   <AlertTitle>Lỗi tải dữ liệu</AlertTitle>
 *   <AlertDescription>Vui lòng thử lại sau ít phút.</AlertDescription>
 * </Alert>
 * ```
 */
const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
))
Alert.displayName = "Alert"

/** Tiêu đề của {@link Alert}. Render `<h5>` với typography đậm. */
const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

/** Phần mô tả/chi tiết của {@link Alert}. Render `<div>` để chứa được `<p>` lồng. */
const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
