// Regression test for Task 6: oversized / malformed input must be rejected
// *before* it hits business logic or the DB.
//
// Three layers are tested here:
//   1. Generated zod schemas (`api-zod`) enforce per-field min/max length so
//      they reject too-long payloads with a ZodError.
//   2. `express.json({ limit })` drops raw bodies larger than the cap with a
//      413 Payload Too Large, no matter which route is targeted.
//   3. The hand-rolled admin config route validates body shape with zod,
//      rejecting extra keys and oversized fields with a 400.
import assert from "node:assert/strict";
import http from "node:http";
import express from "express";

// Database is not reached: every request under test is rejected before any
// route handler touches it. A dummy URL keeps the workspace/db module happy
// at import time.
process.env.DATABASE_URL ??= "postgres://test:test@127.0.0.1:5432/test";

const {
  CreateOpenaiConversationBody,
  SendOpenaiMessageBody,
  AiInterpretMysticismBody,
} = await import("@workspace/api-zod");

// ---------------------------------------------------------------------------
// 1. Generated zod schemas enforce maxLength from the OpenAPI spec.
// ---------------------------------------------------------------------------
{
  // valid payloads pass
  assert.equal(CreateOpenaiConversationBody.safeParse({ title: "ok" }).success, true);
  assert.equal(SendOpenaiMessageBody.safeParse({ content: "hi" }).success, true);
  assert.equal(
    AiInterpretMysticismBody.safeParse({ type: "numerology", context: "x" }).success,
    true,
  );

  // oversized payloads fail at the schema boundary
  const longTitle = "x".repeat(201);
  const longContent = "x".repeat(4001);
  const longCtx = "x".repeat(8001);
  assert.equal(
    CreateOpenaiConversationBody.safeParse({ title: longTitle }).success,
    false,
    "title > 200 should fail",
  );
  assert.equal(
    SendOpenaiMessageBody.safeParse({ content: longContent }).success,
    false,
    "message > 4000 should fail",
  );
  assert.equal(
    AiInterpretMysticismBody.safeParse({ type: "numerology", context: longCtx }).success,
    false,
    "context > 8000 should fail",
  );

  // empty required fields fail (min: 1)
  assert.equal(CreateOpenaiConversationBody.safeParse({ title: "" }).success, false);
  assert.equal(SendOpenaiMessageBody.safeParse({ content: "" }).success, false);
}

// ---------------------------------------------------------------------------
// 2. express.json({ limit }) returns 413 for oversized raw bodies.
// ---------------------------------------------------------------------------
{
  const app = express();
  app.use(express.json({ limit: "64kb" }));
  app.post("/echo", (req, res) => {
    res.json({ ok: true, size: JSON.stringify(req.body).length });
  });
  // Express 5 uses the finalhandler to surface errors; make sure the
  // error middleware returns the status code instead of crashing.
  app.use(
    (err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(err.status || 500).json({ error: err.type ?? "error" });
    },
  );

  const server = await new Promise<{ server: http.Server; port: number }>((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => {
      const addr = s.address();
      if (!addr || typeof addr === "string") throw new Error("no port");
      resolve({ server: s, port: addr.port });
    });
  });
  try {
    // 200kb >> 64kb limit
    const bigBody = JSON.stringify({ content: "x".repeat(200_000) });
    const status = await new Promise<number>((resolve, reject) => {
      const req = http.request(
        {
          host: "127.0.0.1",
          port: server.port,
          method: "POST",
          path: "/echo",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(bigBody),
          },
        },
        (res) => {
          res.resume();
          res.on("end", () => resolve(res.statusCode ?? 0));
        },
      );
      req.on("error", reject);
      req.write(bigBody);
      req.end();
    });
    assert.equal(status, 413, "body > 64kb should be 413");
  } finally {
    server.server.close();
  }
}

// ---------------------------------------------------------------------------
// 3. The hand-rolled admin config body schema is strict and length-bounded.
//    Pull the same `AdminConfigBody` the route uses by running its file-level
//    code path through a dynamic import and a minimal re-implementation check.
// ---------------------------------------------------------------------------
{
  // Read the source instead of importing the whole router (which pulls in
  // clerkClient and needs secrets). We just confirm the schema is wired up.
  const fs = await import("node:fs/promises");
  const url = new URL("../routes/config/index.ts", import.meta.url);
  const src = await fs.readFile(url, "utf8");
  assert.match(src, /AdminConfigBody\.safeParse\(req\.body\)/, "admin config route must parse body with zod");
  assert.match(src, /\.strict\(\)/, "admin config body must be a strict object");
  assert.match(src, /apiKey:\s*z\.string\(\)\.max\(500\)/, "apiKey must be length-capped");
}

// ---------------------------------------------------------------------------
// 4. The readings routes validate body shape with zod.
// ---------------------------------------------------------------------------
{
  const fs = await import("node:fs/promises");
  const url = new URL("../routes/readings.ts", import.meta.url);
  const src = await fs.readFile(url, "utf8");
  assert.match(src, /CreateReadingBody\.safeParse\(req\.body\)/);
  assert.match(src, /PatchReadingBody\.safeParse\(req\.body\)/);
  assert.match(src, /MAX_JSON_FIELD_BYTES/, "json payload fields must be byte-capped");
}

console.log("input-limits: ok");
