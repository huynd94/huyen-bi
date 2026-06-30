// Xem Ngày Tốt (auspicious day finder) regression test.
//
// Builds on the verified lunar calendar; this pins the day-scoring output.
//
// Run: tsx src/lib/xem-ngay-tot.test.ts
import assert from "node:assert/strict";
import { findGoodDays, PURPOSE_LIST } from "./xem-ngay-tot";

// The purpose catalogue is stable.
assert.ok(PURPOSE_LIST.length >= 9, "purpose list present");
assert.ok(PURPOSE_LIST.every((p) => p.id && p.label && p.desc), "each purpose well-formed");

// Good days for marriage in a known month: results are scored and sorted.
const days = findGoodDays(2026, 2, "hon-nhan");
assert.ok(Array.isArray(days), "returns array");
for (const d of days) {
  assert.ok(d.score >= 50 && d.score <= 100, "score in displayed range");
  assert.ok(d.dayInfo.lunar.day >= 1 && d.dayInfo.lunar.day <= 30, "valid lunar day");
}
// Sorted descending by score.
for (let i = 1; i < days.length; i++) {
  assert.ok(days[i - 1].score >= days[i].score, "sorted by score desc");
}

console.log("xem-ngay-tot: ok");
