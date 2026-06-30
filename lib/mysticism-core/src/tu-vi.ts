// Tử Vi Đẩu Số (Zi Wei Dou Shu) — standard 14-major-star placement.
//
// Replaces the previous "simplified" placement (lunarDay % cuc + offset) which
// did not follow the canonical rules and could collide stars. This implements
// the textbook algorithm, verified against the canonical "Tử Vi tại Ngọ" chart
// and the open-source iztro engine:
//   - Cung Mệnh / Thân from lunar month + birth-hour branch.
//   - Cục (Ngũ Hành Cục) from the Mệnh palace's Can+Chi via Nạp Âm.
//   - Tử Vi position from Cục + lunar day (quotient/offset rule), then the
//     Tử Vi group (counter-clockwise) and Thiên Phủ group (clockwise).
//   - A set of standard auxiliary stars with unambiguous textbook formulas.
//
// All palace math uses two index frames:
//   branch frame: Tý=0 … Hợi=11
//   palace frame: Dần=0 … (palace = branch - 2). The Tử Vi quotient rule is
//                 cleanest in the palace frame; we convert back to branches.

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

const mod12 = (n: number) => ((n % 12) + 12) % 12;
const mod10 = (n: number) => ((n % 10) + 10) % 10;

// ── Cục from Mệnh palace Can+Chi (Nạp Âm) ────────────────────────────────────
// Ngũ Hổ Độn: stem of the Dần palace from the year stem.
const TIGER_RULE_DAN_STEM = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0]; // yearStem → Dần stem
// idx (1..5) → Cục number. Note the deliberately non-sequential mapping.
const CUC_BY_IDX = [3, 4, 2, 6, 5]; // Mộc3, Kim4, Thủy2, Hỏa6, Thổ5
const CUC_META: Record<number, { name: string; ngu: string }> = {
  2: { name: "Thủy Nhị Cục", ngu: "Thủy" },
  3: { name: "Mộc Tam Cục", ngu: "Mộc" },
  4: { name: "Kim Tứ Cục", ngu: "Kim" },
  5: { name: "Thổ Ngũ Cục", ngu: "Thổ" },
  6: { name: "Hỏa Lục Cục", ngu: "Hỏa" },
};

function getCuc(yearCanIdx: number, menhBranch: number): { cuc: number; name: string; ngu: string } {
  const danStem = TIGER_RULE_DAN_STEM[yearCanIdx];
  const menhPalaceIdx = mod12(menhBranch - 2); // palace frame (Dần=0)
  const menhStem = mod10(danStem + menhPalaceIdx);
  const stemNum = Math.floor(menhStem / 2) + 1; // 1..5
  const branchNum = Math.floor((menhBranch % 6) / 2) + 1; // 1..3
  let idx = stemNum + branchNum;
  while (idx > 5) idx -= 5; // 1..5
  const cuc = CUC_BY_IDX[idx - 1];
  return { cuc, ...CUC_META[cuc] };
}

// ── Tử Vi position (palace frame) ────────────────────────────────────────────
function getZiweiPalaceIndex(lunarDay: number, cuc: number): number {
  let offset = -1;
  let quotient = 0;
  let remainder = 1;
  let day = lunarDay;
  do {
    offset += 1;
    const divisor = day + offset;
    quotient = Math.floor(divisor / cuc);
    remainder = divisor % cuc;
  } while (remainder !== 0);

  let ziweiP = mod12(quotient) - 1;
  ziweiP = offset % 2 === 0 ? ziweiP + offset : ziweiP - offset;
  return mod12(ziweiP);
}

// ── Star definitions ─────────────────────────────────────────────────────────
// Tử Vi group placed COUNTER-CLOCKWISE (branch − offset) from Tử Vi.
const ZIWEI_GROUP: { name: string; ngu: string; offset: number; desc: string }[] = [
  { name: "Tử Vi", ngu: "Thổ", offset: 0, desc: "Đế tinh — quyền lực, địa vị, khí chất cao quý và khả năng lãnh đạo." },
  { name: "Thiên Cơ", ngu: "Mộc", offset: 1, desc: "Sao trí tuệ, mưu lược, tư duy linh hoạt và biến hóa." },
  { name: "Thái Dương", ngu: "Hỏa", offset: 3, desc: "Sao ánh sáng, phú quý, danh tiếng; tượng cho cha, chồng, quý nam." },
  { name: "Vũ Khúc", ngu: "Kim", offset: 4, desc: "Tài tinh — tiền bạc, của cải, sự cương quyết và quả cảm." },
  { name: "Thiên Đồng", ngu: "Thủy", offset: 5, desc: "Phúc tinh — hòa thuận, an nhàn, hưởng thụ và niềm vui sống." },
  { name: "Liêm Trinh", ngu: "Hỏa", offset: 8, desc: "Sao hai mặt — kỷ luật, nguyên tắc, nhưng cũng dễ thị phi tù tụng." },
];

// Thiên Phủ group placed CLOCKWISE (branch + offset) from Thiên Phủ.
const TIANFU_GROUP: { name: string; ngu: string; offset: number; desc: string }[] = [
  { name: "Thiên Phủ", ngu: "Thổ", offset: 0, desc: "Kho tàng, sự ổn định, bảo thủ và được người tin cậy." },
  { name: "Thái Âm", ngu: "Thủy", offset: 1, desc: "Sao của trực giác, nghệ thuật, bất động sản; tượng cho mẹ, vợ, quý nữ." },
  { name: "Tham Lang", ngu: "Thủy", offset: 2, desc: "Sao đa dục — ham muốn, tài năng đa dạng, sức hấp dẫn và giao tế." },
  { name: "Cự Môn", ngu: "Thủy", offset: 3, desc: "Sao khẩu thiệt — ngôn từ, tranh luận, dễ gặp thị phi." },
  { name: "Thiên Tướng", ngu: "Thủy", offset: 4, desc: "Sao quan ấn — công bằng, tổ chức, địa vị và quý phái." },
  { name: "Thiên Lương", ngu: "Mộc", offset: 5, desc: "Sao ấm áp, y dược, đạo đức, thọ mạng và lòng nhân từ." },
  { name: "Thất Sát", ngu: "Kim", offset: 6, desc: "Sao dũng khí — quyết đoán, hành động mạnh mẽ, không ngại thử thách." },
  { name: "Phá Quân", ngu: "Thủy", offset: 10, desc: "Sao phá cách — cải tổ, đột phá, thay đổi và kiên trì khác lề thói." },
];

// ── Auxiliary stars (standard textbook formulas) ─────────────────────────────
// Lộc Tồn by year stem (branch index).
const LOC_TON_BY_STEM = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];
// Thiên Khôi / Thiên Việt by year stem (branch index).
const THIEN_KHOI_BY_STEM = [1, 0, 11, 11, 1, 0, 1, 6, 3, 3];
const THIEN_VIET_BY_STEM = [7, 8, 9, 9, 7, 8, 7, 2, 5, 5];

const CUNG_DESC: string[] = [
  "Cung Mệnh chủ về tính cách, tài năng thiên phú và hướng đi cuộc đời.",
  "Cung Phụ Mẫu chủ về cha mẹ, người bề trên và phúc ấm gia đình.",
  "Cung Phúc Đức chủ về phúc phần, tâm linh và niềm vui tinh thần.",
  "Cung Điền Trạch chủ về nhà cửa, bất động sản và tài sản thừa hưởng.",
  "Cung Quan Lộc chủ về sự nghiệp, công danh và địa vị.",
  "Cung Nô Bộc chủ về bạn bè, cấp dưới và các mối quan hệ xã hội.",
  "Cung Thiên Di chủ về di chuyển, xuất ngoại và vận may bên ngoài.",
  "Cung Tật Ách chủ về sức khỏe, bệnh tật và tai ách.",
  "Cung Tài Bạch chủ về tiền bạc, thu nhập và khả năng tích lũy.",
  "Cung Tử Tức chủ về con cái, học trò và sức sáng tạo.",
  "Cung Phu Thê chủ về hôn nhân, tình duyên và bạn đời.",
  "Cung Huynh Đệ chủ về anh chị em và người cùng lứa thân thiết.",
];

/**
 * Build a full Tử Vi chart.
 * @param lunarYear lunar year (used for Can/Chi and Cục)
 * @param lunarMonth lunar month 1–12
 * @param lunarDay lunar day 1–30
 * @param birthHour clock hour 0–23
 * @param gender "nam" | "nu" (does not affect the 14 major stars)
 */
export function calculateTuVi(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  birthHour: number,
  gender: "nam" | "nu",
): TuViResult {
  const canIdx = mod10(lunarYear + 6);
  const chiIdx = mod12(lunarYear + 8);
  const canNam = THIEN_CAN[canIdx];
  const chiNam = DIA_CHI[chiIdx];

  // Birth-hour branch (Tý=0). 23:00–00:59 → Tý.
  const hourBranch = Math.floor(((birthHour + 1) % 24) / 2) % 12;

  // Mệnh & Thân.
  const cungMenh = mod12(lunarMonth + 1 - hourBranch);
  const cungThanMenh = mod12(lunarMonth + 1 + hourBranch);

  // Cục.
  const { cuc, name: cuccDesc, ngu: nguHanhCuc } = getCuc(canIdx, cungMenh);

  // Tử Vi & Thiên Phủ positions (branch frame).
  const ziweiP = getZiweiPalaceIndex(lunarDay, cuc);
  const ziweiBranch = mod12(ziweiP + 2);
  const tianfuBranch = mod12(4 - ziweiBranch);

  // Build empty palaces. Palace name advances clockwise from Mệnh.
  const cungList: CungInfo[] = DIA_CHI.map((dc, i) => ({
    index: i,
    name: CUNG_NAMES[mod12(i - cungMenh)],
    diaChi: dc,
    // Stem of each palace via Ngũ Hổ Độn (Dần stem + palace offset).
    thienCan: THIEN_CAN[mod10(TIGER_RULE_DAN_STEM[canIdx] + mod12(i - 2))],
    stars: [],
    nguHanh: NGU_HANH[i],
    desc: CUNG_DESC[mod12(i - cungMenh)],
  }));

  const place = (branch: number, star: Star) => cungList[branch].stars.push(star);

  // 14 major stars.
  for (const s of ZIWEI_GROUP) {
    place(mod12(ziweiBranch - s.offset), { name: s.name, type: "chinh-tinh", nguHanh: s.ngu, desc: s.desc });
  }
  for (const s of TIANFU_GROUP) {
    place(mod12(tianfuBranch + s.offset), { name: s.name, type: "chinh-tinh", nguHanh: s.ngu, desc: s.desc });
  }

  // Auxiliary stars (standard formulas).
  const locTon = LOC_TON_BY_STEM[canIdx];
  place(locTon, { name: "Lộc Tồn", type: "phu-tinh", desc: "Sao tài lộc, bổng lộc và tích lũy của cải." });
  place(mod12(locTon + 1), { name: "Kình Dương", type: "sat-tinh", desc: "Sao cương cường, dễ gặp tranh đấu và thương tích." });
  place(mod12(locTon - 1), { name: "Đà La", type: "sat-tinh", desc: "Sao chướng ngại, gây trì hoãn và cản trở." });
  place(mod12(3 + lunarMonth), { name: "Tả Phù", type: "phu-tinh", desc: "Quý nhân phù trợ bên trái, trợ lực âm thầm." });
  place(mod12(11 - lunarMonth), { name: "Hữu Bật", type: "phu-tinh", desc: "Quý nhân phù trợ bên phải, hỗ trợ đắc lực." });
  place(mod12(10 - hourBranch), { name: "Văn Xương", type: "phu-tinh", desc: "Sao học vấn, văn chương, thi cử và bằng cấp." });
  place(mod12(4 + hourBranch), { name: "Văn Khúc", type: "phu-tinh", desc: "Sao văn nghệ, tài hoa, âm nhạc và khẩu tài." });
  place(THIEN_KHOI_BY_STEM[canIdx], { name: "Thiên Khôi", type: "phu-tinh", desc: "Quý nhân ban ngày, giúp đỡ hiển lộ." });
  place(THIEN_VIET_BY_STEM[canIdx], { name: "Thiên Việt", type: "phu-tinh", desc: "Quý nhân ban đêm, giúp đỡ kín đáo." });

  const menhList = ["Kim Tứ", "Thủy Nhị", "Hỏa Lục", "Thổ Ngũ", "Mộc Tam"];
  const menh = menhList[canIdx % 5];
  const menhDesc = `Mệnh ${nguHanhCuc} (${cuccDesc}) — ${
    canIdx % 2 === 0 ? "Dương" : "Âm"
  } ${canNam}. Người mệnh này ${
    nguHanhCuc === "Hỏa" ? "nhiệt tình, quyết đoán, dễ nóng vội" :
    nguHanhCuc === "Thủy" ? "linh hoạt, thông minh, có trực giác tốt" :
    nguHanhCuc === "Mộc" ? "nhân từ, kiên nhẫn, yêu thiên nhiên" :
    nguHanhCuc === "Kim" ? "cứng rắn, chính trực, có ý chí mạnh mẽ" :
    "ổn định, đáng tin cậy, kiên định với mục tiêu"
  }.`;

  return { cungMenh, cungThanMenh, cungList, canNam, chiNam, nguHanhCuc, cuccDesc, menh, menhDesc };
}
