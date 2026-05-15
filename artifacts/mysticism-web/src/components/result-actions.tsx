import {
  Suspense,
  lazy,
  useCallback,
  useRef,
  useState,
} from "react";
import { Bookmark, Check, Download, FileImage, FileText, Share2 } from "lucide-react";

import { saveToHistory } from "@/lib/history";
import { showToast } from "@/lib/toast";
import { ERROR_MESSAGES } from "@/lib/error-messages";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LocalErrorBoundary } from "@/components/root-error-boundary";

/**
 * Props của {@link ResultActions}.
 *
 * Component hiện 3 nút chính trên Result_Card: **Lưu**, **Chia sẻ**,
 * **Xuất** (Requirement 8.6). Nút "Xuất" mở `DropdownMenu` chứa các
 * mục PNG / PDF / TXT — đây cũng là layout dùng trên mobile để gộp
 * action phụ vào một dropdown duy nhất, tránh tràn hàng button.
 *
 * Tất cả nội dung text consumer truyền vào (`title`, `summary`,
 * `result`) đều là plain text. Chúng KHÔNG bao giờ được render qua
 * `dangerouslySetInnerHTML`, không bao giờ được nội suy vào HTML
 * template — chỉ qua `textContent` (trong JSX) hoặc `Blob` UTF-8
 * (cho file `.txt`).
 */
interface ResultActionsProps {
  /** Slug module, dùng cho `saveToHistory`. */
  module: string;
  /** Tên mô-đun đầy đủ (ví dụ "Tử Vi Đẩu Số"). */
  moduleName: string;
  /** Tiêu đề lá số / kết quả. */
  title: string;
  /** Mô tả ngắn 1–2 câu, dùng cho Web Share `text`. */
  summary: string;
  /** Nội dung kết quả (text thuần, đã chèn newline). */
  result: string;
  /** Class container ngoài cùng. */
  className?: string;
}

/**
 * Tham số cho {@link buildPrintDocument}.
 *
 * `dateLabel` được consumer cấp ngoài để builder là hàm thuần — dễ
 * test mà không phải mock `Date.now()`. Pattern đã có từ trước
 * remediation; giữ nguyên signature để không break test
 * `test:result-actions` đăng ký trong `package.json`.
 */
export interface PrintDocumentOptions {
  title: string;
  moduleName: string;
  result: string;
  /**
   * Rendered meta-row date (locale string). Injected to keep
   * `buildPrintDocument` a pure function that is trivial to reason
   * about in tests.
   */
  dateLabel: string;
}

/**
 * Populate `doc` with the print-view markup imperatively.
 *
 * Every user-supplied string (`title`, `moduleName`, `result`) flows
 * through `textContent` or the DOM-native `document.title` setter —
 * never through `innerHTML`, a raw HTML template, or `document.write`.
 * This closes the XSS vector that existed in the prior `document.write`
 * template (post-opus-audit-remediation design §3 / H1).
 *
 * Exported because `package.json` script `test:result-actions` runs
 * `tsx src/components/result-actions.test.ts` and needs to exercise
 * the builder against a mock document without spinning up a DOM
 * environment. The runtime click handler in {@link ResultActions}
 * still wraps this behind a `window.open` call and a
 * `printWindow.opener = null` detachment.
 */
export function buildPrintDocument(doc: Document, opts: PrintDocumentOptions): void {
  const { title, moduleName, result, dateLabel } = opts;

  doc.documentElement.lang = "vi";

  const head = doc.head;
  while (head.firstChild) head.removeChild(head.firstChild);

  const metaCharset = doc.createElement("meta");
  metaCharset.setAttribute("charset", "UTF-8");
  head.appendChild(metaCharset);

  // `document.title` is a DOM-native setter — the browser creates a
  // text node, so no HTML interpretation occurs. No `escapeHtml` needed.
  doc.title = `${title} — Huyền Bí`;

  const style = doc.createElement("style");
  style.textContent = [
    "body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #1a0a00; line-height: 1.8; }",
    "h1 { font-size: 1.6rem; border-bottom: 2px solid #b8860b; padding-bottom: 8px; color: #5c3a00; }",
    ".meta { color: #666; font-size: 0.85rem; margin-bottom: 20px; }",
    ".content { white-space: pre-wrap; }",
    ".watermark { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 0.75rem; color: #999; text-align: center; }",
  ].join("\n");
  head.appendChild(style);

  const body = doc.body;
  while (body.firstChild) body.removeChild(body.firstChild);

  const h1 = doc.createElement("h1");
  h1.textContent = title;
  body.appendChild(h1);

  const metaRow = doc.createElement("div");
  metaRow.className = "meta";
  metaRow.textContent = `Huyền Bí — ${moduleName} — ${dateLabel}`;
  body.appendChild(metaRow);

  // `white-space: pre-wrap` in the stylesheet preserves newlines, so a
  // plain `textContent` assignment renders the reading exactly as typed
  // without giving the browser a chance to parse any `<` as a tag start.
  const content = doc.createElement("div");
  content.className = "content";
  content.textContent = result;
  body.appendChild(content);

  const watermark = doc.createElement("div");
  watermark.className = "watermark";
  watermark.textContent = "Huyền Bí · Mọi luận giải chỉ mang tính tham khảo";
  body.appendChild(watermark);
}

/**
 * Lazy-loaded export card — chunk này chỉ tải khi user mở dropdown
 * "Xuất" và bấm PNG hoặc PDF. Wrap qua `React.lazy` thoả Requirement
 * 11.1 (lazy `export-card-*` qua `React.lazy` + `Suspense`).
 *
 * Ref được forward thẳng tới `<div>` bên trong card (xem
 * `result-actions-export-card.tsx`) để `html2canvas` rasterize được.
 */
const LazyExportCard = lazy(() => import("./result-actions-export-card"));

/**
 * Format `dd/MM/yyyy HH:mm` cho tên file và meta. Tách ra hàm thuần
 * để tránh ràng buộc với `toLocaleDateString` khi test.
 */
function formatExportDate(now: Date): string {
  return now.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Chuẩn hoá tên file: bỏ dấu, lowercase, thay khoảng trắng bằng `-`. */
function slugifyForFilename(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "ket-qua";
}

/**
 * Hành động trên Result_Card: Lưu, Chia sẻ, Xuất (PNG / PDF / TXT).
 *
 * - **Requirement 8.6** — 3 nút chính cố định ở cuối Result_Card; nút
 *   "Xuất" gộp PNG/PDF/TXT vào một `DropdownMenu` để giữ nhịp action
 *   group ngay cả trên mobile (đáp ứng yêu cầu "trên mobile gộp Xuất
 *   thành dropdown PNG/PDF/TXT").
 * - **Requirement 11.1** — `html2canvas` và `jspdf` được import động
 *   bằng `await import(...)` trong handler (chỉ tải khi user thực sự
 *   xuất); export-card render qua `React.lazy` + `Suspense`. Không
 *   chunk nào nằm trong bundle khởi động.
 * - **Requirement 1.1 / 2.1** — không hex / rgb hard-code trong JSX,
 *   mọi màu lấy từ Color_Token (`Button` primitive + class semantic
 *   `text-muted-foreground` / `border-border`).
 * - **Requirement 4.3** — `Button` size mặc định đảm bảo
 *   `min-h: 44px` cho tap target trên mobile.
 *
 * `handlePrint` (in / "Lưu PDF" của trình duyệt) vẫn được giữ làm
 * fallback an toàn khi user click PDF nhưng `html2canvas` thất bại
 * (ví dụ thiết bị thiếu Canvas) — gọi {@link buildPrintDocument} để
 * mở print preview an toàn không-XSS.
 *
 * @example
 * ```tsx
 * <ResultActions
 *   module="tu-vi"
 *   moduleName="Tử Vi Đẩu Số"
 *   title="Tử Vi — 12/03/1990 giờ Tý"
 *   summary="Mệnh cục: Mộc tam cục"
 *   result="..."
 * />
 * ```
 *
 * Validates: Requirements 8.6, 11.1.
 */
export function ResultActions({
  module,
  moduleName,
  title,
  summary,
  result,
  className = "",
}: ResultActionsProps) {
  const [saved, setSaved] = useState(false);
  // `mountExportCard === true` chỉ khi user vừa kích hoạt PNG hoặc
  // PDF — chuyển sang state này gây React.lazy chunk được fetch và
  // export-card render off-screen vừa đủ lâu để rasterize.
  const [mountExportCard, setMountExportCard] = useState(false);
  const [busyExport, setBusyExport] = useState<"png" | "pdf" | null>(null);

  const exportCardRef = useRef<HTMLDivElement | null>(null);

  /**
   * Đợi `LazyExportCard` mount + render xong vào DOM thực. Vì chunk
   * có thể chưa tải, ta poll ref tới khi xuất hiện (giới hạn 4s tránh
   * deadlock nếu chunk fail). Khi `Suspense` resolve, React commit
   * và `exportCardRef.current` sẽ trỏ tới `<div>` trong card.
   */
  const waitForExportCard = useCallback(async (): Promise<HTMLDivElement> => {
    setMountExportCard(true);
    const start = Date.now();
    while (Date.now() - start < 4000) {
      const el = exportCardRef.current;
      if (el && el.isConnected) return el;
      // Yield một frame để Suspense có cơ hội resolve và React commit.
      await new Promise<void>((resolve) => {
        if (typeof requestAnimationFrame === "function") {
          requestAnimationFrame(() => resolve());
        } else {
          setTimeout(resolve, 16);
        }
      });
    }
    throw new Error("Export card mount timed out");
  }, []);

  const dateLabel = formatExportDate(new Date());
  const baseFilename = `huyen-bi-${slugifyForFilename(module)}-${slugifyForFilename(title)}`;

  const handleSave = useCallback(() => {
    saveToHistory({ module, moduleName, title, summary, result });
    setSaved(true);
    showToast({
      variant: "success",
      title: "Đã lưu vào lịch sử",
      durationMs: 3000,
    });
    setTimeout(() => setSaved(false), 2000);
  }, [module, moduleName, title, summary, result]);

  const handleShare = useCallback(async () => {
    const shareData = {
      title: `${title} — Huyền Bí`,
      text: summary,
      url: typeof window !== "undefined" ? window.location.href : "",
    };
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    if (nav?.share && (!nav.canShare || nav.canShare(shareData))) {
      try {
        await nav.share(shareData);
        return;
      } catch {
        // user cancelled → silently fall through to clipboard
      }
    }
    // Fallback: copy URL + summary to clipboard.
    const fallbackText = `${title}\n${"─".repeat(40)}\n${summary}\n${shareData.url}`;
    try {
      await nav?.clipboard?.writeText(fallbackText);
      showToast({
        variant: "success",
        title: "Đã sao chép link",
        description: "Link kết quả đã được sao chép vào bộ nhớ tạm.",
      });
    } catch {
      showToast({
        variant: "warning",
        title: "Không thể chia sẻ",
        description: ERROR_MESSAGES.clipboard_fail,
      });
    }
  }, [title, summary]);

  const handleDownloadText = useCallback(() => {
    try {
      const text = `${title}\n${"─".repeat(40)}\n${result}\n\n— Huyền Bí · ${moduleName} · ${dateLabel}`;
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${baseFilename}.txt`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast({ variant: "success", title: "Đã xuất file văn bản" });
    } catch {
      showToast({
        variant: "error",
        title: "Không thể xuất TXT",
        description: ERROR_MESSAGES.server_error,
      });
    }
  }, [title, result, moduleName, dateLabel, baseFilename]);

  const handleDownloadImage = useCallback(async () => {
    if (busyExport !== null) return;
    setBusyExport("png");
    try {
      const el = await waitForExportCard();
      // Lazy-load html2canvas — chunk chỉ vào bundle khi user click PNG
      // (Requirement 11.1).
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(el, {
        backgroundColor: "#0d0818",
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });
      const link = document.createElement("a");
      link.download = `${baseFilename}.png`;
      link.href = canvas.toDataURL("image/png");
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast({ variant: "success", title: "Đã xuất PNG" });
    } catch (err) {
      console.error("PNG export failed:", err);
      showToast({
        variant: "error",
        title: "Không thể xuất PNG",
        description: ERROR_MESSAGES.server_error,
      });
    } finally {
      setBusyExport(null);
      // Card có thể tiếp tục mount để lần xuất tiếp theo nhanh hơn.
    }
  }, [busyExport, baseFilename, waitForExportCard]);

  const handleDownloadPdf = useCallback(async () => {
    if (busyExport !== null) return;
    setBusyExport("pdf");
    try {
      const el = await waitForExportCard();
      // Lazy-load html2canvas + jspdf cùng nhau (Requirement 11.1).
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(el, {
        backgroundColor: "#0d0818",
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdfW = 210;
      const pdfH = (canvas.height / canvas.width) * pdfW;
      const pdf = new jsPDF({
        orientation: pdfH > pdfW ? "portrait" : "landscape",
        unit: "mm",
        format: [pdfW, pdfH],
      });
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`${baseFilename}.pdf`);
      showToast({ variant: "success", title: "Đã xuất PDF" });
    } catch (err) {
      console.error("PDF export failed:", err);
      // Fallback an toàn khi html2canvas/jspdf fail: mở print preview
      // qua `buildPrintDocument` (no-XSS), user có thể "Lưu dưới dạng PDF".
      try {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.opener = null;
          buildPrintDocument(printWindow.document, {
            title,
            moduleName,
            result,
            dateLabel,
          });
          printWindow.print();
        } else {
          showToast({
            variant: "error",
            title: "Không thể xuất PDF",
            description: ERROR_MESSAGES.server_error,
          });
        }
      } catch {
        showToast({
          variant: "error",
          title: "Không thể xuất PDF",
          description: ERROR_MESSAGES.server_error,
        });
      }
    } finally {
      setBusyExport(null);
    }
  }, [busyExport, baseFilename, dateLabel, moduleName, result, title, waitForExportCard]);

  const isExporting = busyExport !== null;

  return (
    <>
      <div
        className={cn(
          "flex flex-wrap items-center justify-stretch gap-2 md:justify-end",
          className,
        )}
        data-slot="result-actions"
      >
        <Button
          type="button"
          variant={saved ? "secondary" : "default"}
          onClick={handleSave}
          aria-pressed={saved}
          aria-label={saved ? "Đã lưu vào lịch sử" : "Lưu lá số vào lịch sử"}
        >
          {saved ? (
            <Check aria-hidden="true" />
          ) : (
            <Bookmark aria-hidden="true" />
          )}
          <span>{saved ? "Đã lưu" : "Lưu"}</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void handleShare();
          }}
          aria-label="Chia sẻ kết quả"
        >
          <Share2 aria-hidden="true" />
          <span>Chia sẻ</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="outline"
              loading={isExporting}
              loadingText={busyExport === "pdf" ? "Đang xuất PDF…" : "Đang xuất PNG…"}
              aria-label="Xuất kết quả"
            >
              <Download aria-hidden="true" />
              <span>Xuất</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[10rem]">
            <DropdownMenuItem
              onSelect={() => {
                void handleDownloadImage();
              }}
              disabled={isExporting}
            >
              <FileImage aria-hidden="true" />
              <span>Xuất PNG</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                void handleDownloadPdf();
              }}
              disabled={isExporting}
            >
              <FileText aria-hidden="true" />
              <span>Xuất PDF</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                handleDownloadText();
              }}
            >
              <FileText aria-hidden="true" />
              <span>Xuất TXT</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {mountExportCard ? (
        // Off-screen mount target for html2canvas. Wrapper is
        // aria-hidden so screen readers don't double-announce content,
        // and `pointer-events: none` keeps it from intercepting clicks.
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: -99999,
            top: 0,
            pointerEvents: "none",
            zIndex: -1,
          }}
        >
          <LocalErrorBoundary>
            <Suspense fallback={null}>
              <LazyExportCard
                ref={exportCardRef}
                title={title}
                moduleName={moduleName}
                result={result}
                dateLabel={dateLabel}
              />
            </Suspense>
          </LocalErrorBoundary>
        </div>
      ) : null}
    </>
  );
}
