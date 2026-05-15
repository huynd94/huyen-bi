import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card — container surface dùng cho khối nội dung độc lập
 * (lá số đã lưu, kết quả tra cứu, settings group,...).
 *
 * Mục đích: bao nội dung vào surface có viền, bo góc `rounded-xl`,
 * shadow nhẹ và bám token `--card` / `--card-foreground` để hoạt động
 * trên cả light/dark theme.
 *
 * Props: thuộc tính `<div>` chuẩn.
 *
 * Lưu ý a11y: Card không có role mặc định. Khi Card đại diện một mục
 * có thể chọn (chẳng hạn lá số có thể click), gắn `role="article"` /
 * `role="button"` + `tabIndex={0}` + handler bàn phím tương ứng.
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Lá số tháng 10</CardTitle>
 *     <CardDescription>Tử vi Hỷ thần</CardDescription>
 *   </CardHeader>
 *   <CardContent>...</CardContent>
 *   <CardFooter><Button>Xem chi tiết</Button></CardFooter>
 * </Card>
 * ```
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
))
Card.displayName = "Card"

/** Header section của {@link Card} — chứa Title và Description. */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

/**
 * Tiêu đề Card. Mặc định render `<div>` (không phải heading) để consumer
 * tự quyết định cấp độ heading; cân nhắc bọc bằng `<h2>`/`<h3>` cho ngữ
 * nghĩa đúng outline.
 */
const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

/** Mô tả phụ ngắn dưới title. Dùng `text-muted-foreground`. */
const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

/** Vùng nội dung chính của {@link Card}. */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

/** Footer chứa các nút hành động (xem chi tiết, lưu, chia sẻ,...). */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
