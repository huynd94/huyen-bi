import { forwardRef } from "react";

/**
 * Props của {@link ResultActionsExportCard}.
 *
 * Tất cả là plain text — KHÔNG nhận `dangerouslySetInnerHTML` hay
 * `ReactNode` lồng nhau. Mọi giá trị consumer cung cấp đều render
 * qua `textContent` của JSX, đóng vector XSS giống như
 * `buildPrintDocument` từng làm cho cửa sổ in.
 */
export interface ResultActionsExportCardProps {
  /** Tiêu đề kết quả (ví dụ "Tử Vi — 12/03/1990 giờ Tý"). */
  title: string;
  /** Tên mô-đun (ví dụ "Tử Vi Đẩu Số"). */
  moduleName: string;
  /** Nội dung text thuần đã định dạng sẵn (newline được bảo toàn). */
  result: string;
  /** Ngày-giờ xuất file ở locale `vi-VN`. */
  dateLabel: string;
}

/**
 * Card PNG/PDF dùng riêng cho `ResultActions`.
 *
 * Lý do tách module: được nạp qua `React.lazy()` + `Suspense` từ
 * `result-actions.tsx` — chỉ tải khi user thực sự bấm "Xuất → PNG"
 * hoặc "Xuất → PDF" (Requirement 11.1). Ở first paint, chunk này
 * không có trong bundle chính.
 *
 * Style inline với hex hard-code là **có chủ ý** (Requirement 1.1
 * cho phép hex trong `export-card-*` vì `html2canvas` rasterize
 * theo computed-style và phải độc lập với Color_Token chạy theo
 * theme runtime). Bảng màu khớp các export-card hiện có
 * (`export-card-tuvi`, `export-card-numerology`, …).
 *
 * Lưu ý a11y: card dùng `aria-hidden="true"` ở wrapper render-time
 * trong `ResultActions` (off-screen + `pointerEvents: none`) để
 * trình đọc màn hình không "kêu" hai lần khi user xuất file.
 *
 * Sử dụng: được wrap bằng `forwardRef` để parent gắn ref vào root
 * `<div>`, từ đó `html2canvas` rasterize được.
 *
 * @example
 * ```tsx
 * const LazyCard = React.lazy(() => import("./result-actions-export-card"));
 *
 * <Suspense fallback={null}>
 *   <LazyCard ref={cardRef} title="..." moduleName="..." result="..." dateLabel="..." />
 * </Suspense>
 * ```
 */
const ResultActionsExportCard = forwardRef<
  HTMLDivElement,
  ResultActionsExportCardProps
>(function ResultActionsExportCard(
  { title, moduleName, result, dateLabel },
  ref,
) {
  // Width 800px to match the existing export-card-* family so a single
  // jsPDF page mapping (210mm A4) keeps consistent ratios across modules.
  const innerWidth = 720;

  return (
    <div
      ref={ref}
      data-testid="result-actions-export-card"
      style={{
        width: 800,
        padding: 40,
        background: "#0d0818",
        color: "#f0e6d0",
        fontFamily:
          '"Arial Unicode MS", Arial, "Helvetica Neue", Helvetica, sans-serif',
        boxSizing: "border-box",
        // Critical for html2canvas: ensure no transforms / filters that
        // confuse the rasterizer.
        transform: "none",
        filter: "none",
      }}
    >
      <div
        style={{
          width: innerWidth,
          borderBottom: "1px solid #2e2040",
          paddingBottom: 20,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            color: "#c9a227",
            fontSize: 12,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Huyền Bí — {moduleName}
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: "bold",
            color: "#f0e6d0",
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12, color: "#9b8e78", marginTop: 6 }}>
          {dateLabel}
        </div>
      </div>

      <div
        style={{
          width: innerWidth,
          fontSize: 13,
          lineHeight: 1.8,
          // Preserves user-supplied newlines as in the original
          // print-document flow.
          whiteSpace: "pre-wrap",
          color: "#e8dcc4",
          wordBreak: "break-word",
        }}
      >
        {result}
      </div>

      <div
        style={{
          width: innerWidth,
          marginTop: 32,
          paddingTop: 18,
          borderTop: "1px solid #2e2040",
          textAlign: "center",
          fontSize: 11,
          color: "#9b8e78",
        }}
      >
        Huyền Bí · Mọi luận giải chỉ mang tính tham khảo
      </div>
    </div>
  );
});

ResultActionsExportCard.displayName = "ResultActionsExportCard";

export default ResultActionsExportCard;
