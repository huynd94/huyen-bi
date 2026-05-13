// Task 3.1: Unit test for UNAUTHENTICATED_AI_MESSAGE constant
//
// Validates: Requirements 2.1, 2.3, 2.4
//
// Asserts:
//   - Contains Vietnamese login keyword "đăng nhập"
//   - Contains markdown link target "/sign-in"
//   - Does NOT contain the raw error string "Unauthorized"
import assert from "node:assert/strict";
import { UNAUTHENTICATED_AI_MESSAGE } from "./ai-auth-messages.js";

// 1. Contains the Vietnamese login keyword
assert.ok(
  UNAUTHENTICATED_AI_MESSAGE.includes("đăng nhập"),
  `Expected message to contain "đăng nhập", got: ${JSON.stringify(UNAUTHENTICATED_AI_MESSAGE)}`,
);

// 2. Contains the sign-in link target
assert.ok(
  UNAUTHENTICATED_AI_MESSAGE.includes("/sign-in"),
  `Expected message to contain "/sign-in", got: ${JSON.stringify(UNAUTHENTICATED_AI_MESSAGE)}`,
);

// 3. Does NOT contain the raw error string
assert.ok(
  !UNAUTHENTICATED_AI_MESSAGE.includes("Unauthorized"),
  `Message must NOT contain "Unauthorized", got: ${JSON.stringify(UNAUTHENTICATED_AI_MESSAGE)}`,
);

console.log("ai-auth-messages: ok");
