const THIEN_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const DIA_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const ZODIAC_VN = ["Chuột", "Trâu", "Hổ", "Mèo", "Rồng", "Rắn", "Ngựa", "Dê", "Khỉ", "Gà", "Chó", "Lợn"];

export interface GenderPerson { dob: string; gender: "nam" | "nu"; }

// ─── Ming Gua (Mệnh Quái) ────────────────────────────────────────────────────
export function computeMingGua(year: number, gender: "nam" | "nu"): number {
  const lastTwo = year % 100;
  const digitSum = Math.floor(lastTwo / 10) + (lastTwo % 10);
  const reduced = digitSum >= 10 ? Math.floor(digitSum / 10) + (digitSum % 10) : digitSum;
  if (gender === "nam") {
    const g = 10 - reduced;
    return g === 0 ? 9 : g === 5 ? 2 : g;
  } else {
    const g = 5 + reduced;
    const r = g > 9 ? g - 9 : g;
    return r === 5 ? 8 : r;
  }
}

// East group: 1(Khảm),3(Chấn),4(Tốn),9(Ly) / West group: 2(Khôn),6(Càn),7(Đoài),8(Cấn)
const EAST_GROUP = [1, 3, 4, 9];
const WEST_GROUP = [2, 6, 7, 8];

const GUA_INFO: Record<number, { name: string; element: string; direction: string }> = {
  1: { name: "Khảm", element: "Thuỷ", direction: "Bắc" },
  2: { name: "Khôn", element: "Thổ", direction: "Tây Nam" },
  3: { name: "Chấn", element: "Mộc", direction: "Đông" },
  4: { name: "Tốn", element: "Mộc", direction: "Đông Nam" },
  6: { name: "Càn", element: "Kim", direction: "Tây Bắc" },
  7: { name: "Đoài", element: "Kim", direction: "Tây" },
  8: { name: "Cấn", element: "Thổ", direction: "Đông Bắc" },
  9: { name: "Ly", element: "Hoả", direction: "Nam" },
};

// ─── Can Chi year ─────────────────────────────────────────────────────────────
function getCanChiYear(year: number): { can: string; chi: string; chiIndex: number } {
  const canIdx = (year - 4) % 10;
  const chiIdx = (year - 4) % 12;
  return { can: THIEN_CAN[(canIdx + 10) % 10], chi: DIA_CHI[(chiIdx + 12) % 12], chiIndex: (chiIdx + 12) % 12 };
}

// ─── Zodiac compatibility (Tam Hợp + Lục Hợp + Tương Khắc) ──────────────────
// Tam Hợp groups: [Dần,Ngọ,Tuất], [Thân,Tý,Thìn], [Hợi,Mão,Mùi], [Tỵ,Dậu,Sửu]
const TAM_HOP: number[][] = [[2, 6, 10], [8, 0, 4], [11, 3, 7], [5, 9, 1]];
// Lục Hợp pairs: Tý-Sửu(0,1), Dần-Hợi(2,11), Mão-Tuất(3,10), Thìn-Dậu(4,9), Tỵ-Thân(5,8), Ngọ-Mùi(6,7)
const LUC_HOP: [number, number][] = [[0,1],[2,11],[3,10],[4,9],[5,8],[6,7]];
// Tương Khắc (Lục Hại): Tý-Mùi(0,7), Sửu-Ngọ(1,6), Dần-Tỵ(2,5), Mão-Thìn(3,4), Thân-Hợi(8,11), Dậu-Tuất(9,10)
const TUONG_KHAC: [number, number][] = [[0,7],[1,6],[2,5],[3,4],[8,11],[9,10]];
// Tam Hình (punishment): Dần-Tỵ-Thân(2,5,8), Sửu-Tuất-Mùi(1,10,7), Tý-Mão(0,3)
const TUONG_HINH: [number, number][] = [[0,3],[1,10],[1,7],[10,7],[2,5],[2,8],[5,8]];

function getZodiacRelation(a: number, b: number): { type: string; desc: string; score: number } {
  for (const group of TAM_HOP) {
    if (group.includes(a) && group.includes(b)) return { type: "Tam Hợp", desc: "Cực kỳ tương hợp — cùng nhóm năng lượng, hỗ trợ nhau rất mạnh.", score: 95 };
  }
  for (const [x, y] of LUC_HOP) {
    if ((x === a && y === b) || (x === b && y === a)) return { type: "Lục Hợp", desc: "Rất tương hợp — đôi hợp bẩm sinh, dễ giao cảm và đồng thuận.", score: 88 };
  }
  for (const [x, y] of TUONG_HINH) {
    if ((x === a && y === b) || (x === b && y === a)) return { type: "Tương Hình", desc: "Dễ xảy ra va chạm, cần nhường nhịn và thấu hiểu lẫn nhau.", score: 45 };
  }
  for (const [x, y] of TUONG_KHAC) {
    if ((x === a && y === b) || (x === b && y === a)) return { type: "Tương Hại", desc: "Hay hiểu lầm nhau, cần giao tiếp cởi mở để tránh rạn nứt.", score: 38 };
  }
  const diff = Math.abs(a - b);
  if (diff === 6) return { type: "Tương Xung", desc: "Đối lập nhau — năng lượng trái chiều, dễ bất đồng trong quyết định lớn.", score: 30 };
  return { type: "Bình Thường", desc: "Không có cung hợp hay khắc đặc biệt — mối quan hệ phụ thuộc nhiều vào tính cách.", score: 62 };
}

// ─── Ngũ Hành Can Chi compatibility ──────────────────────────────────────────
const NGU_HANH_CAN = ["Mộc","Mộc","Hoả","Hoả","Thổ","Thổ","Kim","Kim","Thuỷ","Thuỷ"];
// Sinh: Thuỷ→Mộc→Hoả→Thổ→Kim→Thuỷ
// Khắc: Mộc→Thổ, Thổ→Thuỷ, Thuỷ→Hoả, Hoả→Kim, Kim→Mộc
const SINH: Record<string, string> = { "Thuỷ":"Mộc","Mộc":"Hoả","Hoả":"Thổ","Thổ":"Kim","Kim":"Thuỷ" };
const KHAC: Record<string, string> = { "Mộc":"Thổ","Thổ":"Thuỷ","Thuỷ":"Hoả","Hoả":"Kim","Kim":"Mộc" };

function getNguHanhCanRel(yearA: number, yearB: number): { type: string; score: number } {
  const eA = NGU_HANH_CAN[(yearA - 4 + 10) % 10 < 0 ? ((yearA - 4) % 10 + 10) % 10 : ((yearA - 4) % 10 + 10) % 10];
  const eB = NGU_HANH_CAN[((yearB - 4) % 10 + 10) % 10];
  if (eA === eB) return { type: `${eA} - ${eB}: Tỷ Hoà`, score: 72 };
  if (SINH[eA] === eB) return { type: `${eA} sinh ${eB}`, score: 85 };
  if (SINH[eB] === eA) return { type: `${eB} sinh ${eA}`, score: 85 };
  if (KHAC[eA] === eB) return { type: `${eA} khắc ${eB}`, score: 42 };
  if (KHAC[eB] === eA) return { type: `${eB} khắc ${eA}`, score: 42 };
  return { type: `${eA} - ${eB}: Trung lập`, score: 62 };
}

// ─── Ming Gua house group compatibility ──────────────────────────────────────
function getMingGuaCompat(guaA: number, guaB: number): { type: string; score: number; desc: string } {
  const sameGroup = (EAST_GROUP.includes(guaA) && EAST_GROUP.includes(guaB)) || (WEST_GROUP.includes(guaA) && WEST_GROUP.includes(guaB));
  if (sameGroup) return { type: "Đồng Cung", score: 88, desc: "Cùng nhóm Đông/Tây — phong thủy và hướng tốt trùng nhau, sống chung rất thuận." };
  return { type: "Dị Cung", score: 50, desc: "Khác nhóm Đông/Tây — hướng tốt ngược nhau, cần cân bằng khi bố trí không gian sống." };
}

// ─── Numerology life path compatibility ───────────────────────────────────────
function reduceNum(n: number): number {
  if (n === 11 || n === 22 || n === 33) return n;
  if (n < 10) return n;
  return reduceNum(n.toString().split("").map(Number).reduce((a, b) => a + b, 0));
}
function computeLifePath(dob: string): number {
  return reduceNum(dob.replace(/\D/g, "").split("").map(Number).reduce((a, b) => a + b, 0));
}
// Harmonious number pairs
const COMPAT_NUMS: [number, number, number][] = [
  [1,5,70],[1,1,68],[1,3,80],[1,6,72],[2,4,82],[2,6,88],[2,8,82],[3,6,90],
  [3,9,85],[4,7,80],[4,1,72],[5,7,78],[6,9,88],[6,2,88],[7,9,82],[8,2,82],
  [8,4,78],[9,3,85],[9,6,88],[1,9,75],[5,5,60],[7,7,65],[11,22,92],
];
function getNumCompat(a: number, b: number): number {
  for (const [x, y, s] of COMPAT_NUMS) {
    if ((x === a && y === b) || (x === b && y === a)) return s;
  }
  if (a === b) return 65;
  const diff = Math.abs(a % 9 - b % 9);
  if (diff === 0) return 68;
  if (diff <= 2) return 70;
  return 58;
}

// ─── Main function ────────────────────────────────────────────────────────────
export interface CompatibilityResult {
  person1: { year: number; can: string; chi: string; zodiac: string; mingGua: number; guaName: string; lifePathNum: number };
  person2: { year: number; can: string; chi: string; zodiac: string; mingGua: number; guaName: string; lifePathNum: number };
  zodiacRel: { type: string; desc: string; score: number };
  nguHanhRel: { type: string; score: number };
  guaRel: { type: string; score: number; desc: string };
  numScore: number;
  totalScore: number;
  verdict: "Rất Hợp" | "Hợp" | "Trung Bình" | "Không Hợp";
  verdictColor: string;
  summary: string;
}

export function analyzeCompatibility(dob1: string, gender1: "nam" | "nu", dob2: string, gender2: "nam" | "nu"): CompatibilityResult {
  const [d1, m1, y1] = dob1.split("/").map(Number);
  const [d2, m2, y2] = dob2.split("/").map(Number);
  const cc1 = getCanChiYear(y1); const cc2 = getCanChiYear(y2);
  const gua1 = computeMingGua(y1, gender1); const gua2 = computeMingGua(y2, gender2);
  const lp1 = computeLifePath(dob1); const lp2 = computeLifePath(dob2);
  const zodiacRel = getZodiacRelation(cc1.chiIndex, cc2.chiIndex);
  const nguHanhRel = getNguHanhCanRel(y1, y2);
  const guaRel = getMingGuaCompat(gua1, gua2);
  const numScore = getNumCompat(lp1, lp2);
  const totalScore = Math.round(zodiacRel.score * 0.35 + nguHanhRel.score * 0.25 + guaRel.score * 0.2 + numScore * 0.2);
  const verdict = totalScore >= 80 ? "Rất Hợp" : totalScore >= 65 ? "Hợp" : totalScore >= 50 ? "Trung Bình" : "Không Hợp";
  const verdictColor = totalScore >= 80 ? "text-yellow-400" : totalScore >= 65 ? "text-green-400" : totalScore >= 50 ? "text-amber-400" : "text-red-400";
  const summary = totalScore >= 80
    ? `${cc1.chi} và ${cc2.chi} là cặp đôi rất tương hợp. Thiên thời địa lợi, dễ đồng lòng trong cuộc sống và sự nghiệp.`
    : totalScore >= 65
    ? `${cc1.chi} và ${cc2.chi} khá tương hợp. Cần chú ý điểm khác biệt nhưng nhìn chung hòa thuận.`
    : totalScore >= 50
    ? `${cc1.chi} và ${cc2.chi} ở mức trung bình. Cần hiểu nhau sâu hơn, tôn trọng và linh hoạt thích nghi.`
    : `${cc1.chi} và ${cc2.chi} có nhiều xung khắc. Cần nhiều nỗ lực để xây dựng mối quan hệ bền vững.`;
  return {
    person1: { year: y1, can: cc1.can, chi: cc1.chi, zodiac: ZODIAC_VN[cc1.chiIndex], mingGua: gua1, guaName: GUA_INFO[gua1]?.name ?? "?", lifePathNum: lp1 },
    person2: { year: y2, can: cc2.can, chi: cc2.chi, zodiac: ZODIAC_VN[cc2.chiIndex], mingGua: gua2, guaName: GUA_INFO[gua2]?.name ?? "?", lifePathNum: lp2 },
    zodiacRel, nguHanhRel, guaRel, numScore, totalScore, verdict, verdictColor, summary,
  };
}
