import React, { useMemo, type ReactElement, type ReactNode } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

interface Token {
  type: "h1" | "h2" | "h3" | "hr" | "ul" | "ol" | "blockquote" | "paragraph" | "empty";
  content: string;
  items?: string[];
}

function parseInline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const tokenPattern = /(\*\*\*.+?\*\*\*|\*\*.+?\*\*|\*.+?\*|`.+?`|\[.+?\]\(.+?\))/g;
  let lastIndex = 0;

  for (const match of text.matchAll(tokenPattern)) {
    const token = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      nodes.push(text.slice(lastIndex, index));
    }

    const key = nodes.length;
    if (token.startsWith("[") && token.includes("](")) {
      const labelEnd = token.indexOf("](");
      const label = token.slice(1, labelEnd);
      const href = token.slice(labelEnd + 2, -1);
      nodes.push(
        <a key={key} href={href} className="text-primary underline underline-offset-2 hover:text-primary/80">
          {label}
        </a>
      );
    } else if (token.startsWith("***") && token.endsWith("***")) {
      nodes.push(<strong key={key}><em>{token.slice(3, -3)}</em></strong>);
    } else if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    }

    lastIndex = index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes;
}

function tokenize(markdown: string): Token[] {
  const lines = markdown.split("\n");
  const tokens: Token[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (/^# /.test(line)) {
      tokens.push({ type: "h1", content: line.replace(/^# /, "") });
      i++;
    } else if (/^## /.test(line)) {
      tokens.push({ type: "h2", content: line.replace(/^## /, "") });
      i++;
    } else if (/^### /.test(line)) {
      tokens.push({ type: "h3", content: line.replace(/^### /, "") });
      i++;
    } else if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      tokens.push({ type: "hr", content: "" });
      i++;
    } else if (/^>/.test(line)) {
      tokens.push({ type: "blockquote", content: line.replace(/^>\s?/, "") });
      i++;
    } else if (/^[-*•]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*•]\s/, ""));
        i++;
      }
      tokens.push({ type: "ul", content: "", items });
    } else if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      tokens.push({ type: "ol", content: "", items });
    } else if (line.trim() === "") {
      tokens.push({ type: "empty", content: "" });
      i++;
    } else {
      let paragraph = line;
      i++;
      while (i < lines.length && lines[i].trim() !== "" && !/^[#>*-\d]/.test(lines[i])) {
        paragraph += " " + lines[i];
        i++;
      }
      tokens.push({ type: "paragraph", content: paragraph });
    }
  }

  return tokens;
}

function renderToken(token: Token, idx: number): ReactElement | null {
  switch (token.type) {
    case "h1":
      return (
        <h1
          key={idx}
          className="text-2xl font-serif font-bold text-primary mt-6 mb-3 leading-snug border-b border-primary/20 pb-2"
        >
          {parseInline(token.content)}
        </h1>
      );
    case "h2":
      return (
        <h2
          key={idx}
          className="text-xl font-serif font-semibold text-primary/90 mt-5 mb-2 leading-snug"
        >
          {parseInline(token.content)}
        </h2>
      );
    case "h3":
      return (
        <h3
          key={idx}
          className="text-base font-semibold text-primary/80 mt-4 mb-1.5 uppercase tracking-wider"
        >
          {parseInline(token.content)}
        </h3>
      );
    case "hr":
      return (
        <div key={idx} className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
      );
    case "blockquote":
      return (
        <blockquote
          key={idx}
          className="border-l-2 border-primary/50 pl-4 my-3 italic text-foreground/75 bg-primary/5 py-2 pr-3 rounded-r-md"
        >
          {parseInline(token.content)}
        </blockquote>
      );
    case "ul":
      return (
        <ul key={idx} className="my-3 space-y-2">
          {(token.items || []).map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-foreground/85 leading-relaxed">
              <span className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary/60" />
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol key={idx} className="my-3 space-y-2">
          {(token.items || []).map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-foreground/85 leading-relaxed">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-xs font-semibold text-primary mt-0.5">
                {i + 1}
              </span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      );
    case "paragraph":
      return (
        <p
          key={idx}
          className="text-foreground/85 leading-relaxed my-2"
        >
          {parseInline(token.content)}
        </p>
      );
    case "empty":
      return null;
    default:
      return null;
  }
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const tokens = useMemo(() => tokenize(content), [content]);

  return (
    <div className={`markdown-body text-sm ${className}`}>
      {tokens.map((token, idx) => renderToken(token, idx))}
    </div>
  );
}
