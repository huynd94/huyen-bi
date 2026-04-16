import { Router } from "express";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiInterpretMysticismBody } from "@workspace/api-zod";
import { getManyConfig } from "../../lib/server-config";
import { checkAndLogUsage, getClientIP } from "../../lib/rate-limit";

const router = Router();

const SYSTEM_PROMPTS: Record<string, string> = {
  numerology: `Bạn là chuyên gia Thần số học (Numerology) hàng đầu, am hiểu sâu sắc cả Numerology Pythagore (phương Tây) lẫn quan niệm con số phương Đông. Hãy phân tích chi tiết, sâu sắc các con số vận mệnh của người dùng. Nói về năng lượng đặc trưng, sứ mệnh cuộc đời, điểm mạnh tiềm ẩn, thách thức cần vượt qua, và những lời khuyên thiết thực giúp họ sống hài hòa với vận số. Giọng văn huyền bí nhưng ấm áp, như người thầy thông thái. Trả lời bằng tiếng Việt.`,

  batu: `Bạn là nhà Tử Vi Bát Tự (Tứ Trụ) uyên thâm, am tường Thiên Can Địa Chi, Ngũ Hành, Lục Thần, và các học thuyết mệnh lý phương Đông. Hãy giải đọc bát tự của người dùng một cách sâu sắc: phân tích sự cân bằng ngũ hành, những hành mạnh yếu, ngũ lực, cung mệnh, và ảnh hưởng lên cuộc đời, sự nghiệp, hôn nhân, sức khỏe. Đưa ra những lời khuyên để cân bằng âm dương ngũ hành. Trả lời bằng tiếng Việt.`,

  iching: `Bạn là bậc thầy Kinh Dịch (I Ching), am hiểu 64 quẻ Dịch, lục hào, và nghệ thuật giải quẻ trong bối cảnh cuộc sống hiện đại. Hãy giải thích ý nghĩa sâu xa của quẻ người dùng nhận được: lời khuyên của quẻ, cách áp dụng triết lý quẻ vào tình huống thực tế, và thông điệp mà vũ trụ muốn truyền đến. Giọng văn thấu đáo, huyền nhiệm, như tiếng vọng từ sách cổ. Trả lời bằng tiếng Việt.`,

  "cat-hung": `Bạn là chuyên gia huyền số học người Việt, thông thạo cả phong thủy Á Đông lẫn thần số học hiện đại. Khi phân tích cát hung của số điện thoại hoặc biển số xe, hãy: (1) Giải thích ý nghĩa tâm linh và năng lượng của từng chữ số (Lộc-6, Phát-8, Cửu-9, Tử-4...), (2) Phân tích các tổ hợp số đặc biệt và cộng hưởng năng lượng giữa chúng, (3) Đánh giá tổng thể ảnh hưởng đến tài lộc, sự nghiệp, sức khỏe, tình duyên, (4) Đưa ra lời khuyên thực tế — nếu hung thì gợi ý cách hóa giải hoặc bổ sung phong thủy, nếu cát thì chỉ cách phát huy tối đa. Giọng văn sâu sắc, uyên bác nhưng gần gũi. Trả lời bằng tiếng Việt.`,
};

function getSystemPrompt(type: string): string {
  return SYSTEM_PROMPTS[type] ?? `Bạn là nhà huyền học uyên bác, trả lời bằng tiếng Việt với giọng văn sâu sắc và thấu đáo.`;
}

const DEFAULT_OPENAI_MODEL = "gpt-5.4-nano";
const DEFAULT_GEMINI_MODEL = "gemini-3.0-flash";

router.post("/mysticism/ai-interpret", async (req, res) => {
  const parsed = AiInterpretMysticismBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const { type, context, question } = parsed.data;
  const systemPrompt = getSystemPrompt(type);
  const userMessage = question ? `${context}\n\nCâu hỏi của tôi: ${question}` : context;

  const provider = (req.headers["x-ai-provider"] as string) || "openai";
  const userApiKey = (req.headers["x-ai-key"] as string) || "";
  const userModel = (req.headers["x-ai-model"] as string) || "";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    // Xác định API key sẽ dùng
    let resolvedKey = userApiKey;
    let resolvedProvider = provider;
    let resolvedModel = userModel;
    let usingServerKey = false;

    if (provider === "server" || !userApiKey) {
      const cfg = await getManyConfig(["ai_api_key", "ai_provider", "ai_model"]);
      if (!cfg.ai_api_key) {
        res.write(`data: ${JSON.stringify({ content: "Hệ thống chưa cấu hình API key. Vui lòng nhập API key của bạn trong phần Cài đặt AI, hoặc liên hệ quản trị viên để cấu hình key hệ thống." })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }
      resolvedKey = cfg.ai_api_key;
      resolvedProvider = cfg.ai_provider ?? "openai";
      resolvedModel = userModel || cfg.ai_model || DEFAULT_OPENAI_MODEL;
      usingServerKey = true;
    }

    // Kiểm tra rate limit khi dùng server key
    if (usingServerKey) {
      const ip = getClientIP(req);
      const rl = await checkAndLogUsage(ip);
      if (!rl.allowed) {
        res.write(`data: ${JSON.stringify({ content: `Bạn đã đạt giới hạn sử dụng AI. Giới hạn: ${rl.limitPerHour} lượt/giờ, ${rl.limitPerDay} lượt/ngày. Vui lòng thử lại sau hoặc nhập API key riêng trong phần Cài đặt AI.` })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }
    }

    if (resolvedProvider === "gemini") {
      const model = resolvedModel || DEFAULT_GEMINI_MODEL;
      const genAI = new GoogleGenerativeAI(resolvedKey);
      const geminiModel = genAI.getGenerativeModel({ model, systemInstruction: systemPrompt });
      const result = await geminiModel.generateContentStream(userMessage);

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      }
    } else {
      const model = resolvedModel || DEFAULT_OPENAI_MODEL;
      const client = new OpenAI({ apiKey: resolvedKey });
      const stream = await client.chat.completions.create({
        model,
        max_completion_tokens: 8192,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
  } catch (err: any) {
    const msg = err?.message || "Lỗi không xác định";
    res.write(`data: ${JSON.stringify({ content: `\n\n*Lỗi kết nối AI: ${msg}*` })}\n\n`);
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});

export default router;
