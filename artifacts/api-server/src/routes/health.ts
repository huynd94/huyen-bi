import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import { requireClerkAdmin } from "../lib/clerk-admin";

const router: IRouter = Router();

/**
 * Public liveness probe. Returns `{ status: "ok" }` with HTTP 200 whenever the
 * process is able to serve requests. This is enough for platform health checks
 * (Kubernetes, nginx `healthz`, uptime monitors) and deliberately exposes no
 * internal state: previously this endpoint leaked `NODE_ENV`, Clerk key
 * presence booleans, and raw pg driver errors, which is needless reconnaissance
 * surface for an endpoint that is always unauthenticated.
 */
router.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

/**
 * Detailed health report for operators. Requires a Clerk admin claim so the
 * DB error string and config booleans only reach trusted callers. Useful for
 * dashboards and on-call debugging.
 */
router.get("/admin/healthz", requireClerkAdmin, async (_req, res) => {
  let dbOk = false;
  let dbError: string | null = null;

  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
      dbOk = true;
    } finally {
      client.release();
    }
  } catch (err: unknown) {
    dbError = err instanceof Error ? err.message : "unknown";
  }

  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? "ok" : "degraded",
    db: dbOk ? "connected" : "error",
    dbError: dbError ?? undefined,
    dbConfigured: !!process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV,
    clerkSecretKey: !!process.env.CLERK_SECRET_KEY,
    clerkPublishableKey: !!process.env.CLERK_PUBLISHABLE_KEY,
  });
});

export default router;
