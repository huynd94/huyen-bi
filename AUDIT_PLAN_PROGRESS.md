# Audit, Plan, and Progress

## Date
2026-05-11

## Scope
This file records:
- the repository audit findings
- the prioritized remediation plan
- work completed so far
- verification already run
- remaining tasks for the next IDE/agent session

## Repository Context
- Repo: `huyen-bi`
- Structure: pnpm monorepo
- Frontend: React 19 + Vite + TypeScript
- Backend: Express 5 + PostgreSQL + Clerk
- AI: OpenAI / Gemini with server-side config and SSE streaming

## Audit Summary

### Critical findings
1. XSS risk in `artifacts/mysticism-web/src/components/ui/markdown-renderer.tsx`
   Raw markdown inline content was rendered with `dangerouslySetInnerHTML` and no sanitization.

2. Admin bootstrap takeover risk in `artifacts/api-server/src/routes/config/index.ts`
   A fresh deploy could be claimed by the first caller because admin password bootstrap was unauthenticated.

3. Chat API not authenticated or scoped by user in `artifacts/api-server/src/routes/openai/index.ts`
   Conversations were globally readable/writable/deletable.

### Important findings
4. CORS too permissive in `artifacts/api-server/src/app.ts`
   `cors({ credentials: true, origin: true })` reflects arbitrary origins.

5. Admin password flow was weak
   SHA-256 hashing and password-header auth were not acceptable for admin protection.

6. AI rate limiting was bypassable
   Trusted `x-forwarded-for` too directly and used non-atomic counting.

7. Input size limits missing
   Chat/context/title fields had no practical length bounds.

8. SSE client parser was fragile
   Partial chunks could corrupt event parsing.

### Moderate findings
9. `/healthz` exposed too much internal detail.

## Decisions Already Made
- Admin authorization strategy: Clerk admin claim.
- Admin claim shape: `publicMetadata.role === "admin"`.
- Production CORS origin: `https://huyenbi.io.vn`.
- AI chat policy: login required.

## Prioritized Plan

### Task 0: Restore Quality Gate
Goal:
- make root scripts and workspace typecheck/build reliable

### Task 1: Remove Markdown XSS Path
Goal:
- stop rendering user/AI HTML via `dangerouslySetInnerHTML`

### Task 2: Protect Admin Endpoints with Clerk Admin Claim
Goal:
- replace password/bootstrap admin protection with Clerk-backed authorization

### Task 3: Require Login and User Ownership for AI Chat
Goal:
- add `user_id` ownership for conversations
- require auth for all conversation/message endpoints

### Task 4: Restrict CORS
Goal:
- allow only `https://huyenbi.io.vn` plus explicit dev origins

### Task 5: Harden Rate Limit
Goal:
- trusted proxy handling
- atomic limit accounting

### Task 6: Add Input Limits
Goal:
- constrain payload sizes for chat, admin config, and saved readings

### Task 7: Fix SSE Parsing Robustness
Goal:
- parse streaming events with a rolling buffer

### Task 8: Minimize Health Endpoint
Goal:
- keep public health output minimal

## Completed Work

### Completed: Task 0

#### What changed
- Root `package.json` scripts updated to use `corepack pnpm`.
- `preinstall` made cross-platform and no longer depends on `sh`.
- `@types/node` added at root.
- Duplicate exports fixed in `lib/api-zod/src/index.ts`.
- Missing dev type dependencies added for integration packages.
- Type issues fixed in:
  - `lib/integrations-openai-ai-server/src/batch/utils.ts`
  - `lib/integrations-openai-ai-server/src/image/client.ts`
  - `lib/integrations-openai-ai-react/src/audio/useVoiceRecorder.ts`
  - `artifacts/api-server/src/routes/readings.ts`
  - `artifacts/mysticism-web/src/pages/ai-chat.tsx`
  - `artifacts/mysticism-web/src/pages/sign-in.tsx`
  - `artifacts/mysticism-web/src/pages/sign-up.tsx`
  - `artifacts/mysticism-web/src/pages/xem-que.tsx`
  - `artifacts/mysticism-web/src/components/ui/markdown-renderer.tsx`
- Vite configs updated so `build` does not require `PORT`, and build fallback `BASE_PATH` is `/`.

#### Verification
- `corepack pnpm run typecheck` passed.
- `corepack pnpm run build` passed.
- `git diff --check` passed.

### Completed: Task 1

#### What changed
- `MarkdownRenderer` no longer uses `dangerouslySetInnerHTML` for inline markdown.
- Inline markdown now renders via React nodes so HTML is escaped by React.
- Supported formatting preserved:
  - `**bold**`
  - `*italic*`
  - `***bold italic***`
  - `` `code` ``
- Added regression test:
  - `artifacts/mysticism-web/src/components/ui/markdown-renderer.test.ts`
- Added script:
  - `artifacts/mysticism-web/package.json` -> `test:markdown`

#### Proof of bug/fix
- Before fix, test failed because raw `<img ...>` was rendered.
- After fix, test passed and HTML is escaped.

#### Verification
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/mysticism-web run test:markdown`
- `corepack pnpm run typecheck`
- `corepack pnpm run build`

### Completed: Task 2

#### What changed
- Added Clerk admin helper:
  - `artifacts/api-server/src/lib/clerk-admin.ts`
- Added helper test:
  - `artifacts/api-server/src/lib/clerk-admin.test.ts`
- Protected admin endpoints with Clerk admin claim:
  - `POST /api/admin/config`
  - `GET /api/admin/usage`
- Removed password-based admin bootstrap logic from backend config route.
- Removed admin password input/flow from frontend admin settings modal.
- Added script:
  - `artifacts/api-server/package.json` -> `test:admin`

#### Admin rule now enforced
Backend requires:

```ts
user.publicMetadata.role === "admin"
```

#### Source-backed implementation notes
Official Clerk docs used:
- `clerkMiddleware()` attaches auth state to request:
  - https://clerk.com/docs/reference/express/clerk-middleware
- `getAuth()` is appropriate for protecting API routes:
  - https://clerk.com/docs/reference/express/get-auth
- Backend `getUser()` returns the User object:
  - https://clerk.com/docs/reference/backend/user/get-user
- `publicMetadata` is available on the backend User object:
  - https://clerk.com/docs/users/user-metadata

#### Verification
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:admin`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/mysticism-web run test:markdown`
- `corepack pnpm run typecheck`
- `corepack pnpm run build`
- `git diff --check`

### Completed: Task 3

#### What changed
- Added `user_id TEXT` column to `conversations`:
  - `lib/db/src/schema/conversations.ts` — drizzle column added.
  - `artifacts/api-server/src/lib/migrate.ts` — idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` + `idx_conversations_user` index.
- Added reusable Clerk user guard middleware:
  - `artifacts/api-server/src/lib/clerk-user.ts` — `requireClerkUser` attaches `userId` to `req` or returns 401.
  - Test seam `__setGetAuthForTests` so unit tests do not require mounting `clerkMiddleware`.
- Protected every `/api/openai/conversations*` route with `requireClerkUser`:
  - `artifacts/api-server/src/routes/openai/index.ts`
  - List/get/delete/create-message all now filter by `and(id = :id, user_id = :userId)`.
  - Delete verifies ownership before cascading messages so a forged id cannot wipe another user's data.
- Frontend `/ai-chat` gated behind Clerk when Clerk is enabled:
  - `artifacts/mysticism-web/src/pages/ai-chat.tsx` — redirects unauthenticated users to `/sign-in`; demo mode (no Clerk keys) still renders for local dev.
- Added regression test:
  - `artifacts/api-server/src/lib/clerk-user.test.ts` — asserts 401 paths and userId attachment.
- Added script:
  - `artifacts/api-server/package.json` -> `test:openai-auth`.

#### Source-backed implementation notes
Official Clerk docs used:
- `getAuth()` returns `{ userId }` when the request is signed in and is the sanctioned way to protect Express routes:
  - https://clerk.com/docs/reference/express/get-auth
- `clerkMiddleware()` must be registered before any route that calls `getAuth()`:
  - https://clerk.com/docs/reference/express/clerk-middleware

#### Verification
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:openai-auth`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:admin`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/mysticism-web run test:markdown`
- `corepack pnpm --config.verify-deps-before-run=false run typecheck`
- `corepack pnpm --config.verify-deps-before-run=false run build`
- `git diff --check`

### Completed: Task 4

#### What changed
- Added CORS allow-list helper:
  - `artifacts/api-server/src/lib/cors-config.ts` — `getAllowedOrigins`, `isOriginAllowed`, `buildCorsOptions`.
- `artifacts/api-server/src/app.ts` — replaced `cors({ credentials: true, origin: true })` with `cors(buildCorsOptions())`. The server now logs the configured allow-list at startup.
- Production allow-list defaults to `https://huyenbi.io.vn`. Extra origins can be added via `CORS_ALLOWED_ORIGINS` (comma-separated). Non-production additionally permits loopback hosts (`localhost`, `127.0.0.1`, `[::1]`) on any port so dev servers work without extra config.
- Requests without an `Origin` header (same-origin, curl, server-to-server) are allowed through — the browser's CORS policy does not apply to them.
- `.env.example` — documented `CORS_ALLOWED_ORIGINS` and production default.
- Added regression test:
  - `artifacts/api-server/src/lib/cors-config.test.ts` — covers parsing, prod defaults, dev loopback, prod loopback denial, and the cors middleware callback wiring.
- Added script:
  - `artifacts/api-server/package.json` -> `test:cors`.

#### Why not `origin: true`
`cors({ origin: true })` reflects whatever `Origin` header the browser sends back into `Access-Control-Allow-Origin`. Combined with `credentials: true` that lets any site load authenticated responses from the API, which defeats the purpose of same-origin protection. An explicit allow-list removes that blast radius.

#### Source-backed implementation notes
- `cors` supports a dynamic `origin(origin, callback)` function where `callback(null, false)` omits the ACAO header for disallowed origins:
  - https://github.com/expressjs/cors#configuring-cors-w-dynamic-origin
- MDN on `Access-Control-Allow-Credentials`: with credentials, ACAO MUST NOT be the wildcard; it must match the exact origin. The allow-list approach satisfies this:
  - https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Credentials

#### Verification
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:cors`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:admin`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:openai-auth`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/mysticism-web run test:markdown`
- `corepack pnpm --config.verify-deps-before-run=false run typecheck`
- `corepack pnpm --config.verify-deps-before-run=false run build`
- `git diff --check`

### Completed: Task 5

#### What changed
- `artifacts/api-server/src/lib/rate-limit.ts` — hardened on two axes:
  1. **Client IP resolution.** `getClientIP` now returns `req.ip` instead of reading `X-Forwarded-For` directly. Without `trust proxy` set, `req.ip` is the real TCP socket address, so a client cannot spoof their IP by sending a header. When a real reverse proxy exists, the deployment opts into trusting it via the new `TRUST_PROXY` env var.
  2. **Atomic accounting.** Replaced the `SELECT COUNT + app decision + INSERT` sequence with a single transaction guarded by `pg_advisory_xact_lock(hashtext(ip))`. The count-and-conditional-insert is expressed as one CTE, so two concurrent requests from the same IP can no longer both read `count < limit` and both be allowed. Different IPs still run in parallel (per-IP lock).
- `artifacts/api-server/src/app.ts` — added optional `TRUST_PROXY` wiring (`app.set("trust proxy", ...)`) so `req.ip` can reflect the real client IP when an ops-configured proxy is in front. Unset by default — the safe choice for direct-exposed deployments.
- `.env.example` — documented `TRUST_PROXY` with realistic presets (`loopback`, hop count, CIDR) and called out that misconfiguration re-enables the spoofing bypass.
- Added regression test:
  - `artifacts/api-server/src/lib/rate-limit.test.ts` — spins up a minimal Express app and asserts:
    * With no `trust proxy`, a spoofed `X-Forwarded-For: 1.2.3.4` is ignored.
    * With `trust proxy = "loopback"`, the real client IP from XFF is used.
    * The source SQL uses `pg_advisory_xact_lock` and a combined CTE insert (proves atomic-accounting shape without requiring a live Postgres in CI).
- Added script:
  - `artifacts/api-server/package.json` -> `test:rate-limit`.

#### Source-backed implementation notes
- Express "Behind proxies" guide — treats reading XFF directly as a bypass vector and prescribes `app.set("trust proxy", ...)` so `req.ip` returns the real client:
  - https://expressjs.com/en/guide/behind-proxies.html
- PostgreSQL advisory locks (`pg_advisory_xact_lock`) are released at COMMIT/ROLLBACK and are the documented tool for serializing application-defined work inside a transaction:
  - https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS

#### Verification
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:rate-limit`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:cors`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:admin`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:openai-auth`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/mysticism-web run test:markdown`
- `corepack pnpm --config.verify-deps-before-run=false run typecheck`
- `corepack pnpm --config.verify-deps-before-run=false run build`
- `git diff --check`

### Completed: Task 6

#### What changed
- **OpenAPI spec tightened** — `lib/api-spec/openapi.yaml`:
  * `CreateOpenaiConversationBody.title`: `minLength: 1, maxLength: 200`.
  * `SendOpenaiMessageBody.content`: `minLength: 1, maxLength: 4000`.
  * `AiInterpretBody.type`: `minLength: 1, maxLength: 50`.
  * `AiInterpretBody.context`: `minLength: 1, maxLength: 8000`.
  * `AiInterpretBody.question`: `maxLength: 1000` (still optional).
- Regenerated both client bundles via `pnpm --filter @workspace/api-spec run codegen`. The generated zod schemas in `lib/api-zod/src/generated/api.ts` now carry `.min(1).max(N)` constraints, and the TS interfaces in `lib/api-zod/src/generated/types` carry `@minLength/@maxLength` JSDoc.
- `lib/api-zod/src/index.ts` — re-applied the Task 0 fix for duplicate exports between `generated/api` and `generated/types` (codegen had reset it).
- **Transport-level size cap** — `artifacts/api-server/src/app.ts`:
  * `express.json({ limit: "64kb" })` and `express.urlencoded({ limit: "64kb" })`. Any body above 64 kB is rejected with 413 *before* reaching the router, which bounds worst-case memory per request.
- **Route-level zod validation on hand-rolled endpoints**:
  * `artifacts/api-server/src/routes/config/index.ts` — `POST /api/admin/config` now validates with a strict zod `AdminConfigBody` (`provider ∈ {openai, gemini, server}`, `apiKey ≤ 500`, `model ≤ 200`, `rateLimitPerHour ≤ 1_000_000`, `rateLimitPerDay ≤ 10_000_000`). Extra keys are rejected.
  * `artifacts/api-server/src/routes/readings.ts` — `POST /api/readings` and `PATCH /api/readings/:id` now validate with zod. `title ≤ 200`, `notes ≤ 2000`, `module ≤ 50`. `input_data` / `result_data` are typed as `Record<string, unknown>` with a 32 kB serialized-byte ceiling per field. PATCH additionally requires at least one of `title` / `notes`.
- Added `zod` (catalog range) to `artifacts/api-server/package.json` so the server no longer relies on transitive hoisting.
- Added regression test — `artifacts/api-server/src/lib/input-limits.test.ts`:
  * Asserts the generated zod schemas accept valid payloads and reject `>` max-length and empty `required` fields.
  * Spins up a minimal Express app with `express.json({ limit: "64kb" })` and POSTs 200 kB; asserts the response is 413.
  * Asserts the admin-config and readings routes actually wire `AdminConfigBody.safeParse` / `CreateReadingBody.safeParse` / `PatchReadingBody.safeParse` and use the strict byte-capped shape.
- Added script: `artifacts/api-server/package.json` -> `test:input-limits`.

#### Why both transport and schema limits
- `express.json({ limit })` protects memory from a single oversized JSON blob (e.g. `"x".repeat(10_000_000)`) before parsing. It's a cheap, coarse cap.
- Per-field zod limits bound what the business logic / DB ever sees (`title` columns, prompt strings, notes). Together they make oversized inputs impossible to reach any sensitive code path.

#### Source-backed implementation notes
- Express `express.json` options — `limit` controls the maximum request body size. Default 100 kB; requests above the limit are rejected with 413 Payload Too Large:
  - https://expressjs.com/en/api.html#express.json
- OpenAPI 3.1 string validation — `minLength` / `maxLength` are the canonical way to bound string payloads and are carried through by orval's zod generator:
  - https://spec.openapis.org/oas/v3.1.0#data-types
- Zod `.strict()` rejects unknown properties on an object, preventing clients from smuggling extra fields into admin-config updates:
  - https://zod.dev/?id=strict

#### Verification
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:input-limits`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:rate-limit`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:cors`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:admin`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:openai-auth`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/mysticism-web run test:markdown`
- `corepack pnpm --config.verify-deps-before-run=false run typecheck`
- `corepack pnpm --config.verify-deps-before-run=false run build`
- `git diff --check`

### Completed: Task 7

#### What changed
- Added a shared SSE parser — `artifacts/mysticism-web/src/lib/sse-stream.ts` — that owns a rolling buffer across fetch chunks:
  * Concatenates decoded text per read.
  * Splits on the SSE event delimiter `\n\n` (per WHATWG/MDN spec).
  * Keeps unterminated tails in the buffer so events straddling chunk boundaries are reassembled instead of dropped.
  * Joins multi-line `data:` fields; ignores `:` comment lines; normalizes CRLF.
  * Terminates on `[DONE]` or `{ done: true }`.
  * Releases the underlying `ReadableStreamDefaultReader` lock in a `finally` block so the fetch response can be GC'd even if consumers break out of the iterator early.
- Rewrote both SSE consumers to use it:
  * `artifacts/mysticism-web/src/pages/ai-chat.tsx`.
  * `artifacts/mysticism-web/src/hooks/use-sse-chat.ts`.
- Added regression test — `artifacts/mysticism-web/src/lib/sse-stream.test.ts`:
  * Happy path — one event per chunk.
  * **Critical bug fix** — a single event's JSON payload split across two chunks is reassembled correctly (the old parser dropped this with a silent `JSON.parse` error).
  * Delimiter `\n\n` split across chunks waits for the full boundary.
  * Multi-line `data:` fields reassemble with `\n` joins.
  * `[DONE]` and `{done: true}` both terminate iteration; anything after is never yielded.
  * CRLF newlines normalized.
  * `:` comment lines ignored as keep-alives.
  * Final event without trailing blank line still flushes on stream end.
- Added script: `artifacts/mysticism-web/package.json` -> `test:sse`.

#### Why a shared helper
Both chat consumers (page + hook) had the same raw-`\n`-split, per-line `JSON.parse` pattern. Fixing them independently would duplicate the bug surface. Centralizing the parser means any future consumer (share-view streams, admin diagnostics, etc.) gets the correct behavior by default.

#### Source-backed implementation notes
- MDN "Using server-sent events" — events are separated by a pair of newlines; parsers must hold a rolling buffer and split on `\n\n`:
  - https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events
- WHATWG HTML Living Standard — SSE event-stream format, including multi-line `data:` reassembly and comment-line handling:
  - https://html.spec.whatwg.org/multipage/server-sent-events.html#parsing-an-event-stream

#### Verification
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/mysticism-web run test:sse`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/mysticism-web run test:markdown`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:input-limits`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:rate-limit`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:cors`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:admin`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:openai-auth`
- `corepack pnpm --config.verify-deps-before-run=false run typecheck`
- `corepack pnpm --config.verify-deps-before-run=false run build`
- `git diff --check`

### Completed: Task 8

#### What changed
- `artifacts/api-server/src/routes/health.ts` split into two endpoints:
  * **Public** `GET /api/healthz` now returns only `{ status: "ok" }` with HTTP 200. No `nodeEnv`, no Clerk key booleans, no DB error strings.
  * **Admin-only** `GET /api/admin/healthz` exposes the previous detailed report (`db`, `dbError`, `dbConfigured`, `nodeEnv`, `clerkSecretKey`, `clerkPublishableKey`) and is guarded by `requireClerkAdmin`. This keeps on-call debugging ergonomics without leaking recon-friendly data to anonymous callers.
  * Connection release is now `try/finally` so a failure mid-query never leaks a pool client.
- Added regression test — `artifacts/api-server/src/routes/health.test.ts`:
  * Mounts the router in a standalone Express app and fetches `/healthz`.
  * Asserts the response body is **exactly** `{ status: "ok" }`.
  * Iterates every previously-leaked key (`db`, `dbError`, `dbConfigured`, `nodeEnv`, `clerkSecretKey`, `clerkPublishableKey`) and asserts none of them are present.
- Added script: `artifacts/api-server/package.json` -> `test:health`.

#### Why split instead of just trim
Platform health probes (nginx, Kubernetes, uptime monitors) expect a liveness endpoint that is always unauthenticated and cheap. Trimming the response keeps that contract. At the same time, operator telemetry (DB reachable, which env we're in, whether Clerk keys are wired) is still genuinely useful for on-call. Moving it behind `requireClerkAdmin` preserves that use case without giving anonymous scanners a free recon footprint.

#### Source-backed implementation notes
- OWASP API Security — "Improper Assets Management" and "Security Misconfiguration" both flag verbose health / debug endpoints as leakage vectors:
  - https://owasp.org/API-Security/editions/2023/en/0xa9-improper-inventory-management/
- Kubernetes liveness/readiness probe guidance — probes should be simple and cheap, and a 200 response body is all the kubelet needs:
  - https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/

#### Verification
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:health`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:input-limits`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:rate-limit`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:cors`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:admin`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:openai-auth`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/mysticism-web run test:markdown`
- `corepack pnpm --config.verify-deps-before-run=false --filter @workspace/mysticism-web run test:sse`
- `corepack pnpm --config.verify-deps-before-run=false run typecheck`
- `corepack pnpm --config.verify-deps-before-run=false run build`
- `git diff --check`

## Remaining Tasks

All planned remediation tasks are complete. No more tasks queued.

### Post-Audit: Dockerfile Node version fix (2026-05-12)

**Problem:** `Dockerfile.api` and `Dockerfile.web` used `node:20-slim` + `corepack prepare pnpm@latest`. When pnpm 11 released (requires `node:sqlite` → Node ≥22.13), Docker builds broke with `ERR_UNKNOWN_BUILTIN_MODULE`. Additionally, `minimumReleaseAge: 1440` in `pnpm-workspace.yaml` blocked transitive deps missing the `time` field in npm registry metadata.

**Fix applied:**
1. Both Dockerfiles changed to `FROM node:22-slim`.
2. Removed `corepack prepare pnpm@latest --activate` — corepack now reads `packageManager` from `package.json`.
3. Added `"packageManager": "pnpm@10.32.0"` to root `package.json` for deterministic builds.
4. Documentation (`README.md`, `DEPLOY.md`) updated to reflect Node 22 requirement, corepack usage, `--frozen-lockfile`, admin via Clerk metadata, `TRUST_PROXY`, CORS config, and new API endpoints.

## Current Useful Commands

### Regression tests
```bash
corepack pnpm --config.verify-deps-before-run=false --filter @workspace/mysticism-web run test:markdown
corepack pnpm --config.verify-deps-before-run=false --filter @workspace/mysticism-web run test:sse
corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:admin
corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:openai-auth
corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:cors
corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:rate-limit
corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:input-limits
corepack pnpm --config.verify-deps-before-run=false --filter @workspace/api-server run test:health
```

### Workspace verification
```bash
corepack pnpm run typecheck
corepack pnpm run build
git diff --check
```

## Current Worktree Notes
- Worktree is intentionally dirty because Tasks 0-8 are implemented but not committed.
- `pnpm-lock.yaml` is expected to be changed due to dependency/script updates.
- Existing modified files from Tasks 0-8 include root/package, API `app.ts` + routes (health / config / openai / readings / rate-limit), db schema, `openapi.yaml` + regenerated `lib/api-zod` and `lib/api-client-react`, frontend markdown/admin settings/ai-chat + new SSE helper, `.env.example`, and new regression tests.

## Handoff Summary
All eight remediation tasks (Tasks 0-8) are implemented and verified. Next session can:
1. Review the uncommitted worktree and stage / commit the changes.
2. Re-run:
   - `corepack pnpm --config.verify-deps-before-run=false run typecheck`
   - `corepack pnpm --config.verify-deps-before-run=false run build`
3. Optionally run all regression tests listed under "Current Useful Commands".
