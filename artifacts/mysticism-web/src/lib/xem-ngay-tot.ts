import { buildMonthCalendar, type DayInfo } from "./lunar-calendar";

export type Purpose =
  | "hon-nhan"
  | "khai-truong"
  | "dong-tho"
  | "xuat-hanh"
  | "ky-ket"
  | "phau-thuat"
  | "nhap-trach"
  | "cau-tu"
  | "tang-le";

export const PURPOSE_LIST: { id: Purpose; label: string; icon: string; desc: string }[] = [
  { id: "hon-nhan", label: "Hôn Nhân", icon: "💍", desc: "Cưới hỏi, đám cưới, đính hôn" },
  { id: "khai-truong", label: "Khai Trương", icon: "🏪", desc: "Mở cửa hàng, ra mắt dự án" },
  { id: "dong-tho", label: "Động Thổ", icon: "🏗️", desc: "Xây nhà, sửa chữa, đào móng" },
  { id: "xuat-hanh", label: "Xuất Hành", icon: "✈️", desc: "Đi xa, du lịch, xuất ngoại" },
  { id: "ky-ket", label: "Ký Kết", icon: "📝", desc: "Hợp đồng, giao dịch, ký thoả thuận" },
  { id: "phau-thuat", label: "Phẫu Thuật", icon: "🏥", desc: "Phẫu thuật, điều trị y tế" },
  { id: "nhap-trach", label: "Nhập Trạch", icon: "🏠", desc: "Dọn vào nhà mới, chuyển nhà" },
  { id: "cau-tu", label: "Cầu Tự", icon: "🙏", desc: "Cầu con cái, lễ cầu" },
  { id: "tang-le", label: "Tang Lễ", icon: "🕯️", desc: "Tổ chức tang lễ, an táng" },
];

// Lunar days to avoid for each purpose (general bad days: 5, 14, 23 = tam nương, also 1, 15 tốt cho hầu hết)
const PURPOSE_BAD_LUNAR: Record<Purpose, number[]> = {
  "hon-nhan":   [1, 3, 5, 7, 9, 14, 17, 23, 25, 29],
  "khai-truong":[3, 5, 7, 9, 14, 17, 23, 25],
  "dong-tho":   [1, 5, 9, 14, 17, 22, 23, 27],
  "xuat-hanh":  [5, 14, 23, 10, 19, 28],
  "ky-ket":     [3, 5, 13, 14, 23, 26],
  "phau-thuat": [1, 9, 14, 15, 23, 30],
  "nhap-trach": [1, 5, 7, 14, 17, 23, 25],
  "cau-tu":     [5, 14, 23, 10, 20],
  "tang-le":    [1, 3, 6, 9, 15, 18, 21, 24, 27],
};

// Good lunar days for each purpose
const PURPOSE_GOOD_LUNAR: Record<Purpose, number[]> = {
  "hon-nhan":   [2, 6, 10, 12, 16, 20, 22, 26, 28],
  "khai-truong":[1, 6, 8, 12, 15, 16, 20, 24, 26],
  "dong-tho":   [6, 8, 12, 15, 16, 20, 24, 26, 28],
  "xuat-hanh":  [1, 6, 8, 12, 15, 16, 20, 26, 27],
  "ky-ket":     [1, 6, 8, 12, 16, 20, 22, 26, 28],
  "phau-thuat": [6, 8, 12, 16, 20, 26, 28],
  "nhap-trach": [2, 6, 8, 12, 16, 20, 24, 26, 28],
  "cau-tu":     [1, 6, 12, 15, 16, 26, 28],
  "tang-le":    [2, 4, 7, 10, 11, 13, 16, 19, 22, 25, 28],
};

export interface GoodDay {
  dayInfo: DayInfo;
  score: number;
  reasons: string[];
  warnings: string[];
  purposeMatch: boolean;
}

export function findGoodDays(year: number, month: number, purpose: Purpose): GoodDay[] {
  const calendar = buildMonthCalendar(year, month);
  const goodDays: GoodDay[] = [];
  const badLunar = PURPOSE_BAD_LUNAR[purpose];
  const goodLunar = PURPOSE_GOOD_LUNAR[purpose];

  for (const day of calendar) {
    const lunarDay = day.lunar.day;
    const reasons: string[] = [];
    const warnings: string[] = [];
    let score = 50;

    // Base rating
    if (day.rating === "Đại Cát") { score += 30; reasons.push("Ngày Đại Cát (Hoàng Đạo tốt nhất)"); }
    else if (day.rating === "Cát") { score += 18; reasons.push("Ngày Cát (Hoàng Đạo)"); }
    else if (day.rating === "Hung") { score -= 30; warnings.push("Ngày Hung — nên tránh"); }

    // Hoàng Đạo bonus
    if (day.hoangDao) { score += 10; reasons.push("Giờ Hoàng Đạo trong ngày"); }

    // Purpose-specific good/bad lunar days
    if (goodLunar.includes(lunarDay)) { score += 15; reasons.push(`Ngày âm ${lunarDay} thuận cho ${PURPOSE_LIST.find(p => p.id === purpose)?.label}`); }
    if (badLunar.includes(lunarDay)) { score -= 20; warnings.push(`Ngày âm ${lunarDay} không thuận cho việc này`); }

    // Tam Nương days (5, 14, 23 lunar)
    if ([5, 14, 23].includes(lunarDay)) { score -= 15; warnings.push("Ngày Tam Nương — tránh khởi sự lớn"); }

    // Day of week consideration (avoid Mon/Fri for some, weekends OK)
    const dow = day.solar.getDay();
    if (dow === 0 || dow === 6) { score += 5; reasons.push("Cuối tuần, gia đình đông đủ"); }

    const purposeMatch = goodLunar.includes(lunarDay) && !badLunar.includes(lunarDay) && day.rating !== "Hung";
    score = Math.min(100, Math.max(0, score));

    if (score >= 50) {
      goodDays.push({ dayInfo: day, score, reasons, warnings, purposeMatch });
    }
  }

  return goodDays.sort((a, b) => b.score - a.score);
}
