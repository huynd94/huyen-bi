import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { ChevronRight, MoreHorizontal } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Breadcrumb — container điều hướng phân cấp.
 *
 * Mục đích: hiển thị đường dẫn từ trang gốc đến trang hiện tại
 * (ví dụ: Trang chủ › Tử vi › Lá số của tôi).
 *
 * Props:
 * - Tất cả thuộc tính `<nav>` chuẩn.
 * - `separator`: dấu ngăn cách tuỳ biến (mặc định `<ChevronRight>`).
 *
 * Lưu ý a11y: render `<nav aria-label="breadcrumb">`; trang hiện tại
 * dùng {@link BreadcrumbPage} có `aria-current="page"`.
 *
 * @example
 * ```tsx
 * <Breadcrumb>
 *   <BreadcrumbList>
 *     <BreadcrumbItem><BreadcrumbLink href="/">Trang chủ</BreadcrumbLink></BreadcrumbItem>
 *     <BreadcrumbSeparator />
 *     <BreadcrumbItem><BreadcrumbPage>Tử vi</BreadcrumbPage></BreadcrumbItem>
 *   </BreadcrumbList>
 * </Breadcrumb>
 * ```
 */
const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode
  }
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)
Breadcrumb.displayName = "Breadcrumb"

/** Danh sách `<ol>` chứa các {@link BreadcrumbItem} và {@link BreadcrumbSeparator}. */
const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className
    )}
    {...props}
  />
))
BreadcrumbList.displayName = "BreadcrumbList"

/** Một mục `<li>` trong breadcrumb. */
const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

/**
 * Liên kết tới một trang cha. Mặc định render `<a>`, có thể đổi sang
 * router link bằng `asChild` (Radix `Slot`).
 *
 * Lưu ý a11y: tự động có `transition-colors` và `:hover:text-foreground`
 * để feedback hover. Tránh nhồi text quá dài; cân nhắc `truncate` cho
 * mobile.
 */
const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean
  }
>(({ asChild, className, ...props }, ref) => {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      ref={ref}
      className={cn("transition-colors hover:text-foreground", className)}
      {...props}
    />
  )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

/**
 * Trang hiện tại. Render `<span role="link" aria-current="page">`
 * — không clickable nhưng vẫn được screen reader báo là vị trí
 * hiện tại.
 */
const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-normal text-foreground", className)}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

/**
 * Dấu ngăn cách giữa các item. Mặc định icon `ChevronRight`,
 * có thể truyền `children` để override (ví dụ "/" hay "›").
 *
 * Render `<li role="presentation" aria-hidden="true">` để screen reader
 * bỏ qua.
 */
const BreadcrumbSeparator = ({
  children,
  className,
  ...props
}: React.ComponentProps<"li">) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:w-3.5 [&>svg]:h-3.5", className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

/**
 * Ellipsis (…) thay thế nhiều mục giữa khi đường dẫn quá dài.
 * Có nhãn `sr-only` "More" cho screen reader.
 */
const BreadcrumbEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
