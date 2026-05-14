import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Spinner — biểu tượng loading xoay (Loader2 từ lucide-react).
 *
 * Mục đích: hiển thị trạng thái đang tải nhỏ gọn, dùng inline trong button,
 * danh sách hoặc khu vực fetch dữ liệu (ví dụ trong khi gọi API bốc bài).
 *
 * Lưu ý a11y: đã set `role="status"` và `aria-label="Loading"` để screen
 * reader thông báo trạng thái đang tải. Khi dùng làm con của một button,
 * cân nhắc thêm `aria-busy` cho button cha và ẩn label trùng lặp bằng
 * `aria-hidden` để tránh đọc trùng. Tôn trọng `prefers-reduced-motion`
 * thông qua tiện ích `motion-safe:animate-spin` nếu cần.
 *
 * @example
 * ```tsx
 * <Button disabled aria-busy>
 *   <Spinner aria-hidden className="mr-2" />
 *   Đang tải lá số...
 * </Button>
 * ```
 */
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <Loader2Icon
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
