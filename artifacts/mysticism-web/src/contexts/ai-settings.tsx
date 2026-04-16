import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type AIProvider = "server" | "openai" | "gemini";

export interface AISettings {
  provider: AIProvider;
  openaiKey: string;
  geminiKey: string;
  openaiModel: string;
  geminiModel: string;
}

export interface ServerInfo {
  serverKeyConfigured: boolean;
  provider: string;
  model: string;
  rateLimitPerHour: number;
  rateLimitPerDay: number;
  adminConfigured: boolean;
}

interface AISettingsContextValue {
  settings: AISettings;
  updateSettings: (next: Partial<AISettings>) => void;
  activeKey: string;
  activeModel: string;
  isConfigured: boolean;
  serverInfo: ServerInfo | null;
  reloadServerInfo: () => Promise<void>;
}

const STORAGE_KEY = "huyen-bi-ai-settings";

export const DEFAULT_OPENAI_MODEL = "gpt-5.4-nano";
export const DEFAULT_GEMINI_MODEL = "gemini-3.0-flash";

const defaultSettings: AISettings = {
  provider: "server",
  openaiKey: "",
  geminiKey: "",
  openaiModel: DEFAULT_OPENAI_MODEL,
  geminiModel: DEFAULT_GEMINI_MODEL,
};

function loadSettings(): AISettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    const saved = JSON.parse(raw);
    // migrate cũ "default" → "server"
    if (saved.provider === "default") saved.provider = "server";
    return { ...defaultSettings, ...saved };
  } catch {
    return defaultSettings;
  }
}

const AISettingsContext = createContext<AISettingsContextValue>({
  settings: defaultSettings,
  updateSettings: () => {},
  activeKey: "",
  activeModel: "",
  isConfigured: false,
  serverInfo: null,
  reloadServerInfo: async () => {},
});

export function AISettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AISettings>(loadSettings);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);

  const reloadServerInfo = async () => {
    try {
      const res = await fetch("/api/config/public");
      if (res.ok) setServerInfo(await res.json());
    } catch {}
  };

  useEffect(() => {
    reloadServerInfo();
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (next: Partial<AISettings>) => {
    setSettings((prev) => ({ ...prev, ...next }));
  };

  const activeKey =
    settings.provider === "openai"
      ? settings.openaiKey
      : settings.provider === "gemini"
        ? settings.geminiKey
        : "";

  const activeModel =
    settings.provider === "openai"
      ? settings.openaiModel || DEFAULT_OPENAI_MODEL
      : settings.provider === "gemini"
        ? settings.geminiModel || DEFAULT_GEMINI_MODEL
        : serverInfo?.model || DEFAULT_OPENAI_MODEL;

  const isConfigured =
    settings.provider === "server"
      ? (serverInfo?.serverKeyConfigured ?? false)
      : settings.provider === "openai"
        ? !!settings.openaiKey.trim()
        : !!settings.geminiKey.trim();

  return (
    <AISettingsContext.Provider value={{ settings, updateSettings, activeKey, activeModel, isConfigured, serverInfo, reloadServerInfo }}>
      {children}
    </AISettingsContext.Provider>
  );
}

export function useAISettings() {
  return useContext(AISettingsContext);
}
