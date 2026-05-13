/**
 * Register the Clerk mock loader hook for preservation tests.
 * Returns isSignedIn: true so that non-bug branches (P2g) delegate to
 * the inner streamResponse and fetch fires normally.
 *
 * Also sets VITE_CLERK_PUBLISHABLE_KEY in process.env so that auth-config.ts
 * resolves isClerkEnabled = true in the tsx runtime.
 *
 * Usage: tsx --import ./src/hooks/__clerk-mock-preservation-register.ts <test-file>
 */
import { register } from "node:module";

// Ensure isClerkEnabled resolves to true in Node.js/tsx runtime
process.env.VITE_CLERK_PUBLISHABLE_KEY = "pk_test_preservation_mock";

register(
  new URL("./__clerk-mock-preservation-loader.ts", import.meta.url).href,
  import.meta.url,
);
