import * as React from "react"

import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

/**
 * Props của {@link ChartBase} — wrapper SVG chuẩn cho mọi biểu đồ trong
 * Result_Card (radar ngũ giác, donut ngũ hành, hào âm/dương, la bàn 8
 * hướng, biểu đồ điểm hợp tuổi).
 *
 * Kế thừa toàn bộ thuộc tính của `<svg>` (ngoại trừ `title` được dùng
 * cho `aria-label` thay vì thẻ `<title>` của SVG vì Radix tooltip /
 * trình đọc màn hình ưu tiên `aria-label` rõ ràng hơn).
 */
export interface ChartBaseProps
  extends Omit<React.SVGAttributes<SVGSVGElement>, "title"> {
  /**
   * Nhãn tiếng Việt mô tả nội dung biểu đồ — bắt buộc.
   *
   * Được gắn vào `aria-label` của `<svg>` để trình đọc màn hình đọc
   * khi biểu đồ nhận focus (Requirement 8.2). Ví dụ:
   * "Biểu đồ ngũ hành của Nguyễn Văn A: Kim 30%, Mộc 20%, Thủy 15%,
   * Hỏa 25%, Thổ 10%".
   */
  title: string

  /**
   * `viewBox` của SVG — định nghĩa hệ tọa độ logic.
   *
   * @defaultValue `"0 0 400 300"`
   */
  viewBox?: string

  /**
   * `preserveAspectRatio` của SVG — quy tắc co giãn khi container đổi
   * kích thước. Mặc định canh giữa và giữ tỉ lệ.
   *
   * @defaultValue `"xMidYMid meet"`
   */
  preserveAspectRatio?: string

  /**
   * Class áp lên div wrapper bên ngoài. Wrapper bật `overflow-x-auto`
   * trên Breakpoint_Mobile và `md:overflow-visible` từ tablet trở lên
   * để biểu đồ rộng vẫn cuộn ngang riêng (Requirement 4.4) mà không
   * phá layout trang.
   */
  wrapperClassName?: string

  /** Nội dung SVG (path, rect, circle, polygon, text…). */
  children: React.ReactNode
}

/**
 * `ChartBase` — wrapper SVG chuẩn cho mọi biểu đồ huyền học trong
 * Result_Card.
 *
 * Bộ scaffolding tự động:
 *
 * - `role="img"` + `aria-label` từ prop `title` để screen reader nhận
 *   diện đây là một biểu đồ và đọc mô tả tiếng Việt (Requirement 8.2).
 * - `width="100%"` + `viewBox` + `preserveAspectRatio` để biểu đồ co
 *   giãn theo container, không bị cắt và vẫn đọc được label trên
 *   Breakpoint_Mobile (Requirement 4.4).
 * - `fill="currentColor"` để màu sắc bám `text-foreground` của
 *   ResultCard và thay đổi mượt khi user chuyển light ↔ dark
 *   (Requirement 2.5).
 * - Wrapper `overflow-x-auto md:overflow-visible` cho phép biểu đồ
 *   rộng cuộn ngang riêng trên mobile.
 *
 * Mọi màu sắc trong biểu đồ phải dùng `currentColor` hoặc design
 * token (`stroke="currentColor"`, `fill="hsl(var(--primary))"`,…) —
 * không hard-code hex (Requirement 2.5, lint rule `no-hex-in-tsx`).
 *
 * @example Donut ngũ hành đơn giản
 * ```tsx
 * <ChartBase
 *   title="Biểu đồ ngũ hành: Kim 30%, Mộc 20%, Thủy 15%, Hỏa 25%, Thổ 10%"
 *   viewBox="0 0 200 200"
 * >
 *   <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="2" />
 *   <ChartSegment tooltip="Kim — 30%">
 *     <path d="M100,100 L100,20 A80,80 0 0,1 175,75 Z" fill="hsl(var(--primary))" />
 *   </ChartSegment>
 *   {/* các segment khác … *\/}
 * </ChartBase>
 * ```
 *
 * @example Radar ngũ giác
 * ```tsx
 * <ChartBase
 *   title="Biểu đồ năng lượng ngũ hành"
 *   viewBox="0 0 200 200"
 *   preserveAspectRatio="xMidYMid meet"
 * >
 *   <polygon
 *     points="100,20 175,80 145,170 55,170 25,80"
 *     fill="hsl(var(--primary) / 0.2)"
 *     stroke="currentColor"
 *     strokeWidth="1"
 *   />
 * </ChartBase>
 * ```
 *
 * Validates: Requirements 4.4, 8.2, 2.5.
 */
export const ChartBase = React.forwardRef<SVGSVGElement, ChartBaseProps>(
  (
    {
      title,
      viewBox = "0 0 400 300",
      preserveAspectRatio = "xMidYMid meet",
      wrapperClassName,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        data-slot="chart-base-wrapper"
        className={cn(
          "w-full overflow-x-auto md:overflow-visible",
          wrapperClassName,
        )}
      >
        <svg
          ref={ref}
          role="img"
          aria-label={title}
          width="100%"
          viewBox={viewBox}
          preserveAspectRatio={preserveAspectRatio}
          fill="currentColor"
          className={cn("block max-w-full text-foreground", className)}
          {...props}
        >
          {children}
        </svg>
      </div>
    )
  },
)
ChartBase.displayName = "ChartBase"

/**
 * Kiểu phần tử SVG con mà {@link ChartSegment} chấp nhận.
 *
 * Tách thành alias riêng để TypeScript không "nuốt" props khi clone —
 * `React.cloneElement` cần biết phần tử con có thể nhận `tabIndex`,
 * `className`, `aria-label`,…
 */
type ChartSegmentChild = React.ReactElement<
  React.SVGAttributes<SVGElement> & {
    tabIndex?: number
    "aria-label"?: string
  }
>

/**
 * Props của {@link ChartSegment}.
 */
export interface ChartSegmentProps {
  /**
   * Nội dung tooltip tiếng Việt — bắt buộc, mô tả giá trị số và ý
   * nghĩa của segment (ví dụ "Kim — 30 điểm — chủ đạo").
   *
   * Đồng thời được dùng làm `aria-label` mặc định nếu segment chưa có
   * `aria-label` riêng, để screen reader đọc khi segment nhận focus
   * (Requirement 3.9 — không truyền tải thông tin chỉ bằng màu sắc).
   */
  tooltip: string

  /**
   * Phần tử SVG đại diện cho segment — phải là **đúng một** phần tử
   * SVG (`path`, `rect`, `circle`, `polygon`, `g`,…). `ChartSegment`
   * sẽ clone phần tử này và bổ sung:
   *
   * - `tabIndex={0}` để keyboard có thể tab đến segment
   *   (Requirement 8.3).
   * - `aria-label={tooltip}` nếu chưa có.
   * - Class focus-visible dùng `outline-ring` cho focus ring 2px theo
   *   `--ring` token (Requirement 3.2).
   * - Class `cursor-pointer` để chuột chỉ đúng affordance.
   *
   * Mọi prop `onClick`, `onFocus`, `onMouseEnter` đã có trên phần tử
   * con sẽ được giữ nguyên — Radix `Slot` (qua `TooltipTrigger
   * asChild`) gộp event handlers thay vì ghi đè.
   */
  children: ChartSegmentChild

  /**
   * Vị trí của tooltip so với segment.
   *
   * @defaultValue `"top"`
   */
  side?: React.ComponentProps<typeof TooltipContent>["side"]

  /**
   * Khoảng cách từ tooltip tới segment (px).
   *
   * @defaultValue `4`
   */
  sideOffset?: number
}

/**
 * `ChartSegment` — wrapper Radix Tooltip + `tabIndex={0}` cho mỗi
 * phần tử SVG có thể tương tác trong biểu đồ huyền học (cánh radar,
 * mảnh donut, hướng la bàn, ô hợp tuổi…).
 *
 * Mục tiêu:
 *
 * - **Tooltip**: hiển thị giá trị số + mô tả tiếng Việt khi user hover
 *   hoặc focus segment (Requirement 8.3).
 * - **Keyboard**: gắn `tabIndex={0}` lên phần tử SVG con để user dùng
 *   bàn phím cũng truy cập được tooltip — yêu cầu cốt lõi của
 *   Requirement 8.3 ("cùng tooltip phải truy cập được bằng keyboard
 *   focus").
 * - **Screen reader**: gắn `aria-label={tooltip}` mặc định để segment
 *   có "accessible name" rõ ràng, không chỉ phụ thuộc vào màu
 *   (Requirement 3.9).
 * - **Focus ring**: dùng `outline` + `outline-ring` (token `--ring`,
 *   contrast ≥ 3:1) để keyboard user nhìn thấy segment nào đang được
 *   chọn (Requirement 3.2).
 *
 * Touch target: theo Requirement 4.4, vùng chạm của mỗi segment trên
 * Breakpoint_Mobile cần ≥ 44×44 logical pixels. Vì shape của segment
 * do consumer tự vẽ (path / rect / polygon), `ChartSegment` không
 * tự enlarge hit area — consumer chịu trách nhiệm thiết kế segment
 * đủ lớn (ví dụ donut bán kính ≥ 22 đơn vị viewBox khi viewBox 200,
 * hoặc bọc segment nhỏ trong `<g>` có `<rect>` trong suốt làm hit
 * area).
 *
 * @example Mảnh donut với tooltip
 * ```tsx
 * <ChartBase title="Phân bố ngũ hành">
 *   <ChartSegment tooltip="Kim — 30 điểm">
 *     <path
 *       d="M100,100 L100,20 A80,80 0 0,1 175,75 Z"
 *       fill="hsl(var(--primary))"
 *     />
 *   </ChartSegment>
 *   <ChartSegment tooltip="Mộc — 20 điểm" side="right">
 *     <path
 *       d="M100,100 L175,75 A80,80 0 0,1 145,170 Z"
 *       fill="hsl(var(--accent))"
 *     />
 *   </ChartSegment>
 * </ChartBase>
 * ```
 *
 * @example Hướng la bàn với hit area mở rộng cho mobile
 * ```tsx
 * <ChartSegment tooltip="Đông — Mộc khí vượng">
 *   <g>
 *     {/\* Hit area trong suốt ≥ 44px logical (Requirement 4.4) *\/}
 *     <rect x="160" y="80" width="48" height="48" fill="transparent" />
 *     {/\* Visual ngắn gọn *\/}
 *     <circle cx="184" cy="104" r="6" fill="currentColor" />
 *   </g>
 * </ChartSegment>
 * ```
 *
 * Validates: Requirements 8.3, 3.9, 3.2, 4.4.
 */
export function ChartSegment({
  tooltip,
  children,
  side = "top",
  sideOffset = 4,
}: ChartSegmentProps): React.ReactElement {
  // Yêu cầu đúng một phần tử SVG con — đảm bảo Radix Slot có thể merge
  // props mà không phải xử lý fragment.
  const segment = React.Children.only(children) as ChartSegmentChild

  const existingClassName =
    typeof segment.props.className === "string"
      ? segment.props.className
      : undefined

  const enhanced = React.cloneElement(segment, {
    tabIndex: segment.props.tabIndex ?? 0,
    // Dùng tooltip làm accessible name khi consumer chưa cấp aria-label
    // riêng — đảm bảo Requirement 3.9 (không chỉ truyền tải bằng màu).
    "aria-label": segment.props["aria-label"] ?? tooltip,
    className: cn(
      "cursor-pointer outline-none",
      // Focus ring 2px dùng token --ring (Requirement 3.2). Dùng
      // `outline-*` vì `ring-*` của Tailwind dựa trên box-shadow,
      // không hiển thị tin cậy trên phần tử SVG.
      "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
      existingClassName,
    ),
  })

  return (
    <Tooltip>
      <TooltipTrigger asChild>{enhanced}</TooltipTrigger>
      <TooltipContent side={side} sideOffset={sideOffset}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  )
}
