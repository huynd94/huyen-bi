import { useState, useEffect } from "react";
import { useUser, useClerk, Show } from "@clerk/react";
import { useLocation, Link, Redirect } from "wouter";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { AmbientBg } from "@/components/ambient-bg";
import { readingsApi, type SavedReading } from "@/lib/readings-api";
import { cn } from "@/lib/utils";
import { isClerkEnabled } from "@/lib/auth-config";
import { storeReopenData } from "@/lib/reopen-reading";

const MODULE_LABELS: Record<string, string> = {
  "than-so-hoc": "Thần Số Học",
  "bat-tu": "Bát Tự Tứ Trụ",
  "xem-que": "Xem Quẻ I Ching",
  "cat-hung": "Cát Hung",
  "lich-van-nien": "Lịch Vạn Niên",
  "tu-vi": "Tử Vi Đẩu Số",
  "phong-thuy": "Phong Thuỷ",
  "xem-ten": "Xem Tên",
  "lich-ca-nhan": "Lịch Cá Nhân",
  "tu-dien": "Từ Điển",
  "hop-tuoi": "Hợp Tuổi",
  "xem-ngay-tot": "Xem Ngày Tốt",
  "sao-han": "Sao Hạn",
  "ai-chat": "Trợ lý AI",
};

const MODULE_COLORS: Record<string, string> = {
  "than-so-hoc": "text-amber-400",
  "bat-tu": "text-violet-400",
  "xem-que": "text-emerald-400",
  "cat-hung": "text-rose-400",
  "tu-vi": "text-indigo-400",
  "phong-thuy": "text-teal-400",
  "hop-tuoi": "text-pink-400",
  "xem-ngay-tot": "text-yellow-400",
  "sao-han": "text-purple-400",
};

function formatDate(s: string) {
  return new Date(s).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function CopyShareBtn({ readingId }: { readingId: number }) {
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    setCopying(true);
    try {
      const { token } = await readingsApi.share(readingId);
      const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
      const url = `${window.location.origin}${base}/share/${token}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
    } finally {
      setCopying(false);
    }
  }

  return (
    <button
      onClick={handleShare}
      disabled={copying}
      className={cn(
        "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border transition-all",
        copied ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10" : "border-primary/25 text-primary/70 hover:border-primary hover:text-primary",
      )}
    >
      {copied ? "Đã copy link!" : copying ? "..." : "Chia sẻ"}
    </button>
  );
}

function ReadingCard({
  reading,
  onDelete,
  compareMode,
  selected,
  onToggleCompare,
}: {
  reading: SavedReading;
  onDelete: (id: number) => void;
  compareMode: boolean;
  selected: boolean;
  onToggleCompare: (id: number) => void;
}) {
  const [, setLocation] = useLocation();
  const [deleting, setDeleting] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState(reading.notes ?? "");
  const [savingNote, setSavingNote] = useState(false);

  async function handleDelete() {
    if (!confirm("Xóa lá số này?")) return;
    setDeleting(true);
    try {
      await readingsApi.remove(reading.id);
      onDelete(reading.id);
    } catch {
      setDeleting(false);
    }
  }

  async function handleSaveNote() {
    setSavingNote(true);
    try {
      await readingsApi.update(reading.id, { notes: note });
      setEditingNote(false);
    } finally {
      setSavingNote(false);
    }
  }

  const color = MODULE_COLORS[reading.module] ?? "text-primary";

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 space-y-3 transition-all duration-200",
        selected && compareMode
          ? "border-primary/60 bg-primary/8 ring-1 ring-primary/30"
          : "border-border/50 bg-card hover:border-primary/30",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-xs font-semibold uppercase tracking-widest", color)}>
              {MODULE_LABELS[reading.module] ?? reading.module}
            </span>
            <span className="text-[10px] text-muted-foreground/50">{formatDate(reading.created_at)}</span>
          </div>
          <h3 className="font-semibold text-foreground mt-1 truncate">{reading.title}</h3>
        </div>
        {compareMode && (
          <button
            onClick={() => onToggleCompare(reading.id)}
            className={cn(
              "shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
              selected ? "border-primary bg-primary" : "border-border/60 hover:border-primary/60",
            )}
          >
            {selected && (
              <svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        )}
      </div>

      {Object.keys(reading.input_data).length > 0 && (
        <div className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2 space-y-0.5">
          {Object.entries(reading.input_data).slice(0, 4).map(([k, v]) => (
            <div key={k}><span className="text-muted-foreground/60">{k}:</span> {String(v)}</div>
          ))}
        </div>
      )}

      {editingNote ? (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="w-full text-sm bg-muted/30 border border-border/50 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-primary/50"
            placeholder="Ghi chú cá nhân..."
          />
          <div className="flex gap-2">
            <button onClick={handleSaveNote} disabled={savingNote} className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90">
              {savingNote ? "Lưu..." : "Lưu ghi chú"}
            </button>
            <button onClick={() => setEditingNote(false)} className="px-3 py-1 rounded-lg border border-border/50 text-xs text-muted-foreground hover:text-foreground">
              Hủy
            </button>
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground/70 italic cursor-pointer hover:text-muted-foreground" onClick={() => setEditingNote(true)}>
          {reading.notes ? `"${reading.notes}"` : "Thêm ghi chú..."}
        </div>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => {
            storeReopenData(reading.module, reading.input_data);
            setLocation(`/${reading.module}`);
          }}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border border-primary/25 text-primary/70 hover:border-primary hover:text-primary transition-all"
        >
          Mở lại
        </button>
        <CopyShareBtn readingId={reading.id} />
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs border border-red-500/20 text-red-400/60 hover:border-red-500/50 hover:text-red-400 transition-all"
        >
          {deleting ? "..." : "Xóa"}
        </button>
      </div>
    </div>
  );
}

function ComparePanel({ readings }: { readings: SavedReading[] }) {
  if (readings.length < 2) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Chọn 2 lá số để so sánh
      </div>
    );
  }
  const [a, b] = readings;
  const allKeys = Array.from(new Set([...Object.keys(a.input_data), ...Object.keys(b.input_data)]));

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {[a, b].map((r) => (
        <div key={r.id} className="rounded-2xl border border-primary/25 bg-primary/5 p-5 space-y-3">
          <div>
            <p className={cn("text-xs font-semibold uppercase tracking-widest", MODULE_COLORS[r.module] ?? "text-primary")}>
              {MODULE_LABELS[r.module] ?? r.module}
            </p>
            <h3 className="text-lg font-bold mt-1">{r.title}</h3>
            <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
          </div>
          <div className="space-y-1.5">
            {allKeys.map((k) => (
              <div key={k} className="flex justify-between text-sm border-b border-border/20 pb-1">
                <span className="text-muted-foreground">{k}</span>
                <span className={cn("font-medium", (a.input_data[k] !== b.input_data[k]) ? "text-primary" : "text-foreground")}>
                  {r.input_data[k] != null ? String(r.input_data[k]) : "—"}
                </span>
              </div>
            ))}
          </div>
          {r.notes && (
            <p className="text-xs text-muted-foreground/70 italic">&ldquo;{r.notes}&rdquo;</p>
          )}
        </div>
      ))}
    </div>
  );
}

export default function ProfilePage() {
  if (!isClerkEnabled) return <Redirect to="/" />;
  return <ProfilePageInner />;
}

function ProfilePageInner() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();
  const [readings, setReadings] = useState<SavedReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [tab, setTab] = useState<"readings" | "compare">("readings");

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) { setLocation("/sign-in"); return; }
    readingsApi.list().then(setReadings).catch(() => {}).finally(() => setLoading(false));
  }, [isLoaded, user]);

  function handleDelete(id: number) {
    setReadings((r) => r.filter((x) => x.id !== id));
    setCompareIds((ids) => ids.filter((x) => x !== id));
  }

  function toggleCompare(id: number) {
    setCompareIds((ids) => {
      if (ids.includes(id)) return ids.filter((x) => x !== id);
      if (ids.length >= 2) return [ids[1], id];
      return [...ids, id];
    });
  }

  const modules = Array.from(new Set(readings.map((r) => r.module)));
  const filtered = readings.filter((r) => {
    if (filter !== "all" && r.module !== filter) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const compareReadings = readings.filter((r) => compareIds.includes(r.id));

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <AmbientBg />
      <Navbar />

      <div className="relative z-10 flex-1 max-w-5xl mx-auto w-full px-4 pt-24 pb-16">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl border border-primary/30 bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
              {user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {user?.fullName ?? user?.emailAddresses?.[0]?.emailAddress}
              </h1>
              <p className="text-sm text-muted-foreground">
                {readings.length} lá số đã lưu
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut(() => setLocation("/"))}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border/50 text-sm text-muted-foreground hover:border-red-500/40 hover:text-red-400 transition-all"
          >
            Đăng xuất
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/30 w-fit mb-8 border border-border/30">
          {(["readings", "compare"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-5 py-2 rounded-lg text-sm font-medium transition-all",
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t === "readings" ? `Lá Số Đã Lưu (${readings.length})` : `So Sánh (${compareIds.length}/2)`}
            </button>
          ))}
        </div>

        {tab === "readings" && (
          <>
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm lá số..."
                className="flex-1 px-4 py-2 rounded-xl border border-border/50 bg-muted/30 text-sm focus:outline-none focus:border-primary/50"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 rounded-xl border border-border/50 bg-background text-sm focus:outline-none focus:border-primary/50"
              >
                <option value="all">Tất cả module</option>
                {modules.map((m) => (
                  <option key={m} value={m}>{MODULE_LABELS[m] ?? m}</option>
                ))}
              </select>
              <button
                onClick={() => { setCompareMode((v) => !v); setCompareIds([]); }}
                className={cn(
                  "px-4 py-2 rounded-xl border text-sm font-medium transition-all",
                  compareMode ? "border-primary bg-primary/15 text-primary" : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary",
                )}
              >
                {compareMode ? "Thoát so sánh" : "So sánh"}
              </button>
            </div>

            {compareMode && compareIds.length > 0 && (
              <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/8 border border-primary/20 text-sm">
                <span className="text-primary font-medium">Đã chọn {compareIds.length}/2</span>
                {compareIds.length === 2 && (
                  <button onClick={() => setTab("compare")} className="ml-auto px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90">
                    Xem so sánh →
                  </button>
                )}
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="text-center py-20 space-y-4">
                <div className="text-5xl text-primary/20">◈</div>
                <p className="text-muted-foreground">
                  {readings.length === 0 ? "Bạn chưa lưu lá số nào." : "Không tìm thấy kết quả."}
                </p>
                {readings.length === 0 && (
                  <Link href="/">
                    <button className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-all">
                      Bắt đầu tra cứu
                    </button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {filtered.map((r) => (
                  <ReadingCard
                    key={r.id}
                    reading={r}
                    onDelete={handleDelete}
                    compareMode={compareMode}
                    selected={compareIds.includes(r.id)}
                    onToggleCompare={toggleCompare}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "compare" && (
          <div className="space-y-6">
            {compareIds.length < 2 ? (
              <div className="text-center py-12 space-y-3">
                <p className="text-muted-foreground">Vào tab <strong>Lá Số Đã Lưu</strong>, bật chế độ so sánh và chọn 2 lá số.</p>
                <button onClick={() => setTab("readings")} className="px-4 py-2 rounded-xl border border-primary/30 text-primary text-sm hover:bg-primary/10 transition-all">
                  Quay lại chọn
                </button>
              </div>
            ) : (
              <ComparePanel readings={compareReadings} />
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
