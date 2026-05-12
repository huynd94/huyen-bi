import type { CorsOptions } from "cors";

/**
 * CORS allow-list configuration.
 *
 * Production default is the canonical app origin (`https://huyenbi.io.vn`).
 * Extra origins can be supplied via the `CORS_ALLOWED_ORIGINS` env var as a
 * comma-separated list (e.g. `https://preview.huyenbi.io.vn,https://huyenbi.com`).
 *
 * Outside of production the helper also allows loopback origins
 * (`localhost`, `127.0.0.1`, `[::1]`) on any port so dev servers can call the
 * API without extra configuration.
 *
 * Same-origin and non-browser requests (no `Origin` header) always pass because
 * they are not subject to the browser's CORS policy.
 */

export const DEFAULT_PRODUCTION_ORIGIN = "https://huyenbi.io.vn";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function getAllowedOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const configured = parseAllowedOrigins(env.CORS_ALLOWED_ORIGINS);
  const defaults = env.NODE_ENV === "production" ? [DEFAULT_PRODUCTION_ORIGIN] : [];
  // Preserve order but drop duplicates so logging/debugging stays predictable.
  return Array.from(new Set([...defaults, ...configured]));
}

export function isOriginAllowed(
  origin: string | undefined,
  allowList: readonly string[],
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  // No Origin header → same-origin navigation or non-browser caller; leave to
  // normal request auth checks rather than forcing a CORS block.
  if (!origin) return true;
  if (allowList.includes(origin)) return true;
  if (env.NODE_ENV !== "production") {
    try {
      const { hostname } = new URL(origin);
      if (LOOPBACK_HOSTS.has(hostname)) return true;
    } catch {
      // invalid URL falls through to deny
    }
  }
  return false;
}

export function buildCorsOptions(env: NodeJS.ProcessEnv = process.env): CorsOptions {
  const allowList = getAllowedOrigins(env);
  return {
    credentials: true,
    origin(origin, callback) {
      if (isOriginAllowed(origin, allowList, env)) {
        callback(null, true);
        return;
      }
      // Signal the cors middleware to omit the ACAO header. The response still
      // reaches the browser, which then blocks the JS read — the safe default.
      callback(null, false);
    },
  };
}
