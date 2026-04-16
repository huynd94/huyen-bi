import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { useAutoHistory } from "@/lib/use-auto-history";
import { SaveReadingBtn } from "@/components/save-reading-btn";
import { popReopenData } from "@/lib/reopen-reading";
import { PhongThuyKnowledge } from "@/components/knowledge-base";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getGuaInfo, COMPASS_POSITIONS, type GuaInfo, type DirectionInfo } from "@/lib/phong-thuy";
import { useAISSEChat } from "@/hooks/use-ai-sse-chat";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

const ELEMENT_COLOR: Record<string, string> = {
  Thuỷ: "text-blue-400",
  Mộc: "text-green-400",
  Hoả: "text-red-400",
  Kim: "text-yellow-300",
  Thổ: "text-amber-600",
};

const QUALITY_COLOR: Record<string, { bg: string; border: string; dot: string }> = {
  auspicious: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", dot: "bg-yellow-400" },
  inauspicious: { bg: "bg-red-500/10", border: "border-red-500/30", dot: "bg-red-400" },
};

function CompassSVG({ guaInfo }: { guaInfo: GuaInfo }) {
  const auspicious = guaInfo.directions.filter(d => d.quality === "auspicious");
  const inauspicious = guaInfo.directions.filter(d => d.quality === "inauspicious");

  const getColor = (dir: DirectionInfo) => {
    if (dir.quality === "auspicious") {
      if (dir.level === 1) return "#fbbf24";
      if (dir.level === 2) return "#4ade80";
      if (dir.level === 3) return "#60a5fa";
      return "#c084fc";
    } else {
      if (dir.level === 4) return "#ef4444";
      if (dir.level === 3) return "#f97316";
      if (dir.level === 2) return "#fb923c";
      return "#fcd34d";
    }
  };

  const allDirs = [...auspicious, ...inauspicious];

  return (
    <div className="relative w-72 h-72 mx-auto my-6">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(255,215,0,0.15)" strokeWidth="0.5"/>
        <circle cx="50" cy="50" r="36" fill="none" stroke="rgba(255,215,0,0.1)" strokeWidth="0.5"/>
        <circle cx="50" cy="50" r="24" fill="none" stroke="rgba(255,215,0,0.1)" strokeWidth="0.5"/>
        <line x1="50" y1="2" x2="50" y2="98" stroke="rgba(255,215,0,0.08)" strokeWidth="0.5"/>
        <line x1="2" y1="50" x2="98" y2="50" stroke="rgba(255,215,0,0.08)" strokeWidth="0.5"/>
        <line x1="15" y1="15" x2="85" y2="85" stroke="rgba(255,215,0,0.08)" strokeWidth="0.5"/>
        <line x1="85" y1="15" x2="15" y2="85" stroke="rgba(255,215,0,0.08)" strokeWidth="0.5"/>

        {allDirs.map((dir, i) => {
          const pos = COMPASS_POSITIONS[dir.directionEn];
          if (!pos) return null;
          const color = getColor(dir);
          const angle = (pos.angle * Math.PI) / 180;
          const r1 = 12, r2 = 42;
          const x1 = 50 + r1 * Math.sin(angle);
          const y1 = 50 - r1 * Math.cos(angle);
          const x2 = 50 + r2 * Math.sin(angle);
          const y2 = 50 - r2 * Math.cos(angle);
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2" strokeOpacity="0.6" strokeLinecap="round"/>
              <circle cx={x2} cy={y2} r="2.5" fill={color} opacity="0.9"/>
            </g>
          );
        })}

        <circle cx="50" cy="50" r="10" fill="rgba(10,5,30,0.9)" stroke="rgba(255,215,0,0.4)" strokeWidth="0.8"/>
        <text x="50" y="53.5" textAnchor="middle" fontSize="6" fill="rgba(255,215,0,0.9)" fontWeight="bold">命</text>

        {Object.entries(COMPASS_POSITIONS).map(([dir, pos]) => (
          <text key={dir} x={pos.x} y={pos.y + 1.5} textAnchor="middle" fontSize="4.5" fill="rgba(255,255,255,0.4)">{
            { N: "B", S: "N", E: "Đ", W: "T", NE: "ĐB", NW: "TB", SE: "ĐN", SW: "TN" }[dir]
          }</text>
        ))}
      </svg>
    </div>
  );
}

export default function PhongThuyPage() {
  const [yearInput, setYearInput] = useState("");
  const [gender, setGender] = useState<"nam" | "nu">("nam");
  const [result, setResult] = useState<GuaInfo | null>(null);
  const [error, setError] = useState("");
  const { messages, streamResponse, isStreaming } = useAISSEChat();

  const phongThuyEntry = result ? {
    module: "phong-thuy",
    moduleName: "Phong Thuỷ Hướng Nhà",
    title: `Phong Thuỷ — Năm ${yearInput} — ${gender === "nam" ? "Nam" : "Nữ"}`,
    summary: `Mệnh Quái: ${result.gua} ${result.guaName}. Ngũ hành ${result.element}. ${result.group === "east" ? "Đông Tứ Mệnh" : "Tây Tứ Mệnh"}.`,
    result: `Mệnh Quái: ${result.gua} — ${result.guaName}\nNgũ hành: ${result.element}\nNhóm: ${result.group === "east" ? "Đông Tứ Mệnh" : "Tây Tứ Mệnh"}\nHướng tốt: ${result.directions.filter(d => d.quality === "auspicious").map(d => `${d.direction} (${d.name})`).join(", ")}\nHướng xấu: ${result.directions.filter(d => d.quality === "inauspicious").map(d => `${d.direction} (${d.name})`).join(", ")}`,
  } : null;
  useAutoHistory(phongThuyEntry);

  useEffect(() => {
    const d = popReopenData("phong-thuy");
    if (d) {
      if (d.namSinh) setYearInput(String(d.namSinh));
      if (d.gioiTinh) setGender(d.gioiTinh as "nam" | "nu");
    }
  }, []);

  const handleCalculate = () => {
    const y = parseInt(yearInput);
    if (!y || y < 1900 || y > new Date().getFullYear()) {
      setError("Vui lòng nhập năm sinh hợp lệ (1900 đến nay).");
      return;
    }
    setError("");
    setResult(getGuaInfo(y, gender));
  };

  const handleAskAI = () => {
    if (!result) return;
    const auspicious = result.directions.filter(d => d.quality === "auspicious").map(d => `${d.name}: hướng ${d.direction}`).join(", ");
    const inauspicious = result.directions.filter(d => d.quality === "inauspicious").map(d => `${d.name}: hướng ${d.direction}`).join(", ");
    const context = `Người này sinh năm ${yearInput}, giới tính ${gender}. Mệnh Quái: ${result.gua} — ${result.guaName}, ngũ hành ${result.element}, thuộc nhóm ${result.group === "east" ? "Đông Tứ Mệnh" : "Tây Tứ Mệnh"}.\nHướng tốt: ${auspicious}.\nHướng xấu: ${inauspicious}.\nHãy phân tích phong thủy Bát Trạch cho người này, bao gồm cách bố trí phòng ngủ, bàn làm việc, bếp nấu theo các hướng tốt nhất.`;
    streamResponse("/api/mysticism/ai-interpret", { type: "phong-thuy", context });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-24 pb-16 z-10 relative">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <p className="text-xs tracking-[0.3em] uppercase text-primary/60">Huyền học phương Đông</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground drop-shadow-md">Phong Thuỷ Hướng Nhà</h1>
            <p className="text-muted-foreground text-lg">Xác định hướng tốt xấu theo Bát Trạch Phong Thuỷ dựa trên năm sinh.</p>
          </div>

          <Card className="bg-card/40 backdrop-blur-sm border-primary/20 shadow-xl shadow-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Tính Mệnh Quái</CardTitle>
              <CardDescription>Nhập năm sinh và giới tính để tìm Mệnh Quái và các hướng tốt xấu.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                      <svg className="w-4 h-4 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={1.8}/><line x1="16" y1="2" x2="16" y2="6" strokeWidth={1.8}/><line x1="8" y1="2" x2="8" y2="6" strokeWidth={1.8}/><line x1="3" y1="10" x2="21" y2="10" strokeWidth={1.8}/></svg>
                      Năm sinh (dương lịch)
                    </Label>
                    <div className="relative">
                      <input
                        type="number"
                        value={yearInput}
                        onChange={(e) => setYearInput(e.target.value)}
                        placeholder="Ví dụ: 1990"
                        min={1900}
                        max={new Date().getFullYear()}
                        className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 pl-10 text-sm transition-all duration-200 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                      />
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={1.8}/><line x1="16" y1="2" x2="16" y2="6" strokeWidth={1.8}/><line x1="8" y1="2" x2="8" y2="6" strokeWidth={1.8}/><line x1="3" y1="10" x2="21" y2="10" strokeWidth={1.8}/></svg>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                      <svg className="w-4 h-4 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>
                      Giới tính
                    </Label>
                    <div className="flex gap-3">
                      {[{ v: "nam", l: "♂ Nam" }, { v: "nu", l: "♀ Nữ" }].map(g => (
                        <button key={g.v} type="button" onClick={() => setGender(g.v as "nam" | "nu")}
                          className={cn("flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200",
                            gender === g.v ? "border-primary bg-primary/20 text-primary" : "border-border/50 text-muted-foreground hover:border-primary/30"
                          )}>
                          {g.l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {error && <p className="text-sm text-red-400">{error}</p>}
                <Button onClick={handleCalculate} disabled={!yearInput} className="w-full bg-primary text-primary-foreground font-semibold tracking-wider disabled:opacity-40">
                  TÍNH MỆNH QUÁI
                </Button>
              </div>
            </CardContent>
          </Card>

          {result && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex justify-end">
                <SaveReadingBtn
                  module="phong-thuy"
                  title={`Phong Thuỷ — Năm ${yearInput} — ${gender === "nam" ? "Nam" : "Nữ"}`}
                  inputData={{ namSinh: yearInput, gioiTinh: gender }}
                  resultData={{ guaName: result.guaName, gua: result.gua, element: result.element, group: result.group }}
                />
              </div>
              {/* Quái info */}
              <Card className="bg-card/40 backdrop-blur-sm border-primary/30 shadow-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                <CardHeader className="text-center">
                  <p className="text-xs tracking-widest uppercase text-primary/50">Mệnh Quái của bạn</p>
                  <CardTitle className="text-4xl text-primary">{result.guaName}</CardTitle>
                  <CardDescription className="text-base">
                    Ngũ hành: <span className={cn("font-semibold", ELEMENT_COLOR[result.element])}>{result.element}</span>
                    {" · "}
                    {result.group === "east" ? "Đông Tứ Mệnh" : "Tây Tứ Mệnh"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CompassSVG guaInfo={result} />
                  <div className="flex justify-center gap-6 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-yellow-400 inline-block"/><span>Sinh Khí</span></span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block"/><span>Thiên Y</span></span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block"/><span>Diên Niên</span></span>
                    <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"/><span>Tuyệt Mệnh</span></span>
                  </div>
                </CardContent>
              </Card>

              {/* Directions table */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-primary/80 uppercase tracking-widest pl-1">Hướng Tốt (Tứ Cát)</h3>
                  {result.directions.filter(d => d.quality === "auspicious").map((d, i) => (
                    <div key={i} className={cn("rounded-xl border p-4 space-y-1", QUALITY_COLOR.auspicious.bg, QUALITY_COLOR.auspicious.border)}>
                      <div className="flex items-center justify-between">
                        <span className={cn("font-bold text-base", d.color)}>{d.name}</span>
                        <span className="text-sm font-semibold text-foreground/70 bg-background/30 px-2.5 py-0.5 rounded-full">{d.direction}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{d.nameDesc}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-red-400/80 uppercase tracking-widest pl-1">Hướng Xấu (Tứ Hung)</h3>
                  {result.directions.filter(d => d.quality === "inauspicious").map((d, i) => (
                    <div key={i} className={cn("rounded-xl border p-4 space-y-1", QUALITY_COLOR.inauspicious.bg, QUALITY_COLOR.inauspicious.border)}>
                      <div className="flex items-center justify-between">
                        <span className={cn("font-bold text-base", d.color)}>{d.name}</span>
                        <span className="text-sm font-semibold text-foreground/70 bg-background/30 px-2.5 py-0.5 rounded-full">{d.direction}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{d.nameDesc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI */}
              <Card className="bg-card/40 backdrop-blur-sm border-primary/20 shadow-xl shadow-primary/5">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary flex items-center justify-between flex-wrap gap-3">
                    <span>Tư vấn bố trí nhà cửa từ AI</span>
                    <Button onClick={handleAskAI} disabled={isStreaming} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                      {isStreaming ? "Đang phân tích..." : "Nhận tư vấn"}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {messages.filter(m => m.role === "assistant").map((msg, i) => (
                    <div key={i} className="px-5 py-4 rounded-lg bg-background/40 border border-primary/15 shadow-inner">
                      {msg.content ? <MarkdownRenderer content={msg.content} /> : (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          {[0, 150, 300].map(d => <span key={d} className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }}/>)}
                        </div>
                      )}
                    </div>
                  ))}
                  {!messages.some(m => m.role === "assistant") && !isStreaming && (
                    <p className="text-sm text-muted-foreground text-center italic py-8">Nhấn nút bên trên để AI tư vấn cách bố trí nhà cửa theo hướng mệnh quái của bạn.</p>
                  )}
                </CardContent>
              </Card>

              {/* Tips */}
              <Card className="bg-card/40 backdrop-blur-sm border-primary/20">
                <CardHeader><CardTitle className="text-xl text-primary">Gợi ý áp dụng</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { icon: "🛏", title: "Phòng ngủ", desc: `Đặt đầu giường hướng về ${result.directions[0]?.direction} (${result.directions[0]?.name}) để tăng cường sinh khí và sức khoẻ.` },
                    { icon: "💼", title: "Bàn làm việc", desc: `Ngồi làm việc hướng về ${result.directions[1]?.direction} (${result.directions[1]?.name}) để thu hút may mắn sự nghiệp.` },
                    { icon: "🔥", title: "Bếp nấu", desc: `Tránh bố trí bếp ở hướng ${result.directions.filter(d => d.quality === "inauspicious")[0]?.direction} để không phạm vào ${result.directions.filter(d => d.quality === "inauspicious")[0]?.name}.` },
                    { icon: "🚪", title: "Cửa chính", desc: `Cửa vào nhà hướng ${result.directions[0]?.direction} hoặc ${result.directions[1]?.direction} là tốt nhất cho người thuộc ${result.group === "east" ? "Đông Tứ Mệnh" : "Tây Tứ Mệnh"}.` },
                  ].map((tip, i) => (
                    <div key={i} className="flex gap-3 p-3 rounded-lg bg-background/30 border border-border/30">
                      <span className="text-2xl">{tip.icon}</span>
                      <div><p className="text-sm font-semibold text-foreground/80">{tip.title}</p><p className="text-xs text-muted-foreground mt-0.5">{tip.desc}</p></div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
          <PhongThuyKnowledge />
        </div>
      </main>
    </div>
  );
}
