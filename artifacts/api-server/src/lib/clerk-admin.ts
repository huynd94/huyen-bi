import { clerkClient, getAuth } from "@clerk/express";
import type { NextFunction, Request, Response } from "express";

type PublicMetadata = Record<string, unknown> | null | undefined;

export function hasAdminRole(publicMetadata: PublicMetadata): boolean {
  return publicMetadata?.role === "admin";
}

export async function requireClerkAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);

  if (!auth.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const user = await clerkClient.users.getUser(auth.userId);

  if (!hasAdminRole(user.publicMetadata)) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  next();
}
