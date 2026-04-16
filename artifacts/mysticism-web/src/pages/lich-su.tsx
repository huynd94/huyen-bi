import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { loadHistory, deleteFromHistory, clearHistory, formatHistoryDate, type HistoryEntry } from "@/lib/history";
import { Link } from "wouter";

const MODULE_ICONS: Record<string, string> = {
  "than-so-hoc": "九",
  "bat-tu": "乾",
  "xem-que": "☰",
  "cat-hung": "八",
  "lich-van-nien": "曆",
  "tu-vi": "紫",
  "phong-thuy": "羅",
  "xem-ten": "名",
  "lich-ca-nhan": "運",
  "tu-dien": "典",
  "hop-tuoi": "♡",
  "sao-han": "★",
  "xem-ngay-tot": "📅",
};

const MODULE_COLORS: Record<string, string> = {
  "than-so-hoc": "text-amber-400 bg-amber-500/10 border-amber-500/30",
  "bat-tu": "text-violet-400 bg-violet-500/10 border-violet-500/30",
  "xem-que": "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  "cat-hung": "text-rose-400 bg-rose-500/10 border-rose-500/30",
  "lich-van-nien": "text-teal-400 bg-teal-500/10 border-teal-500/30",
  "tu-vi": "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
  "phong-thuy": "text-lime-400 bg-lime-500/10 border-lime-500/30",
  "xem-ten": "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30",
  "lich-ca-nhan": "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
  "hop-tuoi": "text-rose-400 bg-rose-500/10 border-rose-500/30",
  "sao-han": "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
};

function HistoryItem({ entry, onDelete }: { entry: HistoryEntry; onDelete: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const icon = MODULE_ICONS[entry.module] ?? "◈";
  const colorCls = MODULE_COLORS[entry.module] ?? "text-primary bg-primary/10 border-primary/30";

  return (
    <div className="rounded-xl border border-border/25 bg-card/20 overflow-hidden hover:border-primary/25 transition-all">
      <div className="flex items-start gap-3 p-4">
        <div className={cn("w-10 h-10 rounded-xl border flex items-center justify-center text-base font-bold shrink-0 font-serif", colorCls)}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground/90 truncate">{entry.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{entry.moduleName} • {formatHistoryDate(entry.timestamp)}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => setExpanded(v => !v)}
                className="text-xs px-2 py-1 rounded-lg border border-border/30 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
                {expanded ? "Thu gọn" : "Xem"}
              </button>
              <button onClick={onDelete} className="w-7 h-7 rounded-lg border border-border/30 flex items-center justify-center text-muted-foreground hover:text-red-400 hover:border-red-400/30 transition-all">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/70 mt-1.5 line-clamp-2">{entry.summary}</p>
        </div>
      </div>
      {expanded && entry.result && (
        <div className="border-t border-border/20 px-4 py-3 bg-background/20">
          <pre className="text-xs text-foreground/70 whitespace-pre-wrap leading-relaxed font-sans">{entry.result}</pre>
        </div>
      )}
    </div>
  );
}

export default function LichSuPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const handleDelete = (id: string) => {
    deleteFromHistory(id);
    setHistory(loadHistory());
  };

  const handleClear = () => {
    if (!confirmClear) { setConfirmClear(true); setTimeout(() => setConfirmClear(false), 3000); return; }
    clearHistory();
    setHistory([]);
    setConfirmClear(false);
  };

  const modules = Array.from(new Set(history.map(h => h.module)));
  const filtered = history.filter(h => {
    if (filter !== "all" && h.module !== filter) return false;
    if (search && !h.title.toLowerCase().includes(search.toLowerCase()) && !h.summary.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/8 via-background to-background pointer-events-none" />
      <Navbar />
      <main className="flex-1 container mx-auto px-4 pt-24 pb-16 z-10 relative">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <p className="text-xs tracking-[0.3em] uppercase text-primary/60">Tra cứu</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground drop-shadow-md">Lịch Sử Tra Cứu</h1>
            <p className="text-muted-foreground text-lg">Xem lại các lần tra cứu gần đây được lưu trên thiết bị của bạn.</p>
          </div>

          {history.length === 0 ? (
            <Card className="bg-card/40 backdrop-blur-sm border-primary/20 text-center py-16 space-y-4">
              <div className="text-5xl text-primary/20">◈</div>
              <p className="text-muted-foreground">Chưa có lịch sử tra cứu nào.</p>
              <Link href="/">
                <Button variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">Bắt đầu tra cứu</Button>
              </Link>
            </Card>
          ) : (
            <>
              {/* Filter + search bar */}
              <div className="space-y-3">
                <div className="relative">
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm kiếm trong lịch sử..."
                    className="flex h-10 w-full rounded-xl border border-border/40 bg-background/50 px-4 py-2 pl-10 text-sm outline-none focus:border-primary/50 transition-all" />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" strokeWidth={2}/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35"/></svg>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={() => setFilter("all")} className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all", filter === "all" ? "border-primary bg-primary/20 text-primary" : "border-border/40 text-muted-foreground hover:border-primary/30")}>Tất cả ({history.length})</button>
                  {modules.map(m => {
                    const count = history.filter(h => h.module === m).length;
                    const colorCls = MODULE_COLORS[m] ?? "text-primary border-primary/30";
                    return (
                      <button key={m} onClick={() => setFilter(m)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                        filter === m ? `border-current ${colorCls} bg-current/5` : "border-border/40 text-muted-foreground hover:border-primary/30")}>
                        {history.find(h => h.module === m)?.moduleName} ({count})
                      </button>
                    );
                  })}
                  <div className="flex-1" />
                  <Button variant="outline" size="sm" onClick={handleClear}
                    className={cn("text-xs border-border/40 transition-all", confirmClear ? "border-red-400/60 text-red-400 hover:bg-red-400/10" : "text-muted-foreground hover:text-red-400 hover:border-red-400/30")}>
                    {confirmClear ? "Nhấn lần nữa để xóa tất cả" : "Xóa tất cả"}
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { val: history.length, label: "Lần tra cứu" },
                  { val: modules.length, label: "Chức năng dùng" },
                  { val: new Set(history.map(h => new Date(h.timestamp).toLocaleDateString())).size, label: "Ngày khác nhau" },
                ].map(s => (
                  <div key={s.label} className="text-center p-3 rounded-xl border border-border/20 bg-card/20">
                    <div className="text-2xl font-bold text-primary">{s.val}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* History list */}
              <div className="space-y-3">
                {filtered.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="text-4xl text-primary/15">◇</div>
                    <p className="text-muted-foreground text-sm">Không tìm thấy kết quả phù hợp.</p>
                    <button onClick={() => { setSearch(""); setFilter("all"); }} className="text-xs text-primary/60 hover:text-primary underline underline-offset-2 transition-colors">Xóa bộ lọc</button>
                  </div>
                ) : (
                  filtered.map(entry => (
                    <HistoryItem key={entry.id} entry={entry} onDelete={() => handleDelete(entry.id)} />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
