// Tử Vi Đẩu Số — re-export shim.
//
// The real chart calculation now lives in @workspace/mysticism-core with the
// standard 14-major-star placement (verified against the canonical "Tử Vi tại
// Ngọ" chart). This file keeps the original import path stable for the page.
export {
  calculateTuVi,
  CUNG_NAMES,
  THIEN_CAN,
  DIA_CHI,
  NGU_HANH,
  NGU_HANH_COLOR,
} from "@workspace/mysticism-core";
export type { Star, CungInfo, TuViResult } from "@workspace/mysticism-core";
