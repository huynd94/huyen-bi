/**
 * Node.js module loader hook that intercepts @clerk/react imports
 * and returns a mock with useUser returning { isSignedIn: false, isLoaded: true }.
 * 
 * Usage: tsx --import ./src/hooks/__clerk-mock-register.ts <test-file>
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
      url: "clerk-react-mock://mock",
    };
  }
  return nextResolve(specifier, context);
}

export async function load(
  url: string,
  context: { format?: string },
  nextLoad: LoadHook,
) {
  if (url === "clerk-react-mock://mock") {
    return {
      shortCircuit: true,
      format: "module" as const,
      source: `
        export function useUser() {
          return { isSignedIn: false, isLoaded: true, user: null };
        }
        export function useAuth() {
          return { isSignedIn: false, isLoaded: true, userId: null };
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
