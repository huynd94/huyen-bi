import { index, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usageLog = pgTable(
  "usage_log",
  {
    id: serial("id").primaryKey(),
    ip: text("ip").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_usage_log_ip_created").on(table.ip, table.createdAt),
  ],
);

export const insertUsageLogSchema = createInsertSchema(usageLog).omit({
  id: true,
  createdAt: true,
});

export type UsageLog = typeof usageLog.$inferSelect;
export type InsertUsageLog = z.infer<typeof insertUsageLogSchema>;
