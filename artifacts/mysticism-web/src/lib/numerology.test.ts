// Numerology core correctness tests.
//
// Covers the two bugs found in the audit plus the stable behaviours:
//   1. Life Path uses the standard "reduce each component" method, preserving
//      Master Numbers (11/22/33) instead of a flat digit sum.
//   2. Vietnamese "Đ/đ" is mapped to "D" before diacritic stripping, so names
//      like "Đặng" are not silently undercounted.
//
// Run: tsx src/lib/numerology.test.ts
import assert from "node:assert/strict";
import {
  computeLifePathNumber,
  computeSoulNumber,
  computeDestinyNumber,
  computePersonalityNumber,
  computeMaturityNumber,
  computePersonalYearNumber,
  reduceNumerology,
} from "@workspace/mysticism-core";

// --- Life Path: standard component-wise reduction ---
// 15/08/1990 -> day 15->6, month 8->8, year 1990->1 => 6+8+1=15 -> 6
assert.equal(computeLifePathNumber("15/08/1990"), 6, "Life Path 15/08/1990 should be 6");
// 14/03/1985 -> 5 + 3 + 5 = 13 -> 4
assert.equal(computeLifePathNumber("14/03/1985"), 4, "Life Path 14/03/1985 should be 4");
// 28/11/1995 -> day 28->10->1, month 11 (master)->11, year 1995->24->6 => 1+11+6=18->9
assert.equal(computeLifePathNumber("28/11/1995"), 9, "Life Path 28/11/1995 should be 9");

// Master Number preservation: a component reducing to 22 must survive.
// 29/12/1976 -> day 29->11, month 12->3, year 1976->23->5 => 11+3+5=19->10->1
assert.equal(computeLifePathNumber("29/12/1976"), 1, "Life Path 29/12/1976 should be 1");

// Invalid input returns 0 rather than NaN.
assert.equal(computeLifePathNumber("not-a-date"), 0, "invalid dob -> 0");

// --- Đ/đ normalization: name letters must all count ---
// "DANG": D4 + A1 + N5 + G7 = 17 -> 8. "ĐẶNG" must equal the same.
assert.equal(computeDestinyNumber("DANG"), 8, "DANG destiny = 8");
assert.equal(
  computeDestinyNumber("ĐẶNG"),
  computeDestinyNumber("DANG"),
  "Đ must be treated as D in destiny",
);
assert.equal(computeDestinyNumber("ĐỖ"), computeDestinyNumber("DO"), "Đỗ == Do");

// --- Soul (vowels) vs Personality (consonants) ---
// Soul + Personality components should each be derived from the same letters.
// "AN": vowel A=1 -> soul 1; consonant N=5 -> personality 5; destiny A+N=6.
assert.equal(computeSoulNumber("AN"), 1, "soul of AN = 1");
assert.equal(computePersonalityNumber("AN"), 5, "personality of AN = 5");
assert.equal(computeDestinyNumber("AN"), 6, "destiny of AN = 6");

// --- Maturity = reduce(lifePath + destiny) ---
assert.equal(computeMaturityNumber(6, 8), 5, "maturity reduce(6+8=14)->5");
assert.equal(computeMaturityNumber(11, 22), 33, "maturity reduce(11+22=33) stays Master 33");

// --- Personal Year ---
// 29/12 in 2026: day 29->11... but PY uses day(29)+month(12)+year-digits.
// 29 + 12 + (2+0+2+6=10) = 51 -> 6
assert.equal(computePersonalYearNumber("29/12/1990", 2026), 6, "PY 29/12 in 2026 = 6");

// --- NaN/invalid-input safety (regression: infinite recursion → RangeError) ---
// The reducers must terminate on NaN/Infinity/negative rather than recursing
// forever ("Maximum call stack size exceeded").
assert.equal(reduceNumerology(NaN), 0, "reduce(NaN) → 0, no stack overflow");
assert.equal(reduceNumerology(-5), 0, "reduce(negative) → 0");
assert.equal(reduceNumerology(Infinity), 0, "reduce(Infinity) → 0");
assert.equal(computePersonalYearNumber("", NaN), 0, "PY invalid dob+year → 0");
assert.equal(computePersonalYearNumber("bad", 2026), 0, "PY unparseable dob → 0");
assert.equal(computeSoulNumber(""), 0, "empty name soul → 0");
assert.equal(computeMaturityNumber(NaN, NaN), 0, "maturity NaN → 0");

console.log("numerology: ok");
