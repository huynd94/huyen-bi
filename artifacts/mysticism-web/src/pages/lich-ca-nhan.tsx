import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { useAutoHistory } from "@/lib/use-auto-history";
import { SaveReadingBtn } from "@/components/save-reading-btn";
import { popReopenData, displayToInputDate } from "@/lib/reopen-reading";
import { LichCaNhanKnowledge } from "@/components/knowledge-base";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { buildMonthCalendar, getPersonalYearInfo, computePersonalYear, computePersonalMonth, type DayInfo } from "@/lib/lich-ca-nhan";
import { dateInputToDisplay } from "@/lib/form-utils";

const MONTHS_VI = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
const DAYS_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const YEARS = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1];

function CalendarGrid({ days, year, month }: { days: DayInfo[]; year: number; month: number }) {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;

  return (
    <div>
      <div className="grid grid-cols-7 mb-2">
        {DAYS_VI.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground/60 py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`}/>)}
        {days.map((d) => {
          const isToday = isCurrentMonth && d.day === today.getDate();
          return (
            <div
              key={d.day}
              className={cn(
                "aspect-square flex flex-col items-center justify-center rounded-lg border text-center transition-all cursor-default",
                d.bgColor,
                isToday && "ring-2 ring-primary/60 ring-offset-1 ring-offset-background"
              )}
            >
              <span className={cn("text-xs font-bold leading-none", isToday ? "text-primary" : "text-foreground/80")}>{d.day}</span>
              <span className={cn("text-[9px] font-semibold mt-0.5", d.color)}>{d.personalDay}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function YearCard({ dob, year }: { dob: string; year: number }) {
  const info = getPersonalYearInfo(dob, year);
  const isCurrentYear = year === new Date().getFullYear();
  return (
    <div className={cn("rounded-xl border p-4 space-y-2 transition-all", isCurrentYear ? "border-primary/50 bg-primary/10" : "border-border/30 bg-card/30")}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">{year}</span>
        <span className={cn("text-2xl font-bold", isCurrentYear ? "text-primary" : "text-foreground/60")}>{info.personalYear}</span>
      </div>
      <p className="text-sm font-semibold text-foreground/80">{info.theme}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{info.advice}</p>
      {isCurrentYear && <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30">Năm hiện tại</span>}
    </div>
  );
}

export default function LichCaNhanPage() {
  const [dobInput, setDobInput] = useState("");
  const [dob, setDob] = useState("");
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1);
  const [calculated, setCalculated] = useState(false);

  const handleDobChange = (val: string) => {
    setDobInput(val);
    setDob(dateInputToDisplay(val));
  };

  const currentYear = new Date().getFullYear();

  useAutoHistory(calculated && dob ? {
    module: "lich-ca-nhan",
    moduleName: "Lịch Cá Nhân",
    title: `Lịch Cá Nhân — sinh ngày ${dob}`,
    summary: `Số năm cá nhân ${currentYear}: ${computePersonalYear(dob, currentYear)} — ${getPersonalYearInfo(dob, currentYear).theme}`,
    result: `Ngày sinh: ${dob}\nNăm ${currentYear - 1}: Số cá nhân ${computePersonalYear(dob, currentYear - 1)} — ${getPersonalYearInfo(dob, currentYear - 1).theme}\nNăm ${currentYear}: Số cá nhân ${computePersonalYear(dob, currentYear)} — ${getPersonalYearInfo(dob, currentYear).theme}\nNăm ${currentYear + 1}: Số cá nhân ${computePersonalYear(dob, currentYear + 1)} — ${getPersonalYearInfo(dob, currentYear + 1).theme}`,
  } : null);

  useEffect(() => {
    const d = popReopenData("lich-ca-nhan");
    if (d?.dob) { setDob(String(d.dob)); setDobInput(displayToInputDate(String(d.dob))); }
  }, []);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dobInput) return;
    setCalculated(true);
  };

  const days = calculated ? buildMonthCalendar(dob, viewYear, viewMonth) : [];

  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-24 pb-16 z-10 relative">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <p className="text-xs tracking-[0.3em] uppercase text-primary/60">Huyền học</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground drop-shadow-md">Lịch Cá Nhân</h1>
            <p className="text-muted-foreground text-lg">Xem ngày tốt xấu theo thần số học cá nhân hóa theo ngày sinh của bạn.</p>
          </div>

          <Card className="bg-card/40 backdrop-blur-sm border-primary/20 shadow-xl shadow-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Nhập ngày sinh</CardTitle>
              <CardDescription>Hệ thống tính toán Số Cá Nhân Ngày (Personal Day) riêng cho bạn.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCalculate} className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                    <svg className="w-4 h-4 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={1.8}/><line x1="16" y1="2" x2="16" y2="6" strokeWidth={1.8}/><line x1="8" y1="2" x2="8" y2="6" strokeWidth={1.8}/><line x1="3" y1="10" x2="21" y2="10" strokeWidth={1.8}/></svg>
                    Ngày sinh (dương lịch)
                  </Label>
                  <div className="relative">
                    <input
                      type="date"
                      value={dobInput}
                      onChange={(e) => handleDobChange(e.target.value)}
                      min="1900-01-01"
                      max={new Date().toISOString().split("T")[0]}
                      className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 pl-10 text-sm [color-scheme:dark] transition-all duration-200 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={1.8}/><line x1="16" y1="2" x2="16" y2="6" strokeWidth={1.8}/><line x1="8" y1="2" x2="8" y2="6" strokeWidth={1.8}/><line x1="3" y1="10" x2="21" y2="10" strokeWidth={1.8}/></svg>
                  </div>
                  {dobInput && <p className="text-xs text-muted-foreground">Ngày sinh: <span className="text-primary/80 font-medium">{dob}</span></p>}
                </div>
                <Button type="submit" disabled={!dobInput} className="w-full bg-primary text-primary-foreground font-semibold disabled:opacity-40">
                  XEM LỊCH CÁ NHÂN
                </Button>
              </form>
            </CardContent>
          </Card>

          {calculated && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex justify-end">
                <SaveReadingBtn
                  module="lich-ca-nhan"
                  title={`Lịch Cá Nhân — sinh ngày ${dob}`}
                  inputData={{ dob }}
                  resultData={{ personalYear: computePersonalYear(dob, currentYear) }}
                />
              </div>
              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-3">
                {[
                  { label: "Xuất sắc", color: "text-yellow-300", bg: "bg-yellow-500/15 border-yellow-500/30" },
                  { label: "Tốt", color: "text-green-300", bg: "bg-green-500/15 border-green-500/30" },
                  { label: "Bình thường", color: "text-blue-300", bg: "bg-blue-500/10 border-blue-500/20" },
                  { label: "Chú ý", color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
                ].map(l => (
                  <div key={l.label} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium", l.bg, l.color)}>
                    <span className={cn("w-2 h-2 rounded-full", l.color.replace("text-", "bg-"))} />
                    {l.label}
                  </div>
                ))}
              </div>

              {/* Calendar */}
              <Card className="bg-card/40 backdrop-blur-sm border-primary/20 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Button variant="ghost" size="sm" onClick={prevMonth} className="text-muted-foreground hover:text-primary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
                    </Button>
                    <div className="text-center">
                      <CardTitle className="text-xl text-primary">{MONTHS_VI[viewMonth - 1]} {viewYear}</CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Số Cá Nhân Tháng: <span className="text-primary font-semibold">{computePersonalMonth(computePersonalYear(dob, viewYear), viewMonth)}</span>
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={nextMonth} className="text-muted-foreground hover:text-primary">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <CalendarGrid days={days} year={viewYear} month={viewMonth} />
                </CardContent>
              </Card>

              {/* Year outlook */}
              <div>
                <h3 className="text-sm font-semibold text-primary/80 uppercase tracking-widest mb-4">Vận trình 3 năm</h3>
                <div className="space-y-3">
                  {YEARS.map(y => <YearCard key={y} dob={dob} year={y} />)}
                </div>
              </div>
            </div>
          )}
          <LichCaNhanKnowledge />
        </div>
      </main>
    </div>
  );
}
