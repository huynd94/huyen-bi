import { Router } from "express";
import { createHash } from "crypto";
import { getConfig, setConfig, getManyConfig } from "../../lib/server-config";
import { pool } from "@workspace/db";

const router = Router();

function hashPw(password: string): string {
  return createHash("sha256").update("huyen-bi:" + password).digest("hex");
}

// GET /api/config/public — thông tin công khai (không lộ API key)
router.get("/config/public", async (_req, res) => {
  try {
    const cfg = await getManyConfig([
      "ai_provider",
      "ai_model",
      "ai_api_key",
      "rate_limit_per_hour",
      "rate_limit_per_day",
      "admin_password_hash",
    ]);

    res.json({
      serverKeyConfigured: !!cfg.ai_api_key,
      provider: cfg.ai_provider ?? "openai",
      model: cfg.ai_model ?? "gpt-5.4-nano",
      rateLimitPerHour: parseInt(cfg.rate_limit_per_hour ?? "20", 10),
      rateLimitPerDay: parseInt(cfg.rate_limit_per_day ?? "100", 10),
      adminConfigured: !!cfg.admin_password_hash,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/config — cập nhật cấu hình (cần mật khẩu admin)
router.post("/admin/config", async (req, res) => {
  const { adminPassword, provider, apiKey, model, rateLimitPerHour, rateLimitPerDay, newAdminPassword } = req.body;

  if (!adminPassword) {
    res.status(400).json({ error: "Cần nhập mật khẩu admin" });
    return;
  }

  const storedHash = await getConfig("admin_password_hash");

  if (storedHash) {
    if (hashPw(adminPassword) !== storedHash) {
      res.status(401).json({ error: "Mật khẩu admin không đúng" });
      return;
    }
  } else {
    // Lần đầu tiên — tự động đặt mật khẩu
    await setConfig("admin_password_hash", hashPw(adminPassword));
  }

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
  if (newAdminPassword)
    updates.push(setConfig("admin_password_hash", hashPw(newAdminPassword)));

  await Promise.all(updates);
  res.json({ success: true });
});

// GET /api/admin/usage — thống kê lượt dùng (cần mật khẩu admin)
router.get("/admin/usage", async (req, res) => {
  const password = req.headers["x-admin-password"] as string;
  if (!password) {
    res.status(401).json({ error: "Cần mật khẩu admin" });
    return;
  }

  const storedHash = await getConfig("admin_password_hash");
  if (!storedHash || hashPw(password) !== storedHash) {
    res.status(401).json({ error: "Mật khẩu admin không đúng" });
    return;
  }

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
