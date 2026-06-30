// Bát Tự / Tứ Trụ (Four Pillars of Destiny, 四柱八字) — real calculation.
//
// Replaces the previous mock (day pillar = (dd+mm)%10, hardcoded element
// percentages). Now:
//   - Year pillar uses the solar Lập Xuân boundary (year starts at ~Feb 4, not
//     Jan 1) via the solar-term helper.
//   - Month pillar branch is keyed to the solar term (Tiết Khí); its stem is
//     derived from the year stem by Ngũ Hổ Độn (五虎遁).
//   - Day pillar comes from the Julian day number (already verified correct).
//   - Hour pillar branch is the 2-hour Earthly Branch; its stem is derived from
//     the day stem by Ngũ Thử Độn (五鼠遁).
//   - The five-element distribution is a real tally over the eight characters
//     (visible stems + branch primary elements + hidden stems), not a constant.

import { getJulianDay, getMonthBranchIndex } from "./lunar-calendar";

const THIEN_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const DIA_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

// Five element of each stem (Can) and the primary element of each branch (Chi).
const CAN_ELEMENT = ["Mộc", "Mộc", "Hỏa", "Hỏa", "Thổ", "Thổ", "Kim", "Kim", "Thủy", "Thủy"];
const CHI_ELEMENT = ["Thủy", "Thổ", "Mộc", "Mộc", "Thổ", "Hỏa", "Hỏa", "Thổ", "Kim", "Kim", "Thổ", "Thủy"];

// Hidden stems (Tàng Can) inside each Earthly Branch — indices into THIEN_CAN.
// Standard table: main + (middle) + (residual). Used for the element tally.
const HIDDEN_STEMS: number[][] = [
  [9], // Tý: Quý
  [5, 9, 7], // Sửu: Kỷ, Quý, Tân
  [0, 2, 4], // Dần: Giáp, Bính, Mậu
  [1], // Mão: Ất
  [4, 1, 9], // Thìn: Mậu, Ất, Quý
  [2, 4, 6], // Tỵ: Bính, Mậu, Canh
  [3, 5], // Ngọ: Đinh, Kỷ
  [5, 3, 1], // Mùi: Kỷ, Đinh, Ất
  [6, 8, 4], // Thân: Canh, Nhâm, Mậu
  [7], // Dậu: Tân
  [4, 7, 3], // Tuất: Mậu, Tân, Đinh
  [8, 0], // Hợi: Nhâm, Giáp
];

const ELEMENTS = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"] as const;
export type Element = (typeof ELEMENTS)[number];

export interface Pillar {
  thienCan: string;
  diaChi: string;
  nguHanh: string;
}

export interface NguyenHanhItem {
  element: string;
  percentage: number;
}

export interface BatuResult {
  nam: Pillar;
  thang: Pillar;
  ngay: Pillar;
  gio: Pillar;
  nguHanhAnalysis: NguyenHanhItem[];
}

/** Year pillar with the Lập Xuân boundary applied. */
function getYearPillar(dd: number, mm: number, yy: number): { canIdx: number; chiIdx: number } {
  // The Bazi year begins at Lập Xuân (~Feb 4, the start of the Dần month), not
  // Jan 1. Any date before that belongs to the previous Bazi year:
  //   - All of January is before Lập Xuân.
  //   - Early February is before Lập Xuân while the solar month is still Sửu
  //     (branch 1); once it advances to Dần (branch 2) we are on/after Lập Xuân.
  const monthBranch = getMonthBranchIndex(dd, mm, yy);
  let byear = yy;
  if (mm === 1 || (mm === 2 && monthBranch === 1)) {
    byear = yy - 1;
  }
  const canIdx = ((byear - 4) % 10 + 10) % 10;
  const chiIdx = ((byear - 4) % 12 + 12) % 12;
  return { canIdx, chiIdx };
}

/** Month stem via Ngũ Hổ Độn: month-of-Dần stem = (yearStem*2 + 2) % 10. */
function getMonthStemIndex(yearCanIdx: number, monthChiIdx: number): number {
  // Number of months past Dần (branch 2).
  const monthsFromDan = (monthChiIdx - 2 + 12) % 12;
  const danStem = (yearCanIdx * 2 + 2) % 10;
  return (danStem + monthsFromDan) % 10;
}

/** Hour branch from a 0–23 hour (Tý = 23:00–00:59). */
function getHourBranchIndex(hour: number): number {
  return Math.floor(((hour + 1) % 24) / 2) % 12;
}

/** Hour stem via Ngũ Thử Độn: hour-of-Tý stem = (dayStem*2) % 10. */
function getHourStemIndex(dayCanIdx: number, hourChiIdx: number): number {
  const tyStem = (dayCanIdx * 2) % 10;
  return (tyStem + hourChiIdx) % 10;
}

function pillar(canIdx: number, chiIdx: number): Pillar {
  return {
    thienCan: THIEN_CAN[canIdx],
    diaChi: DIA_CHI[chiIdx],
    nguHanh: `${CAN_ELEMENT[canIdx]} - ${CHI_ELEMENT[chiIdx]}`,
  };
}

function tallyElements(
  canIndices: number[],
  chiIndices: number[],
): NguyenHanhItem[] {
  const counts: Record<Element, number> = { Kim: 0, Mộc: 0, Thủy: 0, Hỏa: 0, Thổ: 0 };

  // Visible stems — full weight.
  for (const c of canIndices) counts[CAN_ELEMENT[c] as Element] += 1;
  // Branch primary element — full weight.
  for (const c of chiIndices) counts[CHI_ELEMENT[c] as Element] += 1;
  // Hidden stems — half weight, so they refine the picture without dominating.
  for (const c of chiIndices) {
    for (const hs of HIDDEN_STEMS[c]) counts[CAN_ELEMENT[hs] as Element] += 0.5;
  }

  const total = ELEMENTS.reduce((s, e) => s + counts[e], 0) || 1;
  // Round to integer percentages that sum to 100 (largest-remainder method).
  const raw = ELEMENTS.map((e) => ({ element: e, exact: (counts[e] / total) * 100 }));
  const floored = raw.map((r) => ({ ...r, pct: Math.floor(r.exact), rem: r.exact - Math.floor(r.exact) }));
  let remaining = 100 - floored.reduce((s, r) => s + r.pct, 0);
  floored.sort((a, b) => b.rem - a.rem);
  for (let i = 0; i < floored.length && remaining > 0; i++, remaining--) floored[i].pct += 1;
  // Restore canonical element order for display.
  return ELEMENTS.map((e) => ({ element: e, percentage: floored.find((f) => f.element === e)!.pct }));
}

/**
 * Compute the Four Pillars for a solar birth date/time.
 * @param dateStr DD/MM/YYYY
 * @param hourStr "HH:MM" (24h)
 */
export function computeBatu(dateStr: string, hourStr: string): BatuResult {
  const [dd, mm, yyyy] = dateStr.split("/").map(Number);
  const hour = parseInt(hourStr.split(":")[0], 10) || 0;

  // Year pillar (Lập Xuân aware).
  const { canIdx: yearCan, chiIdx: yearChi } = getYearPillar(dd, mm, yyyy);

  // Month pillar (solar-term branch + Ngũ Hổ Độn stem).
  const monthChi = getMonthBranchIndex(dd, mm, yyyy);
  const monthCan = getMonthStemIndex(yearCan, monthChi);

  // Day pillar from the Julian day number (matches getCanChi("day")).
  const jd = getJulianDay(dd, mm, yyyy);
  const dayCan = (jd + 9) % 10;
  const dayChi = (jd + 1) % 12;

  // Hour pillar (Ngũ Thử Độn).
  const hourChi = getHourBranchIndex(hour);
  const hourCan = getHourStemIndex(dayCan, hourChi);

  const canIndices = [yearCan, monthCan, dayCan, hourCan];
  const chiIndices = [yearChi, monthChi, dayChi, hourChi];

  return {
    nam: pillar(yearCan, yearChi),
    thang: pillar(monthCan, monthChi),
    ngay: pillar(dayCan, dayChi),
    gio: pillar(hourCan, hourChi),
    nguHanhAnalysis: tallyElements(canIndices, chiIndices),
  };
}
