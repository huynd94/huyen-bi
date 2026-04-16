import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { useAutoHistory } from "@/lib/use-auto-history";
import { SaveReadingBtn } from "@/components/save-reading-btn";
import { popReopenData } from "@/lib/reopen-reading";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatPhoneDisplay, dateInputToDisplay } from "@/lib/form-utils";
import {
  analyzeCatHung,
  analyzeFullPhone,
  extractLastSixDigits,
  extractAllPhoneDigits,
  validateLicensePlate,
  analyzeCompatibility,
  analyzeCompatibilityWithDOB,
  computeNameNumber,
  computePhoneEnergyNumber,
  computeLifePathFromDOB,
  LEVEL_CONFIG,
  type CatHungResult,
  type CompatibilityResult,
  type FullPhoneAnalysis,
} from "@/lib/cat-hung";
import { CatHungKnowledge } from "@/components/knowledge-base";
import { useAISSEChat } from "@/hooks/use-ai-sse-chat";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";

type PhoneMode = "6" | "10";

function VerdictBadge({ result, label: overrideLabel }: { result: CatHungResult; label?: string }) {
  const bgMap: Record<string, string> = {
    "dai-cat": "from-yellow-500/30 to-yellow-600/10 border-yellow-400/60",
    cat: "from-green-500/30 to-green-600/10 border-green-400/60",
    "binh-thuong": "from-blue-500/20 to-blue-600/10 border-blue-400/40",
    hung: "from-orange-500/30 to-orange-600/10 border-orange-400/60",
    "dai-hung": "from-red-600/30 to-red-700/10 border-red-500/60",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${bgMap[result.verdict]} p-6 text-center space-y-2`}>
      {overrideLabel && <p className="text-xs uppercase tracking-widest text-muted-foreground">{overrideLabel}</p>}
      {!overrideLabel && <p className="text-xs uppercase tracking-widest text-muted-foreground">Luận đoán cát hung</p>}
      <p className={`text-5xl font-serif font-bold ${result.verdictColor}`}>{result.verdictLabel}</p>
      <p className="text-sm text-foreground/70 mt-2 leading-relaxed max-w-sm mx-auto">{result.verdictDescription}</p>
      <p className="text-xs text-muted-foreground mt-1">Điểm tổng: {result.totalScore.toFixed(1)}</p>
    </div>
  );
}

function SmallVerdictCard({ result, title, numStr }: { result: CatHungResult; title: string; numStr: string }) {
  const bgMap: Record<string, string> = {
    "dai-cat": "border-yellow-400/40 bg-yellow-500/5",
    cat: "border-green-400/40 bg-green-500/5",
    "binh-thuong": "border-blue-400/30 bg-blue-500/5",
    hung: "border-orange-400/40 bg-orange-500/5",
    "dai-hung": "border-red-500/40 bg-red-500/5",
  };
  return (
    <div className={`rounded-xl border p-4 ${bgMap[result.verdict]}`}>
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{title}</p>
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm tracking-widest text-foreground/70">{numStr}</span>
        <span className={`text-lg font-serif font-bold ${result.verdictColor}`}>{result.verdictLabel}</span>
      </div>
      <p className="text-xs text-muted-foreground mt-1">Điểm: {result.totalScore.toFixed(1)}</p>
      {result.combinations.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {result.combinations.map((c, i) => {
            const cfg = LEVEL_CONFIG[c.level];
            return (
              <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                {c.pattern} {c.name}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CompatibilityPanel({
  compat,
  numStr,
  ownerLabel,
  ownerSubLabel,
}: {
  compat: CompatibilityResult;
  numStr: string;
  ownerLabel: string;
  ownerSubLabel: string;
}) {
  const bgMap: Record<CompatibilityResult["level"], string> = {
    perfect: "from-yellow-500/30 to-yellow-600/10 border-yellow-400/60",
    good: "from-green-500/30 to-green-600/10 border-green-400/60",
    neutral: "from-blue-500/20 to-blue-600/10 border-blue-400/40",
    clash: "from-red-600/30 to-red-700/10 border-red-500/60",
  };
  const symMap: Record<CompatibilityResult["level"], string> = {
    perfect: "=", good: "~", neutral: "?", clash: "✕",
  };
  const symColor: Record<CompatibilityResult["level"], string> = {
    perfect: "text-yellow-400", good: "text-green-400", neutral: "text-blue-400", clash: "text-red-400",
  };
  return (
    <div className={`rounded-2xl border bg-gradient-to-br ${bgMap[compat.level]} p-5 space-y-4`}>
      <p className="text-xs uppercase tracking-widest text-muted-foreground text-center">Tương hợp chủ nhân & số</p>
      <p className={`text-2xl font-serif font-bold text-center ${compat.labelColor}`}>{compat.label}</p>
      <div className="flex items-center justify-center gap-6 py-1">
        <div className="text-center">
          <div className="text-3xl font-bold font-serif text-primary">{compat.nameNumber}</div>
          <div className="text-xs text-muted-foreground mt-0.5">{ownerLabel}</div>
          <div className="text-xs text-foreground/50">{ownerSubLabel}</div>
        </div>
        <div className={`text-2xl font-bold ${symColor[compat.level]}`}>{symMap[compat.level]}</div>
        <div className="text-center">
          <div className="text-3xl font-bold font-serif text-primary">{compat.phoneNumber}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Năng lượng số</div>
          <div className="text-xs text-foreground/50 font-mono tracking-widest">{numStr}</div>
        </div>
      </div>
      <p className="text-sm text-foreground/75 text-center leading-relaxed">{compat.description}</p>
    </div>
  );
}

function DigitRow({ digits }: { digits: CatHungResult["digits"] }) {
  return (
    <div className="flex gap-2 justify-center flex-wrap">
      {digits.map((d, i) => {
        const cfg = LEVEL_CONFIG[d.level];
        return (
          <div key={i} className={`flex flex-col items-center gap-1 rounded-xl border px-2.5 py-2.5 min-w-[54px] ${cfg.bg} ${cfg.border}`}>
            <span className={`text-2xl font-bold font-serif ${cfg.text}`}>{d.digit}</span>
            <span className="text-[9px] text-muted-foreground text-center leading-tight">{d.element}</span>
            <span className={`text-[9px] font-semibold ${cfg.text}`}>{d.score > 0 ? `+${d.score}` : d.score}</span>
          </div>
        );
      })}
    </div>
  );
}

function ComboBadges({ combinations }: { combinations: CatHungResult["combinations"] }) {
  if (combinations.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-widest text-muted-foreground text-center">Tổ hợp đặc biệt</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {combinations.map((c, i) => {
          const cfg = LEVEL_CONFIG[c.level];
          return (
            <div key={i} className={`rounded-lg border px-3 py-2 text-center ${cfg.badge}`}>
              <span className="block text-sm font-bold tracking-widest">{c.pattern}</span>
              <span className="block text-xs font-semibold">{c.name}</span>
              <span className="block text-[10px] opacity-80 max-w-[140px]">{c.meaning}</span>
              <span className="block text-xs font-bold">{c.score > 0 ? `+${c.score}` : c.score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DigitMeaningList({ digits }: { digits: CatHungResult["digits"] }) {
  return (
    <div className="space-y-2">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">Ý nghĩa từng chữ số</p>
      <div className="grid grid-cols-1 gap-2">
        {digits.map((d, i) => {
          const cfg = LEVEL_CONFIG[d.level];
          return (
            <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 border ${cfg.bg} ${cfg.border}`}>
              <span className={`text-2xl font-bold w-8 text-center font-serif ${cfg.text}`}>{d.digit}</span>
              <span className="text-sm text-foreground/80 flex-1">{d.meaning}</span>
              <span className={`text-xs font-semibold ${cfg.text}`}>{d.score > 0 ? `+${d.score}` : d.score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AIPanel({ onAsk, isStreaming, messages }: {
  onAsk: () => void;
  isStreaming: boolean;
  messages: { role: string; content: string }[];
}) {
  return (
    <Card className="bg-card/40 backdrop-blur-sm border-primary/20 shadow-xl">
      <CardHeader>
        <CardTitle className="text-xl text-primary flex items-center justify-between flex-wrap gap-2">
          <span>Luận giải chuyên sâu từ AI</span>
          <Button onClick={onAsk} disabled={isStreaming} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
            {isStreaming ? "Đang lắng nghe vũ trụ..." : "Nhận thông điệp"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {messages.filter((m) => m.role === "assistant").map((msg, i) => (
          <div key={i} className="px-5 py-4 rounded-lg bg-background/40 border border-primary/15 shadow-inner">
            {msg.content ? <MarkdownRenderer content={msg.content} /> : (
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
          </div>
        ))}
        {!messages.some((m) => m.role === "assistant") && !isStreaming && (
          <p className="text-sm text-muted-foreground text-center italic py-6">
            Nhấn nút bên trên để AI luận giải chi tiết về ý nghĩa huyền số.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function SixDigitResult({
  result, numStr, ownerName, compat,
}: {
  result: CatHungResult; numStr: string; ownerName?: string; compat?: CompatibilityResult;
}) {
  const { messages, streamResponse, isStreaming } = useAISSEChat();
  const handleAskAI = () => {
    const ownerPart = ownerName
      ? ` Chủ sở hữu: ${ownerName} (số mệnh: ${compat?.nameNumber}, năng lượng số: ${compat?.phoneNumber}, tương hợp: ${compat?.label}).`
      : "";
    const context = `Phân tích cát hung cho 6 số cuối số điện thoại: ${numStr}.${ownerPart} Kết quả: ${result.verdictLabel} (điểm: ${result.totalScore.toFixed(1)}). Chữ số: ${result.digits.map((d) => `${d.digit}(${d.meaning})`).join(", ")}. ${result.combinations.length > 0 ? `Tổ hợp: ${result.combinations.map((c) => `${c.pattern} - ${c.name}: ${c.meaning}`).join("; ")}.` : ""}`;
    streamResponse("/api/mysticism/ai-interpret", { type: "cat-hung", context });
  };
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <VerdictBadge result={result} />
      {compat && ownerName && (
        <CompatibilityPanel compat={compat} numStr={numStr} ownerLabel="Số mệnh" ownerSubLabel="chủ nhân" />
      )}
      <DigitRow digits={result.digits} />
      <ComboBadges combinations={result.combinations} />
      <DigitMeaningList digits={result.digits} />
      <AIPanel onAsk={handleAskAI} isStreaming={isStreaming} messages={messages} />
    </div>
  );
}

function TenDigitResult({
  analysis, ownerName, dob, compatName, compatDOB,
}: {
  analysis: FullPhoneAnalysis;
  ownerName?: string;
  dob?: string;
  compatName?: CompatibilityResult;
  compatDOB?: CompatibilityResult;
}) {
  const { messages, streamResponse, isStreaming } = useAISSEChat();
  const handleAskAI = () => {
    const ownerPart = ownerName
      ? ` Chủ sở hữu: ${ownerName}.`
      : "";
    const dobPart = dob
      ? ` Ngày sinh: ${dob} (số đường đời: ${computeLifePathFromDOB(dob)}, tương hợp: ${compatDOB?.label}).`
      : "";
    const context = `Phân tích cát hung toàn bộ 10 số điện thoại: ${analysis.allDigits}.${ownerPart}${dobPart} Đầu số ${analysis.prefixDigits}: ${analysis.prefixResult.verdictLabel}. Số thuê bao ${analysis.subscriberDigits}: ${analysis.subscriberResult.verdictLabel}. Tổng thể: ${analysis.fullResult.verdictLabel} (điểm: ${analysis.fullResult.totalScore.toFixed(1)}). Năng lượng số tổng: ${analysis.energyNumber}. Tổ hợp đặc biệt: ${analysis.fullResult.combinations.map((c) => `${c.pattern} - ${c.name}`).join(", ") || "không có"}.`;
    streamResponse("/api/mysticism/ai-interpret", { type: "cat-hung", context });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <VerdictBadge result={analysis.fullResult} label="Tổng luận đoán 10 số" />

      {compatDOB && dob && (
        <CompatibilityPanel
          compat={compatDOB}
          numStr={analysis.allDigits}
          ownerLabel="Số đường đời"
          ownerSubLabel={`sinh ${dob}`}
        />
      )}
      {compatName && !compatDOB && ownerName && (
        <CompatibilityPanel compat={compatName} numStr={analysis.allDigits} ownerLabel="Số mệnh" ownerSubLabel="chủ nhân" />
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <SmallVerdictCard result={analysis.prefixResult} title="Đầu số (nhà mạng)" numStr={analysis.prefixDigits} />
        <SmallVerdictCard result={analysis.subscriberResult} title="Số thuê bao (6 cuối)" numStr={analysis.subscriberDigits} />
      </div>

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground text-center">Toàn bộ 10 chữ số</p>
        <DigitRow digits={analysis.fullResult.digits} />
      </div>

      <ComboBadges combinations={analysis.fullResult.combinations} />

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Chi tiết từng chữ số</p>
        <div className="space-y-2">
          <p className="text-[11px] text-primary/70 uppercase tracking-widest font-semibold pl-1">Đầu số — {analysis.prefixDigits}</p>
          <DigitMeaningList digits={analysis.prefixResult.digits} />
          <p className="text-[11px] text-primary/70 uppercase tracking-widest font-semibold pl-1 mt-3">Số thuê bao — {analysis.subscriberDigits}</p>
          <DigitMeaningList digits={analysis.subscriberResult.digits} />
        </div>
      </div>

      <AIPanel onAsk={handleAskAI} isStreaming={isStreaming} messages={messages} />
    </div>
  );
}

function PlateResult({ result, numStr }: { result: CatHungResult; numStr: string }) {
  const { messages, streamResponse, isStreaming } = useAISSEChat();
  const handleAskAI = () => {
    const context = `Phân tích cát hung biển số xe: ${numStr}. Kết quả: ${result.verdictLabel} (điểm: ${result.totalScore.toFixed(1)}). Chữ số: ${result.digits.map((d) => `${d.digit}(${d.meaning})`).join(", ")}. ${result.combinations.length > 0 ? `Tổ hợp: ${result.combinations.map((c) => `${c.pattern} - ${c.name}: ${c.meaning}`).join("; ")}.` : ""}`;
    streamResponse("/api/mysticism/ai-interpret", { type: "cat-hung", context });
  };
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <VerdictBadge result={result} />
      <DigitRow digits={result.digits} />
      <ComboBadges combinations={result.combinations} />
      <DigitMeaningList digits={result.digits} />
      <AIPanel onAsk={handleAskAI} isStreaming={isStreaming} messages={messages} />
    </div>
  );
}

function ComparePhoneTab() {
  const [phones, setPhones] = useState(["", ""]);
  const [compared, setCompared] = useState<{ nums: string[]; results: CatHungResult[] } | null>(null);
  const [suggestions, setSuggestions] = useState<{ num: string; result: CatHungResult }[]>([]);
  const [showSuggest, setShowSuggest] = useState(false);

  const handlePhoneChange = (i: number, val: string) => {
    const formatted = formatPhoneDisplay(val);
    setPhones((p) => { const n = [...p]; n[i] = formatted; return n; });
    setCompared(null);
    setSuggestions([]);
    setShowSuggest(false);
  };

  const digits = phones.map((p) => p.replace(/\D/g, ""));
  const ready = digits.every((d) => d.length >= 6);

  const handleCompare = () => {
    if (!ready) return;
    const nums = digits.map((d) => d.slice(-6));
    const results = nums.map((n) => analyzeCatHung(n));
    setCompared({ nums, results });
  };

  const handleSuggest = () => {
    if (!compared) return;
    const baseNum = compared.nums[0];
    const candidates: { num: string; result: CatHungResult }[] = [];
    for (let pos = 3; pos <= 5; pos++) {
      for (let d = 0; d <= 9; d++) {
        const arr = baseNum.split("");
        arr[pos] = String(d);
        const num = arr.join("");
        if (num === baseNum) continue;
        candidates.push({ num, result: analyzeCatHung(num) });
      }
    }
    const allSorted = candidates.sort((a, b) => b.result.totalScore - a.result.totalScore);
    const good = allSorted.filter((c) => c.result.verdict === "dai-cat" || c.result.verdict === "cat");
    setSuggestions(good.length >= 3 ? good.slice(0, 6) : allSorted.slice(0, 6));
    setShowSuggest(true);
  };

  const VERDICT_BG: Record<string, string> = {
    "dai-cat": "border-yellow-400/60 bg-yellow-500/10",
    cat: "border-green-400/60 bg-green-500/10",
    "binh-thuong": "border-blue-400/40 bg-blue-500/10",
    hung: "border-orange-400/60 bg-orange-500/10",
    "dai-hung": "border-red-500/60 bg-red-500/10",
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card/40 backdrop-blur-sm border-primary/20 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-primary">So Sánh 2 Số Điện Thoại</CardTitle>
          <CardDescription>Nhập hai số để so sánh điểm cát hung và tìm số tốt hơn.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <div key={i} className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground/80">Số điện thoại {i + 1}</Label>
                <div className="relative">
                  <input
                    type="tel"
                    value={phones[i]}
                    onChange={(e) => handlePhoneChange(i, e.target.value)}
                    placeholder="0901 234 567"
                    maxLength={12}
                    className={cn(
                      "flex h-10 w-full rounded-md border bg-background/50 px-3 py-2 pl-10 pr-16 text-sm font-mono tracking-widest transition-all duration-200 outline-none",
                      digits[i].length >= 6 ? "border-green-500/60" : phones[i] ? "border-primary/40" : "border-border/50 focus:border-primary/50"
                    )}
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  <span className={cn("absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono", digits[i].length >= 6 ? "text-green-400" : "text-muted-foreground/50")}>{digits[i].length}/10</span>
                </div>
                {digits[i].length >= 6 && (
                  <p className="text-xs text-muted-foreground">6 số cuối: <span className="text-primary font-semibold font-mono tracking-widest">{digits[i].slice(-6)}</span></p>
                )}
              </div>
            ))}
          </div>
          <Button onClick={handleCompare} disabled={!ready} className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold tracking-wider">
            SO SÁNH
          </Button>
        </CardContent>
      </Card>

      {compared && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Side-by-side results */}
          <div className="grid md:grid-cols-2 gap-4">
            {compared.results.map((r, i) => (
              <div key={i} className={`rounded-2xl border p-5 space-y-3 ${VERDICT_BG[r.verdict]}`}>
                <p className="text-xs uppercase tracking-widest text-muted-foreground text-center">Số {i + 1}</p>
                <p className="text-xs font-mono tracking-[0.2em] text-center text-foreground/60">{compared.nums[i]}</p>
                <p className={`text-4xl font-serif font-bold text-center ${r.verdictColor}`}>{r.verdictLabel}</p>
                <p className="text-xs text-muted-foreground text-center">Điểm: {r.totalScore.toFixed(1)}</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {r.digits.map((d, j) => (
                    <span key={j} className={`rounded-lg px-2 py-1 text-sm font-bold font-serif ${LEVEL_CONFIG[d.level]?.text ?? "text-foreground"}`}>{d.digit}</span>
                  ))}
                </div>
                {r.combinations.length > 0 && (
                  <div className="flex flex-wrap gap-1 justify-center">
                    {r.combinations.map((c, j) => <span key={j} className={`text-[10px] px-2 py-0.5 rounded-full border ${LEVEL_CONFIG[c.level].badge}`}>{c.name}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Winner */}
          {(() => {
            const [r0, r1] = compared.results;
            if (r0.totalScore === r1.totalScore) return (
              <div className="text-center py-4 text-muted-foreground">Hai số điểm ngang nhau — xem chi tiết từng số để quyết định.</div>
            );
            const winner = r0.totalScore > r1.totalScore ? 1 : 2;
            const loser = winner === 1 ? 2 : 1;
            const diff = Math.abs(r0.totalScore - r1.totalScore).toFixed(1);
            return (
              <div className="rounded-2xl border border-primary/40 bg-primary/5 p-6 text-center space-y-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Kết luận</p>
                <p className="text-2xl font-bold text-primary">Số {winner} tốt hơn Số {loser}</p>
                <p className="text-sm text-foreground/70">Chênh lệch điểm: <span className="text-primary font-semibold">{diff}</span> điểm</p>
                <p className="text-xs text-muted-foreground font-mono tracking-widest">{compared.nums[winner - 1]}</p>
              </div>
            );
          })()}

          {/* Suggest better */}
          <div className="text-center space-y-4">
            <Button onClick={handleSuggest} variant="outline" className="border-primary/50 text-primary hover:bg-primary/10">
              Gợi ý số cuối tốt hơn cho Số 1
            </Button>
            {showSuggest && suggestions.length > 0 && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <p className="text-sm text-muted-foreground">Thay đổi 2 số cuối — các phương án tốt hơn:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {suggestions.map(({ num, result }, i) => (
                    <div key={i} className={`rounded-xl border p-3 text-center ${VERDICT_BG[result.verdict]}`}>
                      <p className="font-mono tracking-[0.2em] text-foreground/80 text-sm mb-1">{num}</p>
                      <p className={`text-xl font-bold font-serif ${result.verdictColor}`}>{result.verdictLabel}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{result.totalScore.toFixed(1)} điểm</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface PhoneState {
  mode: PhoneMode;
  sixResult?: { result: CatHungResult; numStr: string; ownerName?: string; compat?: CompatibilityResult };
  tenResult?: { analysis: FullPhoneAnalysis; ownerName?: string; dob?: string; compatName?: CompatibilityResult; compatDOB?: CompatibilityResult };
}

export default function CatHungPage() {
  const [phone, setPhone] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [dob, setDob] = useState("");
  const [dobInput, setDobInput] = useState("");
  const [phoneMode, setPhoneMode] = useState<PhoneMode>("6");

  const handlePhoneChange = (val: string) => {
    const formatted = formatPhoneDisplay(val);
    setPhone(formatted);
  };

  const handleDobChange = (val: string) => {
    setDobInput(val);
    setDob(dateInputToDisplay(val));
  };

  const phoneDigits = phone.replace(/\D/g, "");
  const phoneTarget = phoneMode === "6" ? 6 : 10;
  const [phoneState, setPhoneState] = useState<PhoneState | null>(null);

  const [plate, setPlate] = useState("");
  const [plateResult, setPlateResult] = useState<{ result: CatHungResult; numStr: string } | null>(null);
  const [bankNum, setBankNum] = useState("");
  const [bankResult, setBankResult] = useState<{ result: CatHungResult; numStr: string } | null>(null);
  const [activeTab, setActiveTab] = useState("phone");

  const last6 = extractLastSixDigits(phone);
  const all10 = extractAllPhoneDigits(phone);
  const previewDigits = phoneMode === "6" ? last6 : all10;
  const previewReady = phoneMode === "6" ? last6.length === 6 : all10.length === 10;

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneMode === "6") {
      if (last6.length < 6) return;
      const result = analyzeCatHung(last6);
      const compat = ownerName.trim() ? analyzeCompatibility(ownerName.trim(), last6) : undefined;
      setPhoneState({ mode: "6", sixResult: { result, numStr: last6, ownerName: ownerName.trim(), compat } });
    } else {
      if (all10.length < 10) return;
      const analysis = analyzeFullPhone(phone);
      const compatName = ownerName.trim() ? analyzeCompatibility(ownerName.trim(), all10) : undefined;
      const compatDOB = dob.trim() && computeLifePathFromDOB(dob) > 0
        ? analyzeCompatibilityWithDOB(dob.trim(), all10)
        : undefined;
      setPhoneState({ mode: "10", tenResult: { analysis, ownerName: ownerName.trim(), dob: dob.trim(), compatName, compatDOB } });
    }
  };

  const handlePlateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const digits = validateLicensePlate(plate);
    if (digits.length < 4) return;
    setPlateResult({ result: analyzeCatHung(digits), numStr: digits });
  };

  const phoneHistoryEntry = (() => {
    if (!phoneState) return null;
    if (phoneState.mode === "6" && phoneState.sixResult) {
      const { result, numStr, ownerName: oName } = phoneState.sixResult;
      return {
        module: "cat-hung",
        moduleName: "Xem Cát Hung",
        title: `Cát Hung Điện Thoại — ${phone}${oName ? ` (${oName})` : ""}`,
        summary: `Số ${numStr}: ${result.verdictLabel} — ${result.verdictDescription}`,
        result: `Số điện thoại: ${phone}\nKết quả: ${result.verdictLabel} — ${result.verdictDescription}`,
      };
    }
    if (phoneState.mode === "10" && phoneState.tenResult) {
      const { analysis, ownerName: oName } = phoneState.tenResult;
      return {
        module: "cat-hung",
        moduleName: "Xem Cát Hung",
        title: `Cát Hung Điện Thoại 10 số — ${phone}${oName ? ` (${oName})` : ""}`,
        summary: `${analysis.fullResult.verdictLabel} — ${analysis.fullResult.verdictDescription}`,
        result: `Số điện thoại: ${phone}\nKết quả tổng: ${analysis.fullResult.verdictLabel} — ${analysis.fullResult.verdictDescription}`,
      };
    }
    return null;
  })();

  useAutoHistory(phoneHistoryEntry);

  useAutoHistory(plateResult ? {
    module: "cat-hung",
    moduleName: "Xem Cát Hung",
    title: `Cát Hung Biển Số — ${plate}`,
    summary: `Biển số ${plateResult.numStr}: ${plateResult.result.verdictLabel} — ${plateResult.result.verdictDescription}`,
    result: `Biển số: ${plate} (${plateResult.numStr})\nKết quả: ${plateResult.result.verdictLabel} — ${plateResult.result.verdictDescription}`,
  } : null);

  useEffect(() => {
    const d = popReopenData("cat-hung");
    if (d) {
      if (d.soDienThoai) { handlePhoneChange(String(d.soDienThoai)); setActiveTab("phone"); }
      if (d.tenChuSo) setOwnerName(String(d.tenChuSo));
      if (d.bienSo) { setPlate(String(d.bienSo)); setActiveTab("plate"); }
    }
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />
      <Navbar />

      <main className="flex-1 container mx-auto px-4 pt-24 pb-16 z-10 relative">
        <div className="max-w-3xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground drop-shadow-md">Xem Cát Hung</h1>
            <p className="text-muted-foreground text-lg">
              Luận đoán may mắn từ số điện thoại và biển số xe theo huyền số học phương Đông.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-card/40 border border-primary/20">
              <TabsTrigger value="phone" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-xs sm:text-sm">
                Điện Thoại
              </TabsTrigger>
              <TabsTrigger value="compare" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-xs sm:text-sm">
                So Sánh
              </TabsTrigger>
              <TabsTrigger value="plate" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-xs sm:text-sm">
                Biển Số Xe
              </TabsTrigger>
              <TabsTrigger value="bank" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-xs sm:text-sm">
                Tài Khoản NH
              </TabsTrigger>
            </TabsList>

            <TabsContent value="phone" className="space-y-8 mt-6">
              <Card className="bg-card/40 backdrop-blur-sm border-primary/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">Số Điện Thoại</CardTitle>
                  <CardDescription>
                    Chọn chế độ phân tích và nhập thông tin chủ sở hữu để xem tương hợp.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex gap-2">
                    {([
                      { value: "6" as PhoneMode, label: "6 Số Cuối" },
                      { value: "10" as PhoneMode, label: "10 Số Đầy Đủ" },
                    ] as { value: PhoneMode; label: string }[]).map((m) => (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => { setPhoneMode(m.value); setPhoneState(null); }}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                          phoneMode === m.value
                            ? "bg-primary/20 border-primary/60 text-primary"
                            : "bg-transparent border-border/40 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Số điện thoại với auto-format + counter */}
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                          <svg className="w-4 h-4 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                          Số điện thoại
                        </Label>
                        <div className="relative">
                          <input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            placeholder="0901 234 567"
                            maxLength={12}
                            className={cn(
                              "flex h-10 w-full rounded-md border bg-background/50 px-3 py-2 pl-10 pr-16 text-sm font-mono tracking-widest transition-all duration-200 outline-none",
                              phoneDigits.length >= phoneTarget ? "border-green-500/60 focus:ring-1 focus:ring-green-500/30"
                                : phone ? "border-primary/40 focus:ring-1 focus:ring-primary/20"
                                : "border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                            )}
                            required
                          />
                          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                          <span className={cn(
                            "absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono tabular-nums",
                            phoneDigits.length >= phoneTarget ? "text-green-400" : "text-muted-foreground/50"
                          )}>
                            {phoneDigits.length}/{phoneTarget}
                          </span>
                        </div>
                        {phoneDigits.length > 0 && phoneDigits.length < phoneTarget && (
                          <p className="text-xs text-amber-400/80">Còn thiếu {phoneTarget - phoneDigits.length} chữ số</p>
                        )}
                        {phoneDigits.length >= phoneTarget && (
                          <p className="text-xs text-green-400 flex items-center gap-1"><svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>Đủ số — sẵn sàng phân tích</p>
                        )}
                      </div>

                      {/* Họ tên (tùy chọn) */}
                      <div className="space-y-1.5">
                        <Label htmlFor="ownerName" className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                          <svg className="w-4 h-4 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                          Họ tên chủ sở hữu
                          <span className="text-muted-foreground font-normal text-xs">(tùy chọn)</span>
                        </Label>
                        <div className="relative">
                          <input
                            id="ownerName"
                            type="text"
                            value={ownerName}
                            onChange={(e) => setOwnerName(e.target.value)}
                            placeholder="Nguyễn Văn An"
                            className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 pl-10 text-sm transition-all duration-200 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 placeholder:text-muted-foreground/50"
                          />
                          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                        </div>
                      </div>
                    </div>

                    {/* Ngày sinh (tùy chọn, chỉ mode 10 số) */}
                    {phoneMode === "10" && (
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                          <svg className="w-4 h-4 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={1.8}/><line x1="16" y1="2" x2="16" y2="6" strokeWidth={1.8}/><line x1="8" y1="2" x2="8" y2="6" strokeWidth={1.8}/><line x1="3" y1="10" x2="21" y2="10" strokeWidth={1.8}/></svg>
                          Ngày sinh
                          <span className="text-muted-foreground font-normal text-xs">(tùy chọn — kiểm tra tương hợp theo số đường đời)</span>
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
                        {dobInput && <p className="text-xs text-muted-foreground">Dương lịch: <span className="text-primary/80 font-medium">{dob}</span></p>}
                      </div>
                    )}

                    {previewReady && (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm bg-primary/5 border border-primary/15 rounded-lg px-4 py-2.5">
                        <span className="text-muted-foreground">
                          {phoneMode === "6" ? "6 số cuối:" : "10 số đầy đủ:"}
                        </span>
                        <span className="text-primary font-bold tracking-[0.18em] text-base font-serif">{previewDigits}</span>
                        {ownerName.trim() && (
                          <span className="text-muted-foreground">
                            Số mệnh <span className="text-foreground font-medium">{ownerName}</span>:{" "}
                            <span className="text-primary font-bold">{computeNameNumber(ownerName)}</span>
                          </span>
                        )}
                        {phoneMode === "10" && dob.trim() && computeLifePathFromDOB(dob) > 0 && (
                          <span className="text-muted-foreground">
                            Đường đời: <span className="text-primary font-bold">{computeLifePathFromDOB(dob)}</span>
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          Năng lượng số: <span className="text-primary font-bold">{computePhoneEnergyNumber(previewDigits)}</span>
                        </span>
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={!previewReady}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold tracking-wider"
                    >
                      LUẬN ĐOÁN
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {phoneState?.mode === "6" && phoneState.sixResult && (
                <>
                  <div className="flex justify-end">
                    <SaveReadingBtn
                      module="cat-hung"
                      title={`Cát Hung Điện Thoại — ${phone}${phoneState.sixResult.ownerName ? ` (${phoneState.sixResult.ownerName})` : ""}`}
                      inputData={{ soDienThoai: phone, tenChuSo: phoneState.sixResult.ownerName }}
                      resultData={{ ketQua: phoneState.sixResult.result.verdictLabel, moTa: phoneState.sixResult.result.verdictDescription }}
                    />
                  </div>
                  <SixDigitResult
                    result={phoneState.sixResult.result}
                    numStr={phoneState.sixResult.numStr}
                    ownerName={phoneState.sixResult.ownerName}
                    compat={phoneState.sixResult.compat}
                  />
                </>
              )}
              {phoneState?.mode === "10" && phoneState.tenResult && (
                <>
                  <div className="flex justify-end">
                    <SaveReadingBtn
                      module="cat-hung"
                      title={`Cát Hung Điện Thoại 10 số — ${phone}${phoneState.tenResult.ownerName ? ` (${phoneState.tenResult.ownerName})` : ""}`}
                      inputData={{ soDienThoai: phone, tenChuSo: phoneState.tenResult.ownerName, ngaySinh: phoneState.tenResult.dob }}
                      resultData={{ ketQua: phoneState.tenResult.analysis.fullResult.verdictLabel, moTa: phoneState.tenResult.analysis.fullResult.verdictDescription }}
                    />
                  </div>
                  <TenDigitResult
                    analysis={phoneState.tenResult.analysis}
                    ownerName={phoneState.tenResult.ownerName}
                    dob={phoneState.tenResult.dob}
                    compatName={phoneState.tenResult.compatName}
                    compatDOB={phoneState.tenResult.compatDOB}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="compare" className="space-y-6 mt-6">
              <ComparePhoneTab />
            </TabsContent>

            <TabsContent value="plate" className="space-y-8 mt-6">
              <Card className="bg-card/40 backdrop-blur-sm border-primary/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">Biển Số Xe</CardTitle>
                  <CardDescription>
                    Nhập 4 hoặc 5 chữ số cuối của biển số xe để luận đoán cát hung.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePlateSubmit} className="flex gap-3">
                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor="plate" className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                        <svg className="w-4 h-4 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={1.8}/><path strokeWidth={1.8} d="M7 10h.01M17 10h.01M7 14h.01M17 14h.01"/></svg>
                        Số biển xe (4–5 chữ số cuối)
                      </Label>
                      <div className="relative">
                        <input
                          id="plate"
                          type="text"
                          inputMode="numeric"
                          value={plate}
                          onChange={(e) => setPlate(e.target.value.replace(/\D/g, "").slice(0, 5))}
                          placeholder="56789 hoặc 8868"
                          maxLength={5}
                          required
                          className={cn(
                            "flex h-10 w-full rounded-md border bg-background/50 px-3 py-2 pl-10 pr-12 text-sm font-mono text-lg tracking-[0.25em] transition-all duration-200 outline-none",
                            plate.length >= 4 ? "border-green-500/60 focus:ring-1 focus:ring-green-500/30"
                              : plate ? "border-primary/40 focus:ring-1 focus:ring-primary/20"
                              : "border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                          )}
                        />
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={1.8}/><path strokeWidth={1.8} d="M7 10h.01M17 10h.01M7 14h.01M17 14h.01"/></svg>
                        <span className={cn("absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono tabular-nums", plate.length >= 4 ? "text-green-400" : "text-muted-foreground/50")}>
                          {plate.length}/5
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Chỉ nhập chữ số (4–5 ký tự)</p>
                    </div>
                    <div className="flex items-center pb-5">
                      <Button
                        type="submit"
                        disabled={plate.replace(/\D/g, "").length < 4}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-10 px-6"
                      >
                        LUẬN ĐOÁN
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              {plateResult && (
                <>
                  <div className="flex justify-end">
                    <SaveReadingBtn
                      module="cat-hung"
                      title={`Cát Hung Biển Số — ${plate}`}
                      inputData={{ bienSo: plate }}
                      resultData={{ ketQua: plateResult.result.verdictLabel, moTa: plateResult.result.verdictDescription }}
                    />
                  </div>
                  <PlateResult result={plateResult.result} numStr={plateResult.numStr} />
                </>
              )}
            </TabsContent>
            <TabsContent value="bank" className="space-y-8 mt-6">
              <Card className="bg-card/40 backdrop-blur-sm border-primary/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-2xl text-primary">Số Tài Khoản Ngân Hàng</CardTitle>
                  <CardDescription>
                    Nhập 6–12 chữ số cuối của số tài khoản để luận đoán cát hung theo huyền số học.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const cleaned = bankNum.replace(/\D/g, "");
                    const numStr = cleaned.slice(-8);
                    if (numStr.length < 6) return;
                    setBankResult({ result: analyzeCatHung(numStr), numStr });
                  }} className="flex gap-3">
                    <div className="flex-1 space-y-1.5">
                      <Label htmlFor="bank" className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                        <svg className="w-4 h-4 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth={1.8} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline strokeWidth={1.8} points="9 22 9 12 15 12 15 22"/></svg>
                        Số tài khoản (6–18 chữ số)
                      </Label>
                      <div className="relative">
                        <input
                          id="bank"
                          type="text"
                          inputMode="numeric"
                          value={bankNum}
                          onChange={(e) => setBankNum(e.target.value.replace(/\D/g, "").slice(0, 18))}
                          placeholder="VD: 0123456789012"
                          maxLength={18}
                          required
                          className={cn(
                            "flex h-10 w-full rounded-md border bg-background/50 px-3 py-2 pl-10 pr-12 text-sm font-mono tracking-[0.1em] transition-all duration-200 outline-none",
                            bankNum.length >= 6 ? "border-green-500/60 focus:ring-1 focus:ring-green-500/30"
                              : bankNum ? "border-primary/40 focus:ring-1 focus:ring-primary/20"
                              : "border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                          )}
                        />
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" strokeWidth={1.8}/><line x1="1" y1="10" x2="23" y2="10" strokeWidth={1.8}/></svg>
                        <span className={cn("absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono tabular-nums", bankNum.length >= 6 ? "text-green-400" : "text-muted-foreground/50")}>
                          {bankNum.length}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">Phân tích dựa trên 8 chữ số cuối mang năng lượng tài lộc</p>
                    </div>
                    <div className="flex items-center pb-5">
                      <Button
                        type="submit"
                        disabled={bankNum.replace(/\D/g, "").length < 6}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold h-10 px-6"
                      >
                        LUẬN ĐOÁN
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
              {bankResult && (
                <>
                  <div className="flex justify-end">
                    <SaveReadingBtn
                      module="cat-hung"
                      title={`Cát Hung Tài Khoản — ...${bankResult.numStr}`}
                      inputData={{ taiKhoan: `...${bankResult.numStr}` }}
                      resultData={{ ketQua: bankResult.result.verdictLabel, moTa: bankResult.result.verdictDescription }}
                    />
                  </div>
                  <PlateResult result={bankResult.result} numStr={bankResult.numStr} />
                </>
              )}
            </TabsContent>
          </Tabs>

          <CatHungKnowledge />
        </div>
      </main>
    </div>
  );
}
