// Annual Stars (Sao Hạn) system
// Based on the 12 Earthly Branches (Địa Chi) of birth year vs current year

const DIA_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const THIEN_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];

// The 12 annual stars rotate through the 12 zodiac positions each year.
// Each star has a fixed "starting" zodiac in a reference year.
// We compute which star shines on each zodiac sign in a given year.

export interface SaoInfo {
  name: string;
  viet: string;
  type: "cat" | "hung" | "trung";
  strength: "Cát Nhất" | "Đại Cát" | "Cát" | "Bình" | "Hung" | "Đại Hung";
  desc: string;
  advice: string;
  areas: string[];
}

const SAO_LIST: SaoInfo[] = [
  {
    name: "Thái Tuế", viet: "太歲", type: "trung", strength: "Bình",
    desc: "Sao Thái Tuế chiếu mệnh là năm bản mệnh — dễ xảy ra thay đổi lớn, sức khỏe cần chú ý.",
    advice: "Tránh xây dựng, dời chuyển mà không chuẩn bị kỹ. Nên cẩn thận trong quyết định lớn.",
    areas: ["Sức khoẻ", "Cung mệnh"],
  },
  {
    name: "Thái Dương", viet: "太陽", type: "cat", strength: "Đại Cát",
    desc: "Sao tốt nhất trong năm. Quý nhân phù trợ, công danh hanh thông, được nhiều người giúp đỡ.",
    advice: "Đây là năm thuận lợi để thăng tiến, mở rộng quan hệ và khởi nghiệp.",
    areas: ["Sự nghiệp", "Quý nhân", "Danh tiếng"],
  },
  {
    name: "Tướng Tinh", viet: "將星", type: "cat", strength: "Cát",
    desc: "Sao uy quyền, thích hợp cho người làm quản lý, lãnh đạo. Dễ được giao trọng trách.",
    advice: "Nên chủ động thể hiện năng lực. Cơ hội thăng chức hoặc phụ trách dự án lớn.",
    areas: ["Quyền lực", "Lãnh đạo", "Sự nghiệp"],
  },
  {
    name: "Hoa Cái", viet: "華蓋", type: "trung", strength: "Bình",
    desc: "Sao trí tuệ và tâm linh. Thích hợp học thuật, nghiên cứu, tôn giáo nhưng dễ cô đơn.",
    advice: "Nên đầu tư vào học hỏi, trau dồi kỹ năng. Hạn chế cô lập bản thân.",
    areas: ["Học thuật", "Tâm linh", "Sáng tạo"],
  },
  {
    name: "Kiếp Sát", viet: "劫殺", type: "hung", strength: "Hung",
    desc: "Sao tai họa bất ngờ, dễ bị tổn thất về tài chính, sức khoẻ hoặc gặp nạn bên ngoài.",
    advice: "Nên cẩn thận khi ra ngoài, tránh rủi ro tài chính, không đầu tư lớn năm này.",
    areas: ["Tài chính", "An toàn", "Sức khoẻ"],
  },
  {
    name: "Thiên Đức", viet: "天德", type: "cat", strength: "Đại Cát",
    desc: "Sao phúc đức từ trời. Được quý nhân che chở, hóa giải tai họa và gặp nhiều may mắn.",
    advice: "Năm có sao Thiên Đức rất tốt để làm từ thiện, giúp người. Phúc đức sẽ nhân đôi.",
    areas: ["Phúc lộc", "Quý nhân", "Hóa giải"],
  },
  {
    name: "Nguyệt Đức", viet: "月德", type: "cat", strength: "Cát",
    desc: "Sao phúc đức hàng tháng. Nhẹ hơn Thiên Đức nhưng hỗ trợ mọi mặt cuộc sống.",
    advice: "Thích hợp cho các giao dịch, ký kết hợp đồng và khởi sự công việc mới.",
    areas: ["Tài lộc", "Công việc", "Gia đình"],
  },
  {
    name: "La Hầu", viet: "羅睺", type: "hung", strength: "Đại Hung",
    desc: "Sao hung mạnh nhất. Gây tranh chấp, kiện tụng, thị phi, dễ bị hãm hại.",
    advice: "Cực kỳ cẩn thận trong quan hệ, tránh tranh chấp pháp lý. Nên cúng giải hạn.",
    areas: ["Pháp lý", "Thị phi", "Sức khoẻ"],
  },
  {
    name: "Thiên Y", viet: "天醫", type: "cat", strength: "Cát",
    desc: "Sao sức khoẻ và chữa bệnh. Tốt cho ngành y, có thể hồi phục bệnh tật.",
    advice: "Năm này thích hợp điều trị dứt điểm bệnh mãn tính và chăm sóc sức khoẻ.",
    areas: ["Sức khoẻ", "Y tế", "Phục hồi"],
  },
  {
    name: "Bệnh Phù", viet: "病符", type: "hung", strength: "Hung",
    desc: "Sao bệnh tật. Dễ ốm đau, chấn thương hoặc người thân đổ bệnh.",
    advice: "Chú ý sức khoẻ, kiểm tra định kỳ. Tránh hoạt động nguy hiểm.",
    areas: ["Sức khoẻ", "Gia đình"],
  },
  {
    name: "Phúc Tinh", viet: "福星", type: "cat", strength: "Đại Cát",
    desc: "Sao phúc lộc dồi dào, tiền tài đến dễ, gia đình bình an, vạn sự suôn sẻ.",
    advice: "Tận dụng năm thuận để đầu tư, mở rộng kinh doanh và tích lũy tài sản.",
    areas: ["Tài lộc", "Gia đình", "Hạnh phúc"],
  },
  {
    name: "Tuế Phá", viet: "歲破", type: "hung", strength: "Đại Hung",
    desc: "Sao phá hại. Tài sản hao tán, kế hoạch dễ đổ vỡ, quan hệ dễ rạn nứt.",
    advice: "Không nên đầu tư lớn hay khởi sự. Tập trung củng cố những gì đang có.",
    areas: ["Tài chính", "Sự nghiệp", "Hôn nhân"],
  },
];

// Stars distribution by birth-year Chi relative to current year
// Index = (currentYearChi - birthYearChi + 12) % 12 → which star shines
const SAO_ROTATION: number[] = [0, 11, 10, 1, 3, 2, 7, 8, 5, 6, 4, 9];
// Extra secondary stars (mỗi năm có thêm 2-3 sao phụ)
const SECONDARY_SAO: SaoInfo[] = [
  { name: "Văn Xương", viet: "文昌", type: "cat", strength: "Cát", desc: "Sao học vấn và văn chương. Thi cử đỗ đạt, văn tài nổi bật.", advice: "Nên đầu tư vào học tập, thi cử, hoặc sáng tác.", areas: ["Học vấn", "Thi cử"] },
  { name: "Lộc Tồn", viet: "祿存", type: "cat", strength: "Cát", desc: "Sao bảo tồn tài lộc và tích lũy.", advice: "Giữ gìn tài sản, tránh chi tiêu hoang phí.", areas: ["Tài lộc"] },
  { name: "Đào Hoa", viet: "桃花", type: "trung", strength: "Bình", desc: "Sao duyên tình. Dễ có duyên mới nhưng cũng dễ thị phi tình ái.", advice: "Độc thân có thể gặp duyên mới. Có gia đình cần thận trọng.", areas: ["Tình cảm"] },
];

function getSecondaryStars(birthChiIdx: number, currentYear: number): SaoInfo[] {
  const idx = currentYear % 3;
  return [SECONDARY_SAO[idx]];
}

export interface AnnualStarResult {
  year: number;
  canChi: string;
  birthCanChi: string;
  mainStar: SaoInfo;
  secondaryStars: SaoInfo[];
  overallLuck: "Đại Lợi" | "Tốt" | "Trung Bình" | "Cẩn Thận" | "Hóa Giải";
  overallScore: number;
  summary: string;
}

export function computeAnnualStars(birthYear: number, targetYear: number): AnnualStarResult {
  const birthChiIdx = ((birthYear - 4) % 12 + 12) % 12;
  const currentChiIdx = ((targetYear - 4) % 12 + 12) % 12;
  const birthCanIdx = ((birthYear - 4) % 10 + 10) % 10;
  const currentCanIdx = ((targetYear - 4) % 10 + 10) % 10;

  const rotation = (currentChiIdx - birthChiIdx + 12) % 12;
  const mainStarIdx = SAO_ROTATION[rotation];
  const mainStar = SAO_LIST[mainStarIdx];
  const secondaryStars = getSecondaryStars(birthChiIdx, targetYear);

  const birthCanChi = `${THIEN_CAN[birthCanIdx]} ${DIA_CHI[birthChiIdx]}`;
  const currentCanChi = `${THIEN_CAN[currentCanIdx]} ${DIA_CHI[currentChiIdx]}`;

  const catCount = [mainStar, ...secondaryStars].filter(s => s.type === "cat").length;
  const hungCount = [mainStar, ...secondaryStars].filter(s => s.type === "hung").length;
  const score = Math.min(100, Math.max(0,
    (mainStar.type === "cat" ? 70 : mainStar.type === "hung" ? 25 : 50) +
    catCount * 8 - hungCount * 12
  ));

  const overallLuck = score >= 85 ? "Đại Lợi" : score >= 70 ? "Tốt" : score >= 50 ? "Trung Bình" : score >= 35 ? "Cẩn Thận" : "Hóa Giải";
  const summary = mainStar.type === "cat"
    ? `Năm ${currentCanChi}, bản mệnh (${DIA_CHI[birthChiIdx]}) hội tụ sao ${mainStar.name} — ${mainStar.desc}`
    : `Năm ${currentCanChi}, bản mệnh (${DIA_CHI[birthChiIdx]}) gặp sao ${mainStar.name} — ${mainStar.desc} Cần ${mainStar.advice}`;

  return { year: targetYear, canChi: currentCanChi, birthCanChi, mainStar, secondaryStars, overallLuck, overallScore: score, summary };
}

export function getMultiYearForecast(birthYear: number, startYear: number, count = 5): AnnualStarResult[] {
  return Array.from({ length: count }, (_, i) => computeAnnualStars(birthYear, startYear + i));
}
