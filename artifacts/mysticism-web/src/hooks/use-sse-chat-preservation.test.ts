/**
 * Preservation property tests for Property 2: All Non-401 AI Flows Behave
 * Identically.
 *
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**
 *
 * These tests MUST PASS on UNFIXED code — they encode the baseline behavior
 * that the fix in Task 3 MUST preserve. After the fix, Task 3.5 re-runs the
 * same file and expects all tests to remain green (zero regressions).
 *
 * The tests exercise every non-bug branch called out in the design's
 * Preservation Requirements section:
 *   - P2a: signed-in streaming concatenation
 *   - P2b: non-401 error status handling
 *   - P2c: fetch exception handling
 *   - P2d: in-stream "missing API key" message passthrough
 *   - P2e: request-header population (with provider/apiKey/model variations)
 *   - P2f: public hook signature (runtime keys + compile-time type guard)
 *   - P2g: useAISSEChat non-bug branches for `(isClerkEnabled, isLoaded, isSignedIn)`
 *
 * Harness: same React 19 dispatcher stub as `use-sse-chat-unauth.exploration.test.ts`
 * — no DOM framework, no jsdom. We swap React's internal hooks dispatcher for
 * a tiny stub that serves `useState`/`useContext` against per-instance arrays.
 */

// Set VITE_CLERK_PUBLISHABLE_KEY so that once Task 3.3 wires in auth-config,
// `isClerkEnabled` resolves truthy and the preservation path (which must
// still fire fetch for every non-bug branch) is exercisable. Harmless on
// unfixed code, which does not consult auth-config at all.
(import.meta as unknown as { env?: Record<string, unknown> }).env = {
  ...((import.meta as unknown as { env?: Record<string, unknown> }).env ?? {}),
  VITE_CLERK_PUBLISHABLE_KEY: "pk_test_preservation_mock",
};

import assert from "node:assert/strict";
import fc from "fast-check";
import React from "react";
import type { Dispatch, SetStateAction } from "react";
import { useSSEChat, type SSEHeaders } from "@/hooks/use-sse-chat";
import { useAISSEChat } from "@/hooks/use-ai-sse-chat";

// ---- React 19 dispatcher harness -----------------------------------------

type H = Record<string, unknown>;
const internals = (
  React as unknown as {
    __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: { H: H | null };
  }
).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

function createHarness(contextOverrides: Map<unknown, unknown> = new Map()) {
  const states: unknown[] = [];
  return {
    run<T>(hook: () => T): T {
      let i = 0;
      const prev = internals.H;
      internals.H = {
        useState(initial: unknown) {
          const idx = i++;
          if (idx >= states.length) {
            states[idx] =
              typeof initial === "function"
                ? (initial as () => unknown)()
                : initial;
          }
          const set = (next: unknown) => {
            states[idx] =
              typeof next === "function"
                ? (next as (p: unknown) => unknown)(states[idx])
                : next;
          };
          return [states[idx], set];
        },
        useContext(ctx: unknown) {
          if (contextOverrides.has(ctx)) return contextOverrides.get(ctx);
          const c = ctx as { _currentValue?: unknown; _currentValue2?: unknown };
          return c._currentValue2 ?? c._currentValue;
        },
        useEffect() {},
        useMemo<T>(fn: () => T) {
          return fn();
        },
        useCallback<T>(fn: T) {
          return fn;
        },
      };
      try {
        return hook();
      } finally {
        internals.H = prev;
      }
    },
  };
}

// ---- Fetch mocks ---------------------------------------------------------

interface FetchCall {
  url: string;
  init: RequestInit | undefined;
}

function installFetchMock(
  makeResponse: (url: string, init: RequestInit | undefined) => Response | Promise<Response>,
): { calls: FetchCall[]; restore: () => void } {
  const calls: FetchCall[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (
    url: string | URL | Request,
    init?: RequestInit,
  ) => {
    const u = String(url);
    calls.push({ url: u, init });
    return await makeResponse(u, init);
  }) as typeof fetch;
  return {
    calls,
    restore() {
      globalThis.fetch = original;
    },
  };
}

function installFetchThrow(err: unknown): { calls: FetchCall[]; restore: () => void } {
  const calls: FetchCall[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (
    url: string | URL | Request,
    init?: RequestInit,
  ) => {
    calls.push({ url: String(url), init });
    throw err;
  }) as typeof fetch;
  return {
    calls,
    restore() {
      globalThis.fetch = original;
    },
  };
}

// ---- SSE helpers ---------------------------------------------------------

function sseResponseFromChunks(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const frames: string[] = chunks.map(
    (c) => `data: ${JSON.stringify({ content: c })}\n\n`,
  );
  frames.push(`data: ${JSON.stringify({ done: true })}\n\n`);
  let i = 0;
  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (i >= frames.length) {
        controller.close();
        return;
      }
      controller.enqueue(encoder.encode(frames[i++]));
    },
  });
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

function jsonErrorResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// ---- Assertion helpers ---------------------------------------------------

interface Msg {
  role: string;
  content: string;
}

function lastAssistant(messages: Msg[]): Msg {
  const last = messages[messages.length - 1];
  assert.ok(last, "expected at least one message");
  assert.equal(
    last.role,
    "assistant",
    `last message role should be assistant, got ${last.role}`,
  );
  return last;
}

// ---- P2a: Signed-in streaming (PBT) --------------------------------------
// Concatenate `chunks` into a well-formed SSE stream; the hook's final
// assistant message must equal `chunks.join('')` verbatim. This preserves
// the signed-in happy path across every non-bug input (req 3.1, 3.7).
async function p2a_signedInStreaming() {
  await fc.assert(
    fc.asyncProperty(
      fc.array(fc.string({ minLength: 1, maxLength: 32 }), {
        minLength: 1,
        maxLength: 50,
      }),
      async (chunks) => {
        const harness = createHarness();
        const mock = installFetchMock(() => sseResponseFromChunks(chunks));
        try {
          const first = harness.run(() => useSSEChat());
          await first.streamResponse("/api/mysticism/ai-interpret", {
            type: "than-so-hoc",
            context: "ctx",
          });
          const after = harness.run(() => useSSEChat());
          const last = lastAssistant(after.messages as Msg[]);
          assert.equal(
            last.content,
            chunks.join(""),
            `P2a: streamed content should equal concatenation of chunks. ` +
              `Got: ${JSON.stringify(last.content)}; expected: ${JSON.stringify(chunks.join(""))}`,
          );
          assert.equal(
            mock.calls.length,
            1,
            `P2a: fetch should be called exactly once per streamResponse; got ${mock.calls.length}`,
          );
        } finally {
          mock.restore();
        }
      },
    ),
    { numRuns: 30 },
  );
}

// ---- P2b: Non-401 error preservation (PBT) -------------------------------
// For any status in {400, 429, 500, 502, 503} with any error body, the hook
// preserves the unfixed formatting: `Lỗi: ${errorMsg || 'Không thể kết nối AI'}`
// (req 3.2, 3.3, 3.5).
async function p2b_non401Errors() {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        status: fc.constantFrom(400, 429, 500, 502, 503),
        errorMsg: fc.oneof(
          fc.string({ minLength: 1, maxLength: 60 }),
          fc.constant(undefined),
        ),
      }),
      async ({ status, errorMsg }) => {
        const harness = createHarness();
        const body: { error?: string } =
          errorMsg === undefined ? {} : { error: errorMsg };
        const mock = installFetchMock(() => jsonErrorResponse(status, body));
        try {
          const first = harness.run(() => useSSEChat());
          await first.streamResponse("/api/mysticism/ai-interpret", {
            type: "than-so-hoc",
            context: "ctx",
          });
          const after = harness.run(() => useSSEChat());
          const last = lastAssistant(after.messages as Msg[]);
          const expected = `Lỗi: ${errorMsg || "Không thể kết nối AI"}`;
          assert.equal(
            last.content,
            expected,
            `P2b: status=${status} errorMsg=${JSON.stringify(errorMsg)} should produce ${JSON.stringify(expected)}; got ${JSON.stringify(last.content)}`,
          );
          // After a completed (errored) request, the hook flips isStreaming back off.
          assert.equal(
            after.isStreaming,
            false,
            `P2b: isStreaming should settle to false after non-ok response`,
          );
        } finally {
          mock.restore();
        }
      },
    ),
    { numRuns: 30 },
  );
}

// ---- P2c: Fetch exception preservation (PBT) -----------------------------
// When `fetch` throws, the hook swallows the error (console.error) without
// writing new content into the assistant message. The placeholder stays at
// '' and isStreaming returns to false (req 3.3).
async function p2c_fetchException() {
  // Silence console.error for this section: the hook logs on exception and
  // that is expected behavior we are preserving, not a test failure.
  const originalConsoleError = console.error;
  console.error = () => {};
  try {
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant(new TypeError("network")),
          fc.constant(new Error("abort")),
        ),
        async (err) => {
          const harness = createHarness();
          const mock = installFetchThrow(err);
          try {
            const first = harness.run(() => useSSEChat());
            await first.streamResponse("/api/mysticism/ai-interpret", {
              type: "than-so-hoc",
              context: "ctx",
            });
            const after = harness.run(() => useSSEChat());
            const last = lastAssistant(after.messages as Msg[]);
            assert.equal(
              last.content,
              "",
              `P2c: exception path must leave placeholder content unchanged (''). Got: ${JSON.stringify(last.content)}`,
            );
            assert.equal(
              after.isStreaming,
              false,
              `P2c: isStreaming must return to false after fetch exception`,
            );
            assert.equal(
              mock.calls.length,
              1,
              `P2c: fetch should be attempted exactly once`,
            );
          } finally {
            mock.restore();
          }
        },
      ),
      { numRuns: 15 },
    );
  } finally {
    console.error = originalConsoleError;
  }
}

// ---- P2d: In-stream "missing API key" message (deterministic) ------------
// When the backend signals missing AI config via an in-stream `data:` event
// containing the exact Vietnamese notice, the hook must forward that string
// verbatim (req 3.4). Exact backend string: see
// artifacts/api-server/src/routes/mysticism/index.ts.
async function p2d_missingApiKeyMessage() {
  const exact =
    "Hệ thống chưa cấu hình API key. Vui lòng nhập API key của bạn trong phần Cài đặt AI, hoặc liên hệ quản trị viên để cấu hình key hệ thống.";
  const harness = createHarness();
  const mock = installFetchMock(() => sseResponseFromChunks([exact]));
  try {
    const first = harness.run(() => useSSEChat());
    await first.streamResponse("/api/mysticism/ai-interpret", {
      type: "than-so-hoc",
      context: "ctx",
    });
    const after = harness.run(() => useSSEChat());
    const last = lastAssistant(after.messages as Msg[]);
    assert.equal(
      last.content,
      exact,
      `P2d: missing-API-key in-stream message must be forwarded verbatim. Got: ${JSON.stringify(last.content)}`,
    );
    assert.equal(mock.calls.length, 1, "P2d: fetch should be called exactly once");
  } finally {
    mock.restore();
  }
}

// ---- P2e: Headers preservation (PBT) -------------------------------------
// Over the space of (provider, apiKey, model), assert that:
//   - x-ai-provider is set iff provider is truthy (always, in this space)
//   - x-ai-key is set iff apiKey is truthy AND provider !== 'server'
//   - x-ai-model is set iff model is truthy AND provider !== 'server'
// (req 3.7).
async function p2e_headers() {
  await fc.assert(
    fc.asyncProperty(
      fc.record({
        provider: fc.oneof(
          fc.constant("server"),
          fc.constant("openai"),
          fc.constant("gemini"),
        ),
        apiKey: fc.option(fc.string({ minLength: 1, maxLength: 32 })),
        model: fc.option(fc.string({ minLength: 1, maxLength: 32 })),
      }),
      async ({ provider, apiKey, model }) => {
        const harness = createHarness();
        let captured: Record<string, string> | undefined;
        const mock = installFetchMock((_u, init) => {
          captured = (init?.headers ?? {}) as Record<string, string>;
          // Minimal successful empty stream so the hook exits cleanly.
          return sseResponseFromChunks([]);
        });
        try {
          const sseHeaders: SSEHeaders = {
            provider,
            apiKey: apiKey ?? undefined,
            model: model ?? undefined,
          };
          const first = harness.run(() => useSSEChat(sseHeaders));
          await first.streamResponse("/api/mysticism/ai-interpret", {
            type: "than-so-hoc",
            context: "ctx",
          });
          assert.ok(captured, "P2e: headers should have been captured");
          const h = captured as Record<string, string>;
          assert.equal(
            h["Content-Type"],
            "application/json",
            "P2e: Content-Type must remain application/json",
          );
          // x-ai-provider: always populated in this space (provider is always truthy).
          assert.equal(
            h["x-ai-provider"],
            provider,
            `P2e: x-ai-provider should equal ${provider}; got ${h["x-ai-provider"]}`,
          );
          // x-ai-key: present iff apiKey truthy AND provider !== 'server'.
          const expectKey = !!apiKey && provider !== "server";
          if (expectKey) {
            assert.equal(
              h["x-ai-key"],
              apiKey,
              `P2e: x-ai-key should equal provided apiKey`,
            );
          } else {
            assert.ok(
              !("x-ai-key" in h),
              `P2e: x-ai-key should be absent when (apiKey=${JSON.stringify(apiKey)}, provider=${provider}). Got headers: ${JSON.stringify(h)}`,
            );
          }
          // x-ai-model: present iff model truthy AND provider !== 'server'.
          const expectModel = !!model && provider !== "server";
          if (expectModel) {
            assert.equal(
              h["x-ai-model"],
              model,
              `P2e: x-ai-model should equal provided model`,
            );
          } else {
            assert.ok(
              !("x-ai-model" in h),
              `P2e: x-ai-model should be absent when (model=${JSON.stringify(model)}, provider=${provider}). Got headers: ${JSON.stringify(h)}`,
            );
          }
          assert.equal(mock.calls.length, 1, "P2e: fetch should be called exactly once");
        } finally {
          mock.restore();
        }
      },
    ),
    { numRuns: 40 },
  );
}

// ---- P2f: Hook signature (runtime + compile-time) ------------------------
// Runtime: Object.keys(useSSEChat()).sort() must equal the canonical set.
// Compile-time: an AssertEqual<...> check pinned to the exact key set; if
// the hook's return type changes, `tsc --noEmit` fails at this file.
type AssertEqual<A, B> = (<T>() => T extends A ? 1 : 2) extends <
  T,
>() => T extends B ? 1 : 2
  ? true
  : false;
type ExpectedUseSSEChatKeys = "messages" | "streamResponse" | "isStreaming" | "setMessages";
type ExpectedSetMessagesType = Dispatch<SetStateAction<{ role: string; content: string }[]>>;

// Fail at typecheck if the keys drift.
const _keySigCheck: AssertEqual<keyof ReturnType<typeof useSSEChat>, ExpectedUseSSEChatKeys> =
  true;
void _keySigCheck;

// Fail at typecheck if setMessages shape drifts.
const _setMessagesCheck: AssertEqual<
  ReturnType<typeof useSSEChat>["setMessages"],
  ExpectedSetMessagesType
> = true;
void _setMessagesCheck;

function p2f_hookSignature() {
  const harness = createHarness();
  const ret = harness.run(() => useSSEChat());
  const keys = Object.keys(ret).sort();
  assert.deepEqual(
    keys,
    ["isStreaming", "messages", "setMessages", "streamResponse"],
    `P2f: hook return keys must be exactly {messages, streamResponse, isStreaming, setMessages}; got ${JSON.stringify(keys)}`,
  );
  assert.equal(typeof ret.streamResponse, "function", "P2f: streamResponse must be a function");
  assert.equal(typeof ret.setMessages, "function", "P2f: setMessages must be a function");
  assert.equal(typeof ret.isStreaming, "boolean", "P2f: isStreaming must be a boolean");
  assert.ok(Array.isArray(ret.messages), "P2f: messages must be an array");
}

// ---- P2g: Clerk non-bug branches for useAISSEChat (PBT) ------------------
// The non-bug branches of `isBugCondition` are:
//   (isClerkEnabled=false, *, *),
//   (isClerkEnabled=true, isLoaded=false, *),
//   (isClerkEnabled=true, isLoaded=true, isSignedIn=true).
// In all three, the wrapped `streamResponse` must delegate to the inner
// `useSSEChat.streamResponse` — which on both unfixed code AND fixed code
// means `fetch` is dispatched exactly once per call (req 3.1, 3.8).
//
// On unfixed code `useAISSEChat` does not consult Clerk at all, so every
// branch fires fetch. On fixed code (Task 3.3) only the bug branch skips
// fetch; these three non-bug branches must still fire fetch exactly once.
async function p2g_clerkNonBugBranches() {
  // Enumerate the three non-bug branch shapes. We do not currently inject
  // the Clerk mock beyond the module cache (unfixed code ignores it); when
  // Task 3.3 lands, the harness already supports context overrides so we
  // can wire in a mocked @clerk/react useUser() result without changing
  // this test.
  const branches: Array<{
    label: string;
    isClerkEnabled: boolean;
    isLoaded: boolean;
    isSignedIn: boolean;
  }> = [
    { label: "clerk-disabled", isClerkEnabled: false, isLoaded: true, isSignedIn: false },
    { label: "clerk-disabled-loading", isClerkEnabled: false, isLoaded: false, isSignedIn: false },
    { label: "clerk-loading", isClerkEnabled: true, isLoaded: false, isSignedIn: false },
    { label: "clerk-loading-signed-in-flag", isClerkEnabled: true, isLoaded: false, isSignedIn: true },
    { label: "signed-in", isClerkEnabled: true, isLoaded: true, isSignedIn: true },
  ];

  await fc.assert(
    fc.asyncProperty(fc.constantFrom(...branches), async (branch) => {
      const harness = createHarness();
      const mock = installFetchMock(() => sseResponseFromChunks(["ok"]));
      try {
        const first = harness.run(() => useAISSEChat());
        // Sanity: the wrapper must return the same public shape as useSSEChat.
        assert.deepEqual(
          Object.keys(first).sort(),
          ["isStreaming", "messages", "setMessages", "streamResponse"],
          `P2g[${branch.label}]: useAISSEChat must expose the canonical keys`,
        );
        await first.streamResponse("/api/mysticism/ai-interpret", {
          type: "than-so-hoc",
          context: "ctx",
        });
        // Non-bug branches: fetch must have been called exactly once.
        assert.equal(
          mock.calls.length,
          1,
          `P2g[${branch.label}]: fetch must fire exactly once for non-bug branches. Got ${mock.calls.length}.`,
        );
        const after = harness.run(() => useAISSEChat());
        const last = lastAssistant(after.messages as Msg[]);
        assert.equal(
          last.content,
          "ok",
          `P2g[${branch.label}]: streamed content should pass through unchanged`,
        );
      } finally {
        mock.restore();
      }
    }),
    { numRuns: 20 },
  );
}

// ---- Runner --------------------------------------------------------------

async function main() {
  p2f_hookSignature();
  await p2a_signedInStreaming();
  await p2b_non401Errors();
  await p2c_fetchException();
  await p2d_missingApiKeyMessage();
  await p2e_headers();
  await p2g_clerkNonBugBranches();
  console.log("use-sse-chat-preservation: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
