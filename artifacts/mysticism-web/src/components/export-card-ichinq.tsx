import { forwardRef } from "react";
import { type Hexagram } from "@/lib/iching";

interface Props {
  hexagram: Hexagram;
  aiText?: string;
}

const GOLD = "#c9a227";
const BG = "#0d0818";
const BG2 = "#140d24";
const TEXT = "#f0e6d0";
const MUTED = "#9b8e78";
const BORDER = "#2e2040";
const FONT = '"Arial Unicode MS", Arial, "Helvetica Neue", Helvetica, sans-serif';

export const IChingExportCard = forwardRef<HTMLDivElement, Props>(
  ({ hexagram, aiText }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          width: 800,
          background: BG,
          color: TEXT,
          fontFamily: FONT,
          padding: "40px",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28, borderBottom: `1px solid ${BORDER}`, paddingBottom: 24 }}>
          <div style={{ color: GOLD, fontSize: 12, letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 6 }}>
            Huyền Bí · Kinh Dịch I Ching
          </div>
        </div>

        {/* Hexagram symbol + name */}
        <div
          style={{
            background: BG2,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: "32px 40px",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 120, lineHeight: 1, color: GOLD, opacity: 0.9, marginBottom: 16 }}>
            {hexagram.symbol}
          </div>
          <div style={{ fontSize: 32, fontWeight: "bold", color: GOLD, marginBottom: 6 }}>
            {hexagram.vietnameseName}
          </div>
          <div style={{ fontSize: 16, color: MUTED, marginBottom: 20 }}>{hexagram.name}</div>
          <div
            style={{
              borderTop: `1px solid ${BORDER}`,
              paddingTop: 18,
              fontSize: 16,
              color: TEXT,
              fontStyle: "italic",
              lineHeight: 1.8,
            }}
          >
            "{hexagram.description}"
          </div>
        </div>

        {/* Meaning */}
        <div
          style={{
            background: BG2,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 11, color: GOLD, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>
            Ý Nghĩa Quẻ
          </div>
          <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.8 }}>{hexagram.meaning}</div>
        </div>

        {/* AI text */}
        {aiText && (
          <div
            style={{
              background: BG2,
              border: `1px solid ${BORDER}`,
              borderLeft: `3px solid ${GOLD}`,
              borderRadius: "0 12px 12px 0",
              padding: "16px 20px",
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: 11, color: GOLD, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>
              Luận Giải AI
            </div>
            <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {aiText.slice(0, 700)}{aiText.length > 700 ? "…" : ""}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", borderTop: `1px solid ${BORDER}`, paddingTop: 18 }}>
          <div style={{ fontSize: 11, color: MUTED }}>
            Huyền Bí · Mọi luận giải chỉ mang tính tham khảo · {new Date().toLocaleDateString("vi-VN")}
          </div>
        </div>
      </div>
    );
  }
);
IChingExportCard.displayName = "IChingExportCard";
