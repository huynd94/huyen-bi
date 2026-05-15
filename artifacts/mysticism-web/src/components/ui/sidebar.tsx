"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, VariantProps } from "class-variance-authority"
import { PanelLeftIcon } from "lucide-react"

import { useIsMobile } from "@/hooks/use-mobile"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContextProps = {
  state: "expanded" | "collapsed"
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextProps | null>(null)

/**
 * useSidebar — hook truy cập trạng thái và actions của sidebar context.
 *
 * Mục đích: lấy `state` (`"expanded"|"collapsed"`), `open`/`setOpen`,
 * `openMobile`/`setOpenMobile`, `isMobile` và `toggleSidebar` để các
 * component con (trigger tuỳ biến, layout, hotkey...) đồng bộ với
 * `SidebarProvider`.
 *
 * Lưu ý a11y: hook chỉ trả về dữ liệu — phía gọi cần đảm bảo nút
 * tương tác có nhãn rõ ràng (ví dụ `aria-label="Toggle Sidebar"`)
 * và không phá vỡ shortcut `Ctrl/Cmd + B` mà provider đã đăng ký.
 *
 * @throws Error khi gọi ngoài cây con của {@link SidebarProvider}.
 */
function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.")
  }

  return context
}

/**
 * SidebarProvider — root cung cấp context và bố cục cho hệ Sidebar.
 *
 * Mục đích: gói toàn bộ trang/khu vực có sidebar, quản lý state mở/đóng
 * (controlled qua `open`/`onOpenChange` hoặc uncontrolled với `defaultOpen`),
 * lưu trạng thái vào cookie `sidebar_state`, và đăng ký phím tắt
 * `Ctrl/Cmd + B` để toggle nhanh. Cung cấp `TooltipProvider` để các tooltip
 * trong sidebar hiển thị tức thời (delay 0).
 *
 * Lưu ý a11y: shortcut `Ctrl/Cmd + B` là phím chuẩn của shadcn sidebar,
 * cần ghi chú rõ trong tài liệu sử dụng để tránh xung đột với app cha.
 * Trên mobile (`useIsMobile` true), sidebar render dưới dạng `Sheet`
 * có focus trap và `aria-modal` từ Radix.
 *
 * @example
 * ```tsx
 * <SidebarProvider defaultOpen>
 *   <Sidebar>
 *     <SidebarHeader>Logo</SidebarHeader>
 *     <SidebarContent>...</SidebarContent>
 *     <SidebarFooter>Tài khoản</SidebarFooter>
 *   </Sidebar>
 *   <SidebarInset>
 *     <SidebarTrigger />
 *     <main>Nội dung trang</main>
 *   </SidebarInset>
 * </SidebarProvider>
 * ```
 */
function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = React.useState(false)

  // This is the internal state of the sidebar.
  // We use openProp and setOpenProp for control from outside the component.
  const [_open, _setOpen] = React.useState(defaultOpen)
  const open = openProp ?? _open
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value
      if (setOpenProp) {
        setOpenProp(openState)
      } else {
        _setOpen(openState)
      }

      // This sets the cookie to keep the sidebar state.
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
    [setOpenProp, open]
  )

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)
  }, [isMobile, setOpen, setOpenMobile])

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSidebar])

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed"

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
            className
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

/**
 * Sidebar — khung chứa thanh điều hướng bên trái/phải của trang.
 *
 * Mục đích: hiển thị nội dung sidebar với 3 chế độ thu gọn:
 * `offcanvas` (trượt ra khỏi màn hình), `icon` (rút lại còn icon), hoặc
 * `none` (luôn mở). 3 variant trình bày: `sidebar` (mặc định, sát mép),
 * `floating` (bo góc, có shadow), `inset` (nằm trong khung nội dung).
 * Trên mobile tự động render qua {@link Sheet} (drawer modal).
 *
 * Lưu ý a11y: trên desktop, sidebar là vùng nội dung tĩnh — gắn
 * `aria-label` mô tả khi cần (ví dụ "Điều hướng chính"). Trên mobile,
 * Radix Sheet đảm nhiệm focus trap và `Escape` đóng dialog. Hiệu ứng
 * trượt dùng `transition-[width]` 200ms; có thể bị giảm thiểu nhờ tiện
 * ích Tailwind `motion-reduce` ở ngoài.
 */
function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right"
  variant?: "sidebar" | "floating" | "inset"
  collapsible?: "offcanvas" | "icon" | "none"
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "bg-sidebar text-sidebar-foreground flex h-full w-[var(--sidebar-width)] flex-col",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="bg-sidebar text-sidebar-foreground w-[var(--sidebar-width)] p-0 [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="group peer text-sidebar-foreground hidden md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative w-[var(--sidebar-width)] bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+var(--spacing-4))]"
            : "group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]"
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 z-10 hidden h-svh w-[var(--sidebar-width)] transition-[left,right,width] duration-200 ease-linear md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+var(--spacing-4)+2px)]"
            : "group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)] group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"
        >
          {children}
        </div>
      </div>
    </div>
  )
}

/**
 * SidebarTrigger — nút bấm để mở/đóng sidebar (icon panel-left).
 *
 * Mục đích: cung cấp một button kích thước nhỏ (28×28) đặt trong header
 * trang/sidebar để toggle. Tự gọi `toggleSidebar()` từ context, nên không
 * cần truyền prop bổ sung.
 *
 * Lưu ý a11y: kèm `<span className="sr-only">Toggle Sidebar</span>` làm
 * nhãn cho screen reader. Nếu cần dịch sang tiếng Việt, override
 * children hoặc gắn `aria-label` thay thế. Tôn trọng `onClick` truyền
 * vào (chạy trước hành động toggle).
 */
function SidebarTrigger({
  className,
  onClick,
  ...props
}: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeftIcon />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}

/**
 * SidebarRail — thanh kéo mỏng dọc theo cạnh sidebar để toggle nhanh.
 *
 * Mục đích: cung cấp vùng click rộng theo chiều dọc (chỉ hiển thị từ
 * `sm:` trở lên) để người dùng đóng/mở sidebar mà không cần tìm trigger.
 *
 * Lưu ý a11y: gắn `aria-label="Toggle Sidebar"` và `tabIndex={-1}` để
 * không tham gia tab order (dành cho người dùng chuột). Người dùng bàn
 * phím nên dùng {@link SidebarTrigger} hoặc `Ctrl/Cmd + B`. Cursor đổi
 * theo `data-side` và `data-state` để gợi ý hướng kéo.
 */
function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {
  const { toggleSidebar } = useSidebar()

  // Note: Tailwind v3.4 doesn't support "in-" selectors. So the rail won't work perfectly.
  return (
    <button
      data-sidebar="rail"
      data-slot="sidebar-rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn(
        "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex",
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",
        "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",
        className
      )}
      {...props}
    />
  )
}

/**
 * SidebarInset — khung `<main>` nội dung chính kế bên sidebar.
 *
 * Mục đích: vùng landmark `main` chứa nội dung trang; tự áp margin/rounded
 * khi sidebar dùng `variant="inset"` để tạo cảm giác "thẻ" tách biệt.
 *
 * Lưu ý a11y: tag là `<main>` nên đã đóng vai trò landmark chính của
 * trang — chỉ nên có một `SidebarInset` cho mỗi trang để tránh nhiều
 * landmark `main` trùng nhau.
 */
function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "bg-background relative flex w-full flex-1 flex-col",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",
        className
      )}
      {...props}
    />
  )
}

/**
 * SidebarInput — ô input style sidebar (ví dụ ô tìm kiếm trong sidebar).
 *
 * Mục đích: tái sử dụng {@link Input} chuẩn nhưng với chiều cao 32px,
 * nền `bg-background` và bỏ shadow để hợp tông với sidebar.
 *
 * Lưu ý a11y: kế thừa toàn bộ a11y của {@link Input} — luôn gắn `<Label>`
 * hoặc `aria-label` để screen reader biết mục đích trường nhập.
 */
function SidebarInput({
  className,
  ...props
}: React.ComponentProps<typeof Input>) {
  return (
    <Input
      data-slot="sidebar-input"
      data-sidebar="input"
      className={cn("bg-background h-8 w-full shadow-none", className)}
      {...props}
    />
  )
}

/**
 * SidebarHeader — vùng header trên cùng của Sidebar.
 *
 * Mục đích: chứa logo, tên app hoặc selector tài khoản. Bố cục cột với
 * khoảng cách 8px và padding 8px, đồng nhất với footer.
 *
 * Lưu ý a11y: là wrapper trình bày, không thêm role. Nếu nội dung là
 * heading chính của khu vực điều hướng, dùng tag `<h2>`/`<h3>` bên trong.
 */
function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
}

/**
 * SidebarFooter — vùng footer dưới cùng của Sidebar.
 *
 * Mục đích: nơi đặt link phụ (đăng xuất, cài đặt) hoặc thông tin user
 * gọn. Cùng padding/khoảng cách với {@link SidebarHeader}.
 *
 * Lưu ý a11y: tương tự header, là wrapper trình bày; cấu trúc landmark
 * vẫn do `<main>`/`<nav>` bên trong quyết định.
 */
function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  )
}

/**
 * SidebarSeparator — đường kẻ phân tách các nhóm trong Sidebar.
 *
 * Mục đích: tái sử dụng {@link Separator} của Radix với màu
 * `bg-sidebar-border`, margin ngang 8px để hợp với padding sidebar.
 *
 * Lưu ý a11y: separator của Radix mặc định mang `role="separator"`;
 * thêm `decorative` ở phía gọi nếu chỉ trang trí, tránh ồn cho screen reader.
 */
function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn("bg-sidebar-border mx-2 w-auto", className)}
      {...props}
    />
  )
}

/**
 * SidebarContent — vùng nội dung chính của Sidebar (cuộn được).
 *
 * Mục đích: chứa các {@link SidebarGroup} và menu, cho phép cuộn dọc khi
 * dài; tự ẩn overflow khi sidebar ở chế độ `collapsible=icon` để tránh
 * thanh cuộn nhấp nháy.
 *
 * Lưu ý a11y: là vùng trình bày; nếu cần cấu trúc landmark, gắn tag
 * `<nav aria-label="Điều hướng phụ">` bao bọc bên ngoài hoặc đổi root
 * tuỳ ý qua composition.
 */
function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      data-sidebar="content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className
      )}
      {...props}
    />
  )
}

/**
 * SidebarGroup — nhóm các mục liên quan trong Sidebar.
 *
 * Mục đích: gộp menu cùng chủ đề (ví dụ "Lá số gần đây", "Cài đặt")
 * cùng một section có padding và spacing riêng. Thường dùng cùng
 * {@link SidebarGroupLabel} ở đầu group.
 *
 * Lưu ý a11y: là wrapper trình bày, không tạo landmark; cặp `Group` +
 * `GroupLabel` đủ để screen reader hiểu cấu trúc nếu label dùng heading
 * (qua `asChild`).
 */
function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}
      {...props}
    />
  )
}

/**
 * SidebarGroupLabel — nhãn tiêu đề cho một {@link SidebarGroup}.
 *
 * Mục đích: hiển thị tên nhóm dưới dạng text mờ, tự ẩn khi sidebar thu
 * gọn về chế độ icon (`group-data-[collapsible=icon]:opacity-0`).
 *
 * Lưu ý a11y: dùng `asChild` để render dưới dạng `<h3>`/`<h4>` khi cần
 * giữ cấu trúc heading. Nếu để mặc định `<div>`, screen reader vẫn đọc
 * theo thứ tự DOM nhưng không có cấp bậc heading rõ ràng.
 */
function SidebarGroupLabel({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "div"

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      className={cn(
        "text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0",
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * SidebarGroupAction — nút thao tác phụ ở góc của một {@link SidebarGroup}.
 *
 * Mục đích: chứa hành động cấp group (ví dụ "Thêm mới"), tự ẩn khi
 * sidebar thu gọn về icon. Hỗ trợ `asChild` để wrap link/component khác.
 *
 * Lưu ý a11y: chỉ chứa icon là phổ biến — luôn truyền `aria-label`
 * mô tả hành động (ví dụ `aria-label="Thêm lá số mới"`). Hit area
 * được mở rộng trên mobile bằng pseudo-element `after:`.
 */
function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

/**
 * SidebarGroupContent — vùng nội dung bên dưới label của một group.
 *
 * Mục đích: bọc {@link SidebarMenu} và các phần tử khác trong group;
 * chuẩn hoá size text (`text-sm`) và full-width.
 *
 * Lưu ý a11y: thuần wrapper trình bày, không thêm role.
 */
function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn("w-full text-sm", className)}
      {...props}
    />
  )
}

/**
 * SidebarMenu — danh sách `<ul>` chứa các {@link SidebarMenuItem}.
 *
 * Mục đích: container cho menu điều hướng dọc trong sidebar; xếp các
 * item thành cột với khoảng cách 4px.
 *
 * Lưu ý a11y: vì tag là `<ul>` nên đã có ngữ nghĩa list cho screen
 * reader. Khi đặt menu trong landmark `<nav>`, gắn `aria-label` ở `nav`
 * cha để phân biệt với các nav khác trên trang.
 */
function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}
      {...props}
    />
  )
}

/**
 * SidebarMenuItem — một mục `<li>` trong {@link SidebarMenu}.
 *
 * Mục đích: bọc {@link SidebarMenuButton} và (tuỳ chọn)
 * {@link SidebarMenuAction}/{@link SidebarMenuBadge} cho mỗi entry điều
 * hướng. Sử dụng `group/menu-item` để các action con ẩn/hiện theo hover.
 *
 * Lưu ý a11y: tag `<li>` giữ ngữ nghĩa list-item; tránh nhồi nhiều
 * tương tác cùng cấp ngoài button chính + một action phụ để không gây
 * khó cho người dùng bàn phím.
 */
function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  )
}

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:w-8! group-data-[collapsible=icon]:h-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * SidebarMenuButton — nút điều hướng chính trong {@link SidebarMenuItem}.
 *
 * Mục đích: dòng button (hoặc link qua `asChild`) cho mỗi entry sidebar,
 * hỗ trợ `isActive` để highlight, `variant` (`default|outline`) và `size`
 * (`default|sm|lg`). Khi sidebar thu gọn về icon mà có `tooltip`, button
 * tự bọc bằng {@link Tooltip} hiển thị nhãn ở phải.
 *
 * Lưu ý a11y: trạng thái active phản ánh qua `data-active="true"`; cân
 * nhắc thêm `aria-current="page"` ở phía gọi cho route hiện tại để screen
 * reader thông báo. Khi chỉ có icon (sidebar thu gọn), tooltip đảm nhận
 * việc cung cấp nhãn — vẫn nên giữ text con để giàu ngữ nghĩa.
 */
function SidebarMenuButton({
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  isActive?: boolean
  tooltip?: string | React.ComponentProps<typeof TooltipContent>
} & VariantProps<typeof sidebarMenuButtonVariants>) {
  const Comp = asChild ? Slot : "button"
  const { isMobile, state } = useSidebar()

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}
      {...props}
    />
  )

  if (!tooltip) {
    return button
  }

  if (typeof tooltip === "string") {
    tooltip = {
      children: tooltip,
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "collapsed" || isMobile}
        {...tooltip}
      />
    </Tooltip>
  )
}

/**
 * SidebarMenuAction — nút thao tác phụ ở góc phải của một menu item.
 *
 * Mục đích: thực hiện hành động cấp item (ví dụ "Xoá", menu kebab).
 * Khi `showOnHover=true`, nút mặc định ẩn (`opacity-0`) và chỉ hiện khi
 * hover/focus item cha hoặc khi item đang active.
 *
 * Lưu ý a11y: gắn `aria-label` rõ ràng cho action vì thường chỉ chứa
 * icon. Khi `showOnHover`, người dùng bàn phím vẫn focus được nhờ
 * `group-focus-within/menu-item:opacity-100`. Nếu nhúng một
 * {@link DropdownMenu} bên trong, tránh để click action lan ra link
 * cha (dùng `e.stopPropagation()`).
 */
function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean
  showOnHover?: boolean
}) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0",
        className
      )}
      {...props}
    />
  )
}

/**
 * SidebarMenuBadge — badge số/text nhỏ ở góc của menu item.
 *
 * Mục đích: hiển thị thông tin phụ (số thông báo, trạng thái) cạnh
 * {@link SidebarMenuButton}; tự ẩn khi sidebar thu gọn về icon.
 *
 * Lưu ý a11y: đặt `pointer-events-none` để không cản click button. Nội
 * dung số/text nên đi kèm ngữ cảnh (ví dụ thêm `<span className="sr-only">
 * thông báo chưa đọc</span>` để screen reader không chỉ đọc số trống).
 */
function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

/**
 * SidebarMenuSkeleton — placeholder loading cho một dòng menu item.
 *
 * Mục đích: hiển thị `Skeleton` thay cho item khi đang fetch dữ liệu
 * điều hướng (ví dụ danh sách lá số chưa load). Tự sinh chiều rộng
 * ngẫu nhiên 50–90% để mô phỏng cảm giác list đa dạng.
 *
 * Lưu ý a11y: skeleton thuần trang trí; cân nhắc gắn `aria-busy="true"`
 * cho khu vực cha và `aria-hidden="true"` cho skeleton để screen reader
 * không đọc placeholder.
 */
function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean
}) {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`
  }, [])

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="h-4 max-w-[var(--skeleton-width)] flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  )
}

/**
 * SidebarMenuSub — danh sách `<ul>` chứa các sub-item lồng dưới một item.
 *
 * Mục đích: hiển thị menu cấp 2 (ví dụ các "Mục" con của "Cài đặt"),
 * thụt vào và có viền trái mỏng làm chỉ báo phân cấp. Tự ẩn khi sidebar
 * ở chế độ icon.
 *
 * Lưu ý a11y: là `<ul>` — giữ ngữ nghĩa list. Nếu submenu có thể đóng/mở,
 * dùng cùng {@link Collapsible} ở phía gọi để có hành vi `aria-expanded`.
 */
function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      className={cn(
        "border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

/**
 * SidebarMenuSubItem — một mục `<li>` trong {@link SidebarMenuSub}.
 *
 * Mục đích: bọc {@link SidebarMenuSubButton} của một sub-entry; tương
 * tự {@link SidebarMenuItem} nhưng cho cấp 2.
 *
 * Lưu ý a11y: tag `<li>` giữ ngữ nghĩa list-item.
 */
function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  )
}

/**
 * SidebarMenuSubButton — link/button cho một sub-entry điều hướng.
 *
 * Mục đích: render `<a>` (mặc định) hoặc element tuỳ ý qua `asChild`.
 * Hỗ trợ `size` (`sm|md`) và `isActive` để highlight; tự ẩn khi sidebar
 * thu gọn về icon vì sub-menu không hiển thị ở chế độ này.
 *
 * Lưu ý a11y: như {@link SidebarMenuButton}, cân nhắc gắn `aria-current`
 * cho route hiện tại. Nội dung text cuối cùng tự `truncate` qua
 * `[&>span:last-child]:truncate`.
 */
function SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"a"> & {
  asChild?: boolean
  size?: "sm" | "md"
  isActive?: boolean
}) {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline outline-2 outline-transparent outline-offset-2 focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        "group-data-[collapsible=icon]:hidden",
        className
      )}
      {...props}
    />
  )
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
