/**
 * Register the Clerk mock loader hook for loading-state tests.
 * Returns isLoaded: false so that the short-circuit does NOT fire
 * and the request delegates to useSSEChat (loading state preserved).
 *
 * Also sets VITE_CLERK_PUBLISHABLE_KEY in process.env so that auth-config.ts
 * resolves isClerkEnabled = true in the tsx runtime.
 *
 * Usage: tsx --import ./src/hooks/__clerk-mock-loading-register.ts <test-file>
 */
import { register } from "node:module";

// Ensure isClerkEnabled resolves to true in Node.js/tsx runtime
process.env.VITE_CLERK_PUBLISHABLE_KEY = "pk_test_loading_mock";

register(
  new URL("./__clerk-mock-loading-loader.ts", import.meta.url).href,
  import.meta.url,
);
