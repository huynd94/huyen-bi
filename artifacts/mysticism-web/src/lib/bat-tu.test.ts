// Bát Tự / Tứ Trụ correctness tests.
//
// Replaces a mock that used (dd+mm)%10 for the day pillar and hardcoded the
// element percentages. Verifies the four pillars against a reference chart and
// the supporting rules (Lập Xuân year boundary, Ngũ Hổ/Ngũ Thử Độn, element
// tally summing to 100).
//
// Run: tsx src/lib/bat-tu.test.ts
import assert from "node:assert/strict";
import { computeBatu } from "@workspace/mysticism-core";

// Reference chart: 1990-08-15 06:00 (giờ Mão).
// Standard Bazi: Năm Canh Ngọ · Tháng Giáp Thân · Ngày Nhâm Tý · Giờ Quý Mão.
const r1 = computeBatu("15/08/1990", "06:00");
assert.equal(`${r1.nam.thienCan} ${r1.nam.diaChi}`, "Canh Ngọ", "year pillar");
assert.equal(`${r1.thang.thienCan} ${r1.thang.diaChi}`, "Giáp Thân", "month pillar (Ngũ Hổ Độn)");
assert.equal(`${r1.ngay.thienCan} ${r1.ngay.diaChi}`, "Nhâm Tý", "day pillar (Julian)");
assert.equal(`${r1.gio.thienCan} ${r1.gio.diaChi}`, "Quý Mão", "hour pillar (Ngũ Thử Độn)");

// Lập Xuân boundary: 01/01/2000 is before Lập Xuân, so the Bazi year rolls
// back to 1999 = Kỷ Mão (not 2000 Canh Thìn).
const r2 = computeBatu("01/01/2000", "12:00");
assert.equal(`${r2.nam.thienCan} ${r2.nam.diaChi}`, "Kỷ Mão", "pre-Lập-Xuân year rolls back");

// Month branch follows the solar term: mid-Feb 2024 is the Dần month.
const r3 = computeBatu("10/02/2024", "00:30");
assert.equal(r3.nam.thienCan + " " + r3.nam.diaChi, "Giáp Thìn", "2024 year Giáp Thìn");
assert.equal(r3.thang.diaChi, "Dần", "Feb solar month is Dần");

// Element tally is a real distribution that always sums to 100.
for (const dt of [r1, r2, r3]) {
  const sum = dt.nguHanhAnalysis.reduce((s, x) => s + x.percentage, 0);
  assert.equal(sum, 100, "element percentages sum to 100");
  assert.equal(dt.nguHanhAnalysis.length, 5, "five elements present");
}

// The tally must not be the old hardcoded constant (Kim20/Mộc30/Thủy10/Hỏa15/Thổ25).
const r1Map = Object.fromEntries(r1.nguHanhAnalysis.map((x) => [x.element, x.percentage]));
assert.ok(
  !(r1Map["Kim"] === 20 && r1Map["Mộc"] === 30 && r1Map["Thủy"] === 10),
  "element tally is computed, not the old constant",
);

console.log("bat-tu: ok");
