/**
 * Shared param validators for route handlers.
 *
 * Feature: post-opus-audit-remediation (M2)
 * Spec: .kiro/specs/post-opus-audit-remediation/design.md §7
 *
 * These helpers live outside individual route files so multiple handlers can
 * share a single, well-tested validation rule set. The first helper,
 * `parsePositiveIntParam`, is used by `routes/readings.ts` to reject non-numeric
 * `:id` path params before any DB query runs (Requirement 7, AC 1–4).
 */

/**
 * Parse a path / query param that must be a strictly positive integer.
 *
 * Returns the parsed `number` when `raw` is a string that:
 *   - matches `/^[1-9]\d*$/` (no leading zero, no sign, no decimal, no exponent), AND
 *   - equals a `Number.isSafeInteger` value after `Number(raw)` (guards the
 *     `2^53 - 1` upper bound — `Number("1e999")` would otherwise yield `Infinity`).
 *
 * Returns `null` for everything else, including:
 *   - non-string inputs (`undefined`, `null`, `number`, `object`, …)
 *   - empty string
 *   - negative or zero values ("-1", "0", "-0")
 *   - decimals ("12.5", "1.0")
 *   - leading-zero strings ("01", "007")
 *   - `"NaN"`, `"Infinity"`
 *   - whitespace-padded strings ("  1", "1 ")
 *
 * @param raw the raw param value (typically `req.params.id`, which Express types as `string`, but we accept `unknown` to be defensive against misuse).
 */
export function parsePositiveIntParam(raw: unknown): number | null {
  if (typeof raw !== "string") return null;
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) ? n : null;
}
