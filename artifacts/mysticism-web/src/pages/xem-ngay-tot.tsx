import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { useAutoHistory } from "@/lib/use-auto-history";
import { SaveReadingBtn } from "@/components/save-reading-btn";
import { popReopenData } from "@/lib/reopen-reading";
import { XemNgayTotKnowledge } from "@/components/knowledge-base";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { findGoodDays, PURPOSE_LIST, type Purpose, type GoodDay } from "@/lib/xem-ngay-tot";
import { formatLunar } from "@/lib/lunar-calendar";

const MONTH_NAMES = ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"];
const DAY_NAMES = ["CN","T2","T3","T4","T5","T6","T7"];

function ScoreBadge({ score }: { score: number }) {
  const cls = score >= 85 ? "bg-yellow-400/15 text-yellow-300 border-yellow-400/40"
    : score >= 70 ? "bg-green-400/15 text-green-300 border-green-400/40"
    : "bg-amber-400/15 text-amber-300 border-amber-400/40";
  const label = score >= 85 ? "Rất Tốt" : score >= 70 ? "Tốt" : "Khá";
  return <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", cls)}>{label} {score}</span>;
}

export default function XemNgayTotPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [purpose, setPurpose] = useState<Purpose>("khai-truong");
  const [results, setResults] = useState<GoodDay[] | null>(null);
  const [selectedDay, setSelectedDay] = useState<GoodDay | null>(null);
  const [showTop, setShowTop] = useState(false);

  const goodDays = useMemo(() => {
    if (!results) return new Map<number, GoodDay>();
    const map = new Map<number, GoodDay>();
    for (const d of results) map.set(d.dayInfo.solar.getDate(), d);
    return map;
  }, [results]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    return { firstDay, daysInMonth };
  }, [year, month]);

  const purposeInfo = PURPOSE_LIST.find(p => p.id === purpose);

  useAutoHistory(results && results.length > 0 ? {
    module: "xem-ngay-tot",
    moduleName: "Xem Ngày Tốt",
    title: `Xem Ngày Tốt — ${purposeInfo?.label || purpose} — ${MONTH_NAMES[month - 1]} ${year}`,
    summary: `Tìm thấy ${results.length} ngày tốt. Top 1: ${results[0]?.dayInfo.solar.toLocaleDateString("vi-VN", { day: "numeric", month: "long" })} (điểm ${results[0]?.score})`,
    result: `Mục đích: ${purposeInfo?.label}\nTháng: ${MONTH_NAMES[month - 1]} ${year}\n\nTop 5 ngày tốt nhất:\n${results.slice(0, 5).map((d, i) => `${i + 1}. ${d.dayInfo.solar.toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "long" })} — điểm ${d.score}`).join("\n")}`,
  } : null);

  useEffect(() => {
    const d = popReopenData("xem-ngay-tot");
    if (d) {
      if (d.thang) setMonth(Number(d.thang));
      if (d.nam) setYear(Number(d.nam));
      if (d.mucDich) setPurpose(d.mucDich as Purpose);
    }
  }, []);

  const handleSearch = () => {
    const days = findGoodDays(year, month, purpose);
    setResults(days);
    setShowTop(true);
    setSelectedDay(null);
  };

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); setResults(null); setShowTop(false); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); setResults(null); setShowTop(false); };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900/15 via-background to-background pointer-events-none" />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-16 z-10 relative">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <p className="text-xs tracking-[0.3em] uppercase text-primary/60">Hoàng Đạo</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground drop-shadow-md">Xem Ngày Tốt</h1>
            <p className="text-muted-foreground text-lg">Chọn tháng và mục đích để tìm ngày Hoàng Đạo phù hợp nhất.</p>
          </div>

          <Card className="bg-card/40 backdrop-blur-sm border-primary/20">
            <CardHeader><CardTitle className="text-xl text-primary">Chọn mục đích & thời gian</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {/* Purpose grid */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Mục đích cần chọn ngày:</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {PURPOSE_LIST.map(p => (
                    <button key={p.id} onClick={() => setPurpose(p.id)}
                      className={cn("flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all text-xs",
                        purpose === p.id ? "border-primary bg-primary/15 text-primary" : "border-border/30 text-muted-foreground hover:border-primary/30")}>
                      <span className="text-lg">{p.icon}</span>
                      <span className="font-medium leading-tight">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Month selector */}
              <div className="flex items-center justify-between gap-4">
                <button onClick={prevMonth} className="w-8 h-8 rounded-lg border border-border/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                </button>
                <div className="flex gap-2 items-center">
                  <select value={month} onChange={e => { setMonth(Number(e.target.value)); setResults(null); }}
                    className="bg-background/50 border border-border/40 rounded-lg px-3 py-1.5 text-sm text-foreground [color-scheme:dark] outline-none focus:border-primary/50">
                    {MONTH_NAMES.map((n, i) => <option key={i} value={i+1}>{n}</option>)}
                  </select>
                  <select value={year} onChange={e => { setYear(Number(e.target.value)); setResults(null); }}
                    className="bg-background/50 border border-border/40 rounded-lg px-3 py-1.5 text-sm text-foreground [color-scheme:dark] outline-none focus:border-primary/50">
                    {Array.from({ length: 10 }, (_, i) => now.getFullYear() + i - 2).map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <button onClick={nextMonth} className="w-8 h-8 rounded-lg border border-border/40 flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </button>
              </div>

              <Button onClick={handleSearch} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold tracking-wider">
                TÌM NGÀY TỐT {purposeInfo && `— ${purposeInfo.label.toUpperCase()}`}
              </Button>
            </CardContent>
          </Card>

          {results && (
            <div className="space-y-6 animate-in fade-in duration-500">
              {results.length > 0 && (
                <div className="flex justify-end">
                  <SaveReadingBtn
                    module="xem-ngay-tot"
                    title={`Xem Ngày Tốt — ${purposeInfo?.label || purpose} — ${MONTH_NAMES[month - 1]} ${year}`}
                    inputData={{ thang: month, nam: year, mucDich: purpose }}
                    resultData={{ tongSoNgayTot: results.length, topNgayTot: results.slice(0, 3).map(d => d.dayInfo.solar.toLocaleDateString("vi-VN")) }}
                  />
                </div>
              )}
              {/* Calendar grid */}
              <Card className="bg-card/40 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl text-primary">Lịch {MONTH_NAMES[month-1]} {year}</CardTitle>
                  <CardDescription>
                    <span className="inline-flex items-center gap-1.5 mr-3"><span className="w-3 h-3 rounded-full bg-yellow-400/60 inline-block" /> Rất Tốt (≥85)</span>
                    <span className="inline-flex items-center gap-1.5 mr-3"><span className="w-3 h-3 rounded-full bg-green-400/60 inline-block" /> Tốt (≥70)</span>
                    <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400/60 inline-block" /> Khá (≥50)</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {DAY_NAMES.map(d => <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground/60 py-1">{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: calendarDays.firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                    {Array.from({ length: calendarDays.daysInMonth }, (_, i) => i + 1).map(day => {
                      const gd = goodDays.get(day);
                      const isSelected = selectedDay?.dayInfo.solar.getDate() === day;
                      const isToday = year === now.getFullYear() && month === now.getMonth()+1 && day === now.getDate();
                      const score = gd?.score ?? 0;
                      const bg = gd ? score >= 85 ? "bg-yellow-400/20 border-yellow-400/50 hover:bg-yellow-400/30"
                        : score >= 70 ? "bg-green-400/15 border-green-400/40 hover:bg-green-400/25"
                        : "bg-amber-400/10 border-amber-400/30 hover:bg-amber-400/20" : "bg-background/20 border-border/15 opacity-40";
                      return (
                        <button key={day} onClick={() => gd && setSelectedDay(isSelected ? null : gd)}
                          className={cn("aspect-square rounded-lg border flex flex-col items-center justify-center text-xs font-semibold transition-all",
                            bg, isSelected && "ring-2 ring-primary", isToday && "font-bold", gd ? "cursor-pointer" : "cursor-default")}>
                          <span className={cn(isToday ? "text-primary" : "text-foreground/80")}>{day}</span>
                          {gd && <span className={cn("text-[8px] mt-0.5", score >= 85 ? "text-yellow-300" : score >= 70 ? "text-green-300" : "text-amber-300")}>{score}</span>}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Selected day detail */}
              {selectedDay && (
                <Card className="bg-card/40 backdrop-blur-sm border-primary/20 animate-in fade-in duration-300">
                  <CardHeader>
                    <CardTitle className="text-xl text-primary">
                      {selectedDay.dayInfo.solar.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </CardTitle>
                    <CardDescription>
                      Âm lịch: {formatLunar(selectedDay.dayInfo.lunar)} • {selectedDay.dayInfo.canChiDay} • {selectedDay.dayInfo.rating}
                      {selectedDay.dayInfo.hoangDao && " • Hoàng Đạo"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <ScoreBadge score={selectedDay.score} />
                      <span className="text-sm text-muted-foreground">{selectedDay.dayInfo.note}</span>
                    </div>
                    {selectedDay.reasons.length > 0 && (
                      <div className="space-y-1.5">
                        {selectedDay.reasons.map((r, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-green-300"><span className="mt-0.5 shrink-0">✓</span>{r}</div>
                        ))}
                      </div>
                    )}
                    {selectedDay.warnings.length > 0 && (
                      <div className="space-y-1.5">
                        {selectedDay.warnings.map((w, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-amber-300"><span className="mt-0.5 shrink-0">⚠</span>{w}</div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Top 5 best days */}
              {showTop && results.length > 0 && (
                <Card className="bg-card/40 backdrop-blur-sm border-primary/20">
                  <CardHeader><CardTitle className="text-xl text-primary">Top Ngày Tốt Nhất — {purposeInfo?.label}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {results.slice(0, 5).map((d, i) => {
                      const date = d.dayInfo.solar;
                      return (
                        <button key={i} onClick={() => setSelectedDay(selectedDay === d ? null : d)}
                          className={cn("w-full text-left p-3 rounded-xl border transition-all",
                            selectedDay === d ? "border-primary bg-primary/10" : "border-border/25 bg-card/20 hover:border-primary/30")}>
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-foreground/90">
                                {i + 1}. {date.toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "long" })}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                Âm lịch {d.dayInfo.lunar.day}/{d.dayInfo.lunar.month} • {d.dayInfo.canChiDay}
                                {d.dayInfo.hoangDao && " • Hoàng Đạo"}
                              </div>
                            </div>
                            <ScoreBadge score={d.score} />
                          </div>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {results.length === 0 && (
                <Card className="bg-card/40 border-primary/20 text-center py-10">
                  <p className="text-muted-foreground">Không tìm thấy ngày đặc biệt tốt trong tháng này. Thử chọn tháng khác.</p>
                </Card>
              )}
            </div>
          )}
          <XemNgayTotKnowledge />
        </div>
      </main>
    </div>
  );
}
