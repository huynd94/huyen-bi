import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { useAutoHistory } from "@/lib/use-auto-history";
import { SaveReadingBtn } from "@/components/save-reading-btn";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Sparkles } from "lucide-react";
import { Hexagram, castReading, type CastResult, type CastLine } from "@workspace/mysticism-core";
import { useAISSEChat } from "@/hooks/use-ai-sse-chat";
import { useExportImage } from "@/hooks/use-export-image";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { IChingKnowledge } from "@/components/knowledge-base";
import { IChingExportCard } from "@/components/export-card-ichinq";
import { ExportDownloadBar } from "@/components/export-download-bar";
import { cn } from "@/lib/utils";

function HexagramLines({ lines, moving }: { lines: ('yin' | 'yang')[]; moving?: number[] }) {
  const movingSet = new Set(moving ?? []);
  return (
    <div className="flex flex-col-reverse gap-1.5 items-center">
      {lines.map((line, i) => {
        const isMoving = movingSet.has(i + 1);
        return (
          <div key={i} className="flex gap-2 items-center h-3 relative">
            {line === "yang" ? (
              <div className={cn("w-16 h-2.5 rounded-sm shadow-sm", isMoving ? "bg-amber-400 shadow-amber-400/50 ring-1 ring-amber-300" : "bg-primary/80 shadow-primary/30")} />
            ) : (
              <>
                <div className={cn("w-6 h-2.5 rounded-sm shadow-sm", isMoving ? "bg-amber-400 shadow-amber-400/50 ring-1 ring-amber-300" : "bg-primary/80 shadow-primary/30")} />
                <div className="w-2 h-2.5" />
                <div className={cn("w-6 h-2.5 rounded-sm shadow-sm", isMoving ? "bg-amber-400 shadow-amber-400/50 ring-1 ring-amber-300" : "bg-primary/80 shadow-primary/30")} />
              </>
            )}
            {isMoving && <span className="absolute -right-3 text-amber-400 text-[10px]">✕</span>}
          </div>
        );
      })}
    </div>
  );
}

interface HistoryItem {
  cast: CastResult;
  timestamp: Date;
}

export default function IChingPage() {
  const [cast, setCast] = useState<CastResult | null>(null);
  const [isCasting, setIsCasting] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const { messages, streamResponse, isStreaming, setMessages } = useAISSEChat();
  const { exportRef, downloadAsImage, downloadAsText, downloadAsPdf, isExporting, isPdfExporting } = useExportImage();

  const hexagram: Hexagram | null = cast?.primary ?? null;

  const handleCast = () => {
    setIsCasting(true);
    setCast(null);
    setMessages([]);
    setTimeout(() => {
      const c = castReading();
      setCast(c);
      setHistory(prev => [{ cast: c, timestamp: new Date() }, ...prev.slice(0, 9)]);
      setIsCasting(false);
    }, 2000);
  };

  const handleSelectHistory = (item: HistoryItem) => {
    setCast(item.cast);
    setMessages([]);
    setShowHistory(false);
  };

  const handleAskAI = () => {
    if (!cast) return;
    const { primary, transformed, movingLineNumbers } = cast;
    const movingPart = movingLineNumbers.length
      ? ` Có ${movingLineNumbers.length} hào động (hào ${movingLineNumbers.join(", ")}), quẻ biến thành ${transformed?.vietnameseName} (${transformed?.name}): ${transformed?.description}`
      : " Quẻ tĩnh, không có hào động.";
    const context = `Người này vừa gieo được quẻ chính: ${primary.name} (${primary.vietnameseName}). Mô tả: ${primary.description}. Ý nghĩa: ${primary.meaning}.${movingPart}`;
    streamResponse("/api/mysticism/ai-interpret", { type: "iching", context });
  };

  const aiText = messages.filter((m) => m.role === "assistant").map((m) => m.content).join("");

  const buildTextContent = () => {
    if (!cast) return "";
    const { primary, transformed, movingLineNumbers } = cast;
    return [
      `QUẺ CHÍNH: ${primary.symbol} ${primary.vietnameseName} (${primary.name})`,
      "",
      `MÔ TẢ: "${primary.description}"`,
      "",
      `Ý NGHĨA:\n${primary.meaning}`,
      movingLineNumbers.length
        ? `\nHÀO ĐỘNG: hào ${movingLineNumbers.join(", ")}\nQUẺ BIẾN: ${transformed?.symbol} ${transformed?.vietnameseName} (${transformed?.name})\n${transformed?.description}`
        : "\nQuẻ tĩnh — không có hào động.",
      aiText ? `\nLUẬN GIẢI AI:\n${aiText}` : "",
    ].join("\n");
  };

  useAutoHistory(cast ? {
    module: "xem-que",
    moduleName: "Kinh Dịch — Xem Quẻ",
    title: `Xem Quẻ — ${cast.primary.symbol} ${cast.primary.vietnameseName}`,
    summary: `Quẻ ${cast.primary.vietnameseName}: ${cast.primary.description.slice(0, 100)}`,
    result: buildTextContent() || `QUẺ: ${cast.primary.symbol} ${cast.primary.vietnameseName}\n${cast.primary.meaning}`,
  } : null);

  const formatTime = (d: Date) =>
    `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <Navbar />

      {/* Hidden export card */}
      <div style={{ position: "absolute", left: -9999, top: 0, pointerEvents: "none", zIndex: -1 }}>
        {hexagram && (
          <IChingExportCard
            ref={exportRef}
            hexagram={hexagram}
            aiText={aiText || undefined}
          />
        )}
      </div>

      <main id="main" tabIndex={-1} className="flex-1 container mx-auto px-4 pt-24 pb-16 z-10 relative outline-none">
        <div className="max-w-4xl mx-auto space-y-12">
          <Breadcrumb />
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground drop-shadow-md">Kinh Dịch</h1>
            <p className="text-muted-foreground text-lg">Tập trung ý niệm, thành tâm xin quẻ chỉ đường.</p>
          </div>

          <div className="flex flex-col items-center justify-center py-12">
            {/* History button */}
            {history.length > 0 && !hexagram && (
              <div className="mb-6 w-full max-w-sm">
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-primary/20 bg-card/30 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Lịch sử ({history.length} quẻ)
                  </span>
                  <svg className={cn("w-4 h-4 transition-transform", showHistory && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                </button>

                {showHistory && (
                  <div className="mt-2 rounded-xl border border-primary/20 bg-card/40 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {history.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => handleSelectHistory(item)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-primary/10 transition-colors text-left border-b border-border/20 last:border-0"
                      >
                        <span className="text-2xl shrink-0 text-primary/70">{item.cast.primary.symbol}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground/80 truncate">{item.cast.primary.vietnameseName}</p>
                          <p className="text-xs text-muted-foreground">{formatTime(item.timestamp)}</p>
                        </div>
                        <HexagramLines lines={item.cast.primary.lines} moving={item.cast.movingLineNumbers} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!hexagram && (
              <Button
                onClick={handleCast}
                disabled={isCasting}
                className={`w-48 h-48 rounded-full bg-primary/20 hover:bg-primary/30 border-2 border-primary text-primary transition-all duration-500 flex flex-col items-center justify-center gap-4 ${isCasting ? "animate-pulse scale-110 shadow-[0_0_60px_rgba(255,215,0,0.4)]" : "shadow-[0_0_30px_rgba(255,215,0,0.1)] hover:shadow-[0_0_40px_rgba(255,215,0,0.3)] hover:scale-105"}`}
              >
                {isCasting ? (
                  <span className="text-xl font-serif tracking-widest animate-bounce">ĐANG GIEO...</span>
                ) : (
                  <span className="text-2xl font-serif tracking-widest">GIEO QUẺ</span>
                )}
              </Button>
            )}

            {hexagram && !isCasting && (
              <div className="w-full animate-in fade-in zoom-in duration-1000 space-y-6">
                <div className="flex justify-end">
                  <SaveReadingBtn
                    module="xem-que"
                    title={`Xem Quẻ — ${hexagram.symbol} ${hexagram.vietnameseName}`}
                    inputData={{}}
                    resultData={{ queNumber: hexagram.index, queName: hexagram.name, symbol: hexagram.symbol }}
                  />
                </div>
                {/* Export bar */}
                <ExportDownloadBar
                  onDownloadImage={() => downloadAsImage(`que-${hexagram.name.toLowerCase().replace(/\s+/g, "-")}`)}
                  onDownloadText={() => downloadAsText(buildTextContent(), `que-${hexagram.name.toLowerCase().replace(/\s+/g, "-")}`)}
                  onDownloadPdf={() => downloadAsPdf(`que-${hexagram.name.toLowerCase().replace(/\s+/g, "-")}`)}
                  isExporting={isExporting}
                  isPdfExporting={isPdfExporting}
                />

                <Card className="bg-card/40 backdrop-blur-sm border-primary/40 shadow-md shadow-primary/10 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
                  <CardHeader className="text-center pb-0">
                    {/* SVG Hexagram lines */}
                    <div className="flex justify-center mb-4">
                      <div className="p-6 rounded-2xl bg-background/30 border border-primary/20">
                        <HexagramLines lines={hexagram.lines} moving={cast?.movingLineNumbers} />
                      </div>
                    </div>
                    <div className="text-[6rem] leading-none font-sans text-primary opacity-80 mb-[-1rem]">{hexagram.symbol}</div>
                    <CardTitle className="text-4xl text-primary font-serif mb-2">{hexagram.vietnameseName}</CardTitle>
                    <CardDescription className="text-xl text-foreground/80">{hexagram.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-6 pt-8 pb-12 px-8 max-w-2xl mx-auto">
                    <p className="text-xl font-medium text-foreground italic">"{hexagram.description}"</p>
                    <p className="text-base text-muted-foreground leading-relaxed">{hexagram.meaning}</p>
                    {cast && cast.movingLineNumbers.length > 0 && (
                      <p className="text-sm text-amber-400/90">
                        Hào động: hào {cast.movingLineNumbers.join(", ")} — quẻ đang chuyển hóa.
                      </p>
                    )}
                    <div className="pt-8 flex justify-center gap-3">
                      <Button onClick={handleCast} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                        Gieo quẻ khác
                      </Button>
                      {history.length > 1 && (
                        <Button onClick={() => { setCast(null); setShowHistory(true); }} variant="ghost" className="text-muted-foreground hover:text-foreground">
                          Xem lịch sử
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Transformed hexagram (quẻ biến) */}
                {cast && cast.transformed && (
                  <Card className="bg-card/30 backdrop-blur-sm border-amber-400/30 shadow-md relative overflow-hidden">
                    <CardHeader className="text-center pb-0">
                      <div className="text-xs uppercase tracking-[0.25em] text-amber-400/80 font-semibold mb-3">
                        Quẻ Biến — sau khi hào động chuyển hóa
                      </div>
                      <div className="flex justify-center mb-4">
                        <div className="p-6 rounded-2xl bg-background/30 border border-amber-400/20">
                          <HexagramLines lines={cast.transformed.lines} />
                        </div>
                      </div>
                      <div className="text-[4rem] leading-none font-sans text-amber-400 opacity-80 mb-[-0.5rem]">{cast.transformed.symbol}</div>
                      <CardTitle className="text-2xl text-amber-300 font-serif mb-1">{cast.transformed.vietnameseName}</CardTitle>
                      <CardDescription className="text-base text-foreground/70">{cast.transformed.name}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-3 pt-6 pb-8 px-8 max-w-2xl mx-auto">
                      <p className="text-base font-medium text-foreground/90 italic">"{cast.transformed.description}"</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{cast.transformed.meaning}</p>
                      <p className="text-xs text-muted-foreground/70 pt-2">
                        Quẻ chính cho biết tình thế hiện tại; quẻ biến gợi ý xu hướng phát triển khi sự việc chuyển động.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* History strip */}
                {history.length > 1 && (
                  <Card className="bg-card/40 backdrop-blur-sm border-primary/20">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-muted-foreground">Quẻ đã gieo trong phiên này</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {history.map((item, i) => (
                          <button
                            key={i}
                            onClick={() => handleSelectHistory(item)}
                            className={cn(
                              "shrink-0 flex flex-col items-center gap-1 p-3 rounded-xl border transition-all",
                              i === 0 ? "border-primary/50 bg-primary/10" : "border-border/30 bg-background/30 hover:border-primary/30"
                            )}
                          >
                            <span className="text-3xl leading-none text-primary/70">{item.cast.primary.symbol}</span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatTime(item.timestamp)}</span>
                            <HexagramLines lines={item.cast.primary.lines} moving={item.cast.movingLineNumbers} />
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-card/40 backdrop-blur-sm border-primary/20 shadow-md shadow-primary/5 mt-8">
                  <CardHeader>
                    <CardTitle className="text-2xl text-primary flex items-center justify-between flex-wrap gap-3">
                      <span>Hỏi AI về quẻ này</span>
                      <Button onClick={handleAskAI} disabled={isStreaming} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
                        {isStreaming ? "Đang lắng nghe vũ trụ..." : "Luận giải chi tiết"}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {messages.filter((m) => m.role === "assistant").map((msg, i) => (
                      <div key={i} className="px-5 py-4 rounded-lg bg-background/40 border border-primary/15 shadow-sm">
                        {msg.content ? (
                          <MarkdownRenderer content={msg.content} />
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            {[0, 150, 300].map((d) => (
                              <span key={d} className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${d}ms` }} />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {!messages.some((m) => m.role === "assistant") && !isStreaming && (
                      <EmptyState
                        icon={<Sparkles aria-hidden="true" />}
                        title="Chưa có luận giải AI"
                        description="Nhấn nút bên trên để AI luận giải thông điệp ẩn giấu trong quẻ Dịch."
                      />
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          <IChingKnowledge />
        </div>
      </main>

      <Footer />
    </div>
  );
}
