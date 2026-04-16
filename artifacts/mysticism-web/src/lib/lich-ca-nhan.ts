// Personal Year / Month / Day numerology calendar

function reduce(n: number): number {
  if (n === 11 || n === 22 || n === 33) return n;
  if (n < 10) return n;
  return reduce(n.toString().split("").reduce((a, b) => a + parseInt(b), 0));
}

function digitSum(n: number): number {
  return n.toString().split("").reduce((a, b) => a + parseInt(b), 0);
}

export function computePersonalYear(dob: string, targetYear: number): number {
  // dob: DD/MM/YYYY
  const parts = dob.split("/");
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  return reduce(digitSum(day) + digitSum(month) + digitSum(targetYear));
}

export function computePersonalMonth(personalYear: number, month: number): number {
  return reduce(personalYear + month);
}

export function computePersonalDay(personalMonth: number, day: number): number {
  return reduce(personalMonth + day);
}

export type DayQuality = "xuatSac" | "tot" | "trungBinh" | "canThan";

export interface DayInfo {
  day: number;
  personalDay: number;
  quality: DayQuality;
  label: string;
  color: string;
  bgColor: string;
}

const QUALITY_MAP: Record<number, { quality: DayQuality; label: string; color: string; bgColor: string }> = {
  1: { quality: "tot", label: "Tốt", color: "text-green-300", bgColor: "bg-green-500/15 border-green-500/30" },
  2: { quality: "canThan", label: "Chú ý", color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/20" },
  3: { quality: "tot", label: "Tốt", color: "text-green-300", bgColor: "bg-green-500/15 border-green-500/30" },
  4: { quality: "canThan", label: "Chú ý", color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/20" },
  5: { quality: "tot", label: "Tốt", color: "text-green-300", bgColor: "bg-green-500/15 border-green-500/30" },
  6: { quality: "trungBinh", label: "Bình thường", color: "text-blue-300", bgColor: "bg-blue-500/10 border-blue-500/20" },
  7: { quality: "canThan", label: "Chú ý", color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/20" },
  8: { quality: "canThan", label: "Chú ý", color: "text-orange-400", bgColor: "bg-orange-500/10 border-orange-500/20" },
  9: { quality: "tot", label: "Tốt", color: "text-green-300", bgColor: "bg-green-500/15 border-green-500/30" },
  11: { quality: "xuatSac", label: "Xuất sắc", color: "text-yellow-300", bgColor: "bg-yellow-500/15 border-yellow-500/30" },
  22: { quality: "xuatSac", label: "Xuất sắc", color: "text-yellow-300", bgColor: "bg-yellow-500/15 border-yellow-500/30" },
  33: { quality: "xuatSac", label: "Xuất sắc", color: "text-yellow-300", bgColor: "bg-yellow-500/15 border-yellow-500/30" },
};

export function getDayQuality(n: number) {
  return QUALITY_MAP[n] || QUALITY_MAP[1];
}

export function buildMonthCalendar(dob: string, year: number, month: number): DayInfo[] {
  const personalYear = computePersonalYear(dob, year);
  const personalMonth = computePersonalMonth(personalYear, month);
  const daysInMonth = new Date(year, month, 0).getDate();

  return Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const personalDay = computePersonalDay(personalMonth, day);
    const q = getDayQuality(personalDay);
    return { day, personalDay, ...q };
  });
}

export interface PersonalYearInfo {
  year: number;
  personalYear: number;
  theme: string;
  advice: string;
}

const YEAR_THEMES: Record<number, { theme: string; advice: string }> = {
  1: { theme: "Năm Khởi Đầu Mới", advice: "Năm của sự khởi đầu và độc lập. Hãy mạnh dạn bắt đầu các dự án mới, xây dựng nền tảng cho 9 năm tiếp theo." },
  2: { theme: "Năm Hợp Tác", advice: "Tập trung vào các mối quan hệ và hợp tác. Kiên nhẫn, lắng nghe và xây dựng sự tin tưởng." },
  3: { theme: "Năm Sáng Tạo", advice: "Thể hiện bản thân và tận hưởng cuộc sống. Mở rộng mạng lưới xã hội và theo đuổi các đam mê sáng tạo." },
  4: { theme: "Năm Xây Dựng", advice: "Làm việc chăm chỉ và xây dựng nền tảng bền vững. Tập trung vào kế hoạch dài hạn và sức khoẻ." },
  5: { theme: "Năm Thay Đổi", advice: "Đón nhận thay đổi và phiêu lưu. Linh hoạt, mạo hiểm có tính toán và thoát khỏi vùng an toàn." },
  6: { theme: "Năm Trách Nhiệm", advice: "Gia đình, nhà cửa và sức khoẻ là ưu tiên. Phục vụ cộng đồng và chăm sóc những người thân yêu." },
  7: { theme: "Năm Tĩnh Lặng", advice: "Hướng nội và nghiên cứu sâu. Thiền định, học hỏi và kết nối với nội tâm." },
  8: { theme: "Năm Thành Tựu", advice: "Năm của quyền lực và tài chính. Đưa ra các quyết định kinh doanh táo bạo và xây dựng sự giàu có." },
  9: { theme: "Năm Kết Thúc", advice: "Buông bỏ những gì không còn phù hợp. Tha thứ, từ thiện và chuẩn bị cho chu kỳ mới." },
  11: { theme: "Năm Giác Ngộ", advice: "Trực giác và tâm linh lên cao. Lắng nghe tiếng gọi nội tâm và truyền cảm hứng cho người xung quanh." },
  22: { theme: "Năm Kiến Trúc Vĩ Đại", advice: "Cơ hội xây dựng những điều to lớn. Tầm nhìn dài hạn kết hợp với hành động cụ thể." },
  33: { theme: "Năm Chữa Lành", advice: "Tình yêu và sự hy sinh vì cộng đồng. Năm phát huy tối đa tinh thần phục vụ và chữa lành." },
};

export function getPersonalYearInfo(dob: string, year: number): PersonalYearInfo {
  const personalYear = computePersonalYear(dob, year);
  const info = YEAR_THEMES[personalYear] || YEAR_THEMES[1];
  return { year, personalYear, ...info };
}
