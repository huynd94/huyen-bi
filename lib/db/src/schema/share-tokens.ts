import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { savedReadings } from "./saved-readings";

export const shareTokens = pgTable("share_tokens", {
  token: text("token").primaryKey(),
  readingId: integer("reading_id")
    .notNull()
    .references(() => savedReadings.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
});

export const insertShareTokenSchema = createInsertSchema(shareTokens).omit({
  createdAt: true,
});

export type ShareToken = typeof shareTokens.$inferSelect;
export type InsertShareToken = z.infer<typeof insertShareTokenSchema>;
