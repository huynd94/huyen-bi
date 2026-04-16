import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const THIEN_CAN = [
  { name: "Giáp", element: "Mộc Dương", color: "text-green-400", desc: "Cây lớn, sức mạnh, hướng thượng, lãnh đạo, khởi đầu." },
  { name: "Ất", element: "Mộc Âm", color: "text-green-300", desc: "Cỏ cây uốn mềm, linh hoạt, thích nghi, bền bỉ thầm lặng." },
  { name: "Bính", element: "Hoả Dương", color: "text-red-400", desc: "Ánh mặt trời, nhiệt tình, rực rỡ, toả sáng, lạc quan." },
  { name: "Đinh", element: "Hoả Âm", color: "text-red-300", desc: "Ngọn nến, tinh tế, sáng suốt, ấm áp trong tối tăm." },
  { name: "Mậu", element: "Thổ Dương", color: "text-amber-400", desc: "Đất núi, vững chắc, bao dung, trung thực, ổn định." },
  { name: "Kỷ", element: "Thổ Âm", color: "text-amber-300", desc: "Đất đồng bằng, mầu mỡ, nuôi dưỡng, tiếp nhận, hiền lành." },
  { name: "Canh", element: "Kim Dương", color: "text-yellow-300", desc: "Kim loại thô, cứng rắn, nghĩa khí, quyết đoán, dứt khoát." },
  { name: "Tân", element: "Kim Âm", color: "text-yellow-200", desc: "Trang sức, tinh tế, thẩm mỹ, sạch sẽ, nguyên tắc." },
  { name: "Nhâm", element: "Thuỷ Dương", color: "text-blue-400", desc: "Biển lớn, bao la, sáng tạo, linh hoạt, trí tuệ." },
  { name: "Quý", element: "Thuỷ Âm", color: "text-blue-300", desc: "Mưa, sương, nhẹ nhàng, trực giác, thấu hiểu cảm xúc." },
];

const DIA_CHI = [
  { name: "Tý", animal: "Chuột", hours: "23:00–01:00", element: "Thuỷ", color: "text-blue-400" },
  { name: "Sửu", animal: "Trâu", hours: "01:00–03:00", element: "Thổ", color: "text-amber-400" },
  { name: "Dần", animal: "Hổ", hours: "03:00–05:00", element: "Mộc", color: "text-green-400" },
  { name: "Mão", animal: "Mèo", hours: "05:00–07:00", element: "Mộc", color: "text-green-300" },
  { name: "Thìn", animal: "Rồng", hours: "07:00–09:00", element: "Thổ", color: "text-amber-400" },
  { name: "Tỵ", animal: "Rắn", hours: "09:00–11:00", element: "Hoả", color: "text-red-400" },
  { name: "Ngọ", animal: "Ngựa", hours: "11:00–13:00", element: "Hoả", color: "text-red-300" },
  { name: "Mùi", animal: "Dê", hours: "13:00–15:00", element: "Thổ", color: "text-amber-300" },
  { name: "Thân", animal: "Khỉ", hours: "15:00–17:00", element: "Kim", color: "text-yellow-300" },
  { name: "Dậu", animal: "Gà", hours: "17:00–19:00", element: "Kim", color: "text-yellow-200" },
  { name: "Tuất", animal: "Chó", hours: "19:00–21:00", element: "Thổ", color: "text-amber-400" },
  { name: "Hợi", animal: "Lợn", hours: "21:00–23:00", element: "Thuỷ", color: "text-blue-300" },
];

const NGU_HANH = [
  { name: "Mộc", color: "text-green-400", bg: "bg-green-500/10 border-green-500/30", symbol: "木", desc: "Sự phát triển, tăng trưởng, linh hoạt và sáng tạo. Gắn với mùa Xuân, phương Đông, màu xanh.", generate: "Thuỷ sinh Mộc", overcome: "Kim khắc Mộc", season: "Xuân", direction: "Đông" },
  { name: "Hoả", color: "text-red-400", bg: "bg-red-500/10 border-red-500/30", symbol: "火", desc: "Năng lượng, đam mê, biến đổi và trí tuệ. Gắn với mùa Hạ, phương Nam, màu đỏ.", generate: "Mộc sinh Hoả", overcome: "Thuỷ khắc Hoả", season: "Hạ", direction: "Nam" },
  { name: "Thổ", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", symbol: "土", desc: "Ổn định, nuôi dưỡng, trung hoà và bền vững. Gắn với trung tâm, màu vàng.", generate: "Hoả sinh Thổ", overcome: "Mộc khắc Thổ", season: "Cuối mỗi mùa", direction: "Trung tâm" },
  { name: "Kim", color: "text-yellow-300", bg: "bg-yellow-500/10 border-yellow-500/30", symbol: "金", desc: "Cứng rắn, rõ ràng, thu hoạch và hoàn thiện. Gắn với mùa Thu, phương Tây, màu trắng.", generate: "Thổ sinh Kim", overcome: "Hoả khắc Kim", season: "Thu", direction: "Tây" },
  { name: "Thuỷ", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", symbol: "水", desc: "Chảy xuôi, trí tuệ, thích nghi và tiềm ẩn. Gắn với mùa Đông, phương Bắc, màu đen.", generate: "Kim sinh Thuỷ", overcome: "Thổ khắc Thuỷ", season: "Đông", direction: "Bắc" },
];

const BAT_QUAI = [
  { name: "Càn", symbol: "☰", element: "Kim", family: "Cha", direction: "Tây Bắc", desc: "Trời, sức mạnh, lãnh đạo, ý chí mạnh mẽ." },
  { name: "Khôn", symbol: "☷", element: "Thổ", family: "Mẹ", direction: "Tây Nam", desc: "Đất, nuôi dưỡng, bao dung, tiếp nhận." },
  { name: "Chấn", symbol: "☳", element: "Mộc", family: "Trưởng nam", direction: "Đông", desc: "Sấm, hành động, thức tỉnh, khởi đầu." },
  { name: "Tốn", symbol: "☴", element: "Mộc", family: "Trưởng nữ", direction: "Đông Nam", desc: "Gió, thâm nhập, kiên trì, linh hoạt." },
  { name: "Khảm", symbol: "☵", element: "Thuỷ", family: "Trung nam", direction: "Bắc", desc: "Nước, sự nguy hiểm, chiều sâu, trí tuệ." },
  { name: "Ly", symbol: "☲", element: "Hoả", family: "Trung nữ", direction: "Nam", desc: "Lửa, sáng suốt, vẻ đẹp, sự phụ thuộc." },
  { name: "Cấn", symbol: "☶", element: "Thổ", family: "Thiếu nam", direction: "Đông Bắc", desc: "Núi, tĩnh lặng, thiền định, dừng lại." },
  { name: "Đoài", symbol: "☱", element: "Kim", family: "Thiếu nữ", direction: "Tây", desc: "Hồ, vui vẻ, giao tiếp, thu hoạch." },
];

const THAN_SO_MEANINGS: Record<number, { title: string; keyword: string; color: string; desc: string }> = {
  1: { title: "Số 1", keyword: "Tiên phong", color: "text-red-400", desc: "Khởi đầu, độc lập, lãnh đạo và ý chí vươn lên." },
  2: { title: "Số 2", keyword: "Hài hoà", color: "text-orange-300", desc: "Cân bằng, hợp tác, ngoại giao và nhạy cảm." },
  3: { title: "Số 3", keyword: "Sáng tạo", color: "text-yellow-400", desc: "Biểu đạt, lạc quan, truyền cảm hứng và nghệ thuật." },
  4: { title: "Số 4", keyword: "Vững chắc", color: "text-green-400", desc: "Nền tảng, kỷ luật, thực tế và đáng tin cậy." },
  5: { title: "Số 5", keyword: "Tự do", color: "text-cyan-400", desc: "Thay đổi, phiêu lưu, linh hoạt và trải nghiệm." },
  6: { title: "Số 6", keyword: "Yêu thương", color: "text-blue-400", desc: "Gia đình, trách nhiệm, chăm sóc và bảo vệ." },
  7: { title: "Số 7", keyword: "Tâm linh", color: "text-indigo-400", desc: "Phân tích, trực giác, tìm kiếm chân lý và sự khôn ngoan." },
  8: { title: "Số 8", keyword: "Quyền năng", color: "text-purple-400", desc: "Tài chính, quyền lực, thành công và tham vọng." },
  9: { title: "Số 9", keyword: "Nhân đức", color: "text-pink-400", desc: "Vị tha, lý tưởng, hoàn thành và lòng từ bi." },
  11: { title: "Số 11", keyword: "Khai sáng", color: "text-yellow-300", desc: "Master — trực giác phi thường, tâm linh và truyền cảm hứng." },
  22: { title: "Số 22", keyword: "Kiến trúc sư", color: "text-yellow-200", desc: "Master — biến ước mơ thành hiện thực, tầm nhìn vĩ đại." },
  33: { title: "Số 33", keyword: "Bậc thầy", color: "text-white", desc: "Master — tình yêu vô điều kiện, sứ mệnh chữa lành thiêng liêng." },
};

type Tab = "thien-can" | "dia-chi" | "ngu-hanh" | "bat-quai" | "than-so";

const TABS: { id: Tab; label: string }[] = [
  { id: "thien-can", label: "Thiên Can" },
  { id: "dia-chi", label: "Địa Chi" },
  { id: "ngu-hanh", label: "Ngũ Hành" },
  { id: "bat-quai", label: "Bát Quái" },
  { id: "than-so", label: "Thần Số" },
];

export default function TuDienPage() {
  const [activeTab, setActiveTab] = useState<Tab>("thien-can");

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-24 pb-16 z-10 relative">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <p className="text-xs tracking-[0.3em] uppercase text-primary/60">Tra cứu</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground drop-shadow-md">Từ Điển Huyền Học</h1>
            <p className="text-muted-foreground text-lg">Tra cứu nhanh ý nghĩa Can Chi, Ngũ Hành, Bát Quái và Thần Số.</p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium border transition-all duration-200",
                  activeTab === t.id
                    ? "border-primary bg-primary/20 text-primary shadow-sm shadow-primary/20"
                    : "border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Thiên Can */}
          {activeTab === "thien-can" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <p className="text-sm text-muted-foreground text-center">10 Thiên Can (Thập Thiên Can) — biểu tượng cho 10 loại năng lượng vũ trụ.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {THIEN_CAN.map((c, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl border border-border/30 bg-card/30 hover:border-primary/30 transition-all duration-200">
                    <span className={cn("text-4xl font-bold font-serif w-14 shrink-0 flex items-center justify-center", c.color)}>{c.name}</span>
                    <div className="min-w-0 space-y-1.5">
                      <span className={cn("inline-block text-xs px-2.5 py-0.5 rounded-full border font-medium")}
                        style={{ color: "inherit", borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.06)" }}>
                        <span className={c.color}>{c.element}</span>
                      </span>
                      <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Địa Chi */}
          {activeTab === "dia-chi" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <p className="text-sm text-muted-foreground text-center">12 Địa Chi (Thập Nhị Địa Chi) — 12 con giáp tương ứng với 12 giờ trong ngày.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {DIA_CHI.map((c, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border/30 bg-card/30 hover:border-primary/30 transition-all duration-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={cn("text-2xl font-bold font-serif", c.color)}>{c.name}</span>
                      <span className="text-2xl">{["🐭","🐂","🐯","🐰","🐉","🐍","🐴","🐑","🐵","🐔","🐶","🐷"][i]}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground/70">Con {c.animal}</p>
                    <div className="flex gap-2 text-xs">
                      <span className={cn("px-2 py-0.5 rounded-full border", c.color)} style={{ background: "rgba(255,255,255,0.05)", borderColor: "currentColor" }}>{c.element}</span>
                      <span className="text-muted-foreground">{c.hours}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ngũ Hành */}
          {activeTab === "ngu-hanh" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <p className="text-sm text-muted-foreground text-center">Ngũ Hành — 5 yếu tố cơ bản tạo nên vạn vật trong vũ trụ.</p>
              <div className="space-y-4">
                {NGU_HANH.map((e, i) => (
                  <div key={i} className={cn("rounded-xl border p-5 space-y-3", e.bg)}>
                    <div className="flex items-center gap-4">
                      <span className={cn("text-5xl font-bold", e.color)}>{e.symbol}</span>
                      <div>
                        <p className={cn("text-xl font-bold", e.color)}>{e.name}</p>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          <span>Mùa: {e.season}</span>
                          <span>Phương: {e.direction}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/70">{e.desc}</p>
                    <div className="flex flex-wrap gap-4 text-xs">
                      <span className="text-green-400">↑ {e.generate}</span>
                      <span className="text-red-400">↓ {e.overcome}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bát Quái */}
          {activeTab === "bat-quai" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <p className="text-sm text-muted-foreground text-center">Bát Quái — 8 quẻ cơ bản của Kinh Dịch, biểu tượng cho các hiện tượng tự nhiên.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {BAT_QUAI.map((q, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-xl border border-primary/20 bg-card/30 hover:border-primary/40 transition-all duration-200">
                    <span className="text-5xl leading-none shrink-0 text-primary/70">{q.symbol}</span>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-primary">{q.name}</span>
                        <span className="text-xs text-muted-foreground">({q.family})</span>
                      </div>
                      <div className="flex gap-2 text-[11px] text-muted-foreground">
                        <span className="bg-background/40 px-1.5 py-0.5 rounded">{q.element}</span>
                        <span className="bg-background/40 px-1.5 py-0.5 rounded">{q.direction}</span>
                      </div>
                      <p className="text-xs text-foreground/70 mt-1">{q.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Thần Số */}
          {activeTab === "than-so" && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <p className="text-sm text-muted-foreground text-center">Thần Số Học Pythagore — ý nghĩa của các con số từ 1 đến 9 và các Số Master.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(THAN_SO_MEANINGS).map(([n, m]) => (
                  <div key={n} className="p-4 rounded-xl border border-border/30 bg-card/30 hover:border-primary/30 transition-all duration-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={cn("text-3xl font-bold", m.color)}>{n}</span>
                      <span className={cn("text-xs px-2 py-1 rounded-full border font-medium", m.color)} style={{ background: "rgba(255,255,255,0.04)" }}>{m.keyword}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                    {(n === "11" || n === "22" || n === "33") && (
                      <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">Số Master</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
