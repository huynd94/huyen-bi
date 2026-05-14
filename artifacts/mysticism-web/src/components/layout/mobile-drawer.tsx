import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Sparkles } from "lucide-react";
import { useUser, useClerk, Show } from "@clerk/react";

import { cn } from "@/lib/utils";
import { isClerkEnabled } from "@/lib/auth-config";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FocusTrap } from "@/components/ui/focus-trap";
import { GROUPS, ROUTE_MAP } from "@/components/layout/breadcrumb";
import { useMysticCursorEnabled } from "@/lib/use-mystic-cursor";

/**
 * Một mục liên kết trong drawer mobile.
 */
interface DrawerLink {
  href: string;
  label: string;
}

/**
 * Một nhóm điều hướng trong drawer mobile: nhãn nhóm + danh sách module thuộc
 * nhóm đó. Được dựng từ {@link GROUPS} và {@link ROUTE_MAP} của
 * `breadcrumb.tsx` nên nguồn dữ liệu đơn nhất quán giữa breadcrumb và menu —
 * thêm/sửa route ở `ROUTE_MAP` tự động phản ánh ở drawer.
 */
interface DrawerGroup {
  label: string;
  links: DrawerLink[];
}

/**
 * Dựng cấu trúc 5 nhóm điều hướng từ `GROUPS` + `ROUTE_MAP`. Thứ tự nhóm
 * theo thứ tự khai báo của `GROUPS` (Số Học → Mệnh Lý → Tiên Tri → Tra Cứu →
 * Trợ Lý AI). Trong mỗi nhóm, thứ tự module theo thứ tự duyệt
 * `Object.entries(ROUTE_MAP)` — phản ánh thứ tự khai báo trong file gốc.
 */
function buildGroups(): DrawerGroup[] {
  return Object.values(GROUPS).map((group) => {
    const links: DrawerLink[] = [];
    for (const [path, meta] of Object.entries(ROUTE_MAP)) {
      if (meta.group?.label === group.label) {
        links.push({ href: path, label: meta.label });
      }
    }
    return { label: group.label, links };
  });
}

const NAV_GROUPS: DrawerGroup[] = buildGroups();

/**
 * Section "Tài khoản" trong drawer.
 *
 * - Khi đã đăng nhập: hiển thị header avatar (chữ cái đầu) + email + các link
 *   "Hồ sơ", "Lịch sử" và nút "Đăng xuất".
 * - Khi chưa đăng nhập: hiển thị "Đăng nhập" và "Đăng ký" dưới dạng link.
 *
 * Mọi link đều gọi `onLinkClick` để drawer tự đóng (Property 9).
 */
function AccountSection({ onLinkClick }: { onLinkClick: () => void }) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();

  if (!isLoaded) return null;

  const initial =
    user?.firstName?.[0]?.toUpperCase() ??
    user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ??
    "U";

  return (
    <Show
      when="signed-in"
      fallback={
        <div className="space-y-1">
          <Link
            href="/sign-in"
            onClick={onLinkClick}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors"
          >
            Đăng nhập
          </Link>
          <Link
            href="/sign-up"
            onClick={onLinkClick}
            className="block px-3 py-2.5 rounded-lg text-sm font-medium border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
          >
            Đăng ký
          </Link>
        </div>
      }
    >
      <div className="space-y-2">
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
          <div
            className="w-9 h-9 rounded-full border border-primary/40 bg-primary/15 flex items-center justify-center text-sm font-bold text-primary shrink-0"
            aria-hidden="true"
          >
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user?.fullName ?? "Người dùng"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.emailAddresses?.[0]?.emailAddress ?? ""}
            </p>
          </div>
        </div>

        <div className="space-y-0.5">
          <Link
            href="/profile"
            onClick={onLinkClick}
            className="block px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
          >
            Hồ sơ
          </Link>
          <Link
            href="/lich-su"
            onClick={onLinkClick}
            className="block px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
          >
            Lịch sử
          </Link>
          <button
            type="button"
            onClick={() => {
              onLinkClick();
              signOut(() => setLocation("/"));
            }}
            className="block w-full text-left px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/8 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </Show>
  );
}

/**
 * Phiên bản tối giản của AccountSection khi Clerk chưa được bật (local demo
 * hoặc thiếu `VITE_CLERK_PUBLISHABLE_KEY`). Vẫn giữ link "Lịch sử" (không
 * yêu cầu đăng nhập trên local) nhưng ẩn các nút auth.
 */
function AccountSectionFallback({ onLinkClick }: { onLinkClick: () => void }) {
  return (
    <div className="space-y-0.5">
      <Link
        href="/lich-su"
        onClick={onLinkClick}
        className="block px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
      >
        Lịch sử
      </Link>
    </div>
  );
}

/**
 * Section "Tuỳ chỉnh" trong drawer — hiện tại chỉ chứa toggle
 * Mystic_Cursor (Requirement 17.5). Đặt trong drawer để toggle vẫn truy
 * cập được trên mobile, nơi dropdown Clerk `<UserButton/>` không xuất
 * hiện. Trên desktop, toggle nằm trong avatar dropdown (xem
 * `Navbar`).
 *
 * Toggle dùng `role="switch"` + `aria-checked` để screen reader đọc trạng
 * thái hai pha; nhãn nhìn thấy được luôn ở dạng câu khẳng định ("Hiệu
 * ứng con trỏ huyền bí") và phụ chú trạng thái hiện tại bên phải.
 */
function PreferencesSection() {
  const { enabled, toggle } = useMysticCursorEnabled();
  return (
    <div className="space-y-0.5">
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={toggle}
        className="flex items-center justify-between gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary/70" aria-hidden="true" />
          Hiệu ứng con trỏ huyền bí
        </span>
        <span
          className={cn(
            "text-xs font-semibold rounded-full px-2 py-0.5 border",
            enabled
              ? "bg-primary/15 text-primary border-primary/30"
              : "bg-muted/30 text-muted-foreground border-border/40",
          )}
        >
          {enabled ? "Đang bật" : "Đã tắt"}
        </span>
      </button>
    </div>
  );
}

/**
 * `MobileDrawer` — drawer điều hướng dạng slide-in từ trái cho viewport
 * Breakpoint_Mobile (`< md`).
 *
 * Cấu trúc:
 * - Hamburger trigger ({@link Menu} từ lucide) có `aria-label="Mở menu"`,
 *   chỉ hiển thị ở `md:hidden`.
 * - Drawer dùng primitive {@link Sheet} (wrapper Radix Dialog) ở `side="left"`
 *   để có animation slide-in-from-left, overlay mờ, hỗ trợ `Escape` đóng và
 *   trả focus về trigger sẵn có.
 * - Nội dung drawer được bao bởi {@link FocusTrap} (Radix Focus Scope) như
 *   yêu cầu trong design.md (Requirement 3.6 / 3.7). Vì Sheet đã có
 *   FocusScope sẵn nên auto-focus của FocusTrap được tắt qua
 *   `onMountAutoFocus`/`onUnmountAutoFocus` để tránh đụng độ với Sheet.
 * - 5 nhóm điều hướng (`GROUPS`) + section tài khoản (Hồ sơ, Lịch sử,
 *   Đăng nhập/Đăng ký hoặc avatar) — phối hợp với Clerk hooks khi
 *   `isClerkEnabled === true`.
 *
 * Property 9 — *drawer tự đóng sau khi click một liên kết*: mọi `<Link>` và
 * nút trong drawer đều gọi {@link handleNavigate} → `setOpen(false)`. Vì Sheet
 * dùng controlled `open` prop, lần render kế tiếp drawer chuyển sang trạng
 * thái đóng (overlay/content unmount sau animation, nhưng `open === false`
 * ngay sau tick).
 *
 * Validates: Requirements 4.2, 7.2.
 */
export function MobileDrawer({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();

  /**
   * Đóng drawer khi user click một liên kết. Tách thành hàm riêng để mọi
   * link trong drawer dùng cùng handler — đảm bảo Property 9 (drawer mobile
   * đóng sau khi click link) luôn đúng dù link nằm ở section nào.
   */
  const handleNavigate = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Mở menu"
          className={cn(
            "md:hidden w-9 h-9 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all",
            className,
          )}
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[85vw] max-w-[340px] p-0 flex flex-col gap-0 md:hidden"
      >
        <FocusTrap
          enabled={open}
          onMountAutoFocus={(e) => {
            // Sheet (Radix Dialog) đã tự auto-focus phần tử focusable đầu
            // tiên — không cho FocusTrap auto-focus lại để tránh nhảy focus.
            e.preventDefault();
          }}
          onUnmountAutoFocus={(e) => {
            // Tương tự, Sheet đã trả focus về trigger khi đóng.
            e.preventDefault();
          }}
          asChild
        >
          <div className="flex flex-col h-full">
            <SheetHeader className="px-5 py-4 border-b border-border/40 text-left">
              <SheetTitle className="text-lg font-bold tracking-widest text-primary">
                HUYỀN BÍ
              </SheetTitle>
              <SheetDescription className="sr-only">
                Menu điều hướng các nhóm Số Học, Mệnh Lý, Tiên Tri, Tra Cứu,
                Trợ Lý AI và mục tài khoản.
              </SheetDescription>
            </SheetHeader>

            <nav
              aria-label="Điều hướng chính"
              className="flex-1 overflow-y-auto px-3 py-3 space-y-4"
            >
              {NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                    {group.label}
                  </p>
                  <ul className="space-y-0.5">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          onClick={handleNavigate}
                          aria-current={
                            location === link.href ? "page" : undefined
                          }
                          className={cn(
                            "block px-3 py-2.5 rounded-lg text-sm transition-colors",
                            location === link.href
                              ? "bg-primary/15 text-primary font-semibold"
                              : "text-muted-foreground hover:bg-primary/8 hover:text-foreground",
                          )}
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="pt-3 border-t border-border/40">
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Tài khoản
                </p>
                {isClerkEnabled ? (
                  <AccountSection onLinkClick={handleNavigate} />
                ) : (
                  <AccountSectionFallback onLinkClick={handleNavigate} />
                )}
              </div>

              <div className="pt-3 border-t border-border/40">
                <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  Tuỳ chỉnh
                </p>
                <PreferencesSection />
              </div>
            </nav>
          </div>
        </FocusTrap>
      </SheetContent>
    </Sheet>
  );
}
