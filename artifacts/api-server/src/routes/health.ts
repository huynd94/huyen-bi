import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  const dbUrl = process.env.DATABASE_URL;
  let dbOk = false;
  let dbError: string | null = null;

  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    dbOk = true;
  } catch (err: any) {
    dbError = err.message ?? "unknown";
  }

  const status = dbOk ? "ok" : "degraded";

  res.status(dbOk ? 200 : 503).json({
    status,
    db: dbOk ? "connected" : "error",
    dbError: dbError ?? undefined,
    dbConfigured: !!dbUrl,
    nodeEnv: process.env.NODE_ENV,
    clerkSecretKey: !!process.env.CLERK_SECRET_KEY,
    clerkPublishableKey: !!process.env.CLERK_PUBLISHABLE_KEY,
  });
});

export default router;
