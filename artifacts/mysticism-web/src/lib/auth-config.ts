// Support both Vite (import.meta.env) and Node.js/tsx test runtime (process.env)
export const isClerkEnabled = Boolean(
  import.meta.env?.VITE_CLERK_PUBLISHABLE_KEY ??
    (typeof process !== "undefined" && process.env?.VITE_CLERK_PUBLISHABLE_KEY),
);
