import { Link } from "wouter";

const FOOTER_COLS = [
  {
    heading: "Số Học",
    links: [
      { href: "/than-so-hoc", label: "Thần Số Học" },
      { href: "/xem-ten", label: "Xem Tên" },
      { href: "/lich-ca-nhan", label: "Lịch Cá Nhân" },
      { href: "/cat-hung", label: "Cát Hung" },
    ],
  },
  {
    heading: "Mệnh Lý",
    links: [
      { href: "/bat-tu", label: "Bát Tự Tứ Trụ" },
      { href: "/tu-vi", label: "Tử Vi Đẩu Số" },
      { href: "/phong-thuy", label: "Phong Thuỷ Bát Trạch" },
      { href: "/sao-han", label: "Sao Hạn Hàng Năm" },
    ],
  },
  {
    heading: "Tiên Tri",
    links: [
      { href: "/xem-que", label: "Xem Quẻ I Ching" },
      { href: "/hop-tuoi", label: "Hợp Tuổi & Duyên Số" },
      { href: "/xem-ngay-tot", label: "Xem Ngày Tốt" },
    ],
  },
  {
    heading: "Tra Cứu",
    links: [
      { href: "/lich-van-nien", label: "Lịch Vạn Niên" },
      { href: "/tu-dien", label: "Từ Điển Huyền Học" },
      { href: "/lich-su", label: "Lịch Sử Tra Cứu" },
      { href: "/ai-chat", label: "Trợ lý AI" },
    ],
  },
];

function StarDecor() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
      {[
        [8, 12], [22, 5], [55, 18], [74, 8], [91, 15],
        [35, 3], [68, 22], [45, 10], [15, 22], [82, 5],
      ].map(([x, y], i) => (
        <div
          key={i}
          className="absolute w-0.5 h-0.5 rounded-full bg-primary"
          style={{ left: `${x}%`, top: `${y * 4}px` }}
        />
      ))}
    </div>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative border-t border-primary/15 bg-gradient-to-b from-background to-primary/3 no-print">
      <StarDecor />

      {/* Main footer grid */}
      <div className="relative max-w-6xl mx-auto px-6 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-8">

          {/* Brand column */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="inline-block">
              <span className="text-2xl font-bold tracking-widest text-primary">HUYỀN BÍ</span>
            </Link>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Nền tảng huyền học Việt Nam kết hợp trí tuệ nhân tạo — khám phá vận mệnh qua 15 hệ thống cổ học.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] text-muted-foreground">Hoạt động 24/7</span>
            </div>
          </div>

          {/* Nav columns */}
          {FOOTER_COLS.map((col) => (
            <div key={col.heading} className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-widest text-primary/80">
                {col.heading}
              </h4>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-primary/10">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground/60">
            &copy; {year} Huyền Bí. Mọi quyền được bảo lưu.
          </p>
          <p className="text-xs text-muted-foreground/50 text-center">
            Mọi luận giải chỉ mang tính tham khảo, không thay thế quyết định cá nhân.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground/60">
            <span>v3.0</span>
            <span>&bull;</span>
            <span>MIT License</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
