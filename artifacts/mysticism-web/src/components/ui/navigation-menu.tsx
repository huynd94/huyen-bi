import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { cva } from "class-variance-authority"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * NavigationMenu — wrapper trực tiếp `@radix-ui/react-navigation-menu` Root.
 *
 * Mục đích: thanh navigation top-level kiểu mega-menu/desktop site nav,
 * với các trigger có thể mở panel rộng chứa nhóm link. Tự lồng
 * {@link NavigationMenuViewport} bên trong để hiển thị panel
 * {@link NavigationMenuContent} đang active.
 *
 * Props: kế thừa props của Radix Root — `value`, `onValueChange`,
 * `defaultValue`, `delayDuration`, `skipDelayDuration`, `dir`,
 * `orientation` (`"horizontal" | "vertical"`).
 *
 * Lưu ý a11y: Radix gắn `aria-expanded` cho trigger và `aria-controls`
 * trỏ tới content; bàn phím hỗ trợ `←/→` (hoặc `↑/↓` khi vertical) di
 * chuyển giữa các trigger, `Enter`/`Space`/`↓` mở panel, `Esc` đóng.
 * Nếu không cần dropdown panel, dùng {@link NavigationMenuLink} cho
 * link đơn thuần để giữ semantics đúng.
 *
 * @example
 * ```tsx
 * <NavigationMenu>
 *   <NavigationMenuList>
 *     <NavigationMenuItem>
 *       <NavigationMenuTrigger>Tài nguyên</NavigationMenuTrigger>
 *       <NavigationMenuContent>
 *         <ul className="grid gap-2 p-4">
 *           <li><NavigationMenuLink href="/blog">Blog</NavigationMenuLink></li>
 *           <li><NavigationMenuLink href="/docs">Tài liệu</NavigationMenuLink></li>
 *         </ul>
 *       </NavigationMenuContent>
 *     </NavigationMenuItem>
 *   </NavigationMenuList>
 * </NavigationMenu>
 * ```
 */
const NavigationMenu = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn(
      "relative z-10 flex max-w-max flex-1 items-center justify-center",
      className
    )}
    {...props}
  >
    {children}
    <NavigationMenuViewport />
  </NavigationMenuPrimitive.Root>
))
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

/**
 * Container `<ul>` chứa các {@link NavigationMenuItem}. Render như
 * `role="menubar"` ở chế độ horizontal mặc định.
 */
const NavigationMenuList = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      "group flex flex-1 list-none items-center justify-center space-x-1",
      className
    )}
    {...props}
  />
))
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

/**
 * Một mục `<li>` trong {@link NavigationMenuList}. Bọc cặp
 * trigger/content hoặc một {@link NavigationMenuLink} đơn lẻ.
 */
const NavigationMenuItem = NavigationMenuPrimitive.Item

/**
 * Class CVA dùng chung để style cho trigger hoặc link đơn lẻ — giúp
 * tab và link đơn (không có dropdown) trông đồng nhất.
 *
 * Sử dụng: `<NavigationMenuLink className={navigationMenuTriggerStyle()} ...>`.
 */
const navigationMenuTriggerStyle = cva(
  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=open]:text-accent-foreground data-[state=open]:bg-accent/50 data-[state=open]:hover:bg-accent data-[state=open]:focus:bg-accent"
)

/**
 * Trigger top-level mở/đóng {@link NavigationMenuContent}. Tự render
 * icon `ChevronDown` xoay 180° khi `data-state="open"`.
 *
 * Lưu ý a11y: Radix gắn `aria-expanded` và `aria-controls` tự động;
 * icon được đánh dấu `aria-hidden="true"` vì decorative.
 */
const NavigationMenuTrigger = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(navigationMenuTriggerStyle(), "group", className)}
    {...props}
  >
    {children}{" "}
    <ChevronDown
      className="relative top-[1px] ml-1 h-3 w-3 transition duration-300 group-data-[state=open]:rotate-180"
      aria-hidden="true"
    />
  </NavigationMenuPrimitive.Trigger>
))
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName

/**
 * Panel nội dung tương ứng với một {@link NavigationMenuTrigger}.
 * Áp animation slide-in từ trái/phải dựa trên `data-motion` (Radix
 * tự gắn theo hướng di chuyển giữa các tab).
 *
 * Render bên trong {@link NavigationMenuViewport} chung để hỗ trợ
 * hiệu ứng resize mượt khi đổi panel.
 */
const NavigationMenuContent = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto ",
      className
    )}
    {...props}
  />
))
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName

/**
 * Link đơn trong navigation menu — render `<a>` với role hợp lý và hỗ
 * trợ `active` state qua prop `active`. Dùng cho item không có dropdown
 * hoặc cho từng link bên trong {@link NavigationMenuContent}.
 */
const NavigationMenuLink = NavigationMenuPrimitive.Link

/**
 * Vùng "viewport" hiển thị panel content đang active. Tự resize theo
 * kích thước content qua biến CSS `--radix-navigation-menu-viewport-{height,width}`.
 *
 * Thường không cần render thủ công — {@link NavigationMenu} đã tự lồng
 * sẵn ở cuối Root. Chỉ override khi cần đặt viewport ở vị trí khác.
 */
const NavigationMenuViewport = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <div className={cn("absolute left-0 top-full flex justify-center")}>
    <NavigationMenuPrimitive.Viewport
      className={cn(
        "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]",
        className
      )}
      ref={ref}
      {...props}
    />
  </div>
))
NavigationMenuViewport.displayName =
  NavigationMenuPrimitive.Viewport.displayName

/**
 * Indicator nhỏ (mũi tên) chỉ tới trigger đang active — di chuyển
 * mượt khi đổi tab. Hiển thị/ẩn dựa trên `data-state`.
 */
const NavigationMenuIndicator = React.forwardRef<
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>
>(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Indicator
    ref={ref}
    className={cn(
      "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",
      className
    )}
    {...props}
  >
    <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />
  </NavigationMenuPrimitive.Indicator>
))
NavigationMenuIndicator.displayName =
  NavigationMenuPrimitive.Indicator.displayName

export {
  navigationMenuTriggerStyle,
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuContent,
  NavigationMenuTrigger,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
}
