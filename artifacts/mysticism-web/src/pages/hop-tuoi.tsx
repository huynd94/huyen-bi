import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { useAutoHistory } from "@/lib/use-auto-history";
import { SaveReadingBtn } from "@/components/save-reading-btn";
import { popReopenData, displayToInputDate } from "@/lib/reopen-reading";
import { HopTuoiKnowledge } from "@/components/knowledge-base";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { analyzeCompatibility, type CompatibilityResult } from "@/lib/hop-tuoi";
import { dateInputToDisplay, validateDateDisplay } from "@/lib/form-utils";

function CompatibilityRadar({ data }: { data: { label: string; abbr: string; score: number }[] }) {
  const size = 220;
  const cx = size / 2, cy = size / 2;
  const r = size * 0.34;
  const n = data.length;
  const points = data.map((d, i) => {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
    const ratio = d.score / 100;
    return { x: cx + r * ratio * Math.cos(angle), y: cy + r * ratio * Math.sin(angle) };
  });
  const polygon = points.map(p => `${p.x},${p.y}`).join(" ");
  const gridPts = (ratio: number) =>
    Array.from({ length: n }, (_, i) => {
      const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
      return `${cx + r * ratio * Math.cos(angle)},${cy + r * ratio * Math.sin(angle)}`;
    }).join(" ");
  const lblPts = data.map((d, i) => {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
    const lr = r * 1.36;
    return { x: cx + lr * Math.cos(angle), y: cy + lr * Math.sin(angle), abbr: d.abbr, score: d.score };
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[240px] mx-auto">
      {[0.25, 0.5, 0.75, 1].map((r2, i) => (
        <polygon key={i} points={gridPts(r2)} fill="none" stroke="rgba(201,160,48,0.12)" strokeWidth="0.8" />
      ))}
      {Array.from({ length: n }, (_, i) => {
        const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="rgba(201,160,48,0.18)" strokeWidth="0.8" />;
      })}
      <polygon points={polygon} fill="rgba(201,160,48,0.16)" stroke="rgba(201,160,48,0.85)" strokeWidth="1.6" strokeLinejoin="round" />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#c9a030" opacity="0.9" />)}
      {lblPts.map((p, i) => (
        <g key={i}>
          <text x={p.x} y={p.y - 4} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="7.5" fontWeight="600">{p.abbr}</text>
          <text x={p.x} y={p.y + 7} textAnchor="middle" fill="#c9a030" fontSize="9" fontWeight="700">{p.score}</text>
        </g>
      ))}
    </svg>
  );
}

function ScoreRing({ score, size = 100 }: { score: number; size?: number }) {
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 80 ? "#facc15" : score >= 65 ? "#4ade80" : score >= 50 ? "#fb923c" : "#f87171";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={size*0.09} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size*0.09}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        fill={color} fontSize={size*0.22} fontWeight="bold">{score}</text>
      <text x={size/2} y={size/2 + size*0.16} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize={size*0.1}>/100</text>
    </svg>
  );
}

function PersonCard({ label, p }: { label: string; p: CompatibilityResult["person1"] }) {
  return (
    <Card className="bg-card/40 backdrop-blur-sm border-primary/20 flex-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-primary/80">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-3xl font-bold text-primary font-serif">{p.can} {p.chi}</div>
        <div className="text-sm text-muted-foreground">Con {p.zodiac} • Năm {p.year}</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-background/30 rounded-lg p-2 text-center">
            <div className="text-muted-foreground mb-0.5">Mệnh Quái</div>
            <div className="font-semibold text-primary">{p.guaName} ({p.mingGua})</div>
          </div>
          <div className="bg-background/30 rounded-lg p-2 text-center">
            <div className="text-muted-foreground mb-0.5">Số Đường Đời</div>
            <div className="font-semibold text-primary">{p.lifePathNum}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value, score, desc }: { label: string; value: string; score: number; desc?: string }) {
  const color = score >= 80 ? "text-yellow-400 border-yellow-400/30 bg-yellow-400/5"
    : score >= 65 ? "text-green-400 border-green-400/30 bg-green-400/5"
    : score >= 50 ? "text-amber-400 border-amber-400/30 bg-amber-400/5"
    : "text-red-400 border-red-400/30 bg-red-400/5";
  return (
    <div className="p-4 rounded-xl border border-border/20 bg-card/20 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground/80">{label}</span>
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full border", color)}>{value}</span>
          <span className="text-xs text-muted-foreground">{score}/100</span>
        </div>
      </div>
      {desc && <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>}
    </div>
  );
}

export default function HopTuoiPage() {
  const [dob1, setDob1] = useState(""); const [dob1Input, setDob1Input] = useState("");
  const [dob2, setDob2] = useState(""); const [dob2Input, setDob2Input] = useState("");
  const [gender1, setGender1] = useState<"nam" | "nu">("nam");
  const [gender2, setGender2] = useState<"nam" | "nu">("nu");
  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [errors, setErrors] = useState({ dob1: "", dob2: "" });

  useAutoHistory(result ? {
    module: "hop-tuoi",
    moduleName: "Hợp Tuổi & Duyên Số",
    title: `Hợp Tuổi — ${result.person1.can} ${result.person1.chi} & ${result.person2.can} ${result.person2.chi}`,
    summary: `${result.verdict} (${result.totalScore}/100) — ${result.summary.slice(0, 100)}`,
    result: `Người 1: ${result.person1.can} ${result.person1.chi} (${result.person1.zodiac})\nNgười 2: ${result.person2.can} ${result.person2.chi} (${result.person2.zodiac})\nĐiểm: ${result.totalScore}/100\n${result.verdict}\n${result.summary}`,
  } : null);

  useEffect(() => {
    const d = popReopenData("hop-tuoi");
    if (d) {
      if (d.dob1) { setDob1(String(d.dob1)); setDob1Input(displayToInputDate(String(d.dob1))); }
      if (d.gioiTinh1) setGender1(d.gioiTinh1 as "nam" | "nu");
      if (d.dob2) { setDob2(String(d.dob2)); setDob2Input(displayToInputDate(String(d.dob2))); }
      if (d.gioiTinh2) setGender2(d.gioiTinh2 as "nam" | "nu");
    }
  }, []);

  const handleCalculate = () => {
    const e1 = validateDateDisplay(dob1);
    const e2 = validateDateDisplay(dob2);
    setErrors({ dob1: e1 ?? "", dob2: e2 ?? "" });
    if (e1 || e2) return;
    setResult(analyzeCompatibility(dob1, gender1, dob2, gender2));
  };

  const handleDate1 = (v: string) => { setDob1Input(v); setDob1(dateInputToDisplay(v)); };
  const handleDate2 = (v: string) => { setDob2Input(v); setDob2(dateInputToDisplay(v)); };

  const GenderSelect = ({ value, onChange }: { value: "nam" | "nu"; onChange: (v: "nam" | "nu") => void }) => (
    <div className="flex rounded-lg overflow-hidden border border-border/40">
      {(["nam", "nu"] as const).map(g => (
        <button key={g} onClick={() => onChange(g)}
          className={cn("flex-1 py-1.5 text-xs font-medium transition-all",
            value === g ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground bg-background/30")}>
          {g === "nam" ? "Nam" : "Nữ"}
        </button>
      ))}
    </div>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-900/15 via-background to-background pointer-events-none" />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-16 z-10 relative">
        <div className="max-w-3xl mx-auto space-y-8">

          <div className="text-center space-y-3">
            <p className="text-xs tracking-[0.3em] uppercase text-primary/60">Huyền Số</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground drop-shadow-md">Hợp Tuổi & Duyên Số</h1>
            <p className="text-muted-foreground text-lg">Phân tích tương hợp qua Mệnh Quái, Can Chi, Ngũ Hành và Thần Số.</p>
          </div>

          <Card className="bg-card/40 backdrop-blur-sm border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl text-primary">Thông tin hai người</CardTitle>
              <CardDescription>Nhập ngày sinh và giới tính để phân tích mức độ tương hợp.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {([{ label: "Người 1", dob: dob1Input, setDob: handleDate1, gender: gender1, setGender: setGender1, err: errors.dob1, id: "dob1" },
                   { label: "Người 2", dob: dob2Input, setDob: handleDate2, gender: gender2, setGender: setGender2, err: errors.dob2, id: "dob2" }] as const).map((p) => (
                  <div key={p.id} className="space-y-3 p-4 rounded-xl border border-border/20 bg-background/20">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold text-primary/80">{p.label}</Label>
                      <GenderSelect value={p.gender} onChange={p.setGender} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Ngày sinh</Label>
                      <div className="relative">
                        <input type="date" value={p.dob}
                          onChange={e => p.setDob(e.target.value)}
                          min="1900-01-01" max={new Date().toISOString().split("T")[0]}
                          className={cn("flex h-10 w-full rounded-md border bg-background/50 px-3 py-2 pl-10 text-sm [color-scheme:dark] outline-none transition-all",
                            p.dob ? "border-green-500/50" : p.err ? "border-red-500/50" : "border-border/50 focus:border-primary/50")} />
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={1.8}/><line x1="16" y1="2" x2="16" y2="6" strokeWidth={1.8}/><line x1="8" y1="2" x2="8" y2="6" strokeWidth={1.8}/><line x1="3" y1="10" x2="21" y2="10" strokeWidth={1.8}/></svg>
                      </div>
                      {p.err && <p className="text-xs text-red-400">{p.err}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={handleCalculate} disabled={!dob1Input || !dob2Input}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold tracking-wider disabled:opacity-40">
                PHÂN TÍCH TƯƠNG HỢP
              </Button>
            </CardContent>
          </Card>

          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex justify-end">
                <SaveReadingBtn
                  module="hop-tuoi"
                  title={`Hợp Tuổi — ${result.person1.can} ${result.person1.chi} & ${result.person2.can} ${result.person2.chi}`}
                  inputData={{ dob1, gioiTinh1: gender1, dob2, gioiTinh2: gender2 }}
                  resultData={{ score: result.totalScore, verdict: result.verdict, zodiac1: result.person1.zodiac, zodiac2: result.person2.zodiac }}
                />
              </div>
              {/* Person cards */}
              <div className="flex gap-4">
                <PersonCard label="Người 1" p={result.person1} />
                <div className="flex items-center justify-center text-4xl text-primary/30 font-bold shrink-0">♡</div>
                <PersonCard label="Người 2" p={result.person2} />
              </div>

              {/* Total score */}
              <Card className="bg-card/40 backdrop-blur-sm border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <ScoreRing score={result.totalScore} size={120} />
                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <div className={cn("text-3xl font-bold", result.verdictColor)}>{result.verdict}</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{result.summary}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Detail breakdown */}
              <Card className="bg-card/40 backdrop-blur-sm border-primary/20">
                <CardHeader><CardTitle className="text-xl text-primary">Phân Tích Chi Tiết</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <DetailRow label="Cung Địa Chi (Tuổi)" value={result.zodiacRel.type} score={result.zodiacRel.score} desc={result.zodiacRel.desc} />
                  <DetailRow label="Ngũ Hành Thiên Can" value={result.nguHanhRel.type} score={result.nguHanhRel.score} />
                  <DetailRow label="Mệnh Quái (Phong Thủy)" value={result.guaRel.type} score={result.guaRel.score} desc={result.guaRel.desc} />
                  <DetailRow label="Thần Số Đường Đời" value={`Số ${result.person1.lifePathNum} & Số ${result.person2.lifePathNum}`} score={result.numScore} />
                </CardContent>
              </Card>

              {/* Score breakdown — radar + bars */}
              <Card className="bg-card/40 backdrop-blur-sm border-primary/20">
                <CardHeader><CardTitle className="text-xl text-primary">Biểu Đồ Tương Hợp</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <CompatibilityRadar data={[
                    { label: "Cung Tuổi", abbr: "Tuổi", score: result.zodiacRel.score },
                    { label: "Ngũ Hành", abbr: "Ngũ H.", score: result.nguHanhRel.score },
                    { label: "Mệnh Quái", abbr: "M.Quái", score: result.guaRel.score },
                    { label: "Thần Số", abbr: "Thần S.", score: result.numScore },
                  ]} />
                  <div className="space-y-3">
                    {[
                      { label: "Cung Tuổi (35%)", score: result.zodiacRel.score },
                      { label: "Ngũ Hành (25%)", score: result.nguHanhRel.score },
                      { label: "Mệnh Quái (20%)", score: result.guaRel.score },
                      { label: "Thần Số (20%)", score: result.numScore },
                    ].map(item => {
                      const color = item.score >= 80 ? "bg-yellow-400" : item.score >= 65 ? "bg-green-400" : item.score >= 50 ? "bg-amber-400" : "bg-red-400";
                      return (
                        <div key={item.label} className="space-y-1.5">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{item.label}</span>
                            <span className="font-semibold text-foreground">{item.score}/100</span>
                          </div>
                          <div className="h-2 bg-background/40 rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${item.score}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          <HopTuoiKnowledge />
        </div>
      </main>
    </div>
  );
}
