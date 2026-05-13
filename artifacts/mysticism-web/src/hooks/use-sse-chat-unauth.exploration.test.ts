/**
 * Bug condition exploration test for Property 1: Friendly Vietnamese
 * Sign-In Prompt Replaces Raw 401.
 *
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 *
 * These tests encode the EXPECTED (post-fix) behavior. They are therefore
 * expected to FAIL on unfixed code — the failures are the counterexamples
 * that confirm the bug exists. After Task 3 applies the fix, the same
 * assertions pass.
 *
 * Covers:
 *   - Case A: server 401 pathway with `{ error: "Unauthorized" }`
 *   - Case C: scoped PBT over arbitrary 401 body error strings
 *   - Case D: scoped PBT over all 7 AI page `type` values
 *
 * Case B (client short-circuit via `useUser`) lives in
 * `use-ai-sse-chat-unauth.exploration.test.ts`.
 *
 * Harness: this project does not have jsdom / testing-library / a React
 * reconciler runner. Instead we swap React 19's internal dispatcher
 * (`__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE.H`) for
 * a lightweight stub that satisfies the only hooks `useSSEChat` uses —
 * `useState` and (via the wrapper in a sibling file) `useContext`. State is
 * persisted per harness instance so a second `run(...)` reads the latest
 * `messages[]` after `streamResponse` resolves.
 */

import assert from "node:assert/strict";
import fc from "fast-check";
import React from "react";
import { useSSEChat } from "@/hooks/use-sse-chat";

// ---- React 19 dispatcher harness -----------------------------------------

type H = Record<string, unknown>;
const internals = (
  React as unknown as {
    __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE: { H: H | null };
  }
).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

function createHarness() {
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
          // Fall back to the context's default value; none of the hooks under
          // test in this file read context, so this is never exercised.
          const c = ctx as { _currentValue?: unknown; _currentValue2?: unknown };
          return c._currentValue2 ?? c._currentValue;
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

// ---- fetch mock ----------------------------------------------------------

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

// ---- Helpers -------------------------------------------------------------

interface AssistantCheck {
  content: string;
}

function lastAssistant(messages: { role: string; content: string }[]): AssistantCheck {
  const last = messages[messages.length - 1];
  assert.ok(last, "expected at least one message");
  assert.equal(last.role, "assistant", `last message role should be assistant, got ${last.role}`);
  return { content: last.content };
}

// The fixed constant is not yet in the tree; we assert against its *shape*
// (Vietnamese prompt + markdown link to /sign-in) rather than an exact match.
function assertFriendlyPrompt(content: string, context: string) {
  assert.ok(
    !content.includes("Lỗi: Unauthorized"),
    `${context}: message must not contain raw "Lỗi: Unauthorized". Got: ${JSON.stringify(content)}`,
  );
  assert.ok(
    content.includes("đăng nhập"),
    `${context}: message must contain the Vietnamese login prompt "đăng nhập". Got: ${JSON.stringify(content)}`,
  );
  assert.ok(
    content.includes("/sign-in"),
    `${context}: message must contain a link to /sign-in. Got: ${JSON.stringify(content)}`,
  );
}

function mock401(body: unknown): () => Response {
  return () =>
    new Response(JSON.stringify(body), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
}

// ---- Case A — server 401 pathway with {error: "Unauthorized"} ------------
// Deterministic. Demonstrates the core bug: `useSSEChat` pipes the raw server
// `err.error` into the assistant message when the server returns 401.
async function caseA() {
  const harness = createHarness();
  const fetchMock = installFetchMock(mock401({ error: "Unauthorized" }));
  try {
    const first = harness.run(() => useSSEChat());
    await first.streamResponse("/api/mysticism/ai-interpret", {
      type: "than-so-hoc",
      context: "1990-01-01",
    });
    const after = harness.run(() => useSSEChat());
    const { content } = lastAssistant(after.messages);
    assertFriendlyPrompt(content, "Case A (than-so-hoc, server 401)");
    assert.equal(
      fetchMock.calls.length,
      1,
      "Case A: sanity — exactly one fetch should have been dispatched",
    );
  } finally {
    fetchMock.restore();
  }
}

// ---- Case C — arbitrary 401 body shapes (scoped PBT) ---------------------
// For any non-empty server error string, the UI must still render the same
// friendly Vietnamese prompt. On unfixed code the raw `errorMsg` flows into
// the UI verbatim.
async function caseC() {
  await fc.assert(
    fc.asyncProperty(
      fc.string({ minLength: 1, maxLength: 40 }),
      async (errorMsg) => {
        const harness = createHarness();
        const fetchMock = installFetchMock(mock401({ error: errorMsg }));
        try {
          const first = harness.run(() => useSSEChat());
          await first.streamResponse("/api/mysticism/ai-interpret", {
            type: "than-so-hoc",
            context: "1990-01-01",
          });
          const after = harness.run(() => useSSEChat());
          const { content } = lastAssistant(after.messages);
          // The fixed UI must never embed the raw server string.
          assert.ok(
            !content.includes(`Lỗi: ${errorMsg}`),
            `Case C: message must not embed the raw server error. Got: ${JSON.stringify(content)}`,
          );
          assert.ok(
            content.includes("đăng nhập"),
            `Case C: message must contain "đăng nhập". Got: ${JSON.stringify(content)}`,
          );
          assert.ok(
            content.includes("/sign-in"),
            `Case C: message must contain "/sign-in". Got: ${JSON.stringify(content)}`,
          );
        } finally {
          fetchMock.restore();
        }
      },
    ),
    { numRuns: 25 },
  );
}

// ---- Case D — per-page type coverage (scoped PBT) ------------------------
// Every AI page funnels through this hook. The bug — and therefore the fix —
// must apply uniformly across all seven `type` values.
const AI_PAGE_TYPES = [
  "than-so-hoc",
  "bat-tu",
  "xem-ten",
  "xem-que",
  "phong-thuy",
  "cat-hung",
  "tu-vi",
] as const;

async function caseD() {
  await fc.assert(
    fc.asyncProperty(
      fc.constantFrom(...AI_PAGE_TYPES),
      async (type) => {
        const harness = createHarness();
        const fetchMock = installFetchMock(mock401({ error: "Unauthorized" }));
        try {
          const first = harness.run(() => useSSEChat());
          await first.streamResponse("/api/mysticism/ai-interpret", {
            type,
            context: "sample-context",
          });
          const after = harness.run(() => useSSEChat());
          const { content } = lastAssistant(after.messages);
          assertFriendlyPrompt(content, `Case D (type=${type})`);
        } finally {
          fetchMock.restore();
        }
      },
    ),
    { numRuns: 21 }, // 3 samples per page type on average
  );
}

// ---- Runner --------------------------------------------------------------

async function main() {
  await caseA();
  await caseC();
  await caseD();
  console.log("use-sse-chat-unauth.exploration: ok");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
