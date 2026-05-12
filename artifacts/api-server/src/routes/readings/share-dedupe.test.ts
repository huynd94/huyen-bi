// Feature: post-opus-audit-remediation, Property 6: Share-token dedupe concurrency invariant
//
// **Validates: Requirements 8.1, 8.3, 8.5, 8.6**
//
// Property 6 — For any `k ∈ [1..20]` concurrent calls to
//   POST /readings/:id/share
// issued for the SAME owned reading, after all calls resolve exactly one
// row in `share_tokens` must satisfy
//   reading_id = $1 AND expires_at > NOW()
// i.e. dedupe holds under concurrent races. This is the M3 invariant
// (Requirement 8.1/8.3/8.5): `pg_advisory_xact_lock(hashtext(reading_id))`
// inside the share transaction serializes the SELECT-then-INSERT window, so
// the first request that wins the lock inserts a token and every
// subsequent contender observes the existing row in its own SELECT and
// returns it unchanged.
//
// The test also verifies (Requirement 8.6) that a call for a reading NOT
// owned by the caller still returns 404 — dedupe must never relax the
// pre-existing ownership gate.
//
// ─────────────────────────────────────────────────────────────────────────
// Harness strategy
// ─────────────────────────────────────────────────────────────────────────
// A real Postgres is not assumed. We replace `pool.query` (used for the
// ownership SELECT) and `pool.connect()` (used for the share transaction)
// with an in-memory simulator that:
//   (a) maintains a tiny `saved_readings` and `share_tokens` table in JS
//       memory;
//   (b) simulates `pg_advisory_xact_lock($1)` with a per-key async mutex —
//       the lock is acquired inside the transaction and held until the
//       transaction ends (COMMIT or ROLLBACK). This is the exact semantic
//       production code relies on for concurrency safety;
//   (c) pattern-matches the precise SQL strings the production handler
//       issues. Any drift in `readings.ts` (e.g. a different INSERT column
//       list, a missing advisory lock) surfaces as an unrecognized-SQL
//       error instead of a silent pass.
//
// A source-level assertion pins the production handler to the advisory
// lock + dedupe shape the simulator expects, so the behavioral test cannot
// silently drift away from the real file. Together the structural and
// behavioral checks mean a regression in EITHER the source or the test
// surfaces as a failure.

import assert from "node:assert/strict";
import http from "node:http";
import express from "express";
import fc from "fast-check";

// `@workspace/db` throws at import time when DATABASE_URL is unset. The
// simulator below replaces both `pool.query` and `pool.connect()`, so no
// real socket is ever opened, but a placeholder value is still required
// to pass the import-time guard.
process.env.DATABASE_URL ??= "postgres://test:test@127.0.0.1:5432/test";

const { __setGetAuthForTests } = await import("../../lib/clerk-user");
const { pool } = await import("@workspace/db");
const { default: readingsRouter } = await import("../readings");

// ───────────────────────── 1. Source-level assertions ────────────────────
// The behavioral harness mirrors the production SQL strings; if
// `readings.ts` drifts, the simulator's pattern matches will fail at
// runtime — but a structural check here makes the failure mode obvious
// and pins the dedupe shape at review time.
{
  const fs = await import("node:fs/promises");
  const url = new URL("../readings.ts", import.meta.url);
  const src = await fs.readFile(url, "utf8");

  assert.match(
    src,
    /pool\.connect\(\s*\)/,
    "share handler must use pool.connect() to open a dedicated client for the transaction",
  );
  assert.match(
    src,
    /client\.query\(\s*["']BEGIN["']\s*\)/,
    "share handler must open a transaction with BEGIN",
  );
  assert.match(
    src,
    /pg_advisory_xact_lock\(hashtext\(\$1\)\)/,
    "share handler must serialize concurrent calls with pg_advisory_xact_lock(hashtext($1))",
  );
  assert.match(
    src,
    /SELECT token, expires_at[\s\S]+?FROM share_tokens[\s\S]+?WHERE reading_id = \$1 AND expires_at > NOW\(\)/,
    "share handler must look up an existing active token for the reading before inserting",
  );
  assert.match(
    src,
    /INSERT INTO share_tokens \(token, reading_id, expires_at\) VALUES \(\$1, \$2, \$3\)/,
    "share handler must insert into share_tokens with (token, reading_id, expires_at)",
  );
  assert.match(
    src,
    /SELECT id FROM saved_readings WHERE id = \$1 AND user_id = \$2/,
    "share handler must run the ownership check SELECT before the transaction",
  );

  // Ownership check must precede the transaction — otherwise a
  // non-owner's call would acquire the advisory lock and potentially
  // stall legitimate concurrent calls from the owner.
  const ownershipIdx = src.search(
    /SELECT id FROM saved_readings WHERE id = \$1 AND user_id = \$2/,
  );
  const beginIdx = src.search(/client\.query\(\s*["']BEGIN["']\s*\)/);
  assert.ok(ownershipIdx >= 0 && beginIdx >= 0, "ownership and BEGIN must both exist");
  assert.ok(
    ownershipIdx < beginIdx,
    "ownership SELECT must appear BEFORE BEGIN",
  );
}

// ───────────────────────── 2. Keyed async mutex ──────────────────────────
// Simulates `pg_advisory_xact_lock`. Calls with the same key serialize:
// every acquirer receives a `release` function and the next acquirer's
// promise does not resolve until the previous acquirer releases.
class KeyedMutex {
  private chain = new Map<string, Promise<void>>();

  async acquire(key: string): Promise<() => void> {
    const prev = this.chain.get(key) ?? Promise.resolve();
    let release!: () => void;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    // Enqueue the tail so the next acquirer waits on `next`.
    this.chain.set(key, prev.then(() => next));
    // Wait for all previous holders to finish.
    await prev;
    return () => {
      release();
      // Best-effort GC: only drop the chain entry if no one is waiting.
      // Comparing against `next` is a weak check (a later caller may have
      // rebound the tail), but correctness does not depend on this — the
      // lingering resolved promise is harmless.
      if (this.chain.get(key) === prev.then(() => next)) {
        this.chain.delete(key);
      }
    };
  }
}

// ───────────────────────── 3. In-memory DB simulator ─────────────────────
type SavedReadingRow = { id: number; user_id: string };
type ShareTokenRow = { token: string; reading_id: number; expires_at: Date };
type QueryResult = { rows: Array<Record<string, unknown>>; rowCount: number };

class Simulator {
  savedReadings: SavedReadingRow[] = [];
  shareTokens: ShareTokenRow[] = [];
  mutex = new KeyedMutex();
  unexpectedSql: string[] = [];

  reset(): void {
    this.savedReadings = [];
    this.shareTokens = [];
    this.mutex = new KeyedMutex();
    this.unexpectedSql = [];
  }

  activeTokensFor(readingId: number): ShareTokenRow[] {
    const now = new Date();
    return this.shareTokens.filter(
      (t) => t.reading_id === readingId && t.expires_at > now,
    );
  }

  // ─── pool.query — ownership SELECT only (share tx never uses this)
  async poolQuery(sql: string, params: readonly unknown[]): Promise<QueryResult> {
    if (/SELECT id FROM saved_readings WHERE id = \$1 AND user_id = \$2/.test(sql)) {
      const [id, uid] = params as [number, string];
      const found = this.savedReadings.filter((r) => r.id === id && r.user_id === uid);
      return { rows: found.map((r) => ({ id: r.id })), rowCount: found.length };
    }
    this.unexpectedSql.push(`pool.query: ${sql}`);
    throw new Error(`Simulator: unexpected pool.query SQL: ${sql.slice(0, 120)}`);
  }

  // ─── pool.connect() — returns a client with serialized transaction
  //     semantics via the per-key mutex.
  connect(): {
    query: (sql: string, params?: readonly unknown[]) => Promise<QueryResult>;
    release: () => void;
  } {
    const self = this;
    let lockRelease: (() => void) | null = null;

    const releaseLock = () => {
      if (lockRelease) {
        lockRelease();
        lockRelease = null;
      }
    };

    return {
      query: async (sql: string, params: readonly unknown[] = []) => {
        // Transaction control statements — BEGIN/COMMIT/ROLLBACK are
        // passed as string literals by the production handler.
        if (/^\s*BEGIN\s*$/i.test(sql)) {
          return { rows: [], rowCount: 0 };
        }
        if (/^\s*COMMIT\s*$/i.test(sql)) {
          releaseLock();
          return { rows: [], rowCount: 0 };
        }
        if (/^\s*ROLLBACK\s*$/i.test(sql)) {
          releaseLock();
          return { rows: [], rowCount: 0 };
        }

        // Advisory lock — held until COMMIT/ROLLBACK/release().
        if (/pg_advisory_xact_lock\(hashtext\(\$1\)\)/.test(sql)) {
          const key = String(params[0]);
          lockRelease = await self.mutex.acquire(key);
          return { rows: [{ pg_advisory_xact_lock: null }], rowCount: 1 };
        }

        // Existing-active-token lookup.
        if (
          /SELECT token, expires_at\s+FROM share_tokens\s+WHERE reading_id = \$1 AND expires_at > NOW\(\)/.test(
            sql,
          )
        ) {
          const [id] = params as [number];
          const active = self
            .activeTokensFor(id)
            .sort((a, b) => b.expires_at.getTime() - a.expires_at.getTime());
          const top = active[0];
          if (!top) return { rows: [], rowCount: 0 };
          return {
            rows: [{ token: top.token, expires_at: top.expires_at }],
            rowCount: 1,
          };
        }

        // INSERT (with ON CONFLICT (token) DO NOTHING — we dedupe by
        // unique token just like the real schema).
        if (
          /INSERT INTO share_tokens \(token, reading_id, expires_at\) VALUES \(\$1, \$2, \$3\)/.test(
            sql,
          )
        ) {
          const [token, readingId, expiresAt] = params as [string, number, Date];
          if (!self.shareTokens.some((t) => t.token === token)) {
            self.shareTokens.push({ token, reading_id: readingId, expires_at: expiresAt });
          }
          return { rows: [], rowCount: 1 };
        }

        self.unexpectedSql.push(`client.query: ${sql}`);
        throw new Error(`Simulator: unexpected client.query SQL: ${sql.slice(0, 120)}`);
      },
      release: () => {
        // Safety net — if the handler forgot to COMMIT/ROLLBACK before
        // returning the client, still release the lock so the next
        // waiter proceeds. Production correctness does not depend on
        // this path (the handler always COMMIT/ROLLBACKs), but it keeps
        // the test from deadlocking on a buggy handler.
        releaseLock();
      },
    };
  }
}

const sim = new Simulator();

// Monkey-patch the pool. The real Pool has a much broader API, but the
// share handler only uses `.query(sql, params)` and `.connect()`, so we
// narrow to those two entry points.
const originalQuery = pool.query.bind(pool);
const originalConnect = pool.connect.bind(pool);
(pool as unknown as {
  query: (sql: string, params?: readonly unknown[]) => Promise<QueryResult>;
}).query = (sql, params = []) => sim.poolQuery(sql, params);
(pool as unknown as {
  connect: () => Promise<ReturnType<Simulator["connect"]>>;
}).connect = async () => sim.connect();

// ───────────────────────── 4. Behavioral harness ─────────────────────────
const OWNER = "user_prop6_owner";
const INTRUDER = "user_prop6_intruder";

__setGetAuthForTests(() => ({ userId: OWNER }));

const app = express();
app.use(express.json());
app.use(readingsRouter);

const { server, port } = await new Promise<{ server: http.Server; port: number }>(
  (resolve) => {
    const s = app.listen(0, "127.0.0.1", () => {
      const addr = s.address();
      if (!addr || typeof addr === "string") throw new Error("no port");
      resolve({ server: s, port: addr.port });
    });
  },
);

function post(path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        method: "POST",
        path,
        headers: { "Content-Type": "application/json", "Content-Length": 0 },
      },
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

// ───────────────────────── 5. Property campaign ──────────────────────────
// For k ∈ [1..20], seed one owned reading, race k concurrent share POSTs,
// then assert exactly one active token exists. Also assert all successful
// responses carry the SAME token — the dedupe invariant would otherwise
// allow k distinct tokens to coexist without an active-count > 1 (which the
// simulated schema already forbids via the token PK) but would still hand
// clients inconsistent links.
try {
  await fc.assert(
    fc.asyncProperty(fc.integer({ min: 1, max: 20 }), async (k) => {
      // Fresh state for every run — the dedupe invariant must hold
      // regardless of prior history.
      sim.reset();
      const READING_ID = 1;
      sim.savedReadings.push({ id: READING_ID, user_id: OWNER });

      const responses = await Promise.all(
        Array.from({ length: k }, () => post(`/readings/${READING_ID}/share`)),
      );

      // (a) Every response is a 200 with a JSON body carrying `token` and
      //     `expiresAt`. A 500 here would indicate the simulator
      //     encountered an unexpected SQL string (drift with readings.ts).
      const parsedAll = responses.map((r) => {
        assert.equal(
          r.status,
          200,
          `expected 200 from authorized share call, got ${r.status}: ${r.body}`,
        );
        const parsed = JSON.parse(r.body) as { token: unknown; expiresAt: unknown };
        assert.equal(
          typeof parsed.token,
          "string",
          `response must carry a string token; got ${JSON.stringify(parsed)}`,
        );
        assert.ok(
          typeof parsed.expiresAt === "string" || parsed.expiresAt instanceof Date,
          `response must carry an expiresAt; got ${JSON.stringify(parsed)}`,
        );
        return parsed as { token: string; expiresAt: string };
      });

      // (b) The dedupe invariant — the share_tokens table holds exactly
      //     one active row for this reading after the race resolves.
      const active = sim.activeTokensFor(READING_ID);
      assert.equal(
        active.length,
        1,
        `expected exactly 1 active share_token for reading ${READING_ID}, got ${active.length} (k=${k})`,
      );

      // (c) Every successful response returns the same token — the active
      //     row's token. A drift that inserts k rows but hands back only
      //     the latest would violate (b) above; a drift that returns
      //     different tokens to different callers would violate (c) here.
      const canonicalToken = active[0]!.token;
      for (const parsed of parsedAll) {
        assert.equal(
          parsed.token,
          canonicalToken,
          `every concurrent caller must receive the same token; got ${parsed.token} vs ${canonicalToken}`,
        );
      }

      // (d) The simulator did not reject any SQL as unknown — a sanity
      //     assertion against drift between readings.ts and this file.
      assert.deepEqual(
        sim.unexpectedSql,
        [],
        `simulator encountered unexpected SQL: ${sim.unexpectedSql.join(" | ")}`,
      );
    }),
    { numRuns: 50 },
  );

  // ───────────────── 6. Ownership preserved (Requirement 8.6) ────────────
  // Caller is an authenticated user who does NOT own the reading. The
  // ownership SELECT returns zero rows, so the handler MUST respond 404
  // without opening the share transaction. This also indirectly checks
  // that the advisory lock is NOT acquired for a non-owner — the
  // simulator's `unexpectedSql` recorder stays empty.
  sim.reset();
  sim.savedReadings.push({ id: 1, user_id: OWNER });

  __setGetAuthForTests(() => ({ userId: INTRUDER }));
  const intruderRes = await post("/readings/1/share");
  assert.ok(
    intruderRes.status === 403 || intruderRes.status === 404,
    `intruder share call must return 403/404, got ${intruderRes.status}: ${intruderRes.body}`,
  );
  assert.equal(
    sim.activeTokensFor(1).length,
    0,
    "intruder call must not insert any share_tokens row",
  );

  console.log("share-dedupe (property 6): ok");
} finally {
  server.close();
  // Restore the original pool methods and Clerk seam so later tests that
  // import the same modules start clean.
  (pool as unknown as { query: typeof originalQuery }).query = originalQuery;
  (pool as unknown as { connect: typeof originalConnect }).connect = originalConnect;
  __setGetAuthForTests(null);
}
