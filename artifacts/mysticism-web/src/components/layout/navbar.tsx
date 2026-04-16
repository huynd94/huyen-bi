import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useUser, useClerk, Show } from "@clerk/react";
import { cn } from "@/lib/utils";
import { useAISettings } from "@/contexts/ai-settings";
import { useTheme } from "@/contexts/theme";
import { AISettingsModal } from "@/components/ai-settings-modal";
import { isClerkEnabled } from "@/lib/auth-config";

type NavChild = { href: string; label: string; desc?: string };
type NavGroup = { label: string; children: NavChild[] };
type NavItem = { href: string; label: string } | NavGroup;

function isGroup(item: NavItem): item is NavGroup {
  return "children" in item;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Trang chủ" },
  {
    label: "Số Học",
    children: [
      { href: "/than-so-hoc", label: "Thần Số Học", desc: "Số vận mệnh & năm cá nhân" },
      { href: "/xem-ten", label: "Xem Tên", desc: "Phân tích Ngũ Cách tên người" },
      { href: "/lich-ca-nhan", label: "Lịch Cá Nhân", desc: "Năm, tháng, ngày cá nhân" },
      { href: "/cat-hung", label: "Cát Hung", desc: "Điện thoại & biển số xe" },
    ],
  },
  {
    label: "Mệnh Lý",
    children: [
      { href: "/bat-tu", label: "Bát Tự Tứ Trụ", desc: "Tứ trụ, Ngũ Hành & Đại Vận" },
      { href: "/tu-vi", label: "Tử Vi Đẩu Số", desc: "12 cung & 14 chính tinh" },
      { href: "/phong-thuy", label: "Phong Thuỷ Bát Trạch", desc: "Hướng nhà & Mệnh Quái" },
      { href: "/sao-han", label: "Sao Hạn Hàng Năm", desc: "Sao chiếu mệnh 7 năm" },
    ],
  },
  {
    label: "Tiên Tri",
    children: [
      { href: "/xem-que", label: "Xem Quẻ I Ching", desc: "64 quẻ Kinh Dịch cổ đại" },
      { href: "/hop-tuoi", label: "Hợp Tuổi & Duyên Số", desc: "Tương hợp đôi bạn" },
      { href: "/xem-ngay-tot", label: "Xem Ngày Tốt", desc: "Ngày Hoàng Đạo theo mục đích" },
    ],
  },
  {
    label: "Tra Cứu",
    children: [
      { href: "/lich-van-nien", label: "Lịch Vạn Niên", desc: "Âm lịch & Can Chi" },
      { href: "/tu-dien", label: "Từ Điển Huyền Học", desc: "Can, Chi, Ngũ Hành, Bát Quái" },
      { href: "/lich-su", label: "Lịch Sử Tra Cứu", desc: "Xem lại kết quả đã tra" },
    ],
  },
  { href: "/ai-chat", label: "Trợ lý AI" },
];

const PROVIDER_BADGE: Record<string, { label: string; color: string }> = {
  server: { label: "AI", color: "bg-primary/20 text-primary border-primary/40" },
  openai: { label: "GPT", color: "bg-green-500/20 text-green-400 border-green-500/40" },
  gemini: { label: "Gem", color: "bg-blue-500/20 text-blue-400 border-blue-500/40" },
};

function SunIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22" x2="7.05" y2="7.05"/><line x1="16.95" y1="16.95" x2="19.78" y2="19.78"/>
      <line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="7.05" y2="16.95"/><line x1="16.95" y1="7.05" x2="19.78" y2="4.22"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn("w-3 h-3 transition-transform duration-200", open && "rotate-180")}
      fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function DropdownMenu({ group, location }: { group: NavGroup; location: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = group.children.some((c) => c.href === location);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1 text-xs tracking-wide transition-colors hover:text-primary py-1",
          isActive ? "text-primary font-semibold" : "text-muted-foreground"
        )}
      >
        {group.label}
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50"
        >
          <div className="min-w-[220px] rounded-xl border border-border/60 bg-background/95 backdrop-blur-md shadow-xl shadow-black/30 py-1.5 overflow-hidden">
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 border-b border-border/30 mb-1">
              {group.label}
            </div>
            {group.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex flex-col px-3 py-2 mx-1 rounded-lg transition-colors group",
                  location === child.href
                    ? "bg-primary/15 text-primary"
                    : "hover:bg-primary/8 text-foreground"
                )}
              >
                <span className={cn("text-sm font-medium", location === child.href ? "text-primary" : "group-hover:text-primary transition-colors")}>
                  {child.label}
                </span>
                {child.desc && (
                  <span className="text-[11px] text-muted-foreground mt-0.5">{child.desc}</span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MobileGroupSection({
  group,
  location,
  onClose,
}: {
  group: NavGroup;
  location: string;
  onClose: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isActive = group.children.some((c) => c.href === location);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
        )}
      >
        <span>{group.label}</span>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <div className="ml-3 mt-0.5 space-y-0.5 border-l border-primary/20 pl-3">
          {group.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              onClick={onClose}
              className={cn(
                "block px-2 py-2 rounded-lg text-sm transition-colors",
                location === child.href
                  ? "text-primary font-semibold bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
              )}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function UserButton() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!isLoaded) return null;

  return (
    <Show
      when="signed-in"
      fallback={
        <div className="flex items-center gap-1">
          <Link href="/sign-in">
            <button className="text-xs px-3 py-1.5 rounded-lg text-muted-foreground hover:text-primary transition-colors">
              Đăng nhập
            </button>
          </Link>
          <Link href="/sign-up">
            <button className="text-xs px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-all">
              Đăng ký
            </button>
          </Link>
        </div>
      }
    >
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-8 h-8 rounded-full border border-primary/40 bg-primary/15 flex items-center justify-center text-sm font-bold text-primary hover:border-primary hover:bg-primary/25 transition-all"
          title={user?.fullName ?? "Tài khoản"}
        >
          {user?.firstName?.[0]?.toUpperCase() ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "U"}
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border/60 bg-background/97 backdrop-blur-md shadow-xl py-1.5 z-50">
            <div className="px-3 py-2 border-b border-border/30">
              <p className="text-sm font-medium text-foreground truncate">{user?.fullName ?? "Người dùng"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.emailAddresses?.[0]?.emailAddress}</p>
            </div>
            <Link href="/profile" onClick={() => setOpen(false)}>
              <button className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-primary/8 hover:text-primary transition-colors">
                Hồ Sơ & Lá Số
              </button>
            </Link>
            <button
              onClick={() => { setOpen(false); signOut(() => setLocation("/")); }}
              className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-red-500/8 hover:text-red-400 transition-colors"
            >
              Đăng xuất
            </button>
          </div>
        )}
      </div>
    </Show>
  );
}

export function Navbar() {
  const [location] = useLocation();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { settings, isConfigured } = useAISettings();
  const { theme, toggleTheme } = useTheme();

  const badge = PROVIDER_BADGE[settings.provider] ?? PROVIDER_BADGE["server"];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/85 backdrop-blur-md no-print">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-widest text-primary shrink-0">
            HUYỀN BÍ
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-5 flex-1 justify-center px-6">
            {NAV_ITEMS.map((item) =>
              isGroup(item) ? (
                <DropdownMenu key={item.label} group={item} location={location} />
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-xs tracking-wide transition-colors hover:text-primary whitespace-nowrap py-1",
                    location === item.href ? "text-primary font-semibold" : "text-muted-foreground"
                  )}
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}
              className="w-8 h-8 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
            >
              {theme === "dark" ? <SunIcon /> : <MoonIcon />}
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              title="Cài đặt AI"
              className={cn(
                "hidden sm:flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all hover:opacity-80",
                badge.color,
                !isConfigured && "opacity-60 ring-1 ring-red-500/50"
              )}
            >
              <span>{badge.label}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
              </svg>
            </button>

            {isClerkEnabled && (
              <div className="hidden lg:flex">
                <UserButton />
              </div>
            )}

            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden w-8 h-8 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 transition-all"
            >
              {mobileOpen ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border/40 bg-background/97 backdrop-blur-md px-4 py-3 space-y-1 max-h-[75vh] overflow-y-auto">
            {NAV_ITEMS.map((item) =>
              isGroup(item) ? (
                <MobileGroupSection
                  key={item.label}
                  group={item}
                  location={location}
                  onClose={() => setMobileOpen(false)}
                />
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "block px-3 py-2.5 rounded-lg text-sm transition-colors font-medium",
                    location === item.href
                      ? "bg-primary/15 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-primary/8 hover:text-foreground"
                  )}
                >
                  {item.label}
                </Link>
              )
            )}
          </div>
        )}
      </nav>

      <AISettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
