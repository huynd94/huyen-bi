// Lunar calendar regression tests — pins the verified Can Chi behaviour.
//
// The Ho Ngoc Duc algorithm was audited and found correct; these tests lock it
// against accidental regressions (Tết boundary, year/month/day Can Chi).
//
// Run: tsx src/lib/lunar.test.ts
import assert from "node:assert/strict";
import { solarToLunar, getCanChi } from "@workspace/mysticism-core";

// Tết Giáp Thìn fell on 2024-02-10 (lunar 1/1/2024).
const tet = solarToLunar(10, 2, 2024);
assert.equal(tet.day, 1, "Tết 2024 is lunar day 1");
assert.equal(tet.month, 1, "Tết 2024 is lunar month 1");
assert.equal(tet.year, 2024, "lunar year 2024");
assert.equal(getCanChi(tet.jd, "year", tet.month, tet.year), "Giáp Thìn", "2024 year = Giáp Thìn");
assert.equal(getCanChi(tet.jd, "day"), "Giáp Thìn", "2024-02-10 day = Giáp Thìn");
// First month of a Giáp year is Bính Dần (Ngũ Hổ Độn).
assert.equal(getCanChi(tet.jd, "month", tet.month, tet.year), "Bính Dần", "month = Bính Dần");

// The day before Tết is still lunar year 2023 (month 12).
const beforeTet = solarToLunar(9, 2, 2024);
assert.equal(beforeTet.month, 12, "day before Tết is month 12");
assert.equal(beforeTet.year, 2023, "day before Tết is lunar year 2023");

// Year Can Chi spot-checks via the public formula path.
const y2025 = solarToLunar(1, 6, 2025); // mid-year, safely in lunar 2025
assert.equal(getCanChi(y2025.jd, "year", y2025.month, y2025.year), "Ất Tỵ", "2025 = Ất Tỵ");

console.log("lunar: ok");
