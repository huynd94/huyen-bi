import assert from "node:assert/strict";
import http from "node:http";
import express from "express";

process.env.DATABASE_URL ??= "postgres://test:test@127.0.0.1:5432/test";

const { __setGetAuthForTests } = await import("../lib/clerk-user");
const { pool } = await import("@workspace/db");
const { default: readingsRouter } = await import("./readings");

type QueryCall = { sql: string; params: readonly unknown[] };
type PoolQueryResult = { rows: unknown[]; rowCount: number };

const poolCalls: QueryCall[] = [];
const originalQuery = pool.query.bind(pool);

(pool as unknown as { query: (sql: string, params?: readonly unknown[]) => Promise<PoolQueryResult> }).query =
  async (sql: string, params: readonly unknown[] = []) => {
    poolCalls.push({ sql, params });

    if (/UPDATE saved_readings SET/.test(sql)) {
      const notesMatch = /notes\s*=\s*\$(\d+)/.exec(sql);
      const titleMatch = /title\s*=\s*\$(\d+)/.exec(sql);
      const idMatch = /WHERE id = \$(\d+)/.exec(sql);
      const oldNotes = "old note";
      const nextNotes = notesMatch ? params[Number(notesMatch[1]) - 1] : oldNotes;
      const nextTitle = titleMatch ? params[Number(titleMatch[1]) - 1] : "old title";
      return {
        rowCount: 1,
        rows: [
          {
            id: idMatch ? params[Number(idMatch[1]) - 1] : undefined,
            module: "tu-vi",
            title: nextTitle,
            notes: nextNotes,
          },
        ],
      };
    }

    return { rows: [], rowCount: 0 };
  };

function resetPoolRecorder(): void {
  poolCalls.length = 0;
}

__setGetAuthForTests(() => ({ userId: "user_patch_notes" }));

const app = express();
app.use(express.json());
app.use(readingsRouter);

const server = await new Promise<{ server: http.Server; port: number }>((resolve) => {
  const s = app.listen(0, "127.0.0.1", () => {
    const addr = s.address();
    if (!addr || typeof addr === "string") throw new Error("no port");
    resolve({ server: s, port: addr.port });
  });
});

function request(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const headers: Record<string, string | number> = {};
    if (payload !== undefined) {
      headers["Content-Type"] = "application/json";
      headers["Content-Length"] = Buffer.byteLength(payload);
    }
    const req = http.request(
      { host: "127.0.0.1", port: server.port, method, path, headers },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c: Buffer) => chunks.push(c));
        res.on("end", () =>
          resolve({
            status: res.statusCode ?? 0,
            body: Buffer.concat(chunks).toString("utf8"),
          }),
        );
      },
    );
    req.on("error", reject);
    if (payload !== undefined) req.write(payload);
    req.end();
  });
}

try {
  {
    resetPoolRecorder();
    const res = await request("PATCH", "/readings/7", { notes: null });
    assert.equal(res.status, 200, "explicit null notes must be accepted");
    assert.equal(JSON.parse(res.body).notes, null, "explicit null notes must clear existing notes");
    assert.equal(poolCalls.length, 1, "PATCH should issue one UPDATE query");
    assert.equal(poolCalls[0]!.params[0], null, "notes null must be bound to SQL");
  }

  {
    resetPoolRecorder();
    const res = await request("PATCH", "/readings/7", { title: "new title" });
    assert.equal(res.status, 200, "title-only patch must still succeed");
    assert.equal(JSON.parse(res.body).notes, "old note", "omitted notes must preserve old notes");
    assert.equal(
      /notes\s*=/.test(poolCalls[0]!.sql),
      false,
      "omitted notes must not emit a notes assignment",
    );
  }

  {
    resetPoolRecorder();
    const res = await request("PATCH", "/readings/abc", { notes: null });
    assert.equal(res.status, 400, "invalid ids remain rejected");
    assert.equal(poolCalls.length, 0, "invalid ids must not touch the database");
  }

  console.log("readings-patch-notes: ok");
} finally {
  server.server.close();
  (pool as unknown as { query: typeof originalQuery }).query = originalQuery;
  __setGetAuthForTests(null);
}
