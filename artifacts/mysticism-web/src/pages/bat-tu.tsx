import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { useAutoHistory } from "@/lib/use-auto-history";
import { SaveReadingBtn } from "@/components/save-reading-btn";
import { popReopenData, displayToInputDate } from "@/lib/reopen-reading";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { computeBatu, Pillar, NguyenHanhItem } from "@/lib/batu";
import { computeDaiVan, type DaiVanResult } from "@/lib/dai-van";
import { useAISSEChat } from "@/hooks/use-ai-sse-chat";
import { useExportImage } from "@/hooks/use-export-image";
import { Progress } from "@/components/ui/progress";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { BatuKnowledge } from "@/components/knowledge-base";
import { BatuExportCard } from "@/components/export-card-batu";
import { ExportDownloadBar } from "@/components/export-download-bar";
import { cn } from "@/lib/utils";
import { dateInputToDisplay, validateDateDisplay, hourToCanChi } from "@/lib/form-utils";

const NH_COLORS: Record<string, { stroke: string; fill: string; text: string }> = {
  Mộc: { stroke: "#4ade80", fill: "#4ade8022", text: "text-green-400" },
  Hoả: { stroke: "#f87171", fill: "#f8717122", text: "text-red-400" },
  Thổ: { stroke: "#fbbf24", fill: "#fbbf2422", text: "text-amber-400" },
  Kim: { stroke: "#94a3b8", fill: "#94a3b822", text: "text-slate-400" },
  Thuỷ: { stroke: "#60a5fa", fill: "#60a5fa22", text: "text-blue-400" },
};

function DonutChart({ items }: { items: NguyenHanhItem[] }) {
  const cx = 80, cy = 80, r = 60, inner = 36;
  const total = items.reduce((s, i) => s + i.percentage, 0) || 100;
  let startAngle = -Math.PI / 2;
  const arcs = items.map((item) => {
    const sweep = (item.percentage / total) * 2 * Math.PI;
    const endAngle = startAngle + sweep;
    const x1 = cx + r * Math.cos(startAngle), y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle), y2 = cy + r * Math.sin(endAngle);
    const ix1 = cx + inner * Math.cos(startAngle), iy1 = cy + inner * Math.sin(startAngle);
    const ix2 = cx + inner * Math.cos(endAngle), iy2 = cy + inner * Math.sin(endAngle);
    const large = sweep > Math.PI ? 1 : 0;
    const midAngle = startAngle + sweep / 2;
    const lx = cx + (r + 16) * Math.cos(midAngle);
    const ly = cy + (r + 16) * Math.sin(midAngle);
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${inner} ${inner} 0 ${large} 0 ${ix1} ${iy1} Z`;
    const col = NH_COLORS[item.element] ?? { stroke: "#888", fill: "#88888822", text: "text-gray-400" };
    const arc = { path, col, lx, ly, midAngle, sweep, item };
    startAngle = endAngle;
    return arc;
  });

  const dominant = items.reduce((a, b) => a.percentage >= b.percentage ? a : b, items[0]);

  return (
    <svg viewBox="0 0 160 160" className="w-full max-w-[180px] shrink-0">
      {arcs.map(({ path, col, lx, ly, sweep, item }, i) => (
        <g key={i}>
          <path d={path} fill={col.fill} stroke={col.stroke} strokeWidth="1.5" className="transition-all"/>
          {sweep > 0.35 && (
            <text x={lx} y={ly} textAnchor="middle" fontSize="7.5" fill={col.stroke} fontWeight="600" dominantBaseline="middle">
              {item.element}
            </text>
          )}
        </g>
      ))}
      {dominant && (
        <>
          <text x={cx} y={cy - 7} textAnchor="middle" fontSize="11" fontWeight="700" fill={NH_COLORS[dominant.element]?.stroke ?? "#fff"}>{dominant.element}</text>
          <text x={cx} y={cy + 7} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.5)">{dominant.percentage}%</text>
        </>
      )}
    </svg>
  );
}

interface CompareState {
  date2: string;
  dateInput2: string;
  time2: string;
  results2: { nam: Pillar; thang: Pillar; ngay: Pillar; gio: Pillar; nguHanhAnalysis: NguyenHanhItem[] } | null;
}

export default function BatuPage() {
  const [date, setDate] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [time, setTime] = useState("06:00");
  const [gender, setGender] = useState<"nam" | "nu">("nam");
  const [errors, setErrors] = useState({ date: "", time: "" });
  const [touched, setTouched] = useState({ date: false, time: false });
  const [results, setResults] = useState<{
    nam: Pillar;
    thang: Pillar;
    ngay: Pillar;
    gio: Pillar;
    nguHanhAnalysis: NguyenHanhItem[];
  } | null>(null);
  const [daiVan, setDaiVan] = useState<DaiVanResult | null>(null);

  const [compare, setCompare] = useState<CompareState>({ date2: "", dateInput2: "", time2: "06:00", results2: null });
  const [showCompare, setShowCompare] = useState(false);

  const { messages, streamResponse, isStreaming } = useAISSEChat();
  const { exportRef, downloadAsImage, downloadAsText, downloadAsPdf, isExporting, isPdfExporting } = useExportImage();

  const handleDateChange = (val: string) => {
    setDateInput(val);
    const display = dateInputToDisplay(val);
    setDate(display);
    if (touched.date) setErrors((e) => ({ ...e, date: validateDateDisplay(display) }));
  };

  const selectedHour = time ? parseInt(time.split(":")[0], 10) : null;

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const dateErr = validateDateDisplay(date);
    const timeErr = !time ? "Vui lòng chọn giờ sinh." : "";
    setErrors({ date: dateErr, time: timeErr });
    setTouched({ date: true, time: true });
    if (dateErr || timeErr) return;
    setResults(computeBatu(date, time));
    setDaiVan(computeDaiVan(date, gender));
    setCompare((c) => ({ ...c, results2: null }));
  };

  const handleCompare = () => {
    if (!compare.date2 || !compare.time2) return;
    setCompare((c) => ({ ...c, results2: computeBatu(c.date2, c.time2) }));
  };

  const handleAskAI = () => {
    if (!results) return;
    const context = `Lá số Bát Tự. Trụ Năm: ${results.nam.thienCan} ${results.nam.diaChi} (${results.nam.nguHanh}). Trụ Tháng: ${results.thang.thienCan} ${results.thang.diaChi} (${results.thang.nguHanh}). Trụ Ngày: ${results.ngay.thienCan} ${results.ngay.diaChi} (${results.ngay.nguHanh}). Trụ Giờ: ${results.gio.thienCan} ${results.gio.diaChi} (${results.gio.nguHanh}). Phân tích ngũ hành: ${results.nguHanhAnalysis.map((x) => `${x.element}: ${x.percentage}%`).join(", ")}.`;
    streamResponse("/api/mysticism/ai-interpret", { type: "batu", context });
  };

  const aiText = messages.filter((m) => m.role === "assistant").map((m) => m.content).join("");

  const buildTextContent = () => {
    if (!results) return "";
    return [
      `Ngày sinh: ${date} | Giờ sinh: ${time}`,
      "",
      "TỨ TRỤ:",
      `Trụ Giờ:   ${results.gio.thienCan} ${results.gio.diaChi} (${results.gio.nguHanh})`,
      `Trụ Ngày:  ${results.ngay.thienCan} ${results.ngay.diaChi} (${results.ngay.nguHanh})`,
      `Trụ Tháng: ${results.thang.thienCan} ${results.thang.diaChi} (${results.thang.nguHanh})`,
      `Trụ Năm:   ${results.nam.thienCan} ${results.nam.diaChi} (${results.nam.nguHanh})`,
      "",
      "PHÂN TÍCH NGŨ HÀNH:",
      ...results.nguHanhAnalysis.map((x) => `${x.element}: ${x.percentage}%`),
      aiText ? `\nLUẬN GIẢI AI:\n${aiText}` : "",
    ].join("\n");
  };

  useAutoHistory(results ? {
    module: "bat-tu",
    moduleName: "Bát Tự Tứ Trụ",
    title: `Bát Tự — ${date} | Giờ ${time}`,
    summary: `Tứ trụ: ${results.gio.thienCan}${results.gio.diaChi} ${results.ngay.thienCan}${results.ngay.diaChi} ${results.thang.thienCan}${results.thang.diaChi} ${results.nam.thienCan}${results.nam.diaChi}. Ngũ hành chủ: ${results.nguHanhAnalysis.reduce((a, b) => a.percentage >= b.percentage ? a : b).element}.`,
    result: `Ngày sinh: ${date} | Giờ: ${time}\nTứ Trụ:\nGiờ: ${results.gio.thienCan} ${results.gio.diaChi} (${results.gio.nguHanh})\nNgày: ${results.ngay.thienCan} ${results.ngay.diaChi} (${results.ngay.nguHanh})\nTháng: ${results.thang.thienCan} ${results.thang.diaChi} (${results.thang.nguHanh})\nNăm: ${results.nam.thienCan} ${results.nam.diaChi} (${results.nam.nguHanh})`,
  } : null);

  useEffect(() => {
    const d = popReopenData("bat-tu");
    if (d) {
      if (d.ngaySinh) { setDate(String(d.ngaySinh)); setDateInput(displayToInputDate(String(d.ngaySinh))); }
      if (d.gioSinh) setTime(String(d.gioSinh));
    }
  }, []);

  const nhCompatDesc = (items1: NguyenHanhItem[], items2: NguyenHanhItem[]) => {
    const dom1 = items1.reduce((a, b) => a.percentage >= b.percentage ? a : b).element;
    const dom2 = items2.reduce((a, b) => a.percentage >= b.percentage ? a : b).element;
    const TUONG_SINH: Record<string, string> = { Mộc: "Hoả", Hoả: "Thổ", Thổ: "Kim", Kim: "Thuỷ", Thuỷ: "Mộc" };
    const TUONG_KHAC: Record<string, string> = { Mộc: "Thổ", Hoả: "Kim", Thổ: "Thuỷ", Kim: "Mộc", Thuỷ: "Hoả" };
    if (dom1 === dom2) return { label: "Đồng nguyên", desc: `Cả hai đều mang hành ${dom1} chủ — tương đồng, dễ đồng điệu.`, color: "text-blue-400" };
    if (TUONG_SINH[dom1] === dom2 || TUONG_SINH[dom2] === dom1) return { label: "Tương sinh", desc: `${dom1} và ${dom2} tương sinh nhau — hỗ trợ, bổ sung cho nhau.`, color: "text-green-400" };
    if (TUONG_KHAC[dom1] === dom2 || TUONG_KHAC[dom2] === dom1) return { label: "Tương khắc", desc: `${dom1} và ${dom2} tương khắc — cần nỗ lực dung hoà và nhường nhịn.`, color: "text-red-400" };
    return { label: "Trung tính", desc: "Không có mối quan hệ ngũ hành đặc biệt giữa hai bên.", color: "text-muted-foreground" };
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <Navbar />

      <div style={{ position: "absolute", left: -9999, top: 0, pointerEvents: "none", zIndex: -1 }}>
        {results && (
          <BatuExportCard ref={exportRef} date={date} time={time} gio={results.gio} ngay={results.ngay} thang={results.thang} nam={results.nam} nguHanhAnalysis={results.nguHanhAnalysis} aiText={aiText || undefined} />
        )}
      </div>

      <main className="flex-1 container mx-auto px-4 pt-24 pb-16 z-10 relative">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground drop-shadow-md">Bát tự Tứ Trụ</h1>
            <p className="text-muted-foreground text-lg">Lập lá số Tử Bình, phân tích sự cân bằng Ngũ Hành.</p>
          </div>

          <Card className="bg-card/40 backdrop-blur-sm border-primary/20 shadow-xl shadow-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Thông tin bản mệnh</CardTitle>
              <CardDescription>Nhập ngày sinh (dương lịch) và giờ sinh để lập lá số.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCalculate} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="date-batu" className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                      <svg className="w-4 h-4 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={1.8}/><line x1="16" y1="2" x2="16" y2="6" strokeWidth={1.8}/><line x1="8" y1="2" x2="8" y2="6" strokeWidth={1.8}/><line x1="3" y1="10" x2="21" y2="10" strokeWidth={1.8}/></svg>
                      Ngày sinh (dương lịch)
                    </Label>
                    <div className="relative">
                      <input
                        id="date-batu"
                        type="date"
                        value={dateInput}
                        onChange={(e) => handleDateChange(e.target.value)}
                        onBlur={() => { setTouched((t) => ({ ...t, date: true })); setErrors((e) => ({ ...e, date: validateDateDisplay(date) })); }}
                        min="1900-01-01"
                        max={new Date().toISOString().split("T")[0]}
                        className={cn("flex h-10 w-full rounded-md border bg-background/50 px-3 py-2 pl-10 text-sm [color-scheme:dark] transition-all duration-200 outline-none",
                          touched.date && errors.date ? "border-red-500/70 focus:ring-1 focus:ring-red-500/40"
                            : dateInput ? "border-green-500/50 focus:ring-1 focus:ring-green-500/30"
                            : "border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20")}
                      />
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={1.8}/><line x1="16" y1="2" x2="16" y2="6" strokeWidth={1.8}/><line x1="8" y1="2" x2="8" y2="6" strokeWidth={1.8}/><line x1="3" y1="10" x2="21" y2="10" strokeWidth={1.8}/></svg>
                    </div>
                    {touched.date && errors.date && <p className="text-xs text-red-400 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>{errors.date}</p>}
                    {dateInput && !errors.date && <p className="text-xs text-muted-foreground">Dương lịch: <span className="text-primary/80 font-medium">{date}</span></p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time-batu" className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                      <svg className="w-4 h-4 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={1.8}/><polyline points="12 6 12 12 16 14" strokeWidth={1.8}/></svg>
                      Giờ sinh
                    </Label>
                    <div className="relative">
                      <input
                        id="time-batu"
                        type="time"
                        value={time}
                        onChange={(e) => { setTime(e.target.value); setTouched((t) => ({ ...t, time: true })); }}
                        className={cn("flex h-10 w-full rounded-md border bg-background/50 px-3 py-2 pl-10 text-sm [color-scheme:dark] transition-all duration-200 outline-none",
                          time ? "border-green-500/50 focus:ring-1 focus:ring-green-500/30"
                            : "border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20")}
                      />
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={1.8}/><polyline points="12 6 12 12 16 14" strokeWidth={1.8}/></svg>
                    </div>
                    {selectedHour !== null && (
                      <p className="text-xs text-primary/70 flex items-center gap-1">
                        <span className="text-primary font-semibold">✦</span>
                        {hourToCanChi(selectedHour)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground/80">Giới tính <span className="text-xs text-muted-foreground">(dùng tính Đại Vận)</span></Label>
                  <div className="flex gap-2">
                    {(["nam", "nu"] as const).map((g) => (
                      <button key={g} type="button" onClick={() => setGender(g)}
                        className={cn("flex-1 py-2 rounded-lg border text-sm font-medium transition-all",
                          gender === g ? "border-primary bg-primary/20 text-primary" : "border-border/40 text-muted-foreground hover:border-primary/30 bg-background/30")}>
                        {g === "nam" ? "Nam" : "Nữ"}
                      </button>
                    ))}
                  </div>
                </div>
                <Button type="submit" disabled={!dateInput || !time} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold tracking-wider disabled:opacity-40">
                  LẬP LÁ SỐ
                </Button>
              </form>
            </CardContent>
          </Card>

          {results && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <ExportDownloadBar
                  onDownloadImage={() => downloadAsImage(`bat-tu-${date.replace(/\//g, "-")}`)}
                  onDownloadText={() => downloadAsText(buildTextContent(), `bat-tu-${date.replace(/\//g, "-")}`)}
                  onDownloadPdf={() => downloadAsPdf(`bat-tu-${date.replace(/\//g, "-")}`)}
                  isExporting={isExporting}
                  isPdfExporting={isPdfExporting}
                />
                <SaveReadingBtn
                  module="bat-tu"
                  title={`Bát Tự — ${date} | Giờ ${time}`}
                  inputData={{ ngaySinh: date, gioSinh: time }}
                  resultData={{ gio: results.gio, ngay: results.ngay, thang: results.thang, nam: results.nam, nguHanhChu: results.nguHanhAnalysis.reduce((a, b) => a.percentage >= b.percentage ? a : b).element }}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { title: "Trụ Giờ", data: results.gio },
                  { title: "Trụ Ngày", data: results.ngay },
                  { title: "Trụ Tháng", data: results.thang },
                  { title: "Trụ Năm", data: results.nam },
                ].map((pillar, idx) => {
                  const col = NH_COLORS[pillar.data.nguHanh] ?? { stroke: "#888", fill: "#88888810", text: "text-gray-400" };
                  return (
                    <Card key={idx} className="backdrop-blur-sm text-center py-6 border transition-all" style={{ borderColor: col.stroke + "55", background: col.fill }}>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">{pillar.title}</h3>
                      <div className="text-3xl font-serif font-bold mb-2" style={{ color: col.stroke }}>{pillar.data.thienCan}</div>
                      <div className="text-3xl font-serif font-bold mb-4" style={{ color: col.stroke }}>{pillar.data.diaChi}</div>
                      <div className={`text-xs font-semibold ${col.text}`}>{pillar.data.nguHanh}</div>
                    </Card>
                  );
                })}
              </div>

              {/* Ngũ Hành with donut chart */}
              <Card className="bg-card/40 backdrop-blur-sm border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl text-primary">Phân tích Ngũ Hành</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                    <DonutChart items={results.nguHanhAnalysis} />
                    <div className="flex-1 space-y-3 w-full">
                      {results.nguHanhAnalysis.map((item, i) => {
                        const col = NH_COLORS[item.element] ?? { stroke: "#888", fill: "#88888810", text: "text-gray-400" };
                        return (
                          <div key={i} className="flex items-center gap-4">
                            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: col.stroke }} />
                            <div className={`w-10 text-sm font-semibold ${col.text}`}>{item.element}</div>
                            <Progress value={item.percentage} className="h-2 flex-1" />
                            <div className="w-12 text-right text-xs text-muted-foreground">{item.percentage}%</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Hợp Cung Đôi */}
              <Card className="bg-card/40 backdrop-blur-sm border-primary/20">
                <CardHeader className="cursor-pointer select-none" onClick={() => setShowCompare(!showCompare)}>
                  <CardTitle className="text-xl text-primary flex items-center justify-between">
                    <span>Hợp Cung Đôi</span>
                    <svg className={cn("w-5 h-5 text-primary/60 transition-transform", showCompare && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                  </CardTitle>
                  <CardDescription>So sánh ngũ hành với người còn lại để xét hợp cung.</CardDescription>
                </CardHeader>
                {showCompare && (
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground/80">Ngày sinh người 2</Label>
                        <div className="relative">
                          <input type="date" value={compare.dateInput2}
                            onChange={(e) => { const d = dateInputToDisplay(e.target.value); setCompare((c) => ({ ...c, dateInput2: e.target.value, date2: d })); }}
                            min="1900-01-01" max={new Date().toISOString().split("T")[0]}
                            className={cn("flex h-10 w-full rounded-md border bg-background/50 px-3 py-2 pl-10 text-sm [color-scheme:dark] transition-all outline-none",
                              compare.dateInput2 ? "border-green-500/50" : "border-border/50 focus:border-primary/50")} />
                          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={1.8}/><line x1="16" y1="2" x2="16" y2="6" strokeWidth={1.8}/><line x1="8" y1="2" x2="8" y2="6" strokeWidth={1.8}/><line x1="3" y1="10" x2="21" y2="10" strokeWidth={1.8}/></svg>
                        </div>
                        {compare.dateInput2 && <p className="text-xs text-muted-foreground">Dương lịch: <span className="text-primary/80 font-medium">{compare.date2}</span></p>}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground/80">Giờ sinh người 2</Label>
                        <div className="relative">
                          <input type="time" value={compare.time2}
                            onChange={(e) => setCompare((c) => ({ ...c, time2: e.target.value }))}
                            className={cn("flex h-10 w-full rounded-md border bg-background/50 px-3 py-2 pl-10 text-sm [color-scheme:dark] transition-all outline-none",
                              compare.time2 ? "border-green-500/50" : "border-border/50 focus:border-primary/50")} />
                          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={1.8}/><polyline points="12 6 12 12 16 14" strokeWidth={1.8}/></svg>
                        </div>
                        {compare.time2 && <p className="text-xs text-primary/70 flex items-center gap-1"><span className="text-primary font-semibold">✦</span>{hourToCanChi(parseInt(compare.time2.split(":")[0], 10))}</p>}
                      </div>
                    </div>
                    <Button onClick={handleCompare} disabled={!compare.dateInput2 || !compare.time2} className="w-full border-primary/50 text-primary hover:bg-primary/10" variant="outline">
                      So sánh
                    </Button>

                    {compare.results2 && (() => {
                      const compat = nhCompatDesc(results.nguHanhAnalysis, compare.results2.nguHanhAnalysis);
                      return (
                        <div className="space-y-6 animate-in fade-in duration-500">
                          {/* Side-by-side pillars */}
                          <div className="grid grid-cols-2 gap-4">
                            {[
                              { label: `Người 1 (${date})`, items: results.nguHanhAnalysis },
                              { label: `Người 2 (${compare.date2})`, items: compare.results2.nguHanhAnalysis },
                            ].map((side, si) => (
                              <div key={si} className="rounded-xl border border-primary/20 bg-background/30 p-4 space-y-2">
                                <p className="text-xs font-semibold text-primary/70 uppercase tracking-widest">{side.label}</p>
                                {side.items.map((item, i) => {
                                  const col = NH_COLORS[item.element] ?? { stroke: "#888", fill: "#88888810", text: "text-gray-400" };
                                  return (
                                    <div key={i} className="flex items-center gap-2">
                                      <span className={`text-xs font-semibold w-8 ${col.text}`}>{item.element}</span>
                                      <div className="flex-1 h-1.5 rounded-full bg-background/40 overflow-hidden">
                                        <div className="h-full rounded-full transition-all" style={{ width: `${item.percentage}%`, background: col.stroke }} />
                                      </div>
                                      <span className="text-[11px] text-muted-foreground w-8 text-right">{item.percentage}%</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ))}
                          </div>

                          {/* Compatibility result */}
                          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6 text-center space-y-2">
                            <p className="text-xs uppercase tracking-widest text-muted-foreground">Luận hợp ngũ hành</p>
                            <p className={`text-3xl font-bold font-serif ${compat.color}`}>{compat.label}</p>
                            <p className="text-sm text-foreground/70 max-w-md mx-auto leading-relaxed">{compat.desc}</p>
                          </div>
                        </div>
                      );
                    })()}
                  </CardContent>
                )}
              </Card>

              {/* Đại Vận section */}
              {daiVan && (
                <Card className="bg-card/40 backdrop-blur-sm border-primary/20 shadow-xl shadow-primary/5">
                  <CardHeader>
                    <CardTitle className="text-2xl text-primary">Đại Vận (8 vận 10 năm)</CardTitle>
                    <CardDescription>{daiVan.note}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {daiVan.pillars.slice(0, 8).map((pillar) => (
                        <div key={pillar.index} className={cn("rounded-xl border p-3 text-center space-y-2 transition-all",
                          pillar.quality === "Rất Tốt" ? "border-yellow-500/40 bg-yellow-500/8" :
                          pillar.quality === "Tốt" ? "border-green-500/40 bg-green-500/8" :
                          pillar.quality === "Trung Bình" ? "border-amber-500/30 bg-amber-500/5" :
                          "border-red-500/30 bg-red-500/5")}>
                          <div className="text-xs text-muted-foreground font-medium">Tuổi {pillar.startAge}–{pillar.endAge}</div>
                          <div className="text-xl font-bold font-serif text-foreground/90">{pillar.thienCan}</div>
                          <div className="text-xl font-bold font-serif text-foreground/90">{pillar.diaChi}</div>
                          <div className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block", pillar.qualityColor)}>{pillar.quality}</div>
                          <div className="text-[10px] text-muted-foreground leading-relaxed">{pillar.nguHanh}</div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 space-y-2">
                      {daiVan.pillars.slice(0, 4).map((pillar) => (
                        <div key={pillar.index} className="text-xs text-muted-foreground leading-relaxed border-l-2 border-primary/20 pl-3">
                          <span className="font-medium text-foreground/70">Tuổi {pillar.startAge}–{pillar.endAge} ({pillar.thienCan} {pillar.diaChi}):</span> {pillar.desc}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card className="bg-card/40 backdrop-blur-sm border-primary/20 shadow-xl shadow-primary/5 mt-8">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary flex items-center justify-between flex-wrap gap-3">
                    <span>Hỏi AI về lá số của bạn</span>
                    <Button onClick={handleAskAI} disabled={isStreaming} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                      {isStreaming ? "Đang lắng nghe vũ trụ..." : "Luận giải lá số"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {messages.filter((m) => m.role === "assistant").map((msg, i) => (
                    <div key={i} className="px-5 py-4 rounded-lg bg-background/40 border border-primary/15 shadow-inner">
                      {msg.content ? <MarkdownRenderer content={msg.content} /> : (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          {[0, 150, 300].map((d) => <span key={d} className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                        </div>
                      )}
                    </div>
                  ))}
                  {!messages.some((m) => m.role === "assistant") && !isStreaming && (
                    <p className="text-sm text-muted-foreground text-center italic py-8">Nhấn nút bên trên để AI phân tích chuyên sâu về bát tự của bạn.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <BatuKnowledge />
        </div>
      </main>
    </div>
  );
}
