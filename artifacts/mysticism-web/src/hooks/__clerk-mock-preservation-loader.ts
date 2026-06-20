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

type ResolveHook = (
  specifier: string,
  context: { parentURL?: string; conditions?: string[] },
) => Promise<{ url: string; shortCircuit?: boolean }>;

type LoadHook = (
  url: string,
  context: { format?: string },
) => Promise<{ format?: string; source?: string | ArrayBuffer | Uint8Array; shortCircuit?: boolean }>;

export async function resolve(
  specifier: string,
  context: { parentURL?: string; conditions?: string[] },
  nextResolve: ResolveHook,
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
  nextLoad: LoadHook,
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
