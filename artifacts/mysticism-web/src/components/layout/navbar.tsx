import { useState } from "react";
import { Link, useLocation } from "wouter";
import { UserButton, Show } from "@clerk/react";
import { Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { useAISettings } from "@/contexts/ai-settings";
import { useTheme } from "@/contexts/theme";
import { AISettingsModal } from "@/components/ai-settings-modal";
import { isClerkEnabled } from "@/lib/auth-config";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { GROUPS, ROUTE_MAP } from "@/components/layout/breadcrumb";
import { useMysticCursorEnabled } from "@/lib/use-mystic-cursor";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

/**
 * Liên kết con trong dropdown của một nhóm điều hướng.
 */
interface NavLink {
  href: string;
  label: string;
}

/**
 * Một nhóm điều hướng cấp 1 hiển thị ở navbar desktop.
 *
 * Nguồn dữ liệu duy nhất là `GROUPS` + `ROUTE_MAP` của
 * `breadcrumb.tsx` để mọi cấu trúc thông tin (breadcrumb, drawer mobile,
 * navbar desktop) cùng một bộ route — thêm/sửa route ở `ROUTE_MAP` tự
 * động phản ánh ở navbar.
 */
interface NavGroup {
  label: string;
  links: NavLink[];
}

/**
 * Dựng cấu trúc 5 nhóm điều hướng (Số Học, Mệnh Lý, Tiên Tri, Tra Cứu,
 * Trợ Lý AI) từ {@link GROUPS} và {@link ROUTE_MAP}. Thứ tự nhóm bám
 * thứ tự khai báo `GROUPS`; thứ tự link bám thứ tự duyệt `Object.entries`
 * của `ROUTE_MAP` (phản ánh thứ tự khai báo nguồn).
 */
function buildGroups(): NavGroup[] {
  return Object.values(GROUPS).map((group) => {
    const links: NavLink[] = [];
    for (const [path, meta] of Object.entries(ROUTE_MAP)) {
      if (meta.group?.label === group.label) {
        links.push({ href: path, label: meta.label });
      }
    }
    return { label: group.label, links };
  });
}

const NAV_GROUPS: NavGroup[] = buildGroups();

const PROVIDER_BADGE: Record<string, { label: string; color: string }> = {
  server: { label: "AI", color: "bg-primary/20 text-primary border-primary/40" },
  openai: { label: "GPT", color: "bg-green-500/20 text-green-400 border-green-500/40" },
  gemini: { label: "Gem", color: "bg-blue-500/20 text-blue-400 border-blue-500/40" },
};

function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22" x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="19.78" y2="19.78"/>
      <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="7.05" y2="16.95"/><line x1="16.95" y1="7.05" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

/**
 * Một mục trong dropdown của một nhóm điều hướng. Render bằng
 * `NavigationMenuLink asChild` để wouter `<Link>` vẫn xử lý điều hướng
 * client-side, đồng thời được Radix gắn các thuộc tính ARIA + role hợp
 * lệ cho menu (Requirement 7.1).
 *
 * `aria-current="page"` được đặt khi `location` khớp `href`
 * (Requirement 7.3) và link active được tô bằng `text-primary`.
 */
function GroupMenuItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "block select-none rounded-lg px-3 py-2 text-sm leading-snug no-underline outline-none transition-colors",
            "hover:bg-primary/10 focus-visible:bg-primary/10 focus-visible:ring-1 focus-visible:ring-primary/40",
            active
              ? "bg-primary/15 text-primary font-semibold"
              : "text-foreground hover:text-primary",
          )}
        >
          {label}
        </Link>
      </NavigationMenuLink>
    </li>
  );
}

/**
 * `Navbar` — thanh điều hướng chính của Huyền Bí.
 *
 * Triển khai theo Requirement 7:
 *
 * - **7.1**: Trên Breakpoint_Tablet (`md`) trở lên, hiển thị 5 dropdown
 *   nhóm (Số Học, Mệnh Lý, Tiên Tri, Tra Cứu, Trợ Lý AI) qua Radix
 *   `NavigationMenu`. Trợ Lý AI là nhóm chỉ có 1 link `/ai-chat` nên
 *   render dưới dạng link trực tiếp thay vì dropdown để giảm tải tương tác.
 * - **7.3**: Khi đang ở một Module_Page, link tương ứng được tô màu
 *   `text-primary` và gắn `aria-current="page"`. Trigger nhóm cha của
 *   route hiện tại cũng được tô `text-primary` để định vị trực quan.
 * - **7.5**: Logo "HUYỀN BÍ" là `<Link href="/">` dẫn về trang chủ.
 * - **7.7**: Khi user đăng nhập, hiển thị Clerk `<UserButton/>` (avatar
 *   menu chứa Hồ sơ / Lịch sử / Đăng xuất). Khi chưa đăng nhập, hiển
 *   thị link "Đăng nhập" → `/sign-in`.
 * - **7.8**: Navbar dùng `position: sticky` + `backdrop-filter: blur(12px)`
 *   với nền `--background/0.7` để vẫn truy cập được dropdown khi cuộn.
 *
 * Trên `<md`, nội dung dropdown được thay bằng `<MobileDrawer>` đã có
 * sẵn (xem Requirement 7.2 / Task 8.2).
 *
 * Validates: Requirements 7.1, 7.3, 7.5, 7.7, 7.8.
 */
export function Navbar() {
  const [location] = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings, isConfigured } = useAISettings();
  const { theme, toggleTheme } = useTheme();
  const { enabled: cursorEnabled, toggle: toggleCursor } =
    useMysticCursorEnabled();

  const badge = PROVIDER_BADGE[settings.provider] ?? PROVIDER_BADGE["server"];

  const cursorMenuLabel = cursorEnabled
    ? "Tắt hiệu ứng con trỏ"
    : "Bật hiệu ứng con trỏ";

  return (
    <>
      <header
        className={cn(
          // Sticky + backdrop blur (Requirement 7.8). Dùng `sticky` thay vì
          // `fixed` để thẻ không che nội dung và ngắt flow tài liệu — phù
          // hợp design.md "position: sticky; top: 0; …".
          "sticky top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-md no-print",
        )}
      >
        <nav
          aria-label="Điều hướng chính"
          className="container mx-auto px-4 h-16 flex items-center justify-between gap-3"
        >
          {/* Logo → / (Requirement 7.5) */}
          <Link
            href="/"
            aria-label="Huyền Bí — Về trang chủ"
            className="text-xl font-bold tracking-widest text-primary shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-md px-1"
          >
            HUYỀN BÍ
          </Link>

          {/* Desktop nav — md+ (Requirement 7.1) */}
          <div className="hidden md:flex flex-1 justify-center">
            <NavigationMenu>
              <NavigationMenuList className="gap-0.5">
                {NAV_GROUPS.map((group) => {
                  const isAiGroup = group.label === GROUPS.troLyAi.label;
                  const groupActive = group.links.some(
                    (l) => l.href === location,
                  );

                  // Trợ Lý AI chỉ có duy nhất 1 link → render link trực
                  // tiếp để tránh dropdown thừa thãi (UX phẳng hơn).
                  if (isAiGroup && group.links.length === 1) {
                    const link = group.links[0];
                    const active = link.href === location;
                    return (
                      <NavigationMenuItem key={group.label}>
                        <NavigationMenuLink asChild>
                          <Link
                            href={link.href}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "inline-flex h-9 items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-colors",
                              "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground focus-visible:outline-none",
                              active
                                ? "text-primary font-semibold"
                                : "text-muted-foreground",
                            )}
                          >
                            {group.label}
                          </Link>
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    );
                  }

                  return (
                    <NavigationMenuItem key={group.label}>
                      <NavigationMenuTrigger
                        className={cn(
                          "bg-transparent text-sm font-medium",
                          groupActive
                            ? "text-primary"
                            : "text-muted-foreground hover:text-primary",
                        )}
                      >
                        {group.label}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <ul
                          className={cn(
                            "grid gap-1 p-2 min-w-[240px]",
                            group.links.length > 4 && "md:w-[420px] md:grid-cols-2",
                          )}
                        >
                          {group.links.map((link) => (
                            <GroupMenuItem
                              key={link.href}
                              href={link.href}
                              label={link.label}
                              active={link.href === location}
                            />
                          ))}
                        </ul>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right cluster: theme toggle, AI badge, auth, mobile trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              role="switch"
              aria-checked={cursorEnabled}
              onClick={toggleCursor}
              title={cursorMenuLabel}
              aria-label={cursorMenuLabel}
              className={cn(
                "hidden md:inline-flex w-9 h-9 rounded-full border items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                cursorEnabled
                  ? "border-primary/40 text-primary hover:border-primary/60"
                  : "border-border/50 text-muted-foreground hover:text-primary hover:border-primary/50",
              )}
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
              aria-label={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
              className="w-9 h-9 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>

            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              title="Cài đặt AI"
              aria-label="Mở cài đặt AI"
              className={cn(
                "hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                badge.color,
                !isConfigured && "opacity-60 ring-1 ring-red-500/50",
              )}
            >
              <span>{badge.label}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
              </svg>
            </button>

            {/* Auth slot (Requirement 7.7) — md+ only; mobile auth nằm
                trong drawer.  Khi Clerk bị tắt (local demo), không hiển
                thị nút auth nào để tránh dẫn user vào trang Sign-in
                không khả dụng. */}
            {isClerkEnabled && (
              <div className="hidden md:flex items-center">
                <Show
                  when="signed-in"
                  fallback={
                    <Link
                      href="/sign-in"
                      className="text-xs px-3 py-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    >
                      Đăng nhập
                    </Link>
                  }
                >
                  {/* `afterSignOutUrl` không tồn tại trên type của
                      `<UserButton>` ở version Clerk hiện tại — redirect sau
                      sign-out được điều phối bởi Clerk provider/global config
                      thay vì prop. Việc bỏ prop ở đây không thay đổi UX vì
                      `MobileDrawer.signOut()` đã gọi `setLocation("/")` thủ
                      công, còn flow desktop dựa trên cấu hình Clerk mặc định. */}
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox:
                          "w-8 h-8 ring-1 ring-primary/40 hover:ring-primary transition-all",
                      },
                    }}
                  >
                    {/*
                     * Preferences entry — Mystic_Cursor toggle.
                     * `UserButton.MenuItems` lets us inject custom
                     * actions next to the default Hồ sơ / Đăng xuất
                     * items provided by Clerk. The `<Sparkles>` icon
                     * is decorative so it's fine here without a
                     * separate aria-label (UserButton.Action renders
                     * the `label` text for screen readers).
                     */}
                    <UserButton.MenuItems>
                      <UserButton.Action
                        label={cursorMenuLabel}
                        labelIcon={
                          <Sparkles
                            className="w-4 h-4"
                            aria-hidden="true"
                          />
                        }
                        onClick={toggleCursor}
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                </Show>
              </div>
            )}

            {/* Mobile drawer trigger (drawer tự ẩn ở md+ qua className `md:hidden`). */}
            <MobileDrawer />
          </div>
        </nav>
      </header>

      <AISettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
