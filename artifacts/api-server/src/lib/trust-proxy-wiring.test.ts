// Feature: post-opus-audit-remediation, Task 4.5 — trust-proxy wiring integration test.
//
// This test verifies that when Express is configured with
//   app.set("trust proxy", "loopback, linklocal, uniquelocal")
// — the same preset wired into docker-compose.yml for the `api` service (see
// Task 4.1 / design §2) — Express honors the `X-Forwarded-For` header for
// requests arriving from a trusted private proxy IP (here: 127.0.0.1, which
// falls under the `loopback` bucket).
//
// Boot a test Express app, send a request from 127.0.0.1 with
//   X-Forwarded-For: 203.0.113.7
// and assert `getClientIP(req) === "203.0.113.7"`. This proves the preset
// correctly resolves the real client IP when the server sits behind a proxy
// inside a Docker bridge network (loopback/linklocal/uniquelocal ranges).
//
// Validates: Requirements 2.2.
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";

// The db package throws at import time when DATABASE_URL is unset. We never
// touch the DB here — only the IP helper — so a dummy value is fine.
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

// 1. Primary case from Task 4.5: with the compose-default trust proxy preset,
//    an XFF header attached by a loopback proxy is honored, and req.ip
//    resolves to the real client IP.
{
  const { server, port } = await startApp((app) =>
    app.set("trust proxy", "loopback, linklocal, uniquelocal"),
  );
  try {
    const ip = await request(port, { "X-Forwarded-For": "203.0.113.7" });
    assert.equal(
      ip,
      "203.0.113.7",
      "getClientIP must return the XFF client IP when the request arrives from a trusted (loopback) proxy",
    );
  } finally {
    server.close();
  }
}

// 2. Multi-hop XFF: the real client IP is the left-most untrusted entry in
//    the list. When the list is `203.0.113.7, 10.0.0.5` and the request
//    arrives from 127.0.0.1, both the socket (loopback) and 10.0.0.5
//    (uniquelocal) are trusted, so Express unwinds to 203.0.113.7.
{
  const { server, port } = await startApp((app) =>
    app.set("trust proxy", "loopback, linklocal, uniquelocal"),
  );
  try {
    const ip = await request(port, {
      "X-Forwarded-For": "203.0.113.7, 10.0.0.5",
    });
    assert.equal(
      ip,
      "203.0.113.7",
      "getClientIP must skip trusted private-range hops and surface the real client IP",
    );
  } finally {
    server.close();
  }
}

// 3. Negative control: when `trust proxy` is unset, the same spoofed header
//    must NOT be honored — req.ip collapses to the socket IP (127.0.0.1).
//    This guards against an operator accidentally dropping the env and
//    expecting the preset to still apply.
{
  const { server, port } = await startApp(() => {});
  try {
    const ip = await request(port, { "X-Forwarded-For": "203.0.113.7" });
    assert.notEqual(
      ip,
      "203.0.113.7",
      "XFF must not be trusted when trust proxy is unset",
    );
  } finally {
    server.close();
  }
}

console.log("trust-proxy-wiring: ok");
