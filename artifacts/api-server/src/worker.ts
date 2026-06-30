/**
 * Notification worker — standalone process (separate container).
 *
 * Two responsibilities, both polled on intervals:
 *
 *  1. SCHEDULER: every few minutes, find users whose local `send_hour` has been
 *     reached today and who haven't been sent yet (`last_sent_date` guard), and
 *     enqueue a `daily_fortune` job. This is idempotent: the partial update of
 *     `last_sent_date` happens atomically when the job is enqueued.
 *
 *  2. PROCESSOR: continuously claim due jobs from `notification_jobs` using
 *     `FOR UPDATE SKIP LOCKED` (so multiple worker replicas never double-process),
 *     build the push payload via @workspace/mysticism-core, and deliver via
 *     web-push. Dead endpoints (410/404) are pruned; transient errors retry with
 *     backoff up to MAX_ATTEMPTS.
 *
 * Runs no HTTP server. Shares the same DATABASE_URL and VAPID keys as the API.
 */
import { pool } from "@workspace/db";
import { buildDailyFortune } from "@workspace/mysticism-core";
import { logger } from "./lib/logger";
import { isPushConfigured, sendPush } from "./lib/web-push";

const SCHEDULER_INTERVAL_MS = 60_000; // check who's due once a minute
const PROCESSOR_INTERVAL_MS = 5_000; // drain the queue every 5s
const MAX_ATTEMPTS = 5;
const RETRY_BACKOFF_MS = 60_000; // 1 min * attempts

/** Local YYYY-MM-DD for a given IANA timezone. */
function localDateString(tz: string, now: Date): string {
  // en-CA yields ISO-like YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Local hour [0..23] for a given IANA timezone. */
function localHour(tz: string, now: Date): number {
  const s = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    hour12: false,
  }).format(now);
  return parseInt(s, 10) % 24;
}

/**
 * SCHEDULER: enqueue daily_fortune jobs for users due now.
 *
 * A user is "due" when: dailyFortune on, their local hour >= send_hour, and
 * last_sent_date != their local today. We flip last_sent_date in the same
 * UPDATE that gates selection so a crash between enqueue and send won't double
 * up (the job row is the durable unit; worst case a job is enqueued but the
 * send fails and retries).
 */
async function scheduleDailyFortunes(now: Date): Promise<void> {
  const { rows } = await pool.query(
    `SELECT user_id, timezone, send_hour, sao_han, last_sent_date
     FROM reminder_prefs
     WHERE daily_fortune = TRUE`,
  );

  for (const r of rows) {
    const tz = r.timezone as string;
    const today = localDateString(tz, now);
    if (r.last_sent_date === today) continue;
    if (localHour(tz, now) < r.send_hour) continue;

    // Claim the day for this user atomically; only proceed if we set it (i.e.
    // it wasn't already today). This guards against two scheduler ticks racing.
    const claim = await pool.query(
      `UPDATE reminder_prefs SET last_sent_date = $2, updated_at = NOW()
       WHERE user_id = $1 AND (last_sent_date IS DISTINCT FROM $2)
       RETURNING user_id`,
      [r.user_id, today],
    );
    if (claim.rowCount === 0) continue;

    await pool.query(
      `INSERT INTO notification_jobs (type, user_id, payload)
       VALUES ('daily_fortune', $1, $2)`,
      [r.user_id, JSON.stringify({ saoHan: r.sao_han })],
    );
    logger.info({ userId: r.user_id, today }, "enqueued daily_fortune");
  }
}

/** Look up the most recent saved reading's birth year for sao-hạn enrichment. */
async function lookupBirthYear(userId: string): Promise<number | undefined> {
  const { rows } = await pool.query(
    `SELECT input_data FROM saved_readings
     WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
    [userId],
  );
  for (const row of rows) {
    const data = row.input_data as Record<string, unknown> | null;
    if (!data) continue;
    // Accept common shapes: explicit birthYear, or a DOB string DD/MM/YYYY.
    if (typeof data.birthYear === "number") return data.birthYear;
    for (const v of Object.values(data)) {
      if (typeof v === "string") {
        const m = /\b(\d{4})\b/.exec(v);
        if (m) {
          const yr = parseInt(m[1], 10);
          if (yr >= 1900 && yr <= 2100) return yr;
        }
      }
    }
  }
  return undefined;
}

/** Build + deliver one daily_fortune job to all of the user's devices. */
async function processDailyFortune(userId: string, payload: { saoHan?: boolean }): Promise<void> {
  const birthYear = payload.saoHan ? await lookupBirthYear(userId) : undefined;
  const fortune = buildDailyFortune({ date: new Date(), birthYear });

  const { rows: subs } = await pool.query(
    `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = $1`,
    [userId],
  );

  for (const sub of subs) {
    const result = await sendPush(
      { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
      { title: fortune.title, body: fortune.body, url: "/", tag: "daily-fortune" },
    );
    if (result === "gone") {
      await pool.query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [sub.endpoint]);
      logger.info({ userId }, "pruned dead push subscription");
    } else if (result === "error") {
      throw new Error("push delivery failed");
    }
  }
}

/**
 * PROCESSOR: claim and run one due job. Returns true if a job was processed,
 * false if the queue was empty (so the caller can back off).
 */
async function processOneJob(): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `SELECT id, type, user_id, payload, attempts
       FROM notification_jobs
       WHERE status = 'pending' AND run_at <= NOW()
       ORDER BY run_at
       FOR UPDATE SKIP LOCKED
       LIMIT 1`,
    );
    if (rows.length === 0) {
      await client.query("COMMIT");
      return false;
    }
    const job = rows[0];
    await client.query(
      `UPDATE notification_jobs SET status = 'processing', updated_at = NOW() WHERE id = $1`,
      [job.id],
    );
    await client.query("COMMIT");

    try {
      if (job.type === "daily_fortune") {
        await processDailyFortune(job.user_id, job.payload ?? {});
      } else {
        logger.warn({ type: job.type }, "unknown job type, skipping");
      }
      await pool.query(
        `UPDATE notification_jobs SET status = 'done', updated_at = NOW() WHERE id = $1`,
        [job.id],
      );
    } catch (err) {
      const attempts = (job.attempts ?? 0) + 1;
      const failed = attempts >= MAX_ATTEMPTS;
      await pool.query(
        `UPDATE notification_jobs
         SET status = $2, attempts = $3, last_error = $4,
             run_at = NOW() + ($5 || ' milliseconds')::interval, updated_at = NOW()
         WHERE id = $1`,
        [
          job.id,
          failed ? "failed" : "pending",
          attempts,
          err instanceof Error ? err.message : String(err),
          String(RETRY_BACKOFF_MS * attempts),
        ],
      );
      logger.error({ jobId: job.id, attempts, failed }, "job processing error");
    }
    return true;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    logger.error({ err }, "claim transaction error");
    return false;
  } finally {
    client.release();
  }
}

async function processorLoop(): Promise<void> {
  // Drain greedily until empty, then the interval reschedules us.
  let processed = true;
  while (processed) {
    processed = await processOneJob();
  }
}

function start(): void {
  if (!isPushConfigured()) {
    logger.warn(
      "VAPID keys not configured — worker will run but cannot deliver pushes. Set VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY.",
    );
  }
  logger.info("notification worker started");

  const tick = (fn: () => Promise<void>) => () => {
    fn().catch((err) => logger.error({ err }, "worker tick error"));
  };

  // Run once immediately, then on intervals.
  tick(() => scheduleDailyFortunes(new Date()))();
  tick(processorLoop)();

  setInterval(tick(() => scheduleDailyFortunes(new Date())), SCHEDULER_INTERVAL_MS);
  setInterval(tick(processorLoop), PROCESSOR_INTERVAL_MS);
}

/**
 * Wait until the notification tables exist before starting the loops.
 *
 * The API container owns migrations, but the worker may boot first. Rather than
 * spam "relation does not exist" until the API catches up, poll for the schema
 * to be present (bounded), then start. Migration is idempotent so this is safe
 * even if both ran it.
 */
async function waitForSchema(maxWaitMs = 120_000): Promise<void> {
  const deadline = Date.now() + maxWaitMs;
  for (;;) {
    try {
      await pool.query("SELECT 1 FROM notification_jobs LIMIT 1");
      await pool.query("SELECT 1 FROM reminder_prefs LIMIT 1");
      return;
    } catch {
      if (Date.now() > deadline) {
        logger.error("notification tables not present after wait window; starting anyway");
        return;
      }
      logger.info("waiting for notification schema (API migration)…");
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

void waitForSchema().then(start);
