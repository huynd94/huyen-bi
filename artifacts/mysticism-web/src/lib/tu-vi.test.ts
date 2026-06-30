// Tử Vi Đẩu Số correctness tests — standard 14-major-star placement.
//
// Replaces a "simplified" placement (lunarDay % cuc + offset) that did not
// follow the canonical rules. Verified against the canonical "Tử Vi tại Ngọ"
// chart (lunar 2000-7-17, giờ Dần) — the same oracle produced by the iztro
// engine.
//
// Run: tsx src/lib/tu-vi.test.ts
import assert from "node:assert/strict";
import { calculateTuVi, DIA_CHI } from "@workspace/mysticism-core";

// Oracle: lunar Canh Thìn (2000), month 7, day 17, giờ Dần (clock hour 3), nữ.
const r = calculateTuVi(2000, 7, 17, 3, "nu");

assert.equal(r.cuccDesc, "Mộc Tam Cục", "Cục");
assert.equal(r.nguHanhCuc, "Mộc", "Cục element");
assert.equal(DIA_CHI[r.cungMenh], "Ngọ", "Mệnh palace branch");
assert.equal(DIA_CHI[r.cungThanMenh], "Tuất", "Thân palace branch");

// All 14 major stars by branch (the canonical Tử Vi tại Ngọ layout).
const expected: Record<string, string[]> = {
  "Tý": ["Tham Lang"],
  "Sửu": ["Cự Môn", "Thiên Đồng"],
  "Dần": ["Thiên Tướng", "Vũ Khúc"],
  "Mão": ["Thái Dương", "Thiên Lương"],
  "Thìn": ["Thất Sát"],
  "Tỵ": ["Thiên Cơ"],
  "Ngọ": ["Tử Vi"],
  "Mùi": [],
  "Thân": ["Phá Quân"],
  "Dậu": [],
  "Tuất": ["Liêm Trinh", "Thiên Phủ"],
  "Hợi": ["Thái Âm"],
};

for (const cung of r.cungList) {
  const major = cung.stars.filter((s) => s.type === "chinh-tinh").map((s) => s.name).sort();
  const exp = (expected[cung.diaChi] ?? []).slice().sort();
  assert.deepEqual(major, exp, `major stars in ${cung.diaChi}`);
}

// All 14 major stars are placed exactly once across the chart.
const allMajor = r.cungList.flatMap((c) => c.stars.filter((s) => s.type === "chinh-tinh").map((s) => s.name));
assert.equal(allMajor.length, 14, "exactly 14 major stars");
assert.equal(new Set(allMajor).size, 14, "no duplicate major star");

// Palace naming: Mệnh palace is index cungMenh and named "Mệnh".
assert.equal(r.cungList[r.cungMenh].name, "Mệnh", "Mệnh palace named correctly");

console.log("tu-vi: ok");
