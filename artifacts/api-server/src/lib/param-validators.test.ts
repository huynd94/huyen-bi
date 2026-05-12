// Feature: post-opus-audit-remediation, Property 3: parsePositiveIntParam matches its predicate
//
// **Validates: Requirements 7.1**
//
// Property 3 — `parsePositiveIntParam(raw)` mirrors the predicate documented
// in its JSDoc:
//   - Returns Number(raw)  when raw is a string matching /^[1-9]\d*$/ and
//                          within the safe-integer range.
//   - Returns null         otherwise (non-strings, empty string, leading zero,
//                          negative, decimal, whitespace, NaN/Infinity, etc.).
//
// The oracle below re-derives the expected output from that predicate and
// compares against the helper across 100 runs of mixed inputs (arbitrary
// strings, happy-path numeric strings, edge-case strings, and non-string
// JS values). Because the oracle mirrors the contract — not the impl — this
// test catches silent regressions (e.g. someone relaxing the regex, dropping
// the Number.isSafeInteger guard, or accepting non-string inputs).
import assert from "node:assert/strict";
import fc from "fast-check";
import { parsePositiveIntParam } from "./param-validators";

// Oracle: the predicate as specified by the helper's contract.
function expected(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) ? n : null;
}

// Arbitraries — sample broadly across the input space:
//  - arbitrary strings (most will be rejected)
//  - well-formed positive-integer strings (happy path)
//  - targeted rejection shapes (leading zero, negative, decimal, whitespace,
//    exponent notation, NaN/Infinity literals)
//  - non-string JS values (numbers, booleans, null/undefined, objects,
//    NaN/Infinity) so `typeof raw !== "string"` is exercised
//  - fc.anything() as a broad catch-all that may surface surprising shapes
const arb = fc.oneof(
  fc.string(),
  fc.integer({ min: 1, max: Number.MAX_SAFE_INTEGER }).map((n) => String(n)),
  fc.constantFrom(
    "",
    "0",
    "01",
    "007",
    "-1",
    "-0",
    "+1",
    "12.5",
    "1.0",
    "1e3",
    " 1",
    "1 ",
    "\t1",
    "NaN",
    "Infinity",
    "-Infinity",
  ),
  fc.constantFrom<unknown>(
    undefined,
    null,
    0,
    1,
    12.5,
    -1,
    true,
    false,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    {},
    [],
  ),
  fc.anything(),
);

fc.assert(
  fc.property(arb, (raw) => {
    const actual = parsePositiveIntParam(raw);
    const want = expected(raw);
    assert.deepEqual(actual, want);
  }),
  { numRuns: 100 },
);

console.log("param-validators parsePositiveIntParam: ok");
