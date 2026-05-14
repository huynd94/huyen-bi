import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * Class-variance-authority registry for {@link Skeleton}.
 *
 * Mỗi biến thể chỉ dùng design token (`bg-primary/10`, `rounded-{md|lg}`,
 * thang spacing chuẩn của Tailwind) — không có giá trị màu hard-code, không
 * dùng arbitrary value.
 *
 * - `default`  — placeholder nguyên tử có kích thước do `className` quyết
 *                định, dùng để ghép thành các skeleton tuỳ biến.
 * - `card`     — khối hình thẻ, kích thước mặc định khớp `Card` cỡ trung;
 *                ghép cùng {@link SkeletonCard} cho silhouette đầy đủ.
 * - `chart`    — khối rộng có chiều cao đồ thị tiêu chuẩn (`h-64`).
 * - `list-row` — hàng ngắn dùng cho danh sách (lịch sử tra cứu, lá số đã lưu).
 *
 * Animation `animate-pulse` được tự động vô hiệu khi người dùng có thiết lập
 * `prefers-reduced-motion: reduce` thông qua biến thể `motion-reduce:` của
 * Tailwind (Requirement 9.x — Reduced_Motion_User).
 *
 * @public
 */
export const skeletonVariants = cva(
  "block bg-primary/10 animate-pulse motion-reduce:animate-none",
  {
    variants: {
      variant: {
        default: "rounded-md",
        card: "h-32 w-full rounded-lg",
        chart: "h-64 w-full rounded-lg",
        "list-row": "h-10 w-full rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

/**
 * Props cho {@link Skeleton} — placeholder nguyên tử.
 *
 * Kế thừa toàn bộ thuộc tính `<div>` của HTML và prop `variant` từ
 * {@link skeletonVariants}. Có thể override `role` hoặc `aria-busy` nếu cần
 * (ví dụ: khi nhúng nhiều Skeleton nguyên tử bên trong một wrapper đã đảm
 * nhiệm trạng thái loading — đặt `role="presentation"` và
 * `aria-hidden={true}` cho các block bên trong để tránh screen reader thông
 * báo trùng lặp).
 *
 * @public
 */
export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

/**
 * Skeleton placeholder mờ pulse, dùng thay spinner cho khung dữ liệu lớn
 * trong khi tải nền (Requirement 5.1).
 *
 * Mặc định gắn `role="status"` và `aria-busy="true"` trên container theo
 * Requirement 5.8 (Loading_State a11y) — trình đọc màn hình sẽ thông báo
 * "đang bận" cho khu vực đang tải. Cả hai thuộc tính có thể bị ghi đè qua
 * prop để hỗ trợ trường hợp ghép nhiều Skeleton trong một khối loading
 * chung (xem {@link SkeletonCard}, {@link SkeletonChart},
 * {@link SkeletonListRow}).
 *
 * Animation `animate-pulse` được tự động tắt khi
 * `prefers-reduced-motion: reduce`.
 *
 * @example Skeleton tuỳ biến
 * ```tsx
 * <Skeleton className="h-4 w-32" />
 * ```
 *
 * @example Dùng biến thể có sẵn
 * ```tsx
 * <Skeleton variant="card" />
 * ```
 *
 * @example Khi lồng trong một wrapper đã có `role="status"` ở ngoài
 * ```tsx
 * <div role="status" aria-busy>
 *   <Skeleton aria-hidden role="presentation" className="h-4 w-24" />
 *   <Skeleton aria-hidden role="presentation" className="h-4 w-40" />
 * </div>
 * ```
 *
 * Validates: Requirements 5.1, 5.8.
 *
 * @public
 */
export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      className,
      variant,
      role,
      "aria-busy": ariaBusy,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role={role ?? "status"}
        aria-busy={ariaBusy ?? true}
        className={cn(skeletonVariants({ variant }), className)}
        {...props}
      />
    )
  }
)
Skeleton.displayName = "Skeleton"

/**
 * Props cho các skeleton composite ({@link SkeletonCard},
 * {@link SkeletonChart}, {@link SkeletonListRow}).
 *
 * @public
 */
export interface SkeletonCompositeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Nhãn tiếng Việt được phát qua `sr-only` để screen reader đọc khi vùng
   * loading nhận focus hoặc thay đổi.
   *
   * @defaultValue `"Đang tải dữ liệu…"` (mặc định riêng cho từng composite)
   */
  loadingLabel?: string
}

/**
 * Skeleton composite mô phỏng một `Card` với tiêu đề và 3 dòng nội dung.
 *
 * Container ngoài giữ `role="status"` + `aria-busy="true"` đại diện cho
 * toàn bộ khối loading; các Skeleton nguyên tử bên trong được đặt
 * `role="presentation"` + `aria-hidden="true"` để screen reader chỉ thông
 * báo một lần (qua nhãn `sr-only`).
 *
 * Khung viền và nền dùng các token `--card`, `--card-border` để khớp với
 * `Card` thật khi nội dung được tải xong.
 *
 * @example
 * ```tsx
 * {isLoading ? <SkeletonCard /> : <ResultCard data={data} />}
 * ```
 *
 * Validates: Requirements 5.1, 5.8.
 *
 * @public
 */
export const SkeletonCard = React.forwardRef<
  HTMLDivElement,
  SkeletonCompositeProps
>(({ className, loadingLabel = "Đang tải nội dung…", ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="status"
      aria-busy={true}
      className={cn(
        "rounded-lg border border-card-border bg-card p-6 space-y-3",
        className
      )}
      {...props}
    >
      <Skeleton role="presentation" aria-hidden={true} className="h-5 w-1/3" />
      <Skeleton role="presentation" aria-hidden={true} className="h-4 w-full" />
      <Skeleton role="presentation" aria-hidden={true} className="h-4 w-5/6" />
      <Skeleton role="presentation" aria-hidden={true} className="h-4 w-2/3" />
      <span className="sr-only">{loadingLabel}</span>
    </div>
  )
})
SkeletonCard.displayName = "SkeletonCard"

/**
 * Skeleton composite mô phỏng một biểu đồ (chart) với nhãn legend ngắn ở
 * trên và khu vực canvas chính bên dưới.
 *
 * Phù hợp dùng làm `Suspense fallback` cho các chart `recharts` lazy-load
 * (xem `design.md` mục Component map → Skeleton). Container giữ
 * `role="status"` + `aria-busy="true"`; các block bên trong ẩn khỏi
 * screen reader.
 *
 * @example
 * ```tsx
 * <Suspense fallback={<SkeletonChart />}>
 *   <RadarChart data={data} />
 * </Suspense>
 * ```
 *
 * Validates: Requirements 5.1, 5.8.
 *
 * @public
 */
export const SkeletonChart = React.forwardRef<
  HTMLDivElement,
  SkeletonCompositeProps
>(({ className, loadingLabel = "Đang tải biểu đồ…", ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="status"
      aria-busy={true}
      className={cn(
        "rounded-lg border border-card-border bg-card p-4 space-y-4",
        className
      )}
      {...props}
    >
      <Skeleton role="presentation" aria-hidden={true} className="h-4 w-1/4" />
      <Skeleton
        role="presentation"
        aria-hidden={true}
        variant="chart"
      />
      <span className="sr-only">{loadingLabel}</span>
    </div>
  )
})
SkeletonChart.displayName = "SkeletonChart"

/**
 * Skeleton composite cho một hàng danh sách: avatar/icon tròn ở đầu hàng,
 * theo sau là hai dòng văn bản (tiêu đề + phụ đề).
 *
 * Dùng cho Empty/Loading state của lịch sử tra cứu, lá số đã lưu, kết quả
 * tìm kiếm `tu-dien` — Requirement 5.1 yêu cầu không hiển thị spinner toàn
 * trang cho danh sách quá 3 mục.
 *
 * Container giữ `role="status"` + `aria-busy="true"` (Requirement 5.8); các
 * Skeleton nguyên tử bên trong ẩn khỏi screen reader để tránh trùng lặp.
 *
 * @example
 * ```tsx
 * <ul>
 *   {Array.from({ length: 5 }).map((_, i) => (
 *     <li key={i}>
 *       <SkeletonListRow />
 *     </li>
 *   ))}
 * </ul>
 * ```
 *
 * Validates: Requirements 5.1, 5.8.
 *
 * @public
 */
export const SkeletonListRow = React.forwardRef<
  HTMLDivElement,
  SkeletonCompositeProps
>(({ className, loadingLabel = "Đang tải mục…", ...props }, ref) => {
  return (
    <div
      ref={ref}
      role="status"
      aria-busy={true}
      className={cn("flex items-center gap-3 py-3", className)}
      {...props}
    >
      <Skeleton
        role="presentation"
        aria-hidden={true}
        className="size-10 rounded-full"
      />
      <div className="flex-1 space-y-2">
        <Skeleton
          role="presentation"
          aria-hidden={true}
          className="h-4 w-1/3"
        />
        <Skeleton
          role="presentation"
          aria-hidden={true}
          className="h-3 w-1/2"
        />
      </div>
      <span className="sr-only">{loadingLabel}</span>
    </div>
  )
})
SkeletonListRow.displayName = "SkeletonListRow"
