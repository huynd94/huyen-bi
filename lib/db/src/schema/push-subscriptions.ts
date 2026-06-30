import { index, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

/**
 * Web Push subscriptions (one row per browser/device endpoint).
 *
 * Tied to a Clerk `user_id` so reminders are account-scoped and sync across a
 * user's devices. `endpoint` is unique because the browser issues one push
 * endpoint per service-worker registration; re-subscribing upserts on it.
 * `p256dh`/`auth` are the keys returned by `PushSubscription.toJSON()` and are
 * required by the `web-push` library to encrypt payloads.
 */
export const pushSubscriptions = pgTable(
  "push_subscriptions",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("idx_push_subscriptions_endpoint").on(table.endpoint),
    index("idx_push_subscriptions_user").on(table.userId),
  ],
);

export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true,
});

export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;
