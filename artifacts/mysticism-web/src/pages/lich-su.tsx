import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, Sparkles, Trash2 } from "lucide-react";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  clearHistory,
  deleteFromHistory,
  formatHistoryDate,
  loadHistory,
  type HistoryEntry,
} from "@/lib/history";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/**
 * Khoá sắp xếp khả dụng cho bảng lịch sử. Theo Requirement 14.7 ba cột
 * có thể sắp xếp là `Ngày`, `Mô-đun` và `Tiêu đề`.
 */
type SortKey = "timestamp" | "module" | "title";
type SortDir = "asc" | "desc";

interface ColumnSpec {
  key: SortKey;
  label: string;
  /** Class áp lên `<th>` để khoá độ rộng / căn lề. */
  headClassName?: string;
}

const COLUMNS: ReadonlyArray<ColumnSpec> = [
  { key: "timestamp", label: "Ngày", headClassName: "w-44" },
  { key: "module", label: "Mô-đun", headClassName: "w-44" },
  { key: "title", label: "Tiêu đề" },
];

/**
 * So sánh hai entry theo khoá đã chọn. Sắp xếp theo lexicographic
 * tiếng Việt cho `module`/`title` qua `localeCompare("vi")`; timestamp
 * dùng phép trừ số.
 *
 * Khi hai entry bằng nhau theo khoá chính, fallback theo `timestamp`
 * giảm dần để giữ thứ tự gần đây nhất ở trên — nhất quán với cách
 * `loadHistory()` lưu mảng (newest first).
 */
function compareEntries(
  a: HistoryEntry,
  b: HistoryEntry,
  key: SortKey,
  dir: SortDir,
): number {
  let cmp = 0;
  if (key === "timestamp") {
    cmp = a.timestamp - b.timestamp;
  } else if (key === "module") {
    cmp = a.moduleName.localeCompare(b.moduleName, "vi");
  } else {
    cmp = a.title.localeCompare(b.title, "vi");
  }
  if (cmp === 0) {
    cmp = a.timestamp - b.timestamp;
  }
  return dir === "asc" ? cmp : -cmp;
}

/**
 * Header có thể nhấn để sắp xếp. Dùng `<button>` lồng trong `<th>` để
 * giữ ngữ nghĩa header column và thêm affordance click/keyboard.
 *
 * - `aria-sort` phản ánh trạng thái hiện tại (`ascending`, `descending`,
 *   `none`) — screen reader có thể đọc đúng thứ tự bảng.
 * - Icon ở phải biểu thị hướng sắp xếp; khi cột không active, dùng
 *   `ArrowUpDown` ở `text-muted-foreground` để gợi ý có thể sắp xếp.
 */
function SortableHeader({
  column,
  activeKey,
  direction,
  onSort,
}: {
  column: ColumnSpec;
  activeKey: SortKey;
  direction: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const isActive = activeKey === column.key;
  const ariaSort = isActive
    ? direction === "asc"
      ? ("ascending" as const)
      : ("descending" as const)
    : ("none" as const);

  const Icon = !isActive
    ? ArrowUpDown
    : direction === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={cn(
        "h-10 px-3 text-left align-middle text-sm font-medium",
        column.headClassName,
      )}
    >
      <button
        type="button"
        onClick={() => onSort(column.key)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground",
        )}
      >
        {column.label}
        <Icon
          aria-hidden="true"
          className={cn(
            "size-3.5 shrink-0",
            isActive ? "text-primary" : "text-muted-foreground/60",
          )}
        />
      </button>
    </th>
  );
}

/**
 * Trang `/lich-su` — bảng lịch sử tra cứu được lưu trên thiết bị
 * (localStorage qua `@/lib/history`). Hiển thị Breadcrumb đầu trang,
 * một `<h1>` duy nhất, bảng có sắp xếp ba cột (ngày / mô-đun / tiêu đề),
 * bộ lọc theo mô-đun + ô tìm kiếm, và thao tác xoá hàng / xoá toàn bộ
 * với dialog xác nhận tiếng Việt.
 *
 * Không sửa storage hay API: tiếp tục dùng `loadHistory`,
 * `deleteFromHistory`, `clearHistory` không đổi.
 *
 * Validates: Requirements 14.7 (bảng có sắp xếp, bộ lọc mô-đun, xoá
 * có xác nhận); cùng các yêu cầu chéo 1.4 (h1 duy nhất), 7.4
 * (Breadcrumb), 4.1/8.4 (overflow-x-auto cho bảng trên mobile).
 */
export default function LichSuPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [moduleFilter, setModuleFilter] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);
  const [viewEntry, setViewEntry] = useState<HistoryEntry | null>(null);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const moduleOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const entry of history) {
      if (!seen.has(entry.module)) seen.set(entry.module, entry.moduleName);
    }
    return Array.from(seen.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "vi"));
  }, [history]);

  const filteredAndSorted = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const filtered = history.filter((entry) => {
      if (moduleFilter !== "all" && entry.module !== moduleFilter) return false;
      if (!needle) return true;
      return (
        entry.title.toLowerCase().includes(needle) ||
        entry.summary.toLowerCase().includes(needle) ||
        entry.moduleName.toLowerCase().includes(needle)
      );
    });
    return [...filtered].sort((a, b) => compareEntries(a, b, sortKey, sortDir));
  }, [history, moduleFilter, search, sortKey, sortDir]);

  /**
   * Toggle sort theo cột. Lần đầu nhấn cột mới: dùng hướng mặc định —
   * `desc` cho `timestamp` (mới nhất trước), `asc` cho cột chữ. Nhấn
   * lại cùng cột: đảo hướng.
   */
  function handleSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDir(nextKey === "timestamp" ? "desc" : "asc");
  }

  function handleDeleteOne(id: string) {
    const target = history.find((e) => e.id === id);
    deleteFromHistory(id);
    setHistory(loadHistory());
    setConfirmDeleteId(null);
    showToast({
      variant: "success",
      title: "Đã xoá khỏi lịch sử",
      description: target ? `"${target.title}" không còn trong danh sách.` : undefined,
    });
  }

  function handleClearAll() {
    clearHistory();
    setHistory([]);
    setConfirmClearAll(false);
    setModuleFilter("all");
    setSearch("");
    showToast({
      variant: "success",
      title: "Đã xoá toàn bộ lịch sử",
    });
  }

  const confirmDeleteEntry = confirmDeleteId
    ? history.find((e) => e.id === confirmDeleteId) ?? null
    : null;

  const totalCount = history.length;
  const filteredCount = filteredAndSorted.length;
  const hasFilter = moduleFilter !== "all" || search.trim() !== "";

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <Navbar />

      <main
        id="main"
        tabIndex={-1}
        className="flex-1 container mx-auto px-4 pt-24 pb-16 outline-none"
      >
        <div className="max-w-5xl mx-auto space-y-8">
          <Breadcrumb />

          <header className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
              Tra cứu
            </p>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight">
              Lịch sử tra cứu
            </h1>
            <p className="text-base text-muted-foreground">
              Xem lại các lần tra cứu gần đây được lưu trên thiết bị của bạn.
              Sắp xếp theo cột, lọc theo mô-đun, hoặc xoá khi không còn cần.
            </p>
          </header>

          {totalCount === 0 ? (
            <EmptyState
              icon={<Sparkles aria-hidden="true" />}
              title="Chưa có lịch sử tra cứu nào"
              description="Hãy chọn một mô-đun và bắt đầu tra cứu — kết quả sẽ tự động được lưu vào danh sách này."
              cta={
                <Button asChild>
                  <Link href="/">Bắt đầu tra cứu</Link>
                </Button>
              }
            />
          ) : (
            <>
              {/* Stats */}
              <section
                aria-label="Thống kê lịch sử"
                className="grid grid-cols-3 gap-3"
              >
                {[
                  { value: totalCount, label: "Lần tra cứu" },
                  { value: moduleOptions.length, label: "Mô-đun đã dùng" },
                  {
                    value: new Set(
                      history.map((h) =>
                        new Date(h.timestamp).toLocaleDateString("vi-VN"),
                      ),
                    ).size,
                    label: "Ngày khác nhau",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-lg border border-border bg-card p-4 text-center"
                  >
                    <div className="text-2xl font-bold text-primary">{stat.value}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </section>

              {/* Toolbar: search + module filter + clear all */}
              <section
                aria-label="Lọc lịch sử"
                className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end flex-1">
                  <div className="flex-1 min-w-0">
                    <Label
                      htmlFor="lich-su-search"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Tìm kiếm
                    </Label>
                    <Input
                      id="lich-su-search"
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Tìm theo tiêu đề, mô tả, mô-đun..."
                    />
                  </div>
                  <div className="w-full sm:w-56">
                    <Label
                      htmlFor="lich-su-module"
                      className="mb-1.5 block text-sm font-medium"
                    >
                      Mô-đun
                    </Label>
                    <Select
                      value={moduleFilter}
                      onValueChange={setModuleFilter}
                    >
                      <SelectTrigger id="lich-su-module">
                        <SelectValue placeholder="Tất cả mô-đun" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả mô-đun</SelectItem>
                        {moduleOptions.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setConfirmClearAll(true)}
                  className="md:self-end"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                  Xoá tất cả
                </Button>
              </section>

              {/* Table or filtered empty state */}
              {filteredCount === 0 ? (
                <EmptyState
                  title="Không tìm thấy kết quả phù hợp"
                  description="Thử điều chỉnh từ khoá tìm kiếm hoặc đổi mô-đun lọc."
                  cta={
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearch("");
                        setModuleFilter("all");
                      }}
                    >
                      Xoá bộ lọc
                    </Button>
                  }
                />
              ) : (
                <section
                  aria-label="Bảng lịch sử tra cứu"
                  className="rounded-lg border border-border bg-card"
                >
                  <div className="overflow-x-auto md:overflow-visible">
                    <table className="w-full caption-bottom border-collapse text-sm text-foreground">
                      <caption className="sr-only">
                        Bảng {filteredCount} lần tra cứu trong lịch sử
                        {hasFilter ? " (đã lọc)" : ""}. Nhấn vào tiêu đề cột để sắp xếp.
                      </caption>
                      <thead className="bg-muted text-muted-foreground">
                        <tr className="border-b border-border">
                          {COLUMNS.map((column) => (
                            <SortableHeader
                              key={column.key}
                              column={column}
                              activeKey={sortKey}
                              direction={sortDir}
                              onSort={handleSort}
                            />
                          ))}
                          <th
                            scope="col"
                            className="h-10 px-3 text-right text-sm font-medium w-24"
                          >
                            <span className="sr-only">Hành động</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {filteredAndSorted.map((entry) => (
                          <tr
                            key={entry.id}
                            className="border-b border-border transition-colors hover:bg-muted/50"
                          >
                            <td className="px-3 py-3 align-top text-sm text-muted-foreground whitespace-nowrap">
                              {formatHistoryDate(entry.timestamp)}
                            </td>
                            <td className="px-3 py-3 align-top text-sm text-foreground">
                              {entry.moduleName}
                            </td>
                            <td className="px-3 py-3 align-top text-sm">
                              <div className="font-medium text-foreground">
                                {entry.title}
                              </div>
                              {entry.summary ? (
                                <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                                  {entry.summary}
                                </div>
                              ) : null}
                            </td>
                            <td className="px-3 py-3 align-top text-right">
                              <div className="inline-flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Xem chi tiết: ${entry.title}`}
                                  onClick={() => setViewEntry(entry)}
                                >
                                  <Eye aria-hidden="true" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Xoá: ${entry.title}`}
                                  onClick={() => setConfirmDeleteId(entry.id)}
                                  className="text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 aria-hidden="true" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />

      {/* Confirm: delete one row */}
      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá khỏi lịch sử?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDeleteEntry
                ? `"${confirmDeleteEntry.title}" sẽ bị xoá khỏi lịch sử trên thiết bị này. Hành động này không thể hoàn tác.`
                : "Mục lịch sử sẽ bị xoá. Hành động này không thể hoàn tác."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmDeleteId) handleDeleteOne(confirmDeleteId);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xoá
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm: clear all */}
      <AlertDialog open={confirmClearAll} onOpenChange={setConfirmClearAll}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá toàn bộ lịch sử?</AlertDialogTitle>
            <AlertDialogDescription>
              Toàn bộ {totalCount} lần tra cứu được lưu trên thiết bị này sẽ
              bị xoá. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Xoá tất cả
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail viewer */}
      <Dialog
        open={viewEntry !== null}
        onOpenChange={(open) => {
          if (!open) setViewEntry(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="pr-6">
              {viewEntry?.title ?? "Chi tiết tra cứu"}
            </DialogTitle>
            <DialogDescription>
              {viewEntry
                ? `${viewEntry.moduleName} • ${formatHistoryDate(viewEntry.timestamp)}`
                : null}
            </DialogDescription>
          </DialogHeader>
          {viewEntry?.result ? (
            <div className="max-h-[60vh] overflow-y-auto rounded-md border border-border bg-muted/40 p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                {viewEntry.result}
              </pre>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {viewEntry?.summary ?? "Không có nội dung chi tiết được lưu."}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
