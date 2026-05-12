import { Router } from "express";
import { z } from "zod";
import { getConfig, setConfig, getManyConfig } from "../../lib/server-config";
import { requireClerkAdmin } from "../../lib/clerk-admin";
import { pool } from "@workspace/db";

const router = Router();

// Input limits on admin settings prevent oversized payloads from ever reaching
// server_config. API keys and model names are short identifiers; rate limits
// are small positive integers. Anything larger is either a mistake or an abuse
// attempt, so reject at the boundary.
const AdminConfigBody = z
  .object({
    provider: z.enum(["openai", "gemini", "server"]).optional(),
    apiKey: z.string().max(500).optional(),
    model: z.string().min(1).max(200).optional(),
    rateLimitPerHour: z.number().int().min(0).max(1_000_000).optional(),
    rateLimitPerDay: z.number().int().min(0).max(10_000_000).optional(),
  })
  .strict();

// GET /api/config/public — thông tin công khai (không lộ API key)
router.get("/config/public", async (_req, res) => {
  try {
    const cfg = await getManyConfig([
      "ai_provider",
      "ai_model",
      "ai_api_key",
      "rate_limit_per_hour",
      "rate_limit_per_day",
    ]);

    res.json({
      serverKeyConfigured: !!cfg.ai_api_key,
      provider: cfg.ai_provider ?? "openai",
      model: cfg.ai_model ?? "gpt-5.4-nano",
      rateLimitPerHour: parseInt(cfg.rate_limit_per_hour ?? "20", 10),
      rateLimitPerDay: parseInt(cfg.rate_limit_per_day ?? "100", 10),
      adminConfigured: !!(process.env.CLERK_SECRET_KEY && process.env.CLERK_PUBLISHABLE_KEY),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/config — cập nhật cấu hình (cần Clerk admin claim)
router.post("/admin/config", requireClerkAdmin, async (req, res) => {
  const parsed = AdminConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", issues: parsed.error.issues });
    return;
  }
  const { provider, apiKey, model, rateLimitPerHour, rateLimitPerDay } = parsed.data;

  // Cập nhật các giá trị được cung cấp
  const updates: Promise<void>[] = [];
  if (provider) updates.push(setConfig("ai_provider", provider));
  if (apiKey !== undefined && apiKey !== "") updates.push(setConfig("ai_api_key", apiKey));
  if (apiKey === "") updates.push(setConfig("ai_api_key", ""));
  if (model) updates.push(setConfig("ai_model", model));
  if (rateLimitPerHour !== undefined)
    updates.push(setConfig("rate_limit_per_hour", String(rateLimitPerHour)));
  if (rateLimitPerDay !== undefined)
    updates.push(setConfig("rate_limit_per_day", String(rateLimitPerDay)));

  await Promise.all(updates);
  res.json({ success: true });
});

// GET /api/admin/usage — thống kê lượt dùng (cần Clerk admin claim)
router.get("/admin/usage", requireClerkAdmin, async (_req, res) => {
  const client = await pool.connect();
  try {
    const [hourRes, dayRes, totalRes] = await Promise.all([
      client.query(
        `SELECT ip, COUNT(*) AS count FROM usage_log
         WHERE created_at > NOW() - INTERVAL '1 hour'
         GROUP BY ip ORDER BY count DESC LIMIT 20`,
      ),
      client.query(
        `SELECT ip, COUNT(*) AS count FROM usage_log
         WHERE created_at > NOW() - INTERVAL '1 day'
         GROUP BY ip ORDER BY count DESC LIMIT 20`,
      ),
      client.query("SELECT COUNT(*) FROM usage_log"),
    ]);

    res.json({
      lastHour: hourRes.rows,
      lastDay: dayRes.rows,
      total: parseInt(totalRes.rows[0].count, 10),
    });
  } finally {
    client.release();
  }
});

export default router;
