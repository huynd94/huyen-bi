import { Link } from "wouter";
import {
  BookOpen,
  BookMarked,
  Bot,
  Calendar,
  CalendarCheck,
  CalendarDays,
  Compass,
  Gem,
  Hash,
  Heart,
  Hexagon,
  History,
  Infinity as InfinityIcon,
  MoonStar,
  Phone,
  Sigma,
  Sparkles,
  Star,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useScrollRevealAll } from "@/hooks/use-scroll-reveal";

/**
 * Một mô-đun tra cứu hiển thị trên trang chủ.
 *
 * Trường:
 * - `href`     — đường dẫn nội bộ tới Module_Page (vùng click toàn card).
 * - `icon`     — lucide-react icon (Requirement 10.7) thay cho emoji generic.
 * - `title`    — tên mô-đun, render trong `<h3>` (Requirement 12.3).
 * - `desc`     — mô tả tiếng Việt ≤ 90 ký tự (Requirement 12.3).
 */
interface ModuleCard {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}

/**
 * Một nhóm điều hướng (5 nhóm tổng) hiển thị trên trang chủ.
 *
 * Mỗi nhóm có `<h2>` riêng (Requirement 12.5) và một anchor `id` để liên
 * kết từ Navbar / Footer / Breadcrumb (`/#nhom-...`).
 */
interface ModuleGroup {
  /** Anchor id, đồng bộ với `GROUPS.<key>.anchor` trong `breadcrumb.tsx`. */
  id: string;
  label: string;
  /** Một dòng dẫn nhập tóm lược tinh thần nhóm (≤ 100 ký tự). */
  tagline: string;
  modules: ModuleCard[];
}

/**
 * Cấu trúc 15 mô-đun tra cứu, nhóm theo đúng 5 nhóm điều hướng được khai
 * báo trong `src/components/layout/breadcrumb.tsx` (`GROUPS`):
 *
 * - Số Học (2): Thần Số Học, Xem Tên
 * - Mệnh Lý (3): Bát Tự, Tử Vi, Sao Hạn
 * - Tiên Tri (3): Xem Quẻ, Xem Ngày Tốt, Hợp Tuổi
 * - Tra Cứu (5): Lịch Vạn Niên, Lịch Cá Nhân, Cát Hung, Phong Thuỷ, Từ Điển
 * - Trợ Lý AI + Lưu trữ (2): Trợ Lý AI, Lịch Sử
 *
 * Tổng: 15 mô-đun (Requirement 12.2). Lịch Sử thuộc nhóm "Trợ Lý AI" theo
 * navbar và breadcrumb hiện hành.
 *
 * Ràng buộc text:
 * - `desc` ≤ 90 ký tự (Requirement 12.3) — đã được kiểm bằng comment kèm
 *   số ký tự thực tế ở bên phải để dễ bảo trì.
 */
const MODULE_GROUPS: readonly ModuleGroup[] = [
  {
    id: "nhom-so-hoc",
    label: "Số Học",
    tagline: "Giải mã năng lượng ẩn trong tên gọi và ngày sinh.",
    modules: [
      {
        href: "/than-so-hoc",
        icon: Hash,
        title: "Thần Số Học",
        desc: "Số vận mệnh, năm cá nhân, chu kỳ đời người theo Pythagoras và phương Đông.", // 79
      },
      {
        href: "/xem-ten",
        icon: BookMarked,
        title: "Xem Tên",
        desc: "Phân tích Ngũ Cách của họ tên: Thiên, Nhân, Địa, Ngoại, Tổng và ngũ hành.", // 80
      },
    ],
  },
  {
    id: "nhom-menh-ly",
    label: "Mệnh Lý",
    tagline: "Lập lá số chi tiết theo cổ học phương Đông.",
    modules: [
      {
        href: "/bat-tu",
        icon: Sigma,
        title: "Bát Tự Tứ Trụ",
        desc: "Lập tứ trụ Can Chi, cân bằng Ngũ Hành và tiên đoán đại vận, tiểu vận.", // 75
      },
      {
        href: "/tu-vi",
        icon: Star,
        title: "Tử Vi Đẩu Số",
        desc: "Lá số 12 cung với chính tinh, phụ tinh và luận giải mệnh cục từ AI.", // 70
      },
      {
        href: "/sao-han",
        icon: MoonStar,
        title: "Sao Hạn Hàng Năm",
        desc: "Tra cứu Thái Tuế, Thái Dương, La Hầu, Phúc Tinh trong 7 năm liên tiếp.", // 76
      },
    ],
  },
  {
    id: "nhom-tien-tri",
    label: "Tiên Tri",
    tagline: "Đặt câu hỏi và lắng nghe thông điệp từ vũ trụ.",
    modules: [
      {
        href: "/xem-que",
        icon: Hexagon,
        title: "Xem Quẻ I Ching",
        desc: "Gieo quẻ cổ truyền, tra 64 quẻ Dịch và 384 hào với diễn giải sâu sắc.", // 75
      },
      {
        href: "/xem-ngay-tot",
        icon: CalendarCheck,
        title: "Xem Ngày Tốt",
        desc: "Chọn ngày Hoàng Đạo cho cưới hỏi, khai trương, động thổ, xuất hành.", // 70
      },
      {
        href: "/hop-tuoi",
        icon: Heart,
        title: "Hợp Tuổi & Duyên Số",
        desc: "Phân tích tương hợp qua Mệnh Quái, Can Chi, Cung Tuổi và Đường Đời.", // 71
      },
    ],
  },
  {
    id: "nhom-tra-cuu",
    label: "Tra Cứu",
    tagline: "Bộ công cụ tra cứu nhanh, dùng hằng ngày.",
    modules: [
      {
        href: "/lich-van-nien",
        icon: CalendarDays,
        title: "Lịch Vạn Niên",
        desc: "Tra ngày âm, Can Chi, Hoàng Đạo và giờ tốt trong ngày bất kỳ.", // 65
      },
      {
        href: "/lich-ca-nhan",
        icon: Calendar,
        title: "Lịch Cá Nhân",
        desc: "Năm, tháng, ngày cá nhân theo thần số kèm gợi ý hành động.", // 62
      },
      {
        href: "/cat-hung",
        icon: Phone,
        title: "Cát Hung",
        desc: "Luận giải cát hung của số điện thoại và biển số xe theo huyền số.", // 69
      },
      {
        href: "/phong-thuy",
        icon: Compass,
        title: "Phong Thuỷ Bát Trạch",
        desc: "Mệnh Quái, 4 hướng tốt và 4 hướng xấu cho nhà ở, bàn làm việc.", // 64
      },
      {
        href: "/tu-dien",
        icon: BookOpen,
        title: "Từ Điển Huyền Học",
        desc: "Tra Thiên Can, Địa Chi, Ngũ Hành, Bát Quái và các con số thần số.", // 70
      },
    ],
  },
  {
    id: "nhom-tro-ly-ai",
    label: "Trợ Lý AI",
    tagline: "Hỏi đáp huyền học và xem lại mọi tra cứu.",
    modules: [
      {
        href: "/ai-chat",
        icon: WandSparkles,
        title: "Trợ Lý AI",
        desc: "Trò chuyện với chuyên gia huyền học AI về tâm linh, số mệnh, phong thuỷ.", // 79
      },
      {
        href: "/lich-su",
        icon: History,
        title: "Lịch Sử Tra Cứu",
        desc: "Xem lại toàn bộ lá số đã lưu, tìm kiếm và lọc theo mô-đun.", // 62
      },
    ],
  },
];

/**
 * Câu trích dẫn mở đầu phần "tinh thần". Tách riêng để bảo trì dễ hơn và
 * tránh inline string trong JSX.
 */
const QUOTE = {
  text: "Thiên địa bất nhân, dĩ vạn vật vi sô cẩu.",
  trans:
    "Trời đất không thiên vị, coi vạn vật như chó rơm — mọi thứ vận hành theo quy luật tự nhiên.",
  source: "Đạo Đức Kinh — Lão Tử",
};

/**
 * Bốn điểm khác biệt nêu trong section "Điểm Khác Biệt". Icon dùng
 * lucide-react (Requirement 10.7) thay cho ký tự decorative trước đây.
 */
const FEATURES: ReadonlyArray<{
  icon: LucideIcon;
  title: string;
  desc: string;
}> = [
  {
    icon: Gem,
    title: "Kết hợp Đông - Tây",
    desc: "Tích hợp Kinh Dịch, Tứ Trụ, Tử Vi, Ngũ Hành cùng Numerology Pythagoras vào một nền tảng.",
  },
  {
    icon: Sparkles,
    title: "AI Giải Mã Chuyên Sâu",
    desc: "GPT-5.4 và Gemini 3.0 được định hướng huyền học để đưa ra phân tích cá nhân hóa.",
  },
  {
    icon: BookMarked,
    title: "Lưu & Chia Sẻ",
    desc: "Lưu lịch sử tra cứu trong trình duyệt, sao chép, in ấn hoặc chia sẻ luận giải.",
  },
  {
    icon: InfinityIcon,
    title: "Bảo Mật Tuyệt Đối",
    desc: "Dữ liệu cá nhân và khoá API chỉ lưu trên thiết bị, không gửi lên máy chủ.",
  },
];

/**
 * Card hiển thị một mô-đun trong grid trang chủ.
 *
 * Yêu cầu Requirement 12.3:
 * - Toàn bộ card là vùng click duy nhất dẫn tới Module_Page → bọc
 *   bằng `<Link>` thay vì đặt nút "Xem chi tiết" tách rời.
 * - Tiêu đề render `<h3>`, mô tả ≤ 90 ký tự.
 * - Icon lucide-react thay cho emoji / glyph CJK trang trí trước đây.
 *
 * Card dùng primitive {@link Card} (token semantic, bo `--radius-lg`,
 * shadow nhẹ) thay vì class tuỳ biến — bám đúng Spec design system.
 */
function ModuleCardItem({ module }: { module: ModuleCard }) {
  const Icon = module.icon;
  return (
    <Link
      href={module.href}
      className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card className="h-full p-6 transition-colors duration-200 hover:border-primary/40 hover:bg-card/80">
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary transition-colors duration-200 group-hover:border-primary/60 group-hover:bg-primary/15"
          >
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <h3 className="text-base font-semibold text-foreground transition-colors duration-200 group-hover:text-primary">
              {module.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {module.desc}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1.5 text-xs text-primary/70 transition-colors duration-200 group-hover:text-primary">
          <span>Vào tra cứu</span>
          <span
            aria-hidden="true"
            className="transition-transform duration-200 group-hover:translate-x-1"
          >
            →
          </span>
        </div>
      </Card>
    </Link>
  );
}

/**
 * Trang chủ Huyền Bí.
 *
 * Bố cục theo Requirement 12 + 10:
 *
 * 1. **Hero ≤ 70vh** (Requirement 10.4 + 12.1): tiêu đề `<h1>` thương hiệu,
 *    một dòng mô tả ≤ 120 ký tự, hai CTA (mô-đun phổ biến và Trợ Lý AI).
 *    Không còn ép `min-h-[100dvh]` để tránh padding khổng lồ "AI hero".
 * 2. **Năm nhóm mô-đun**: 5 section, mỗi section có `<h2>` (Requirement
 *    12.5) và grid responsive 1 / 2 / 3 / 4–5 cột (Requirement 12.2).
 * 3. **Card mô-đun**: icon lucide, `<h3>` tiêu đề, mô tả ≤ 90 ký tự, vùng
 *    click toàn card (Requirement 12.3 + 10.7).
 * 4. **Scroll reveal nhẹ**: dùng `data-reveal` (translateY 28px, 700ms,
 *    ease-out) một lần cho mỗi section, không lặp khi cuộn lên — tuân
 *    thủ Requirement 9.5 và 12.4.
 * 5. **Token semantic**: chỉ dùng class Tailwind theo `--primary`, `--card`,
 *    `--muted-foreground`, `--border`; không hex (Requirement 1.1, 10.2).
 *
 * Validates: Requirements 4.4, 9.5, 10.1, 10.4, 10.7, 12.1, 12.2, 12.3,
 * 12.4, 12.5.
 */
export default function Home() {
  useScrollRevealAll();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Navbar />

      {/* ── Hero (≤ 70vh) ───────────────────────────────────────────── */}
      <section
        aria-labelledby="hero-heading"
        className="relative z-10 flex min-h-[60vh] max-h-[70vh] items-center justify-center overflow-hidden px-4 py-12 md:py-16"
      >
        <div className="relative z-10 mx-auto w-full max-w-3xl space-y-6 text-center">
          <span
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-1.5 text-xs uppercase tracking-widest text-primary"
          >
            <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
            Huyền Học Phương Đông &amp; Phương Tây
          </span>

          <h1
            id="hero-heading"
            className="font-serif text-4xl font-bold leading-tight tracking-wide text-foreground sm:text-5xl md:text-6xl"
          >
            Huyền Bí —{" "}
            <span className="shimmer-text">Khám Phá Vận Mệnh</span>
          </h1>

          {/* Mô tả ≤ 120 ký tự (Requirement 12.1). Đếm thực tế: 117. */}
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Nền tảng huyền học Việt Nam kết hợp Thần Số, Tử Vi, Kinh Dịch,
            Phong Thuỷ và trợ lý AI cho mỗi câu hỏi của bạn.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <Button asChild size="lg" className="btn-ripple w-full sm:w-auto">
              <Link href="/than-so-hoc">Bắt đầu khám phá</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-primary/30 text-primary hover:bg-primary/10 sm:w-auto"
            >
              <Link href="/ai-chat">
                <WandSparkles aria-hidden="true" className="h-4 w-4" />
                Hỏi Trợ Lý AI
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── 5 Nhóm mô-đun ───────────────────────────────────────────── */}
      {MODULE_GROUPS.map((group) => (
        <section
          key={group.id}
          id={group.id}
          aria-label={group.label}
          aria-labelledby={`${group.id}-heading`}
          className="home-deferred-section relative z-10 px-4 py-14 md:py-16"
        >
          <div className="mx-auto max-w-6xl space-y-8" data-reveal>
            <div className="space-y-2 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-primary/70">
                Nhóm mô-đun
              </p>
              <h2
                id={`${group.id}-heading`}
                className="font-serif text-3xl font-bold text-foreground md:text-4xl"
              >
                {group.label}
              </h2>
              <p className="mx-auto max-w-xl text-sm text-muted-foreground md:text-base">
                {group.tagline}
              </p>
              <div className="magic-line mx-auto mt-2 max-w-xs" />
            </div>

            {/* Flex-based centering: naturally centers items when the last
                row is incomplete. Responsive widths on cards replicate the
                previous 1 / 2 / 3 / 4–5 column behavior (Requirement 12.2)
                while centering incomplete rows (Bug 1.2 fix). */}
            <div className="flex flex-wrap justify-center gap-4">
              {group.modules.map((m) => (
                <div
                  key={m.href}
                  className={
                    group.modules.length === 5
                      ? "w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[calc(20%-0.8rem)]"
                      : "w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)] xl:w-[calc(25%-0.75rem)]"
                  }
                >
                  <ModuleCardItem module={m} />
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* ── Quote ───────────────────────────────────────────────────── */}
      <section
        aria-label="Trích dẫn cổ học"
        aria-labelledby="quote-heading"
        className="home-deferred-section relative z-10 px-4 py-14"
      >
        <div className="mx-auto max-w-3xl text-center" data-reveal>
          <Card className="space-y-3 border-primary/25 bg-primary/5 px-8 py-10">
            <h2 id="quote-heading" className="sr-only">
              Trích dẫn cổ học
            </h2>
            <blockquote className="space-y-3">
              <p className="font-serif text-2xl font-semibold italic leading-relaxed text-primary md:text-3xl">
                {QUOTE.text}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {QUOTE.trans}
              </p>
              <footer className="text-xs uppercase tracking-widest text-primary/60">
                {QUOTE.source}
              </footer>
            </blockquote>
          </Card>
        </div>
      </section>

      {/* ── Điểm khác biệt ─────────────────────────────────────────── */}
      <section
        aria-label="Điểm Khác Biệt"
        aria-labelledby="features-heading"
        className="home-deferred-section relative z-10 px-4 py-16"
      >
        <div className="mx-auto max-w-6xl space-y-8" data-reveal>
          <div className="space-y-2 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/70">
              Tại sao chọn chúng tôi
            </p>
            <h2
              id="features-heading"
              className="font-serif text-3xl font-bold md:text-4xl"
            >
              Điểm Khác Biệt
            </h2>
            <div className="magic-line mx-auto mt-2 max-w-xs" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <Card
                  key={f.title}
                  className="space-y-3 border-primary/15 bg-card/60 p-6 transition-colors duration-200 hover:border-primary/35"
                >
                  <span
                    aria-hidden="true"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-semibold text-foreground">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {f.desc}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA cuối ───────────────────────────────────────────────── */}
      <section
        aria-label="Sẵn Sàng Khám Phá"
        aria-labelledby="cta-heading"
        className="home-deferred-section relative z-10 px-4 py-16"
      >
        <div className="mx-auto max-w-3xl" data-reveal>
          <Card className="space-y-5 border-primary/25 bg-card/70 p-10 text-center">
            <h2
              id="cta-heading"
              className="font-serif text-3xl font-bold md:text-4xl shimmer-text"
            >
              Sẵn Sàng Khám Phá?
            </h2>
            <p className="text-base text-muted-foreground md:text-lg">
              Hành trình thấu hiểu bản thân và vận mệnh bắt đầu từ một câu hỏi.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 pt-1 sm:flex-row">
              <Button asChild size="lg" className="btn-ripple w-full sm:w-auto">
                <Link href="/lich-van-nien">Xem Lịch Hôm Nay</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="w-full border-primary/30 text-primary hover:bg-primary/10 sm:w-auto"
              >
                <Link href="/ai-chat">Chat với AI</Link>
              </Button>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
