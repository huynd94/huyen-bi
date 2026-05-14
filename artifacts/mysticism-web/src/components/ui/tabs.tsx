import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

/**
 * Tabs — wrapper trực tiếp của `@radix-ui/react-tabs` Root.
 *
 * Mục đích: chuyển đổi giữa các view ngang hàng cùng cấp (ví dụ: tab
 * "Tổng quan" / "Chi tiết" / "Lịch sử" trong trang lá số).
 *
 * Props: kế thừa props của Radix Root — `value`, `onValueChange`,
 * `defaultValue`, `orientation` (`"horizontal" | "vertical"`),
 * `dir`, `activationMode` (`"automatic" | "manual"`).
 *
 * Lưu ý a11y: Radix tự gắn `role="tablist"`, `role="tab"`,
 * `role="tabpanel"` và liên kết `aria-controls` / `aria-labelledby`.
 * Bàn phím: `←/→` (hoặc `↑/↓` khi vertical) di chuyển giữa các tab,
 * `Home`/`End` về tab đầu/cuối, `Enter`/`Space` kích hoạt khi
 * `activationMode="manual"`.
 *
 * @example
 * ```tsx
 * <Tabs defaultValue="overview">
 *   <TabsList>
 *     <TabsTrigger value="overview">Tổng quan</TabsTrigger>
 *     <TabsTrigger value="detail">Chi tiết</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="overview">...</TabsContent>
 *   <TabsContent value="detail">...</TabsContent>
 * </Tabs>
 * ```
 */
const Tabs = TabsPrimitive.Root

/** Container `<div role="tablist">` chứa các {@link TabsTrigger}. */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

/**
 * Nút kích hoạt tab — render `<button role="tab">`. Mỗi trigger phải
 * có `value` duy nhất khớp với {@link TabsContent} tương ứng.
 *
 * Lưu ý a11y: trạng thái active dùng `data-[state=active]` (Radix tự
 * gắn `aria-selected="true"`); ring focus rõ ràng cho keyboard user.
 */
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

/**
 * Panel nội dung tương ứng với một {@link TabsTrigger} cùng `value`.
 * Render `<div role="tabpanel">` — chỉ hiển thị khi tab được chọn.
 */
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
