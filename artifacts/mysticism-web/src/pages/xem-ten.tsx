import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { useAutoHistory } from "@/lib/use-auto-history";
import { SaveReadingBtn } from "@/components/save-reading-btn";
import { popReopenData } from "@/lib/reopen-reading";
import { XemTenKnowledge } from "@/components/knowledge-base";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { analyzeName, getGridMeaning, scoreFullName, type NameGrid } from "@/lib/xem-ten";
import { useAISSEChat } from "@/hooks/use-ai-sse-chat";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

const GRID_LABELS: { key: keyof NameGrid & string; label: string; desc: string; color: string }[] = [
  { key: "thienCach", label: "Thiên Cách", desc: "Số của họ — đại diện cho tổ tiên và số phận trời định", color: "text-yellow-400" },
  { key: "diaCach", label: "Địa Cách", desc: "Số của tên — đại diện cho sự nghiệp và cuộc sống", color: "text-green-400" },
  { key: "nhanCach", label: "Nhân Cách", desc: "Số trung tâm — thể hiện bản chất và cốt lõi con người", color: "text-primary" },
  { key: "ngoaiCach", label: "Ngoại Cách", desc: "Số ngoại vi — ảnh hưởng từ bên ngoài và xã hội", color: "text-blue-400" },
  { key: "tongCach", label: "Tổng Cách", desc: "Tổng số toàn tên — vận mệnh tổng thể của cả cuộc đời", color: "text-purple-400" },
];

function RadarChart({ values }: { values: number[] }) {
  const size = 120;
  const cx = size / 2, cy = size / 2;
  const r = size * 0.42;
  const n = values.length;
  const maxVal = 33;

  const points = values.map((v, i) => {
    const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
    const ratio = Math.min(v, 9) / 9;
    return { x: cx + r * ratio * Math.cos(angle), y: cy + r * ratio * Math.sin(angle) };
  });

  const polygon = points.map(p => `${p.x},${p.y}`).join(" ");

  const gridPoints = (ratio: number) =>
    Array.from({ length: n }, (_, i) => {
      const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
      return `${cx + r * ratio * Math.cos(angle)},${cy + r * ratio * Math.sin(angle)}`;
    }).join(" ");

  const colors = ["text-yellow-400", "text-green-400", "text-primary", "text-blue-400", "text-purple-400"];
  const labels = ["Thiên", "Địa", "Nhân", "Ngoại", "Tổng"];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[200px] mx-auto">
      {[0.25, 0.5, 0.75, 1].map((r2, i) => (
        <polygon key={i} points={gridPoints(r2)} fill="none" stroke="rgba(255,215,0,0.08)" strokeWidth="0.5"/>
      ))}
      {Array.from({ length: n }, (_, i) => {
        const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="rgba(255,215,0,0.1)" strokeWidth="0.5"/>;
      })}
      <polygon points={polygon} fill="rgba(255,215,0,0.15)" stroke="rgba(255,215,0,0.7)" strokeWidth="1.2" strokeLinejoin="round"/>
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#ffd700" opacity="0.9"/>
      ))}
      {Array.from({ length: n }, (_, i) => {
        const angle = (i * 2 * Math.PI) / n - Math.PI / 2;
        const lx = cx + (r + 10) * Math.cos(angle);
        const ly = cy + (r + 10) * Math.sin(angle);
        return (
          <text key={i} x={lx} y={ly + 1.5} textAnchor="middle" fontSize="5" fill="rgba(255,255,255,0.5)">{labels[i]}</text>
        );
      })}
    </svg>
  );
}

export default function XemTenPage() {
  const [fullName, setFullName] = useState("");
  const [grid, setGrid] = useState<NameGrid | null>(null);
  const { messages, streamResponse, isStreaming } = useAISSEChat();

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setGrid(analyzeName(fullName.trim()));
  };

  const handleAskAI = () => {
    if (!grid) return;
    const context = `Phân tích tên: "${fullName}". Thiên Cách: ${grid.thienCach}, Địa Cách: ${grid.diaCach}, Nhân Cách: ${grid.nhanCach}, Ngoại Cách: ${grid.ngoaiCach}, Tổng Cách: ${grid.tongCach}. Số Linh Hồn: ${grid.soLinhHon}, Số Sứ Mệnh: ${grid.soSuMenh}, Số Nhân Cách: ${grid.soNhanCach}. Hãy phân tích ý nghĩa huyền học của cái tên này theo hệ thống Ngũ Cách và thần số học Pythagore.`;
    streamResponse("/api/mysticism/ai-interpret", { type: "xem-ten", context });
  };

  const score = grid ? scoreFullName(grid) : null;
  const radarValues = grid ? [grid.thienCach, grid.diaCach, grid.nhanCach, grid.ngoaiCach, grid.tongCach] : [];

  useAutoHistory(grid ? {
    module: "xem-ten",
    moduleName: "Xem Tên",
    title: `Xem Tên — ${fullName}`,
    summary: `${fullName}: Nhân Cách ${grid.nhanCach}, Tổng Cách ${grid.tongCach}. ${score?.label || ""}`,
    result: `Tên: ${fullName}\nThiên Cách: ${grid.thienCach}\nĐịa Cách: ${grid.diaCach}\nNhân Cách: ${grid.nhanCach}\nNgoại Cách: ${grid.ngoaiCach}\nTổng Cách: ${grid.tongCach}\nSố Linh Hồn: ${grid.soLinhHon}\nSố Sứ Mệnh: ${grid.soSuMenh}`,
  } : null);

  useEffect(() => {
    const d = popReopenData("xem-ten");
    if (d?.hoTen) setFullName(String(d.hoTen));
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-24 pb-16 z-10 relative">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <p className="text-xs tracking-[0.3em] uppercase text-primary/60">Huyền học phương Đông</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground drop-shadow-md">Xem Tên</h1>
            <p className="text-muted-foreground text-lg">Phân tích ý nghĩa huyền số học ẩn chứa trong từng chữ của tên bạn.</p>
          </div>

          <Card className="bg-card/40 backdrop-blur-sm border-primary/20 shadow-xl shadow-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">Nhập họ và tên</CardTitle>
              <CardDescription>Nhập đầy đủ họ, tên đệm và tên để phân tích Ngũ Cách.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAnalyze} className="space-y-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                    <svg className="w-4 h-4 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    Họ và tên đầy đủ
                  </Label>
                  <div className="relative">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value.toUpperCase())}
                      placeholder="NGUYỄN VĂN AN"
                      className="flex h-11 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 pl-10 text-base uppercase tracking-wider transition-all duration-200 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 placeholder:normal-case placeholder:tracking-normal placeholder:text-muted-foreground/40"
                    />
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                  </div>
                  <p className="text-xs text-muted-foreground">Vd: NGUYỄN THỊ HƯƠNG — Họ + Tên đệm + Tên</p>
                </div>
                <Button type="submit" disabled={!fullName.trim()} className="w-full bg-primary text-primary-foreground font-semibold tracking-wider disabled:opacity-40">
                  PHÂN TÍCH TÊN
                </Button>
              </form>
            </CardContent>
          </Card>

          {grid && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex justify-end">
                <SaveReadingBtn
                  module="xem-ten"
                  title={`Xem Tên — ${fullName}`}
                  inputData={{ hoTen: fullName }}
                  resultData={{ nhanCach: grid.nhanCach, tongCach: grid.tongCach, soLinhHon: grid.soLinhHon, soSuMenh: grid.soSuMenh }}
                />
              </div>
              {/* Score + Radar */}
              <Card className="bg-card/40 backdrop-blur-sm border-primary/30 shadow-xl overflow-hidden">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-center gap-8">
                    <div className="flex-1 text-center sm:text-left space-y-2">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">Đánh giá tổng thể</p>
                      <p className={cn("text-3xl font-bold", score?.color)}>{score?.label}</p>
                      {grid.ho && <p className="text-sm text-muted-foreground">Họ: <span className="text-foreground/80 font-medium">{grid.ho}</span></p>}
                      {grid.tenDem && <p className="text-sm text-muted-foreground">Tên đệm: <span className="text-foreground/80 font-medium">{grid.tenDem}</span></p>}
                      {grid.ten && <p className="text-sm text-muted-foreground">Tên: <span className="text-foreground/80 font-medium">{grid.ten}</span></p>}
                    </div>
                    <div className="w-48 shrink-0">
                      <RadarChart values={radarValues} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Five grids */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {GRID_LABELS.map((g) => {
                  const val = grid[g.key as keyof NameGrid] as number;
                  const meaning = getGridMeaning(val);
                  return (
                    <Card key={g.key} className="bg-card/40 backdrop-blur-sm border-primary/20 group hover:border-primary/40 transition-all duration-300">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base text-muted-foreground">{g.label}</CardTitle>
                          <span className={cn("text-3xl font-bold", g.color)}>{val}</span>
                        </div>
                        <p className="text-xs text-muted-foreground/70">{g.desc}</p>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className={cn("text-sm font-semibold", g.color)}>{meaning.title}</p>
                        <p className="text-xs text-foreground/70 leading-relaxed">{meaning.desc}</p>
                        <div className="flex flex-wrap gap-1 pt-1">
                          {meaning.strengths.map((s, i) => (
                            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary/80 border border-primary/20">{s}</span>
                          ))}
                        </div>
                        <p className="text-[11px] text-orange-400/80 italic">⚠ {meaning.caution}</p>
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Classic numerology */}
                {[
                  { key: "soLinhHon", label: "Số Linh Hồn", desc: "Khao khát sâu thẳm bên trong tâm hồn", color: "text-pink-400" },
                  { key: "soSuMenh", label: "Số Sứ Mệnh", desc: "Sứ mệnh và mục đích cả cuộc đời", color: "text-amber-400" },
                  { key: "soNhanCach", label: "Số Nhân Cách", desc: "Cách người khác nhìn nhận về bạn", color: "text-cyan-400" },
                ].map((g) => {
                  const val = grid[g.key as keyof NameGrid] as number;
                  const meaning = getGridMeaning(val);
                  return (
                    <Card key={g.key} className="bg-card/40 backdrop-blur-sm border-primary/20 group hover:border-primary/40 transition-all duration-300">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base text-muted-foreground">{g.label}</CardTitle>
                          <span className={cn("text-3xl font-bold", g.color)}>{val}</span>
                        </div>
                        <p className="text-xs text-muted-foreground/70">{g.desc}</p>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className={cn("text-sm font-semibold", g.color)}>{meaning.title}</p>
                        <p className="text-xs text-foreground/70 leading-relaxed">{meaning.desc}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* AI */}
              <Card className="bg-card/40 backdrop-blur-sm border-primary/20 shadow-xl shadow-primary/5">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary flex items-center justify-between flex-wrap gap-3">
                    <span>Luận giải AI về tên của bạn</span>
                    <Button onClick={handleAskAI} disabled={isStreaming} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                      {isStreaming ? "Đang phân tích..." : "Luận giải chi tiết"}
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
                    <p className="text-sm text-muted-foreground text-center italic py-8">Nhấn nút để AI phân tích sâu hơn về ý nghĩa huyền học của tên bạn.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <XemTenKnowledge />
        </div>
      </main>
    </div>
  );
}
