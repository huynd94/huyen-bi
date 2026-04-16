import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { LichVanNienKnowledge } from "@/components/knowledge-base";
import { buildMonthCalendar, formatLunar, getGioHoangDao, type DayInfo } from "@/lib/lunar-calendar";

const DOW = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const MONTH_NAMES = ["", "Tháng Giêng", "Tháng Hai", "Tháng Ba", "Tháng Tư", "Tháng Năm", "Tháng Sáu",
  "Tháng Bảy", "Tháng Tám", "Tháng Chín", "Tháng Mười", "Tháng Mười Một", "Tháng Chạp"];

const RATING_CONFIG = {
  "Đại Cát": { bg: "bg-amber-500/20 border-amber-500/40", text: "text-amber-400", dot: "bg-amber-400" },
  "Cát": { bg: "bg-green-500/20 border-green-500/40", text: "text-green-400", dot: "bg-green-400" },
  "Bình": { bg: "bg-blue-500/10 border-blue-500/20", text: "text-blue-400", dot: "bg-blue-400" },
  "Hung": { bg: "bg-red-500/15 border-red-500/30", text: "text-red-400", dot: "bg-red-400" },
};

export default function LichVanNienPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selected, setSelected] = useState<DayInfo | null>(null);
  const [jumpDate, setJumpDate] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [pendingDay, setPendingDay] = useState<number | null>(null);

  const calendar = useMemo(() => buildMonthCalendar(year, month), [year, month]);

  const firstDow = new Date(year, month - 1, 1).getDay();
  const emptyCells = Array.from({ length: firstDow });

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  };

  const goToToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth() + 1);
    setSelected(null);
    setShowPicker(false);
  };

  const handleJumpDate = () => {
    if (!jumpDate) return;
    const d = new Date(jumpDate);
    if (isNaN(d.getTime())) return;
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    setSelected(null);
    setPendingDay(d.getDate());
    setShowPicker(false);
  };

  // Auto-select the target day once the calendar rebuilds for the new month
  useEffect(() => {
    if (pendingDay !== null && calendar.length > 0) {
      const found = calendar.find((d) => d.solar.getDate() === pendingDay);
      if (found) {
        setSelected(found);
        setPendingDay(null);
      }
    }
  }, [calendar, pendingDay]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMonth(Number(e.target.value));
    setSelected(null);
  };

  const handleYearInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value);
    if (!isNaN(v) && v >= 1900 && v <= 2100) {
      setYear(v);
      setSelected(null);
    }
  };

  const todayInfo = calendar.find((d) => {
    const t = new Date();
    return d.solar.getDate() === t.getDate() && year === t.getFullYear() && month === t.getMonth() + 1;
  });

  const sel = selected || todayInfo || calendar[0];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Header */}
          <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/60">Âm Dương Lịch</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">Lịch Vạn Niên</h1>
            <p className="text-muted-foreground">Tra cứu ngày âm lịch, Can Chi và ngày Hoàng Đạo</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            {/* Calendar */}
            <div className="lg:col-span-2 border border-primary/20 rounded-2xl bg-card/30 overflow-hidden">
              {/* Nav */}
              <div className="border-b border-primary/10 bg-primary/5">
                <div className="flex items-center justify-between px-4 py-3 gap-2">
                  <button onClick={prevMonth} className="w-9 h-9 rounded-full border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors shrink-0">‹</button>

                  {/* Month + Year selectors */}
                  <div className="flex items-center gap-2 flex-1 justify-center">
                    <select
                      value={month}
                      onChange={handleMonthChange}
                      className="bg-background/60 border border-primary/30 text-foreground text-sm rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/50 cursor-pointer"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                        <option key={m} value={m}>{MONTH_NAMES[m]}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={year}
                      onChange={handleYearInput}
                      min={1900}
                      max={2100}
                      className="bg-background/60 border border-primary/30 text-foreground text-sm rounded-lg px-2 py-1.5 w-20 text-center focus:outline-none focus:ring-1 focus:ring-primary/50"
                    />
                  </div>

                  <button onClick={nextMonth} className="w-9 h-9 rounded-full border border-primary/30 flex items-center justify-center text-primary hover:bg-primary/10 transition-colors shrink-0">›</button>
                </div>

                {/* Jump to date + Today button */}
                <div className="flex items-center gap-2 px-4 pb-3">
                  <div className="flex flex-1 items-center gap-1.5 bg-background/40 border border-primary/20 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">Chọn ngày:</span>
                    <input
                      type="date"
                      value={jumpDate}
                      onChange={(e) => setJumpDate(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleJumpDate()}
                      className="flex-1 bg-transparent text-sm text-foreground focus:outline-none min-w-0"
                    />
                    <button
                      onClick={handleJumpDate}
                      className="text-xs text-primary hover:text-primary/80 font-medium px-1 transition-colors"
                    >
                      Xem
                    </button>
                  </div>
                  <button
                    onClick={goToToday}
                    className="text-xs px-3 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors whitespace-nowrap shrink-0"
                  >
                    Hôm nay
                  </button>
                </div>
              </div>

              {/* Day of week header */}
              <div className="grid grid-cols-7 border-b border-primary/10">
                {DOW.map((d, i) => (
                  <div key={d} className={`py-2 text-center text-xs font-semibold tracking-wide ${i === 0 ? "text-red-400" : i === 6 ? "text-amber-400" : "text-muted-foreground"}`}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7">
                {emptyCells.map((_, i) => <div key={`e-${i}`} />)}
                {calendar.map((day) => {
                  const dow = day.solar.getDay();
                  const isToday = day.solar.toDateString() === new Date().toDateString();
                  const isSelected = sel?.solar.toDateString() === day.solar.toDateString();
                  const cfg = RATING_CONFIG[day.rating];
                  return (
                    <button
                      key={day.solar.getDate()}
                      onClick={() => setSelected(day)}
                      className={`relative p-2 border border-transparent flex flex-col items-center gap-0.5 transition-all duration-150 hover:bg-primary/10 ${
                        isSelected ? "bg-primary/15 border-primary/40 rounded-lg" : ""
                      }`}
                    >
                      <span className={`text-sm font-semibold ${
                        isToday ? "w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center" :
                        dow === 0 ? "text-red-400" : dow === 6 ? "text-amber-400" : "text-foreground"
                      }`}>
                        {day.solar.getDate()}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70 leading-none">{day.lunar.day}/{day.lunar.month}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="px-4 py-3 border-t border-primary/10 flex flex-wrap gap-4 text-xs text-muted-foreground">
                {Object.entries(RATING_CONFIG).map(([label, cfg]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Day Detail Panel */}
            {sel && (
              <div className="space-y-4">
                {/* Selected day info */}
                <div className={`rounded-2xl border p-5 space-y-4 ${RATING_CONFIG[sel.rating].bg}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-3xl font-bold text-foreground">{sel.solar.getDate()}</div>
                      <div className="text-sm text-muted-foreground">
                        {["Chủ Nhật","Thứ Hai","Thứ Ba","Thứ Tư","Thứ Năm","Thứ Sáu","Thứ Bảy"][sel.solar.getDay()]},{" "}
                        {String(sel.solar.getDate()).padStart(2,"0")}/{String(month).padStart(2,"0")}/{year}
                      </div>
                    </div>
                    <div className={`text-sm font-bold px-3 py-1 rounded-full border ${RATING_CONFIG[sel.rating].bg} ${RATING_CONFIG[sel.rating].text}`}>
                      {sel.rating}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <Row label="Âm lịch" value={`${sel.lunar.day} tháng ${sel.lunar.month}${sel.lunar.leap?" (nhuận)":""} năm ${sel.lunar.year}`} />
                    <Row label="Ngày" value={sel.canChiDay} />
                    <Row label="Tháng" value={sel.canChiMonth} />
                    <Row label="Năm" value={sel.canChiYear} />
                    <Row label="Hoàng đạo" value={sel.hoangDao ? "Ngày Hoàng Đạo" : "Ngày Hắc Đạo"} valueClass={sel.hoangDao ? "text-amber-400" : "text-red-400"} />
                  </div>

                  <div className="border-t border-white/10 pt-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">{sel.note}</p>
                  </div>
                </div>

                {/* Giờ Hoàng Đạo */}
                <div className="rounded-2xl border border-primary/20 bg-card/30 p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-primary">Giờ Hoàng Đạo</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {getGioHoangDao(sel.lunar.day).map((gio) => (
                      <span key={gio} className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">{gio}</span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Các giờ tốt trong ngày, thích hợp khởi sự công việc quan trọng</p>
                </div>

                {/* Nên / Không nên */}
                <div className="rounded-2xl border border-primary/20 bg-card/30 p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-primary">Hướng dẫn ngày</h3>
                  {sel.rating === "Đại Cát" || sel.rating === "Cát" ? (
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p className="text-green-400 font-medium">Nên làm:</p>
                      <p>Ký hợp đồng, khai trương, cưới hỏi, xuất hành, giao dịch lớn, xây dựng, nhập học</p>
                    </div>
                  ) : sel.rating === "Hung" ? (
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <p className="text-red-400 font-medium">Nên tránh:</p>
                      <p>Khai trương, ký kết hợp đồng quan trọng, khởi sự việc lớn, xuất hành xa, phẫu thuật</p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Ngày bình thường, có thể xử lý các công việc thông thường</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Month overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            {Object.entries(RATING_CONFIG).map(([label, cfg]) => {
              const count = calendar.filter((d) => d.rating === label).length;
              return (
                <div key={label} className={`rounded-xl border p-4 text-center ${cfg.bg}`}>
                  <div className={`text-2xl font-bold ${cfg.text}`}>{count}</div>
                  <div className="text-xs text-muted-foreground mt-1">Ngày {label}</div>
                </div>
              );
            })}
          </div>
          <LichVanNienKnowledge />
        </div>
      </main>
    </div>
  );
}

function Row({ label, value, valueClass = "text-foreground" }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}:</span>
      <span className={`font-medium text-right ${valueClass}`}>{value}</span>
    </div>
  );
}
