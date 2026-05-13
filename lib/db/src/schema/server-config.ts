import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const serverConfig = pgTable("server_config", {
  key: varchar("key", { length: 100 }).primaryKey(),
  value: text("value"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const insertServerConfigSchema = createInsertSchema(serverConfig).omit({
  updatedAt: true,
});

export type ServerConfig = typeof serverConfig.$inferSelect;
export type InsertServerConfig = z.infer<typeof insertServerConfigSchema>;
