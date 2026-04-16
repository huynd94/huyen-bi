import { forwardRef } from "react";
import { type Pillar, type NguyenHanhItem } from "@/lib/batu";

interface Props {
  date: string;
  time: string;
  gio: Pillar;
  ngay: Pillar;
  thang: Pillar;
  nam: Pillar;
  nguHanhAnalysis: NguyenHanhItem[];
  aiText?: string;
}

const GOLD = "#c9a227";
const BG = "#0d0818";
const BG2 = "#140d24";
const TEXT = "#f0e6d0";
const MUTED = "#9b8e78";
const BORDER = "#2e2040";
const FONT = '"Arial Unicode MS", Arial, "Helvetica Neue", Helvetica, sans-serif';

const NGU_HANH_COLOR: Record<string, string> = {
  "Mộc": "#4ade80",
  "Hỏa": "#f87171",
  "Thổ": "#fbbf24",
  "Kim": "#94a3b8",
  "Thủy": "#60a5fa",
};

// Card width 800px, padding 40px * 2 = 720px inner
const INNER = 720;

export const BatuExportCard = forwardRef<HTMLDivElement, Props>(
  ({ date, time, gio, ngay, thang, nam, nguHanhAnalysis, aiText }, ref) => {
    // 4 cols: (720 - 3*14) / 4 = (720 - 42) / 4 = 169.5 → 169
    const pillarW = Math.floor((INNER - 42) / 4);

    const pillars = [
      { title: "Trụ Giờ", data: gio },
      { title: "Trụ Ngày", data: ngay },
      { title: "Trụ Tháng", data: thang },
      { title: "Trụ Năm", data: nam },
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
            Huyền Bí · Bát Tự Tứ Trụ
          </div>
          <div style={{ fontSize: 22, fontWeight: "bold", color: TEXT, marginBottom: 4 }}>
            Lá Số Bát Tự — {date}
          </div>
          <div style={{ fontSize: 13, color: MUTED }}>Giờ sinh: {time}</div>
        </div>

        {/* 4 pillars — explicit pixel widths */}
        <div style={{ display: "flex", gap: 14, marginBottom: 28, width: INNER }}>
          {pillars.map((p) => {
            const elementKey = p.data.nguHanh.split("/")[0];
            const elColor = NGU_HANH_COLOR[elementKey] || MUTED;
            return (
              <div
                key={p.title}
                style={{
                  width: pillarW,
                  flexShrink: 0,
                  boxSizing: "border-box",
                  background: BG2,
                  border: `1px solid ${BORDER}`,
                  borderTop: `3px solid ${GOLD}`,
                  borderRadius: 12,
                  padding: "18px 8px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>
                  {p.title}
                </div>
                <div style={{ fontSize: 38, fontWeight: "bold", color: GOLD, marginBottom: 6 }}>{p.data.thienCan}</div>
                <div style={{ fontSize: 38, fontWeight: "bold", color: TEXT, marginBottom: 10 }}>{p.data.diaChi}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: elColor,
                    background: "rgba(255,255,255,0.05)",
                    borderRadius: 999,
                    padding: "3px 10px",
                    display: "inline-block",
                  }}
                >
                  {p.data.nguHanh}
                </div>
              </div>
            );
          })}
        </div>

        {/* Ngũ Hành */}
        <div
          style={{
            width: INNER,
            boxSizing: "border-box",
            background: BG2,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: "20px",
            marginBottom: 24,
          }}
        >
          <div style={{ fontSize: 13, color: GOLD, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16 }}>
            Phân Tích Ngũ Hành
          </div>
          {nguHanhAnalysis.map((item) => {
            const elColor = NGU_HANH_COLOR[item.element] || TEXT;
            return (
              <div key={item.element} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, color: elColor, fontWeight: "bold" }}>
                    {item.element}
                  </span>
                  <span style={{ fontSize: 12, color: MUTED }}>{item.percentage}%</span>
                </div>
                <div style={{ height: 6, background: "#1e1530", borderRadius: 3 }}>
                  <div
                    style={{
                      height: 6,
                      width: `${item.percentage}%`,
                      background: elColor,
                      borderRadius: 3,
                    }}
                  />
                </div>
              </div>
            );
          })}
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
BatuExportCard.displayName = "BatuExportCard";
