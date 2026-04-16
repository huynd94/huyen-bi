// Simplified Tử Vi (Zi Wei Dou Shu) calculations for Vietnamese astrology

export const CUNG_NAMES = [
  "Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch",
  "Quan Lộc", "Nô Bộc", "Thiên Di", "Tật Ách",
  "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ",
];

export const THIEN_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
export const DIA_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

export const NGU_HANH = ["Thủy", "Thổ", "Mộc", "Mộc", "Thổ", "Hỏa", "Hỏa", "Thổ", "Kim", "Kim", "Thổ", "Thủy"];
export const NGU_HANH_COLOR: Record<string, string> = {
  "Thủy": "text-blue-400",
  "Thổ": "text-yellow-600",
  "Mộc": "text-green-500",
  "Hỏa": "text-red-500",
  "Kim": "text-slate-300",
};

export interface Star {
  name: string;
  type: "chinh-tinh" | "phu-tinh" | "sat-tinh";
  nguHanh?: string;
  desc: string;
}

export interface CungInfo {
  index: number;
  name: string;
  diaChi: string;
  thienCan: string;
  stars: Star[];
  nguHanh: string;
  desc: string;
}

export interface TuViResult {
  cungMenh: number;
  cungThanMenh: number;
  cungList: CungInfo[];
  canNam: string;
  chiNam: string;
  nguHanhCuc: string;
  cuccDesc: string;
  menh: string;
  menhDesc: string;
}

// Main star (Tử Vi) placement based on birthday
function getChinhTinhPosition(lunarDay: number, cuc: number): number {
  let pos = lunarDay % 12;
  if (lunarDay % cuc !== 0) {
    const mod = lunarDay % cuc;
    pos = (pos + cuc - mod) % 12;
  }
  return pos;
}

// Determine Cục (五行局) from Nạp Âm of birth year
function getCuc(can: number, chi: number): { cuc: number; name: string; ngu: string } {
  const napAm: Record<string, { cuc: number; name: string; ngu: string }> = {
    "0-0": { cuc: 2, name: "Thủy Nhị Cục", ngu: "Thủy" },
    "0-2": { cuc: 2, name: "Thủy Nhị Cục", ngu: "Thủy" },
    "2-4": { cuc: 3, name: "Mộc Tam Cục", ngu: "Mộc" },
    "4-6": { cuc: 4, name: "Kim Tứ Cục", ngu: "Kim" },
    "6-8": { cuc: 5, name: "Thổ Ngũ Cục", ngu: "Thổ" },
    "8-10": { cuc: 6, name: "Hỏa Lục Cục", ngu: "Hỏa" },
  };
  const key = `${can % 10}-${chi % 12}`;
  return napAm[key] || { cuc: 2, name: "Thủy Nhị Cục", ngu: "Thủy" };
}

// Cung Mệnh position based on birth month and hour
function getCungMenh(lunarMonth: number, birthHour: number): number {
  const gioChiMap: Record<string, number> = {
    "Tý": 0, "Sửu": 1, "Dần": 2, "Mão": 3, "Thìn": 4, "Tỵ": 5,
    "Ngọ": 6, "Mùi": 7, "Thân": 8, "Dậu": 9, "Tuất": 10, "Hợi": 11,
  };
  const hourChi = Math.floor(((birthHour + 1) % 24) / 2) % 12;
  const pos = (14 - lunarMonth - hourChi + 24) % 12;
  return pos;
}

// Main stars placement
const MAIN_STARS_BASE: { name: string; ngu: string; desc: string; offset: number }[] = [
  { name: "Tử Vi", ngu: "Thổ", desc: "Sao chủ mệnh, tượng trưng cho quyền lực, địa vị và sự lãnh đạo. Người có Tử Vi tọa mệnh thường có khí chất cao quý.", offset: 0 },
  { name: "Thiên Cơ", ngu: "Mộc", desc: "Sao của trí tuệ và mưu lược. Chủ về tư duy linh hoạt, biến hóa và sáng tạo.", offset: 1 },
  { name: "Thái Dương", ngu: "Hỏa", desc: "Sao biểu tượng cho ánh sáng, phú quý và nam giới. Tượng trưng cho cha, chồng và bề trên.", offset: 3 },
  { name: "Vũ Khúc", ngu: "Kim", desc: "Sao Tài Phú chủ về tiền bạc, của cải và sự cứng rắn trong quyết đoán.", offset: 4 },
  { name: "Thiên Đồng", ngu: "Thủy", desc: "Sao Phúc Đức mang năng lượng hòa thuận, thư thái và niềm vui trong cuộc sống.", offset: 5 },
  { name: "Liêm Trinh", ngu: "Hỏa", desc: "Sao có tính hai mặt — có thể là sao văn học, cũng có thể là sao thị phi. Chủ về nguyên tắc và đạo đức.", offset: 7 },
  { name: "Thiên Phủ", ngu: "Thổ", desc: "Sao chủ về kho tàng, bảo vệ và sự ổn định. Người có Thiên Phủ thường giàu có và được người khác tin tưởng.", offset: 9 },
  { name: "Thái Âm", ngu: "Thủy", desc: "Sao biểu tượng cho trực giác, mẹ và nữ giới. Chủ về cảm xúc, sáng tạo nghệ thuật và bất động sản.", offset: 10 },
  { name: "Tham Lang", ngu: "Thủy/Mộc", desc: "Sao đa dục chủ về ham muốn, tài năng đa dạng và sự hấp dẫn. Có thể mang lại danh vọng hoặc tai họa.", offset: 11 },
  { name: "Cự Môn", ngu: "Thủy", desc: "Sao của ngôn từ, khẩu thiệt và thị phi. Người có Cự Môn giỏi tranh luận nhưng dễ gặp thị phi.", offset: 2 },
  { name: "Thiên Tướng", ngu: "Thủy", desc: "Sao quan chức và pháp luật. Chủ về sự công bằng, tổ chức và địa vị xã hội.", offset: 6 },
  { name: "Thiên Lương", ngu: "Mộc", desc: "Sao y dược, đạo đức và thọ mạng. Người có Thiên Lương thường có tấm lòng nhân từ.", offset: 8 },
  { name: "Thất Sát", ngu: "Kim/Hỏa", desc: "Sao của dũng khí và quyết đoán. Chủ về chinh phạt, hành động mạnh mẽ. Người này không ngại thử thách.", offset: 0 },
  { name: "Phá Quân", ngu: "Thủy", desc: "Sao phá cách, cải tổ và đột phá. Chủ về thay đổi, cách mạng và sự kiên trì không theo lề thói cũ.", offset: 6 },
];

const PHU_TINH: { name: string; desc: string }[] = [
  { name: "Văn Khúc", desc: "Sao văn học, âm nhạc và nghệ thuật" },
  { name: "Văn Xương", desc: "Sao học vấn, thi cử và bằng cấp" },
  { name: "Tả Phù", desc: "Sao quý nhân phù trợ bên trái" },
  { name: "Hữu Bật", desc: "Sao quý nhân phù trợ bên phải" },
  { name: "Lộc Tồn", desc: "Sao phú quý, lộc tài và bổng lộc" },
  { name: "Thiên Khôi", desc: "Sao quý nhân nam giới" },
  { name: "Thiên Việt", desc: "Sao quý nhân nữ giới" },
];

const SAT_TINH: { name: string; desc: string }[] = [
  { name: "Kình Dương", desc: "Sao cương cường, hay gặp tranh đấu và thương tích" },
  { name: "Đà La", desc: "Sao chướng ngại, gây trì hoãn và cản trở" },
  { name: "Hỏa Tinh", desc: "Sao nóng vội, gây tai họa bất ngờ" },
  { name: "Linh Tinh", desc: "Sao linh dị, gây chuyện bất thường và kỳ lạ" },
];

const CUNG_DESC: string[] = [
  "Cung Mệnh chủ về tính cách, vóc dáng, tài năng thiên phú và hướng đi cuộc đời của bạn.",
  "Cung Phụ Mẫu chủ về mối quan hệ với cha mẹ, người bề trên và bề ngoài khuôn mặt.",
  "Cung Phúc Đức chủ về phúc phần, tâm linh, tiền kiếp và niềm vui tinh thần.",
  "Cung Điền Trạch chủ về nhà cửa, bất động sản, tài sản thừa hưởng và môi trường sống.",
  "Cung Quan Lộc chủ về sự nghiệp, công danh, địa vị và cách thức làm việc.",
  "Cung Nô Bộc chủ về nhân viên, bộ hạ, bạn bè và những người phục vụ bạn.",
  "Cung Thiên Di chủ về di chuyển, xuất ngoại, giao lưu xã hội và vận may bên ngoài.",
  "Cung Tật Ách chủ về sức khỏe, bệnh tật, vận số tai họa và thể chất.",
  "Cung Tài Bạch chủ về tiền bạc, thu nhập, cách kiếm tiền và khả năng tích lũy.",
  "Cung Tử Tức chủ về con cái, học trò, sáng tạo và mối quan hệ với thế hệ sau.",
  "Cung Phu Thê chủ về hôn nhân, tình duyên, vợ/chồng và quan hệ đôi lứa.",
  "Cung Huynh Đệ chủ về anh chị em, bạn bè thân thiết và người cùng lứa.",
];

export function calculateTuVi(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  birthHour: number,
  gender: "nam" | "nu"
): TuViResult {
  const canIdx = (lunarYear + 6) % 10;
  const chiIdx = (lunarYear + 8) % 12;
  const canNam = THIEN_CAN[canIdx];
  const chiNam = DIA_CHI[chiIdx];

  const { cuc, name: cuccDesc, ngu: nguHanhCuc } = getCuc(canIdx, chiIdx);
  const cungMenh = getCungMenh(lunarMonth, birthHour);

  // Cung Thân Mệnh (co-body palace)
  const cungThanMenh = (cungMenh + 6) % 12;

  // Place main stars
  const chiTinhPos = getChinhTinhPosition(lunarDay, cuc);

  // Build the 12 palaces
  const cungList: CungInfo[] = DIA_CHI.map((dc, i) => ({
    index: i,
    name: CUNG_NAMES[(i - cungMenh + 12) % 12],
    diaChi: dc,
    thienCan: THIEN_CAN[(canIdx * 2 + i) % 10],
    stars: [],
    nguHanh: NGU_HANH[i],
    desc: CUNG_DESC[(i - cungMenh + 12) % 12],
  }));

  // Place main stars (simplified)
  MAIN_STARS_BASE.forEach((star, idx) => {
    const pos = (chiTinhPos + star.offset) % 12;
    cungList[pos].stars.push({
      name: star.name,
      type: "chinh-tinh",
      nguHanh: star.ngu,
      desc: star.desc,
    });
  });

  // Place auxiliary stars
  PHU_TINH.forEach((star, idx) => {
    const pos = (cungMenh + idx * 2) % 12;
    cungList[pos].stars.push({ name: star.name, type: "phu-tinh", desc: star.desc });
  });

  // Place inauspicious stars
  SAT_TINH.forEach((star, idx) => {
    const pos = (chiTinhPos + idx * 3 + 5) % 12;
    cungList[pos].stars.push({ name: star.name, type: "sat-tinh", desc: star.desc });
  });

  // Mệnh cục description based on gender and year
  const menhList = ["Kim Tứ", "Thủy Nhị", "Hỏa Lục", "Thổ Ngũ", "Mộc Tam"];
  const menh = menhList[canIdx % 5];
  const menhDesc = `Mệnh ${menh} — ${
    canIdx % 2 === 0 ? "Dương" : "Âm"
  } ${THIEN_CAN[canIdx]}. Người mệnh này ${
    nguHanhCuc === "Hỏa" ? "nhiệt tình, quyết đoán, dễ nóng vội" :
    nguHanhCuc === "Thủy" ? "linh hoạt, thông minh, có trực giác tốt" :
    nguHanhCuc === "Mộc" ? "nhân từ, kiên nhẫn, yêu thiên nhiên" :
    nguHanhCuc === "Kim" ? "cứng rắn, chính trực, có ý chí mạnh mẽ" :
    "ổn định, đáng tin cậy, kiên định với mục tiêu"
  }.`;

  return { cungMenh, cungThanMenh, cungList, canNam, chiNam, nguHanhCuc, cuccDesc, menh, menhDesc };
}
