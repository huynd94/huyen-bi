// Regression test for Task 8: the public /healthz must only return
// `{ status: "ok" }`. Internal details (Clerk key presence, NODE_ENV, DB
// error messages, dbConfigured flag) moved to the admin-scoped
// /admin/healthz endpoint.
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";

process.env.DATABASE_URL ??= "postgres://test:test@127.0.0.1:5432/test";

// The admin endpoint pulls in Clerk's clerkClient on the module's import path,
// so we stub requireClerkAdmin via the getAuth test seam — but only the public
// endpoint is tested here. The admin endpoint is just a configuration move;
// its behavior is covered by the existing clerk-admin.test.ts.
const { default: healthRouter } = await import("./health");

const app = express();
app.use(healthRouter);

const server = await new Promise<{ server: http.Server; port: number }>((resolve) => {
  const s = app.listen(0, "127.0.0.1", () => {
    const addr = s.address();
    if (!addr || typeof addr === "string") throw new Error("no port");
    resolve({ server: s, port: addr.port });
  });
});

function get(path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port: server.port, method: "GET", path },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );
    req.on("error", reject);
    req.end();
  });
}

try {
  const res = await get("/healthz");
  assert.equal(res.status, 200);
  const body = JSON.parse(res.body);
  assert.deepEqual(body, { status: "ok" });

  // Defense-in-depth: the response must not leak any internal keys.
  const leaky = [
    "db",
    "dbError",
    "dbConfigured",
    "nodeEnv",
    "clerkSecretKey",
    "clerkPublishableKey",
  ];
  for (const key of leaky) {
    assert.equal(
      key in body,
      false,
      `/healthz response must not expose "${key}"`,
    );
  }

  console.log("health: /healthz returns minimal {status: ok}");
} finally {
  server.server.close();
}
