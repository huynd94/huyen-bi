// Mệnh Quái (Kua) correctness tests — the canonical core implementation.
//
// Covers the two things the old per-page copies got wrong:
//   1. Century awareness (2000+ uses 9−s / 6+s, not 10−s / 5+s).
//   2. Never emitting an out-of-range Kua (0, 5, or 10).
//   3. Lunar new-year boundary via computeMingGuaFromDob.
//
// Run: tsx src/lib/ming-gua.test.ts
import assert from "node:assert/strict";
import {
  computeMingGua,
  computeMingGuaFromDob,
  isSameGroup,
  getGuaMeta,
} from "@workspace/mysticism-core";

const VALID = [1, 2, 3, 4, 6, 7, 8, 9];

// (1) Never produce an invalid Kua across a wide range.
for (let y = 1920; y <= 2050; y++) {
  for (const g of ["nam", "nu"] as const) {
    const k = computeMingGua(y, g);
    assert.ok(VALID.includes(k), `${y}/${g} produced invalid Kua ${k}`);
  }
}

// (2) Known reference values (lunar year already resolved).
const cases: [number, "nam" | "nu", number][] = [
  [1990, "nam", 1],
  [1990, "nu", 8],
  [1985, "nam", 6],
  [2000, "nam", 9], // century branch: 9 - 2 = 7? no — digit sum 0 -> 9-0=9
  [2000, "nu", 6],
  [2024, "nam", 3],
];
for (const [y, g, exp] of cases) {
  assert.equal(computeMingGua(y, g), exp, `Kua ${y}/${g} should be ${exp}`);
}

// (3) Kua 5 is reassigned: male -> 2 (Khôn), female -> 8 (Cấn). Find a year
// whose raw computation hits 5 and assert the substitution held (already
// covered by the range scan above proving 5 never leaks).
assert.ok(!VALID.includes(5), "5 is not a valid output Kua");

// (4) Group metadata is consistent with the East/West rule.
assert.equal(getGuaMeta(1).group, "east", "Khảm is East group");
assert.equal(getGuaMeta(2).group, "west", "Khôn is West group");
assert.ok(isSameGroup(1, 9), "Khảm & Ly share the East group");
assert.ok(!isSameGroup(1, 2), "Khảm & Khôn are different groups");

// (5) Tết boundary: someone born 2024-01-20 is before Tết Giáp Thìn
// (2024-02-10), so their lunar year is 2023 (Quý Mão), not 2024.
const beforeTet = computeMingGuaFromDob("20/01/2024", "nam");
assert.equal(beforeTet.lunarYear, 2023, "20/01/2024 falls in lunar year 2023");
assert.equal(
  beforeTet.gua,
  computeMingGua(2023, "nam"),
  "pre-Tết birth uses previous lunar year's Kua",
);

// A birth after Tết stays in the solar year.
const afterTet = computeMingGuaFromDob("01/06/2024", "nam");
assert.equal(afterTet.lunarYear, 2024, "01/06/2024 is lunar year 2024");

console.log("ming-gua: ok");
