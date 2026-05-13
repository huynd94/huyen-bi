// Feature: post-opus-audit-remediation, Task 6.2 — security response headers integration test.
//
// **Validates: Requirements 4.2, 4.5**
//
// This test boots the full API app (`../app`) and issues `GET /api/healthz`.
// The assertions check that helmet, mounted in `app.ts` per Task 6.1, attaches
// the five required security headers to every response:
//
//   - Strict-Transport-Security: max-age >= 6 months + includeSubDomains
//   - X-Frame-Options: DENY
//   - X-Content-Type-Options: nosniff
//   - Referrer-Policy: strict-origin-when-cross-origin
//   - Content-Security-Policy: contains the directives listed in design §4
//
// Importing `../app` transitively imports `@workspace/db`, which throws at
// import time when `DATABASE_URL` is unset. We never actually hit the DB here
// (the public /healthz handler returns `{ status: "ok" }` without querying),
// so a dummy connection string is enough to satisfy the top-level guard.
import assert from "node:assert/strict";
import http from "node:http";

process.env.DATABASE_URL ??= "postgres://test:test@127.0.0.1:5432/test";

const { default: app } = await import("../app");

const server = await new Promise<{ server: http.Server; port: number }>((resolve) => {
  const s = app.listen(0, "127.0.0.1", () => {
    const addr = s.address();
    if (!addr || typeof addr === "string") throw new Error("no port");
    resolve({ server: s, port: addr.port });
  });
});

function get(path: string): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port: server.port, method: "GET", path },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 0,
            headers: res.headers,
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );
    req.on("error", reject);
    req.end();
  });
}

// Small helper: header values are returned lowercased by Node; accept both
// string and string[] shapes for repeated headers.
function headerValue(
  headers: http.IncomingHttpHeaders,
  name: string,
): string | undefined {
  const raw = headers[name.toLowerCase()];
  if (raw === undefined) return undefined;
  return Array.isArray(raw) ? raw.join(", ") : raw;
}

try {
  const res = await get("/api/healthz");
  assert.equal(res.status, 200, "GET /api/healthz should return 200");
  assert.deepEqual(
    JSON.parse(res.body),
    { status: "ok" },
    "healthz body should be {status: ok}",
  );

  // 1. Strict-Transport-Security — HSTS with >= 6 months and includeSubDomains.
  const hsts = headerValue(res.headers, "Strict-Transport-Security");
  assert.ok(hsts, "response must carry Strict-Transport-Security");
  const maxAgeMatch = /max-age=(\d+)/.exec(hsts);
  assert.ok(maxAgeMatch, `HSTS must include max-age (got "${hsts}")`);
  const maxAge = Number(maxAgeMatch[1]);
  // 6 months ≈ 15_552_000s. Requirement 4.2 pins this threshold.
  assert.ok(
    maxAge >= 15_552_000,
    `HSTS max-age must be >= 15552000 (got ${maxAge})`,
  );
  assert.ok(
    /includeSubDomains/i.test(hsts),
    `HSTS must set includeSubDomains (got "${hsts}")`,
  );

  // 2. X-Frame-Options: DENY (helmet default).
  assert.equal(
    headerValue(res.headers, "X-Frame-Options"),
    "DENY",
    "X-Frame-Options must be DENY to prevent clickjacking",
  );

  // 3. X-Content-Type-Options: nosniff (helmet default).
  assert.equal(
    headerValue(res.headers, "X-Content-Type-Options"),
    "nosniff",
    "X-Content-Type-Options must be nosniff",
  );

  // 4. Referrer-Policy: strict-origin-when-cross-origin.
  assert.equal(
    headerValue(res.headers, "Referrer-Policy"),
    "strict-origin-when-cross-origin",
    "Referrer-Policy must be strict-origin-when-cross-origin",
  );

  // 5. Content-Security-Policy — must contain the directives spelled out in
  //    design §4. We check substrings rather than exact equality because the
  //    directive order is implementation-defined and helmet may append extra
  //    hardening directives in future upgrades.
  const csp = headerValue(res.headers, "Content-Security-Policy");
  assert.ok(csp, "response must carry Content-Security-Policy");
  const requiredDirectives: Array<string | RegExp> = [
    "default-src 'self'",
    "script-src",
    "connect-src",
    "img-src",
    "style-src",
    "font-src",
    "frame-src",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Clerk must be in the script-src / connect-src / frame-src source lists
    // so the frontend can boot. We use a regex to accept any of the three.
    /clerk\.dev/,
  ];
  for (const directive of requiredDirectives) {
    if (typeof directive === "string") {
      assert.ok(
        csp.includes(directive),
        `CSP must contain "${directive}" (got: ${csp})`,
      );
    } else {
      assert.ok(
        directive.test(csp),
        `CSP must match ${directive} (got: ${csp})`,
      );
    }
  }

  console.log("security-headers: all required response headers present");
} finally {
  server.server.close();
}
