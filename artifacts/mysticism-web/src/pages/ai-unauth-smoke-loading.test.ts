/**
 * Per-page smoke tests for all 7 AI pages — loading state preservation.
 *
 * **Validates: Requirements 2.5, 3.1**
 *
 * Preservation: when `isLoaded === false`, the short-circuit must NOT fire.
 * The request delegates to `useSSEChat` normally (fetch fires, streaming
 * proceeds). This ensures the loading state does not prematurely show the
 * unauthenticated message before Clerk has finished loading.
 *
 * Run with:
 *   tsx --import ./src/hooks/__clerk-mock-loading-register.ts src/pages/ai-unauth-smoke-loading.test.ts
 *
 * The `__clerk-mock-loading-register.ts` loader mocks `@clerk/react` useUser
 * to return `{ isSignedIn: undefined, isLoaded: false }` and sets
 * VITE_CLERK_PUBLISHABLE_KEY so `isClerkEnabled` resolves to true.
 */

import assert from "node:assert/strict";
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

// ---- Fetch mock (SSE stream) ---------------------------------------------

interface FetchCall {
  url: string;
  init: RequestInit | undefined;
}

function installFetchMock(
  makeResponse: () => Response,
): { calls: FetchCall[]; restore: () => void } {
  const calls: FetchCall[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (
    url: string | URL | Request,
    init?: RequestInit,
  ) => {
    calls.push({ url: String(url), init });
    return makeResponse();
  }) as typeof fetch;
  return {
    calls,
    restore() {
      globalThis.fetch = original;
    },
  };
}

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

// ---- Test: Loading state does NOT trigger short-circuit ------------------
// When isLoaded === false, the hook must delegate to useSSEChat (fetch fires).
// The message must NOT contain UNAUTHENTICATED_AI_MESSAGE.
async function testLoadingStatePreservation() {
  for (const pageType of AI_PAGE_TYPES) {
    const harness = createHarness();
    const streamContent = `streamed-response-for-${pageType}`;
    const mock = installFetchMock(() => sseResponseFromChunks([streamContent]));
    try {
      const first = harness.run(() => useAISSEChat());
      await first.streamResponse("/api/mysticism/ai-interpret", {
        type: pageType,
        context: `loading-test-${pageType}`,
      });

      // Assert fetch WAS called (no short-circuit when isLoaded === false)
      assert.equal(
        mock.calls.length,
        1,
        `[${pageType}] fetch must be called exactly once when isLoaded === false. ` +
          `Got ${mock.calls.length} call(s).`,
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

      // Assert the message does NOT contain UNAUTHENTICATED_AI_MESSAGE
      assert.ok(
        !last.content.includes(UNAUTHENTICATED_AI_MESSAGE),
        `[${pageType}] message must NOT contain UNAUTHENTICATED_AI_MESSAGE when isLoaded === false. ` +
          `Got: ${JSON.stringify(last.content)}`,
      );

      // Assert the streamed content was passed through normally
      assert.equal(
        last.content,
        streamContent,
        `[${pageType}] message should contain the streamed content. ` +
          `Got: ${JSON.stringify(last.content)}`,
      );
    } finally {
      mock.restore();
    }
  }
}

// ---- Runner --------------------------------------------------------------

async function main() {
  await testLoadingStatePreservation();
  console.log("ai-unauth-smoke-loading (loading state preservation): ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
