import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { useAutoHistory } from "@/lib/use-auto-history";
import { SaveReadingBtn } from "@/components/save-reading-btn";
import { popReopenData, displayToInputDate } from "@/lib/reopen-reading";
import { SaoHanKnowledge } from "@/components/knowledge-base";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getMultiYearForecast, type AnnualStarResult } from "@/lib/sao-han";
import { dateInputToDisplay, validateDateDisplay } from "@/lib/form-utils";

const LUCK_COLOR: Record<string, string> = {
  "Đại Lợi": "text-yellow-400 border-yellow-400/40 bg-yellow-400/10",
  "Tốt": "text-green-400 border-green-400/40 bg-green-400/10",
  "Trung Bình": "text-amber-400 border-amber-400/40 bg-amber-400/10",
  "Cẩn Thận": "text-orange-400 border-orange-400/40 bg-orange-400/10",
  "Hóa Giải": "text-red-400 border-red-400/40 bg-red-400/10",
};

const STAR_TYPE_COLOR: Record<string, string> = {
  cat: "text-yellow-300", hung: "text-red-400", trung: "text-amber-300",
};

function StarCard({ data, current }: { data: AnnualStarResult; current: boolean }) {
  const luckCls = LUCK_COLOR[data.overallLuck] ?? "text-muted-foreground border-border/30";
  const typeColor = STAR_TYPE_COLOR[data.mainStar.type];
  return (
    <div className={cn("rounded-xl border p-4 space-y-3 transition-all", current ? "border-primary/60 bg-primary/8 shadow-[0_0_20px_hsl(var(--primary)/0.1)]" : "border-border/25 bg-card/20")}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-foreground">{data.year}</span>
            {current && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/40 font-semibold">NĂM NAY</span>}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Năm {data.canChi} • Bản mệnh {data.birthCanChi}</div>
        </div>
        <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full border", luckCls)}>{data.overallLuck}</span>
      </div>

      {/* Main star */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-background/30">
        <div className="w-10 h-10 rounded-full border border-border/30 flex items-center justify-center bg-background/40">
          <span className={cn("text-lg font-bold", typeColor)}>★</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn("font-bold text-sm", typeColor)}>{data.mainStar.name}</span>
            <span className="text-xs text-muted-foreground">{data.mainStar.viet}</span>
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-medium",
              data.mainStar.type === "cat" ? "bg-yellow-500/15 text-yellow-300" : data.mainStar.type === "hung" ? "bg-red-500/15 text-red-300" : "bg-amber-500/15 text-amber-300")}>
              {data.mainStar.strength}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{data.mainStar.desc}</p>
        </div>
      </div>

      {/* Secondary stars */}
      {data.secondaryStars.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {data.secondaryStars.map((s, i) => (
            <span key={i} className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium",
              s.type === "cat" ? "border-green-500/30 text-green-300 bg-green-500/8" : "border-amber-500/30 text-amber-300 bg-amber-500/8")}>
              {s.name}
            </span>
          ))}
        </div>
      )}

      {/* Areas */}
      <div className="flex flex-wrap gap-1">
        {data.mainStar.areas.map((a, i) => (
          <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-background/40 text-muted-foreground">{a}</span>
        ))}
      </div>

      {/* Advice */}
      <p className="text-xs text-primary/70 italic leading-relaxed border-l-2 border-primary/30 pl-3">{data.mainStar.advice}</p>
    </div>
  );
}

export default function SaoHanPage() {
  const [dob, setDob] = useState(""); const [dobInput, setDobInput] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState<AnnualStarResult[] | null>(null);
  const currentYear = new Date().getFullYear();

  useAutoHistory(results ? {
    module: "sao-han",
    moduleName: "Sao Hạn Hàng Năm",
    title: `Sao Hạn — sinh ngày ${dob}`,
    summary: `Năm ${currentYear}: ${results.find(r => r.year === currentYear)?.mainStar.name || ""} (${results.find(r => r.year === currentYear)?.overallLuck || ""})`,
    result: results.map(r => `Năm ${r.year} (${r.canChi}): ${r.mainStar.name} — ${r.overallLuck}. ${r.mainStar.advice}`).join("\n"),
  } : null);

  useEffect(() => {
    const d = popReopenData("sao-han");
    if (d?.dob) { setDob(String(d.dob)); setDobInput(displayToInputDate(String(d.dob))); }
  }, []);

  const handleCalculate = () => {
    const err = validateDateDisplay(dob);
    setError(err ?? "");
    if (err) return;
    const birthYear = parseInt(dob.split("/")[2], 10);
    setResults(getMultiYearForecast(birthYear, currentYear - 1, 7));
  };

  const handleDate = (v: string) => { setDobInput(v); setDob(dateInputToDisplay(v)); };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/15 via-background to-background pointer-events-none" />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-16 z-10 relative">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <p className="text-xs tracking-[0.3em] uppercase text-primary/60">Hạn Vận</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground drop-shadow-md">Sao Hạn Hàng Năm</h1>
            <p className="text-muted-foreground text-lg">Tra cứu sao chiếu mệnh và vận hạn qua các năm theo tuổi Can Chi.</p>
          </div>

          <Card className="bg-card/40 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Nhập ngày sinh</CardTitle>
              <CardDescription>Hệ thống sẽ tính sao hạn cho 7 năm xung quanh năm hiện tại.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground/80">Ngày sinh (dương lịch)</Label>
                <div className="relative">
                  <input type="date" value={dobInput} onChange={e => handleDate(e.target.value)}
                    min="1900-01-01" max={new Date().toISOString().split("T")[0]}
                    className={cn("flex h-10 w-full rounded-md border bg-background/50 px-3 py-2 pl-10 text-sm [color-scheme:dark] outline-none transition-all",
                      dobInput ? "border-green-500/50" : error ? "border-red-500/50" : "border-border/50 focus:border-primary/50")} />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={1.8}/><line x1="16" y1="2" x2="16" y2="6" strokeWidth={1.8}/><line x1="8" y1="2" x2="8" y2="6" strokeWidth={1.8}/><line x1="3" y1="10" x2="21" y2="10" strokeWidth={1.8}/></svg>
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
              </div>
              <Button onClick={handleCalculate} disabled={!dobInput}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold tracking-wider disabled:opacity-40">
                XEM SAO HẠN
              </Button>
            </CardContent>
          </Card>

          {results && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-px flex-1 bg-primary/20" />
                  <p className="text-sm text-muted-foreground text-center">Vận Hạn {results[0].year} — {results[results.length-1].year}</p>
                  <div className="h-px flex-1 bg-primary/20" />
                </div>
                <SaveReadingBtn
                  module="sao-han"
                  title={`Sao Hạn — sinh ngày ${dob}`}
                  inputData={{ dob }}
                  resultData={{ years: results.map(r => ({ year: r.year, star: r.mainStar.name, luck: r.overallLuck })) }}
                  variant="icon"
                />
              </div>
              {results.map((r) => (
                <StarCard key={r.year} data={r} current={r.year === currentYear} />
              ))}
              <Card className="bg-primary/5 border-primary/15 p-4">
                <p className="text-xs text-muted-foreground leading-relaxed text-center">
                  Sao hạn mang tính tham khảo và định hướng. Mỗi sao có thể được hóa giải hoặc tăng cường qua phong thủy, tu tâm tích đức và thời điểm hành động phù hợp.
                </p>
              </Card>
            </div>
          )}
          <SaoHanKnowledge />
        </div>
      </main>
    </div>
  );
}
