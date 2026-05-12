// Regression test for Requirement 7 (Finding M2): the readings handlers
// MUST validate `:id` as a positive integer via `parsePositiveIntParam`
// before touching the database. Invalid ids return HTTP 400 with
// `{ error: "Invalid reading id" }`; valid-but-absent ids return 404.
//
// Coverage (per tasks.md §10.2):
//   (1) DELETE /readings/abc        → 400, pool.query never called
//   (2) DELETE /readings/-1         → 400, pool.query never called
//   (3) PATCH  /readings/12.5       → 400, pool.query never called
//   (4) POST   /readings/99999999/share (valid id, ownership query returns
//                                        empty) → 404
//   (5) DELETE /readings/xyz        → 400, pool.query never called
//
// Harness strategy mirrors `src/routes/mysticism/ai-interpret-auth.test.ts`:
//   - A source-level assertion fails fast if the production handler stops
//     calling `parsePositiveIntParam` or forgets to return 400 on null.
//   - A behavioral harness mounts the real `readings` router against a live
//     Express + node:http listener, so every handler path is exercised end
//     to end. Clerk is stubbed via `__setGetAuthForTests`; Postgres is
//     stubbed by monkey-patching `pool.query` on `@workspace/db`.
//
// For the four 400 cases the handler returns before any DB query, so the
// pool stub records `called = 0`. For the 404 case the stub returns
// `{ rows: [], rowCount: 0 }` to simulate "ownership lookup found no row".

import assert from "node:assert/strict";
import http from "node:http";
import express from "express";

// Satisfy `@workspace/db` import-time check. The pool stub below replaces
// `pool.query` with a synchronous in-memory recorder, so no real connection
// is ever established.
process.env.DATABASE_URL ??= "postgres://test:test@127.0.0.1:5432/test";

const { __setGetAuthForTests } = await import("../lib/clerk-user");
const { pool } = await import("@workspace/db");
const { default: readingsRouter } = await import("./readings");

// ───────────────────────── 1. Source-level assertions ────────────────────
// The production handlers MUST call `parsePositiveIntParam` and MUST respond
// `400 { error: "Invalid reading id" }` when it returns `null`. A drift in
// `readings.ts` that removes this guard would let malformed ids hit pg and
// surface a generic 500 (Requirement 7 AC 1 failure).
{
  const fs = await import("node:fs/promises");
  const url = new URL("./readings.ts", import.meta.url);
  const src = await fs.readFile(url, "utf8");

  assert.match(
    src,
    /import\s*\{\s*parsePositiveIntParam\s*\}\s*from\s*["']\.\.\/lib\/param-validators["']/,
    "readings router must import parsePositiveIntParam",
  );

  // Count the 400 bad-id branches: PATCH, DELETE, share — three handlers.
  const guardRegex = /parsePositiveIntParam\(\s*req\.params\.id\s*\)/g;
  const guardMatches = src.match(guardRegex) ?? [];
  assert.equal(
    guardMatches.length,
    3,
    "expected 3 parsePositiveIntParam(req.params.id) calls (PATCH, DELETE, share)",
  );

  const invalidIdRegex = /res\.status\(\s*400\s*\)\.json\(\s*\{\s*error:\s*["']Invalid reading id["']\s*\}\s*\)/g;
  const invalidIdMatches = src.match(invalidIdRegex) ?? [];
  assert.equal(
    invalidIdMatches.length,
    3,
    "expected 3 `400 { error: 'Invalid reading id' }` branches matching the guards",
  );
}

// ───────────────────────── 2. Pool stub ─────────────────────────────────
type QueryCall = { sql: string; params: readonly unknown[] };

type PoolQueryResult = {
  rows: unknown[];
  rowCount: number;
};

const poolCalls: QueryCall[] = [];
let nextPoolResult: PoolQueryResult = { rows: [], rowCount: 0 };

const originalQuery = pool.query.bind(pool);
// Express route handlers only need the `(sql, params)` overload; the real
// Pool accepts many call shapes, but we narrow to the one readings.ts uses.
(pool as unknown as { query: (sql: string, params?: readonly unknown[]) => Promise<PoolQueryResult> }).query =
  async (sql: string, params: readonly unknown[] = []) => {
    poolCalls.push({ sql, params });
    return nextPoolResult;
  };

function resetPoolRecorder(result: PoolQueryResult = { rows: [], rowCount: 0 }): void {
  poolCalls.length = 0;
  nextPoolResult = result;
}

// ───────────────────────── 3. Behavioral harness ────────────────────────
__setGetAuthForTests(() => ({ userId: "user_test_params" }));

const app = express();
app.use(express.json());
app.use(readingsRouter);

const server = await new Promise<{ server: http.Server; port: number }>((resolve) => {
  const s = app.listen(0, "127.0.0.1", () => {
    const addr = s.address();
    if (!addr || typeof addr === "string") throw new Error("no port");
    resolve({ server: s, port: addr.port });
  });
});

function request(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const headers: Record<string, string | number> = {};
    if (payload !== undefined) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(payload);
    }
    const req = http.request(
      { host: "127.0.0.1", port: server.port, method, path, headers },
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
    if (payload !== undefined) req.write(payload);
    req.end();
  });
}

try {
  // (1) DELETE /readings/abc → 400, pool untouched.
  {
    resetPoolRecorder();
    const res = await request("DELETE", "/readings/abc");
    assert.equal(res.status, 400, "non-numeric id must return 400");
    assert.deepEqual(
      JSON.parse(res.body),
      { error: "Invalid reading id" },
      "400 body must name the invalid reading id",
    );
    assert.equal(
      poolCalls.length,
      0,
      "pool.query must not be called when :id is rejected by the guard",
    );
  }

  // (2) DELETE /readings/-1 → 400, pool untouched.
  {
    resetPoolRecorder();
    const res = await request("DELETE", "/readings/-1");
    assert.equal(res.status, 400, "negative id must return 400");
    assert.deepEqual(JSON.parse(res.body), { error: "Invalid reading id" });
    assert.equal(
      poolCalls.length,
      0,
      "pool.query must not be called for negative id",
    );
  }

  // (3) PATCH /readings/12.5 → 400, pool untouched. The guard runs before
  //     body parsing, so even a perfectly valid body should not leak through.
  {
    resetPoolRecorder();
    const res = await request("PATCH", "/readings/12.5", { title: "ignored" });
    assert.equal(res.status, 400, "decimal id must return 400");
    assert.deepEqual(JSON.parse(res.body), { error: "Invalid reading id" });
    assert.equal(
      poolCalls.length,
      0,
      "pool.query must not be called for decimal id",
    );
  }

  // (4) POST /readings/99999999/share → 404. The id is a valid positive
  //     integer, so the guard passes and the handler reaches the ownership
  //     `SELECT id FROM saved_readings WHERE id = $1 AND user_id = $2`. Our
  //     stub returns an empty row set, simulating "no such reading for this
  //     user" — the handler must then respond 404 without opening a client
  //     transaction (the share flow only calls `pool.connect()` AFTER the
  //     ownership check succeeds).
  {
    resetPoolRecorder({ rows: [], rowCount: 0 });
    const res = await request("POST", "/readings/99999999/share");
    assert.equal(res.status, 404, "valid-but-absent id must return 404");
    assert.deepEqual(
      JSON.parse(res.body),
      { error: "Không tìm thấy" },
      "404 body must match the existing not-found shape",
    );
    assert.equal(
      poolCalls.length,
      1,
      "only the ownership SELECT should run; the share transaction must not start",
    );
    const call = poolCalls[0]!;
    assert.match(
      call.sql,
      /SELECT id FROM saved_readings WHERE id = \$1 AND user_id = \$2/,
      "first query must be the ownership check",
    );
    assert.deepEqual(
      call.params,
      [99999999, "user_test_params"],
      "ownership check must bind the parsed number and Clerk userId",
    );
  }

  // (5) DELETE /readings/xyz → 400, pool untouched. A second non-numeric
  //     case locks in that the guard isn't a one-off for "abc".
  {
    resetPoolRecorder();
    const res = await request("DELETE", "/readings/xyz");
    assert.equal(res.status, 400, "alphabetic id must return 400");
    assert.deepEqual(JSON.parse(res.body), { error: "Invalid reading id" });
    assert.equal(
      poolCalls.length,
      0,
      "pool.query must not be called for alphabetic id",
    );
  }

  console.log("readings-params: ok");
} finally {
  server.server.close();
  // Restore the original pool.query and the getAuth seam so later tests
  // importing the same modules start clean.
  (pool as unknown as { query: typeof originalQuery }).query = originalQuery;
  __setGetAuthForTests(null);
}
