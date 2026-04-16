import { forwardRef } from "react";
import { getNumberMeaning } from "@/lib/numerology";

interface Props {
  name: string;
  dob: string;
  lifePath: number;
  soul: number;
  destiny: number;
  personality: number;
  aiText?: string;
}

const GOLD = "#c9a227";
const BG = "#0d0818";
const BG2 = "#140d24";
const TEXT = "#f0e6d0";
const MUTED = "#9b8e78";
const BORDER = "#2e2040";
const FONT = '"Arial Unicode MS", Arial, "Helvetica Neue", Helvetica, sans-serif';

// Card width 800px, padding 40px * 2 = 720px inner
const INNER = 720;

export const NumerologyExportCard = forwardRef<HTMLDivElement, Props>(
  ({ name, dob, lifePath, soul, destiny, personality, aiText }, ref) => {
    const lp = getNumberMeaning(lifePath);

    // 2 cols: (720 - 16) / 2 = 352
    const numColW = Math.floor((INNER - 16) / 2);

    const numbers = [
      { label: "Số Đường Đời", value: lifePath, desc: getNumberMeaning(lifePath).description.slice(0, 120) + "…" },
      { label: "Số Sứ Mệnh", value: destiny, desc: getNumberMeaning(destiny).description.slice(0, 120) + "…" },
      { label: "Số Linh Hồn", value: soul, desc: getNumberMeaning(soul).description.slice(0, 120) + "…" },
      { label: "Số Nhân Cách", value: personality, desc: getNumberMeaning(personality).description.slice(0, 120) + "…" },
    ];

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
        <div style={{ textAlign: "center", marginBottom: 32, borderBottom: `1px solid ${BORDER}`, paddingBottom: 24 }}>
          <div style={{ color: GOLD, fontSize: 12, letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: 6 }}>
            Huyền Bí · Thần Số Học
          </div>
          <div style={{ fontSize: 26, fontWeight: "bold", color: TEXT, marginBottom: 4 }}>{name}</div>
          <div style={{ fontSize: 13, color: MUTED }}>Ngày sinh: {dob}</div>
        </div>

        {/* 4 numbers — 2 rows of 2, explicit pixel widths */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 28, width: INNER }}>
          {numbers.map((item) => (
            <div
              key={item.label}
              style={{
                width: numColW,
                flexShrink: 0,
                boxSizing: "border-box",
                background: BG2,
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: "18px 20px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: -10,
                  right: 12,
                  fontSize: 72,
                  fontWeight: "bold",
                  color: GOLD,
                  opacity: 0.08,
                  lineHeight: 1,
                  fontFamily: "Arial, sans-serif",
                }}
              >
                {item.value}
              </div>
              <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 36, fontWeight: "bold", color: GOLD, marginBottom: 8, fontFamily: "Arial, sans-serif" }}>
                {item.value}
              </div>
              <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>

        {/* Strengths & challenges — flex with explicit widths */}
        <div
          style={{
            width: INNER,
            boxSizing: "border-box",
            background: BG2,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: "18px 20px",
            marginBottom: 24,
            display: "flex",
            gap: 20,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: GOLD, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>
              Điểm mạnh số {lifePath}
            </div>
            <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.7 }}>{lp.strengths.join(" · ")}</div>
          </div>
          <div style={{ width: 1, background: BORDER, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#c06060", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>
              Thách thức cần vượt qua
            </div>
            <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.7 }}>{lp.challenges.join(" · ")}</div>
          </div>
        </div>

        {/* AI text */}
        {aiText && (
          <div
            style={{
              width: INNER,
              boxSizing: "border-box",
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
              {aiText.slice(0, 600)}{aiText.length > 600 ? "…" : ""}
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
NumerologyExportCard.displayName = "NumerologyExportCard";
