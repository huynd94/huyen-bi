// Regression test for Requirement 9 (Finding L3): `GET /api/config/public`
// must not leak `adminConfigured` to anonymous callers. The field is a
// signal of deployment provisioning state, so it is now gated behind a
// Clerk admin claim — present in the response body only when the caller
// holds `publicMetadata.role === "admin"`.
//
// Two cases, per tasks.md §13.4:
//   (a) Anonymous GET → response JSON does NOT contain key `adminConfigured`
//       (regardless of whether the deployment is configured).
//   (b) Admin session (mocked `publicMetadata.role === "admin"`) → response
//       JSON contains key `adminConfigured`.
//
// Harness strategy mirrors `readings-params.test.ts` and
// `mysticism/ai-interpret-auth.test.ts`:
//   - A source-level assertion fails fast if `routes/config/index.ts` stops
//     gating the field behind `hasAdminRole(...)`.
//   - A behavioral harness mounts the real `config` router against a live
//     Express + node:http listener, stubbing the two side-effects the
//     handler touches:
//       * `pool.connect()` (used by `getManyConfig`) → returns a client
//         whose `query` yields an empty rowset, forcing `getManyConfig` to
//         fall back to its in-memory DEFAULTS. No real Postgres is needed.
//       * For the admin case, a shim middleware attaches `req.auth` so the
//         `getAuth(req)` call inside the handler resolves to a userId, and
//         `clerkClient.users.getUser` is monkey-patched to return a user
//         with `publicMetadata.role === "admin"`.
//   - The anonymous case installs NO shim middleware. `getAuth(req)` then
//     throws because `req.auth` is absent — the handler's try/catch
//     swallows the error and omits `adminConfigured`, which is exactly the
//     production behavior for an unauthenticated caller.

import assert from "node:assert/strict";
import http from "node:http";
import express from "express";

// Satisfy `@workspace/db` import-time check. The pool.connect stub below
// replaces the real connection path, so no real pg socket is opened.
process.env.DATABASE_URL ??= "postgres://test:test@127.0.0.1:5432/test";

// The admin case asserts `adminConfigured` is present in the response. The
// handler computes its value as
//   !!(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY)
// so both envs must be set before the router is imported (the proxied
// `clerkClient` also reads them at first access). Using `sk_test_`/`pk_test_`
// prefixes keeps Clerk's key-parser happy.
process.env.CLERK_SECRET_KEY ??= "sk_test_public_config_dummy";
process.env.CLERK_PUBLISHABLE_KEY ??= "pk_test_public_config_dummy";

const { pool } = await import("@workspace/db");
const clerkExpress = await import("@clerk/express");
const { default: configRouter } = await import("./index");

// ───────────────────────── 1. Source-level assertion ────────────────────
// The production handler MUST gate `adminConfigured` behind
// `hasAdminRole(user.publicMetadata)` and MUST build the response body
// without the key by default. A drift in `config/index.ts` that drops the
// guard would reintroduce the L3 leak.
{
  const fs = await import("node:fs/promises");
  const url = new URL("./index.ts", import.meta.url);
  const src = await fs.readFile(url, "utf8");

  assert.match(
    src,
    /import\s*\{[^}]*hasAdminRole[^}]*\}\s*from\s*["']\.\.\/\.\.\/lib\/clerk-admin["']/,
    "config router must import hasAdminRole from clerk-admin",
  );
  assert.match(
    src,
    /import\s*\{[^}]*\bgetAuth\b[^}]*\}\s*from\s*["']@clerk\/express["']/,
    "config router must import getAuth from @clerk/express",
  );
  assert.match(
    src,
    /hasAdminRole\(\s*user\.publicMetadata\s*\)/,
    "config router must gate adminConfigured behind hasAdminRole(user.publicMetadata)",
  );

  // The handler MUST assemble the response body before attaching
  // adminConfigured — proof that the default shape (anonymous) lacks the
  // key. A body declared with `adminConfigured` already inside it would
  // break the anonymous guarantee even if the admin check later overwrote
  // it.
  const bodyDeclIdx = src.search(
    /const\s+body(?:\s*:\s*[^=]+)?\s*=\s*\{[\s\S]*?\};/,
  );
  const adminAttachIdx = src.search(
    /body(?:\.adminConfigured|\[\s*["']adminConfigured["']\s*\])\s*=/,
  );
  assert.ok(
    bodyDeclIdx >= 0 && adminAttachIdx >= 0,
    "expected both a body literal declaration and an adminConfigured attachment",
  );
  assert.ok(
    bodyDeclIdx < adminAttachIdx,
    "body literal must be declared before adminConfigured is attached",
  );

  // Sanity: the literal itself must NOT mention adminConfigured, otherwise
  // the anonymous response would carry the key regardless of the guard.
  const bodyLiteralMatch = src.match(
    /const\s+body(?:\s*:\s*[^=]+)?\s*=\s*(\{[\s\S]*?\});/,
  );
  assert.ok(bodyLiteralMatch, "expected the body literal to be matchable");
  assert.ok(
    !/adminConfigured/.test(bodyLiteralMatch[1]!),
    "body literal must not contain adminConfigured — the key is attached conditionally",
  );
}

// ───────────────────────── 2. Pool stub ─────────────────────────────────
// `getManyConfig` calls `pool.connect()` then `client.query(...)`. An empty
// rowset lets `getManyConfig` fall back to its in-memory DEFAULTS
// (`ai_provider = "openai"`, `ai_api_key = null`, etc.) so the handler can
// still build a deterministic body without a real database.
type MockClient = {
  query: (sql: string, params?: readonly unknown[]) => Promise<{ rows: unknown[] }>;
  release: () => void;
};

const originalConnect = pool.connect.bind(pool);
(pool as unknown as { connect: () => Promise<MockClient> }).connect = async () => ({
  query: async () => ({ rows: [] }),
  release: () => {},
});

// ───────────────────────── 3. Clerk client stub ─────────────────────────
// Monkey-patch `clerkClient.users.getUser` so the admin-case lookup
// resolves without hitting the real Clerk API. The task explicitly allows
// this approach when no `__setClerkClientForTests` seam exists.
//
// Access `clerkClient.users` once to force the Proxy in `@clerk/express` to
// materialize the underlying client and stash it in the singleton. After
// that, the getter returns the same object every time, so our override on
// `.getUser` persists across calls. We capture the original for restore.
type GetUserFn = typeof clerkExpress.clerkClient.users.getUser;
const usersApi = clerkExpress.clerkClient.users as {
  getUser: GetUserFn;
};
const originalGetUser = usersApi.getUser.bind(usersApi);

let getUserCalls: string[] = [];
usersApi.getUser = (async (userId: string) => {
  getUserCalls.push(userId);
  // The handler only reads `publicMetadata` from the returned user (via
  // `hasAdminRole`), so we fabricate the minimum shape and cast through
  // `unknown` — the full Clerk `User` type has 30+ fields irrelevant to
  // this property.
  return {
    id: userId,
    publicMetadata: { role: "admin" },
  } as unknown as Awaited<ReturnType<GetUserFn>>;
}) as GetUserFn;

// ───────────────────────── 4. Server harness ────────────────────────────
// Two separate Express instances share the same configRouter:
//   - `anonymousApp` has no auth shim; `getAuth(req)` in the handler throws
//     because `req.auth` is absent, the handler's try/catch swallows it,
//     and `adminConfigured` is never attached.
//   - `adminApp` installs a minimal middleware that writes `req.auth` — a
//     nullary function matching Clerk's internal contract — so the handler
//     reaches the `user.publicMetadata` check with `userId` set, and our
//     monkey-patched `getUser` returns an admin.
//
// Why two listeners instead of one app toggled via a flag: the config
// router is a singleton the moment it is imported, and the anonymous
// assertion hinges on there being NO middleware upstream of the handler
// that fabricates `req.auth`. Keeping the two harnesses physically
// separate prevents accidental leakage (e.g. a stray middleware surviving
// between assertions) and models the two production deployments exactly.

function makeApp(
  authShim?: (req: express.Request, res: express.Response, next: express.NextFunction) => void,
): express.Express {
  const app = express();
  app.use(express.json());
  if (authShim) app.use(authShim);
  app.use("/api", configRouter);
  return app;
}

function listen(app: express.Express): Promise<{ server: http.Server; port: number }> {
  return new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => {
      const addr = s.address();
      if (!addr || typeof addr === "string") throw new Error("no port");
      resolve({ server: s, port: addr.port });
    });
  });
}

function get(port: number, path: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      { host: "127.0.0.1", port, method: "GET", path },
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
  // ─────────────────────── Case (a): anonymous ──────────────────────────
  // No auth shim is mounted. Inside the handler, `getAuth(req)` throws
  // (no `req.auth`), the try/catch swallows it, and the response body is
  // emitted WITHOUT the `adminConfigured` key. The other public fields
  // still appear with their DEFAULTS-driven values.
  {
    getUserCalls = [];
    const anonymousApp = makeApp();
    const anonymous = await listen(anonymousApp);
    try {
      const res = await get(anonymous.port, "/api/config/public");
      assert.equal(
        res.status,
        200,
        "anonymous /config/public must still succeed (the endpoint is public)",
      );
      const body = JSON.parse(res.body) as Record<string, unknown>;
      assert.equal(
        "adminConfigured" in body,
        false,
        "anonymous response must NOT contain the `adminConfigured` key (L3 leak)",
      );
      // Sanity: the other documented fields are still present so we know
      // the handler ran and emitted a real public config, not an error.
      assert.equal(body.serverKeyConfigured, false);
      assert.equal(body.provider, "openai");
      assert.ok(typeof body.model === "string" && (body.model as string).length > 0);
      assert.equal(body.rateLimitPerHour, 20);
      assert.equal(body.rateLimitPerDay, 100);
      // Sanity: the admin-only Clerk lookup must NOT have run on the
      // anonymous path — the try/catch failed earlier at getAuth.
      assert.equal(
        getUserCalls.length,
        0,
        "anonymous path must not reach clerkClient.users.getUser",
      );
    } finally {
      anonymous.server.close();
    }
  }

  // ─────────────────────── Case (b): admin session ─────────────────────
  // The shim middleware sets `req.auth` so the handler's `getAuth(req)`
  // returns a userId. Our monkey-patched `clerkClient.users.getUser` then
  // resolves to a user with `publicMetadata.role === "admin"`, and
  // `hasAdminRole` returns true, so the handler attaches
  // `adminConfigured` to the response.
  {
    getUserCalls = [];
    const ADMIN_USER_ID = "user_admin_test_public_config";
    const adminApp = makeApp((req, _res, next) => {
      // Minimal shape that satisfies `requestHasAuthObject` ("auth" in req)
      // and the `req.auth(options)` call inside @clerk/express's `getAuth`.
      // The authObject contract only needs `userId` and `tokenType` for
      // this code path; `debug` is called by signed-out/invalid fallbacks,
      // so a no-op keeps it safe if the token-type branch ever changes.
      (req as express.Request & { auth: (opts?: unknown) => unknown }).auth =
        () => ({
          userId: ADMIN_USER_ID,
          tokenType: "session_token",
          debug: () => ({}),
        });
      next();
    });
    const admin = await listen(adminApp);
    try {
      const res = await get(admin.port, "/api/config/public");
      assert.equal(res.status, 200, "admin /config/public must succeed");
      const body = JSON.parse(res.body) as Record<string, unknown>;
      assert.equal(
        "adminConfigured" in body,
        true,
        "admin response MUST contain the `adminConfigured` key",
      );
      // The value reflects whether both Clerk env vars are set at boot.
      // We set both at the top of this file, so it must be `true` — but
      // requirement 9.8 only asserts the KEY's presence, so we validate
      // the type (boolean) and not the exact value.
      assert.equal(
        typeof body.adminConfigured,
        "boolean",
        "`adminConfigured` must be a boolean when present",
      );
      assert.equal(
        body.adminConfigured,
        true,
        "with both CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY set, `adminConfigured` must be true",
      );
      // The public fields persist alongside the gated one.
      assert.equal(body.serverKeyConfigured, false);
      assert.equal(body.provider, "openai");
      assert.equal(body.rateLimitPerHour, 20);
      assert.equal(body.rateLimitPerDay, 100);
      // Sanity: the admin lookup fired exactly once with our userId,
      // proving the gate actually consulted Clerk rather than short-
      // circuiting somewhere else.
      assert.deepEqual(
        getUserCalls,
        [ADMIN_USER_ID],
        "admin path must invoke clerkClient.users.getUser exactly once with the session userId",
      );
    } finally {
      admin.server.close();
    }
  }

  console.log("public-config: ok");
} finally {
  // Restore every stubbed side-effect so later tests importing the same
  // modules (e.g. a combined `test:audit-remediation` runner) observe a
  // clean baseline.
  (pool as unknown as { connect: typeof originalConnect }).connect = originalConnect;
  usersApi.getUser = originalGetUser;
}
