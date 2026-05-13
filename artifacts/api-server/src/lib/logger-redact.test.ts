// Feature: post-opus-audit-remediation, Property 7: Sensitive request header values are redacted in logs
//
// **Validates: Requirements 9.5, 9.6, 9.7**
//
// Property 7 — For any sensitive request header `h` and any non-empty value
// `v`, the logger serializes the request object with `[Redacted]` in place of
// `v`. The serialized line must:
//   (a) contain the literal "[Redacted]" at the redacted header's position,
//   (b) never contain the raw `v`.
//
// The test stands up a parallel pino instance using the same `redactConfig`
// exported from `./logger.ts`, piping into an in-memory stream so we can
// inspect the exact serialized bytes. Dynamically computed "framing" (a
// baseline log line emitted with empty headers) lets us skip the cases where
// `v` coincidentally appears in pino's envelope (pid, hostname, ms timestamp,
// msg). Those are not redaction leaks — the property we care about is that
// the header value itself was substituted with `[Redacted]`.
import assert from "node:assert/strict";
import fc from "fast-check";
import pino, { type DestinationStream } from "pino";
import { redactConfig } from "./logger";

// Match requirement 9.5: the six sensitive request headers that must be
// redacted. The property covers all of them — fc.constantFrom distributes
// the 100 runs across the set.
const SENSITIVE_HEADERS = [
  "authorization",
  "cookie",
  "x-ai-key",
  "x-clerk-secret-key",
  "clerk-proxy-url",
  "x-clerk-auth-token",
] as const;

type SinkResult = { logs: string[]; log: pino.Logger };

// Build a fresh pino instance per sample, writing into an in-memory array so
// assertions operate on the exact bytes pino produced. Transport is omitted
// intentionally — we want the test to exercise the redact policy alone, not
// the pino-pretty transport that the default logger attaches in dev.
function makeLoggerWithSink(): SinkResult {
  const logs: string[] = [];
  const sink: DestinationStream = {
    write(chunk: string) {
      logs.push(chunk);
    },
  };
  const log = pino({ redact: redactConfig }, sink);
  return { logs, log };
}

// Compute the framing for each sensitive header: the exact line pino would
// emit if redaction worked perfectly (value replaced by the censor, key name
// left intact). Any substring of this framing is pid/hostname/time/level/msg
// or the header KEY or the censor itself — none of which are leaks. Using a
// per-header baseline catches the subtle case where `v` is a substring of
// the key (e.g. v="u" and h="authorization") which an empty-headers baseline
// misses.
const framingPerHeader: Record<string, string> = {};
for (const h of SENSITIVE_HEADERS) {
  const { logs, log } = makeLoggerWithSink();
  log.info({ req: { headers: { [h]: "[Redacted]" } } }, "redact-test");
  framingPerHeader[h] = logs.join("");
}

fc.assert(
  fc.property(
    fc.constantFrom(...SENSITIVE_HEADERS),
    // Non-empty string arbitrary. Bounded length keeps output compact; fast-
    // check's default alphabet covers a broad range of code points including
    // characters that require JSON escaping (quote, backslash, control).
    fc.string({ minLength: 1, maxLength: 64 }),
    (h, v) => {
      // Skip values that would make the assertions vacuously fail for reasons
      // unrelated to redaction correctness. The framing-per-header baseline
      // represents the exact line pino would emit if redaction worked
      // perfectly, so any substring of it (pid digits, hostname chars, the
      // header key name, the censor text, JSON punctuation) is framing — not
      // a leak. Millisecond-resolution timestamps can differ between the
      // baseline and the sample; filter digits defensively.
      fc.pre(!framingPerHeader[h].includes(v));
      fc.pre(!/^\d+$/.test(v));

      const { logs, log } = makeLoggerWithSink();
      log.info({ req: { headers: { [h]: v } } }, "redact-test");
      const line = logs.join("");

      // (a) The censor landed in the output.
      assert.ok(line.includes("[Redacted]"), `censor missing for header ${h}`);
      // (b) The raw header value is nowhere in the serialized line.
      assert.ok(!line.includes(v), `value leaked for header ${h}`);

      // Extra rigor: structurally verify the redaction landed at the right
      // path. Guards against a misconfigured redact policy that happens to
      // emit "[Redacted]" somewhere else and accidentally satisfies (a).
      const parsed = JSON.parse(line) as {
        req: { headers: Record<string, unknown> };
      };
      assert.equal(parsed.req.headers[h], "[Redacted]");
    },
  ),
  { numRuns: 100 },
);

console.log("logger-redact: ok");
