// Đại Vận (Major Luck Pillars, 大運) — 10-year luck periods.
//
// Improvements over the previous web-only version:
//   - Starting age is derived from the real distance (in days) to the
//     month-defining solar term (3 days ≈ 1 year), instead of the placeholder
//     Math.round(day / 3).
//   - The forward/backward direction follows the classic Yang-male / Yin-female
//     → forward rule (unchanged, it was already correct).
//   - The luck pillars chain from the month pillar, consistent with bat-tu.ts.

import { daysToSolarTerm, getMonthBranchIndex } from "./lunar-calendar";

const THIEN_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const DIA_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const NGU_HANH_CAN = ["Mộc", "Mộc", "Hoả", "Hoả", "Thổ", "Thổ", "Kim", "Kim", "Thuỷ", "Thuỷ"];

// 60 Hoa Giáp Nạp Âm, indexed by the sexagenary number (0 = Giáp Tý).
const NAYIN_60: string[] = [
  "Hải Trung Kim", "Hải Trung Kim", "Lư Trung Hỏa", "Lư Trung Hỏa", "Đại Lâm Mộc", "Đại Lâm Mộc",
  "Lộ Bàng Thổ", "Lộ Bàng Thổ", "Kiếm Phong Kim", "Kiếm Phong Kim", "Sơn Đầu Hỏa", "Sơn Đầu Hỏa",
  "Giản Hạ Thủy", "Giản Hạ Thủy", "Thành Đầu Thổ", "Thành Đầu Thổ", "Bạch Lạp Kim", "Bạch Lạp Kim",
  "Dương Liễu Mộc", "Dương Liễu Mộc", "Tuyền Trung Thủy", "Tuyền Trung Thủy", "Ốc Thượng Thổ", "Ốc Thượng Thổ",
  "Tích Lịch Hỏa", "Tích Lịch Hỏa", "Tùng Bách Mộc", "Tùng Bách Mộc", "Trường Lưu Thủy", "Trường Lưu Thủy",
  "Sa Trung Kim", "Sa Trung Kim", "Sơn Hạ Hỏa", "Sơn Hạ Hỏa", "Bình Địa Mộc", "Bình Địa Mộc",
  "Bích Thượng Thổ", "Bích Thượng Thổ", "Kim Bạch Kim", "Kim Bạch Kim", "Phú Đăng Hỏa", "Phú Đăng Hỏa",
  "Thiên Hà Thủy", "Thiên Hà Thủy", "Đại Dịch Thổ", "Đại Dịch Thổ", "Thoa Xuyến Kim", "Thoa Xuyến Kim",
  "Tang Đố Mộc", "Tang Đố Mộc", "Đại Khê Thủy", "Đại Khê Thủy", "Sa Trung Thổ", "Sa Trung Thổ",
  "Thiên Thượng Hỏa", "Thiên Thượng Hỏa", "Thạch Lựu Mộc", "Thạch Lựu Mộc", "Đại Hải Thủy", "Đại Hải Thủy",
];

function nayin(canIdx: number, chiIdx: number): string {
  // Sexagenary index from Can (0-9) and Chi (0-11): the value s where
  // s % 10 === canIdx and s % 12 === chiIdx (0..59).
  let s = 0;
  for (let i = 0; i < 60; i++) {
    if (i % 10 === canIdx && i % 12 === chiIdx) { s = i; break; }
  }
  return NAYIN_60[s];
}

export interface DaiVanPillar {
  index: number;
  startAge: number;
  endAge: number;
  thienCan: string;
  diaChi: string;
  nguHanh: string;
  quality: "Rất Tốt" | "Tốt" | "Trung Bình" | "Khó Khăn";
  qualityColor: string;
  desc: string;
}

export interface DaiVanResult {
  startAge: number;
  pillars: DaiVanPillar[];
  note: string;
}

const SINH: Record<string, string> = { "Thuỷ": "Mộc", "Mộc": "Hoả", "Hoả": "Thổ", "Thổ": "Kim", "Kim": "Thuỷ" };
const KHAC: Record<string, string> = { "Mộc": "Thổ", "Thổ": "Thuỷ", "Thuỷ": "Hoả", "Hoả": "Kim", "Kim": "Mộc" };

function getPillarQuality(canIdx: number, birthCanIdx: number): { quality: DaiVanPillar["quality"]; color: string; desc: string } {
  const elem = NGU_HANH_CAN[canIdx];
  const birthElem = NGU_HANH_CAN[birthCanIdx];
  if (SINH[elem] === birthElem || elem === birthElem) return { quality: "Rất Tốt", color: "text-yellow-400", desc: "Ngũ hành vượng — vận hạn thuận lợi, tiến triển tốt mọi mặt." };
  if (SINH[birthElem] === elem) return { quality: "Tốt", color: "text-green-400", desc: "Ngũ hành sinh — được hỗ trợ từ bên ngoài, công việc hanh thông." };
  if (KHAC[elem] === birthElem) return { quality: "Khó Khăn", color: "text-red-400", desc: "Ngũ hành khắc — thách thức nhiều, cần thận trọng trong quyết định." };
  return { quality: "Trung Bình", color: "text-amber-400", desc: "Ngũ hành bình — không đặc biệt tốt xấu, dựa vào nỗ lực cá nhân." };
}

/**
 * Compute the major-luck pillars for a solar birth date.
 * @param dob DD/MM/YYYY
 * @param gender "nam" | "nu"
 */
export function computeDaiVan(dob: string, gender: "nam" | "nu"): DaiVanResult {
  const [dd, mm, yyyy] = dob.split("/").map(Number);
  // Bazi year stem with the Lập Xuân boundary (Jan / pre-term Feb roll back).
  const monthChiIdx = getMonthBranchIndex(dd, mm, yyyy);
  let byear = yyyy;
  if (mm === 1 || (mm === 2 && monthChiIdx === 1)) byear = yyyy - 1;
  const yearCanIdx = ((byear - 4) % 10 + 10) % 10;

  // Month stem via Ngũ Hổ Độn from the year stem (valid sexagenary pillar).
  const danStem = (yearCanIdx * 2 + 2) % 10;
  const monthsFromDan = (monthChiIdx - 2 + 12) % 12;
  const monthCanIdx = (danStem + monthsFromDan) % 10;

  // Yang year (Giáp, Bính, Mậu, Canh, Nhâm) = even can index.
  const yangYear = yearCanIdx % 2 === 0;
  // Male+Yang or Female+Yin → forward; otherwise backward.
  const forward = (gender === "nam" && yangYear) || (gender === "nu" && !yangYear);

  // Start age: days to the adjacent solar term ÷ 3 (3 days ≈ 1 year).
  const days = daysToSolarTerm(dd, mm, yyyy, forward);
  const startAge = Math.max(1, Math.min(10, Math.round(days / 3)));

  const pillars: DaiVanPillar[] = [];
  for (let i = 0; i < 8; i++) {
    const offset = forward ? i + 1 : -(i + 1);
    const canIdx = ((monthCanIdx + offset) % 10 + 10) % 10;
    const chiIdx = ((monthChiIdx + offset) % 12 + 12) % 12;
    const { quality, color, desc } = getPillarQuality(canIdx, yearCanIdx);
    pillars.push({
      index: i,
      startAge: startAge + i * 10,
      endAge: startAge + (i + 1) * 10 - 1,
      thienCan: THIEN_CAN[canIdx],
      diaChi: DIA_CHI[chiIdx],
      nguHanh: `${NGU_HANH_CAN[canIdx]} - ${nayin(canIdx, chiIdx)}`,
      quality,
      qualityColor: color,
      desc,
    });
  }

  return {
    startAge,
    pillars,
    note: `Đại Vận bắt đầu từ tuổi ${startAge} (tính theo khoảng cách ngày sinh đến tiết khí), mỗi vận kéo dài 10 năm. Chiều đi ${forward ? "thuận" : "nghịch"} (${gender === "nam" ? "Nam" : "Nữ"}, năm ${yangYear ? "Dương" : "Âm"}).`,
  };
}
