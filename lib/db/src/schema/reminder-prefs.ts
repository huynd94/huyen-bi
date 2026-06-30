import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Per-user reminder preferences (one row per Clerk `user_id`, used as PK).
 *
 * - `dailyFortune` / `saoHan` toggle each reminder type.
 * - `timezone` is an IANA name (e.g. "Asia/Ho_Chi_Minh"); the worker uses it to
 *   decide when local `sendHour` is reached.
 * - `sendHour` is the local hour [0..23] to deliver the daily fortune.
 * - `lastSentDate` is the YYYY-MM-DD (local) of the last successful daily send,
 *   the idempotency guard that stops the worker double-sending within a day.
 */
export const reminderPrefs = pgTable("reminder_prefs", {
  userId: text("user_id").primaryKey(),
  dailyFortune: boolean("daily_fortune").notNull().default(true),
  saoHan: boolean("sao_han").notNull().default(false),
  timezone: text("timezone").notNull().default("Asia/Ho_Chi_Minh"),
  sendHour: integer("send_hour").notNull().default(7),
  lastSentDate: text("last_sent_date"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertReminderPrefsSchema = createInsertSchema(reminderPrefs).omit({
  updatedAt: true,
});

export type ReminderPrefs = typeof reminderPrefs.$inferSelect;
export type InsertReminderPrefs = z.infer<typeof insertReminderPrefsSchema>;
