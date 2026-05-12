import { index, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const savedReadings = pgTable(
  "saved_readings",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    module: text("module").notNull(),
    title: text("title").notNull(),
    inputData: jsonb("input_data").notNull().default({}),
    resultData: jsonb("result_data").notNull().default({}),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_saved_readings_user").on(table.userId, table.createdAt),
  ],
);

export const insertSavedReadingSchema = createInsertSchema(savedReadings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SavedReading = typeof savedReadings.$inferSelect;
export type InsertSavedReading = z.infer<typeof insertSavedReadingSchema>;
