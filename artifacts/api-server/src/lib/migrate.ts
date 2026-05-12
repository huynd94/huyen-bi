/**
 * Auto-migration: creates all database tables on app start if they don't exist.
 *
 * The authoritative schema definitions live in @workspace/db (lib/db/src/schema/).
 * This file uses Drizzle's `sql` operator to execute CREATE TABLE IF NOT EXISTS
 * statements that mirror those schema definitions. Any schema changes should be
 * made in the Drizzle schema files first, then reflected here.
 *
 * For production migrations, use `drizzle-kit push` from the @workspace/db package.
 */
import { sql } from "drizzle-orm";
import { db } from "@workspace/db";

export async function runMigrations(): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id         SERIAL PRIMARY KEY,
      title      TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE conversations ADD COLUMN IF NOT EXISTS user_id TEXT;
    CREATE INDEX IF NOT EXISTS idx_conversations_user
      ON conversations(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS messages (
      id              SERIAL PRIMARY KEY,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role            TEXT NOT NULL,
      content         TEXT NOT NULL,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS server_config (
      key        VARCHAR(100) PRIMARY KEY,
      value      TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS usage_log (
      id         SERIAL PRIMARY KEY,
      ip         TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_usage_log_ip_created ON usage_log(ip, created_at);

    CREATE TABLE IF NOT EXISTS saved_readings (
      id          SERIAL PRIMARY KEY,
      user_id     TEXT NOT NULL,
      module      TEXT NOT NULL,
      title       TEXT NOT NULL,
      input_data  JSONB NOT NULL DEFAULT '{}',
      result_data JSONB NOT NULL DEFAULT '{}',
      notes       TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_saved_readings_user ON saved_readings(user_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS share_tokens (
      token       TEXT PRIMARY KEY,
      reading_id  INTEGER NOT NULL REFERENCES saved_readings(id) ON DELETE CASCADE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expires_at  TIMESTAMPTZ
    );
  `);

  console.log("[migrate] Bảng database sẵn sàng.");
}
