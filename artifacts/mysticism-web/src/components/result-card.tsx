import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Helper xác định một `ReactNode` có thực sự rỗng hay không. Một slot được
 * coi là rỗng khi:
 *
 * - `null` / `undefined` / `false` / `true`.
 * - Chuỗi rỗng hoặc chỉ chứa khoảng trắng.
 * - Mảng mà mọi phần tử đều rỗng (đệ quy).
 *
 * Nhờ vậy `ResultCard` có thể bỏ qua các slot khi consumer truyền điều kiện
 * (`aiSection={ai && <Markdown ... />}`) — không render container thừa và
 * không phá nhịp `space-y-*`.
 */
function isEmptySlot(node: React.ReactNode): boolean {
  if (node == null) return true
  if (typeof node === "boolean") return true
  if (typeof node === "string") return node.trim().length === 0
  if (Array.isArray(node)) return node.every(isEmptySlot)
  return false
}

/**
 * Props của {@link ResultCard}.
 *
 * Mỗi slot là một `ReactNode` tuỳ chọn — chỉ slot có nội dung mới render
 * (giữ Result_Card cân khi không có dữ liệu AI hay biểu đồ). Theo
 * Requirement 8.1, thứ tự đọc cố định là:
 *
 * 1. `header` — chủ thể tra cứu (tên / ngày sinh / ngữ cảnh).
 * 2. `keyNumbers` — số / ký tự / quẻ / cung tinh chính.
 * 3. `chart` — biểu đồ SVG (Chart_Base từ task 10.2).
 * 4. `table` — bảng dữ liệu (Data_Table từ task 10.3).
 * 5. `aiSection` — luận giải AI (Markdown_Renderer).
 * 6. `actions` — action group (Result_Actions từ task 9.2).
 *
 * Component bọc bằng `<article>` với `aria-labelledby` tự liên kết tới
 * `<h2>` của header (id sinh bằng `useId()` nếu consumer không cấp).
 */
export interface ResultCardProps
  extends Omit<React.HTMLAttributes<HTMLElement>, "title"> {
  /**
   * Chủ thể tra cứu. Nội dung được wrap bên trong `<h2>` của Result_Card —
   * consumer chỉ cần truyền text hoặc node inline (ví dụ
   * `<>Tử Vi Lá Số of <strong>Nguyễn Văn A</strong></>`). `<h1>` thuộc về
   * trang cha, `<h2>` thuộc về Result_Card.
   */
  header?: React.ReactNode
  /**
   * Mô tả phụ ngay dưới `<h2>` (ngày sinh, ngữ cảnh tra cứu, badge…). Render
   * trong `<p className="text-sm text-muted-foreground">`. Tuỳ chọn.
   */
  subheader?: React.ReactNode
  /**
   * Khu vực key numbers — các con số / ký tự / quẻ / cung tinh "đập vào mắt"
   * trước khi user đọc tới biểu đồ.
   */
  keyNumbers?: React.ReactNode
  /**
   * Slot biểu đồ SVG. Sẽ chứa `Chart_Base` (task 10.2) — consumer gắn
   * `role="img"` và `aria-label` cho `<svg>` bên trong (Requirement 8.2).
   */
  chart?: React.ReactNode
  /**
   * Slot bảng dữ liệu (`Data_Table` task 10.3). Mặc định `overflow-x-auto`
   * trên mobile để Requirement 4.1 / 8.4 được thoả.
   */
  table?: React.ReactNode
  /**
   * Slot AI luận giải (Markdown_Renderer). Render dưới `<section>` với
   * line-height đọc dài.
   */
  aiSection?: React.ReactNode
  /**
   * Slot action group (`Result_Actions` task 9.2). Render dưới `<footer>` với
   * border trên + flex justify-end (desktop) / full-width (mobile) theo
   * Requirement 8.6.
   */
  actions?: React.ReactNode
  /**
   * Cho phép override `id` của `<h2>` (mặc định sinh bằng `useId()`). Hữu
   * ích khi consumer cần liên kết thêm `aria-describedby` từ chỗ khác.
   */
  headerId?: string
}

/**
 * `ResultCard` — layout chuẩn để hiển thị kết quả tra cứu của mọi
 * Module_Page (Bát Tự, Tử Vi, Xem Quẻ, Phong Thuỷ, Xem Tên, Số Học,…).
 *
 * Component này là layout cố định duy nhất được dùng bởi 15 Module_Page.
 * Theo Requirement 8.1, thứ tự đọc luôn là:
 *
 * 1. `<header>` chủ thể (tên / ngày).
 * 2. Key numbers / ký tự / quẻ chính.
 * 3. SVG chart.
 * 4. Bảng dữ liệu chi tiết.
 * 5. AI luận giải (Markdown_Renderer).
 * 6. Action group (Lưu / Chia sẻ / Xuất).
 *
 * Mỗi slot là `ReactNode` tuỳ chọn — chỉ slot có nội dung mới render, nên
 * consumer có thể truyền `aiSection={ai && <Markdown ... />}` mà không phá
 * nhịp khoảng cách dọc.
 *
 * **A11y**: bọc trong `<article aria-labelledby={headerId}>`, header tự
 * render `<h2 id={headerId}>` (id sinh bằng `useId()` nếu consumer không
 * cấp). Trang cha vẫn giữ duy nhất một `<h1>`.
 *
 * **Tokens**: `bg-card`, `text-card-foreground`, `border-border`,
 * `shadow-md`, `rounded-xl` — không hex, không spacing tuỳ ý
 * (Design_System).
 *
 * @example
 * ```tsx
 * <ResultCard
 *   header={<>Tử Vi Lá Số của <strong>Nguyễn Văn A</strong></>}
 *   subheader="Sinh 12/03/1990 — giờ Tý"
 *   keyNumbers={<KeyNumbersGrid pillars={pillars} />}
 *   chart={<RadarChart aria-label="Biểu đồ ngũ hành" />}
 *   table={<DataTable rows={pillars} />}
 *   aiSection={ai && <MarkdownRenderer content={ai} />}
 *   actions={<ResultActions readingId={id} />}
 * />
 * ```
 *
 * Validates: Requirement 8.1.
 */
export const ResultCard = React.forwardRef<HTMLElement, ResultCardProps>(
  function ResultCard(
    {
      header,
      subheader,
      keyNumbers,
      chart,
      table,
      aiSection,
      actions,
      headerId: headerIdProp,
      className,
      "aria-labelledby": ariaLabelledByProp,
      ...rest
    },
    ref,
  ) {
    const generatedId = React.useId()
    const headerId = headerIdProp ?? `result-card-title-${generatedId}`

    const hasHeader = !isEmptySlot(header)
    const hasSubheader = !isEmptySlot(subheader)
    const hasKeyNumbers = !isEmptySlot(keyNumbers)
    const hasChart = !isEmptySlot(chart)
    const hasTable = !isEmptySlot(table)
    const hasAiSection = !isEmptySlot(aiSection)
    const hasActions = !isEmptySlot(actions)

    // Gắn aria-labelledby chỉ khi có header — tránh trỏ tới id không tồn tại.
    const ariaLabelledBy = ariaLabelledByProp ?? (hasHeader ? headerId : undefined)

    return (
      <article
        ref={ref}
        data-slot="result-card"
        aria-labelledby={ariaLabelledBy}
        className={cn(
          "rounded-xl border border-border bg-card p-6 text-card-foreground shadow-md",
          "space-y-6 md:space-y-8",
          className,
        )}
        {...rest}
      >
        {(hasHeader || hasSubheader) ? (
          <header data-slot="result-card-header" className="flex flex-col gap-1">
            {hasHeader ? (
              <h2
                id={headerId}
                data-slot="result-card-title"
                className="text-2xl font-semibold tracking-tight text-foreground"
              >
                {header}
              </h2>
            ) : null}
            {hasSubheader ? (
              <p
                data-slot="result-card-subheader"
                className="text-sm text-muted-foreground"
              >
                {subheader}
              </p>
            ) : null}
          </header>
        ) : null}

        {hasKeyNumbers ? (
          <section
            data-slot="result-card-key-numbers"
            aria-label="Chỉ số chính"
            className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4"
          >
            {keyNumbers}
          </section>
        ) : null}

        {hasChart ? (
          <section
            data-slot="result-card-chart"
            className="min-w-0 w-full"
          >
            {chart}
          </section>
        ) : null}

        {hasTable ? (
          <section
            data-slot="result-card-table"
            className="min-w-0 overflow-x-auto md:overflow-visible"
          >
            {table}
          </section>
        ) : null}

        {hasAiSection ? (
          <section
            data-slot="result-card-ai-section"
            className="min-w-0 leading-relaxed text-foreground"
          >
            {aiSection}
          </section>
        ) : null}

        {hasActions ? (
          <footer
            data-slot="result-card-actions"
            className="flex flex-wrap items-center justify-stretch gap-2 border-t border-border pt-4 md:justify-end"
          >
            {actions}
          </footer>
        ) : null}
      </article>
    )
  },
)

ResultCard.displayName = "ResultCard"
