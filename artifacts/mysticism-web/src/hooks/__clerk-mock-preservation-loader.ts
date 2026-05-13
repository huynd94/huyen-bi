/**
 * Node.js module loader hook that intercepts @clerk/react imports
 * and returns a mock with useUser returning { isSignedIn: true, isLoaded: true }.
 *
 * This is used by the preservation tests (P2g) which test NON-BUG branches
 * where the user IS signed in, so the short-circuit does NOT fire and fetch
 * delegates normally.
 *
 * Usage: tsx --import ./src/hooks/__clerk-mock-preservation-register.ts <test-file>
 */
import { resolve as defaultResolve, load as defaultLoad } from "node:module";

export async function resolve(
  specifier: string,
  context: { parentURL?: string; conditions?: string[] },
  nextResolve: typeof defaultResolve,
) {
  if (specifier === "@clerk/react" || specifier.startsWith("@clerk/react/")) {
    return {
      shortCircuit: true,
      url: "clerk-react-preservation-mock://mock",
    };
  }
  return nextResolve(specifier, context);
}

export async function load(
  url: string,
  context: { format?: string },
  nextLoad: typeof defaultLoad,
) {
  if (url === "clerk-react-preservation-mock://mock") {
    return {
      shortCircuit: true,
      format: "module" as const,
      source: `
        export function useUser() {
          return { isSignedIn: true, isLoaded: true, user: { id: "user_preservation_test" } };
        }
        export function useAuth() {
          return { isSignedIn: true, isLoaded: true, userId: "user_preservation_test" };
        }
        export function useClerk() {
          return {};
        }
        export function ClerkProvider({ children }) {
          return children;
        }
      `,
    };
  }
  return nextLoad(url, context);
}
