import { Router } from "express";
import { z } from "zod";
import { pool } from "@workspace/db";
import { requireClerkUser, type AuthenticatedRequest } from "../lib/clerk-user";
import { getVapidPublicKey, isPushConfigured } from "../lib/web-push";

const router = Router();

// PushSubscription.toJSON() shape from the browser. Endpoint + the two keys are
// all `web-push` needs to encrypt a payload to this device.
const SubscribeBody = z.object({
  endpoint: z.string().url().max(2000),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(500),
  }),
});

const UnsubscribeBody = z.object({
  endpoint: z.string().url().max(2000),
});

const PrefsBody = z
  .object({
    dailyFortune: z.boolean().optional(),
    saoHan: z.boolean().optional(),
    timezone: z.string().min(1).max(64).optional(),
    sendHour: z.number().int().min(0).max(23).optional(),
  })
  .refine((b) => Object.keys(b).length > 0, {
    message: "at least one preference field must be provided",
  });

// GET /api/push/vapid-public-key — public key for the service worker to subscribe.
router.get("/push/vapid-public-key", (_req, res) => {
  res.json({ publicKey: getVapidPublicKey(), configured: isPushConfigured() });
});

// POST /api/push/subscribe — store/refresh this device's push subscription.
router.post("/push/subscribe", requireClerkUser, async (req: AuthenticatedRequest, res) => {
  const parsed = SubscribeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", issues: parsed.error.issues });
    return;
  }
  const { endpoint, keys } = parsed.data;
  try {
    // Upsert on endpoint: a device re-subscribing (or switching accounts)
    // updates ownership + keys rather than duplicating rows.
    await pool.query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (endpoint)
       DO UPDATE SET user_id = EXCLUDED.user_id,
                     p256dh  = EXCLUDED.p256dh,
                     auth    = EXCLUDED.auth`,
      [req.userId, endpoint, keys.p256dh, keys.auth],
    );
    // Ensure the user has a prefs row so the worker can find them.
    await pool.query(
      `INSERT INTO reminder_prefs (user_id) VALUES ($1)
       ON CONFLICT (user_id) DO NOTHING`,
      [req.userId],
    );
    res.status(201).json({ success: true });
  } catch {
    res.status(500).json({ error: "Database error" });
  }
});

// POST /api/push/unsubscribe — remove this device's subscription (ownership-scoped).
router.post("/push/unsubscribe", requireClerkUser, async (req: AuthenticatedRequest, res) => {
  const parsed = UnsubscribeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", issues: parsed.error.issues });
    return;
  }
  try {
    await pool.query(
      `DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2`,
      [parsed.data.endpoint, req.userId],
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Database error" });
  }
});

// GET /api/push/prefs — current reminder preferences for the signed-in user.
router.get("/push/prefs", requireClerkUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT daily_fortune, sao_han, timezone, send_hour
       FROM reminder_prefs WHERE user_id = $1`,
      [req.userId],
    );
    if (rows.length === 0) {
      // Defaults mirror the schema defaults; no row yet means never subscribed.
      res.json({ dailyFortune: true, saoHan: false, timezone: "Asia/Ho_Chi_Minh", sendHour: 7, subscribed: false });
      return;
    }
    const r = rows[0];
    res.json({
      dailyFortune: r.daily_fortune,
      saoHan: r.sao_han,
      timezone: r.timezone,
      sendHour: r.send_hour,
      subscribed: true,
    });
  } catch {
    res.status(500).json({ error: "Database error" });
  }
});

// PATCH /api/push/prefs — update reminder preferences (partial).
router.patch("/push/prefs", requireClerkUser, async (req: AuthenticatedRequest, res) => {
  const parsed = PrefsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", issues: parsed.error.issues });
    return;
  }
  const { dailyFortune, saoHan, timezone, sendHour } = parsed.data;
  try {
    // Upsert so a user can set prefs even before a push subscription exists.
    await pool.query(
      `INSERT INTO reminder_prefs (user_id, daily_fortune, sao_han, timezone, send_hour, updated_at)
       VALUES ($1, COALESCE($2, TRUE), COALESCE($3, FALSE), COALESCE($4, 'Asia/Ho_Chi_Minh'), COALESCE($5, 7), NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         daily_fortune = COALESCE($2, reminder_prefs.daily_fortune),
         sao_han       = COALESCE($3, reminder_prefs.sao_han),
         timezone      = COALESCE($4, reminder_prefs.timezone),
         send_hour     = COALESCE($5, reminder_prefs.send_hour),
         updated_at    = NOW()`,
      [
        req.userId,
        dailyFortune ?? null,
        saoHan ?? null,
        timezone ?? null,
        sendHour ?? null,
      ],
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
