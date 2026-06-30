// I Ching (Kinh Dịch) correctness tests — full 64-hexagram King Wen set.
//
// The previous web implementation only had real data for 16 hexagrams and
// generated 17–64 as placeholders whose line figures were a modulo of the
// first 16 (i.e. wrong). This pins the complete, trigram-derived data and the
// three-coin casting (moving lines + transformed hexagram).
//
// Run: tsx src/lib/iching.test.ts
import assert from "node:assert/strict";
import {
  HEXAGRAMS,
  TRIGRAMS,
  getHexagram,
  hexagramFromLines,
  castReading,
} from "@workspace/mysticism-core";

// (1) Exactly 64 hexagrams, contiguous indices 1..64, all unique.
assert.equal(HEXAGRAMS.length, 64, "must have 64 hexagrams");
const indices = HEXAGRAMS.map((h) => h.index).sort((a, b) => a - b);
assert.deepEqual(indices, Array.from({ length: 64 }, (_, i) => i + 1), "indices 1..64");

// (2) Every line pattern is unique (no two hexagrams share a figure).
const patterns = new Set(HEXAGRAMS.map((h) => h.lines.join("")));
assert.equal(patterns.size, 64, "64 distinct line patterns");

// (3) Each hexagram's six lines equal lower-trigram + upper-trigram (bottom-up).
for (const h of HEXAGRAMS) {
  assert.equal(h.lines.length, 6, `${h.index} must have 6 lines`);
  const expected = [...TRIGRAMS[h.lowerTrigram].lines, ...TRIGRAMS[h.upperTrigram].lines];
  assert.deepEqual(h.lines, expected, `${h.index} lines must match trigram composition`);
  // No placeholder text leaked in.
  assert.ok(!h.vietnameseName.startsWith("Quẻ "), `${h.index} must have a real name`);
  assert.ok(!/bí ẩn|đang chờ/.test(h.meaning), `${h.index} must have real meaning`);
}

// (4) Unicode symbol follows King Wen order (U+4DC0 + index - 1).
for (const h of HEXAGRAMS) {
  assert.equal(h.symbol.codePointAt(0), 0x4dc0 + h.index - 1, `${h.index} symbol codepoint`);
}

// (5) Known hexagrams.
assert.ok(getHexagram(1).lines.every((l) => l === "yang"), "Hex 1 Càn all yang");
assert.ok(getHexagram(2).lines.every((l) => l === "yin"), "Hex 2 Khôn all yin");
// Hex 11 Thái = lower Càn (yang×3) + upper Khôn (yin×3)
assert.deepEqual(getHexagram(11).lines, ["yang", "yang", "yang", "yin", "yin", "yin"], "Hex 11 Thái");
// Hex 63 Ký Tế = lower Ly + upper Khảm
assert.deepEqual(getHexagram(63).lines, ["yang", "yin", "yang", "yin", "yang", "yin"], "Hex 63 Ký Tế");

// (6) hexagramFromLines round-trips for all 64.
for (const h of HEXAGRAMS) {
  assert.equal(hexagramFromLines(h.lines).index, h.index, `roundtrip ${h.index}`);
}

// (7) Casting: all heads (rng<0.5 -> 3, sum 9 = old yang) -> primary Càn (1),
// all six lines moving, transformed to Khôn (2).
const heads = castReading(() => 0.1);
assert.equal(heads.primary.index, 1, "all-heads primary is Càn");
assert.equal(heads.movingLineNumbers.length, 6, "all six lines moving");
assert.equal(heads.transformed?.index, 2, "all-heads transforms to Khôn");

// All tails (sum 6 = old yin) -> primary Khôn (2), transformed Càn (1).
const tails = castReading(() => 0.9);
assert.equal(tails.primary.index, 2, "all-tails primary is Khôn");
assert.equal(tails.transformed?.index, 1, "all-tails transforms to Càn");

console.log("iching: ok");
