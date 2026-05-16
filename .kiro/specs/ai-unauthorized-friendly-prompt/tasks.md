# Implementation Plan

## Overview

Fix the raw `"Lỗi: Unauthorized"` message that appears on all 7 AI pages
(`than-so-hoc`, `bat-tu`, `xem-ten`, `xem-que`, `phong-thuy`, `cat-hung`, `tu-vi`)
when an unauthenticated user clicks an AI-interpret button. The fix lives entirely
in the shared hook layer (`useSSEChat` + `useAISSEChat`) plus one shared message
constant module. No pages and no server code are modified.

**Bug_Condition (from design)**: `isBugCondition(input)` is true when
`action = "invokeAIInterpret"` AND `page ∈ {7 AI pages}` AND
(`session.isSignedIn = false` OR `response.status = 401 AND response.body.error = "Unauthorized"`).

**Expected_Behavior (from design)**: the last assistant message contains the
friendly Vietnamese prompt with a markdown link to `/sign-in` and does NOT contain
the string `"Lỗi: Unauthorized"`. When `isSignedIn === false` is detectable
pre-fetch, no network request is made.

**Preservation (from design)**: for every input where `isBugCondition(input) = false`
(signed-in streaming, non-401 statuses 400/429/5xx, fetch exceptions, in-stream
missing-API-key message, headers, hook signature, server 401 contract), behavior
is byte-identical to the unfixed hook.

## Task Dependency Graph

Tasks 1 and 2 are independent and run in parallel against **unfixed** code.
Task 3 (the fix) depends on both. Tasks 4 and 5 are independent validations that
depend on task 3. Task 6 is the final checkpoint.

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": ["1", "2"],
      "description": "Write exploration + preservation tests against unfixed code"
    },
    {
      "wave": 2,
      "tasks": ["3"],
      "description": "Apply the fix (constant + useSSEChat 401 branch + useAISSEChat short-circuit) and re-run tests 1 and 2"
    },
    {
      "wave": 3,
      "tasks": ["4", "5"],
      "description": "Per-page smoke tests on all 7 AI pages and server-side regression suites"
    },
    {
      "wave": 4,
      "tasks": ["6"],
      "description": "Checkpoint: full client + server test run + typecheck"
    }
  ]
}
```

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Friendly Vietnamese Sign-In Prompt Replaces Raw 401
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the Expected Behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists on both pathways defined in `isBugCondition`
  - **Scoped PBT Approach**: this bug is deterministic, so scope the property to the concrete failing cases below. Use `fast-check` generators only where non-determinism adds signal (e.g., random 401 body shapes, random `type`/`context` across the 7 pages).
  - Create test file `artifacts/mysticism-web/src/hooks/use-sse-chat-unauth.exploration.test.ts` (and optionally `use-ai-sse-chat-unauth.exploration.test.ts` for the short-circuit pathway)
  - Test implementation details from Bug Condition in design (`isBugCondition`):
    - **Case A — server 401 pathway**: mock `globalThis.fetch` to resolve with `new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 })`. Render `useSSEChat()` in a test harness, call `streamResponse("/api/mysticism/ai-interpret", { type: "than-so-hoc", context: "1990-01-01" })`, then assert the last assistant message equals the raw string `"Lỗi: Unauthorized"`.
    - **Case B — client short-circuit pathway**: mock `@clerk/react` `useUser` to return `{ isSignedIn: false, isLoaded: true }`, mock `isClerkEnabled` to `true`, mock `fetch` with a spy, render `useAISSEChat()`, call `streamResponse(...)`, then assert `fetch` was called at least once (unfixed code does not short-circuit).
    - **Case C — alternate 401 body shapes (scoped PBT)**: `fc.record({ errorMsg: fc.string({ minLength: 1, maxLength: 40 }) })` → mock `fetch` to return 401 with `{ error: errorMsg }`; assert the last assistant content equals `` `Lỗi: ${errorMsg}` `` (proves the unfixed branch pipes arbitrary server strings straight into the UI).
    - **Case D — per-page type coverage (scoped PBT)**: `fc.constantFrom("than-so-hoc", "bat-tu", "xem-ten", "xem-que", "phong-thuy", "cat-hung", "tu-vi")` → for each `type`, run Case A and assert `"Lỗi: Unauthorized"` is produced regardless of page.
  - The test assertions should match the Expected Behavior Properties from design when inverted: unfixed code produces the raw string, fixed code must produce `UNAUTHENTICATED_AI_MESSAGE` (Vietnamese prompt + `[đăng nhập](/sign-in)` link, no `"Lỗi: Unauthorized"` substring).
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS for Cases A, B, C, D (this is correct — it proves the bug exists)
  - Document counterexamples found to understand root cause (expected: Case A produces `"Lỗi: Unauthorized"`, Case B fires `fetch` once despite `isSignedIn=false`, Case C shows the raw-string injection generalizes, Case D shows every AI page is affected)
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - All Non-401 AI Flows Behave Identically
  - **IMPORTANT**: Follow observation-first methodology — observe unfixed behavior first, then encode it as properties
  - Create test file `artifacts/mysticism-web/src/hooks/use-sse-chat-preservation.test.ts` (property-based, using `fast-check` already listed in `devDependencies`)
  - Observe behavior on UNFIXED code for non-buggy inputs (`isBugCondition(input) = false`):
    - Signed-in streaming: mock `fetch` → 200 + SSE body; observe `messages[-1].content` equals concatenation of stream chunks
    - Non-401 errors (400/429/500/502/503): mock `fetch` → status + `{ error: errorMsg }`; observe `messages[-1].content === `Lỗi: ${errorMsg}``
    - Fetch exception: mock `fetch` to throw; observe no new error content is written (only `console.error`), `isStreaming` flips back to `false`
    - In-stream missing-API-key message: mock `fetch` → 200 + SSE chunk `"Hệ thống chưa cấu hình API key..."`; observe content is appended verbatim
    - Headers: observe `fetch` was called with `x-ai-provider`, `x-ai-key` (only when `provider !== "server"`), `x-ai-model` (only when `provider !== "server"`)
    - Hook signature: observe `useSSEChat()` returns an object with exactly the keys `{ messages, streamResponse, isStreaming, setMessages }`
  - Write property-based tests capturing observed behavior patterns from **Preservation Requirements** section of design:
    - **P2a — Signed-in streaming (PBT)**: `fc.array(fc.string({ minLength: 1, maxLength: 32 }), { minLength: 1, maxLength: 50 })` of chunks → assert final content equals `chunks.join('')` (req 3.1, 3.7)
    - **P2b — Non-401 error preservation (PBT)**: `fc.record({ status: fc.constantFrom(400, 429, 500, 502, 503), errorMsg: fc.oneof(fc.string({ minLength: 1, maxLength: 60 }), fc.constant(undefined)) })` → assert `messages[-1].content === `Lỗi: ${errorMsg || 'Không thể kết nối AI'}`` (req 3.2, 3.3, 3.5)
    - **P2c — Fetch exception (PBT)**: `fc.oneof(fc.constant(new TypeError('network')), fc.constant(new Error('abort')))` → mock `fetch` to throw; assert `messages[-1].content === ''` (unchanged) and `isStreaming === false` afterwards (req 3.3)
    - **P2d — In-stream missing-API-key message**: single deterministic case with the exact backend string; assert verbatim passthrough (req 3.4)
    - **P2e — Headers preservation (PBT)**: `fc.record({ provider: fc.oneof(fc.constant('server'), fc.constant('openai'), fc.constant('gemini')), apiKey: fc.option(fc.string({ minLength: 1, maxLength: 32 })), model: fc.option(fc.string({ minLength: 1, maxLength: 32 })) })` → assert `fetch` was called with the correct header subset (no `x-ai-key`/`x-ai-model` when `provider === 'server'`) (req 3.7)
    - **P2f — Hook signature**: static assertion that `Object.keys(useSSEChat()).sort()` equals `['isStreaming', 'messages', 'setMessages', 'streamResponse']` and a compile-time structural type guard (req 3.8)
    - **P2g — Clerk loading / absent (non-bug branches for `useAISSEChat`)**: for `(isClerkEnabled, isLoaded, isSignedIn)` ∈ `{ (false, *, *), (true, false, *), (true, true, true) }` → assert the inner `streamResponse` is invoked and `fetch` fires exactly as before (req 3.1, 3.8)
  - Verify tests PASS on UNFIXED code (this is the baseline to preserve)
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 3. Fix for unauthenticated AI prompt (raw "Lỗi: Unauthorized" → friendly Vietnamese prompt)

  - [x] 3.1 Introduce shared `UNAUTHENTICATED_AI_MESSAGE` constant
    - Create new module `artifacts/mysticism-web/src/lib/ai-auth-messages.ts`
    - Export `UNAUTHENTICATED_AI_MESSAGE` as a `const` markdown string containing the Vietnamese prompt and the markdown link `[đăng nhập](/sign-in)` (exact token from design: `Vui lòng [đăng nhập](/sign-in) để nhận luận giải từ AI.`)
    - Do NOT include the substring `"Lỗi: Unauthorized"` anywhere in the module
    - Add a small unit test (or inline assertion in an existing suite) that asserts the constant contains `"đăng nhập"`, contains `"/sign-in"`, and does NOT contain `"Unauthorized"`
    - _Bug_Condition: applies to every input satisfying `isBugCondition(input)` — constant is the replacement payload_
    - _Expected_Behavior: message contains Vietnamese login prompt + markdown link to `/sign-in`, never contains `"Lỗi: Unauthorized"`_
    - _Preservation: new module, no existing behavior touched_
    - _Requirements: 2.1, 2.3, 2.4_

  - [x] 3.2 Branch on `response.status === 401` inside `useSSEChat.streamResponse`
    - In `artifacts/mysticism-web/src/hooks/use-sse-chat.ts`, inside the existing `if (!response.ok)` block, check `response.status === 401` BEFORE the `response.json().catch(...)` call
    - When 401: skip JSON parsing entirely, set `last.content = UNAUTHENTICATED_AI_MESSAGE` (imported from `@/lib/ai-auth-messages`); do NOT read or display `err.error` from the server
    - When non-401: keep the existing `const err = await response.json().catch(() => ({ error: 'Lỗi kết nối' }))` followed by `` last.content = `Lỗi: ${err.error || 'Không thể kết nối AI'}` `` path byte-for-byte
    - The `setMessages` callback pattern (spread `prev`, mutate `last`) stays the same — only the content string changes for the 401 branch
    - Do NOT change: the initial `setMessages` ordering (user then assistant placeholder), the `headers` block (`x-ai-provider` / `x-ai-key` / `x-ai-model`), the `for await (const { data } of readSseStream(...))` loop, the `catch (err) { console.error('SSE Error:', err) }` block, or the returned object shape `{ messages, streamResponse, isStreaming, setMessages }`
    - _Bug_Condition: `isBugCondition(input)` branch B — `response.status = 401 AND response.body.error = "Unauthorized"`_
    - _Expected_Behavior: `messages[-1].content === UNAUTHENTICATED_AI_MESSAGE` (no `"Lỗi: Unauthorized"` substring, contains `/sign-in` markdown link)_
    - _Preservation: non-401 branches, streaming, headers, exception handling, hook signature all unchanged (req 3.1–3.5, 3.7, 3.8)_
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.3 Short-circuit `useAISSEChat` when Clerk reports `isSignedIn === false`
    - In `artifacts/mysticism-web/src/hooks/use-ai-sse-chat.ts`, import `useUser` from `@clerk/react` and `isClerkEnabled` from `@/lib/auth-config`, and `UNAUTHENTICATED_AI_MESSAGE` from `@/lib/ai-auth-messages`
    - Destructure `const { settings, activeKey, activeModel } = useAISettings()` stays as-is
    - Call `useUser()` conditionally (only when `isClerkEnabled` is true) or unconditionally if Clerk provider is always present — follow the pattern used by `save-reading-btn.tsx` or similar existing consumers
    - Destructure `const { messages, streamResponse: innerStreamResponse, isStreaming, setMessages } = useSSEChat(...)` (rename inner to avoid shadowing)
    - Create a new `streamResponse` wrapper function with the same signature `(url: string, body: any) => Promise<void>`:
      - If `isClerkEnabled === true` AND `isLoaded === true` AND `isSignedIn === false`: call `setMessages([{ role: 'user', content: body.context ?? body.content }, { role: 'assistant', content: UNAUTHENTICATED_AI_MESSAGE }])` and return without invoking `innerStreamResponse` and without firing `fetch`
      - Otherwise (`!isClerkEnabled` OR `!isLoaded` OR `isSignedIn === true`): delegate to `innerStreamResponse(url, body)` unchanged
    - Return the exact same object shape `{ messages, streamResponse, isStreaming, setMessages }` — only `streamResponse` is wrapped; `messages`, `isStreaming`, and `setMessages` pass through untouched from `useSSEChat`
    - Do NOT modify any of the 7 AI pages; they already render `messages` through `MarkdownRenderer`, so the `/sign-in` link will render as a clickable anchor automatically
    - _Bug_Condition: `isBugCondition(input)` branch A — `session.isSignedIn = false` with Clerk enabled and loaded_
    - _Expected_Behavior: no `fetch` call, `messages[-1].content === UNAUTHENTICATED_AI_MESSAGE`, user message preserved with `body.context`_
    - _Preservation: `!isClerkEnabled` / `!isLoaded` / `isSignedIn === true` paths unchanged (req 3.1, 3.7, 3.8); hook signature unchanged_
    - _Requirements: 2.1, 2.3, 2.4, 2.5_

  - [x] 3.4 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Friendly Vietnamese Sign-In Prompt Replaces Raw 401
    - **IMPORTANT**: Re-run the SAME test from task 1 — do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1 (all Cases A/B/C/D)
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
      - Case A: `messages[-1].content === UNAUTHENTICATED_AI_MESSAGE`, no `"Lỗi: Unauthorized"` substring
      - Case B: `fetch` call count is `0`; message contains `/sign-in` markdown link
      - Case C: arbitrary 401 body shapes produce the same `UNAUTHENTICATED_AI_MESSAGE`, never the server's `err.error` text
      - Case D: all 7 page `type` values produce the friendly prompt
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.5 Verify preservation tests still pass
    - **Property 2: Preservation** - All Non-401 AI Flows Behave Identically
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run preservation property tests from step 2 (P2a–P2g)
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions) for: signed-in streaming, non-401 error bodies, fetch exceptions, in-stream missing-API-key message, headers, hook signature, and Clerk-loading / Clerk-disabled / signed-in branches of `useAISSEChat`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 3.8_

- [x] 4. Per-page smoke tests for all 7 AI pages
  - Create `artifacts/mysticism-web/src/pages/ai-unauth-smoke.test.ts` (or one file per page if easier)
  - For each `page ∈ { "than-so-hoc", "bat-tu", "xem-ten", "xem-que", "phong-thuy", "cat-hung", "tu-vi" }` (drive with a `fc.constantFrom(...)` or a plain `.forEach` list):
    - Stand up a minimal render harness (or a thin handler-level simulation that invokes `useAISSEChat().streamResponse(...)` with the page's real `type` argument)
    - Mock Clerk `useUser` → `{ isSignedIn: false, isLoaded: true }` and `isClerkEnabled` → `true`
    - Spy on `globalThis.fetch`
    - Trigger the AI action for that page
    - Assert the last assistant message (as rendered markdown, or as raw `messages[-1].content` if a full DOM render is not practical under `tsx`) contains `"đăng nhập"` and the link target `/sign-in`, and does NOT contain `"Lỗi: Unauthorized"`
    - Assert `fetch` was called zero times (short-circuit path)
  - Add one additional case per page where `isLoaded === false` → assert the message does NOT contain `UNAUTHENTICATED_AI_MESSAGE` and the underlying flow still delegates to `useSSEChat` (loading state is preserved)
  - Do NOT modify any of the 7 AI page files — the test is a black-box smoke test around the shared hook wiring
  - _Bug_Condition: `isBugCondition(input)` across all 7 pages_
  - _Expected_Behavior: same friendly prompt appears on every page; no per-page divergence_
  - _Preservation: loading state does not trigger short-circuit (req 3.1)_
  - _Requirements: 2.1, 2.3, 2.4, 2.5_

- [x] 5. Verify existing server tests still pass (server 401 contract regression guard)
  - Run `artifacts/api-server/src/routes/mysticism/ai-interpret-auth.test.ts`
  - Run `artifacts/api-server/src/routes/sse-preservation.test.ts`
  - Do NOT modify server code (`requireClerkUser`, `/api/mysticism/ai-interpret`) — the 401 `{ "error": "Unauthorized" }` contract is load-bearing for the client 401 branch in task 3.2
  - **EXPECTED OUTCOME**: Both suites remain green with zero changes
  - If either fails, the root cause is not in this spec's scope — stop and report rather than modifying server code
  - _Preservation: server 401 contract (req 3.6)_
  - _Requirements: 3.6_

- [x] 6. Checkpoint - Ensure all tests pass
  - Run the full mysticism-web test script set: `test:markdown`, `test:sse`, `test:escape-html`, `test:result-actions`, plus the new exploration / preservation / smoke tests added in tasks 1, 2, and 4
  - Run `typecheck` in `artifacts/mysticism-web` to confirm the hook signature of `useSSEChat` and `useAISSEChat` is unchanged at the type level
  - Run the api-server tests referenced in task 5
  - Ensure all tests pass; ask the user if questions arise
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

## Notes

- **No page edits**: all 7 AI pages (`than-so-hoc.tsx`, `bat-tu.tsx`, `xem-ten.tsx`, `xem-que.tsx`, `phong-thuy.tsx`, `cat-hung.tsx`, `tu-vi.tsx`) already render `messages[*].content` through `MarkdownRenderer`, so the `[đăng nhập](/sign-in)` link inside `UNAUTHENTICATED_AI_MESSAGE` becomes a clickable anchor automatically. Do not touch these files.
- **No server edits**: `requireClerkUser` and `/api/mysticism/ai-interpret` must keep returning `HTTP 401 { "error": "Unauthorized" }` for unauthenticated requests. The existing server tests `ai-interpret-auth.test.ts` and `sse-preservation.test.ts` are the regression guard.
- **Hook signatures stay stable**: both `useSSEChat` and `useAISSEChat` must continue to return `{ messages, streamResponse, isStreaming, setMessages }` with the same types, because there may be callers outside the 7 AI pages (Req 3.8).
- **Testing stack**: `fast-check` is already a devDependency of `@workspace/mysticism-web`. Existing tests run through `tsx` via scripts like `test:markdown` / `test:sse`, so new tests should follow the same `tsx`-runnable pattern (`import assert from "node:assert/strict"`, no DOM-heavy frameworks required) unless a full DOM render is strictly needed for the smoke tests.
- **Determinism**: the exploration test in task 1 is "scoped PBT" — deterministic failing cases with narrow random generators layered on top. This keeps counterexamples reproducible in CI.
- **Two pathways, one message**: tasks 3.2 and 3.3 cover the two disjunction branches of `isBugCondition`. Both must use the same `UNAUTHENTICATED_AI_MESSAGE` constant introduced in 3.1 so users get the same prompt regardless of whether Clerk could short-circuit or the server replied first.
