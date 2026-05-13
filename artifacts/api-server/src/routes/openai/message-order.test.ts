// Feature: post-opus-audit-remediation, Property 4: Rate-limit denial preserves the messages-table invariant
//
// **Validates: Requirements 5.1, 5.2, 5.5**
//
// Property 4 — For every authenticated, Zod-valid request body, when
// `checkAndLogUsage` returns `{ allowed: false }` the server MUST:
//   (a) respond with HTTP 429 and the documented JSON body shape, and
//   (b) leave the `messages` row count for the conversation unchanged —
//       i.e. never call `db.insert(messagesTable, ...)` for a denied call.
//
// This is exactly the invariant the H3 reorder (Task 7.1) established. If a
// future change moves the insert back above the rate-limit gate, an
// authenticated spammer whose bucket is exhausted could again inflate the
// conversation's messages table row by row, which is the bug this property
// guards against.
//
// Strategy (mirrors `src/routes/mysticism/ai-interpret-auth.test.ts`):
//
//   (1) A source-level assertion pins the production ordering in
//       `openai/index.ts`:
//           checkAndLogUsage(...)   →   res.status(429)   →   db.insert(messagesTable)
//       The behavioral replica below only reflects reality as long as this
//       ordering holds. Drift in the real handler fails this assertion.
//
//   (2) A behavioral harness mounts a replica router that follows the same
//       ordering and stubs:
//         - Clerk auth, via `__setGetAuthForTests` (test seam).
//         - `db.insert(messagesTable)`, via a counter so we can assert that
//           a denied request produces zero inserts.
//         - `db.select(...)` for ownership + prevMessages lookups (read-only
//           stubs returning the expected rows).
//         - `checkAndLogUsage`, via a local function fixed to return
//           `{ allowed: false, ... }`.
//       The replica does NOT mount `requireClerkUser` on the message POST
//       path because the production handler relies on a router-level
//       `router.use("/openai/conversations", requireClerkUser)` mount —
//       we replicate that same mount here for end-to-end realism.
//
//   (3) fast-check drives the replica with `numRuns: 100` of arbitrary
//       bodies that satisfy `SendOpenaiMessageBody` (content is a 1–4000
//       character string). For every run the insert counter is reset to
//       zero; after the POST the test asserts status 429 and counter == 0.

import assert from "node:assert/strict";
import http from "node:http";
import express, { Router } from "express";
import fc from "fast-check";
import { SendOpenaiMessageBody, sendOpenaiMessageBodyContentMax } from "@workspace/api-zod";
import {
  __setGetAuthForTests,
  requireClerkUser,
  type AuthenticatedRequest,
} from "../../lib/clerk-user";

// `@workspace/db` throws at import time when DATABASE_URL is unset. The
// behavioral harness below never opens a real connection (every DB call is
// stubbed), so any placeholder value is sufficient.
process.env.DATABASE_URL ??= "postgres://test:test@127.0.0.1:5432/test";

// ───────────────────────── 1. Source-level assertions ───────────────────
// The real handler MUST invoke `checkAndLogUsage` and branch to HTTP 429
// BEFORE calling `db.insert(messagesTable, ...)` for the user row. The
// replica below relies on this ordering; a regression in `openai/index.ts`
// that reintroduces the old "insert-then-check" flow would pass the replica
// test (by accident) but fail this structural check.
{
  const fs = await import("node:fs/promises");
  const url = new URL("./index.ts", import.meta.url);
  const src = await fs.readFile(url, "utf8");

  // Narrow the search to the POST /:id/messages handler body only, so
  // other handlers' `db.insert` calls (e.g. POST /conversations) don't
  // confuse the ordering check.
  const handlerStart = src.search(
    /router\.post\(\s*["']\/openai\/conversations\/:id\/messages["']/,
  );
  assert.ok(
    handlerStart >= 0,
    "POST /openai/conversations/:id/messages handler must exist",
  );
  const handlerSrc = src.slice(handlerStart);

  const checkIdx = handlerSrc.search(/\bcheckAndLogUsage\s*\(/);
  const denyIdx = handlerSrc.search(
    /res\.status\(\s*429\s*\)\.json\(\s*\{[^}]*error:\s*["']Rate limit exceeded["']/,
  );
  const insertIdx = handlerSrc.search(/db\.insert\s*\(\s*messagesTable\s*\)/);

  assert.ok(checkIdx >= 0, "handler must invoke checkAndLogUsage");
  assert.ok(denyIdx >= 0, "handler must return 429 on rate-limit denial");
  assert.ok(
    insertIdx >= 0,
    "handler must insert user row into messagesTable somewhere",
  );
  assert.ok(
    checkIdx < insertIdx,
    "checkAndLogUsage(...) must run BEFORE db.insert(messagesTable, ...)",
  );
  assert.ok(
    denyIdx < insertIdx,
    "429 denial branch must appear BEFORE db.insert(messagesTable, ...)",
  );
}

// ───────────────────────── 2. Behavioral harness ────────────────────────
// Replica router. `_checkAndLogUsage` is the state-held stub that, fixed to
// `allowed: false` for this file's property, short-circuits with 429. The
// `_insertCalls` counter is our row-count snapshot — it stands in for
// `SELECT COUNT(*) FROM messages WHERE conversation_id = :id` before / after
// the request.

type HarnessState = {
  insertCalls: number;
  rateLimit: {
    allowed: boolean;
    remainingHour: number;
    remainingDay: number;
    limitPerHour: number;
    limitPerDay: number;
  };
};

function makeState(): HarnessState {
  return {
    insertCalls: 0,
    rateLimit: {
      allowed: false,
      remainingHour: 0,
      remainingDay: 0,
      limitPerHour: 20,
      limitPerDay: 100,
    },
  };
}

function createReplicaRouter(state: HarnessState): Router {
  const router = Router();

  // Real production mount pattern (mirrored from `openai/index.ts`): every
  // /openai/conversations/* path goes through `requireClerkUser`.
  router.use("/openai/conversations", requireClerkUser);

  // Replica of the POST /:id/messages handler's ordering. Only the parts
  // relevant to Property 4 are implemented; the SSE stream and assistant
  // insert path are intentionally omitted because the property is scoped to
  // "what happens when rate-limit denies".
  router.post("/openai/conversations/:id/messages", async (req, res) => {
    const { userId } = req as unknown as AuthenticatedRequest;
    const id = Number(req.params.id);
    if (isNaN(id)) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = SendOpenaiMessageBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid body" });
      return;
    }

    // Stubbed ownership + history lookups — read-only, never increment the
    // insert counter. The conversation is "owned" by the authenticated
    // user so we reach the rate-limit gate.
    const conv = { id, userId, title: "t", createdAt: new Date() };
    if (!conv) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const _prevMessages: unknown[] = [];
    void _prevMessages;

    // Replica of the production "resolve key/provider/model" branch.
    // Because the harness never sends an `x-ai-key` header, the
    // server-key path is taken and the rate-limit gate applies —
    // exactly the branch Property 4 cares about.
    const provider = (req.headers["x-ai-provider"] as string) || "openai";
    const userApiKey = (req.headers["x-ai-key"] as string) || "";
    let usingServerKey = false;
    if (provider === "server" || !userApiKey) {
      // Real handler would call `getManyConfig` here. We skip it because
      // (a) the harness has no DB and (b) the property only exercises the
      // subsequent rate-limit branch.
      usingServerKey = true;
    }

    if (usingServerKey) {
      const rl = state.rateLimit; // stand-in for `await checkAndLogUsage(ip)`
      if (!rl.allowed) {
        res.status(429).json({
          error: "Rate limit exceeded",
          limitPerHour: rl.limitPerHour,
          limitPerDay: rl.limitPerDay,
        });
        return;
      }
    }

    // Only reachable when rate-limit allows. Track would-be inserts so a
    // regression that flips the ordering surfaces as `insertCalls > 0`.
    state.insertCalls++;
    res.status(200).end();
  });

  return router;
}

function startHarness(state: HarnessState): Promise<{ server: http.Server; port: number }> {
  const app = express();
  app.use(express.json());
  app.use(createReplicaRouter(state));
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") throw new Error("no port");
      resolve({ server, port: addr.port });
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

// ───────────────────────── 3. Property campaign ─────────────────────────
__setGetAuthForTests(() => ({ userId: "u_test_prop4" }));

const state = makeState();
const { server, port } = await startHarness(state);

try {
  // `SendOpenaiMessageBody` = { content: string.min(1).max(4000) }.
  // Generate arbitrary content strings that satisfy that bound so every
  // body reaches the rate-limit gate (rather than being short-circuited at
  // Zod validation — which would not exercise Property 4).
  const bodyArb = fc.record({
    content: fc.string({ minLength: 1, maxLength: sendOpenaiMessageBodyContentMax }),
  });

  await fc.assert(
    fc.asyncProperty(bodyArb, async (body) => {
      // Snapshot the "row count" BEFORE the request. Under the invariant
      // this must equal the post-request count.
      const before = state.insertCalls;

      const res = await post(port, "/openai/conversations/1/messages", body);

      // (a) HTTP 429 with the documented body shape.
      assert.equal(
        res.status,
        429,
        `expected 429 when rate-limit denies, got ${res.status}: ${res.body}`,
      );
      const parsed = JSON.parse(res.body) as {
        error: string;
        limitPerHour: number;
        limitPerDay: number;
      };
      assert.equal(parsed.error, "Rate limit exceeded");
      assert.equal(parsed.limitPerHour, state.rateLimit.limitPerHour);
      assert.equal(parsed.limitPerDay, state.rateLimit.limitPerDay);

      // (b) messages-table invariant: the row count did not change.
      const after = state.insertCalls;
      assert.equal(
        after,
        before,
        `messages-table invariant violated: insertCalls went ${before} → ${after} for body ${JSON.stringify(body)}`,
      );
    }),
    { numRuns: 100 },
  );

  // Cross-check: with `allowed: true`, the replica would insert. This
  // guards against a false-negative where the harness silently skips the
  // insert even when the gate allows — which would make the property
  // vacuously true. One positive run is enough to anchor the counter.
  state.rateLimit = {
    allowed: true,
    remainingHour: 19,
    remainingDay: 99,
    limitPerHour: 20,
    limitPerDay: 100,
  };
  const before = state.insertCalls;
  const positive = await post(port, "/openai/conversations/1/messages", {
    content: "allowed baseline check",
  });
  assert.equal(positive.status, 200, "allowed request must reach the post-gate branch");
  assert.equal(
    state.insertCalls,
    before + 1,
    "harness must increment insertCalls when rate-limit allows (otherwise the denial property would be vacuous)",
  );

  console.log("openai message-order (property 4): ok");
} finally {
  server.close();
  __setGetAuthForTests(null);
}
