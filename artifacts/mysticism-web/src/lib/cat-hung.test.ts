// Cát Hung (phone/sim number analysis) regression test.
//
// Rule-table based; this pins the public helpers and the verdict bounds.
//
// Run: tsx src/lib/cat-hung.test.ts
import assert from "node:assert/strict";
import {
  analyzeCatHung,
  extractAllPhoneDigits,
  extractLastFourDigits,
  computeLifePathFromDOB,
  analyzeFullPhone,
} from "./cat-hung";

// Digit extraction.
assert.equal(extractAllPhoneDigits("0987-654-321"), "0987654321", "strip non-digits, cap 10");
assert.equal(extractLastFourDigits("0987654321"), "4321", "last four digits");

// Life path here intentionally reduces fully to 1–9 (no Master) for the phone
// compatibility buckets. 15/08/1990 → 6.
assert.equal(computeLifePathFromDOB("15/08/1990"), 6, "phone-module life path = 6");
// Too-short input returns 0.
assert.equal(computeLifePathFromDOB("1/1/90"), 0, "short dob → 0");

// analyzeCatHung returns a bounded score and a known verdict.
const r = analyzeCatHung("8888");
assert.ok(r.totalScore >= 0, "score is a number");
assert.ok(["dai-cat", "cat", "binh-thuong", "hung", "dai-hung"].includes(r.verdict), "known verdict");
assert.ok(r.digits.length === 4, "per-digit breakdown");

// Full phone analysis splits prefix/subscriber and returns an energy number.
const full = analyzeFullPhone("0901234567");
assert.equal(full.allDigits, "0901234567", "all digits");
assert.equal(full.prefixDigits.length, 4, "prefix is 4 digits");
assert.ok(full.energyNumber >= 0, "energy number computed");

console.log("cat-hung: ok");
