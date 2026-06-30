// Bát Tự / Tứ Trụ — re-export shim.
//
// The real calculation now lives in @workspace/mysticism-core (solar-term
// month pillar, Lập Xuân year boundary, Ngũ Hổ/Ngũ Thử Độn stems, real
// five-element tally). This file keeps the original import path stable for the
// page and export card.
export { computeBatu } from "@workspace/mysticism-core";
export type { Pillar, NguyenHanhItem, BatuResult } from "@workspace/mysticism-core";
