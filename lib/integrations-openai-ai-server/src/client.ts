import OpenAI from "openai";

const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

// Chỉ khởi tạo client khi có đủ env vars (Replit AI Integration).
// Khi chạy ngoài Replit (Docker/VPS), client sẽ là null —
// người dùng dùng OpenAI hoặc Gemini key riêng qua giao diện cài đặt AI.
export const openai: OpenAI | null =
  baseURL && apiKey
    ? new OpenAI({ apiKey, baseURL })
    : null;
