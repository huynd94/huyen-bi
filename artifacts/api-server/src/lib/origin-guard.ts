import type { NextFunction, Request, Response } from "express";
import { getAllowedOrigins, isOriginAllowed } from "./cors-config";

/**
 * CSRF defense-in-depth via Origin/Referer verification.
 *
 * Runs on state-changing requests (`POST`, `PATCH`, `PUT`, `DELETE`) only.
 * `GET`/`OPTIONS` and a small set of read/bootstrap paths bypass the check so
 * top-level navigations and preflights behave normally.
 *
 * For gated requests:
 *   - If an `Origin` header is present, it must satisfy `isOriginAllowed`.
 *   - Otherwise, if a `Referer` header is present and parses, its `origin`
 *     must satisfy `isOriginAllowed`.
 *   - Otherwise, respond with HTTP 403.
 *
 * Reuses `getAllowedOrigins` and `isOriginAllowed` from `./cors-config`; the
 * CORS allow-list is the single source of truth for which origins may mutate
 * server state.
 */

// Read/bootstrap endpoints that must work for unauthenticated, same-origin,
// top-level requests where the browser may legitimately omit `Origin`.
const BYPASS_PATHS = new Set<string>([
  "/api/healthz",
  "/api/config/public",
]);

const STATE_CHANGING = new Set<string>(["POST", "PATCH", "PUT", "DELETE"]);

export function originGuard(req: Request, res: Response, next: NextFunction): void {
  if (!STATE_CHANGING.has(req.method)) {
    next();
    return;
  }
  if (BYPASS_PATHS.has(req.path)) {
    next();
    return;
  }

  const allowList = getAllowedOrigins();
  const origin = req.header("origin");
  const referer = req.header("referer");

  if (origin) {
    if (isOriginAllowed(origin, allowList)) {
      next();
      return;
    }
    res.status(403).json({ error: "Forbidden origin" });
    return;
  }

  // No Origin header: fall back to Referer.
  if (referer) {
    try {
      const refOrigin = new URL(referer).origin;
      if (isOriginAllowed(refOrigin, allowList)) {
        next();
        return;
      }
    } catch {
      // invalid URL → fall through to deny
    }
  }

  res.status(403).json({ error: "Forbidden: missing or disallowed Origin" });
}
