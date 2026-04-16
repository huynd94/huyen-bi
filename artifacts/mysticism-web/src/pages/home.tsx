import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AmbientBg } from "@/components/ambient-bg";
import { TiltCard } from "@/components/tilt-card";
import { useScrollRevealAll } from "@/hooks/use-scroll-reveal";
import { Link } from "wouter";

const MODULES = [
  {
    href: "/than-so-hoc",
    symbol: "九",
    symbolSub: "Số mệnh",
    title: "Thần Số Học",
    subtitle: "Numerology Pythagore",
    desc: "Giải mã ý nghĩa ẩn giấu trong tên gọi và ngày sinh. Khám phá con số vận mệnh, năm cá nhân, chu kỳ cuộc đời theo hệ thống Pythagoras và phương Đông.",
    tags: ["Số vận mệnh", "Năm cá nhân", "Tên gọi", "Ngày sinh"],
    accent: "from-amber-600/20 to-amber-500/5 border-amber-500/30 hover:border-amber-400/60",
    tagColor: "bg-amber-500/10 text-amber-300/80",
    symbolColor: "text-amber-400/80",
  },
  {
    href: "/bat-tu",
    symbol: "乾",
    symbolSub: "Tứ Trụ",
    title: "Bát Tự Tứ Trụ",
    subtitle: "Tử Bình Mệnh Lý",
    desc: "Lập lá số Tứ Trụ dựa trên năm, tháng, ngày, giờ sinh. Phân tích Thiên Can Địa Chi, sự cân bằng Ngũ Hành và tiên đoán vận hạn Đại Vận, Tiểu Vận.",
    tags: ["Thiên Can", "Địa Chi", "Ngũ Hành", "Đại Vận"],
    accent: "from-violet-600/20 to-violet-500/5 border-violet-500/30 hover:border-violet-400/60",
    tagColor: "bg-violet-500/10 text-violet-300/80",
    symbolColor: "text-violet-400/80",
  },
  {
    href: "/xem-que",
    symbol: "☰",
    symbolSub: "64 Quẻ",
    title: "Xem Quẻ I Ching",
    subtitle: "Kinh Dịch Cổ Đại",
    desc: "Gieo quẻ theo phương pháp cổ truyền để nhận thông điệp từ vũ trụ. Tra cứu ý nghĩa 64 quẻ Dịch và 384 hào từ với diễn giải sâu sắc từ AI.",
    tags: ["64 Quẻ Dịch", "384 Hào từ", "Gieo quẻ", "Biến quẻ"],
    accent: "from-emerald-600/20 to-emerald-500/5 border-emerald-500/30 hover:border-emerald-400/60",
    tagColor: "bg-emerald-500/10 text-emerald-300/80",
    symbolColor: "text-emerald-400/80",
  },
  {
    href: "/cat-hung",
    symbol: "八",
    symbolSub: "Cát Hung",
    title: "Xem Cát Hung",
    subtitle: "Huyền Số Phong Thủy",
    desc: "Luận giải năng lượng cát hung của số điện thoại và biển số xe theo huyền số học phong thủy. Hỗ trợ phân tích 6 số cuối và toàn bộ 10 chữ số.",
    tags: ["Số điện thoại", "Biển số xe", "Cát-Hung", "Phong thủy"],
    accent: "from-rose-600/20 to-rose-500/5 border-rose-500/30 hover:border-rose-400/60",
    tagColor: "bg-rose-500/10 text-rose-300/80",
    symbolColor: "text-rose-400/80",
  },
  {
    href: "/lich-van-nien",
    symbol: "曆",
    symbolSub: "Âm lịch",
    title: "Lịch Vạn Niên",
    subtitle: "Âm Dương Lịch",
    desc: "Tra cứu ngày âm lịch, Can Chi ngày tháng năm, ngày Hoàng Đạo — Hắc Đạo và giờ tốt trong ngày. Xem tổng quan ngày tốt xấu trong tháng.",
    tags: ["Âm lịch", "Hoàng Đạo", "Giờ tốt", "Can Chi"],
    accent: "from-teal-600/20 to-teal-500/5 border-teal-500/30 hover:border-teal-400/60",
    tagColor: "bg-teal-500/10 text-teal-300/80",
    symbolColor: "text-teal-400/80",
  },
  {
    href: "/tu-vi",
    symbol: "紫",
    symbolSub: "12 Cung",
    title: "Tử Vi Đẩu Số",
    subtitle: "Lá Số 12 Cung",
    desc: "Lập lá số Tử Vi 12 cung dựa trên ngày giờ sinh. Xem vị trí các chính tinh, phụ tinh trong từng cung và nhận luận giải sâu sắc từ AI.",
    tags: ["12 Cung", "Chính Tinh", "Mệnh Cục", "Tử Vi"],
    accent: "from-indigo-600/20 to-indigo-500/5 border-indigo-500/30 hover:border-indigo-400/60",
    tagColor: "bg-indigo-500/10 text-indigo-300/80",
    symbolColor: "text-indigo-400/80",
  },
  {
    href: "/ai-chat",
    symbol: "智",
    symbolSub: "Trí tuệ",
    title: "Trợ Lý AI",
    subtitle: "Huyền Học Thông Tuệ",
    desc: "Trò chuyện trực tiếp với AI chuyên gia về huyền học. Đặt câu hỏi về tâm linh, số mệnh, phong thủy và nhận tư vấn sâu sắc từ trí tuệ nhân tạo.",
    tags: ["Tư vấn tâm linh", "GPT-5.4 Nano", "Gemini 3.0 Flash", "Hỏi đáp"],
    accent: "from-sky-600/20 to-sky-500/5 border-sky-500/30 hover:border-sky-400/60",
    tagColor: "bg-sky-500/10 text-sky-300/80",
    symbolColor: "text-sky-400/80",
  },
  {
    href: "/phong-thuy",
    symbol: "羅",
    symbolSub: "Bát Trạch",
    title: "Phong Thuỷ",
    subtitle: "Bát Trạch Minh Cảnh",
    desc: "Xác định Mệnh Quái cá nhân theo năm sinh, tìm 4 hướng tốt và 4 hướng xấu. Luận giải phong thủy nhà ở, bàn làm việc và hướng ngủ tối ưu.",
    tags: ["Mệnh Quái", "8 Hướng", "Nhà ở", "Bàn làm việc"],
    accent: "from-lime-600/20 to-lime-500/5 border-lime-500/30 hover:border-lime-400/60",
    tagColor: "bg-lime-500/10 text-lime-300/80",
    symbolColor: "text-lime-400/80",
  },
  {
    href: "/xem-ten",
    symbol: "名",
    symbolSub: "Ngũ Cách",
    title: "Xem Tên",
    subtitle: "Phân Tích Họ Tên",
    desc: "Phân tích năng lượng tên theo hệ thống Ngũ Cách: Thiên Cách, Nhân Cách, Địa Cách, Ngoại Cách, Tổng Cách. Tra cứu ngũ hành tên và nhận tư vấn đặt tên.",
    tags: ["Ngũ Cách", "Ngũ Hành tên", "Họ Tên", "Đặt tên"],
    accent: "from-fuchsia-600/20 to-fuchsia-500/5 border-fuchsia-500/30 hover:border-fuchsia-400/60",
    tagColor: "bg-fuchsia-500/10 text-fuchsia-300/80",
    symbolColor: "text-fuchsia-400/80",
  },
  {
    href: "/lich-ca-nhan",
    symbol: "運",
    symbolSub: "Vận trình",
    title: "Lịch Cá Nhân",
    subtitle: "Năm Tháng Ngày Vận",
    desc: "Tra cứu Năm Cá Nhân, Tháng Cá Nhân và Ngày Cá Nhân theo thần số học. Xem lịch tháng với màu sắc năng lượng từng ngày và gợi ý hành động.",
    tags: ["Năm Cá Nhân", "Tháng Cá Nhân", "Ngày Cá Nhân", "Chu kỳ vận"],
    accent: "from-cyan-600/20 to-cyan-500/5 border-cyan-500/30 hover:border-cyan-400/60",
    tagColor: "bg-cyan-500/10 text-cyan-300/80",
    symbolColor: "text-cyan-400/80",
  },
  {
    href: "/tu-dien",
    symbol: "典",
    symbolSub: "Tra cứu",
    title: "Từ Điển Huyền Học",
    subtitle: "Bách Khoa Huyền Bí",
    desc: "Tra cứu nhanh ý nghĩa 10 Thiên Can, 12 Địa Chi, Ngũ Hành, Bát Quái và các con số Thần Số học. Tài liệu tham chiếu đầy đủ cho người học huyền học.",
    tags: ["Thiên Can", "Địa Chi", "Ngũ Hành", "Bát Quái"],
    accent: "from-orange-600/20 to-orange-500/5 border-orange-500/30 hover:border-orange-400/60",
    tagColor: "bg-orange-500/10 text-orange-300/80",
    symbolColor: "text-orange-400/80",
  },
  {
    href: "/hop-tuoi",
    symbol: "♡",
    symbolSub: "Duyên số",
    title: "Hợp Tuổi & Duyên Số",
    subtitle: "Tương Hợp Huyền Học",
    desc: "Phân tích mức độ tương hợp giữa hai người qua Mệnh Quái Bát Trạch, Can Chi Ngũ Hành, Cung Tuổi Địa Chi và Thần Số Đường Đời. Điểm tương hợp tổng hợp.",
    tags: ["Cung Tuổi", "Mệnh Quái", "Ngũ Hành", "Thần Số"],
    accent: "from-pink-600/20 to-pink-500/5 border-pink-500/30 hover:border-pink-400/60",
    tagColor: "bg-pink-500/10 text-pink-300/80",
    symbolColor: "text-pink-400/80",
  },
  {
    href: "/xem-ngay-tot",
    symbol: "黃",
    symbolSub: "Hoàng Đạo",
    title: "Xem Ngày Tốt",
    subtitle: "Chọn Ngày Hoàng Đạo",
    desc: "Tìm ngày Hoàng Đạo phù hợp nhất trong tháng theo từng mục đích: cưới hỏi, khai trương, động thổ, ký kết, xuất hành, nhập trạch, phẫu thuật và nhiều hơn.",
    tags: ["Hôn nhân", "Khai trương", "Động thổ", "Xuất hành"],
    accent: "from-yellow-600/20 to-yellow-500/5 border-yellow-500/30 hover:border-yellow-400/60",
    tagColor: "bg-yellow-500/10 text-yellow-300/80",
    symbolColor: "text-yellow-400/80",
  },
  {
    href: "/sao-han",
    symbol: "★",
    symbolSub: "Sao chiếu",
    title: "Sao Hạn Hàng Năm",
    subtitle: "Vận Trình Chiêm Tinh",
    desc: "Tra cứu sao chiếu mệnh theo tuổi Can Chi trong từng năm. Xem Thái Tuế, Thái Dương, Thiên Đức, La Hầu, Phúc Tinh và nhiều sao hạn khác trong 7 năm liên tiếp.",
    tags: ["Thái Tuế", "Thái Dương", "La Hầu", "Phúc Tinh"],
    accent: "from-violet-600/20 to-violet-500/5 border-violet-500/30 hover:border-violet-400/60",
    tagColor: "bg-violet-500/10 text-violet-300/80",
    symbolColor: "text-violet-400/80",
  },
  {
    href: "/lich-su",
    symbol: "◈",
    symbolSub: "Lưu trữ",
    title: "Lịch Sử Tra Cứu",
    subtitle: "Kho Lưu Cá Nhân",
    desc: "Xem lại toàn bộ các lần tra cứu được lưu trữ trên thiết bị. Tìm kiếm, lọc theo chức năng và xem lại kết quả đầy đủ bất cứ lúc nào.",
    tags: ["Lịch sử", "Tìm kiếm", "Lọc", "Xem lại"],
    accent: "from-slate-600/20 to-slate-500/5 border-slate-500/30 hover:border-slate-400/60",
    tagColor: "bg-slate-500/10 text-slate-300/80",
    symbolColor: "text-slate-400/80",
  },
];

const FEATURES = [
  {
    icon: "◈",
    title: "Kết hợp Đông - Tây",
    desc: "Tích hợp triết học phương Đông (Kinh Dịch, Tứ Trụ, Tử Vi, Ngũ Hành) với hệ thống Numerology Pythagoras phương Tây vào một nền tảng thống nhất.",
  },
  {
    icon: "◉",
    title: "AI Giải Mã Chuyên Sâu",
    desc: "Sử dụng GPT-5.4 và Gemini 3.0 được định hướng chuyên biệt về huyền học để đưa ra phân tích sâu sắc và cá nhân hóa hoàn toàn.",
  },
  {
    icon: "◎",
    title: "Lưu & Chia Sẻ",
    desc: "Lưu lịch sử các lần tra cứu ngay trong trình duyệt, sao chép kết quả, in ra hoặc chia sẻ luận giải đến người thân.",
  },
  {
    icon: "◐",
    title: "Bảo Mật Tuyệt Đối",
    desc: "Dữ liệu cá nhân và khóa API chỉ lưu trên thiết bị của bạn. Chúng tôi không lưu trữ bất kỳ thông tin nhạy cảm nào trên máy chủ.",
  },
];

const STEPS = [
  { num: "01", title: "Chọn phương pháp", desc: "Lựa chọn trong 15 hệ thống: Thần số, Bát tự, Kinh Dịch, Cát Hung, Hợp Tuổi, Sao Hạn, Xem Ngày Tốt, Phong Thủy, Xem Tên và nhiều hơn nữa." },
  { num: "02", title: "Nhập thông tin", desc: "Cung cấp ngày sinh, tên gọi, câu hỏi hoặc con số cần tra cứu theo từng phương pháp." },
  { num: "03", title: "Nhận luận giải AI", desc: "AI phân tích và đưa ra luận giải chi tiết, sâu sắc bằng tiếng Việt trong vài giây." },
];

const QUOTE = {
  text: "Thiên địa bất nhân, dĩ vạn vật vi sô cẩu.",
  trans: "Trời đất không thiên vị, coi vạn vật như chó rơm — mọi thứ vận hành theo quy luật tự nhiên.",
  source: "Đạo Đức Kinh — Lão Tử",
};

function StarField() {
  const stars = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    top: `${Math.sin(i * 1.7) * 50 + 50}%`,
    left: `${Math.cos(i * 2.3) * 50 + 50}%`,
    size: i % 5 === 0 ? 2 : 1,
    opacity: 0.1 + (i % 4) * 0.07,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((s) => (
        <div key={s.id} className="absolute rounded-full bg-primary"
          style={{ top: s.top, left: s.left, width: s.size, height: s.size, opacity: s.opacity }} />
      ))}
    </div>
  );
}

export default function Home() {
  useScrollRevealAll();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground relative">
      <AmbientBg />
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative z-10 flex flex-col items-center justify-center min-h-[100dvh] px-4 pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,hsl(var(--primary)/0.18),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_80%,hsl(var(--primary)/0.07),transparent)] pointer-events-none" />
        <StarField />

        <div className="relative z-10 max-w-4xl w-full text-center space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
          <div className="inline-flex items-center gap-2 border border-primary/25 bg-primary/5 rounded-full px-4 py-1.5 text-xs text-primary/80 tracking-widest uppercase mb-2 float-badge">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Huyền Học Phương Đông &amp; Phương Tây
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-wide leading-tight">
            <span className="text-foreground">Khám Phá</span>
            <br />
            <span className="shimmer-text">Vận Mệnh</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Nền tảng huyền học toàn diện kết hợp Thần Số Học, Bát Tự, Kinh Dịch, Phong Thủy, Tử Vi, Xem Tên và Lịch Vạn Niên với sức mạnh của trí tuệ nhân tạo tiên tiến nhất.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link href="/than-so-hoc">
              <button className="btn-ripple px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-all duration-200 hover:shadow-[0_0_28px_hsl(var(--primary)/0.5)] hover:-translate-y-1">
                Bắt đầu khám phá
              </button>
            </Link>
            <Link href="/ai-chat">
              <button className="btn-ripple px-8 py-3.5 rounded-xl border border-primary/30 text-primary font-semibold text-base hover:bg-primary/10 transition-all duration-200 hover:-translate-y-1 hover:border-primary/60">
                Hỏi Trợ Lý AI
              </button>
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-8 pt-8 border-t border-primary/10 mt-8">
            {[
              { val: "15", label: "Hệ thống huyền học" },
              { val: "64", label: "Quẻ Dịch" },
              { val: "AI", label: "GPT-5.4 & Gemini 3.0" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-bold text-primary glow-pulse">{s.val}</div>
                <div className="text-xs text-muted-foreground mt-1 tracking-wide">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-30 animate-bounce">
          <div className="w-px h-8 bg-primary" />
          <div className="text-[10px] text-primary tracking-widest uppercase">Cuộn xuống</div>
        </div>
      </section>

      {/* ── Modules ── */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3" data-reveal>
            <p className="text-xs uppercase tracking-[0.3em] text-primary/60">Hệ thống tra cứu</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">15 Môn Huyền Học</h2>
            <div className="magic-line max-w-xs mx-auto mt-3" />
            <p className="text-muted-foreground max-w-xl mx-auto">Mỗi phương pháp là một cánh cửa độc lập dẫn đến sự thấu hiểu bản thân và vận mệnh.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MODULES.map((m, i) => (
              <div key={m.href} data-reveal data-reveal-delay={i * 60}>
                <TiltCard>
                  <Link href={m.href} className="group block h-full">
                    <div className={`h-full rounded-2xl border bg-gradient-to-br ${m.accent} p-6 transition-all duration-300 hover:shadow-[0_8px_40px_hsl(var(--primary)/0.2)] cursor-pointer`}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-1">{m.subtitle}</p>
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{m.title}</h3>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <div className={`text-4xl font-bold leading-none ${m.symbolColor} group-hover:scale-110 transition-transform duration-300`}>{m.symbol}</div>
                          <div className="text-[10px] text-muted-foreground/50 mt-1">{m.symbolSub}</div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-4">{m.desc}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {m.tags.map((t) => (
                          <span key={t} className={`text-[11px] px-2 py-0.5 rounded-full ${m.tagColor}`}>{t}</span>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-xs text-primary/60 group-hover:text-primary transition-colors">
                        <span>Vào tra cứu</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                      </div>
                    </div>
                  </Link>
                </TiltCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quote ── */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center" data-reveal>
          <div className="border border-primary/20 bg-primary/5 rounded-2xl px-8 py-10 space-y-4 relative overflow-hidden hover:border-primary/40 transition-colors duration-500">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,hsl(var(--primary)/0.06),transparent)] pointer-events-none" />
            <div className="absolute top-0 left-0 text-[120px] leading-none text-primary/5 font-bold select-none pointer-events-none -mt-4 -ml-2">"</div>
            <p className="text-2xl md:text-3xl font-bold text-primary/90 italic leading-relaxed relative z-10">{QUOTE.text}</p>
            <p className="text-muted-foreground text-sm leading-relaxed">{QUOTE.trans}</p>
            <p className="text-xs text-primary/50 tracking-widest uppercase">{QUOTE.source}</p>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative z-10 py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,hsl(var(--primary)/0.06),transparent)] pointer-events-none" />
        <div className="max-w-5xl mx-auto relative">
          <div className="text-center space-y-3 mb-14" data-reveal>
            <p className="text-xs uppercase tracking-[0.3em] text-primary/60">Quy trình</p>
            <h2 className="text-3xl md:text-4xl font-bold">Cách Hoạt Động</h2>
            <div className="magic-line max-w-xs mx-auto mt-3" />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((s, i) => (
              <div key={s.num} className="relative text-center space-y-4" data-reveal data-reveal-delay={i * 120}>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(50%+3rem)] right-[-calc(50%-3rem)] h-px bg-gradient-to-r from-primary/30 to-transparent" />
                )}
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border border-primary/30 bg-primary/10 text-primary text-2xl font-bold mx-auto hover:border-primary/60 hover:bg-primary/20 hover:scale-110 transition-all duration-300">{s.num}</div>
                <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3" data-reveal>
            <p className="text-xs uppercase tracking-[0.3em] text-primary/60">Tại sao chọn chúng tôi</p>
            <h2 className="text-3xl md:text-4xl font-bold">Điểm Khác Biệt</h2>
            <div className="magic-line max-w-xs mx-auto mt-3" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => (
              <div key={f.title} data-reveal data-reveal-delay={i * 80} className="rounded-2xl border border-primary/15 bg-primary/3 p-6 space-y-3 hover:border-primary/35 hover:bg-primary/8 hover:-translate-y-1 hover:shadow-[0_4px_20px_hsl(var(--primary)/0.12)] transition-all duration-300 group">
                <div className="text-3xl text-primary/70 group-hover:scale-110 group-hover:text-primary transition-all duration-300">{f.icon}</div>
                <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-3xl mx-auto" data-reveal>
          <div className="rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/10 to-transparent p-12 space-y-6 relative overflow-hidden text-center hover:border-primary/40 transition-colors duration-500">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,hsl(var(--primary)/0.12),transparent)] pointer-events-none" />
            <StarField />
            <div className="relative z-10 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold shimmer-text">Sẵn Sàng Khám Phá?</h2>
              <p className="text-muted-foreground text-lg">Hành trình thấu hiểu bản thân và vận mệnh bắt đầu từ một câu hỏi.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                <Link href="/lich-van-nien">
                  <button className="btn-ripple px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all duration-200 hover:shadow-[0_0_28px_hsl(var(--primary)/0.5)] hover:-translate-y-1">
                    Xem Lịch Hôm Nay
                  </button>
                </Link>
                <Link href="/ai-chat">
                  <button className="btn-ripple px-8 py-3.5 rounded-xl border border-primary/30 text-primary font-semibold hover:bg-primary/10 transition-all duration-200 hover:-translate-y-1 hover:border-primary/60">
                    Chat với AI
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
