import { Router } from "express";
import { z } from "zod";
import { pool } from "@workspace/db";
import crypto from "crypto";
import { requireClerkUser, type AuthenticatedRequest } from "../lib/clerk-user";

const router = Router();

// Saved-reading input limits. Titles and notes are short user-facing strings;
// input/result payloads are small key/value blobs produced by the modules
// themselves. Caps are chosen to comfortably hold the largest legitimate
// reading while rejecting oversized abuse.
const MAX_JSON_FIELD_BYTES = 32 * 1024;

const jsonRecord = z
  .record(z.string(), z.unknown())
  .refine(
    (val) => Buffer.byteLength(JSON.stringify(val), "utf8") <= MAX_JSON_FIELD_BYTES,
    { message: `field exceeds ${MAX_JSON_FIELD_BYTES} bytes` },
  );

const CreateReadingBody = z.object({
  module: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  input_data: jsonRecord.optional(),
  result_data: jsonRecord.optional(),
  notes: z.string().max(2000).nullable().optional(),
});

const PatchReadingBody = z
  .object({
    title: z.string().min(1).max(200).optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .refine((body) => body.title !== undefined || body.notes !== undefined, {
    message: "at least one of `title` or `notes` must be provided",
  });

router.get("/readings", requireClerkUser, async (req: AuthenticatedRequest, res) => {
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

router.post("/readings", requireClerkUser, async (req: AuthenticatedRequest, res) => {
  const parsed = CreateReadingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", issues: parsed.error.issues });
    return;
  }
  const { module, title, input_data, result_data, notes } = parsed.data;
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

router.patch("/readings/:id", requireClerkUser, async (req: AuthenticatedRequest, res) => {
  const parsed = PatchReadingBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body", issues: parsed.error.issues });
    return;
  }
  const { notes, title } = parsed.data;
  try {
    const { rows } = await pool.query(
      `UPDATE saved_readings SET notes = COALESCE($1, notes), title = COALESCE($2, title), updated_at = NOW()
       WHERE id = $3 AND user_id = $4 RETURNING *`,
      [notes, title, req.params.id, req.userId],
    );
    if (!rows.length) {
      res.status(404).json({ error: "Không tìm thấy" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

router.delete("/readings/:id", requireClerkUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM saved_readings WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );
    if (!rowCount) {
      res.status(404).json({ error: "Không tìm thấy" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

router.post("/readings/:id/share", requireClerkUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { rows: check } = await pool.query(
      `SELECT id FROM saved_readings WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.userId],
    );
    if (!check.length) {
      res.status(404).json({ error: "Không tìm thấy" });
      return;
    }

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
    if (!rows.length) {
      res.status(404).json({ error: "Liên kết không hợp lệ hoặc đã hết hạn" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
