# Implementation Plan: post-opus-audit-remediation

Convert the feature design into a series of prompts for a code-generation LLM that will implement each step with incremental progress. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step. Focus ONLY on tasks that involve writing, modifying, or testing code.

## Overview

This plan remediates the 10 findings from the post-Opus adversarial re-audit (C1, C2, H1, H2, H3, M1, M2, M3, L3, L7). Work is ordered by severity (CRITICAL → HIGH → MEDIUM → LOW) and by dependency: shared helpers and new lib modules land before the routes that consume them, and property/unit tests sit directly next to the code they validate.

All backend code is TypeScript (Express 5 + Node). All frontend code is TypeScript (React 19). Tests use `fast-check` for property-based coverage and `node:assert/strict` / Vitest for example-based coverage, matching the conventions established in Task 0–8.

## Tasks

- [x] 1. Add `helmet` dependency and new test scripts
  - Add `helmet@^8` to `dependencies` in `artifacts/api-server/package.json`.
  - Add `fast-check` to `devDependencies` of `artifacts/mysticism-web/package.json` (backend already has it via catalog pin).
  - Add the following `scripts` entries to `artifacts/api-server/package.json`: `test:mysticism-auth`, `test:trust-proxy-wiring`, `test:security-headers`, `test:message-order`, `test:csrf`, `test:readings-params`, `test:share-cap`, `test:logger-redact`, `test:public-config`, `test:param-validators`.
  - Add `test:result-actions` and `test:escape-html` scripts to `artifacts/mysticism-web/package.json`.
  - Add a top-level `test:audit-remediation` script to the root `package.json` that runs every script above in sequence via `pnpm --filter ... run ...`.
  - Run `pnpm install` to lock the new deps.
  - _Requirements: 1.6, 2.2, 3.5, 4.5, 5.5, 6.5, 7.5, 8.6, 9.7, 9.8_

- [x] 2. Create shared helpers
  - [x] 2.1 Implement `parsePositiveIntParam` helper
    - Create `artifacts/api-server/src/lib/param-validators.ts` exporting `parsePositiveIntParam(raw: unknown): number | null`.
    - Accept only strings matching `/^[1-9]\d*$/` that satisfy `Number.isSafeInteger` after `Number(...)`; return `null` for everything else (empty string, negative, decimal, leading zero, `NaN`, `Infinity`, non-strings).
    - _Requirements: 7.3, 7.4_

  - [x] 2.2 Write property test for `parsePositiveIntParam`
    - Create `artifacts/api-server/src/lib/param-validators.test.ts`.
    - Tag file header: `// Feature: post-opus-audit-remediation, Property 3: parsePositiveIntParam matches its predicate`.
    - Use `fast-check` with `numRuns: 100`: sample arbitrary strings and non-string values, assert `parsePositiveIntParam(raw)` equals `Number(raw)` when `raw` is a string matching the positive-integer predicate and within safe range, and equals `null` otherwise.
    - **Property 3: parsePositiveIntParam matches its predicate**
    - **Validates: Requirements 7.1**

  - [x] 2.3 Implement `escapeHtml` helper (frontend)
    - Create `artifacts/mysticism-web/src/lib/escape-html.ts` exporting `escapeHtml(input: string): string`.
    - Escape `&`, `<`, `>`, `"`, `'` in that order to the standard named / numeric entities.
    - _Requirements: 3.1, 3.4_

  - [x] 2.4 Write property test for `escapeHtml`
    - Create `artifacts/mysticism-web/src/lib/escape-html.test.ts`.
    - Tag file header: `// Feature: post-opus-audit-remediation, Property 1: escapeHtml encoding correctness`.
    - Use `fast-check` with `numRuns: 100`: for any string `s`, assert `escapeHtml(s)` contains no raw `<`, `>`, `"`, `'` and that any `&` is immediately followed by a recognized entity name or numeric reference. Assert round-trip decoding reproduces `s`.
    - **Property 1: escapeHtml encoding correctness**
    - **Validates: Requirements 3.1**

- [x] 3. Gate `AI_Interpret_Endpoint` with Clerk (C1)
  - [x] 3.1 Mount `requireClerkUser` on `/mysticism/ai-interpret`
    - In `artifacts/api-server/src/routes/mysticism/index.ts`, import `requireClerkUser` from `../../lib/clerk-user` and add `router.use("/mysticism/ai-interpret", requireClerkUser)` before the existing route handler.
    - Do not create a new middleware; do not touch the rate-limit bucket `ai-interpret`.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 3.2 Write integration test for mysticism Clerk gate
    - Create `artifacts/api-server/src/routes/mysticism/ai-interpret-auth.test.ts` executed by the `test:mysticism-auth` script.
    - Cover three cases: (a) no Clerk session → 401 and provider is never called, (b) mocked Clerk session → handler reaches provider and sets `req.userId`, (c) rate-limit bucket still fires after auth success.
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 1.6_

- [x] 4. Wire `TRUST_PROXY` into docker-compose and docs (C2)
  - [x] 4.1 Set `TRUST_PROXY` env in compose
    - Edit `docker-compose.yml` to add `TRUST_PROXY: ${TRUST_PROXY:-loopback,linklocal,uniquelocal}` under the `api` service `environment:` block.
    - Add an inline comment explaining rationale and overrides (CDN, direct-exposed), per design §2.
    - _Requirements: 2.1_

  - [x] 4.2 Add startup warning when `TRUST_PROXY` is unset
    - In `artifacts/api-server/src/app.ts`, after CORS allow-list logging, add a `logger.warn(...)` call when `process.env.TRUST_PROXY` is falsy; wording per design §2.
    - _Requirements: 2.7_

  - [x] 4.3 Verify `.env.example` and nginx forwarding
    - Confirm `.env.example` already documents `TRUST_PROXY` (verify text, add a comment only if missing — do not introduce a new variable).
    - Confirm `docker/nginx.conf` sets `X-Forwarded-For` via `$proxy_add_x_forwarded_for` and `X-Real-IP` via `$remote_addr`. If either is missing, add the `proxy_set_header` line. Otherwise leave unchanged.
    - _Requirements: 2.3, 2.6_

  - [x] 4.4 Document `TRUST_PROXY` in DEPLOY.md and README.md
    - Add a "Why `TRUST_PROXY` is required with the default compose" subsection to `DEPLOY.md` with three topologies: docker-compose default, direct-exposed, CDN (hop-count). Include the warning about misconfiguration.
    - Add a one-line cross-reference in `README.md` Deployment / Docker section pointing to the new DEPLOY.md subsection.
    - _Requirements: 2.4, 2.5_

  - [x] 4.5 Write trust-proxy wiring integration test
    - Create `artifacts/api-server/src/lib/trust-proxy-wiring.test.ts` executed by `test:trust-proxy-wiring`.
    - Boot a test Express app with `app.set("trust proxy", "loopback, linklocal, uniquelocal")`, send a request from `127.0.0.1` with `X-Forwarded-For: 203.0.113.7`, assert `getClientIP(req) === "203.0.113.7"`.
    - _Requirements: 2.2_

- [x] 5. Fix `handlePrint` XSS + tabnabbing (H1)
  - [x] 5.1 Rewrite `handlePrint` to use DOM APIs and null the opener
    - In `artifacts/mysticism-web/src/components/result-actions.tsx`, replace the `document.write` template with imperative DOM construction (`createElement` + `textContent`) using `escapeHtml` only where DOM API is unavailable (e.g. `<title>` fallback).
    - Call `window.open("", "_blank")` then immediately set `printWindow.opener = null` before building the DOM.
    - Remove any remaining `dangerouslySetInnerHTML` / `innerHTML =` usages in the print flow.
    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 5.2 Write property test for `handlePrint`
    - Create `artifacts/mysticism-web/src/components/result-actions.test.ts` executed by `test:result-actions`.
    - Tag file header: `// Feature: post-opus-audit-remediation, Property 2: handlePrint does not materialize user-supplied elements`.
    - Use `fast-check` with `numRuns: 100`: generate arbitrary strings (including HTML-injection payloads, script tags, attribute breakouts, unicode/emoji). Stub `window.open` to return a mock with a `document` and `opener` accessor. Render `ResultActions`, click Print, then assert the mock document contains no element whose tagName was introduced by the title/moduleName/result, and `mockWindow.opener === null`.
    - **Property 2: handlePrint does not materialize user-supplied elements**
    - **Validates: Requirements 3.1, 3.5**

- [x] 6. Add security response headers via helmet (H2)
  - [x] 6.1 Mount helmet with CSP and HSTS in `app.ts`
    - In `artifacts/api-server/src/app.ts`, import `helmet` and mount it before `cors` with the directives listed in design §4 (default-src, script-src, connect-src, img-src, style-src, font-src, frame-src, frame-ancestors, object-src, base-uri, form-action).
    - Enable `hsts: { maxAge: 15_552_000, includeSubDomains: true }` and `referrerPolicy: { policy: "strict-origin-when-cross-origin" }`.
    - Set `crossOriginEmbedderPolicy: false` and `crossOriginResourcePolicy: { policy: "cross-origin" }` to avoid breaking SSE and third-party AI endpoints.
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

  - [x] 6.2 Write integration test for security headers
    - Create `artifacts/api-server/src/lib/security-headers.test.ts` executed by `test:security-headers`.
    - Boot the app, issue `GET /api/healthz`, assert the response carries `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a `Content-Security-Policy` that contains the required directives.
    - _Requirements: 4.2, 4.5_

- [x] 7. Reorder rate-limit before user-message insert (H3)
  - [x] 7.1 Move resolution + rate-limit check above `db.insert` in conversations route
    - In `artifacts/api-server/src/routes/openai/index.ts` handler for `POST /conversations/:id/messages`, move the provider/key/model resolution and `checkAndLogUsage` call to run before `db.insert(messagesTable, { role: "user", ... })`.
    - When `usingServerKey && !rl.allowed`, return HTTP 429 JSON `{ error: "Rate limit exceeded", limitPerHour, limitPerDay }` before any SSE headers are set and before any DB insert.
    - Keep ownership check `and(eq(id...), eq(userId...))` and existing provider streaming / assistant insert path untouched.
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6_

  - [x] 7.2 Write property test for messages-table invariant on rate-limit denial
    - Create `artifacts/api-server/src/routes/openai/message-order.test.ts` executed by `test:message-order`.
    - Tag file header: `// Feature: post-opus-audit-remediation, Property 4: Rate-limit denial preserves the messages-table invariant`.
    - Use `fast-check` with `numRuns: 100`: generate arbitrary authenticated bodies. Mock `checkAndLogUsage` to return `{ allowed: false }`. Snapshot `messages` row count for the conversation, post the request, assert response 429 and unchanged row count.
    - **Property 4: Rate-limit denial preserves the messages-table invariant**
    - **Validates: Requirements 5.1, 5.2, 5.5**

- [x] 8. Checkpoint — C1/C2/H1/H2/H3 landed
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Add CSRF / Origin defense-in-depth (M1)
  - [x] 9.1 Implement `originGuard` middleware
    - Create `artifacts/api-server/src/lib/origin-guard.ts` exporting an Express `RequestHandler` per design §6.
    - Bypass set: `GET` and OPTIONS, plus `POST/PATCH/PUT/DELETE` to `/api/healthz` and `/api/config/public`.
    - For state-changing requests: if `Origin` is present, delegate to `isOriginAllowed(origin, getAllowedOrigins())`; if absent but `Referer` is present, parse its origin and delegate; otherwise respond 403.
    - Reuse `getAllowedOrigins` and `isOriginAllowed` from `./cors-config`; do not modify `cors-config.ts`.
    - _Requirements: 6.1, 6.2, 6.6_

  - [x] 9.2 Mount `originGuard` and remove urlencoded parser in `app.ts`
    - In `artifacts/api-server/src/app.ts`, mount `originGuard` on `/api` after the CORS middleware and before `express.json(...)`.
    - Remove the `app.use(express.urlencoded(...))` line since no route consumes urlencoded bodies (belt-and-suspenders per design §6).
    - _Requirements: 6.3, 6.4_

  - [x] 9.3 Write property test for `originGuard`
    - Create `artifacts/api-server/src/lib/origin-guard.test.ts` executed by `test:csrf`.
    - Tag file header: `// Feature: post-opus-audit-remediation, Property 5: originGuard rejects disallowed state-changing requests`.
    - Use `fast-check` with `numRuns: 100`: generate arbitrary method, path (including bypass paths), and (origin, referer) pairs. Assert: for state-changing methods with non-bypass paths and both headers missing or mismatched, the guard sends 403 and never calls `next`; for allow-listed origins/referers, it calls `next` and sends no response.
    - **Property 5: originGuard rejects disallowed state-changing requests**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

- [x] 10. Validate numeric `:id` for readings (M2)
  - [x] 10.1 Apply `parsePositiveIntParam` in readings routes
    - In `artifacts/api-server/src/routes/readings.ts`, import `parsePositiveIntParam` and use it at the top of each handler for `PATCH /readings/:id`, `DELETE /readings/:id`, and `POST /readings/:id/share`. Return `400 { error: "Invalid reading id" }` when the helper returns `null`; do not touch the DB.
    - Pass the parsed number (not the raw string) into existing queries.
    - Note per design §7: `GET /readings/:id` does not exist today; do not add it. Cover the three existing handlers only.
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 10.2 Write integration test for readings param validation
    - Create `artifacts/api-server/src/routes/readings-params.test.ts` executed by `test:readings-params`.
    - Cover: `DELETE /readings/abc` → 400 (no row deleted), `DELETE /readings/-1` → 400, `PATCH /readings/12.5` → 400, `POST /readings/99999999/share` where id is valid but absent → 404 (or existing "not found" behavior), `DELETE /readings/xyz` → 400.
    - _Requirements: 7.2, 7.5_

- [x] 11. Dedupe share-token creation with advisory lock (M3)
  - [x] 11.1 Add idempotent partial index migration
    - Edit `artifacts/api-server/src/lib/migrate.ts` to include `CREATE INDEX IF NOT EXISTS idx_share_tokens_reading_active ON share_tokens(reading_id, expires_at DESC) WHERE expires_at IS NOT NULL;`.
    - _Requirements: 8.7_

  - [x] 11.2 Implement dedupe logic inside `POST /readings/:id/share`
    - In `artifacts/api-server/src/routes/readings.ts`, wrap the share logic in a DB transaction: call `SELECT pg_advisory_xact_lock(hashtext($reading_id_text))`, then `SELECT token, expires_at FROM share_tokens WHERE reading_id = $1 AND expires_at > NOW() ORDER BY expires_at DESC LIMIT 1`.
    - If a row exists, commit and return that `{ token, expiresAt }` with the same response shape as the create path.
    - If none exists, generate a token, insert it with a 30-day `expires_at`, commit, and return.
    - Keep the existing ownership check (`reading.user_id === req.userId`) before the transaction.
    - _Requirements: 8.1, 8.3, 8.4, 8.5_

  - [x] 11.3 Write property test for share-token dedupe concurrency
    - Create `artifacts/api-server/src/routes/readings/share-dedupe.test.ts` executed by `test:share-cap`.
    - Tag file header: `// Feature: post-opus-audit-remediation, Property 6: Share-token dedupe concurrency invariant`.
    - Use `fast-check` with `numRuns: 50`: generate `k ∈ [1..20]` concurrent share calls for the same owned reading; assert `SELECT COUNT(*) FROM share_tokens WHERE reading_id = $1 AND expires_at > NOW()` equals exactly 1 after all calls resolve. Also assert unauthorized readings return 403/404 (ownership preserved).
    - **Property 6: Share-token dedupe concurrency invariant**
    - **Validates: Requirements 8.1, 8.3, 8.5, 8.6**

- [x] 12. Checkpoint — M1/M2/M3 landed
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Strip `adminConfigured` from public config for non-admins (L3)
  - [x] 13.1 Make `adminConfigured` admin-gated in config route
    - In `artifacts/api-server/src/routes/config/index.ts` handler `GET /config/public`, build the response object without `adminConfigured`, then, in a try/catch, if `getAuth(req).userId` is present and `clerkClient.users.getUser(...)` returns `publicMetadata` satisfying `hasAdminRole(...)`, attach `adminConfigured: !!(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY)`.
    - Swallow any Clerk lookup error — omit the field silently.
    - _Requirements: 9.1, 9.2, 9.3_

  - [x] 13.2 Update OpenAPI schema for `/config/public`
    - In `lib/api-spec/openapi.yaml`, add (or update) the `/config/public` GET path with a `PublicConfig` schema where `adminConfigured` is `nullable: true` and not `required`.
    - Regenerate any auto-generated TS types if the repo pipeline requires it.
    - _Requirements: 9.4_

  - [x] 13.3 Relax frontend type for `adminConfigured`
    - In `artifacts/mysticism-web/src/contexts/ai-settings.tsx`, change the type to `adminConfigured?: boolean`, defaulting to `false` when absent. No UI logic change beyond the optional field.
    - _Requirements: 9.4_

  - [x] 13.4 Write integration test for public config gating
    - Create `artifacts/api-server/src/routes/config/public-config.test.ts` executed by `test:public-config`.
    - Cover: anonymous `GET /api/config/public` → JSON without key `adminConfigured`; admin session (mocked `publicMetadata.role === "admin"`) → JSON with key `adminConfigured`.
    - _Requirements: 9.8_

- [x] 14. Expand pino redact list (L7)
  - [x] 14.1 Add sensitive headers to redact paths
    - In `artifacts/api-server/src/lib/logger.ts`, extend `redact.paths` to include `req.headers["x-ai-key"]`, `req.headers["x-clerk-secret-key"]`, `req.headers["clerk-proxy-url"]`, and `req.headers["x-clerk-auth-token"]`. Keep existing entries (`authorization`, `cookie`, `set-cookie`).
    - Keep `censor: "[Redacted]"`.
    - _Requirements: 9.5, 9.6_

  - [x] 14.2 Write property test for redaction
    - Create `artifacts/api-server/src/lib/logger-redact.test.ts` executed by `test:logger-redact`.
    - Tag file header: `// Feature: post-opus-audit-remediation, Property 7: Sensitive request header values are redacted in logs`.
    - Use `fast-check` with `numRuns: 100`: pick `h ∈ {authorization, cookie, x-ai-key, x-clerk-secret-key, clerk-proxy-url, x-clerk-auth-token}` and an arbitrary non-empty string `v`; capture log output for a request carrying `h: v`; assert the serialized line does not contain `v` and contains `[Redacted]`.
    - **Property 7: Sensitive request header values are redacted in logs**
    - **Validates: Requirements 9.5, 9.6, 9.7**

- [x] 15. Final checkpoint — all findings remediated
  - Ensure every test in `test:audit-remediation` passes on a clean `pnpm install && pnpm -r typecheck && pnpm -r build` run.
  - Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test tasks. They can be skipped for a faster MVP, but every property test references a specific property in `design.md` so they are the primary correctness guarantee for this spec.
- Top-level tasks (without `*`) are the core remediation surface; each references the specific requirements clauses it addresses for traceability.
- Checkpoints appear after each severity band (CRITICAL+HIGH, MEDIUM, LOW) so regressions surface before moving on.
- Property-based tests sit adjacent to the code they validate; `fast-check` is already available on the backend and is added to the frontend devDependencies in Task 1.
- The plan honors Non-Goals from `requirements.md`: no changes to rate-limit algorithm, SSE parser, CORS middleware, markdown renderer, admin auth strategy, or core schemas (only an idempotent partial index on `share_tokens`).
- No task runs the app manually, deploys, or measures production metrics — all verification is automated tests or static grep checks documented in `design.md` §Testing Strategy.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2.1", "2.3", "4.1", "4.3", "4.4", "9.1", "11.1", "13.2"] },
    { "id": 1, "tasks": ["2.2", "2.4", "3.1", "4.2", "4.5", "9.3", "10.1", "13.3", "14.1"] },
    { "id": 2, "tasks": ["3.2", "5.1", "6.1", "7.1", "10.2", "11.2", "13.1", "14.2"] },
    { "id": 3, "tasks": ["5.2", "6.2", "7.2", "9.2", "11.3", "13.4"] }
  ]
}
```
