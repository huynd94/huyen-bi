import { forwardRef } from "react";
import { type TuViResult, DIA_CHI } from "@/lib/tu-vi";

interface Props {
  result: TuViResult;
  birthInfo: string;
  aiText?: string;
}

const GOLD = "#c9a227";
const BG = "#0d0818";
const BG2 = "#140d24";
const TEXT = "#f0e6d0";
const MUTED = "#9b8e78";
const BORDER = "#2e2040";
const FONT = '"Arial Unicode MS", Arial, "Helvetica Neue", Helvetica, sans-serif';

// Card width 900px, padding 40px * 2 = 820px inner width
const INNER = 820;

export const TuViExportCard = forwardRef<HTMLDivElement, Props>(
  ({ result, birthInfo, aiText }, ref) => {
    const summaryItems = [
      { label: "Mệnh Cục", value: result.cuccDesc, sub: `Ngũ hành: ${result.nguHanhCuc}` },
      { label: "Can Chi Năm", value: `${result.canNam} ${result.chiNam}`, sub: `Cung Mệnh: ${DIA_CHI[result.cungMenh]}` },
      { label: "Cung Thân", value: DIA_CHI[result.cungThanMenh], sub: "Cung Thân Mệnh" },
    ];

    // 3 cols: (820 - 2*12) / 3 = 796/3 ≈ 265
    const summaryColW = Math.floor((INNER - 24) / 3);
    // 4 cols: (820 - 3*8) / 4 = 796/4 = 199
    const palaceColW = Math.floor((INNER - 24) / 4);

    return (
      <div
        ref={ref}
        style={{
          width: 900,
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
            Huyền Bí · Tử Vi Đẩu Số
          </div>
          <div style={{ fontSize: 24, fontWeight: "bold", color: TEXT, marginBottom: 6 }}>Lá Số Tử Vi</div>
          <div style={{ fontSize: 13, color: MUTED }}>{birthInfo}</div>
        </div>

        {/* Summary row — explicit pixel widths */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, width: INNER }}>
          {summaryItems.map((item) => (
            <div
              key={item.label}
              style={{
                width: summaryColW,
                flexShrink: 0,
                background: BG2,
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
                padding: "14px 12px",
                textAlign: "center",
                boxSizing: "border-box",
              }}
            >
              <div style={{ fontSize: 10, color: MUTED, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 6 }}>
                {item.label}
              </div>
              <div style={{ fontSize: 17, fontWeight: "bold", color: GOLD, marginBottom: 3 }}>{item.value}</div>
              <div style={{ fontSize: 10, color: MUTED }}>{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Mệnh description */}
        <div
          style={{
            width: INNER,
            boxSizing: "border-box",
            background: BG2,
            border: `1px solid ${BORDER}`,
            borderRadius: 10,
            padding: "14px 18px",
            marginBottom: 24,
            fontSize: 12,
            color: MUTED,
            lineHeight: 1.7,
            fontStyle: "italic",
          }}
        >
          {result.menhDesc}
        </div>

        {/* 12 Palaces — explicit pixel widths, 4 per row */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: GOLD, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>
            12 Cung Mệnh
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, width: INNER }}>
            {result.cungList.map((cung) => {
              const isMenh = cung.index === result.cungMenh;
              const isThan = cung.index === result.cungThanMenh;
              const chinhTinh = cung.stars.filter((s) => s.type === "chinh-tinh").map((s) => s.name);
              const phuTinh = cung.stars.filter((s) => s.type === "phu-tinh").map((s) => s.name).slice(0, 2);
              return (
                <div
                  key={cung.index}
                  style={{
                    width: palaceColW,
                    flexShrink: 0,
                    boxSizing: "border-box",
                    background: isMenh ? "rgba(201,162,39,0.1)" : BG2,
                    border: `1px solid ${isMenh ? GOLD : isThan ? "#d97706" : BORDER}`,
                    borderRadius: 8,
                    padding: "10px 8px",
                    position: "relative",
                    minHeight: 88,
                  }}
                >
                  {(isMenh || isThan) && (
                    <div
                      style={{
                        position: "absolute",
                        top: -8,
                        left: 6,
                        background: isMenh ? GOLD : "#d97706",
                        color: "#000",
                        fontSize: 8,
                        fontWeight: "bold",
                        padding: "2px 6px",
                        borderRadius: 99,
                        letterSpacing: "0.08em",
                      }}
                    >
                      {isMenh ? "MỆNH" : "THÂN"}
                    </div>
                  )}
                  <div style={{ fontSize: 9, color: MUTED, marginBottom: 3 }}>
                    {cung.thienCan} {cung.diaChi}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: "bold", color: isMenh ? GOLD : TEXT, marginBottom: 6 }}>
                    {cung.name}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                    {chinhTinh.slice(0, 2).map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: 8,
                          color: GOLD,
                          background: "rgba(201,162,39,0.15)",
                          borderRadius: 99,
                          padding: "1px 4px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                    {phuTinh.map((s) => (
                      <span
                        key={s}
                        style={{
                          fontSize: 8,
                          color: "#4ade80",
                          background: "rgba(74,222,128,0.08)",
                          borderRadius: 99,
                          padding: "1px 4px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
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
TuViExportCard.displayName = "TuViExportCard";
