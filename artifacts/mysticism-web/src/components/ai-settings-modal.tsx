import { useState } from "react";
import { useAISettings, type AIProvider, DEFAULT_OPENAI_MODEL, DEFAULT_GEMINI_MODEL } from "@/contexts/ai-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
  open: boolean;
  onClose: () => void;
}

const OPENAI_MODELS = [
  { value: "gpt-5.4-nano", label: "GPT-5.4 Nano", badge: "Mặc định", badgeColor: "bg-green-500/20 text-green-300", desc: "Nhanh, tiết kiệm, chất lượng cao. Lý tưởng cho hầu hết tác vụ huyền học." },
  { value: "gpt-5.4", label: "GPT-5.4", badge: "Mạnh nhất", badgeColor: "bg-amber-500/20 text-amber-300", desc: "Model OpenAI thế hệ mới nhất, suy luận sâu, xử lý văn bản phức tạp tốt nhất." },
  { value: "gpt-5.4-mini", label: "GPT-5.4 Mini", badge: "Cân bằng", badgeColor: "bg-blue-500/20 text-blue-300", desc: "Cân bằng giữa tốc độ và chất lượng, chi phí vừa phải." },
  { value: "gpt-4.1", label: "GPT-4.1", badge: "Ổn định", badgeColor: "bg-slate-500/20 text-slate-300", desc: "Phiên bản trước, thử nghiệm đã nhiều, đáng tin cậy." },
];

const GEMINI_MODELS = [
  { value: "gemini-3.0-flash", label: "Gemini 3.0 Flash", badge: "Mặc định", badgeColor: "bg-green-500/20 text-green-300", desc: "Tốc độ cao, thông minh, kinh tế. Model Gemini thế hệ mới được khuyến nghị." },
  { value: "gemini-3.0-pro", label: "Gemini 3.0 Pro", badge: "Mạnh nhất", badgeColor: "bg-amber-500/20 text-amber-300", desc: "Model Gemini 3 mạnh nhất, suy luận sâu, context 2M token, tốt nhất cho phân tích phức tạp." },
  { value: "gemini-3.0-flash-lite", label: "Gemini 3.0 Flash-Lite", badge: "Tiết kiệm", badgeColor: "bg-slate-500/20 text-slate-300", desc: "Tối ưu chi phí và độ trễ thấp nhất trong dòng Gemini 3." },
];

function ModelSelector({ models, value, onChange, selectedBorderColor }: {
  models: typeof OPENAI_MODELS; value: string; onChange: (v: string) => void; selectedBorderColor: string;
}) {
  return (
    <div className="grid gap-2">
      {models.map((m) => {
        const isSelected = value === m.value;
        return (
          <button key={m.value} type="button" onClick={() => onChange(m.value)}
            className={`w-full text-left rounded-lg border px-3 py-2.5 transition-all flex items-start gap-3 ${isSelected ? `${selectedBorderColor} bg-white/5` : "border-border/30 bg-background/20 hover:border-border/60"}`}>
            <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 mt-0.5 ${isSelected ? "border-primary bg-primary" : "border-muted-foreground"}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground">{m.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${m.badgeColor}`}>{m.badge}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{m.desc}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export function AISettingsModal({ open, onClose }: Props) {
  const { settings, updateSettings, serverInfo, reloadServerInfo } = useAISettings();
  const [local, setLocal] = useState({ ...settings });
  const [showOpenAIKey, setShowOpenAIKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showAdminSection, setShowAdminSection] = useState(false);

  // Admin state
  const [adminPassword, setAdminPassword] = useState("");
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [adminApiKey, setAdminApiKey] = useState("");
  const [showAdminApiKey, setShowAdminApiKey] = useState(false);
  const [adminProvider, setAdminProvider] = useState(serverInfo?.provider ?? "openai");
  const [adminModel, setAdminModel] = useState(serverInfo?.model ?? DEFAULT_OPENAI_MODEL);
  const [adminRateLimitHour, setAdminRateLimitHour] = useState(serverInfo?.rateLimitPerHour ?? 20);
  const [adminRateLimitDay, setAdminRateLimitDay] = useState(serverInfo?.rateLimitPerDay ?? 100);
  const [adminStatus, setAdminStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [adminMsg, setAdminMsg] = useState("");

  if (!open) return null;

  const handleSave = () => { updateSettings(local); onClose(); };

  const handleReset = () => {
    const reset = { provider: "server" as AIProvider, openaiKey: "", geminiKey: "", openaiModel: DEFAULT_OPENAI_MODEL, geminiModel: DEFAULT_GEMINI_MODEL };
    setLocal(reset); updateSettings(reset); onClose();
  };

  const setProvider = (p: AIProvider) => setLocal((v) => ({ ...v, provider: p }));

  const currentOpenAIModel = local.openaiModel || DEFAULT_OPENAI_MODEL;
  const currentGeminiModel = local.geminiModel || DEFAULT_GEMINI_MODEL;

  const handleAdminSave = async () => {
    if (!adminPassword) { setAdminMsg("Nhập mật khẩu admin."); setAdminStatus("error"); return; }
    setAdminStatus("loading"); setAdminMsg("");
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminPassword,
          provider: adminProvider,
          apiKey: adminApiKey,
          model: adminModel,
          rateLimitPerHour: adminRateLimitHour,
          rateLimitPerDay: adminRateLimitDay,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setAdminStatus("success");
        setAdminMsg(serverInfo?.adminConfigured ? "Cập nhật thành công." : "Cấu hình thành công. Mật khẩu admin đã được đặt.");
        setAdminApiKey("");
        await reloadServerInfo();
      } else {
        setAdminStatus("error");
        setAdminMsg(data.error ?? "Lỗi không xác định.");
      }
    } catch {
      setAdminStatus("error"); setAdminMsg("Không thể kết nối máy chủ.");
    }
  };

  const PROVIDER_OPTIONS: { value: AIProvider; label: string; desc: string; color: string }[] = [
    {
      value: "server",
      label: "Key hệ thống",
      desc: serverInfo?.serverKeyConfigured
        ? `Dùng key của máy chủ — ${serverInfo.rateLimitPerHour} lượt/giờ, ${serverInfo.rateLimitPerDay} lượt/ngày`
        : "Chưa cấu hình — liên hệ quản trị viên",
      color: "border-primary/60 bg-primary/10",
    },
    { value: "openai", label: "OpenAI ChatGPT", desc: "Dùng API key OpenAI của bạn.", color: "border-green-500/60 bg-green-500/10" },
    { value: "gemini", label: "Google Gemini", desc: "Dùng API key Google AI của bạn.", color: "border-blue-500/60 bg-blue-500/10" },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background border border-primary/30 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-6 pb-4 border-b border-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-primary">Cài đặt AI</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Chọn nhà cung cấp và nhập khóa API.</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none p-1">✕</button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-6">

          {/* Provider selection */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Nguồn AI</p>
            <div className="grid gap-2">
              {PROVIDER_OPTIONS.map((p) => {
                const isActive = local.provider === p.value;
                return (
                  <button key={p.value} onClick={() => setProvider(p.value)}
                    className={`w-full text-left rounded-xl border-2 px-4 py-3 transition-all ${isActive ? p.color : "border-border/40 bg-card/20 hover:border-primary/30"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 transition-all ${isActive ? "border-primary bg-primary" : "border-muted-foreground"}`} />
                      <div>
                        <div className="font-semibold text-sm text-foreground">{p.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{p.desc}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* OpenAI key + model */}
          {local.provider === "openai" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="openai-key" className="text-sm text-foreground/80">Khóa API OpenAI</Label>
                <div className="relative">
                  <Input id="openai-key" type={showOpenAIKey ? "text" : "password"} value={local.openaiKey}
                    onChange={(e) => setLocal((v) => ({ ...v, openaiKey: e.target.value }))}
                    placeholder="sk-..." className="bg-background/50 border-border/50 focus:border-primary/50 pr-20" />
                  <button type="button" onClick={() => setShowOpenAIKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">
                    {showOpenAIKey ? "Ẩn" : "Hiện"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Lấy khóa tại <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">platform.openai.com/api-keys</a></p>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Chọn model OpenAI</p>
                <ModelSelector models={OPENAI_MODELS} value={currentOpenAIModel} onChange={(v) => setLocal((s) => ({ ...s, openaiModel: v }))} selectedBorderColor="border-green-500/50" />
              </div>
            </>
          )}

          {/* Gemini key + model */}
          {local.provider === "gemini" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="gemini-key" className="text-sm text-foreground/80">Khóa API Google AI (Gemini)</Label>
                <div className="relative">
                  <Input id="gemini-key" type={showGeminiKey ? "text" : "password"} value={local.geminiKey}
                    onChange={(e) => setLocal((v) => ({ ...v, geminiKey: e.target.value }))}
                    placeholder="AIza..." className="bg-background/50 border-border/50 focus:border-primary/50 pr-20" />
                  <button type="button" onClick={() => setShowGeminiKey((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">
                    {showGeminiKey ? "Ẩn" : "Hiện"}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Lấy khóa tại <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">aistudio.google.com/app/apikey</a></p>
              </div>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Chọn model Gemini</p>
                <ModelSelector models={GEMINI_MODELS} value={currentGeminiModel} onChange={(v) => setLocal((s) => ({ ...s, geminiModel: v }))} selectedBorderColor="border-blue-500/50" />
              </div>
            </>
          )}

          {/* Privacy notice */}
          <div className="bg-primary/5 border border-primary/15 rounded-lg px-4 py-3 text-xs text-muted-foreground leading-relaxed">
            Khóa API cá nhân được lưu trong trình duyệt và chỉ gửi đến máy chủ khi gọi AI. Chúng tôi không lưu trữ khóa của bạn.
          </div>

          {/* Admin section */}
          <div className="border border-border/30 rounded-xl overflow-hidden">
            <button onClick={() => setShowAdminSection((v) => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors">
              <span className="font-medium">Cài đặt Admin (Key hệ thống)</span>
              <span className="text-xs opacity-60">{showAdminSection ? "Thu gọn" : "Mở rộng"}</span>
            </button>

            {showAdminSection && (
              <div className="px-4 pb-4 space-y-4 border-t border-border/20 pt-4">
                {!serverInfo?.adminConfigured && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2 text-xs text-yellow-300">
                    Chưa có admin. Lần đầu nhập mật khẩu sẽ tự động đặt làm mật khẩu admin.
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground/70">Mật khẩu Admin</Label>
                  <div className="relative">
                    <Input type={showAdminPw ? "text" : "password"} value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)} placeholder="Mật khẩu admin..."
                      className="bg-background/50 border-border/50 text-sm pr-16" />
                    <button type="button" onClick={() => setShowAdminPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">{showAdminPw ? "Ẩn" : "Hiện"}</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground/70">Nhà cung cấp</Label>
                    <select value={adminProvider} onChange={(e) => setAdminProvider(e.target.value)}
                      className="w-full bg-background/50 border border-border/50 rounded-md px-3 py-2 text-sm text-foreground">
                      <option value="openai">OpenAI</option>
                      <option value="gemini">Gemini</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground/70">Model</Label>
                    <Input value={adminModel} onChange={(e) => setAdminModel(e.target.value)}
                      placeholder="gpt-5.4-nano" className="bg-background/50 border-border/50 text-sm" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-foreground/70">
                    API Key{serverInfo?.serverKeyConfigured ? " (để trống = giữ nguyên)" : ""}
                  </Label>
                  <div className="relative">
                    <Input type={showAdminApiKey ? "text" : "password"} value={adminApiKey}
                      onChange={(e) => setAdminApiKey(e.target.value)} placeholder="sk-... hoặc AIza..."
                      className="bg-background/50 border-border/50 text-sm pr-16" />
                    <button type="button" onClick={() => setShowAdminApiKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground">{showAdminApiKey ? "Ẩn" : "Hiện"}</button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground/70">Giới hạn / giờ</Label>
                    <Input type="number" min={1} max={1000} value={adminRateLimitHour}
                      onChange={(e) => setAdminRateLimitHour(Number(e.target.value))}
                      className="bg-background/50 border-border/50 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-foreground/70">Giới hạn / ngày</Label>
                    <Input type="number" min={1} max={10000} value={adminRateLimitDay}
                      onChange={(e) => setAdminRateLimitDay(Number(e.target.value))}
                      className="bg-background/50 border-border/50 text-sm" />
                  </div>
                </div>

                {adminMsg && (
                  <div className={`text-xs px-3 py-2 rounded-lg ${adminStatus === "success" ? "bg-green-500/15 text-green-300 border border-green-500/30" : "bg-red-500/15 text-red-300 border border-red-500/30"}`}>
                    {adminMsg}
                  </div>
                )}

                <Button onClick={handleAdminSave} disabled={adminStatus === "loading"}
                  className="w-full bg-primary/20 text-primary hover:bg-primary/30 border border-primary/40 text-sm">
                  {adminStatus === "loading" ? "Đang lưu..." : "Lưu cấu hình Admin"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-primary/10 flex gap-3">
          <Button onClick={handleSave} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold">
            Lưu cài đặt
          </Button>
          <Button onClick={handleReset} variant="outline" className="border-border/50 text-muted-foreground hover:text-foreground">
            Đặt lại
          </Button>
        </div>
      </div>
    </div>
  );
}
