import { Router } from "express";
import { getAuth } from "@clerk/express";
import { pool } from "@workspace/db";
import crypto from "crypto";

const router = Router();

function requireAuth(req: any, res: any, next: any) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  req.userId = userId;
  next();
}

router.get("/readings", requireAuth, async (req: any, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, module, title, input_data, result_data, notes, created_at, updated_at
       FROM saved_readings WHERE user_id = $1 ORDER BY created_at DESC`,
      [req.userId],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/readings", requireAuth, async (req: any, res) => {
  const { module, title, input_data, result_data, notes } = req.body;
  if (!module || !title) return res.status(400).json({ error: "module và title là bắt buộc" });
  try {
    const { rows } = await pool.query(
      `INSERT INTO saved_readings (user_id, module, title, input_data, result_data, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, module, title, input_data, result_data, notes, created_at`,
      [req.userId, module, title, input_data ?? {}, result_data ?? {}, notes ?? null],
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

router.patch("/readings/:id", requireAuth, async (req: any, res) => {
  const { notes, title } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE saved_readings SET notes = COALESCE($1, notes), title = COALESCE($2, title), updated_at = NOW()
       WHERE id = $3 AND user_id = $4 RETURNING *`,
      [notes, title, req.params.id, req.userId],
    );
    if (!rows.length) return res.status(404).json({ error: "Không tìm thấy" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/readings/:id", requireAuth, async (req: any, res) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM saved_readings WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );
    if (!rowCount) return res.status(404).json({ error: "Không tìm thấy" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/readings/:id/share", requireAuth, async (req: any, res) => {
  try {
    const { rows: check } = await pool.query(
      `SELECT id FROM saved_readings WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );
    if (!check.length) return res.status(404).json({ error: "Không tìm thấy" });

    const token = crypto.randomBytes(12).toString("base64url");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await pool.query(
      `INSERT INTO share_tokens (token, reading_id, expires_at) VALUES ($1, $2, $3)
       ON CONFLICT (token) DO NOTHING`,
      [token, req.params.id, expiresAt],
    );
    res.json({ token, expiresAt });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

router.get("/share/:token", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT sr.id, sr.module, sr.title, sr.input_data, sr.result_data, sr.created_at
       FROM share_tokens st JOIN saved_readings sr ON st.reading_id = sr.id
       WHERE st.token = $1 AND (st.expires_at IS NULL OR st.expires_at > NOW())`,
      [req.params.token],
    );
    if (!rows.length) return res.status(404).json({ error: "Liên kết không hợp lệ hoặc đã hết hạn" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
