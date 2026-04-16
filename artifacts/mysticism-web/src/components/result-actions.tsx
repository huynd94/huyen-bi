import { useState } from "react";
import { saveToHistory } from "@/lib/history";

interface ResultActionsProps {
  module: string;
  moduleName: string;
  title: string;
  summary: string;
  result: string;
  className?: string;
}

export function ResultActions({ module, moduleName, title, summary, result, className = "" }: ResultActionsProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleCopy = async () => {
    const text = `${title}\n${"─".repeat(40)}\n${result}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <meta charset="UTF-8" />
        <title>${title} — Huyền Bí</title>
        <style>
          body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #1a0a00; line-height: 1.8; }
          h1 { font-size: 1.6rem; border-bottom: 2px solid #b8860b; padding-bottom: 8px; color: #5c3a00; }
          .meta { color: #666; font-size: 0.85rem; margin-bottom: 20px; }
          .content { white-space: pre-wrap; }
          .watermark { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 0.75rem; color: #999; text-align: center; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <div class="meta">Huyền Bí — ${moduleName} — ${new Date().toLocaleDateString("vi-VN")}</div>
        <div class="content">${result.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")}</div>
        <div class="watermark">Huyền Bí · Mọi luận giải chỉ mang tính tham khảo</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleShare = async () => {
    const shareData = {
      title: `${title} — Huyền Bí`,
      text: summary,
      url: window.location.href,
    };
    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {}
    } else {
      await handleCopy();
    }
  };

  const handleSave = () => {
    saveToHistory({ module, moduleName, title, summary, result });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      <ActionButton onClick={handleCopy} icon="◎" label={copied ? "Đã sao chép!" : "Sao chép"} active={copied} />
      <ActionButton onClick={handleShare} icon="◈" label="Chia sẻ" />
      <ActionButton onClick={handlePrint} icon="◐" label="In / PDF" />
      <ActionButton onClick={handleSave} icon="◉" label={saved ? "Đã lưu!" : "Lưu lại"} active={saved} />
    </div>
  );
}

function ActionButton({
  onClick,
  icon,
  label,
  active,
}: {
  onClick: () => void;
  icon: string;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${
        active
          ? "border-primary bg-primary/20 text-primary"
          : "border-border/40 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5"
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}
