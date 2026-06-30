import { index, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Durable notification job queue (Postgres-backed, no external broker).
 *
 * The worker container claims due jobs with `SELECT ... FOR UPDATE SKIP LOCKED`
 * so multiple worker replicas never process the same job. Lifecycle:
 *   pending -> processing -> done | failed
 *
 * - `type` selects the payload builder (e.g. "daily_fortune", "sao_han").
 * - `userId` is the recipient (Clerk id).
 * - `payload` carries precomputed values needed to render the push.
 * - `runAt` is the earliest time the job may be claimed (scheduling + retry backoff).
 * - `attempts` / `lastError` support bounded retries.
 */
export const notificationJobs = pgTable(
  "notification_jobs",
  {
    id: serial("id").primaryKey(),
    type: text("type").notNull(),
    userId: text("user_id").notNull(),
    payload: jsonb("payload").notNull().default({}),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    runAt: timestamp("run_at", { withTimezone: true }).defaultNow().notNull(),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // Worker claim query: WHERE status='pending' AND run_at <= now() ORDER BY run_at.
    index("idx_notification_jobs_claim").on(table.status, table.runAt),
  ],
);

export const insertNotificationJobSchema = createInsertSchema(notificationJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type NotificationJob = typeof notificationJobs.$inferSelect;
export type InsertNotificationJob = z.infer<typeof insertNotificationJobSchema>;
