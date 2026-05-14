"use client"

import { GripVertical } from "lucide-react"
import * as ResizablePrimitive from "react-resizable-panels"

import { cn } from "@/lib/utils"

/**
 * ResizablePanelGroup — container của hệ resizable, bọc nhiều `ResizablePanel`.
 *
 * Mục đích: tạo bố cục chia đôi/ba có thể kéo thay đổi kích thước, dùng cho
 * các trang có sidebar tuỳ biến hoặc khu so sánh nội dung.
 *
 * Lưu ý a11y: hướng layout được điều khiển qua prop `direction="horizontal"`
 * hoặc `"vertical"`. `react-resizable-panels` tự cấu hình `role="separator"`
 * và `aria-orientation` cho handle, hỗ trợ phím mũi tên để điều chỉnh kích
 * thước panel. Khi dùng làm phân vùng chính, gắn `aria-label` cho từng
 * panel để screen reader phân biệt được.
 *
 * @example
 * ```tsx
 * <ResizablePanelGroup direction="horizontal">
 *   <ResizablePanel defaultSize={30}>Sidebar</ResizablePanel>
 *   <ResizableHandle withHandle />
 *   <ResizablePanel>Nội dung lá số</ResizablePanel>
 * </ResizablePanelGroup>
 * ```
 */
const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
  <ResizablePrimitive.PanelGroup
    className={cn(
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
      className
    )}
    {...props}
  />
)

/**
 * ResizablePanel — một panel con bên trong `ResizablePanelGroup`.
 *
 * Mục đích: bọc nội dung có thể thay đổi kích thước, có thể chỉ định
 * `defaultSize`, `minSize`, `maxSize` (đơn vị %) và `collapsible`.
 *
 * Lưu ý a11y: panel là vùng nội dung, không có vai trò ARIA mặc định.
 * Khi panel có thể thu gọn, cân nhắc gắn `aria-label` mô tả nội dung
 * cho người dùng trợ năng biết phần nào đang bị thu/giãn.
 */
const ResizablePanel = ResizablePrimitive.Panel

/**
 * ResizableHandle — thanh kéo giữa hai panel để chỉnh kích thước.
 *
 * Mục đích: cung cấp điểm tương tác kéo/keyboard để người dùng phân chia
 * lại không gian giữa các panel. Khi `withHandle = true`, hiển thị icon
 * grip giúp người dùng nhận biết vị trí kéo.
 *
 * Lưu ý a11y: handle render với `role="separator"` (do thư viện gốc
 * cung cấp) và hỗ trợ phím `Arrow` để di chuyển. Đảm bảo focus ring
 * được giữ rõ ràng (đã có `focus-visible:ring-1 focus-visible:ring-ring`)
 * để người dùng bàn phím nhìn thấy. Icon grip set `aria-hidden` ngầm
 * vì thuần trang trí.
 */
const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
  withHandle?: boolean
}) => (
  <ResizablePrimitive.PanelResizeHandle
    className={cn(
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
      className
    )}
    {...props}
  >
    {withHandle && (
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.PanelResizeHandle>
)

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
