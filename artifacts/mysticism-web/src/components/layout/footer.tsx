import { Link } from "wouter";

import { GROUPS, ROUTE_MAP } from "@/components/layout/breadcrumb";

/**
 * Một liên kết hiển thị trong footer.
 */
interface FooterLink {
  href: string;
  label: string;
  /**
   * Khi `true`, link mở tab mới (chỉ dùng cho các link chính sách
   * placeholder hiện chưa có trang đích thực sự).
   */
  external?: boolean;
}

/**
 * Cột nhóm modules trong footer — chỉ gồm 4 nhóm điều hướng nội dung
 * (`Số Học`, `Mệnh Lý`, `Tiên Tri`, `Tra Cứu`). Theo Requirement 12.6, nhóm
 * Trợ Lý AI được "collapse" thành một entry độc lập "Trợ lý AI" thay vì hiển
 * thị thành sub-group có list con — giúp footer gọn hơn và phản ánh đúng
 * trọng tâm điều hướng (1 trang AI duy nhất).
 *
 * Nguồn dữ liệu vẫn là {@link GROUPS} + {@link ROUTE_MAP} của `breadcrumb.tsx`
 * để footer luôn nhất quán với breadcrumb và mobile drawer.
 */
interface FooterGroup {
  label: string;
  /** Anchor của nhóm trên trang chủ — hữu ích khi click tiêu đề nhóm. */
  anchor?: string;
  links: FooterLink[];
}

/**
 * Bốn nhóm nội dung chính (loại trừ `Trợ Lý AI`). Trật tự theo khai báo
 * trong {@link GROUPS}.
 */
const CONTENT_GROUP_LABELS: ReadonlyArray<string> = [
  GROUPS.soHoc.label,
  GROUPS.menhLy.label,
  GROUPS.tienTri.label,
  GROUPS.traCuu.label,
];

/**
 * Build danh sách 4 nhóm nội dung từ {@link GROUPS} + {@link ROUTE_MAP}.
 * Trong mỗi nhóm, thứ tự liên kết theo thứ tự khai báo của `ROUTE_MAP`.
 */
function buildModuleGroups(): FooterGroup[] {
  return CONTENT_GROUP_LABELS.map((groupLabel) => {
    const group = Object.values(GROUPS).find((g) => g.label === groupLabel)!;
    const links: FooterLink[] = [];
    for (const [path, meta] of Object.entries(ROUTE_MAP)) {
      if (meta.group?.label === group.label) {
        links.push({ href: path, label: meta.label });
      }
    }
    return { label: group.label, anchor: group.anchor, links };
  });
}

const MODULE_GROUPS: FooterGroup[] = buildModuleGroups();

/**
 * Link rút gọn cho Trợ Lý AI — thay vì hiển thị như một sub-group, ta gom
 * lại thành một entry duy nhất ngay sau danh sách 4 nhóm nội dung.
 */
const AI_LINK: FooterLink = { href: "/ai-chat", label: "Trợ lý AI" };

/**
 * Cột "Tài khoản" theo Requirement 12.6 — gồm Hồ sơ, Lịch sử, Đăng ký và
 * Đăng nhập.
 */
const ACCOUNT_LINKS: FooterLink[] = [
  { href: "/profile", label: "Hồ sơ" },
  { href: "/lich-su", label: "Lịch sử" },
  { href: "/sign-up", label: "Đăng ký" },
  { href: "/sign-in", label: "Đăng nhập" },
];

/**
 * Cột "Chính sách" theo Requirement 12.6 — placeholder cho các trang chính
 * sách & điều khoản sẽ bổ sung sau. Hiện tại trỏ về anchor `#` để tránh
 * "broken link" khi build, đồng thời giữ chỗ trong footer.
 */
const POLICY_LINKS: FooterLink[] = [
  { href: "#", label: "Điều khoản" },
  { href: "#", label: "Quyền riêng tư" },
  { href: "#", label: "Liên hệ" },
];

/**
 * Star field decorator — giữ nguyên trang trí huyền học, opacity thấp để
 * không phá vỡ contrast của text bên trên (Requirement 2.x).
 */
function StarDecor() {
  const stars: Array<readonly [number, number]> = [
    [8, 12], [22, 5], [55, 18], [74, 8], [91, 15],
    [35, 3], [68, 22], [45, 10], [15, 22], [82, 5],
  ];
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-20"
    >
      {stars.map(([x, y], i) => (
        <div
          key={i}
          className="absolute h-0.5 w-0.5 rounded-full bg-primary"
          style={{ left: `${x}%`, top: `${y * 4}px` }}
        />
      ))}
    </div>
  );
}

/**
 * Liên kết footer dùng style chung. Tách thành component nhỏ để cột
 * placeholder (`href: "#"`) cũng nhận đúng class.
 */
function FooterLinkItem({ link }: { link: FooterLink }) {
  const isAnchor = link.href.startsWith("#") || link.external;
  const className =
    "text-sm text-muted-foreground transition-colors duration-200 hover:text-primary";

  if (isAnchor) {
    return (
      <a
        href={link.href}
        {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={className}
      >
        {link.label}
      </a>
    );
  }
  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

/**
 * `Footer` — chân trang dùng chung cho mọi route.
 *
 * Layout grid theo Requirement 12.6:
 * - `≥ 1024px` (lg): 4 cột — Modules · Tài khoản · Chính sách · Phiên bản.
 * - `≥ 768px` (md): 2 cột.
 * - `< 768px` (mobile): 1 cột (xếp dọc).
 *
 * Cột Modules tổng hợp 4 nhóm điều hướng nội dung (Số Học, Mệnh Lý, Tiên
 * Tri, Tra Cứu) lấy nguồn từ `GROUPS` + `ROUTE_MAP` của breadcrumb để mọi
 * mục cùng đồng bộ với navbar và drawer mobile. Nhóm Trợ Lý AI được rút
 * gọn thành một entry độc lập "Trợ lý AI" trỏ tới `/ai-chat`.
 *
 * Phiên bản ứng dụng (`v{__APP_VERSION__}`) đến từ define mà Vite inject
 * từ `package.json#version` lúc build (xem `vite.config.ts → define`).
 *
 * Bottom bar giữ brand mark, copyright và disclaimer theo thiết kế cũ.
 *
 * Validates: Requirements 12.6.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="no-print relative border-t border-primary/15 bg-gradient-to-b from-background to-primary/5">
      <StarDecor />

      {/* Main footer grid: 4 / 2 / 1 cột theo breakpoint. */}
      <div className="relative mx-auto max-w-6xl px-6 pt-14 pb-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {/* Cột 1 — Modules: 4 nhóm nội dung + Trợ lý AI rút gọn. */}
          <section
            aria-labelledby="footer-modules-heading"
            className="space-y-5"
          >
            <h2
              id="footer-modules-heading"
              className="text-xs font-semibold uppercase tracking-widest text-primary/80"
            >
              Modules
            </h2>
            <div className="space-y-5">
              {MODULE_GROUPS.map((group) => (
                <div key={group.label} className="space-y-2">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                    {group.anchor ? (
                      <a
                        href={group.anchor}
                        className="hover:text-primary transition-colors"
                      >
                        {group.label}
                      </a>
                    ) : (
                      group.label
                    )}
                  </h3>
                  <ul className="space-y-1.5">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <FooterLinkItem link={link} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              {/* Trợ Lý AI — collapse thành một link duy nhất. */}
              <ul className="space-y-1.5">
                <li>
                  <FooterLinkItem link={AI_LINK} />
                </li>
              </ul>
            </div>
          </section>

          {/* Cột 2 — Tài khoản. */}
          <section
            aria-labelledby="footer-account-heading"
            className="space-y-3"
          >
            <h2
              id="footer-account-heading"
              className="text-xs font-semibold uppercase tracking-widest text-primary/80"
            >
              Tài khoản
            </h2>
            <ul className="space-y-2">
              {ACCOUNT_LINKS.map((link) => (
                <li key={link.href}>
                  <FooterLinkItem link={link} />
                </li>
              ))}
            </ul>
          </section>

          {/* Cột 3 — Chính sách (placeholder). */}
          <section
            aria-labelledby="footer-policy-heading"
            className="space-y-3"
          >
            <h2
              id="footer-policy-heading"
              className="text-xs font-semibold uppercase tracking-widest text-primary/80"
            >
              Chính sách
            </h2>
            <ul className="space-y-2">
              {POLICY_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLinkItem link={link} />
                </li>
              ))}
            </ul>
          </section>

          {/* Cột 4 — Brand + phiên bản. */}
          <section
            aria-labelledby="footer-brand-heading"
            className="space-y-4"
          >
            <h2 id="footer-brand-heading" className="sr-only">
              Huyền Bí
            </h2>
            <Link href="/" className="inline-block">
              <span className="text-2xl font-bold tracking-widest text-primary">
                HUYỀN BÍ
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Nền tảng huyền học Việt Nam kết hợp trí tuệ nhân tạo — khám phá
              vận mệnh qua 15 hệ thống cổ học.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <span
                aria-hidden="true"
                className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"
              />
              <span className="text-[11px] text-muted-foreground">
                Hoạt động 24/7
              </span>
            </div>
            <p className="pt-2 text-[11px] text-muted-foreground/70">
              Phiên bản{" "}
              <span className="font-mono text-muted-foreground">
                v{__APP_VERSION__}
              </span>
            </p>
          </section>
        </div>
      </div>

      {/* Bottom bar — copyright + disclaimer. */}
      <div className="relative border-t border-primary/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-5 sm:flex-row">
          <p className="text-xs text-muted-foreground/60">
            &copy; {year} Huyền Bí. Mọi quyền được bảo lưu.
          </p>
          <p className="text-center text-xs text-muted-foreground/50">
            Mọi luận giải chỉ mang tính tham khảo, không thay thế quyết định
            cá nhân.
          </p>
          <p className="text-xs text-muted-foreground/60">MIT License</p>
        </div>
      </div>
    </footer>
  );
}
