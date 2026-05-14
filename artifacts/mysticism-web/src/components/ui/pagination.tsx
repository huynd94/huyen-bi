import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"
import { ButtonProps, buttonVariants } from "@/components/ui/button"

/**
 * Pagination — `<nav role="navigation" aria-label="pagination">` cho
 * điều hướng phân trang.
 *
 * Mục đích: chuyển trang cho danh sách dài (lịch sử lá số, kết quả
 * tìm kiếm, blog). Bản chất là tập hợp các link `<a>` nên SEO-friendly
 * và hỗ trợ middle-click mở tab mới — không phải button SPA.
 *
 * Lưu ý a11y: `<nav>` với `aria-label="pagination"` để screen reader
 * công bố landmark; trang hiện tại đánh dấu qua `aria-current="page"`
 * trên {@link PaginationLink}; điều hướng prev/next có
 * `aria-label="Go to previous page"` / `"Go to next page"`. Toàn bộ
 * cấu trúc dùng `<ul>/<li>` (qua {@link PaginationContent} +
 * {@link PaginationItem}) để screen reader đọc số lượng item chính xác.
 *
 * @example
 * ```tsx
 * <Pagination>
 *   <PaginationContent>
 *     <PaginationItem>
 *       <PaginationPrevious href="?page=1" />
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationLink href="?page=1">1</PaginationLink>
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationLink href="?page=2" isActive>2</PaginationLink>
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationEllipsis />
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationNext href="?page=3" />
 *     </PaginationItem>
 *   </PaginationContent>
 * </Pagination>
 * ```
 */
const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

/**
 * PaginationContent — `<ul>` chứa danh sách {@link PaginationItem}.
 * Áp `flex flex-row items-center gap-1` để các item xếp ngang.
 */
const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

/**
 * PaginationItem — `<li>` bao quanh mỗi {@link PaginationLink},
 * {@link PaginationPrevious}, {@link PaginationNext}, hoặc
 * {@link PaginationEllipsis}. Dùng để screen reader đếm chính xác
 * số lượng phần tử điều hướng.
 */
const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">

/**
 * PaginationLink — link `<a>` cho một trang, render với style của
 * `Button` (variant `outline` khi `isActive`, `ghost` khi không).
 *
 * Prop `isActive`: đánh dấu trang hiện tại — tự gắn
 * `aria-current="page"` để screen reader đọc "current page".
 *
 * Prop `size`: kế thừa từ {@link ButtonProps} — mặc định `"icon"`
 * (vuông) cho số trang; `"default"` cho prev/next có text.
 *
 * Lưu ý a11y: dùng `href` thật để hỗ trợ middle-click, copy link,
 * SEO. Tránh chỉ dùng `onClick` — nếu cần SPA, vẫn nên có `href` và
 * preventDefault trong handler.
 */
const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

/**
 * PaginationPrevious — link "Previous" có icon `ChevronLeft` + text.
 * Tự gắn `aria-label="Go to previous page"` để screen reader đọc
 * mục đích kể cả khi text ngắn.
 */
const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

/**
 * PaginationNext — link "Next" có text + icon `ChevronRight`. Tự gắn
 * `aria-label="Go to next page"` để screen reader đọc mục đích.
 */
const PaginationNext = ({
  className,
  ...props
}: React.ComponentProps<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

/**
 * PaginationEllipsis — dấu "..." khi danh sách trang quá dài, ẩn các
 * trang ở giữa. Render `<span aria-hidden>` với icon `MoreHorizontal`
 * và text `<span class="sr-only">More pages</span>` để screen reader
 * hiểu ngữ cảnh thay vì đọc icon.
 */
const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
}
