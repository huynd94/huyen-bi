// Đại Vận (Major Luck Pillars) — simplified calculation
// Each pillar lasts 10 years, starting from a computed age

const THIEN_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const DIA_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const NGU_HANH_CAN = ["Mộc","Mộc","Hoả","Hoả","Thổ","Thổ","Kim","Kim","Thuỷ","Thuỷ"];
const NGU_HANH_CHI = ["Thuỷ","Thổ","Mộc","Mộc","Thổ","Hoả","Hoả","Thổ","Kim","Kim","Thổ","Thuỷ"];

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

// Nayin (Nạp Âm) — simplified by Can+Chi index
const NAYIN: Record<string, string> = {
  "0-0": "Hải Trung Kim", "0-1": "Lư Trung Hoả", "0-2": "Đại Lâm Mộc", "0-3": "Lộ Bàng Thổ",
  "0-4": "Kiếm Phong Kim", "0-5": "Sơn Đầu Hoả", "1-0": "Giản Hạ Thuỷ", "1-1": "Thành Đầu Thổ",
  "1-2": "Bạch Lạp Kim", "1-3": "Dương Liễu Mộc", "1-4": "Tuyền Trung Thuỷ", "1-5": "Ốc Thượng Thổ",
  "2-0": "Bích Lịch Hoả", "2-1": "Tùng Bách Mộc", "2-2": "Trường Lưu Thuỷ", "2-3": "Sa Trung Kim",
  "2-4": "Sơn Hạ Hoả", "2-5": "Bình Địa Mộc", "3-0": "Hà Hải Thuỷ", "3-1": "Đại Trạch Thổ",
  "3-2": "Thoa Xuyến Kim", "3-3": "Lư Trung Thuỷ", "3-4": "Thiên Thượng Hoả", "3-5": "Thạch Lựu Mộc",
  "4-0": "Đại Hải Thuỷ", "4-1": "Sa Trung Thổ", "4-2": "Thiên Hà Thuỷ", "4-3": "Đại Dịch Thổ",
  "4-4": "Thoa Xuyến Kim", "4-5": "Tường Hạ Thổ",
};

function getNayin(canIdx: number, chiIdx: number): string {
  const k1 = Math.floor(canIdx / 2);
  const k2 = Math.floor(chiIdx / 2);
  return NAYIN[`${k1 % 5}-${k2 % 6}`] ?? "Thuỷ";
}

function getPillarQuality(canIdx: number, chiIdx: number, birthCanIdx: number): { quality: DaiVanPillar["quality"]; color: string; desc: string } {
  const elem = NGU_HANH_CAN[canIdx];
  const birthElem = NGU_HANH_CAN[birthCanIdx];
  const SINH: Record<string, string> = { "Thuỷ":"Mộc","Mộc":"Hoả","Hoả":"Thổ","Thổ":"Kim","Kim":"Thuỷ" };
  const KHAC: Record<string, string> = { "Mộc":"Thổ","Thổ":"Thuỷ","Thuỷ":"Hoả","Hoả":"Kim","Kim":"Mộc" };
  if (SINH[elem] === birthElem || elem === birthElem) return { quality: "Rất Tốt", color: "text-yellow-400", desc: "Ngũ hành vượng — vận hạn thuận lợi, tiến triển tốt mọi mặt." };
  if (SINH[birthElem] === elem) return { quality: "Tốt", color: "text-green-400", desc: "Ngũ hành sinh — được hỗ trợ từ bên ngoài, công việc hanh thông." };
  if (KHAC[elem] === birthElem) return { quality: "Khó Khăn", color: "text-red-400", desc: "Ngũ hành khắc — thách thức nhiều, cần thận trọng trong quyết định." };
  return { quality: "Trung Bình", color: "text-amber-400", desc: "Ngũ hành bình — không đặc biệt tốt xấu, dựa vào nỗ lực cá nhân." };
}

export interface DaiVanResult {
  startAge: number;
  pillars: DaiVanPillar[];
  note: string;
}

export function computeDaiVan(dob: string, gender: "nam" | "nu"): DaiVanResult {
  const [dd, mm, yyyy] = dob.split("/").map(Number);
  const yearCanIdx = ((yyyy - 4) % 10 + 10) % 10;
  const monthCanIdx = ((yearCanIdx * 2 + mm) % 10 + 10) % 10;
  const monthChiIdx = (mm + 1) % 12;

  // Yang year (Giáp, Bính, Mậu, Canh, Nhâm) = even can index
  const yangYear = yearCanIdx % 2 === 0;
  // Male+Yang or Female+Yin → forward; otherwise backward
  const forward = (gender === "nam" && yangYear) || (gender === "nu" && !yangYear);

  // Start age: simplified as 3 + (day of birth / 3) years, capped at 10
  const startAge = Math.min(10, Math.max(1, Math.round(dd / 3)));

  const pillars: DaiVanPillar[] = [];
  for (let i = 0; i < 8; i++) {
    const offset = forward ? i + 1 : -(i + 1);
    const canIdx = ((monthCanIdx + offset) % 10 + 10) % 10;
    const chiIdx = ((monthChiIdx + offset) % 12 + 12) % 12;
    const { quality, color, desc } = getPillarQuality(canIdx, chiIdx, yearCanIdx);
    const nayin = getNayin(canIdx, chiIdx);
    pillars.push({
      index: i,
      startAge: startAge + i * 10,
      endAge: startAge + (i + 1) * 10 - 1,
      thienCan: THIEN_CAN[canIdx],
      diaChi: DIA_CHI[chiIdx],
      nguHanh: `${NGU_HANH_CAN[canIdx]} - ${nayin}`,
      quality,
      qualityColor: color,
      desc,
    });
  }

  return {
    startAge,
    pillars,
    note: `Đại Vận bắt đầu từ tuổi ${startAge}, mỗi vận kéo dài 10 năm. Chiều đi ${forward ? "thuận" : "nghịch"} (${gender === "nam" ? "Nam" : "Nữ"}, năm ${yangYear ? "Dương" : "Âm"}).`,
  };
}
