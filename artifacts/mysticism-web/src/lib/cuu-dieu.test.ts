// Sao Hạn — Cửu Diệu (Nine Luminaries) correctness tests.
//
// Replaces a made-up "Thái Tuế rotation". Verifies the age+gender 9-star
// mapping and niên hạn against published Vietnamese almanac tables.
//
// Run: tsx src/lib/cuu-dieu.test.ts
import assert from "node:assert/strict";
import { computeSaoHan, getSaoHanForecast } from "@workspace/mysticism-core";

// Oracles cross-checked against vietthienthu / tuoiam almanac tables.
const cases: [number, number, "nam" | "nu", string, string][] = [
  [1990, 2026, "nam", "La Hầu", "Tam Kheo"],
  [1990, 2026, "nu", "Kế Đô", "Thiên Tinh"],
  [1990, 2025, "nam", "Mộc Đức", "Huỳnh Tuyền"],
  [1995, 2026, "nu", "Thổ Tú", "Huỳnh Tuyền"],
  [2000, 2026, "nam", "Mộc Đức", "Huỳnh Tuyền"],
];
for (const [by, ty, g, sao, han] of cases) {
  const r = computeSaoHan(by, ty, g);
  assert.equal(r.sao.name, sao, `${g} ${by}→${ty} sao`);
  assert.equal(r.han, han, `${g} ${by}→${ty} hạn`);
  assert.equal(r.age, ty - by + 1, "tuổi mụ");
}

// tuổi mụ 37 is the classic heavy year: nam La Hầu (xấu), nữ Kế Đô (xấu).
assert.equal(computeSaoHan(1990, 2026, "nam").overall, "Xấu");
assert.equal(computeSaoHan(1990, 2026, "nu").overall, "Xấu");

// 9-year cycle: same gender, +9 years → same star.
const a = computeSaoHan(1990, 2026, "nam").sao.name;
const b = computeSaoHan(1990, 2035, "nam").sao.name;
assert.equal(a, b, "9-year cycle repeats the star");

// Forecast returns the requested span around the start year.
const fc = getSaoHanForecast(1990, "nam", 2024, 7);
assert.equal(fc.length, 7, "7-year forecast");
assert.equal(fc[0].year, 2024, "forecast start year");
assert.equal(fc[2].sao.name, "La Hầu", "2026 in forecast is La Hầu");

console.log("cuu-dieu: ok");
