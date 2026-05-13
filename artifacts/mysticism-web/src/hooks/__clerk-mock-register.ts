/**
 * Register the Clerk mock loader hook.
 * Also sets VITE_CLERK_PUBLISHABLE_KEY in process.env so that auth-config.ts
 * resolves isClerkEnabled = true in the tsx runtime.
 * Usage: tsx --import ./src/hooks/__clerk-mock-register.ts <test-file>
 */
import { register } from "node:module";

// Ensure isClerkEnabled resolves to true in Node.js/tsx runtime
process.env.VITE_CLERK_PUBLISHABLE_KEY = "pk_test_exploration_mock";

register(
  new URL("./__clerk-mock-loader.ts", import.meta.url).href,
  import.meta.url,
);
