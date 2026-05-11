// Regression test for Task 5: client IP resolution must not trust arbitrary
// X-Forwarded-For headers when the server is not explicitly configured to sit
// behind a proxy. Previously, anyone could send
//   X-Forwarded-For: 1.2.3.4
// and the rate limiter would count them as 1.2.3.4, rotating IPs to bypass the
// cap. The hardened impl defers to Express's `req.ip`, which only honors XFF
// when `trust proxy` is set.
//
// The DB-side atomicity is covered by inspecting the SQL statement used —
// running it requires a live Postgres, which we cannot assume in CI. Instead,
// this test asserts that the module's query uses the advisory-lock + CTE
// pattern that makes the check-and-insert atomic.
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";

// The db package throws at import time when DATABASE_URL is unset. We never
// call checkAndLogUsage in this test — only the IP helper — so a dummy value
// is fine.
process.env.DATABASE_URL ??= "postgres://test:test@127.0.0.1:5432/test";

const { getClientIP } = await import("./rate-limit");

function startApp(configure: (app: express.Express) => void): Promise<{
  server: http.Server;
  port: number;
}> {
  const app = express();
  configure(app);
  app.get("/ip", (req, res) => {
    res.json({ ip: getClientIP(req) });
  });
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        throw new Error("Failed to acquire test port");
      }
      resolve({ server, port: address.port });
    });
  });
}

function request(
  port: number,
  headers: Record<string, string> = {},
): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port, method: "GET", path: "/ip", headers },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () => {
          try {
            const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
            resolve(body.ip);
          } catch (err) {
            reject(err);
          }
        });
      },
    );
    req.on("error", reject);
    req.end();
  });
}

// 1. trust proxy NOT set → X-Forwarded-For is ignored, so a spoofed header
//    cannot change the client IP. This is the critical bypass fix.
{
  const { server, port } = await startApp(() => {});
  try {
    const spoofed = await request(port, { "X-Forwarded-For": "1.2.3.4" });
    const direct = await request(port);
    assert.notEqual(
      spoofed,
      "1.2.3.4",
      "XFF must not be trusted when trust proxy is unset",
    );
    assert.equal(spoofed, direct, "spoofed and direct must agree — both are the real socket");
  } finally {
    server.close();
  }
}

// 2. trust proxy = "loopback" → the request comes from 127.0.0.1 (a trusted
//    proxy), so the right-most untrusted XFF entry IS used. This models the
//    realistic deployment: nginx/Caddy on the same box appends the real
//    client's IP as a single XFF entry.
{
  const { server, port } = await startApp((app) => app.set("trust proxy", "loopback"));
  try {
    const ip = await request(port, { "X-Forwarded-For": "203.0.113.42" });
    assert.equal(ip, "203.0.113.42");
  } finally {
    server.close();
  }
}

// 3. Sanity check: the rate-limit SQL uses the atomic advisory-lock + CTE
//    pattern. Reading the source directly is more stable than mocking `pg`.
{
  const fs = await import("node:fs/promises");
  const url = new URL("./rate-limit.ts", import.meta.url);
  const source = await fs.readFile(url, "utf8");
  assert.match(
    source,
    /pg_advisory_xact_lock/,
    "checkAndLogUsage must use pg_advisory_xact_lock to serialize same-IP requests",
  );
  assert.match(
    source,
    /INSERT INTO usage_log[\s\S]+WHERE \(SELECT c FROM h\) < \$2\s+AND \(SELECT c FROM d\) < \$3/,
    "the count check and the insert must be combined in a single statement",
  );
}

console.log("rate-limit: ok");
