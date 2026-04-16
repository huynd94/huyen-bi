import { pool } from "@workspace/db";
import { getConfig } from "./server-config";

export interface RateLimitResult {
  allowed: boolean;
  remainingHour: number;
  remainingDay: number;
  limitPerHour: number;
  limitPerDay: number;
}

export async function checkAndLogUsage(ip: string): Promise<RateLimitResult> {
  const [limitPerHourStr, limitPerDayStr] = await Promise.all([
    getConfig("rate_limit_per_hour"),
    getConfig("rate_limit_per_day"),
  ]);

  const limitPerHour = parseInt(limitPerHourStr ?? "20", 10);
  const limitPerDay = parseInt(limitPerDayStr ?? "100", 10);

  const client = await pool.connect();
  try {
    const [hourRes, dayRes] = await Promise.all([
      client.query(
        "SELECT COUNT(*) FROM usage_log WHERE ip = $1 AND created_at > NOW() - INTERVAL '1 hour'",
        [ip],
      ),
      client.query(
        "SELECT COUNT(*) FROM usage_log WHERE ip = $1 AND created_at > NOW() - INTERVAL '1 day'",
        [ip],
      ),
    ]);

    const countHour = parseInt(hourRes.rows[0].count, 10);
    const countDay = parseInt(dayRes.rows[0].count, 10);
    const allowed = countHour < limitPerHour && countDay < limitPerDay;

    if (allowed) {
      await client.query("INSERT INTO usage_log (ip) VALUES ($1)", [ip]);
    }

    return {
      allowed,
      remainingHour: Math.max(0, limitPerHour - countHour - (allowed ? 1 : 0)),
      remainingDay: Math.max(0, limitPerDay - countDay - (allowed ? 1 : 0)),
      limitPerHour,
      limitPerDay,
    };
  } finally {
    client.release();
  }
}

export function getClientIP(req: import("express").Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
  return req.socket?.remoteAddress ?? "unknown";
}
