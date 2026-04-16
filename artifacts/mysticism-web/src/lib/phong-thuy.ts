export type Gua = 1 | 2 | 3 | 4 | 6 | 7 | 8 | 9;

export type GuaGroup = "east" | "west";

export interface DirectionInfo {
  direction: string;
  directionEn: string;
  name: string;
  nameDesc: string;
  quality: "auspicious" | "inauspicious";
  level: 1 | 2 | 3 | 4;
  color: string;
}

export interface GuaInfo {
  gua: Gua;
  guaName: string;
  element: string;
  group: GuaGroup;
  directions: DirectionInfo[];
}

function reduceYear(year: number): number {
  let n = year;
  while (n > 9) {
    n = n.toString().split("").reduce((a, b) => a + parseInt(b), 0);
  }
  return n;
}

export function computeMingGua(year: number, gender: "nam" | "nu"): Gua {
  const r = reduceYear(year);
  let gua: number;
  if (gender === "nam") {
    gua = 10 - r;
    if (gua === 10 || gua === 0) gua = 1;
    if (gua === 5) gua = 2;
  } else {
    gua = r + 5;
    while (gua > 9) gua -= 9;
    if (gua === 5) gua = 8;
  }
  return gua as Gua;
}

const DIRECTION_NAMES: Record<string, { vi: string; short: string }> = {
  N: { vi: "Bắc", short: "B" },
  S: { vi: "Nam", short: "N" },
  E: { vi: "Đông", short: "Đ" },
  W: { vi: "Tây", short: "T" },
  NE: { vi: "Đông Bắc", short: "ĐB" },
  NW: { vi: "Tây Bắc", short: "TB" },
  SE: { vi: "Đông Nam", short: "ĐN" },
  SW: { vi: "Tây Nam", short: "TN" },
};

const AUSPICIOUS_NAMES = [
  { name: "Sinh Khí", nameDesc: "Nguồn sinh khí, thịnh vượng và sức khoẻ", level: 1 as const, color: "text-yellow-400", quality: "auspicious" as const },
  { name: "Thiên Y", nameDesc: "Thiên Y, tình duyên và sức khoẻ", level: 2 as const, color: "text-green-400", quality: "auspicious" as const },
  { name: "Diên Niên", nameDesc: "Diên Niên, sự nghiệp và trường thọ", level: 3 as const, color: "text-blue-400", quality: "auspicious" as const },
  { name: "Phục Vị", nameDesc: "Phục Vị, ổn định và cân bằng", level: 4 as const, color: "text-purple-400", quality: "auspicious" as const },
];

const INAUSPICIOUS_NAMES = [
  { name: "Họa Hại", nameDesc: "Họa Hại, tiểu hung, nên tránh", level: 1 as const, color: "text-orange-400", quality: "inauspicious" as const },
  { name: "Lục Sát", nameDesc: "Lục Sát, lục hại, ảnh hưởng tài lộc", level: 2 as const, color: "text-orange-500", quality: "inauspicious" as const },
  { name: "Ngũ Quỷ", nameDesc: "Ngũ Quỷ, ngũ hoàng, ảnh hưởng sức khoẻ", level: 3 as const, color: "text-red-400", quality: "inauspicious" as const },
  { name: "Tuyệt Mệnh", nameDesc: "Tuyệt Mệnh, đại hung, tránh hoàn toàn", level: 4 as const, color: "text-red-600", quality: "inauspicious" as const },
];

// [Sinh Khí, Thiên Y, Diên Niên, Phục Vị, Họa Hại, Lục Sát, Ngũ Quỷ, Tuyệt Mệnh]
const GUA_DIRECTIONS: Record<Gua, string[]> = {
  1: ["SE", "E", "S", "N", "W", "NE", "NW", "SW"],
  2: ["NE", "W", "NW", "SW", "E", "S", "N", "SE"],
  3: ["S", "N", "SE", "E", "SW", "NW", "W", "NE"],
  4: ["N", "S", "E", "SE", "NW", "SW", "NE", "W"],
  6: ["W", "NE", "SW", "NW", "E", "N", "S", "SE"],
  7: ["NW", "SW", "NE", "W", "SE", "S", "E", "N"],
  8: ["SW", "NW", "W", "NE", "N", "SE", "S", "E"],
  9: ["E", "SE", "N", "S", "NE", "W", "SW", "NW"],
};

const GUA_INFO: Record<Gua, { guaName: string; element: string; group: GuaGroup }> = {
  1: { guaName: "Khảm (坎)", element: "Thuỷ", group: "east" },
  2: { guaName: "Khôn (坤)", element: "Thổ", group: "west" },
  3: { guaName: "Chấn (震)", element: "Mộc", group: "east" },
  4: { guaName: "Tốn (巽)", element: "Mộc", group: "east" },
  6: { guaName: "Càn (乾)", element: "Kim", group: "west" },
  7: { guaName: "Đoài (兌)", element: "Kim", group: "west" },
  8: { guaName: "Cấn (艮)", element: "Thổ", group: "west" },
  9: { guaName: "Ly (離)", element: "Hoả", group: "east" },
};

export function getGuaInfo(year: number, gender: "nam" | "nu"): GuaInfo {
  const gua = computeMingGua(year, gender);
  const info = GUA_INFO[gua];
  const dirKeys = GUA_DIRECTIONS[gua];

  const directions: DirectionInfo[] = [
    ...AUSPICIOUS_NAMES.map((n, i) => ({
      direction: DIRECTION_NAMES[dirKeys[i]].vi,
      directionEn: dirKeys[i],
      ...n,
    })),
    ...INAUSPICIOUS_NAMES.map((n, i) => ({
      direction: DIRECTION_NAMES[dirKeys[i + 4]].vi,
      directionEn: dirKeys[i + 4],
      ...n,
    })),
  ];

  return { gua, ...info, directions };
}

export const COMPASS_POSITIONS: Record<string, { x: number; y: number; angle: number }> = {
  N: { x: 50, y: 5, angle: 0 },
  NE: { x: 83, y: 17, angle: 45 },
  E: { x: 95, y: 50, angle: 90 },
  SE: { x: 83, y: 83, angle: 135 },
  S: { x: 50, y: 95, angle: 180 },
  SW: { x: 17, y: 83, angle: 225 },
  W: { x: 5, y: 50, angle: 270 },
  NW: { x: 17, y: 17, angle: 315 },
};
