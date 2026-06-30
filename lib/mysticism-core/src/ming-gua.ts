// Mệnh Quái (Bát Trạch Kua number) — the single canonical implementation.
//
// Used by Phong Thủy (Bát Trạch directions), Hợp Tuổi (house-group
// compatibility), and any other feature that needs a person's trigram.
//
// Two correctness concerns this module handles that the previous per-page
// copies did not:
//
//   1. Century awareness. The classic "10 − digit-sum" male formula is only
//      valid for 1900–1999 birth years. From 2000 onward the male formula is
//      "9 − digit-sum" and the female formula shifts from "5 + s" to "6 + s".
//      Older code that ignored this returned wrong numbers (and could even
//      produce an out-of-range 0/5/10) for 2000+ births.
//
//   2. Lunar new-year boundary. The Kua number is keyed to the *lunar* year of
//      birth. Someone born in January/early-February (before Tết) belongs to
//      the previous lunar year. We resolve the true lunar year with
//      solarToLunar rather than approximating the Lập Xuân cut-off.

import { solarToLunar } from "./lunar-calendar";

export type GuaNumber = 1 | 2 | 3 | 4 | 6 | 7 | 8 | 9;
export type GuaGroup = "east" | "west";
export type Gender = "nam" | "nu";

export interface MingGuaInfo {
  gua: GuaNumber;
  name: string;
  element: string;
  group: GuaGroup;
  /** The lunar year actually used (may differ from the solar year near Tết). */
  lunarYear: number;
}

const GUA_META: Record<GuaNumber, { name: string; element: string; group: GuaGroup }> = {
  1: { name: "Khảm", element: "Thuỷ", group: "east" },
  2: { name: "Khôn", element: "Thổ", group: "west" },
  3: { name: "Chấn", element: "Mộc", group: "east" },
  4: { name: "Tốn", element: "Mộc", group: "east" },
  6: { name: "Càn", element: "Kim", group: "west" },
  7: { name: "Đoài", element: "Kim", group: "west" },
  8: { name: "Cấn", element: "Thổ", group: "west" },
  9: { name: "Ly", element: "Hoả", group: "east" },
};

/** Reduce a non-negative integer to a single digit (1–9, or 0 only for 0). */
function reduceToDigit(n: number): number {
  while (n > 9) {
    n = n
      .toString()
      .split("")
      .reduce((a, b) => a + Number(b), 0);
  }
  return n;
}

/**
 * Compute the Kua / Mệnh Quái number for a given *lunar* birth year and gender.
 *
 * Prefer {@link computeMingGuaFromDob} when you have a full date — it resolves
 * the Tết boundary for you. Use this overload only when the caller has already
 * determined the correct lunar year.
 */
export function computeMingGua(lunarYear: number, gender: Gender): GuaNumber {
  const s = reduceToDigit((Math.floor(lunarYear / 10) % 10) + (lunarYear % 10));

  let gua: number;
  if (lunarYear >= 2000) {
    gua = gender === "nam" ? 9 - s : 6 + s;
  } else {
    gua = gender === "nam" ? 10 - s : 5 + s;
  }

  gua = reduceToDigit(gua);

  // Normalise the special cases. Kua 5 has no trigram: males borrow Khôn (2),
  // females borrow Cấn (8). A reduced value of 0 maps to Ly (9) for the male
  // 2000+ branch (e.g. birth digit-sum 9 → 9 − 9 = 0).
  if (gua === 0) gua = 9;
  if (gua === 5) gua = gender === "nam" ? 2 : 8;

  return gua as GuaNumber;
}

/**
 * Compute the Kua number from a full date of birth, accounting for the lunar
 * new-year boundary. `dob` is `DD/MM/YYYY`.
 */
export function computeMingGuaFromDob(dob: string, gender: Gender): MingGuaInfo {
  const [d, m, y] = dob.split("/").map(Number);
  let lunarYear = y;
  if (!Number.isNaN(d) && !Number.isNaN(m) && !Number.isNaN(y)) {
    lunarYear = solarToLunar(d, m, y).year;
  }
  const gua = computeMingGua(lunarYear, gender);
  const meta = GUA_META[gua];
  return { gua, name: meta.name, element: meta.element, group: meta.group, lunarYear };
}

export function getGuaMeta(gua: GuaNumber): { name: string; element: string; group: GuaGroup } {
  return GUA_META[gua];
}

export function isSameGroup(a: GuaNumber, b: GuaNumber): boolean {
  return GUA_META[a].group === GUA_META[b].group;
}
