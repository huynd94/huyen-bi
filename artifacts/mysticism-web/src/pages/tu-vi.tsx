import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { useAutoHistory } from "@/lib/use-auto-history";
import { SaveReadingBtn } from "@/components/save-reading-btn";
import { popReopenData } from "@/lib/reopen-reading";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { hourToCanChi } from "@/lib/form-utils";
import { calculateTuVi, THIEN_CAN, DIA_CHI, NGU_HANH_COLOR, type TuViResult, type CungInfo } from "@/lib/tu-vi";
import { TuViKnowledge } from "@/components/knowledge-base";
import { solarToLunar } from "@/lib/lunar-calendar";
import { useAISSEChat } from "@/hooks/use-ai-sse-chat";
import { useExportImage } from "@/hooks/use-export-image";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { ResultActions } from "@/components/result-actions";
import { TuViExportCard } from "@/components/export-card-tuvi";
import { ExportDownloadBar } from "@/components/export-download-bar";

const CUONG_TUOC = ["Vượng", "Miếu", "Đắc", "Bình", "Hãm"];

const CUC_START_AGES: Record<string, number> = {
  "Hỏa": 6, "Thổ": 5, "Kim": 4, "Mộc": 3, "Thủy": 2,
};

function DaiHanSection({ result, birthYear, gender }: { result: TuViResult; birthYear: number; gender: string }) {
  const canIdx = THIEN_CAN.indexOf(result.canNam);
  const chiIdx = DIA_CHI.indexOf(result.chiNam);
  const isDuongCan = canIdx % 2 === 0;
  const isThuan = (gender === "nam" && isDuongCan) || (gender === "nu" && !isDuongCan);
  const dir = isThuan ? 1 : -1;
  const startAge = CUC_START_AGES[result.nguHanhCuc] ?? 4;

  const periods = Array.from({ length: 8 }, (_, i) => {
    const ci = ((canIdx + dir * (i + 1)) % 10 + 10) % 10;
    const dci = ((chiIdx + dir * (i + 1)) % 12 + 12) % 12;
    const age = startAge + i * 10;
    const yearStart = birthYear + age;
    return { can: THIEN_CAN[ci], chi: DIA_CHI[dci], startAge: age, endAge: age + 9, yearStart };
  });

  const currentAge = new Date().getFullYear() - birthYear;
  const activePeriod = periods.findIndex(p => currentAge >= p.startAge && currentAge <= p.endAge);

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-1">Đại Hạn</h2>
      <p className="text-xs text-muted-foreground mb-4">
        {isThuan ? "Thuận" : "Nghịch"} hành — mỗi đại hạn kéo dài 10 năm, bắt đầu từ tuổi {startAge}.
      </p>
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {periods.map((p, i) => {
          const isActive = i === activePeriod;
          return (
            <div
              key={i}
              className={cn(
                "border rounded-xl p-2.5 text-center space-y-1 transition-all",
                isActive
                  ? "border-yellow-400/60 bg-yellow-400/10 shadow-[0_0_12px_rgba(250,204,21,0.12)]"
                  : "border-primary/15 bg-card/30"
              )}
            >
              <div className={cn("text-xs font-bold", isActive ? "text-yellow-400" : "text-primary")}>
                {p.can} {p.chi}
              </div>
              <div className="text-[10px] text-muted-foreground leading-tight">
                Tuổi {p.startAge}–{p.endAge}
              </div>
              <div className="text-[10px] text-muted-foreground/60">
                {p.yearStart}
              </div>
              {isActive && (
                <div className="text-[9px] text-yellow-400 font-semibold tracking-wide">HIỆN TẠI</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StarBadge({ name, type }: { name: string; type: string }) {
  const style =
    type === "chinh-tinh" ? "bg-primary/20 border-primary/50 text-primary" :
    type === "phu-tinh" ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" :
    "bg-red-500/15 border-red-500/30 text-red-400";
  return (
    <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded border font-medium leading-none ${style}`}>
      {name}
    </span>
  );
}

function CungCard({ cung, isMenh, isThan, onClick, selected }: {
  cung: CungInfo;
  isMenh: boolean;
  isThan: boolean;
  onClick: () => void;
  selected: boolean;
}) {
  const border = isMenh ? "border-primary/70 ring-1 ring-primary/40" :
    isThan ? "border-amber-500/50 ring-1 ring-amber-500/30" :
    selected ? "border-primary/40" : "border-primary/15";

  return (
    <button
      onClick={onClick}
      className={`relative text-left p-3 rounded-xl border bg-card/30 hover:bg-card/60 transition-all duration-200 ${border}`}
    >
      {(isMenh || isThan) && (
        <div className={`absolute -top-2 left-2 text-[9px] px-1.5 py-0.5 rounded-full font-bold ${isMenh ? "bg-primary text-primary-foreground" : "bg-amber-500 text-black"}`}>
          {isMenh ? "MỆNH" : "THÂN"}
        </div>
      )}
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <div>
          <div className="text-[10px] text-muted-foreground">{cung.thienCan} {cung.diaChi}</div>
          <div className="text-xs font-bold text-foreground">{cung.name}</div>
        </div>
        <div className="text-[10px] text-muted-foreground text-right shrink-0">{cung.nguHanh}</div>
      </div>
      <div className="flex flex-wrap gap-1">
        {cung.stars.slice(0, 4).map((s) => (
          <StarBadge key={s.name} name={s.name} type={s.type} />
        ))}
        {cung.stars.length > 4 && (
          <span className="text-[10px] text-muted-foreground">+{cung.stars.length - 4}</span>
        )}
      </div>
    </button>
  );
}

export default function TuViPage() {
  const [dateInput, setDateInput] = useState("");
  const [form, setForm] = useState({ year: "", month: "", day: "", hour: "6", gender: "nam" as "nam" | "nu" });
  const [result, setResult] = useState<TuViResult | null>(null);
  const [selectedCung, setSelectedCung] = useState<CungInfo | null>(null);
  const [error, setError] = useState("");
  const { messages, streamResponse, isStreaming, setMessages } = useAISSEChat();
  const { exportRef, downloadAsImage, downloadAsText, isExporting } = useExportImage();

  const handleDateChange = (val: string) => {
    setDateInput(val);
    if (val) {
      const [y, m, d] = val.split("-");
      setForm((f) => ({ ...f, year: String(parseInt(y)), month: String(parseInt(m)), day: String(parseInt(d)) }));
    } else {
      setForm((f) => ({ ...f, year: "", month: "", day: "" }));
    }
  };

  const selectedHourInt = parseInt(form.hour);

  const handleCalculate = () => {
    setError("");
    const { year, month, day, hour, gender } = form;
    const y = parseInt(year), m = parseInt(month), d = parseInt(day), h = parseInt(hour);
    if (!dateInput || !y || !m || !d || m < 1 || m > 12 || d < 1 || d > 31) {
      setError("Vui lòng chọn ngày sinh hợp lệ.");
      return;
    }
    const lunar = solarToLunar(d, m, y);
    const res = calculateTuVi(lunar.year, lunar.month, lunar.day, h, gender);
    setResult(res);
    setSelectedCung(res.cungList[res.cungMenh]);
    setMessages([]);
  };

  const handleAI = () => {
    if (!result || !selectedCung) return;
    const context = `Lá số Tử Vi:\n- Năm sinh: ${form.year}, tháng ${form.month}, ngày ${form.day}, giờ ${form.hour}:00\n- Can năm: ${result.canNam} ${result.chiNam}\n- Mệnh cục: ${result.cuccDesc}\n- ${result.menhDesc}\n- Cung đang xem: ${selectedCung.name} (${selectedCung.diaChi})\n- Sao trong cung: ${selectedCung.stars.map(s => s.name).join(", ")}\n\nHãy luận giải chi tiết cung ${selectedCung.name} với các sao trên trong lá số Tử Vi của người này.`;
    streamResponse("/api/mysticism/ai-interpret", { type: "batu", context });
  };

  const aiText = messages.filter((m) => m.role === "assistant").map((m) => m.content).join("");

  const buildTextContent = () => {
    if (!result) return "";
    const lines = [
      `LÁ SỐ TỬ VI`,
      `Ngày sinh: ${form.day}/${form.month}/${form.year} | Giờ: ${form.hour}:00 | Giới tính: ${form.gender === "nam" ? "Nam" : "Nữ"}`,
      "",
      `MỆNH CỤC: ${result.cuccDesc} | Ngũ hành: ${result.nguHanhCuc}`,
      `Can Chi năm: ${result.canNam} ${result.chiNam}`,
      `${result.menhDesc}`,
      "",
      "12 CUNG MỆNH:",
      ...result.cungList.map((c) => {
        const stars = c.stars.map((s) => s.name).join(", ");
        return `  ${c.name} (${c.thienCan} ${c.diaChi}): ${stars || "—"}`;
      }),
      aiText ? `\nLUẬN GIẢI AI:\n${aiText}` : "",
    ];
    return lines.join("\n");
  };

  useAutoHistory(result ? {
    module: "tu-vi",
    moduleName: "Tử Vi Đẩu Số",
    title: `Tử Vi — ${form.day}/${form.month}/${form.year} giờ ${form.hour}:00 ${form.gender === "nam" ? "Nam" : "Nữ"}`,
    summary: `Mệnh cục: ${result.cuccDesc}. Ngũ hành: ${result.nguHanhCuc}. Can năm: ${result.canNam} ${result.chiNam}.`,
    result: `Ngày sinh: ${form.day}/${form.month}/${form.year} giờ ${form.hour}:00 — ${form.gender === "nam" ? "Nam" : "Nữ"}\nMệnh cục: ${result.cuccDesc} | Ngũ hành: ${result.nguHanhCuc}\n${result.menhDesc}`,
  } : null);

  useEffect(() => {
    const d = popReopenData("tu-vi");
    if (d) {
      setForm((f) => ({
        ...f,
        ...(d.ngay ? { day: String(d.ngay) } : {}),
        ...(d.thang ? { month: String(d.thang) } : {}),
        ...(d.nam ? { year: String(d.nam) } : {}),
        ...(d.gio !== undefined ? { hour: String(d.gio) } : {}),
        ...(d.gioiTinh ? { gender: d.gioiTinh as "nam" | "nu" } : {}),
      }));
    }
  }, []);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      {/* Hidden export card */}
      <div style={{ position: "absolute", left: -9999, top: 0, pointerEvents: "none", zIndex: -1 }}>
        {result && (
          <TuViExportCard
            ref={exportRef}
            result={result}
            birthInfo={`${form.day}/${form.month}/${form.year} giờ ${form.hour}:00 — ${form.gender === "nam" ? "Nam" : "Nữ"}`}
            aiText={aiText || undefined}
          />
        )}
      </div>
      <Navbar />
      <main className="flex-1 pt-20 pb-16 px-4">
        <div className="max-w-6xl mx-auto space-y-8">

          {/* Header */}
          <div className="text-center space-y-2 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <p className="text-xs uppercase tracking-[0.3em] text-primary/60">Tử Bình Mệnh Lý</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">Tử Vi Đẩu Số</h1>
            <p className="text-muted-foreground">Lập lá số Tử Vi 12 cung dựa trên ngày giờ sinh</p>
          </div>

          {/* Input Form */}
          <div className="max-w-2xl mx-auto border border-primary/25 bg-card/30 rounded-2xl p-6 space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
            <h2 className="text-lg font-semibold text-primary">Nhập thông tin</h2>

            <div className="grid sm:grid-cols-2 gap-5">
              {/* Ngày sinh — native date picker */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                  <svg className="w-4 h-4 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={1.8}/><line x1="16" y1="2" x2="16" y2="6" strokeWidth={1.8}/><line x1="8" y1="2" x2="8" y2="6" strokeWidth={1.8}/><line x1="3" y1="10" x2="21" y2="10" strokeWidth={1.8}/></svg>
                  Ngày sinh (dương lịch)
                </Label>
                <div className="relative">
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => handleDateChange(e.target.value)}
                    min="1900-01-01"
                    max={new Date().toISOString().split("T")[0]}
                    className={cn(
                      "flex h-10 w-full rounded-md border bg-background/50 px-3 py-2 pl-10 text-sm [color-scheme:dark] transition-all duration-200 outline-none",
                      dateInput ? "border-green-500/50 focus:ring-1 focus:ring-green-500/30"
                        : "border-border/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    )}
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth={1.8}/><line x1="16" y1="2" x2="16" y2="6" strokeWidth={1.8}/><line x1="8" y1="2" x2="8" y2="6" strokeWidth={1.8}/><line x1="3" y1="10" x2="21" y2="10" strokeWidth={1.8}/></svg>
                </div>
                {dateInput && (
                  <p className="text-xs text-muted-foreground">
                    Dương lịch: <span className="text-primary/80 font-medium">{form.day}/{form.month}/{form.year}</span>
                  </p>
                )}
              </div>

              {/* Giờ sinh — dropdown với Can Chi */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                  <svg className="w-4 h-4 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={1.8}/><polyline points="12 6 12 12 16 14" strokeWidth={1.8}/></svg>
                  Giờ sinh
                </Label>
                <div className="relative">
                  <select
                    value={form.hour}
                    onChange={(e) => setForm((f) => ({ ...f, hour: e.target.value }))}
                    className="flex h-10 w-full appearance-none rounded-md border border-green-500/50 bg-background/50 px-3 py-2 pl-10 pr-8 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-green-500/30 transition-all duration-200"
                  >
                    {Array.from({ length: 24 }, (_, h) => (
                      <option key={h} value={String(h)}>
                        {String(h).padStart(2, "0")}:00 — {hourToCanChi(h)}
                      </option>
                    ))}
                  </select>
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth={1.8}/><polyline points="12 6 12 12 16 14" strokeWidth={1.8}/></svg>
                  <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9" strokeWidth={1.8}/></svg>
                </div>
                <p className="text-xs text-primary/70">
                  <span className="text-primary font-semibold">✦</span> {hourToCanChi(selectedHourInt)}
                </p>
              </div>
            </div>

            {/* Giới tính */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground/80">
                <svg className="w-4 h-4 text-primary/70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></svg>
                Giới tính
              </Label>
              <div className="flex gap-3">
                {[
                  { value: "nam", label: "Nam", icon: "♂" },
                  { value: "nu", label: "Nữ", icon: "♀" },
                ].map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, gender: g.value as "nam" | "nu" }))}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg border text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2",
                      form.gender === g.value
                        ? "border-primary bg-primary/20 text-primary shadow-sm shadow-primary/20"
                        : "border-border/50 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    )}
                  >
                    <span className="text-base">{g.icon}</span>{g.label}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 flex items-center gap-1.5">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/></svg>
                {error}
              </p>
            )}
            <Button
              onClick={handleCalculate}
              disabled={!dateInput}
              className="w-full bg-primary text-primary-foreground font-semibold disabled:opacity-40"
            >
              Lập Lá Số Tử Vi
            </Button>
          </div>

          {/* Result */}
          {result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              {/* Export bar + Save */}
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <ExportDownloadBar
                  onDownloadImage={() => downloadAsImage(`tu-vi-${form.day}-${form.month}-${form.year}`)}
                  onDownloadText={() => downloadAsText(buildTextContent(), `tu-vi-${form.day}-${form.month}-${form.year}`)}
                  isExporting={isExporting}
                />
                <SaveReadingBtn
                  module="tu-vi"
                  title={`Tử Vi — ${form.day}/${form.month}/${form.year} giờ ${form.hour}:00 ${form.gender === "nam" ? "Nam" : "Nữ"}`}
                  inputData={{ ngay: form.day, thang: form.month, nam: form.year, gio: form.hour, gioiTinh: form.gender }}
                  resultData={{ menhCuc: result.cuccDesc, nguHanhCuc: result.nguHanhCuc, canNam: result.canNam, chiNam: result.chiNam }}
                />
              </div>
              {/* Summary */}
              <div className="grid sm:grid-cols-3 gap-4">
                <InfoCard label="Mệnh Cục" value={result.cuccDesc} sub={`Ngũ Hành: ${result.nguHanhCuc}`} />
                <InfoCard label="Can Chi Năm" value={`${result.canNam} ${result.chiNam}`} sub={`Cung Mệnh: ${DIA_CHI[result.cungMenh]}`} />
                <InfoCard label="Cung Thân" value={DIA_CHI[result.cungThanMenh]} sub="Cung Thân Mệnh" />
              </div>
              <p className="text-sm text-muted-foreground text-center italic">{result.menhDesc}</p>

              {/* 12 Palaces Grid */}
              <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">12 Cung Mệnh</h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {result.cungList.map((cung) => (
                    <CungCard
                      key={cung.index}
                      cung={cung}
                      isMenh={cung.index === result.cungMenh}
                      isThan={cung.index === result.cungThanMenh}
                      selected={selectedCung?.index === cung.index}
                      onClick={() => setSelectedCung(cung)}
                    />
                  ))}
                </div>
              </div>

              {/* Đại Hạn Cycles */}
              <DaiHanSection result={result} birthYear={parseInt(form.year)} gender={form.gender} />

              {/* Selected Cung Detail */}
              {selectedCung && (
                <div className="border border-primary/25 rounded-2xl p-6 bg-card/30 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">{selectedCung.thienCan} {selectedCung.diaChi} — {selectedCung.nguHanh}</div>
                      <h3 className="text-xl font-bold text-primary">Cung {selectedCung.name}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{selectedCung.desc}</p>
                    </div>
                    <Button onClick={handleAI} disabled={isStreaming}
                      className="text-xs bg-primary/20 text-primary border border-primary/40 hover:bg-primary/30 px-3 py-1.5">
                      {isStreaming ? "Đang luận giải..." : "Luận giải AI"}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {["chinh-tinh", "phu-tinh", "sat-tinh"].map((type) => {
                      const stars = selectedCung.stars.filter((s) => s.type === type);
                      if (!stars.length) return null;
                      const label = type === "chinh-tinh" ? "Chính Tinh" : type === "phu-tinh" ? "Phụ Tinh" : "Sát Tinh";
                      return (
                        <div key={type}>
                          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{label}</div>
                          <div className="space-y-2">
                            {stars.map((s) => (
                              <div key={s.name} className="flex gap-3 items-start">
                                <StarBadge name={s.name} type={s.type} />
                                <p className="text-xs text-muted-foreground leading-relaxed flex-1">{s.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AI Interpretation */}
              {messages.length > 0 && (
                <div className="border border-primary/25 rounded-2xl p-6 bg-card/30 space-y-4">
                  <h3 className="text-lg font-semibold text-primary">Luận Giải AI</h3>
                  {messages.filter((m) => m.role === "assistant").map((m, i) => (
                    <div key={i} className="text-sm text-foreground/90">
                      {!m.content && isStreaming ? (
                        <div className="flex gap-1.5">
                          {[0, 150, 300].map((d) => (
                            <span key={d} className="w-2 h-2 rounded-full bg-primary/70 animate-bounce" style={{ animationDelay: `${d}ms` }} />
                          ))}
                        </div>
                      ) : (
                        <MarkdownRenderer content={m.content} />
                      )}
                    </div>
                  ))}
                  {aiText && (
                    <ResultActions
                      module="tu-vi"
                      moduleName="Tử Vi Đẩu Số"
                      title={`Cung ${selectedCung?.name || ""} — ${form.day}/${form.month}/${form.year}`}
                      summary={`Lá số Tử Vi: ${result.cuccDesc}, Cung ${selectedCung?.name}`}
                      result={aiText}
                    />
                  )}
                </div>
              )}
            </div>
          )}
          {/* Knowledge Base */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <TuViKnowledge />
          </div>

        </div>
      </main>
    </div>
  );
}

function InfoCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="border border-primary/20 rounded-xl bg-card/30 p-4 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold text-primary mt-1">{value}</div>
      <div className="text-xs text-muted-foreground/70 mt-0.5">{sub}</div>
    </div>
  );
}
