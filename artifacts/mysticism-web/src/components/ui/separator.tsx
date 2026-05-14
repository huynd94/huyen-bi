import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

/**
 * Separator — đường phân tách dựa trên Radix Separator.
 *
 * Mục đích: chia tách trực quan giữa các nhóm nội dung (giữa hai khối
 * trong card, giữa các action trong toolbar). Mặc định `decorative=true`
 * để screen reader bỏ qua; đặt `decorative={false}` khi cần biểu thị
 * ranh giới ngữ nghĩa thực sự.
 *
 * Props:
 * - `orientation`: `"horizontal" | "vertical"` — mặc định `"horizontal"`.
 * - `decorative`: `boolean` — mặc định `true`. Nếu `false`, Radix gắn
 *   `role="separator"` + `aria-orientation` để được hỗ trợ trợ năng.
 *
 * Lưu ý a11y: với separator dọc bên trong toolbar/menu, nên đặt
 * `decorative={false}` để screen reader hiểu cấu trúc; mặc định
 * decorative chỉ phục vụ trang trí thuần tuý.
 *
 * @example
 * ```tsx
 * <div className="flex h-5 items-center gap-2">
 *   <span>Đăng nhập</span>
 *   <Separator orientation="vertical" />
 *   <span>Đăng ký</span>
 * </div>
 * ```
 */
const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, ...props },
    ref
  ) => (
    <SeparatorPrimitive.Root
      ref={ref}
      decorative={decorative}
      orientation={orientation}
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
