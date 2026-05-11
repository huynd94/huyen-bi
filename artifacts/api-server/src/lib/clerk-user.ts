import { getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

export type AuthenticatedRequest = Request & { userId: string };

type GetAuthFn = (req: Request) => { userId?: string | null } | null | undefined;

// Test seam: swap in a fake `getAuth` to verify behavior without registering
// the real Clerk middleware.
let _getAuth: GetAuthFn = getAuth;

export function __setGetAuthForTests(fn: GetAuthFn | null): void {
  _getAuth = fn ?? getAuth;
}

/**
 * Express middleware that rejects requests without a signed-in Clerk user and
 * attaches the resolved `userId` to the request so downstream handlers can
 * scope queries by ownership.
 */
export function requireClerkUser(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const auth = _getAuth(req);
  if (!auth?.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as unknown as AuthenticatedRequest).userId = auth.userId;
  next();
}
