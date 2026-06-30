// Lịch Cá Nhân (Personal Year/Month/Day numerology) regression test.
//
// Method audited as correct; this pins the reduction behaviour.
//
// Run: tsx src/lib/lich-ca-nhan.test.ts
import assert from "node:assert/strict";
import {
  computePersonalYear,
  computePersonalMonth,
  computePersonalDay,
  getPersonalYearInfo,
  buildMonthCalendar,
} from "./lich-ca-nhan";

// Personal Year = reduce(digitSum(day) + digitSum(month) + digitSum(year)).
// 29/12 in 2026: 29→11... but digitSum uses 2+9=11, 1+2=3, 2+0+2+6=10 → 24 → 6.
assert.equal(computePersonalYear("29/12/1990", 2026), 6, "PY 29/12 in 2026 = 6");
assert.equal(computePersonalMonth(6, 7), 4, "PM reduce(6+7=13)=4");
assert.equal(computePersonalDay(4, 15), 1, "PD reduce(4+15=19→10→1)=1");

// getPersonalYearInfo returns a theme for the computed number.
const info = getPersonalYearInfo("29/12/1990", 2026);
assert.equal(info.personalYear, 6, "info personalYear");
assert.ok(info.theme.length > 0 && info.advice.length > 0, "theme + advice present");

// Month calendar covers exactly the days in the month.
const cal = buildMonthCalendar("29/12/1990", 2026, 2); // Feb 2026 = 28 days
assert.equal(cal.length, 28, "Feb 2026 has 28 days");
for (const d of cal) {
  assert.ok(d.personalDay >= 1, "personalDay computed");
  assert.ok(d.label.length > 0, "quality label present");
}

console.log("lich-ca-nhan: ok");
