// Phong Thủy (Bát Trạch) regression test.
//
// The 8-direction table per Kua was audited as correct; this locks it (the Kua
// calculation itself is covered by ming-gua.test.ts).
//
// Run: tsx src/lib/phong-thuy.test.ts
import assert from "node:assert/strict";
import { getGuaInfo } from "./phong-thuy";

// 1990 male → Kua 1 (Khảm), East group.
const g = getGuaInfo(1990, "nam");
assert.equal(g.gua, 1, "1990 nam Kua = 1");
assert.equal(g.group, "east", "Khảm is East group");

// Eight directions: 4 auspicious + 4 inauspicious, all distinct.
assert.equal(g.directions.length, 8, "8 directions");
const dirSet = new Set(g.directions.map((d) => d.directionEn));
assert.equal(dirSet.size, 8, "8 distinct compass directions");
assert.equal(g.directions.filter((d) => d.quality === "auspicious").length, 4, "4 auspicious");
assert.equal(g.directions.filter((d) => d.quality === "inauspicious").length, 4, "4 inauspicious");

// For Khảm (Kua 1), Sinh Khí (best) is Đông Nam (SE) per the Bát Trạch table.
const sinhKhi = g.directions.find((d) => d.name === "Sinh Khí")!;
assert.equal(sinhKhi.directionEn, "SE", "Khảm Sinh Khí = SE");
// Tuyệt Mệnh (worst) is Tây Nam (SW).
const tuyetMenh = g.directions.find((d) => d.name === "Tuyệt Mệnh")!;
assert.equal(tuyetMenh.directionEn, "SW", "Khảm Tuyệt Mệnh = SW");

console.log("phong-thuy: ok");
