#!/usr/bin/env tsx
/**
 * Design-system lint for `@workspace/mysticism-web`.
 *
 * Implements eight rules — see {@link RULES} below — that enforce the
 * UX/UI upgrade design tokens, spacing scale and i18n contract specified in
 * `.kiro/specs/ux-ui-upgrade/design.md` (Section "Static analysis (SMOKE)").
 *
 * Usage:
 *   tsx scripts/lint-design-system.ts            # run all rules
 *   tsx scripts/lint-design-system.ts --fix      # no-op for now (logs only)
 *   tsx scripts/lint-design-system.ts --rule=no-hex-in-tsx  # single rule
 *
 * Output format:
 *   <file>:<line>:<col> [<rule>] <message>
 *
 * Exits with code 1 when any violation is found, otherwise 0.
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Violation {
  file: string;
  line: number;
  col: number;
  rule: string;
  message: string;
}

interface RuleDefinition {
  name: string;
  description: string;
  run: (ctx: LintContext) => Violation[];
}

interface LintContext {
  /** Absolute project root (mysticism-web package). */
  root: string;
  /** Files to scan: { absPath, relPath, content, ext }. */
  sourceFiles: SourceFile[];
}

interface SourceFile {
  abs: string;
  rel: string;
  content: string;
  ext: ".ts" | ".tsx";
}

// ---------------------------------------------------------------------------
// Path setup
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, "..");
const SRC_DIR = join(ROOT, "src");
const INDEX_HTML = join(ROOT, "index.html");
const DIST_DIR = join(ROOT, "dist");

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

interface CliOptions {
  fix: boolean;
  rule: string | null;
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { fix: false, rule: null };
  for (const arg of argv) {
    if (arg === "--fix") opts.fix = true;
    else if (arg.startsWith("--rule=")) opts.rule = arg.slice("--rule=".length);
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }
  return opts;
}

function printHelp(): void {
  console.log(`lint-design-system — enforce UX/UI upgrade design rules.

Usage:
  tsx scripts/lint-design-system.ts [--fix] [--rule=<name>]

Flags:
  --fix          No-op for now (placeholder for future autofix).
  --rule=<name>  Run only the named rule. Available rules:
${RULES.map((r) => `                   - ${r.name}: ${r.description}`).join("\n")}
`);
}

// ---------------------------------------------------------------------------
// File walking
// ---------------------------------------------------------------------------

const TEST_SUFFIX_RE = /\.(?:test|exploration\.test|property\.test|a11y\.test)\.tsx?$/;

function walkSrc(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip transient/build dirs anywhere under src.
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      walkSrc(abs, out);
    } else if (entry.isFile()) {
      if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
        if (TEST_SUFFIX_RE.test(entry.name)) continue;
        out.push(abs);
      }
    }
  }
  return out;
}

function loadSources(): SourceFile[] {
  const abs = walkSrc(SRC_DIR);
  return abs.map((file) => {
    const ext = file.endsWith(".tsx") ? ".tsx" : ".ts";
    return {
      abs: file,
      rel: relative(ROOT, file).split(sep).join("/"),
      content: readFileSync(file, "utf8"),
      ext: ext as ".ts" | ".tsx",
    };
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Replace block comments and line comments in TS/TSX source with spaces while
 * preserving line numbers / column offsets, so regex matches still report
 * accurate positions for downstream rules.
 */
function stripComments(source: string): string {
  let out = "";
  let i = 0;
  const n = source.length;
  while (i < n) {
    const c = source[i];
    const next = source[i + 1];
    // Block comment.
    if (c === "/" && next === "*") {
      out += "  ";
      i += 2;
      while (i < n) {
        if (source[i] === "*" && source[i + 1] === "/") {
          out += "  ";
          i += 2;
          break;
        }
        // Preserve newlines so line numbers stay aligned.
        out += source[i] === "\n" ? "\n" : " ";
        i += 1;
      }
      continue;
    }
    // Line comment.
    if (c === "/" && next === "/") {
      while (i < n && source[i] !== "\n") {
        out += " ";
        i += 1;
      }
      continue;
    }
    // String literal — keep as-is so positions are accurate; rules that need
    // to ignore strings will perform their own masking.
    out += c;
    i += 1;
  }
  return out;
}

/** Compute (line, column) — both 1-based — for an offset in `text`. */
function offsetToPosition(text: string, offset: number): { line: number; col: number } {
  let line = 1;
  let col = 1;
  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === "\n") {
      line += 1;
      col = 1;
    } else {
      col += 1;
    }
  }
  return { line, col };
}

/**
 * Mask the **value** characters of every `attr="..."` / `attr='...'`
 * occurrence with spaces, preserving newlines and overall length. Used by the
 * emoji rule to ignore a11y attributes such as `aria-label` / `title`.
 */
function maskAttributeValues(source: string, attrs: string[]): string {
  const re = new RegExp(
    `\\b(${attrs.join("|")})\\s*=\\s*(\"|')((?:\\\\\\2|(?!\\2).)*)\\2`,
    "g",
  );
  return source.replace(re, (match, name, quote, value) => {
    // Replace value chars with spaces (keep newlines), keep attr=" ... " structure.
    const masked = (value as string)
      .split("")
      .map((ch) => (ch === "\n" ? "\n" : " "))
      .join("");
    return `${name}=${quote}${masked}${quote}`;
  });
}

// ---------------------------------------------------------------------------
// Rule: no-hex-in-tsx
// ---------------------------------------------------------------------------

const HEX_ALLOWLIST = new Set<string>([
  "src/index.css",
  // export-card-*.tsx — stamped artwork frequently inlines brand hex.
]);

function isHexAllowlisted(rel: string): boolean {
  if (HEX_ALLOWLIST.has(rel)) return true;
  if (/^src\/components\/export-card-[^/]+\.tsx$/.test(rel)) return true;
  return false;
}

const HEX_RE = /#[0-9A-Fa-f]{3,8}\b/g;

const ruleNoHexInTsx: RuleDefinition = {
  name: "no-hex-in-tsx",
  description: "Disallow raw hex colors in .tsx (use design tokens / CSS vars).",
  run({ sourceFiles }) {
    const violations: Violation[] = [];
    for (const file of sourceFiles) {
      if (file.ext !== ".tsx") continue;
      if (isHexAllowlisted(file.rel)) continue;
      const stripped = stripComments(file.content);
      let m: RegExpExecArray | null;
      HEX_RE.lastIndex = 0;
      while ((m = HEX_RE.exec(stripped)) !== null) {
        const { line, col } = offsetToPosition(stripped, m.index);
        violations.push({
          file: file.rel,
          line,
          col,
          rule: "no-hex-in-tsx",
          message: `Raw hex color "${m[0]}" — use a token from src/components/ui/design-tokens.ts or a CSS variable instead.`,
        });
      }
    }
    return violations;
  },
};

// ---------------------------------------------------------------------------
// Rule: no-arbitrary-spacing
// ---------------------------------------------------------------------------

const SPACING_RE =
  /\b(?:p|m|gap|px|py|mx|my|pt|pb|pl|pr|mt|mb|ml|mr)-\[\d+(?:\.\d+)?(?:px|rem|em)\]/g;

const ruleNoArbitrarySpacing: RuleDefinition = {
  name: "no-arbitrary-spacing",
  description:
    "Disallow Tailwind arbitrary spacing values (use the 4px scale via tokens).",
  run({ sourceFiles }) {
    const violations: Violation[] = [];
    for (const file of sourceFiles) {
      const stripped = stripComments(file.content);
      let m: RegExpExecArray | null;
      SPACING_RE.lastIndex = 0;
      while ((m = SPACING_RE.exec(stripped)) !== null) {
        const { line, col } = offsetToPosition(stripped, m.index);
        violations.push({
          file: file.rel,
          line,
          col,
          rule: "no-arbitrary-spacing",
          message: `Arbitrary spacing "${m[0]}" — stick to the 4px scale (p-1, p-2, gap-3, ...).`,
        });
      }
    }
    return violations;
  },
};

// ---------------------------------------------------------------------------
// Rule: no-banned-shadow
// ---------------------------------------------------------------------------

const SHADOW_RE = /\bshadow-(2xl|xl|inner)\b/g;

const ruleNoBannedShadow: RuleDefinition = {
  name: "no-banned-shadow",
  description: "Only `shadow-sm` and `shadow-md` are allowed; ban xl/2xl/inner.",
  run({ sourceFiles }) {
    const violations: Violation[] = [];
    for (const file of sourceFiles) {
      const stripped = stripComments(file.content);
      let m: RegExpExecArray | null;
      SHADOW_RE.lastIndex = 0;
      while ((m = SHADOW_RE.exec(stripped)) !== null) {
        const { line, col } = offsetToPosition(stripped, m.index);
        violations.push({
          file: file.rel,
          line,
          col,
          rule: "no-banned-shadow",
          message: `Banned shadow utility "${m[0]}" — use shadow-sm or shadow-md.`,
        });
      }
    }
    return violations;
  },
};

// ---------------------------------------------------------------------------
// Rule: no-purple-pink-indigo-gradient
// ---------------------------------------------------------------------------

const GRADIENT_RE =
  /bg-gradient-to-\w+\s+from-(purple|pink|indigo|violet|fuchsia)\b/g;

const ruleNoPurplePinkIndigoGradient: RuleDefinition = {
  name: "no-purple-pink-indigo-gradient",
  description:
    "Ban the default AI purple/pink/indigo gradient (use brand mystic-* tokens).",
  run({ sourceFiles }) {
    const violations: Violation[] = [];
    for (const file of sourceFiles) {
      const stripped = stripComments(file.content);
      let m: RegExpExecArray | null;
      GRADIENT_RE.lastIndex = 0;
      while ((m = GRADIENT_RE.exec(stripped)) !== null) {
        const { line, col } = offsetToPosition(stripped, m.index);
        violations.push({
          file: file.rel,
          line,
          col,
          rule: "no-purple-pink-indigo-gradient",
          message: `Forbidden gradient "${m[0]}" — use brand tokens (mystic-twilight, mystic-aurora, ...).`,
        });
      }
    }
    return violations;
  },
};

// ---------------------------------------------------------------------------
// Rule: no-emoji-in-jsx
// ---------------------------------------------------------------------------

// Extended_Pictographic captures emoji + ZWJ pieces; we strip ASCII to avoid
// matching symbols like © which are technically pictographic.
const EMOJI_RE = /[\p{Extended_Pictographic}](?:\uFE0F)?/gu;
const ASCII_ONLY = /^[\u0000-\u007F]$/;

const ruleNoEmojiInJsx: RuleDefinition = {
  name: "no-emoji-in-jsx",
  description:
    "Disallow emoji in .tsx text/strings; allow only inside aria-label/title.",
  run({ sourceFiles }) {
    const violations: Violation[] = [];
    for (const file of sourceFiles) {
      if (file.ext !== ".tsx") continue;
      // Mask comments + a11y attribute values to silence allowed locations.
      const noComments = stripComments(file.content);
      const masked = maskAttributeValues(noComments, ["aria-label", "title"]);
      let m: RegExpExecArray | null;
      EMOJI_RE.lastIndex = 0;
      while ((m = EMOJI_RE.exec(masked)) !== null) {
        const ch = m[0];
        // Skip pure ASCII matches (defensive — shouldn't occur).
        if (ch.length === 1 && ASCII_ONLY.test(ch)) continue;
        const { line, col } = offsetToPosition(masked, m.index);
        violations.push({
          file: file.rel,
          line,
          col,
          rule: "no-emoji-in-jsx",
          message: `Emoji "${ch}" in JSX — wrap in <span aria-label="..."> or render via lucide-react icons.`,
        });
      }
    }
    return violations;
  },
};

// ---------------------------------------------------------------------------
// Rule: lang-attr (index.html)
// ---------------------------------------------------------------------------

const ruleLangAttr: RuleDefinition = {
  name: "lang-attr",
  description: 'Require <html lang="vi"> in index.html.',
  run() {
    const violations: Violation[] = [];
    if (!existsSync(INDEX_HTML)) {
      violations.push({
        file: "index.html",
        line: 1,
        col: 1,
        rule: "lang-attr",
        message: "index.html not found at project root.",
      });
      return violations;
    }
    const html = readFileSync(INDEX_HTML, "utf8");
    const match = /<html\b([^>]*)>/i.exec(html);
    if (!match) {
      violations.push({
        file: "index.html",
        line: 1,
        col: 1,
        rule: "lang-attr",
        message: "Could not find an <html> opening tag.",
      });
      return violations;
    }
    const attrs = match[1] ?? "";
    const langMatch = /\blang\s*=\s*"([^"]*)"|\blang\s*=\s*'([^']*)'/i.exec(attrs);
    const value = langMatch ? langMatch[1] ?? langMatch[2] ?? "" : "";
    if (value.toLowerCase() !== "vi") {
      const { line, col } = offsetToPosition(html, match.index);
      violations.push({
        file: "index.html",
        line,
        col,
        rule: "lang-attr",
        message: `<html> must have lang="vi" (got ${value ? `"${value}"` : "no lang attribute"}).`,
      });
    }
    return violations;
  },
};

// ---------------------------------------------------------------------------
// Rule: tsdoc-required
// ---------------------------------------------------------------------------

const EXPORT_DECL_RE =
  /^\s*export\s+(?:default\s+)?(?:async\s+)?(function\*?|class|const|let|var|interface|type|enum)\b/;

const ruleTsdocRequired: RuleDefinition = {
  name: "tsdoc-required",
  description:
    "Each top-level export in src/components/ui/*.tsx must have a /** TSDoc */ block.",
  run({ sourceFiles }) {
    const violations: Violation[] = [];
    for (const file of sourceFiles) {
      if (file.ext !== ".tsx") continue;
      if (!/^src\/components\/ui\/[^/]+\.tsx$/.test(file.rel)) continue;
      const lines = file.content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!EXPORT_DECL_RE.test(line)) continue;
        // Only consider top-level exports (no leading whitespace).
        if (/^\s/.test(line)) continue;
        // Walk upward, skipping blank lines, looking for `*/` (close of TSDoc)
        // or a single-line `/** ... */` block.
        let j = i - 1;
        while (j >= 0 && lines[j].trim() === "") j--;
        const prev = j >= 0 ? lines[j].trim() : "";
        const hasTsdoc = prev.endsWith("*/") && /\/\*\*/.test(collectBlock(lines, j));
        if (!hasTsdoc) {
          const colMatch = /\S/.exec(line);
          violations.push({
            file: file.rel,
            line: i + 1,
            col: (colMatch?.index ?? 0) + 1,
            rule: "tsdoc-required",
            message: "Missing TSDoc /** */ block immediately above this export.",
          });
        }
      }
    }
    return violations;
  },
};

/**
 * Walk upward from `endLineIndex` to find the matching `/**` opener and return
 * the joined text. If no opener found before non-comment content, returns "".
 */
function collectBlock(lines: string[], endLineIndex: number): string {
  const acc: string[] = [];
  for (let k = endLineIndex; k >= 0; k--) {
    acc.unshift(lines[k]);
    if (/\/\*\*/.test(lines[k])) return acc.join("\n");
    // Stop if we hit a line with code that's clearly not part of a block comment.
    const trimmed = lines[k].trim();
    if (
      trimmed !== "" &&
      !trimmed.startsWith("*") &&
      !trimmed.endsWith("*/") &&
      !/^\/\*\*/.test(trimmed)
    ) {
      return "";
    }
  }
  return "";
}

// ---------------------------------------------------------------------------
// Rule: build-assertion
// ---------------------------------------------------------------------------

const ruleBuildAssertion: RuleDefinition = {
  name: "build-assertion",
  description:
    "Production bundle in dist/ must not contain the literal `design-tokens`.",
  run() {
    const violations: Violation[] = [];
    if (!existsSync(DIST_DIR)) {
      // Skip silently — no build available yet.
      return violations;
    }
    const files: string[] = [];
    walkAll(DIST_DIR, files);
    for (const abs of files) {
      // Only look at JS/CSS/HTML bundle output.
      if (!/\.(js|mjs|cjs|css|html)$/.test(abs)) continue;
      let content: string;
      try {
        content = readFileSync(abs, "utf8");
      } catch {
        continue;
      }
      const idx = content.indexOf("design-tokens");
      if (idx >= 0) {
        const { line, col } = offsetToPosition(content, idx);
        violations.push({
          file: relative(ROOT, abs).split(sep).join("/"),
          line,
          col,
          rule: "build-assertion",
          message: 'Production bundle leaks the literal "design-tokens" — verify tree-shaking and import paths.',
        });
      }
    }
    return violations;
  },
};

function walkAll(dir: string, out: string[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const abs = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkAll(abs, out);
    } else if (entry.isFile()) {
      out.push(abs);
    }
  }
}

// ---------------------------------------------------------------------------
// Rule registry
// ---------------------------------------------------------------------------

const RULES: RuleDefinition[] = [
  ruleNoHexInTsx,
  ruleNoArbitrarySpacing,
  ruleNoBannedShadow,
  ruleNoPurplePinkIndigoGradient,
  ruleNoEmojiInJsx,
  ruleLangAttr,
  ruleTsdocRequired,
  ruleBuildAssertion,
];

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function main(): void {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.fix) {
    console.log("[lint:design] --fix is currently a no-op (logging only).");
  }

  const selected = opts.rule
    ? RULES.filter((r) => r.name === opts.rule)
    : RULES;

  if (opts.rule && selected.length === 0) {
    console.error(`[lint:design] Unknown rule "${opts.rule}". Use --help to list rules.`);
    process.exit(2);
  }

  const ctx: LintContext = {
    root: ROOT,
    sourceFiles: loadSources(),
  };

  const violations: Violation[] = [];
  const summaryByRule: Record<string, number> = {};

  for (const rule of selected) {
    const found = rule.run(ctx);
    summaryByRule[rule.name] = found.length;
    violations.push(...found);
  }

  // Stable ordering: file → line → col → rule.
  violations.sort(
    (a, b) =>
      a.file.localeCompare(b.file) ||
      a.line - b.line ||
      a.col - b.col ||
      a.rule.localeCompare(b.rule),
  );

  for (const v of violations) {
    console.log(`${v.file}:${v.line}:${v.col} [${v.rule}] ${v.message}`);
  }

  console.log("");
  console.log("[lint:design] Summary:");
  for (const rule of selected) {
    console.log(`  ${rule.name}: ${summaryByRule[rule.name] ?? 0}`);
  }
  console.log(`  Files scanned: ${ctx.sourceFiles.length}`);
  console.log(`  Total violations: ${violations.length}`);

  if (violations.length > 0) {
    process.exit(1);
  }
}

main();
