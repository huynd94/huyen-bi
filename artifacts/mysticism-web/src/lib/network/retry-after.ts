/**
 * Parse the HTTP `Retry-After` header into a number of seconds to wait.
 *
 * Implements the two forms allowed by RFC 9110:
 *   1. `delta-seconds`: a non-negative integer of seconds.
 *   2. `HTTP-date`: an absolute timestamp; the wait is the delta from `now`.
 *
 * The result is always a finite number `≥ 0` clamped to `[0, 86400]`
 * (max 24 hours). Any malformed, missing, or out-of-range input
 * returns `0` so callers can fall back to immediate retry / default backoff.
 *
 * @example
 *   parseRetryAfter("120")                           // 120
 *   parseRetryAfter("Wed, 21 Oct 2015 07:28:00 GMT") // seconds until that date
 *   parseRetryAfter(null)                            // 0
 *   parseRetryAfter("not-a-date")                    // 0
 *   parseRetryAfter("99999")                         // 0  (out of [0, 86400])
 */
export type ParseRetryAfter = (
  header: string | null,
  now?: number,
) => number;

/** Upper bound on seconds returned. Matches the spec ([0, 86400]). */
const MAX_RETRY_AFTER_SECONDS = 86400;

/**
 * @see {ParseRetryAfter}
 *
 * Validates Requirements 5.5, 18.4.
 */
export const parseRetryAfter: ParseRetryAfter = (header, now = Date.now()) => {
  if (header == null) return 0;
  const trimmed = header.trim();
  if (trimmed === "") return 0;

  // delta-seconds: non-negative integer, no sign, no decimals.
  if (/^\d+$/.test(trimmed)) {
    const seconds = Number(trimmed);
    if (!Number.isFinite(seconds) || !Number.isInteger(seconds)) return 0;
    if (seconds < 0 || seconds > MAX_RETRY_AFTER_SECONDS) return 0;
    return seconds;
  }

  // HTTP-date: absolute timestamp. Date.parse handles RFC 1123 / RFC 850 /
  // ANSI C asctime() formats as required by RFC 9110.
  const parsedMs = Date.parse(trimmed);
  if (!Number.isFinite(parsedMs)) return 0;

  const baseMs = Number.isFinite(now) ? now : Date.now();
  const deltaSeconds = Math.max(0, Math.ceil((parsedMs - baseMs) / 1000));
  if (deltaSeconds > MAX_RETRY_AFTER_SECONDS) return MAX_RETRY_AFTER_SECONDS;
  return deltaSeconds;
};
