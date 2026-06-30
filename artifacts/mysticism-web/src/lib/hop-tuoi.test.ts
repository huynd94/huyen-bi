// Hợp Tuổi compatibility — Life Path consistency regression test.
//
// hop-tuoi.ts keeps its own copy of the Life Path reduction (used for the
// numerology slice of the compatibility score). It previously used a flat
// digit-sum that diverged from the Thần Số Học page and mishandled Master
// Numbers. This test pins the corrected component-wise method by checking the
// life-path numbers surfaced on the result object.
//
// Run: tsx src/lib/hop-tuoi.test.ts
import assert from "node:assert/strict";
import { analyzeCompatibility } from "./hop-tuoi";

// 15/08/1990 -> 6 (component-wise), NOT 33 (old flat digit-sum).
const r1 = analyzeCompatibility("15/08/1990", "nam", "20/10/1992", "nu");
assert.equal(r1.person1.lifePathNum, 6, "15/08/1990 life path should be 6");

// 14/03/1985 -> 5 + 3 + 5 = 13 -> 4
const r2 = analyzeCompatibility("14/03/1985", "nu", "01/01/2000", "nam");
assert.equal(r2.person1.lifePathNum, 4, "14/03/1985 life path should be 4");

// Score stays within bounds and verdict is one of the expected labels.
assert.ok(r1.totalScore >= 0 && r1.totalScore <= 100, "score in range");
assert.ok(
  ["Rất Hợp", "Hợp", "Trung Bình", "Không Hợp"].includes(r1.verdict),
  "verdict is a known label",
);

console.log("hop-tuoi: ok");
