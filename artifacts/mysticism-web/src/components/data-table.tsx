import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Mô tả một cột của {@link DataTable}.
 *
 * `key` đóng hai vai trò: (1) là `React.key` của cell trong mỗi row (giả sử
 * không có `getCellKey`), và (2) — nếu không cung cấp `render` — được dùng làm
 * accessor: cell sẽ render `String(row[key as keyof T])`.
 */
export interface DataTableColumn<T> {
  /**
   * Định danh cột. Phải duy nhất trong mảng `columns`.
   * Khi `render` không được cung cấp, dùng làm property accessor để đọc giá trị
   * từ row (yêu cầu `T` là object có thuộc tính trùng tên).
   */
  key: string
  /**
   * Nhãn hiển thị trong `<th scope="col">`. Tiếng Việt, sentence case.
   */
  label: string
  /**
   * Hàm tuỳ biến render nội dung cell cho cột này. Nếu không cung cấp, cell
   * hiển thị `String(row[key])` (hoặc rỗng khi giá trị là `null` / `undefined`).
   */
  render?: (row: T) => React.ReactNode
  /**
   * Class bổ sung áp lên `<th>` của cột.
   */
  headClassName?: string
  /**
   * Class bổ sung áp lên mọi `<td>` thuộc cột.
   */
  cellClassName?: string
}

/**
 * Props của {@link DataTable}.
 */
export interface DataTableProps<T> {
  /** Khai báo các cột — định nghĩa thứ tự, nhãn, và cách render. */
  columns: DataTableColumn<T>[]
  /** Dữ liệu — mỗi phần tử là một row trong `<tbody>`. */
  rows: T[]
  /**
   * Mô tả ngắn về bảng cho công nghệ hỗ trợ. Render trong `<caption>`. Mặc
   * định caption ẩn về trực quan (`sr-only`); bật `captionVisible` để hiển thị.
   */
  caption?: React.ReactNode
  /**
   * Nếu `true`, caption hiển thị bằng mắt; mặc định `false` (chỉ screen reader
   * thấy). Không có ảnh hưởng nếu `caption` không được truyền.
   */
  captionVisible?: boolean
  /**
   * Nội dung thay thế khi `rows.length === 0`. Khuyến nghị truyền vào một
   * `<EmptyState>` primitive để giữ nhất quán microcopy + a11y.
   * Nếu không truyền, bảng vẫn render với `<tbody>` trống (chỉ thấy header).
   */
  emptyState?: React.ReactNode
  /**
   * Hàm tính `React.key` cho từng row. Mặc định dùng `index` của row.
   * Khuyến nghị cung cấp khi rows có ID ổn định để tránh re-mount cell khi
   * dữ liệu sắp xếp lại.
   */
  getRowKey?: (row: T, index: number) => React.Key
  /**
   * `aria-label` cho `<table>` khi không có `caption` hiển thị. Cung cấp giá
   * trị tiếng Việt khi bảng đứng độc lập (ngoài Result_Card có `<h2>` mô tả).
   */
  ariaLabel?: string
  /** Class áp lên `<table>`. */
  className?: string
  /**
   * Class áp lên `<div>` wrapper bên ngoài (chứa logic `overflow-x-auto`).
   * Dùng khi cần giới hạn `max-width` hoặc thêm `rounded-lg border`.
   */
  wrapperClassName?: string
}

/**
 * Đọc giá trị mặc định cho cell khi cột không cung cấp `render`. Trả về chuỗi
 * rỗng khi giá trị là `null` / `undefined` để tránh hiển thị "undefined".
 */
function defaultCellRenderer<T>(row: T, key: string): React.ReactNode {
  const record = row as Record<string, unknown>
  const value = record[key]
  if (value === null || value === undefined) return ""
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value)
  }
  // Cho phép React render trực tiếp ReactNode (element con của row).
  return value as React.ReactNode
}

/**
 * Bảng dữ liệu chuẩn cho 15 trang module — 4 trụ Bát Tự, 12 cung Tử Vi, ngũ
 * cách Xem Tên, lịch sử gieo quẻ, v.v.
 *
 * Bố cục: `<div class="overflow-x-auto md:overflow-visible">` bao ngoài
 * `<table>` với `<thead>` (mỗi `<th>` có `scope="col"`) và `<tbody>` (mỗi cell
 * là `<td>`). Trên Breakpoint_Mobile, bảng có thể cuộn ngang riêng biệt khi
 * tổng chiều rộng cột vượt viewport; từ `md` trở lên overflow tắt để layout
 * trang không bị ảnh hưởng.
 *
 * Sử dụng design tokens semantic (`bg-card`, `bg-muted`, `border-border`,
 * `text-foreground`, `text-muted-foreground`) — tự bám theme light/dark.
 *
 * A11y:
 * - `<th scope="col">` cho mọi cột để screen reader liên kết cell với header.
 * - `caption` (nếu cung cấp) render trong `<caption>`; mặc định ẩn trực quan
 *   bằng `sr-only` để vẫn hữu ích cho công nghệ hỗ trợ.
 * - `aria-label` truyền vào `<table>` khi không có caption hiển thị.
 *
 * Khi `rows` rỗng và `emptyState` được cung cấp, bảng được thay thế bằng
 * `emptyState` (thường là `<EmptyState>` primitive) thay vì hiển thị bảng
 * trống — cải thiện UX cho danh sách rỗng.
 *
 * @example
 * ```tsx
 * type Pillar = { name: string; sky: string; earth: string }
 *
 * <DataTable<Pillar>
 *   caption="Bốn trụ Bát Tự của ngày 14/03/1990"
 *   columns={[
 *     { key: "name", label: "Trụ" },
 *     { key: "sky", label: "Thiên can" },
 *     { key: "earth", label: "Địa chi" },
 *   ]}
 *   rows={pillars}
 *   getRowKey={(p) => p.name}
 *   emptyState={
 *     <EmptyState
 *       icon={<Sparkles aria-hidden="true" />}
 *       title="Chưa tính được lá số"
 *       description="Hãy nhập ngày, giờ sinh ở khung trên rồi bấm Tra cứu."
 *     />
 *   }
 * />
 * ```
 *
 * Validates: Requirements 4.1, 8.4.
 */
export function DataTable<T>({
  columns,
  rows,
  caption,
  captionVisible = false,
  emptyState,
  getRowKey,
  ariaLabel,
  className,
  wrapperClassName,
}: DataTableProps<T>): React.ReactElement {
  if (rows.length === 0 && emptyState !== undefined) {
    return <>{emptyState}</>
  }

  return (
    <div
      className={cn(
        "w-full overflow-x-auto md:overflow-visible",
        wrapperClassName
      )}
    >
      <table
        aria-label={caption ? undefined : ariaLabel}
        className={cn(
          "w-full caption-bottom border-collapse bg-card text-sm text-foreground",
          className
        )}
      >
        {caption ? (
          <caption
            className={cn(
              "mt-3 text-sm text-muted-foreground",
              captionVisible ? "text-left" : "sr-only"
            )}
          >
            {caption}
          </caption>
        ) : null}
        <thead className="bg-muted text-muted-foreground">
          <tr className="border-b border-border">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  "h-10 px-3 text-left align-middle text-sm font-medium",
                  column.headClassName
                )}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {rows.map((row, rowIndex) => (
            <tr
              key={getRowKey ? getRowKey(row, rowIndex) : rowIndex}
              className="border-b border-border transition-colors hover:bg-muted/50"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    "px-3 py-2 align-middle text-sm text-foreground",
                    column.cellClassName
                  )}
                >
                  {column.render
                    ? column.render(row)
                    : defaultCellRenderer(row, column.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

DataTable.displayName = "DataTable"
