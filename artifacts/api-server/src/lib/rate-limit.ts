import { pool } from "@workspace/db";
import { getConfig } from "./server-config";

export interface RateLimitResult {
  allowed: boolean;
  remainingHour: number;
  remainingDay: number;
  limitPerHour: number;
  limitPerDay: number;
}

/**
 * Atomically check the hour/day usage counters for `ip` and, if within limits,
 * record a new usage row in the same transaction.
 *
 * Previously this was a SELECT COUNT + INSERT pair with app logic in between,
 * which let two concurrent requests from the same IP both see `count < limit`
 * and both insert — allowing limit bypass under load.
 *
 * The hardened version:
 *   1. Opens a transaction.
 *   2. Takes `pg_advisory_xact_lock(hashtext(ip))` so requests from the same IP
 *      serialize at the DB level. Different IPs still run in parallel.
 *   3. Counts hour + day windows and conditionally inserts — all in one CTE —
 *      so the decision to allow and the logged row are committed together.
 *
 * The lock is released automatically at COMMIT/ROLLBACK.
 */
export async function checkAndLogUsage(ip: string): Promise<RateLimitResult> {
  const [limitPerHourStr, limitPerDayStr] = await Promise.all([
    getConfig("rate_limit_per_hour"),
    getConfig("rate_limit_per_day"),
  ]);

  const limitPerHour = parseInt(limitPerHourStr ?? "20", 10);
  const limitPerDay = parseInt(limitPerDayStr ?? "100", 10);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [ip]);

    const { rows } = await client.query(
      `WITH h AS (
         SELECT COUNT(*)::int AS c FROM usage_log
         WHERE ip = $1 AND created_at > NOW() - INTERVAL '1 hour'
       ),
       d AS (
         SELECT COUNT(*)::int AS c FROM usage_log
         WHERE ip = $1 AND created_at > NOW() - INTERVAL '1 day'
       ),
       ins AS (
         INSERT INTO usage_log (ip)
         SELECT $1
         WHERE (SELECT c FROM h) < $2
           AND (SELECT c FROM d) < $3
         RETURNING 1
       )
       SELECT
         (SELECT c FROM h)          AS count_hour,
         (SELECT c FROM d)          AS count_day,
         EXISTS (SELECT 1 FROM ins) AS inserted`,
      [ip, limitPerHour, limitPerDay],
    );

    await client.query("COMMIT");

    const countHour = rows[0].count_hour as number;
    const countDay = rows[0].count_day as number;
    const inserted = rows[0].inserted as boolean;

    return {
      allowed: inserted,
      remainingHour: Math.max(0, limitPerHour - countHour - (inserted ? 1 : 0)),
      remainingDay: Math.max(0, limitPerDay - countDay - (inserted ? 1 : 0)),
      limitPerHour,
      limitPerDay,
    };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Resolve the client IP for rate limiting.
 *
 * Returns Express's `req.ip`, which is driven by the app-level `trust proxy`
 * setting:
 *
 *   - When `trust proxy` is not set (default), Express returns the TCP socket
 *     remote address. Clients cannot spoof this by setting a header.
 *   - When configured for the deployment's actual proxy (e.g. "loopback" for a
 *     local nginx, or a specific CIDR), Express returns the left-most entry in
 *     `X-Forwarded-For` that is *not* itself a trusted proxy — which is the
 *     genuine client IP.
 *
 * The previous implementation read `X-Forwarded-For` directly and unconditionally,
 * so any client could set the header and rotate IPs to bypass limits.
 */
export function getClientIP(req: import("express").Request): string {
  return req.ip ?? req.socket?.remoteAddress ?? "unknown";
}
