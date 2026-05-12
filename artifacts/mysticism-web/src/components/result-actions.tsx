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

export interface PrintDocumentOptions {
  title: string;
  moduleName: string;
  result: string;
  /**
   * Rendered meta-row date (locale string). Injected to keep `buildPrintDocument`
   * a pure function that is trivial to reason about in tests.
   */
  dateLabel: string;
}

/**
 * Populate `doc` with the print-view markup imperatively. Every user-supplied
 * string (`title`, `moduleName`, `result`) flows through `textContent` or the
 * DOM-native `document.title` setter — never through `innerHTML`, a raw HTML
 * template, or `document.write`. This closes the XSS vector that existed in
 * the prior `document.write` template. See post-opus-audit-remediation
 * design §3 (H1).
 *
 * Exported so the property test in `./result-actions.test.ts` can exercise
 * the builder directly against a mock document without spinning up a DOM
 * environment. The runtime click handler wraps this behind a `window.open`
 * call and a `printWindow.opener = null` detachment.
 */
export function buildPrintDocument(doc: Document, opts: PrintDocumentOptions): void {
  const { title, moduleName, result, dateLabel } = opts;

  doc.documentElement.lang = "vi";

  const head = doc.head;
  while (head.firstChild) head.removeChild(head.firstChild);

  const metaCharset = doc.createElement("meta");
  metaCharset.setAttribute("charset", "UTF-8");
  head.appendChild(metaCharset);

  // `document.title` is a DOM-native setter — the browser creates a text
  // node, so no HTML interpretation occurs. No `escapeHtml` needed here.
  doc.title = `${title} — Huyền Bí`;

  const style = doc.createElement("style");
  style.textContent = [
    "body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #1a0a00; line-height: 1.8; }",
    "h1 { font-size: 1.6rem; border-bottom: 2px solid #b8860b; padding-bottom: 8px; color: #5c3a00; }",
    ".meta { color: #666; font-size: 0.85rem; margin-bottom: 20px; }",
    ".content { white-space: pre-wrap; }",
    ".watermark { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 0.75rem; color: #999; text-align: center; }",
  ].join("\n");
  head.appendChild(style);

  const body = doc.body;
  while (body.firstChild) body.removeChild(body.firstChild);

  const h1 = doc.createElement("h1");
  h1.textContent = title;
  body.appendChild(h1);

  const metaRow = doc.createElement("div");
  metaRow.className = "meta";
  metaRow.textContent = `Huyền Bí — ${moduleName} — ${dateLabel}`;
  body.appendChild(metaRow);

  // `white-space: pre-wrap` in the stylesheet preserves newlines, so a plain
  // `textContent` assignment renders the reading exactly as typed without
  // giving the browser a chance to parse any `<` as a tag start.
  const content = doc.createElement("div");
  content.className = "content";
  content.textContent = result;
  body.appendChild(content);

  const watermark = doc.createElement("div");
  watermark.className = "watermark";
  watermark.textContent = "Huyền Bí · Mọi luận giải chỉ mang tính tham khảo";
  body.appendChild(watermark);
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
    // Open a blank popup without `noopener,noreferrer`. Passing those features
    // causes some browsers to return `null`, which would deny us the handle
    // needed to call `print()`. Instead, we open and immediately null the
    // `opener` back-reference so the popup cannot tabnab the parent.
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.opener = null;

    buildPrintDocument(printWindow.document, {
      title,
      moduleName,
      result,
      dateLabel: new Date().toLocaleDateString("vi-VN"),
    });

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
