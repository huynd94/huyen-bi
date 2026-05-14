import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Table — bảng dữ liệu cơ bản dựa trên `<table>` chuẩn.
 *
 * Mục đích: hiển thị dữ liệu bảng (ví dụ: lịch sử lá số, danh sách
 * sao, bảng so sánh tử vi). Tự bọc trong `<div>` có
 * `overflow-auto` để cuộn ngang trên màn hình hẹp.
 *
 * Props: kế thừa toàn bộ thuộc tính HTML của `<table>` —
 * `className`, `onClick`, `role`, `aria-*`,...
 *
 * Lưu ý a11y: nên dùng cùng {@link TableCaption} (nếu cần mô tả) và
 * `<th scope="col">` qua {@link TableHead} để screen reader hiểu cấu
 * trúc bảng. Tránh dùng `<table>` cho layout — chỉ dùng cho dữ liệu
 * thật.
 *
 * @example
 * ```tsx
 * <Table>
 *   <TableCaption>Lịch sử 10 lá số gần nhất.</TableCaption>
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>Ngày</TableHead>
 *       <TableHead>Loại</TableHead>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     <TableRow>
 *       <TableCell>2025-01-15</TableCell>
 *       <TableCell>Tử vi</TableCell>
 *     </TableRow>
 *   </TableBody>
 * </Table>
 * ```
 */
const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

/** Phần header của bảng — render `<thead>`. Mỗi `<tr>` con tự có border-bottom. */
const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

/** Thân bảng — render `<tbody>`. Hàng cuối cùng tự bỏ border-bottom. */
const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

/**
 * Footer của bảng — render `<tfoot>`. Có nền `bg-muted/50` và
 * font-weight đậm để phân biệt với body (ví dụ: dòng tổng cộng).
 */
const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

/**
 * Một hàng trong bảng — render `<tr>` với hover state và
 * `data-[state=selected]` để highlight khi được chọn (kết hợp với
 * `<Checkbox>` hoặc selection state ngoài).
 */
const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

/**
 * Ô tiêu đề cột — render `<th>`. Nên đặt thuộc tính `scope="col"` qua
 * props khi dùng để screen reader liên kết đúng dữ liệu với tiêu đề.
 */
const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

/** Ô dữ liệu — render `<td>` với padding chuẩn và align middle. */
const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
TableCell.displayName = "TableCell"

/**
 * Caption mô tả nội dung bảng — render `<caption>`. Hiển thị bên dưới
 * bảng (`caption-bottom` ở Table root) và được screen reader đọc trước
 * khi vào dữ liệu, nên dùng để cung cấp ngữ cảnh ngắn gọn.
 */
const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
