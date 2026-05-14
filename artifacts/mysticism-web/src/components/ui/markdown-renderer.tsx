import React, { memo, useMemo, type ReactElement, type ReactNode } from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// ---------------------------------------------------------------------------
// Inline parser (bold, italic, bold-italic, inline code, link)
// ---------------------------------------------------------------------------

/**
 * Detect whether a markdown link `href` points to an origin different from
 * the current page. Defensive against malformed URLs and SSR contexts where
 * `window` is unavailable.
 *
 * Strategy:
 * - Resolve the (possibly relative) href against the current origin via
 *   `new URL(...)`.
 * - Compare `URL.host` to `window.location.host`. Any mismatch (including
 *   non-http schemes whose `host` is empty, e.g. `mailto:`) is treated as
 *   external.
 * - On parse error, fall back to "internal" so we never accidentally drop
 *   `target="_blank"` semantics on a broken href.
 */
function isExternalLink(href: string): boolean {
  if (!href) return false;
  try {
    const origin =
      typeof window !== "undefined" && window.location?.origin
        ? window.location.origin
        : "http://localhost";
    const currentHost =
      typeof window !== "undefined" && window.location?.host
        ? window.location.host
        : "localhost";
    const url = new URL(href, origin);
    return url.host !== currentHost;
  } catch {
    return false;
  }
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
      const external = isExternalLink(href);
      nodes.push(
        <a
          key={key}
          href={href}
          className="text-primary underline underline-offset-2 hover:text-primary/80"
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
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

// ---------------------------------------------------------------------------
// Block parser
// ---------------------------------------------------------------------------

type Block =
  | { kind: "heading"; level: 1 | 2 | 3 | 4; text: string }
  | { kind: "hr" }
  | { kind: "blockquote"; lines: string[] }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "code"; lang: string; code: string }
  | { kind: "table"; headers: string[]; rows: string[][] }
  | { kind: "paragraph"; text: string };

const TABLE_DIVIDER_RE = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/;

function splitTableRow(line: string): string[] {
  let trimmed = line.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  return trimmed.split("|").map((cell) => cell.trim());
}

/**
 * Parse a single `\n\n`-delimited block of markdown into a structured Block.
 * Returns `null` for empty input.
 */
function parseBlock(raw: string): Block | null {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");

  // Trim leading / trailing blank lines.
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === "") start++;
  while (end > start && lines[end - 1].trim() === "") end--;
  const body = lines.slice(start, end);
  if (body.length === 0) return null;

  const first = body[0];

  // Fenced code block: ```lang\n...code...\n``` (closing fence optional during streaming).
  const fenceMatch = /^```(\w*)\s*$/.exec(first);
  if (fenceMatch) {
    let endIdx = -1;
    for (let i = 1; i < body.length; i++) {
      if (/^```\s*$/.test(body[i])) {
        endIdx = i;
        break;
      }
    }
    const codeLines = endIdx === -1 ? body.slice(1) : body.slice(1, endIdx);
    return { kind: "code", lang: fenceMatch[1] || "", code: codeLines.join("\n") };
  }

  // Horizontal rule: a single line of --- or ***.
  if (
    body.length === 1 &&
    (/^---+$/.test(first.trim()) || /^\*\*\*+$/.test(first.trim()))
  ) {
    return { kind: "hr" };
  }

  // Heading: `# `, `## `, `### `, `#### ` (only when alone in the block).
  const headingMatch = /^(#{1,4})\s+(.+?)\s*$/.exec(first);
  if (headingMatch) {
    return {
      kind: "heading",
      level: headingMatch[1].length as 1 | 2 | 3 | 4,
      text: headingMatch[2],
    };
  }

  // Pipe table: header row + divider row (+ optional body rows).
  if (
    body.length >= 2 &&
    /\|/.test(first) &&
    TABLE_DIVIDER_RE.test(body[1])
  ) {
    const headers = splitTableRow(first);
    const rows = body
      .slice(2)
      .filter((line) => line.includes("|"))
      .map(splitTableRow);
    return { kind: "table", headers, rows };
  }

  // Blockquote: every line starts with `>`.
  if (body.every((line) => /^>/.test(line))) {
    return {
      kind: "blockquote",
      lines: body.map((line) => line.replace(/^>\s?/, "")),
    };
  }

  // Unordered list: every line starts with -, *, or • bullet.
  if (body.every((line) => /^[-*•]\s/.test(line))) {
    return {
      kind: "ul",
      items: body.map((line) => line.replace(/^[-*•]\s/, "")),
    };
  }

  // Ordered list: every line starts with `<digits>. `.
  if (body.every((line) => /^\d+\.\s/.test(line))) {
    return {
      kind: "ol",
      items: body.map((line) => line.replace(/^\d+\.\s/, "")),
    };
  }

  // Default: collapse multi-line block into a single paragraph (newlines → spaces).
  return { kind: "paragraph", text: body.join(" ") };
}

// ---------------------------------------------------------------------------
// Block renderer (Color_Token + Type_Scale)
// ---------------------------------------------------------------------------

function renderBlock(block: Block): ReactElement | null {
  switch (block.kind) {
    case "heading": {
      if (block.level === 1) {
        return (
          <h1 className="text-2xl font-serif font-bold text-primary mt-6 mb-3 leading-snug border-b border-border pb-2">
            {parseInline(block.text)}
          </h1>
        );
      }
      if (block.level === 2) {
        return (
          <h2 className="text-xl font-serif font-semibold text-primary/90 mt-5 mb-2 leading-snug">
            {parseInline(block.text)}
          </h2>
        );
      }
      if (block.level === 3) {
        return (
          <h3 className="text-base font-semibold text-primary/80 mt-4 mb-1.5 uppercase tracking-wider">
            {parseInline(block.text)}
          </h3>
        );
      }
      return (
        <h4 className="text-base font-semibold text-foreground mt-3 mb-1.5">
          {parseInline(block.text)}
        </h4>
      );
    }
    case "hr":
      return (
        <div className="my-5 flex items-center gap-3" role="separator" aria-hidden="true">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </div>
      );
    case "blockquote":
      return (
        <blockquote className="border-l-2 border-primary/50 pl-4 my-3 italic text-foreground/75 bg-muted py-2 pr-3 rounded-r-md">
          {block.lines.map((line, i) => (
            <p key={i} className="leading-relaxed">
              {parseInline(line)}
            </p>
          ))}
        </blockquote>
      );
    case "ul":
      return (
        <ul className="my-3 space-y-2">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-foreground/85 leading-relaxed text-base"
            >
              <span
                className="mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-primary/60"
                aria-hidden="true"
              />
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    case "ol":
      return (
        <ol className="my-3 space-y-2">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-foreground/85 leading-relaxed text-base"
            >
              <span
                className="shrink-0 w-5 h-5 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-xs font-semibold text-primary mt-0.5"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      );
    case "code":
      return (
        <pre
          className="my-3 p-3 rounded-md border border-border bg-muted overflow-x-auto"
          {...(block.lang ? { "data-lang": block.lang } : {})}
        >
          <code className="font-mono text-sm text-foreground whitespace-pre">
            {block.code}
          </code>
        </pre>
      );
    case "table":
      return (
        <div className="my-4 overflow-x-auto rounded-md border border-border">
          <table className="w-full border-collapse text-base">
            <thead className="bg-muted">
              <tr>
                {block.headers.map((header, i) => (
                  <th
                    key={i}
                    scope="col"
                    className="px-3 py-2 text-left font-semibold text-foreground border-b border-border"
                  >
                    {parseInline(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr key={ri} className="border-b border-border last:border-b-0">
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className="px-3 py-2 text-foreground/90 align-top"
                    >
                      {parseInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "paragraph":
      return (
        <p className="text-foreground/85 leading-relaxed my-2 text-base">
          {parseInline(block.text)}
        </p>
      );
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Memoized block — incremental rendering for AI streaming
// ---------------------------------------------------------------------------

interface MemoizedBlockProps {
  raw: string;
}

/**
 * Renders a single `\n\n`-delimited markdown block. Wrapped in `React.memo`
 * so unchanged trailing blocks are skipped while the AI is streaming new
 * tokens at the tail of `content`.
 *
 * Equality is by primitive `raw` string — when AI appends to the final
 * block only, every preceding block keeps the same `raw` and React skips
 * its render.
 */
const MemoizedBlock = memo(function MemoizedBlock({ raw }: MemoizedBlockProps) {
  const block = useMemo(() => parseBlock(raw), [raw]);
  if (!block) return null;
  return renderBlock(block);
});

function splitIntoBlocks(content: string): string[] {
  return content
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.replace(/^\n+|\n+$/g, ""))
    .filter((block) => block.length > 0);
}

/**
 * Render markdown thuần (heading, list, blockquote, paragraph, fenced
 * code block, pipe table, inline bold/italic/code/link) ra React node.
 * Dùng cho phần kết quả tra cứu và phản hồi AI streaming. Bộ parser tự
 * viết để giữ bundle gọn nhẹ, escape an toàn (React text-children),
 * và kiểm soát styling theo Color_Token + Type_Scale Huyền Bí.
 *
 * Hỗ trợ:
 * - Heading: `#`, `##`, `###`, `####`.
 * - Đường ngang: `---` hoặc `***`.
 * - Blockquote: `>` (hỗ trợ nhiều dòng liên tiếp).
 * - Danh sách không thứ tự (`-`, `*`, `•`) và có thứ tự (`1.`).
 * - Fenced code block: ```` ```lang ```` .. ```` ``` ```` — render bằng
 *   `<pre><code>` font mono trên nền `bg-muted` + `border-border`.
 * - Pipe table: `| col | col |` + dòng `| --- | --- |` — render với
 *   `<thead>`, `<th scope="col">`, viền `border-border`, header `bg-muted`.
 * - Inline: `**bold**`, `*italic*`, `***bold-italic***`, `` `code` ``,
 *   `[label](url)`. Link "ngoài" (xác định qua so sánh `URL.host` với
 *   `window.location.host`) tự động nhận `target="_blank"
 *   rel="noopener noreferrer"`; href khó parse rơi về đường nội bộ
 *   để tránh mất ngữ nghĩa anchor.
 *
 * Render incremental (Requirement 11.6): nội dung được chia thành block
 * theo `\n\n`, mỗi block bọc bằng `React.memo` (so sánh `raw` string
 * theo `Object.is`). Khi AI streaming chỉ thay đổi đuôi `content`, các
 * block phía trước giữ nguyên `raw` reference và React skip re-render.
 *
 * Lưu ý a11y: heading được render đúng cấp `<h1>`/`<h2>`/`<h3>`/`<h4>`.
 * Khi nhúng trong khu vực có `<h1>` trang, hãy đảm bảo `content` không
 * bắt đầu bằng `#` để không tạo hai `<h1>` trùng (Requirement 1.4).
 *
 * @example
 * ```tsx
 * <MarkdownRenderer content={aiResponse} className="prose-sm" />
 * ```
 */
export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const blocks = useMemo(() => splitIntoBlocks(content), [content]);

  return (
    <div
      className={`markdown-body text-base leading-relaxed text-foreground ${className}`}
    >
      {blocks.map((raw, idx) => (
        <MemoizedBlock key={idx} raw={raw} />
      ))}
    </div>
  );
}
