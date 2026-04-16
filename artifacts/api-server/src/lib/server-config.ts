import { pool } from "@workspace/db";

const DEFAULTS: Record<string, string> = {
  ai_provider: "openai",
  ai_model: "gpt-5.4-nano",
  rate_limit_per_hour: "20",
  rate_limit_per_day: "100",
};

export async function getConfig(key: string): Promise<string | null> {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT value FROM server_config WHERE key = $1",
      [key],
    );
    return res.rows[0]?.value ?? DEFAULTS[key] ?? null;
  } finally {
    client.release();
  }
}

export async function setConfig(key: string, value: string): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO server_config (key, value, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, value],
    );
  } finally {
    client.release();
  }
}

export async function getManyConfig(
  keys: string[],
): Promise<Record<string, string | null>> {
  const client = await pool.connect();
  try {
    const res = await client.query(
      "SELECT key, value FROM server_config WHERE key = ANY($1)",
      [keys],
    );
    const result: Record<string, string | null> = {};
    for (const key of keys) {
      const row = res.rows.find((r: any) => r.key === key);
      result[key] = row?.value ?? DEFAULTS[key] ?? null;
    }
    return result;
  } finally {
    client.release();
  }
}
