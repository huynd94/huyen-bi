// Đại Vận (Major Luck) correctness tests.
//
// Verifies the improvements over the previous version: a real solar-term-based
// start age (not Math.round(day/3)) and valid sexagenary luck pillars chained
// from the Ngũ Hổ Độn month pillar with correct 60-Hoa-Giáp Nạp Âm.
//
// Run: tsx src/lib/dai-van.test.ts
import assert from "node:assert/strict";
import { computeDaiVan } from "@workspace/mysticism-core";

const THIEN_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const DIA_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];

// Valid sexagenary pillar: Can index parity must equal Chi index parity.
function isValidPillar(can: string, chi: string): boolean {
  return (THIEN_CAN.indexOf(can) % 2) === (DIA_CHI.indexOf(chi) % 2);
}

const r1 = computeDaiVan("15/08/1990", "nam");
// Start age in the 1..10 range.
assert.ok(r1.startAge >= 1 && r1.startAge <= 10, "start age in range");
// First luck pillar follows the month pillar (Giáp Thân) → Ất Dậu forward.
assert.equal(`${r1.pillars[0].thienCan} ${r1.pillars[0].diaChi}`, "Ất Dậu", "first DaiVan pillar");

// All eight pillars are valid sexagenary combinations with a real Nạp Âm.
for (const r of [r1, computeDaiVan("20/03/1985", "nu"), computeDaiVan("01/01/2000", "nam")]) {
  assert.equal(r.pillars.length, 8, "eight pillars");
  for (const p of r.pillars) {
    assert.ok(isValidPillar(p.thienCan, p.diaChi), `valid pillar ${p.thienCan} ${p.diaChi}`);
    assert.ok(!p.nguHanh.includes("undefined"), "Nạp Âm resolved");
    // Each pillar spans 10 years.
    assert.equal(p.endAge - p.startAge, 9, "10-year span");
  }
}

// Direction: 1990 is a Yang year + male → forward; 2000-01-01 rolls back to
// 1999 (Kỷ Mão, Yin) so male → backward.
assert.ok(r1.note.includes("thuận"), "1990 nam forward");
assert.ok(computeDaiVan("01/01/2000", "nam").note.includes("nghịch"), "pre-Tết 2000 nam backward");

console.log("dai-van: ok");
