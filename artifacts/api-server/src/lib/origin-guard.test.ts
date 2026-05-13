// Feature: post-opus-audit-remediation, Property 5: originGuard rejects disallowed state-changing requests
//
// **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**
//
// Property 5 — `originGuard(req, res, next)` mirrors the specification of
// `origin-guard.ts`:
//
//   - Non-state-changing methods (anything outside POST/PATCH/PUT/DELETE)
//     always call `next()` and send no response.
//   - Bypass paths (`/api/healthz`, `/api/config/public`) always call `next()`
//     and send no response — regardless of Origin/Referer.
//   - State-changing requests to non-bypass paths:
//       * If `Origin` is present, it must pass `isOriginAllowed` against
//         `getAllowedOrigins()`. Allowed → next(); disallowed → 403.
//       * Else if `Referer` is present and URL-parses, its `.origin` must
//         pass `isOriginAllowed`. Allowed → next(); disallowed or
//         unparseable → 403.
//       * Else (both missing) → 403.
//
// The test pins `NODE_ENV=production` and `CORS_ALLOWED_ORIGINS` so the
// allow-list is deterministic (no NODE_ENV!=production loopback fallback).
// 100 fast-check runs sample methods, paths (bypass and non-bypass), and
// (origin, referer) pairs drawn from both the allow-list and a set of
// mismatch/malformed shapes, covering all branches of the specification.
// When `next()` is invoked, the test additionally asserts that no response
// was sent (no `status()` or `json()` call) — this locks down the "never
// both" invariant the middleware promises.
import assert from "node:assert/strict";
import fc from "fast-check";
import type { NextFunction, Request, Response } from "express";

// Pin env BEFORE importing origin-guard / cors-config so the allow-list is
// computed against the test's deterministic values. In production mode
// `getAllowedOrigins` returns DEFAULT_PRODUCTION_ORIGIN + parsed env list, and
// does NOT auto-allow loopback — perfect for property-oriented assertions.
process.env.NODE_ENV = "production";
process.env.CORS_ALLOWED_ORIGINS = "https://allowed.example,https://also.example";

const { originGuard } = await import("./origin-guard");
const { getAllowedOrigins } = await import("./cors-config");

const ALLOW_LIST = getAllowedOrigins();
// Sanity: pinning env gave us at least one allow-list entry so the "allowed"
// branches of the property are actually exercised.
assert.ok(ALLOW_LIST.length > 0, "allow-list must be non-empty for this test");
assert.ok(
  ALLOW_LIST.includes("https://allowed.example"),
  "env CORS_ALLOWED_ORIGINS must feed through getAllowedOrigins()",
);

const STATE_CHANGING = new Set(["POST", "PATCH", "PUT", "DELETE"]);
const BYPASS_PATHS = new Set(["/api/healthz", "/api/config/public"]);

type Outcome =
  | { type: "next" }
  | { type: "responded"; status: number };

function runGuard(
  method: string,
  path: string,
  origin: string | undefined,
  referer: string | undefined,
): Outcome {
  const headers: Record<string, string> = {};
  if (origin !== undefined) headers["origin"] = origin;
  if (referer !== undefined) headers["referer"] = referer;

  let nextCalled = false;
  let statusCode: number | undefined;
  let jsonCalled = false;

  const req = {
    method,
    path,
    header(name: string): string | undefined {
      return headers[name.toLowerCase()];
    },
  } as unknown as Request;

  const res = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(_body: unknown) {
      jsonCalled = true;
      return this;
    },
  } as unknown as Response;

  const next: NextFunction = () => {
    nextCalled = true;
  };

  originGuard(req, res, next);

  if (nextCalled) {
    // Invariant: when next() is called, the guard MUST NOT have written any
    // response. Violations would silently double-handle the request.
    assert.equal(
      statusCode,
      undefined,
      "originGuard called next() AND wrote a status — it must do exactly one",
    );
    assert.equal(
      jsonCalled,
      false,
      "originGuard called next() AND sent a json body — it must do exactly one",
    );
    return { type: "next" };
  }

  // Didn't call next → must have responded with a status.
  assert.notEqual(
    statusCode,
    undefined,
    "originGuard must either call next() or set a response status",
  );
  return { type: "responded", status: statusCode as number };
}

// Oracle — re-derives the expected outcome from the spec above. Mirrors the
// contract, not the implementation, so regressions in the impl (e.g. a
// forgotten bypass path, a typo swapping 403 for 401, or an off-by-one in
// the method list) surface as assertion failures.
function oracle(
  method: string,
  path: string,
  origin: string | undefined,
  referer: string | undefined,
): Outcome {
  if (!STATE_CHANGING.has(method)) return { type: "next" };
  if (BYPASS_PATHS.has(path)) return { type: "next" };

  // Empty-string Origin is treated as absent by `if (origin)` in JS (falsy),
  // so the guard falls through to the Referer branch. Mirror that here.
  if (origin) {
    if (ALLOW_LIST.includes(origin)) return { type: "next" };
    return { type: "responded", status: 403 };
  }

  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (ALLOW_LIST.includes(refOrigin)) return { type: "next" };
    } catch {
      // unparseable → fall through to deny
    }
  }
  return { type: "responded", status: 403 };
}

// Arbitraries — sample broadly across the input space.
const methodArb = fc.oneof(
  // Cover every method the guard branches on, plus a few it bypasses.
  fc.constantFrom("POST", "PATCH", "PUT", "DELETE", "GET", "OPTIONS", "HEAD"),
  // Occasionally a nonsense method so the "not state-changing → next" branch
  // handles exotic verbs without accidental matches.
  fc.constantFrom("CONNECT", "TRACE", "FOO", "post", "Post"),
);

const pathArb = fc.oneof(
  // Bypass paths must short-circuit regardless of origin.
  fc.constantFrom("/api/healthz", "/api/config/public"),
  // Non-bypass paths — a realistic sample of API routes and edge strings.
  fc.constantFrom(
    "/api/readings",
    "/api/readings/1",
    "/api/readings/1/share",
    "/api/openai/conversations/1/messages",
    "/api/mysticism/ai-interpret",
    "/api/config/public/extra", // differs from bypass path
    "/healthz", // no /api prefix, not a bypass
    "/",
    "",
  ),
);

const originArb = fc.oneof(
  // Missing header.
  fc.constant<string | undefined>(undefined),
  // Allowed origins — exercises the "origin present & allowed" branch.
  fc.constantFrom(...ALLOW_LIST),
  // Disallowed / malformed origins — exercises the 403 branch.
  fc.constantFrom(
    "https://evil.example",
    "http://allowed.example", // scheme mismatch
    "https://allowed.example:8080", // port mismatch
    "https://allowed.example.evil", // suffix trick
    "null",
    "",
    "not-a-url",
  ),
);

const refererArb = fc.oneof(
  fc.constant<string | undefined>(undefined),
  // Valid URLs whose origin IS in the allow-list.
  fc.constantFrom(
    ...ALLOW_LIST.flatMap((o) => [
      `${o}/`,
      `${o}/some/path`,
      `${o}/page?x=1#frag`,
    ]),
  ),
  // Valid URLs whose origin is NOT in the allow-list.
  fc.constantFrom(
    "https://evil.example/page",
    "http://allowed.example/", // scheme mismatch
    "https://allowed.example:8080/", // port mismatch
    "https://allowed.example.evil/",
  ),
  // Unparseable referers — must be treated as "no referer" → deny.
  fc.constantFrom(
    "not a url",
    "",
    "/relative/path",
    "javascript:void(0)",
    "://missing-scheme",
  ),
);

fc.assert(
  fc.property(
    methodArb,
    pathArb,
    originArb,
    refererArb,
    (method, path, origin, referer) => {
      const actual = runGuard(method, path, origin, referer);
      const want = oracle(method, path, origin, referer);
      assert.deepEqual(actual, want, JSON.stringify({ method, path, origin, referer }));
    },
  ),
  { numRuns: 100 },
);

console.log("origin-guard: ok");
