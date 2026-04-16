// Name analysis using Pythagorean numerology (adapted for Vietnamese names)
// Each character/word contributes to different scores

function reduceToSingleOrMaster(n: number): number {
  if (n === 11 || n === 22 || n === 33) return n;
  if (n < 10) return n;
  return reduceToSingleOrMaster(n.toString().split("").reduce((a, c) => a + parseInt(c), 0));
}

const CHAR_VALUES: Record<string, number> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9,
};

const VOWELS = new Set(["A", "E", "I", "O", "U"]);

function normalize(s: string): string {
  return s.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/Đ/g, "D").replace(/đ/g, "D");
}

function charVal(c: string): number {
  return CHAR_VALUES[c] || 0;
}

function namePartValue(part: string): number {
  const n = normalize(part);
  return reduceToSingleOrMaster(n.split("").reduce((s, c) => s + charVal(c), 0));
}

function vowelValue(part: string): number {
  const n = normalize(part);
  return reduceToSingleOrMaster(n.split("").filter(c => VOWELS.has(c)).reduce((s, c) => s + charVal(c), 0));
}

function consonantValue(part: string): number {
  const n = normalize(part);
  return reduceToSingleOrMaster(n.split("").filter(c => !VOWELS.has(c) && /[A-Z]/.test(c)).reduce((s, c) => s + charVal(c), 0));
}

export interface NameGrid {
  ho: string;           // surname
  tenDem: string;       // middle name
  ten: string;          // given name
  // Five grids (simplified numerology adaptation)
  thienCach: number;    // Thiên Cách — surname number
  diaCach: number;      // Địa Cách — given name number
  nhanCach: number;     // Nhân Cách — surname + first given name char
  ngoaiCach: number;    // Ngoại Cách — middle name
  tongCach: number;     // Tổng Cách — entire full name
  // Classic numerology
  soLinhHon: number;    // Soul number (vowels)
  soNhanCach: number;   // Personality number (consonants)
  soSuMenh: number;     // Destiny number (all chars)
  soTenRieng: number;   // Given-name-only number
}

export function analyzeName(fullName: string): NameGrid {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    const p = parts[0] || "";
    return buildGrid(p, "", "");
  }
  if (parts.length === 2) return buildGrid(parts[0], "", parts[1]);
  // 3+ parts: first is surname, last is given name, rest is middle
  return buildGrid(parts[0], parts.slice(1, -1).join(" "), parts[parts.length - 1]);
}

function buildGrid(ho: string, tenDem: string, ten: string): NameGrid {
  const fullName = [ho, tenDem, ten].filter(Boolean).join(" ");
  const thienCach = namePartValue(ho);
  const diaCach = namePartValue(ten || ho);
  const nhanCach = reduceToSingleOrMaster(namePartValue(ho) + (ten ? namePartValue(ten[0]) : 0));
  const ngoaiCach = tenDem ? namePartValue(tenDem) : reduceToSingleOrMaster(thienCach + diaCach + 1);
  const tongCach = namePartValue(fullName.replace(/\s/g, ""));
  const soLinhHon = reduceToSingleOrMaster(
    fullName.split("").reduce((s, c) => {
      const u = normalize(c);
      return VOWELS.has(u) ? s + charVal(u) : s;
    }, 0)
  );
  const soNhanCach = reduceToSingleOrMaster(
    fullName.split("").reduce((s, c) => {
      const u = normalize(c);
      return (!VOWELS.has(u) && /[A-Z]/.test(u)) ? s + charVal(u) : s;
    }, 0)
  );
  const soSuMenh = namePartValue(fullName.replace(/\s/g, ""));
  const soTenRieng = namePartValue(ten || ho);

  return { ho, tenDem, ten, thienCach, diaCach, nhanCach, ngoaiCach, tongCach, soLinhHon, soNhanCach, soSuMenh, soTenRieng };
}

export interface GridMeaning {
  title: string;
  desc: string;
  strengths: string[];
  caution: string;
}

const GRID_MEANINGS: Record<number, GridMeaning> = {
  1: { title: "Số 1 — Tiên Phong", desc: "Ý chí mạnh mẽ, độc lập và khởi tạo. Con số của người lãnh đạo bẩm sinh.", strengths: ["Sáng tạo", "Dũng cảm", "Quyết đoán"], caution: "Dễ cô đơn nếu quá độc lập." },
  2: { title: "Số 2 — Hòa Hợp", desc: "Tinh tế, nhạy cảm, giỏi kết nối. Phù hợp các vai trò hỗ trợ và ngoại giao.", strengths: ["Kiên nhẫn", "Thấu hiểu", "Hòa giải"], caution: "Tránh phụ thuộc quá mức vào ý kiến người khác." },
  3: { title: "Số 3 — Biểu Đạt", desc: "Sáng tạo và lạc quan, giỏi giao tiếp và nghệ thuật.", strengths: ["Vui vẻ", "Sáng tạo", "Truyền cảm"], caution: "Cẩn thận phân tán năng lượng." },
  4: { title: "Số 4 — Vững Chắc", desc: "Thực tế, kỷ luật và xây dựng nền tảng bền vững.", strengths: ["Kiên định", "Đáng tin", "Có trật tự"], caution: "Tránh cứng nhắc và bảo thủ." },
  5: { title: "Số 5 — Tự Do", desc: "Linh hoạt, ham khám phá và thích nghi nhanh.", strengths: ["Năng động", "Dũng cảm", "Linh hoạt"], caution: "Dễ thiếu kiên nhẫn hoặc không ổn định." },
  6: { title: "Số 6 — Yêu Thương", desc: "Có trách nhiệm, ấm áp và coi trọng gia đình.", strengths: ["Chăm sóc", "Trách nhiệm", "Bao dung"], caution: "Tránh can thiệp quá sâu vào người thân." },
  7: { title: "Số 7 — Tâm Linh", desc: "Suy tư sâu sắc, trực giác tốt và hướng về nội tâm.", strengths: ["Thông thái", "Phân tích", "Trực giác"], caution: "Dễ khép kín và khó gần." },
  8: { title: "Số 8 — Thành Công", desc: "Tham vọng, khả năng kinh doanh và thu hút tài lộc.", strengths: ["Năng lực", "Kinh doanh", "Lãnh đạo"], caution: "Tránh chạy theo vật chất quá mức." },
  9: { title: "Số 9 — Nhân Đức", desc: "Nhân hậu, rộng lượng và có lý tưởng cao đẹp.", strengths: ["Vị tha", "Tầm nhìn", "Bao dung"], caution: "Dễ thất vọng khi người khác không đáp ứng kỳ vọng." },
  11: { title: "Số 11 — Khai Sáng", desc: "Trực giác phi thường và khả năng truyền cảm hứng lớn. Số Master.", strengths: ["Trực giác", "Tâm linh", "Cảm hứng"], caution: "Áp lực nội tâm lớn — cần cân bằng." },
  22: { title: "Số 22 — Kiến Trúc Sư", desc: "Biến ước mơ lớn thành hiện thực. Số Master quyền năng nhất.", strengths: ["Tầm nhìn", "Thực thi", "Lãnh đạo"], caution: "Cẩn thận kiệt sức vì gánh vác quá nhiều." },
  33: { title: "Số 33 — Bậc Thầy", desc: "Tình yêu vô điều kiện và sứ mệnh chữa lành. Số Master hiếm gặp.", strengths: ["Yêu thương", "Chữa lành", "Hy sinh"], caution: "Dễ quá tải vì đặt người khác lên trên bản thân." },
};

export function getGridMeaning(n: number): GridMeaning {
  return GRID_MEANINGS[n] || GRID_MEANINGS[1];
}

export function scoreFullName(grid: NameGrid): { score: number; label: string; color: string } {
  const nums = [grid.tongCach, grid.nhanCach, grid.diaCach];
  const good = [1, 3, 6, 8, 9, 11, 22, 33];
  const goodCount = nums.filter(n => good.includes(n)).length;
  if (goodCount === 3) return { score: 95, label: "Tên rất tốt", color: "text-yellow-400" };
  if (goodCount === 2) return { score: 78, label: "Tên tốt", color: "text-green-400" };
  if (goodCount === 1) return { score: 60, label: "Tên trung bình", color: "text-blue-400" };
  return { score: 42, label: "Nên cân nhắc đặt tên khác", color: "text-orange-400" };
}
