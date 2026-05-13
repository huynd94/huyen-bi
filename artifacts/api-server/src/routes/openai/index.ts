import { Router } from "express";
import { db, conversations as conversationsTable, messages as messagesTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { CreateOpenaiConversationBody, SendOpenaiMessageBody } from "@workspace/api-zod";
import { requireClerkUser, type AuthenticatedRequest } from "../../lib/clerk-user";
import { getManyConfig } from "../../lib/server-config";
import { checkAndLogUsage, getClientIP } from "../../lib/rate-limit";
import { DEFAULT_OPENAI_MODEL, DEFAULT_GEMINI_MODEL } from "../../lib/ai-constants";

const router = Router();

const SYSTEM_PROMPT = `Bạn là một nhà huyền học uyên bác, am tường Thần số học (Numerology), Bát tự Tứ Trụ, Kinh Dịch (I Ching), và các phép huyền bí phương Đông và phương Tây. Bạn trả lời bằng tiếng Việt, với giọng văn sâu sắc, thấu đáo nhưng vẫn gần gũi. Hãy trả lời như một người thầy thông thái đang khai sáng cho người học trò.`;



// All conversation routes require an authenticated Clerk user. `requireClerkUser`
// attaches the resolved userId onto the request for ownership scoping.
router.use("/openai/conversations", requireClerkUser);

router.get("/openai/conversations", async (req, res) => {
  const { userId } = req as unknown as AuthenticatedRequest;
  const convs = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.userId, userId))
    .orderBy(conversationsTable.createdAt);
  res.json(convs);
});

router.post("/openai/conversations", async (req, res) => {
  const { userId } = req as unknown as AuthenticatedRequest;
  const parsed = CreateOpenaiConversationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }
  const [conv] = await db
    .insert(conversationsTable)
    .values({ userId, title: parsed.data.title })
    .returning();
  res.status(201).json(conv);
});

router.get("/openai/conversations/:id", async (req, res) => {
  const { userId } = req as unknown as AuthenticatedRequest;
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, userId)));
  if (!conv) { res.status(404).json({ error: "Not found" }); return; }
  const msgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(messagesTable.createdAt);
  res.json({ ...conv, messages: msgs });
});

router.delete("/openai/conversations/:id", async (req, res) => {
  const { userId } = req as unknown as AuthenticatedRequest;
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  // Verify ownership before touching messages so we never cascade-delete someone
  // else's data from a forged id.
  const [conv] = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, userId)));
  if (!conv) { res.status(404).json({ error: "Not found" }); return; }
  await db.delete(messagesTable).where(eq(messagesTable.conversationId, id));
  await db
    .delete(conversationsTable)
    .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, userId)));
  res.status(204).end();
});

router.get("/openai/conversations/:id/messages", async (req, res) => {
  const { userId } = req as unknown as AuthenticatedRequest;
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const [conv] = await db
    .select({ id: conversationsTable.id })
    .from(conversationsTable)
    .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, userId)));
  if (!conv) { res.status(404).json({ error: "Not found" }); return; }
  const msgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(messagesTable.createdAt);
  res.json(msgs);
});

router.post("/openai/conversations/:id/messages", async (req, res) => {
  const { userId } = req as unknown as AuthenticatedRequest;
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  const parsed = SendOpenaiMessageBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const [conv] = await db
    .select()
    .from(conversationsTable)
    .where(and(eq(conversationsTable.id, id), eq(conversationsTable.userId, userId)));
  if (!conv) { res.status(404).json({ error: "Not found" }); return; }

  const prevMessages = await db
    .select().from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(messagesTable.createdAt);

  // Resolve provider / API key / model BEFORE touching the messages table or
  // opening an SSE stream. Per spec post-opus-audit-remediation §5 (H3): if we
  // insert the user row first, a spammer whose quota is already exhausted can
  // still pile up rows each time checkAndLogUsage denies them. Checking here
  // means rate-limit / missing-config rejections short-circuit as plain JSON
  // (HTTP 429 / 503) before any state mutation.
  const provider = (req.headers["x-ai-provider"] as string) || "openai";
  const userApiKey = (req.headers["x-ai-key"] as string) || "";
  const userModel = (req.headers["x-ai-model"] as string) || "";

  let resolvedKey = userApiKey;
  let resolvedProvider = provider;
  let resolvedModel = userModel;
  let usingServerKey = false;

  if (provider === "server" || !userApiKey) {
    const cfg = await getManyConfig(["ai_api_key", "ai_provider", "ai_model"]);
    if (!cfg.ai_api_key) {
      res.status(503).json({ error: "Hệ thống chưa cấu hình API key." });
      return;
    }
    resolvedKey = cfg.ai_api_key;
    resolvedProvider = cfg.ai_provider ?? "openai";
    resolvedModel = userModel || cfg.ai_model || DEFAULT_OPENAI_MODEL;
    usingServerKey = true;
  }

  if (usingServerKey) {
    const ip = getClientIP(req);
    const rl = await checkAndLogUsage(ip);
    if (!rl.allowed) {
      res.status(429).json({
        error: "Rate limit exceeded",
        limitPerHour: rl.limitPerHour,
        limitPerDay: rl.limitPerDay,
      });
      return;
    }
  }

  // All gates passed — persist the user message, then open the SSE stream.
  await db.insert(messagesTable).values({ conversationId: id, role: "user", content: parsed.data.content });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Create AbortController to signal cancellation on client disconnect
  const controller = new AbortController();
  const onClose = () => { controller.abort(); };
  req.on("close", onClose);

  const chatMessages = [
    { role: "system" as const, content: SYSTEM_PROMPT },
    ...prevMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: parsed.data.content },
  ];

  let fullResponse = "";
  let streamCompleted = false;

  try {
    if (resolvedProvider === "gemini") {
      const model = resolvedModel || DEFAULT_GEMINI_MODEL;
      const genAI = new GoogleGenerativeAI(resolvedKey);
      const modelWithSystem = genAI.getGenerativeModel({ model, systemInstruction: SYSTEM_PROMPT });
      const history = chatMessages
        .filter((m) => m.role !== "system")
        .slice(0, -1)
        .map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
      const chat = modelWithSystem.startChat({ history });
      const result = await chat.sendMessageStream(parsed.data.content, { signal: controller.signal });
      for await (const chunk of result.stream) {
        if (controller.signal.aborted) break;
        const text = chunk.text();
        if (text) {
          fullResponse += text;
          if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
          }
        }
      }
    } else {
      const model = resolvedModel || DEFAULT_OPENAI_MODEL;
      const client = new OpenAI({ apiKey: resolvedKey });
      const stream = await client.chat.completions.create({
        model, max_completion_tokens: 8192, messages: chatMessages, stream: true,
      }, { signal: controller.signal });
      for await (const chunk of stream) {
        if (controller.signal.aborted) break;
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          fullResponse += content;
          if (!res.writableEnded) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
      }
    }

    // Stream completed successfully (not aborted)
    streamCompleted = true;
  } catch (err: any) {
    // If aborted due to client disconnect, just stop — no need to write error
    if (controller.signal.aborted) {
      req.off("close", onClose);
      return;
    }
    const msg = `Lỗi kết nối AI: ${err?.message || "Lỗi không xác định"}`;
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ content: `\n\n*${msg}*` })}\n\n`);
    }
    fullResponse += `\n\n*${msg}*`;
    // Still save the error response to maintain conversation history
    streamCompleted = true;
  }

  // Remove close listener after normal completion
  req.off("close", onClose);

  // Only save assistant message if stream completed successfully (not aborted)
  if (streamCompleted) {
    await db.insert(messagesTable).values({ conversationId: id, role: "assistant", content: fullResponse });
  }

  if (!res.writableEnded) {
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  }
});

export default router;
