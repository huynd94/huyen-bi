/**
 * Per-page smoke tests for all 7 AI pages — unauthenticated short-circuit.
 *
 * **Validates: Requirements 2.1, 2.3, 2.4, 2.5**
 *
 * Bug_Condition: `isBugCondition(input)` across all 7 pages.
 * Expected_Behavior: same friendly prompt appears on every page; no per-page divergence.
 * Preservation: loading state does not trigger short-circuit (req 3.1).
 *
 * This is a black-box smoke test around the shared hook wiring. It does NOT
 * modify any of the 7 AI page files — it exercises `useAISSEChat` directly
 * with each page's real `type` argument.
 *
 * Run with:
 *   tsx --import ./src/hooks/__clerk-mock-register.ts src/pages/ai-unauth-smoke.test.ts
 *
 * The `__clerk-mock-register.ts` loader mocks `@clerk/react` useUser to
 * return `{ isSignedIn: false, isLoaded: true }` and sets
 * VITE_CLERK_PUBLISHABLE_KEY so `isClerkEnabled` resolves to true.
 */

import assert from "node:assert/strict";
import fc from "fast-check";
import React from "react";
import { useAISSEChat } from "@/hooks/use-ai-sse-chat";
import { UNAUTHENTICATED_AI_MESSAGE } from "@/lib/ai-auth-messages";

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

// ---- Fetch spy -----------------------------------------------------------

interface FetchCall {
  url: string;
  init: RequestInit | undefined;
}

function installFetchSpy(): { calls: FetchCall[]; restore: () => void } {
  const calls: FetchCall[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (
    url: string | URL | Request,
    init?: RequestInit,
  ) => {
    calls.push({ url: String(url), init });
    // Return a minimal SSE response so the hook exits cleanly if fetch fires
    return new Response("data: [DONE]\n\n", {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
  }) as typeof fetch;
  return {
    calls,
    restore() {
      globalThis.fetch = original;
    },
  };
}

// ---- Constants -----------------------------------------------------------

const AI_PAGE_TYPES = [
  "than-so-hoc",
  "bat-tu",
  "xem-ten",
  "xem-que",
  "phong-thuy",
  "cat-hung",
  "tu-vi",
] as const;

// ---- Test: Unauthenticated short-circuit for all 7 pages (PBT) ----------
// For each page type, when isSignedIn === false and isLoaded === true:
//   - The last assistant message contains "đăng nhập" and "/sign-in"
//   - The last assistant message does NOT contain "Lỗi: Unauthorized"
//   - fetch was called zero times (short-circuit path)
async function testUnauthShortCircuit() {
  await fc.assert(
    fc.asyncProperty(
      fc.constantFrom(...AI_PAGE_TYPES),
      async (pageType) => {
        const harness = createHarness();
        const spy = installFetchSpy();
        try {
          const first = harness.run(() => useAISSEChat());
          await first.streamResponse("/api/mysticism/ai-interpret", {
            type: pageType,
            context: `sample-context-for-${pageType}`,
          });

          // Assert fetch was NOT called (short-circuit path)
          assert.equal(
            spy.calls.length,
            0,
            `[${pageType}] fetch must not be called when user is unauthenticated. ` +
              `Got ${spy.calls.length} call(s).`,
          );

          // Read messages after streamResponse completes
          const after = harness.run(() => useAISSEChat());
          const messages = after.messages as { role: string; content: string }[];
          const last = messages[messages.length - 1];

          assert.ok(last, `[${pageType}] expected at least one message`);
          assert.equal(
            last.role,
            "assistant",
            `[${pageType}] last message role should be assistant, got ${last.role}`,
          );

          // Assert friendly prompt content
          assert.ok(
            last.content.includes("đăng nhập"),
            `[${pageType}] message must contain "đăng nhập". Got: ${JSON.stringify(last.content)}`,
          );
          assert.ok(
            last.content.includes("/sign-in"),
            `[${pageType}] message must contain link target "/sign-in". Got: ${JSON.stringify(last.content)}`,
          );
          assert.ok(
            !last.content.includes("Lỗi: Unauthorized"),
            `[${pageType}] message must NOT contain "Lỗi: Unauthorized". Got: ${JSON.stringify(last.content)}`,
          );

          // Verify user message is preserved with the context
          const userMsg = messages[0];
          assert.ok(userMsg, `[${pageType}] expected a user message`);
          assert.equal(
            userMsg.role,
            "user",
            `[${pageType}] first message should be user role`,
          );
          assert.equal(
            userMsg.content,
            `sample-context-for-${pageType}`,
            `[${pageType}] user message content should match body.context`,
          );
        } finally {
          spy.restore();
        }
      },
    ),
    { numRuns: 21 }, // 3 samples per page type on average
  );
}

// ---- Test: No per-page divergence (exact message equality) ---------------
// All 7 pages must produce the exact same UNAUTHENTICATED_AI_MESSAGE constant.
async function testNoDivergence() {
  for (const pageType of AI_PAGE_TYPES) {
    const harness = createHarness();
    const spy = installFetchSpy();
    try {
      const first = harness.run(() => useAISSEChat());
      await first.streamResponse("/api/mysticism/ai-interpret", {
        type: pageType,
        context: "test-context",
      });

      const after = harness.run(() => useAISSEChat());
      const messages = after.messages as { role: string; content: string }[];
      const last = messages[messages.length - 1];

      assert.ok(last, `[${pageType}] expected at least one message`);
      assert.equal(
        last.content,
        UNAUTHENTICATED_AI_MESSAGE,
        `[${pageType}] message must be exactly UNAUTHENTICATED_AI_MESSAGE. ` +
          `Got: ${JSON.stringify(last.content)}`,
      );
    } finally {
      spy.restore();
    }
  }
}

// ---- Runner --------------------------------------------------------------

async function main() {
  await testUnauthShortCircuit();
  await testNoDivergence();
  console.log("ai-unauth-smoke (unauthenticated): ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
