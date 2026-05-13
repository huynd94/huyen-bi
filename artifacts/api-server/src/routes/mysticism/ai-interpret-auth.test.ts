// Regression test for Requirement 1 (Finding C1): the mysticism
// /ai-interpret endpoint must reject unauthenticated requests at 401 before
// any provider or rate-limit logic runs.
//
// Three properties are verified:
//   (a) No Clerk session → HTTP 401, and neither the provider stub nor the
//       downstream handler body executes.
//   (b) A mocked Clerk session → the wrapped handler runs, `req.userId` is
//       attached by `requireClerkUser`, and the provider stub is reached.
//   (c) After auth succeeds, the rate-limit bucket still fires — a denied
//       bucket returns a 429 and the provider stub is NOT called.
//
// Rationale for the harness:
//   `mysticism/index.ts` mounts `requireClerkUser` at the path level before
//   its POST handler (the C1 fix). To exercise that mount without a real
//   Postgres pool or OpenAI account, the test (1) statically verifies the
//   source still contains the expected mount call, and (2) replays the mount
//   pattern against a stub handler in a minimal Express app so every leaf
//   effect — "was the handler reached?", "what was req.userId?", "did the
//   rate-limit branch short-circuit?" — is directly observable.
//
//   The structural check keeps the behavioral test honest: if anyone removes
//   the `router.use(..., requireClerkUser)` line from `mysticism/index.ts`,
//   the source-level assertion fails — even if the in-test replica still
//   passes.
//
// This mirrors the pattern used by clerk-user.test.ts (getAuth test seam)
// and health.test.ts (node http client against a real listening server).

import assert from "node:assert/strict";
import http from "node:http";
import express, { Router } from "express";
import {
  __setGetAuthForTests,
  requireClerkUser,
  type AuthenticatedRequest,
} from "../../lib/clerk-user";

// The db package throws at import time when DATABASE_URL is unset. The
// behavioral harness never reaches the real pool (we stub the provider and
// rate-limit branches), but importing sibling modules that transitively load
// `@workspace/db` would still require a value. A dummy URL is sufficient.
process.env.DATABASE_URL ??= "postgres://test:test@127.0.0.1:5432/test";

// ───────────────────────── 1. Source-level assertion ─────────────────────
// The actual production router MUST mount `requireClerkUser` on
// /mysticism/ai-interpret before the POST handler. The behavioral harness
// below replicates this mount; this assertion prevents the replica from
// drifting away from the real file.
{
  const fs = await import("node:fs/promises");
  const url = new URL("./index.ts", import.meta.url);
  const src = await fs.readFile(url, "utf8");

  assert.match(
    src,
    /import\s*\{\s*requireClerkUser\s*\}\s*from\s*["']\.\.\/\.\.\/lib\/clerk-user["']/,
    "mysticism router must import requireClerkUser",
  );
  assert.match(
    src,
    /router\.use\(\s*["']\/mysticism\/ai-interpret["']\s*,\s*requireClerkUser\s*\)/,
    "mysticism router must mount requireClerkUser on /mysticism/ai-interpret",
  );

  // The mount must precede the POST handler registration so unauthenticated
  // callers are rejected before the body is parsed or the provider is
  // touched.
  const mountIdx = src.search(
    /router\.use\(\s*["']\/mysticism\/ai-interpret["']\s*,\s*requireClerkUser\s*\)/,
  );
  const postIdx = src.search(
    /router\.post\(\s*["']\/mysticism\/ai-interpret["']/,
  );
  assert.ok(mountIdx >= 0 && postIdx >= 0, "mount and post handler must both exist");
  assert.ok(
    mountIdx < postIdx,
    "requireClerkUser mount must appear before router.post(...) for the same path",
  );

  // The POST handler must still invoke `checkAndLogUsage` so the rate-limit
  // bucket stays in effect after authentication succeeds (Requirement 1,
  // AC 4 and AC 6 case 3).
  assert.match(
    src,
    /checkAndLogUsage\(/,
    "mysticism handler must still invoke checkAndLogUsage after auth",
  );
}

// ───────────────────────── 2. Behavioral harness ────────────────────────
// Replica of the mount pattern: requireClerkUser + a stub POST handler that
// records every effect we care about. We drive the harness with the same
// `__setGetAuthForTests` seam used by clerk-user.test.ts, and stub the
// rate-limit bucket + provider with plain state flags so no external
// service (Clerk, Postgres, OpenAI) is required.

type HarnessState = {
  handlerCalled: boolean;
  providerCalled: boolean;
  observedUserId: string | undefined;
  rateLimit: { allowed: boolean; limitPerHour: number; limitPerDay: number };
};

function makeState(): HarnessState {
  return {
    handlerCalled: false,
    providerCalled: false,
    observedUserId: undefined,
    rateLimit: { allowed: true, limitPerHour: 20, limitPerDay: 100 },
  };
}

function startHarness(
  state: HarnessState,
): Promise<{ server: http.Server; port: number }> {
  const app = express();
  app.use(express.json());

  const router = Router();

  // Exact mount pattern used by production `mysticism/index.ts` — the
  // source-level assertion above guarantees this reflects reality.
  router.use("/mysticism/ai-interpret", requireClerkUser);

  router.post("/mysticism/ai-interpret", async (req, res) => {
    state.handlerCalled = true;
    state.observedUserId = (req as AuthenticatedRequest).userId;

    // Replica of the production rate-limit branch: after auth succeeds the
    // server-key path still consults the bucket before touching the AI
    // provider. `state.rateLimit` stands in for the real
    // `checkAndLogUsage` result, so we can assert the ordering without a
    // live Postgres.
    if (!state.rateLimit.allowed) {
      res.status(429).json({
        error: "Rate limit exceeded",
        limitPerHour: state.rateLimit.limitPerHour,
        limitPerDay: state.rateLimit.limitPerDay,
      });
      return;
    }

    state.providerCalled = true;
    res.status(200).json({ ok: true, userId: state.observedUserId });
  });

  app.use("/api", router);

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

function post(
  port: number,
  path: string,
  body: unknown,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        method: "POST",
        path,
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
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
    req.write(payload);
    req.end();
  });
}

const VALID_BODY = {
  type: "numerology",
  context: "Ngày sinh 1/1/1990",
};

// (a) No Clerk session → 401, provider stub never called, req.userId never
//     attached. This is the core C1 assertion: anonymous callers cannot
//     reach the provider.
{
  __setGetAuthForTests(() => null);
  const state = makeState();
  const { server, port } = await startHarness(state);
  try {
    const res = await post(port, "/api/mysticism/ai-interpret", VALID_BODY);
    assert.equal(res.status, 401, "unauthenticated request must yield 401");
    assert.deepEqual(
      JSON.parse(res.body),
      { error: "Unauthorized" },
      "401 body must match the standard unauthorized shape",
    );
    assert.equal(
      state.handlerCalled,
      false,
      "route handler must not be invoked when auth rejects",
    );
    assert.equal(
      state.providerCalled,
      false,
      "provider must not be invoked when auth rejects",
    );
    assert.equal(
      state.observedUserId,
      undefined,
      "req.userId must never be set on a 401 request",
    );
  } finally {
    server.close();
  }
}

// (b) Mocked Clerk session → handler runs, req.userId is populated by
//     requireClerkUser, and the provider stub is reached.
{
  __setGetAuthForTests(() => ({ userId: "user_test_abc" }));
  const state = makeState();
  const { server, port } = await startHarness(state);
  try {
    const res = await post(port, "/api/mysticism/ai-interpret", VALID_BODY);
    assert.equal(
      res.status,
      200,
      "authenticated request must reach the stub handler",
    );
    assert.equal(
      state.handlerCalled,
      true,
      "route handler must run after auth succeeds",
    );
    assert.equal(
      state.providerCalled,
      true,
      "provider must be reached after auth + rate-limit pass",
    );
    assert.equal(
      state.observedUserId,
      "user_test_abc",
      "requireClerkUser must attach the Clerk userId to req",
    );
    const parsed = JSON.parse(res.body) as { ok: boolean; userId: string };
    assert.equal(parsed.ok, true);
    assert.equal(parsed.userId, "user_test_abc");
  } finally {
    server.close();
  }
}

// (c) Mocked Clerk session + rate-limit bucket denied → 429 returned and
//     the provider stub is skipped. Verifies the bucket still fires after
//     auth (Requirement 1, AC 4 + AC 6 case 3).
{
  __setGetAuthForTests(() => ({ userId: "user_test_abc" }));
  const state = makeState();
  state.rateLimit = { allowed: false, limitPerHour: 20, limitPerDay: 100 };
  const { server, port } = await startHarness(state);
  try {
    const res = await post(port, "/api/mysticism/ai-interpret", VALID_BODY);
    assert.equal(
      res.status,
      429,
      "rate-limited request must return 429 after auth success",
    );
    assert.equal(
      state.handlerCalled,
      true,
      "handler must still run after auth, even when the bucket denies",
    );
    assert.equal(
      state.providerCalled,
      false,
      "provider must be skipped when the rate-limit bucket denies",
    );
    assert.equal(
      state.observedUserId,
      "user_test_abc",
      "req.userId must be set even when rate-limit denies",
    );
    const parsed = JSON.parse(res.body) as {
      error: string;
      limitPerHour: number;
      limitPerDay: number;
    };
    assert.equal(parsed.error, "Rate limit exceeded");
    assert.equal(parsed.limitPerHour, 20);
    assert.equal(parsed.limitPerDay, 100);
  } finally {
    server.close();
  }
}

// Reset the seam so later tests that import clerk-user start fresh.
__setGetAuthForTests(null);
console.log("mysticism ai-interpret-auth: ok");
