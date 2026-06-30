// Vietnamese Lunar Calendar (Âm lịch) calculation
// Based on the algorithm by Ho Ngoc Duc

const THIEN_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const DIA_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const TIET_KHI = [
  "Tiểu Hàn","Đại Hàn","Lập Xuân","Vũ Thủy","Kinh Trập","Xuân Phân",
  "Thanh Minh","Cốc Vũ","Lập Hạ","Tiểu Mãn","Mang Chủng","Hạ Chí",
  "Tiểu Thử","Đại Thử","Lập Thu","Xử Thử","Bạch Lộ","Thu Phân",
  "Hàn Lộ","Sương Giáng","Lập Đông","Tiểu Tuyết","Đại Tuyết","Đông Chí",
];

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: boolean;
  jd: number;
}

export interface DayInfo {
  solar: Date;
  lunar: LunarDate;
  canChiDay: string;
  canChiMonth: string;
  canChiYear: string;
  hoangDao: boolean;
  rating: "Đại Cát" | "Cát" | "Bình" | "Hung";
  note: string;
}

function jdFromDate(dd: number, mm: number, yy: number): number {
  let a = Math.floor((14 - mm) / 12);
  let y = yy + 4800 - a;
  let m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) {
    jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  }
  return jd;
}

function jdToDate(jd: number): [number, number, number] {
  let z: number, a: number, b: number, c: number, d: number, e: number;
  if (jd > 2299160) {
    a = jd + 32044;
    b = Math.floor((4 * a + 3) / 146097);
    c = a - Math.floor(146097 * b / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  d = Math.floor((4 * c + 3) / 1461);
  e = c - Math.floor(1461 * d / 4);
  const m = Math.floor((5 * e + 2) / 153);
  const day = e - Math.floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * Math.floor(m / 10);
  const year = 100 * b + d - 4800 + Math.floor(m / 10);
  return [day, month, year];
}

function getNewMoonDay(k: number, timeZone: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let Jde = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jde += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 -= 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 -= 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 += 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 -= 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 -= 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 += 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  let deltat: number;
  if (T < -11) {
    deltat = 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
  } else {
    deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
  }
  const JdNew = Jde + C1 - deltat;
  return Math.floor(JdNew + 0.5 + timeZone / 24);
}

function getSunLongitude(jdn: number, timeZone: number): number {
  const T = (jdn - 2451545.5 - timeZone / 24) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T2;
  const DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  const DL2 = (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  const L = L0 + DL + DL2;
  let L2 = L - 360 * Math.floor(L / 360);
  L2 = L2 - 360 * Math.floor(L2 / 360);
  return Math.floor(L2 / 30);
}

function getLunarMonth11(yy: number, timeZone: number): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) nm = getNewMoonDay(k - 1, timeZone);
  return nm;
}

function getLeapMonthOffset(a11: number, timeZone: number): number {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
}

export function solarToLunar(dd: number, mm: number, yy: number, timeZone = 7): LunarDate {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k, timeZone);
  let a11 = getLunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }
  const lunarDay = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let lunarLeap = false;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) lunarLeap = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
  return { day: lunarDay, month: lunarMonth, year: lunarYear, leap: lunarLeap, jd: dayNumber };
}

export function getCanChi(jd: number, type: "day" | "month" | "year", lunarMonth?: number, lunarYear?: number): string {
  if (type === "day") {
    const can = THIEN_CAN[(jd + 9) % 10];
    const chi = DIA_CHI[(jd + 1) % 12];
    return `${can} ${chi}`;
  }
  if (type === "month" && lunarMonth !== undefined && lunarYear !== undefined) {
    const canIdx = (lunarYear * 12 + lunarMonth + 3) % 10;
    const chiIdx = (lunarMonth + 1) % 12;
    return `${THIEN_CAN[canIdx]} ${DIA_CHI[chiIdx]}`;
  }
  if (type === "year" && lunarYear !== undefined) {
    return `${THIEN_CAN[(lunarYear + 6) % 10]} ${DIA_CHI[(lunarYear + 8) % 12]}`;
  }
  return "";
}

const HOANG_DAO_DAYS = [0, 3, 5, 6, 9, 11]; // Tý, Mão, Tỵ, Ngọ, Dậu, Hợi

function isHoangDao(jd: number): boolean {
  const chiIdx = (jd + 1) % 12;
  return HOANG_DAO_DAYS.includes(chiIdx);
}

function getDayRating(jd: number, lunarDay: number): { rating: DayInfo["rating"]; note: string } {
  const chiIdx = (jd + 1) % 12;
  const canIdx = (jd + 9) % 10;

  if (HOANG_DAO_DAYS.includes(chiIdx)) {
    if ([0, 5, 9].includes(chiIdx)) return { rating: "Đại Cát", note: "Ngày Hoàng Đạo tốt nhất — thích hợp mọi việc lớn" };
    return { rating: "Cát", note: "Ngày Hoàng Đạo — thuận lợi cho việc kinh doanh, hôn nhân" };
  }
  if ([1, 6].includes(lunarDay % 10)) return { rating: "Bình", note: "Ngày bình thường, không có sao tốt xấu rõ rệt" };
  if ([4, 13, 22].includes(lunarDay)) return { rating: "Hung", note: "Ngày Tứ Phế — tránh khởi sự việc quan trọng" };
  if (canIdx % 5 === 2) return { rating: "Bình", note: "Ngày có thể xử lý công việc thông thường" };
  return { rating: "Bình", note: "Ngày thường, có thể làm việc bình thường" };
}

export function buildMonthCalendar(year: number, month: number): DayInfo[] {
  const daysInMonth = new Date(year, month, 0).getDate();
  const result: DayInfo[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const solar = new Date(year, month - 1, day);
    const lunar = solarToLunar(day, month, year);
    const canChiDay = getCanChi(lunar.jd, "day");
    const canChiMonth = getCanChi(lunar.jd, "month", lunar.month, lunar.year);
    const canChiYear = getCanChi(lunar.jd, "year", lunar.month, lunar.year);
    const hoangDao = isHoangDao(lunar.jd);
    const { rating, note } = getDayRating(lunar.jd, lunar.day);
    result.push({ solar, lunar, canChiDay, canChiMonth, canChiYear, hoangDao, rating, note });
  }
  return result;
}

export function getGioHoangDao(lunarDay: number): string[] {
  const CHI_GIO = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
  const GIO_HD_MAP: Record<number, number[]> = {
    0: [0, 3, 5, 6, 9, 11], 1: [1, 2, 4, 7, 8, 10],
    2: [0, 3, 5, 6, 9, 11], 3: [1, 2, 4, 7, 8, 10],
    4: [0, 3, 5, 6, 9, 11], 5: [1, 2, 4, 7, 8, 10],
  };
  const key = lunarDay % 6;
  const hd = GIO_HD_MAP[key] || [0, 3, 5, 6, 9, 11];
  return hd.map((i) => CHI_GIO[i]);
}

export function formatLunar(lunar: LunarDate): string {
  return `${lunar.day}/${lunar.month}${lunar.leap ? " (nhuận)" : ""}/${lunar.year}`;
}

export const THIEN_CAN_LIST = THIEN_CAN;
export const DIA_CHI_LIST = DIA_CHI;
