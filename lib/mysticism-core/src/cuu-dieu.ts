// Sao Hạn — Cửu Diệu (Nine Luminaries) annual star system.
//
// Each person is governed each year by one of nine stars, determined by tuổi
// mụ (lunar age = year − birthYear + 1) and gender, with a 9-year cycle
// anchored at age 10. This replaces the previous made-up "Thái Tuế rotation"
// for the Sao Hạn page. (The older computeAnnualStars in sao-han.ts is kept for
// the gender-less daily-fortune worker.)
//
// Verified against published Vietnamese almanac tables (vietthienthu,
// tuoiam): e.g. Nam 1990 in 2026 = tuổi 37 → La Hầu / Tam Kheo;
// Nữ 1990 in 2026 → Kế Đô / Thiên Tinh.

export type SaoHanGender = "nam" | "nu";
export type SaoNature = "tot" | "xau" | "trung";

export interface SaoHanInfo {
  name: string;
  nature: SaoNature;
  meaning: string;
  advice: string;
}

// Star ordering anchored at age 10 (index 0). Different for nam vs nữ.
const NAM_ORDER = ["La Hầu", "Thổ Tú", "Thủy Diệu", "Thái Bạch", "Thái Dương", "Vân Hớn", "Kế Đô", "Thái Âm", "Mộc Đức"];
const NU_ORDER = ["Kế Đô", "Vân Hớn", "Mộc Đức", "Thái Âm", "Thổ Tú", "La Hầu", "Thái Dương", "Thái Bạch", "Thủy Diệu"];

const SAO_META: Record<string, Omit<SaoHanInfo, "name">> = {
  "Thái Dương": { nature: "tot", meaning: "Sao tốt bậc nhất Cửu Diệu — chủ công danh, tài lộc, quý nhân; đặc biệt tốt với nam.", advice: "Thuận lợi tiến hành việc lớn, xuất hành, khởi sự. Tốt nhất vào tháng 6 và tháng 10 âm lịch." },
  "Thái Âm": { nature: "tot", meaning: "Sao tốt — chủ tài lộc, hỷ sự, hợp nữ giới.", advice: "Thuận cho cưới hỏi, khởi sự, cầu tài. Tốt tháng 9 âm, lưu ý tháng 11 âm." },
  "Mộc Đức": { nature: "tot", meaning: "Sao tốt — mang bình an, hỷ khánh, sức khỏe dồi dào.", advice: "Cả năm tương đối an lành, đỉnh điểm vào tháng Chạp. Nên làm việc thiện tích phúc." },
  "Thổ Tú": { nature: "trung", meaning: "Sao xấu nhẹ — dễ thị phi, chuyện buồn vặt, lục súc khó nuôi.", advice: "Giữ hòa khí, tránh đi xa nơi vắng vẻ. Kỵ tháng 4 và 8 âm lịch." },
  "Thủy Diệu": { nature: "trung", meaning: "Sao vừa tốt vừa xấu — chủ phúc lộc nhưng dễ thị phi, liên quan sông nước.", advice: "Cẩn thận lời ăn tiếng nói và sông nước. Kỵ tháng 4 và 8 âm lịch." },
  "Vân Hớn": { nature: "trung", meaning: "Hỏa tinh, hung tinh nhẹ — đề phòng thị phi, kiện tụng, máu huyết; nữ đề phòng sinh nở.", advice: "Tránh tranh chấp, cẩn thận tai nạn liên quan lửa và máu. Kỵ tháng 2 và 8 âm lịch." },
  "La Hầu": { nature: "xau", meaning: "Hung tinh — chủ khẩu thiệt, thị phi, kiện cáo, tật ách; nặng với nam giới.", advice: "Giữ mồm miệng, cẩn thận giấy tờ và sức khỏe. Kỵ tháng 1 và 7 âm lịch; nên cúng sao giải hạn." },
  "Kế Đô": { nature: "xau", meaning: "Hung tinh — ám muội, thị phi, tai tiếng; nặng với nữ giới.", advice: "Tránh thị phi, đề phòng tiểu nhân hãm hại. Kỵ tháng 3 và 9 âm lịch." },
  "Thái Bạch": { nature: "xau", meaning: "Sao hao tài — \"Thái Bạch sạch cửa nhà\", chủ mất mát tiền của.", advice: "Tránh đầu tư lớn, cho vay mượn; đề phòng mất cắp. Kỵ tháng 5 âm lịch." },
};

// Male niên-hạn lookup by tuổi mụ (10–60), from the almanac table (irregular —
// note the decade doublings). Female hạn via the mirror pairing below.
const NAM_HAN_BY_AGE: Record<number, string> = {
  10: "Huỳnh Tuyền", 11: "Tam Kheo", 12: "Ngũ Mộ", 13: "Thiên Tinh", 14: "Toán Tận", 15: "Thiên La", 16: "Địa Võng", 17: "Diêm Vương",
  18: "Huỳnh Tuyền", 19: "Tam Kheo", 20: "Tam Kheo", 21: "Ngũ Mộ", 22: "Thiên Tinh", 23: "Toán Tận", 24: "Thiên La", 25: "Địa Võng",
  26: "Diêm Vương", 27: "Huỳnh Tuyền", 28: "Tam Kheo", 29: "Ngũ Mộ", 30: "Ngũ Mộ", 31: "Thiên Tinh", 32: "Toán Tận", 33: "Thiên La",
  34: "Địa Võng", 35: "Diêm Vương", 36: "Huỳnh Tuyền", 37: "Tam Kheo", 38: "Ngũ Mộ", 39: "Thiên Tinh", 40: "Thiên Tinh", 41: "Toán Tận",
  42: "Thiên La", 43: "Địa Võng", 44: "Diêm Vương", 45: "Huỳnh Tuyền", 46: "Tam Kheo", 47: "Ngũ Mộ", 48: "Thiên Tinh", 49: "Toán Tận",
  50: "Toán Tận", 51: "Thiên La", 52: "Địa Võng", 53: "Diêm Vương", 54: "Huỳnh Tuyền", 55: "Tam Kheo", 56: "Ngũ Mộ", 57: "Thiên Tinh",
  58: "Toán Tận", 59: "Thiên La", 60: "Thiên La",
};

const HAN_MIRROR: Record<string, string> = {
  "Huỳnh Tuyền": "Toán Tận", "Tam Kheo": "Thiên Tinh", "Ngũ Mộ": "Ngũ Mộ", "Thiên Tinh": "Tam Kheo",
  "Toán Tận": "Huỳnh Tuyền", "Thiên La": "Diêm Vương", "Địa Võng": "Địa Võng", "Diêm Vương": "Thiên La",
};

export interface SaoHanResult {
  year: number;
  age: number; // tuổi mụ
  sao: SaoHanInfo;
  han: string;
  overall: "Tốt" | "Bình" | "Xấu";
}

function getHan(age: number, gender: SaoHanGender): string {
  const namHan = NAM_HAN_BY_AGE[age];
  if (!namHan) return "—";
  return gender === "nam" ? namHan : (HAN_MIRROR[namHan] ?? namHan);
}

/** Compute the Cửu Diệu star + niên hạn for a birth year, target year, gender. */
export function computeSaoHan(birthYear: number, targetYear: number, gender: SaoHanGender): SaoHanResult {
  const age = targetYear - birthYear + 1; // tuổi mụ
  const idx = (((age - 10) % 9) + 9) % 9;
  const name = (gender === "nam" ? NAM_ORDER : NU_ORDER)[idx];
  const sao: SaoHanInfo = { name, ...SAO_META[name] };
  const overall: SaoHanResult["overall"] = sao.nature === "tot" ? "Tốt" : sao.nature === "xau" ? "Xấu" : "Bình";
  return { year: targetYear, age, sao, han: getHan(age, gender), overall };
}

/** Multi-year Sao Hạn forecast. */
export function getSaoHanForecast(birthYear: number, gender: SaoHanGender, startYear: number, count = 7): SaoHanResult[] {
  return Array.from({ length: count }, (_, i) => computeSaoHan(birthYear, startYear + i, gender));
}
