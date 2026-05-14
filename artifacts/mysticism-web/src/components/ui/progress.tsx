"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

/**
 * Progress — thanh tiến trình tuyến tính dựa trên Radix Progress.
 *
 * Mục đích: hiển thị tiến độ một thao tác xác định (uploading, đang
 * chấm bài, render lá số,...). Giá trị `value` từ 0–100; khi `null`
 * hoặc `undefined` Radix chuyển sang trạng thái indeterminate.
 *
 * Props: kế thừa props của `ProgressPrimitive.Root` —
 * - `value`: phần trăm hoàn thành (0–100). `undefined` ⇒ indeterminate.
 * - `max`: giá trị tối đa (mặc định 100).
 * - `getValueLabel`: hàm tạo nhãn `aria-valuetext` tuỳ biến.
 *
 * Lưu ý a11y: Radix tự gắn `role="progressbar"` cùng `aria-valuemin`,
 * `aria-valuemax`, `aria-valuenow`. Khi dùng cho hành động dài, nên
 * cặp với label mô tả (ví dụ `<Label>Đang tải...</Label>`) để screen
 * reader đọc rõ ngữ cảnh.
 *
 * @example
 * ```tsx
 * <Progress value={uploadPercent} aria-label="Tiến độ tải lên" />
 * ```
 */
const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>
>(({ className, value, ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
      className
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className="h-full w-full flex-1 bg-primary transition-all"
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </ProgressPrimitive.Root>
))
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
