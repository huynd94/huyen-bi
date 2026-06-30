import { useCallback, useEffect, useMemo, useState } from "react";
import { useClerk, useUser } from "@clerk/react";
import { Link, Redirect, useLocation } from "wouter";
import {
  Bookmark,
  ChartBar,
  Clock3,
  ExternalLink,
  LogOut,
  Search,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Breadcrumb } from "@/components/layout/breadcrumb";
import { ReminderSettings } from "@/components/reminder-settings";
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
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Skeleton } from "@/components/ui/skeleton";
import { isClerkEnabled } from "@/lib/auth-config";
import { ERROR_MESSAGES } from "@/lib/error-messages";
import { readingsApi, type SavedReading } from "@/lib/readings-api";
import { storeReopenData } from "@/lib/reopen-reading";
import { showToast } from "@/lib/toast";
import { cn } from "@/lib/utils";

/**
 * Bộ 15 mô-đun cố định hiển thị trong dropdown "Mô-đun" của Profile.
 *
 * Theo Requirement 14.2 yêu cầu cung cấp bộ lọc với "15 lựa chọn" tương
 * ứng với toàn bộ Module_Page. Giữ tên hiển thị tiếng Việt sentence case
 * (Req 19.1) và đồng bộ với `ROUTE_MAP` ở `breadcrumb.tsx`.
 *
 * Lưu ý: order trong object định luôn order render trong dropdown.
 */
const MODULE_LABELS: Record<string, string> = {
  "than-so-hoc": "Thần Số Học",
  "xem-ten": "Xem Tên",
  "bat-tu": "Bát Tự Tứ Trụ",
  "tu-vi": "Tử Vi Đẩu Số",
  "sao-han": "Sao Hạn Hàng Năm",
  "xem-que": "Xem Quẻ I Ching",
  "xem-ngay-tot": "Xem Ngày Tốt",
  "hop-tuoi": "Hợp Tuổi & Duyên Số",
  "lich-van-nien": "Lịch Vạn Niên",
  "lich-ca-nhan": "Lịch Cá Nhân",
  "cat-hung": "Cát Hung",
  "phong-thuy": "Phong Thuỷ Bát Trạch",
  "tu-dien": "Từ Điển Huyền Học",
  "ai-chat": "Trợ Lý AI",
  "lich-su": "Lịch Sử Tra Cứu",
};

const MODULE_FILTER_OPTIONS: ReadonlyArray<{ id: string; label: string }> =
  Object.entries(MODULE_LABELS).map(([id, label]) => ({ id, label }));

/** Số lá số tối đa được chọn để so sánh cùng lúc (Req 14.3). */
const COMPARE_LIMIT = 2 as const;

/** Thời lượng hết hạn của link chia sẻ (server set 30 ngày — xem
 * `routes/readings.ts`). Hằng số này dùng cho copy hiển thị tới user
 * theo Req 14.5. */
const SHARE_EXPIRY_DAYS = 30;

/**
 * Format ngày-giờ tiếng Việt dạng `dd/MM/yyyy HH:mm`.
 */
function formatDate(input: string | number | Date): string {
  return new Date(input).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Hook trả lại giá trị `value` sau khi user ngừng thay đổi `delayMs` ms.
 *
 * Dùng cho ô tìm kiếm trong toolbar (Req 14.2 — "ô tìm kiếm debounce
 * 300ms"). Khi `value` thay đổi liên tục, các timeout cũ bị clear nên
 * `setReadings/filter` chỉ chạy sau khi gõ ổn định.
 */
function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

/**
 * Tính URL đầy đủ tới trang `share/:token` từ token API trả về. Dùng
 * `BASE_URL` của Vite để hỗ trợ deploy dưới sub-path.
 */
function buildShareUrl(token: string): string {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
  if (typeof window === "undefined") return `${base}/share/${token}`;
  return `${window.location.origin}${base}/share/${token}`;
}

/**
 * Trang `/profile` — danh sách lá số đã lưu của user đăng nhập.
 *
 * Refactor theo Task 14.1: Breadcrumb đầu trang, single `<h1>`, grid
 * card 1/2/3/4 cột; checkbox chọn 2 lá số để so sánh trong Dialog;
 * filter mô-đun + search debounce 300ms; xoá có dialog xác nhận với
 * nút "Xoá" lần thứ hai; optimistic remove + rollback toast; widget
 * thống kê (tổng / mô-đun dùng nhiều / lần tra cứu gần nhất); chia
 * sẻ tạo link copy clipboard + toast hết hạn 30 ngày.
 *
 * Validates: Requirements 11.3, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6.
 */
export default function ProfilePage() {
  // Khi Clerk không được cấu hình, profile không có ý nghĩa — chuyển
  // user về home (Req 15.4 đã khuyến nghị banner trên sign-in/up; ở
  // đây ta đơn giản redirect về `/`).
  if (!isClerkEnabled) return <Redirect to="/" />;
  return <ProfilePageInner />;
}

interface DeletePayload {
  /** Lá số đang bị xoá để rollback nếu API lỗi. */
  reading: SavedReading;
  /** Vị trí cũ trong danh sách hiện tại — dùng để khôi phục đúng thứ tự. */
  index: number;
}

function ProfilePageInner() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [, setLocation] = useLocation();

  const [readings, setReadings] = useState<SavedReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState<string>("all");
  const [searchInput, setSearchInput] = useState<string>("");
  const debouncedSearch = useDebouncedValue(searchInput, 300);

  // Compare flow — chọn tối đa 2 lá số. Giữ Set để toggle nhanh và
  // tránh duplicate.
  const [compareIds, setCompareIds] = useState<ReadonlyArray<number>>([]);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);

  // Delete flow — `pendingDelete` lưu snapshot cho rollback (Req 11.3).
  const [pendingDelete, setPendingDelete] = useState<DeletePayload | null>(null);
  const [deleteInFlight, setDeleteInFlight] = useState(false);

  // Khi user chưa đăng nhập sau khi Clerk loaded → đẩy về sign-in
  // kèm redirect_url để quay lại sau auth.
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      const here =
        typeof window !== "undefined"
          ? `${window.location.pathname}${window.location.search}`
          : "/profile";
      setLocation(`/sign-in?redirect_url=${encodeURIComponent(here)}`);
      return;
    }
    let cancelled = false;
    setLoading(true);
    readingsApi
      .list()
      .then((rows) => {
        if (!cancelled) setReadings(rows);
      })
      .catch(() => {
        if (!cancelled) {
          showToast({
            variant: "error",
            title: "Không tải được danh sách lá số",
            description: ERROR_MESSAGES.server_error,
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // setLocation là stable từ wouter — không thêm vào deps để tránh
    // re-fetch khi router rerender.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, user]);

  /** Toggle id trong compareIds — tối đa COMPARE_LIMIT phần tử. */
  const toggleCompare = useCallback((id: number) => {
    setCompareIds((current) => {
      if (current.includes(id)) {
        return current.filter((x) => x !== id);
      }
      if (current.length >= COMPARE_LIMIT) {
        // Vượt giới hạn — không thêm thêm. Hiện toast nhẹ để user hiểu.
        showToast({
          variant: "info",
          title: `Chỉ chọn tối đa ${COMPARE_LIMIT} lá số`,
          description: "Bỏ chọn một lá số trước khi chọn lá khác.",
        });
        return current;
      }
      return [...current, id];
    });
  }, []);

  /** Mở dialog xác nhận xoá. Click trên thẻ chỉ là lần "Xoá" thứ
   * nhất; nút "Xoá" trong dialog mới là lần thứ hai (Req 14.4). */
  const requestDelete = useCallback(
    (reading: SavedReading, index: number) => {
      setPendingDelete({ reading, index });
    },
    [],
  );

  /** Lần "Xoá" thứ hai — thực thi xoá optimistic (Req 11.3, 14.4). */
  const confirmDelete = useCallback(async () => {
    if (!pendingDelete || deleteInFlight) return;
    const { reading, index } = pendingDelete;
    setDeleteInFlight(true);

    // Snapshot — đã có trong `pendingDelete`. Optimistic remove ngay.
    setReadings((rows) => rows.filter((r) => r.id !== reading.id));
    setCompareIds((ids) => ids.filter((x) => x !== reading.id));
    setPendingDelete(null);

    try {
      await readingsApi.remove(reading.id);
      showToast({
        variant: "success",
        title: "Đã xoá lá số",
        description: `"${reading.title}" đã được xoá khỏi hồ sơ.`,
      });
    } catch {
      // Rollback — chèn lại lá số vào đúng vị trí cũ và surface toast
      // lỗi tiếng Việt theo voice & tone của ERROR_MESSAGES (Req 11.3,
      // 19.3 — CTA "Thử lại").
      setReadings((rows) => {
        const next = rows.slice();
        const safeIndex = Math.min(index, next.length);
        next.splice(safeIndex, 0, reading);
        return next;
      });
      showToast({
        variant: "error",
        title: "Không thể xoá lá số",
        description: ERROR_MESSAGES.server_error,
        retry: {
          onClick: () => {
            // Đặt lại pendingDelete để user có thể bấm Xoá lần nữa
            // trong dialog xác nhận — giữ flow "lần thứ hai".
            setPendingDelete({ reading, index });
          },
        },
      });
    } finally {
      setDeleteInFlight(false);
    }
  }, [pendingDelete, deleteInFlight]);

  // ----- Derived data -----

  const filtered = useMemo(() => {
    const needle = debouncedSearch.trim().toLowerCase();
    return readings.filter((r) => {
      if (filterModule !== "all" && r.module !== filterModule) return false;
      if (!needle) return true;
      const haystack = `${r.title} ${r.notes ?? ""} ${MODULE_LABELS[r.module] ?? r.module}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [readings, filterModule, debouncedSearch]);

  const compareReadings = useMemo(
    () => readings.filter((r) => compareIds.includes(r.id)),
    [readings, compareIds],
  );

  const stats = useMemo(() => {
    if (readings.length === 0) {
      return { total: 0, topModule: null as string | null, lastLookup: null as number | null };
    }
    const counts = new Map<string, number>();
    let lastLookup = 0;
    for (const r of readings) {
      counts.set(r.module, (counts.get(r.module) ?? 0) + 1);
      const t = new Date(r.created_at).getTime();
      if (Number.isFinite(t) && t > lastLookup) lastLookup = t;
    }
    let topModule: string | null = null;
    let topCount = -1;
    for (const [m, c] of counts) {
      if (c > topCount) {
        topCount = c;
        topModule = m;
      }
    }
    return { total: readings.length, topModule, lastLookup: lastLookup || null };
  }, [readings]);

  const canCompare = compareIds.length === COMPARE_LIMIT;
  const hasFilter =
    filterModule !== "all" || debouncedSearch.trim().length > 0;

  const userInitial =
    user?.firstName?.[0] ??
    user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ??
    "U";
  const userName =
    user?.fullName ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "Tài khoản của bạn";

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin motion-reduce:animate-none" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <Navbar />

      <main
        id="main"
        tabIndex={-1}
        className="flex-1 container mx-auto px-4 pt-24 pb-16 outline-none"
      >
        <div className="max-w-7xl mx-auto space-y-8">
          <Breadcrumb />

          {/* Header — duy nhất một <h1> trên trang (Req 1.4). */}
          <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div
                aria-hidden="true"
                className="w-14 h-14 rounded-lg border border-primary/30 bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary"
              >
                {userInitial}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary/70">
                  Hồ sơ
                </p>
                <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                  {userName}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {stats.total === 0
                    ? "Chưa có lá số nào được lưu."
                    : `${stats.total} lá số đã lưu trong hồ sơ.`}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => signOut(() => setLocation("/"))}
            >
              <LogOut aria-hidden="true" />
              Đăng xuất
            </Button>
          </header>

          {/* Stats widget (Req 14.6) */}
          {stats.total > 0 && (
            <StatsWidget
              total={stats.total}
              topModule={stats.topModule}
              lastLookup={stats.lastLookup}
            />
          )}

          {/* Nhắc nhở vận hạn qua Web Push (Phase A) */}
          <ReminderSettings />

          {/* Toolbar — search + module filter + compare CTA (Req 14.2, 14.3) */}
          <section
            aria-label="Lọc và so sánh lá số"
            className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
          >
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 min-w-0">
                <Label
                  htmlFor="profile-search"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Tìm kiếm
                </Label>
                <div className="relative">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="profile-search"
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Tìm theo tên, mô-đun, ghi chú..."
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="w-full sm:w-60">
                <Label
                  htmlFor="profile-module-filter"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Mô-đun
                </Label>
                <Select value={filterModule} onValueChange={setFilterModule}>
                  <SelectTrigger id="profile-module-filter">
                    <SelectValue placeholder="Tất cả mô-đun" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả mô-đun</SelectItem>
                    {MODULE_FILTER_OPTIONS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="button"
              disabled={!canCompare}
              onClick={() => setCompareDialogOpen(true)}
              aria-describedby="profile-compare-hint"
              className="md:self-end"
            >
              So sánh
              <span
                aria-hidden="true"
                className="ml-1 text-xs opacity-80"
              >
                ({compareIds.length}/{COMPARE_LIMIT})
              </span>
            </Button>
          </section>
          <p
            id="profile-compare-hint"
            className="text-xs text-muted-foreground -mt-4"
          >
            Tích chọn đúng {COMPARE_LIMIT} lá số để mở bảng so sánh chi tiết.
          </p>

          {/* Body: loading skeleton / empty / filtered grid */}
          {loading ? (
            <ReadingGridSkeleton />
          ) : readings.length === 0 ? (
            <EmptyState
              icon={<Sparkles aria-hidden="true" />}
              title="Chưa có lá số nào trong hồ sơ"
              description="Lưu lại kết quả tra cứu yêu thích để xem lại bất cứ lúc nào, đồng bộ giữa các thiết bị."
              cta={
                <Button asChild>
                  <Link href="/">Bắt đầu tra cứu</Link>
                </Button>
              }
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="Không tìm thấy lá số phù hợp"
              description={
                hasFilter
                  ? "Thử điều chỉnh từ khoá tìm kiếm hoặc bộ lọc mô-đun."
                  : "Chưa có lá số nào khớp với lựa chọn hiện tại."
              }
              cta={
                hasFilter ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchInput("");
                      setFilterModule("all");
                    }}
                  >
                    Xoá bộ lọc
                  </Button>
                ) : null
              }
            />
          ) : (
            <ul
              role="list"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filtered.map((reading) => {
                const indexInList = readings.findIndex(
                  (r) => r.id === reading.id,
                );
                return (
                  <li key={reading.id} className="h-full">
                    <ReadingCard
                      reading={reading}
                      checked={compareIds.includes(reading.id)}
                      checkboxDisabled={
                        compareIds.length >= COMPARE_LIMIT &&
                        !compareIds.includes(reading.id)
                      }
                      onToggleCompare={() => toggleCompare(reading.id)}
                      onReopen={() => {
                        storeReopenData(reading.module, reading.input_data);
                        setLocation(`/${reading.module}`);
                      }}
                      onDelete={() => requestDelete(reading, indexInList)}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      <Footer />

      {/* Confirm delete — Req 14.4 ("Xoá" lần thứ hai trong dialog). */}
      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteInFlight) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xoá lá số khỏi hồ sơ?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `"${pendingDelete.reading.title}" sẽ bị xoá vĩnh viễn. ${ERROR_MESSAGES.delete_irreversible}`
                : ERROR_MESSAGES.delete_irreversible}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteInFlight}>Huỷ</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                // Ngăn AlertDialog tự đóng để giữ trạng thái loading
                // hiển thị tới user trong khi await API.
                event.preventDefault();
                void confirmDelete();
              }}
              disabled={deleteInFlight}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-destructive"
            >
              {deleteInFlight ? "Đang xoá..." : "Xoá"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Compare dialog — 2 cột (md+) hoặc xếp chồng (mobile) (Req 14.3). */}
      <CompareDialog
        open={compareDialogOpen && compareReadings.length === COMPARE_LIMIT}
        onOpenChange={setCompareDialogOpen}
        readings={compareReadings}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                         Stats widget (Req 14.6)                             */
/* -------------------------------------------------------------------------- */

function StatsWidget({
  total,
  topModule,
  lastLookup,
}: {
  total: number;
  topModule: string | null;
  lastLookup: number | null;
}) {
  return (
    <section
      aria-label="Thống kê lá số đã lưu"
      className="grid grid-cols-1 gap-3 sm:grid-cols-3"
    >
      <StatCard
        icon={<Bookmark aria-hidden="true" />}
        label="Tổng số lá số"
        value={String(total)}
      />
      <StatCard
        icon={<ChartBar aria-hidden="true" />}
        label="Mô-đun dùng nhiều nhất"
        value={topModule ? MODULE_LABELS[topModule] ?? topModule : "—"}
      />
      <StatCard
        icon={<Clock3 aria-hidden="true" />}
        label="Lần tra cứu gần nhất"
        value={lastLookup ? formatDate(lastLookup) : "—"}
      />
    </section>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <span className="inline-flex size-4 items-center justify-center text-primary">
          {icon}
        </span>
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Reading card                                   */
/* -------------------------------------------------------------------------- */

interface ReadingCardProps {
  reading: SavedReading;
  checked: boolean;
  checkboxDisabled: boolean;
  onToggleCompare: () => void;
  onReopen: () => void;
  onDelete: () => void;
}

/**
 * Card đại diện một lá số đã lưu.
 *
 * Bố cục theo Task 14.1: tên (h2), mô-đun (badge), ngày lưu, ghi chú,
 * action group (Mở lại / Chia sẻ / Xoá). Checkbox để compare nằm ở góc
 * phải header.
 *
 * Container `Card` dùng border + shadow-sm (Req 10.6); state `checked`
 * dùng class semantic (`border-primary` + `ring-primary/30`) — không hex.
 */
function ReadingCard({
  reading,
  checked,
  checkboxDisabled,
  onToggleCompare,
  onReopen,
  onDelete,
}: ReadingCardProps) {
  const checkboxId = `compare-${reading.id}`;
  const moduleLabel = MODULE_LABELS[reading.module] ?? reading.module;

  return (
    <Card
      className={cn(
        "h-full flex flex-col transition-colors",
        checked
          ? "border-primary ring-1 ring-primary/30 bg-primary/5"
          : "hover:border-primary/40",
      )}
    >
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {moduleLabel}
            </p>
            <h2 className="text-base font-semibold leading-tight text-foreground">
              {reading.title}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Checkbox
              id={checkboxId}
              checked={checked}
              disabled={checkboxDisabled}
              onCheckedChange={() => onToggleCompare()}
              aria-label={`Chọn so sánh: ${reading.title}`}
            />
            <Label htmlFor={checkboxId} className="sr-only">
              Chọn so sánh: {reading.title}
            </Label>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Đã lưu {formatDate(reading.created_at)}
        </p>
      </CardHeader>
      <CardContent className="flex-1 space-y-2">
        {reading.notes ? (
          <p className="text-sm italic text-muted-foreground line-clamp-3">
            &ldquo;{reading.notes}&rdquo;
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/70">
            Chưa có ghi chú cho lá số này.
          </p>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center gap-2 pb-6">
        <Button size="sm" variant="outline" onClick={onReopen}>
          <ExternalLink aria-hidden="true" />
          Mở lại
        </Button>
        <ShareButton readingId={reading.id} title={reading.title} />
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="ml-auto text-muted-foreground hover:text-destructive"
        >
          <Trash2 aria-hidden="true" />
          Xoá
        </Button>
      </CardFooter>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Share button                                   */
/* -------------------------------------------------------------------------- */

/**
 * Nút "Chia sẻ" — gọi API tạo token, copy URL vào clipboard, surface
 * toast `Đã sao chép link` kèm thông tin hết hạn 30 ngày (Req 14.5).
 *
 * Khi clipboard fail (browser block / iframe sandbox), surface toast
 * cảnh báo theo `ERROR_MESSAGES.clipboard_fail` để user copy thủ công.
 */
function ShareButton({ readingId, title }: { readingId: number; title: string }) {
  const [busy, setBusy] = useState(false);

  const handleShare = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { token } = await readingsApi.share(readingId);
      const url = buildShareUrl(token);
      try {
        await navigator.clipboard.writeText(url);
        showToast({
          variant: "success",
          title: "Đã sao chép link",
          description: `Link "${title}" sẽ hết hạn sau ${SHARE_EXPIRY_DAYS} ngày.`,
        });
      } catch {
        showToast({
          variant: "warning",
          title: ERROR_MESSAGES.clipboard_fail,
          description: url,
        });
      }
    } catch {
      showToast({
        variant: "error",
        title: "Không tạo được link chia sẻ",
        description: ERROR_MESSAGES.server_error,
        retry: {
          onClick: () => {
            void handleShare();
          },
        },
      });
    } finally {
      setBusy(false);
    }
  }, [busy, readingId, title]);

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={() => void handleShare()}
      loading={busy}
      loadingText="Đang tạo..."
    >
      <Share2 aria-hidden="true" />
      Chia sẻ
    </Button>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Compare dialog                                   */
/* -------------------------------------------------------------------------- */

/**
 * Dialog so sánh 2 lá số. Trên Breakpoint_Tablet+ render 2 cột; trên
 * mobile `grid-cols-1` để xếp chồng (Req 14.3).
 *
 * Hiển thị thông tin chính: mô-đun, tiêu đề, ngày lưu, ghi chú, và
 * bảng dữ liệu input để user đối chiếu key:value. Các key xuất hiện ở
 * cả hai lá số được hiển thị cạnh nhau; key chỉ ở một bên hiển thị
 * dấu `—` ở phía còn lại.
 */
function CompareDialog({
  open,
  onOpenChange,
  readings,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  readings: ReadonlyArray<SavedReading>;
}) {
  if (readings.length !== 2) {
    // Đảm bảo dialog không render khi danh sách chưa đủ — phòng
    // trường hợp parent set open=true sớm.
    return null;
  }
  const [a, b] = readings;
  const allKeys = useMemo(() => {
    const set = new Set<string>([
      ...Object.keys(a.input_data ?? {}),
      ...Object.keys(b.input_data ?? {}),
    ]);
    return Array.from(set);
  }, [a, b]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>So sánh lá số</DialogTitle>
          <DialogDescription>
            Đối chiếu hai lá số đã chọn để tìm điểm khác biệt giữa các
            thông số đầu vào.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[a, b].map((reading) => (
            <CompareColumn
              key={reading.id}
              reading={reading}
              allKeys={allKeys}
              other={reading.id === a.id ? b : a}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CompareColumn({
  reading,
  other,
  allKeys,
}: {
  reading: SavedReading;
  other: SavedReading;
  allKeys: ReadonlyArray<string>;
}) {
  const moduleLabel = MODULE_LABELS[reading.module] ?? reading.module;
  return (
    <article className="rounded-lg border border-primary/30 bg-card p-4 space-y-3">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          {moduleLabel}
        </p>
        <h3 className="text-base font-semibold leading-tight text-foreground">
          {reading.title}
        </h3>
        <p className="text-xs text-muted-foreground">
          Đã lưu {formatDate(reading.created_at)}
        </p>
      </header>
      <dl className="space-y-1.5 text-sm">
        {allKeys.length === 0 ? (
          <p className="text-sm text-muted-foreground">Lá số này không có thông tin đầu vào để so sánh.</p>
        ) : (
          allKeys.map((key) => {
            const own = reading.input_data?.[key];
            const opposite = other.input_data?.[key];
            const isDifferent =
              JSON.stringify(own ?? null) !== JSON.stringify(opposite ?? null);
            return (
              <div
                key={key}
                className="flex items-start justify-between gap-3 border-b border-border/40 pb-1.5"
              >
                <dt className="text-muted-foreground capitalize">{key}</dt>
                <dd
                  className={cn(
                    "text-right font-medium",
                    isDifferent ? "text-primary" : "text-foreground",
                  )}
                >
                  {own != null && own !== "" ? String(own) : "—"}
                </dd>
              </div>
            );
          })
        )}
      </dl>
      {reading.notes ? (
        <p className="text-xs italic text-muted-foreground border-t border-border/40 pt-2">
          &ldquo;{reading.notes}&rdquo;
        </p>
      ) : null}
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Loading skeleton                                   */
/* -------------------------------------------------------------------------- */

/**
 * Skeleton grid khớp layout 1/2/3/4 cột trong khi danh sách đang fetch
 * (Req 5.1). Mỗi card mô phỏng: badge mô-đun, tiêu đề, ngày, ghi chú,
 * 3 nút action.
 */
function ReadingGridSkeleton() {
  return (
    <ul
      role="list"
      aria-busy="true"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <li key={i}>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-3">
            <Skeleton aria-hidden="true" className="h-3 w-1/3" />
            <Skeleton aria-hidden="true" className="h-5 w-2/3" />
            <Skeleton aria-hidden="true" className="h-3 w-1/2" />
            <Skeleton aria-hidden="true" className="h-12 w-full" />
            <div className="flex gap-2 pt-2">
              <Skeleton aria-hidden="true" className="h-8 w-20" />
              <Skeleton aria-hidden="true" className="h-8 w-20" />
              <Skeleton aria-hidden="true" className="h-8 w-16 ml-auto" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
