import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("huyen-bi-pwa-dismissed");
    if (stored) { setDismissed(true); return; }
    const handler = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BeforeInstallPromptEvent); };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") { setDeferredPrompt(null); setDismissed(true); }
  };

  const handleDismiss = () => {
    localStorage.setItem("huyen-bi-pwa-dismissed", "1");
    setDismissed(true);
    setDeferredPrompt(null);
  };

  if (!deferredPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-in slide-in-from-bottom-4 duration-500 no-print">
      <div className="bg-card border border-primary/30 rounded-2xl p-4 shadow-2xl shadow-black/40 backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-lg shrink-0">玄</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Cài ứng dụng Huyền Bí</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">Truy cập nhanh hơn, hoạt động offline và trải nghiệm như ứng dụng gốc.</p>
            <div className="flex gap-2 mt-3">
              <button onClick={handleInstall}
                className="flex-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all">
                Cài ngay
              </button>
              <button onClick={handleDismiss}
                className="px-3 py-1.5 rounded-lg border border-border/40 text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all">
                Bỏ qua
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
