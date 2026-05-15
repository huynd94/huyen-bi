/**
 * TS2 — Markdown Structure Linter for audit-report.md
 *
 * Validates:
 *   1. Heading L1 exactly one, text = "Frontend UX/UI Audit Report"
 *   2. Table of Contents exists before first heading L2 (R6.3)
 *   3. Heading L2 appears in correct order per section ordering (R6.2)
 *   4. Each heading L3 in `## Findings — *` matches F-{AXIS}-NN pattern (R2.2)
 *   5. Each Finding heading L3 has metadata block (Severity, Surface, Axis, References) (R2.1)
 *   6. `## Audit_Backlog` has 3 sub-sections P0/P1/P2 with 6-column tables (R6.6)
 *   7. No HTML inline color (R6.5)
 *   8. All screenshot/evidence paths start with ./audit-evidence/ (R6.8)
 *
 * Requirements: 2.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.8
 *
 * Usage: node scripts/lint-report.mjs [path-to-audit-report.md]
 * Exit 0 = pass, Exit 1 = fail with errors
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { unified } from "unified";
import remarkParse from "remark-parse";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPORT_PATH = resolve(__dirname, "..", "audit-report.md");

// --- Expected section ordering (R6.2) ---
const EXPECTED_H2_ORDER = [
  "Executive Summary",
  "Scope",
  "Methodology",
  "Severity Rubric",
  "Relationship to Existing Specs",
  "Findings — ANIM",
  "Findings — LAYOUT",
  "Findings — MODULE",
  "Findings — INTERACTION",
  "Findings — Mockup Sandbox",
  "Audit_Backlog",
  "Appendices",
  "Acceptance Checklist",
];

// --- Regex patterns ---
const FINDING_ID_RE =
  /^F-(ANIM|LAYOUT|MODULE|INTERACTION)-\d{2,}: .+$/;
const FINDINGS_SECTION_RE = /^Findings — (ANIM|LAYOUT|MODULE|INTERACTION|Mockup Sandbox)$/;
const HTML_COLOR_RE = /style\s*=\s*"[^"]*color\s*:/i;
const FONT_COLOR_RE = /<font\s[^>]*color/i;

// --- Helpers ---

/**
 * Extract text content from an mdast node (heading, paragraph, etc.)
 */
function nodeText(node) {
  if (!node) return "";
  if (node.type === "text" || node.type === "inlineCode") return node.value || "";
  if (node.children) return node.children.map(nodeText).join("");
  return "";
}

/**
 * Get the line number of a node (1-indexed)
 */
function lineOf(node) {
  return node?.position?.start?.line ?? -1;
}

/**
 * Collect all headings from the AST with their depth, text, and line number
 */
function collectHeadings(tree) {
  const headings = [];
  function walk(node) {
    if (node.type === "heading") {
      headings.push({
        depth: node.depth,
        text: nodeText(node).trim(),
        line: lineOf(node),
        node,
      });
    }
    if (node.children) {
      for (const child of node.children) walk(child);
    }
  }
  walk(tree);
  return headings;
}

/**
 * Find the content between a heading and the next heading of same or higher level.
 * Returns the raw lines (1-indexed start/end).
 */
function getSectionLines(lines, headingLine, headings, headingIndex) {
  const startLine = headingLine; // 1-indexed
  let endLine = lines.length; // default: end of file
  for (let i = headingIndex + 1; i < headings.length; i++) {
    if (headings[i].depth <= headings[headingIndex].depth) {
      endLine = headings[i].line - 1;
      break;
    }
  }
  return { startLine, endLine };
}

// --- Main lint function ---

function lintReport(filePath) {
  const errors = [];

  let content;
  try {
    content = readFileSync(filePath, "utf-8");
  } catch (err) {
    console.error(`Error: Cannot read file "${filePath}": ${err.message}`);
    process.exit(1);
  }

  const lines = content.split("\n");
  const tree = unified().use(remarkParse).parse(content);
  const headings = collectHeadings(tree);

  // --- Check 1: Heading L1 exactly one, text = "Frontend UX/UI Audit Report" ---
  const h1s = headings.filter((h) => h.depth === 1);
  if (h1s.length === 0) {
    errors.push({ line: 1, section: "(document)", message: "Missing heading level 1" });
  } else if (h1s.length > 1) {
    for (const h of h1s.slice(1)) {
      errors.push({
        line: h.line,
        section: h.text,
        message: `Multiple heading level 1 found (expected exactly one)`,
      });
    }
  }
  if (h1s.length >= 1 && h1s[0].text !== "Frontend UX/UI Audit Report") {
    errors.push({
      line: h1s[0].line,
      section: h1s[0].text,
      message: `Heading L1 text must be "Frontend UX/UI Audit Report", got "${h1s[0].text}"`,
    });
  }

  // --- Check 2: Table of Contents exists before first heading L2 ---
  // The ToC may appear as a `## Table of Contents` heading (which is not in the
  // expected section ordering) or as inline links/list before the first "real" H2.
  const allH2s = headings.filter((h) => h.depth === 2);
  const tocHeadingIdx = allH2s.findIndex(
    (h) => /^table of contents$/i.test(h.text)
  );
  // "Real" H2s exclude the ToC heading itself
  const h2s = allH2s.filter((_, idx) => idx !== tocHeadingIdx);

  if (h2s.length > 0) {
    const firstRealH2Line = h2s[0].line;
    // Content before the first real H2 (includes any ToC heading + links)
    const contentBeforeFirstH2 = lines.slice(0, firstRealH2Line - 1).join("\n");
    const hasTocHeading = /table of contents/i.test(contentBeforeFirstH2);
    const hasTocLinks = /\[.*\]\(#.*\)/.test(contentBeforeFirstH2);
    const hasListItems = /^[-*]\s+\[.*\]\(#/m.test(contentBeforeFirstH2);

    if (!hasTocHeading && !hasTocLinks && !hasListItems) {
      errors.push({
        line: firstRealH2Line,
        section: "Before first H2",
        message:
          "Table of Contents not found before first heading level 2 (R6.3). " +
          "Expected links to sections (e.g., `- [Section](#section)`) or a ToC heading.",
      });
    }
  }

  // --- Check 3: Heading L2 in correct order ---
  const h2Texts = h2s.map((h) => h.text);
  let expectedIdx = 0;
  for (let i = 0; i < h2Texts.length; i++) {
    const actual = h2Texts[i];
    // Find this heading in expected order starting from expectedIdx
    const foundAt = EXPECTED_H2_ORDER.indexOf(actual, expectedIdx);
    if (foundAt === -1) {
      // Check if it exists at all in expected list
      if (EXPECTED_H2_ORDER.includes(actual)) {
        errors.push({
          line: h2s[i].line,
          section: actual,
          message: `Heading "## ${actual}" is out of order. Expected order per R6.2.`,
        });
      } else {
        errors.push({
          line: h2s[i].line,
          section: actual,
          message: `Unexpected heading level 2: "## ${actual}". Not in expected section ordering.`,
        });
      }
    } else {
      expectedIdx = foundAt + 1;
    }
  }
  // Check for missing required H2 sections
  for (const expected of EXPECTED_H2_ORDER) {
    if (!h2Texts.includes(expected)) {
      errors.push({
        line: -1,
        section: "(document)",
        message: `Missing required heading level 2: "## ${expected}"`,
      });
    }
  }

  // --- Check 4: Each H3 in Findings sections matches F-{AXIS}-NN pattern ---
  const findingsSections = h2s.filter((h) => FINDINGS_SECTION_RE.test(h.text));
  const findingsH3s = [];

  for (const fSection of findingsSections) {
    const sectionIdx = headings.indexOf(fSection);
    // Collect H3s that belong to this Findings section
    for (let i = sectionIdx + 1; i < headings.length; i++) {
      if (headings[i].depth <= 2) break; // next H2 or higher
      if (headings[i].depth === 3) {
        findingsH3s.push({
          ...headings[i],
          parentSection: fSection.text,
          headingIdx: i, // store original index in headings array
        });
      }
    }
  }

  // Only check H3s in axis-specific findings sections (not Mockup Sandbox)
  const axisFindings = findingsH3s.filter(
    (h) => h.parentSection !== "Findings — Mockup Sandbox"
  );
  for (const h3 of axisFindings) {
    if (!FINDING_ID_RE.test(h3.text)) {
      errors.push({
        line: h3.line,
        section: h3.parentSection,
        message: `Finding heading does not match pattern "F-(ANIM|LAYOUT|MODULE|INTERACTION)-NN: <title>". Got: "${h3.text}"`,
      });
    }
  }

  // --- Check 5: Each Finding H3 has metadata block ---
  const REQUIRED_META = ["Severity:", "Surface:", "Axis:", "References:"];
  for (const h3 of findingsH3s) {
    const { startLine, endLine } = getSectionLines(lines, h3.line, headings, h3.headingIdx);
    // Look at lines immediately after the heading for metadata
    // Metadata block is typically within the first 10-15 lines after heading
    const sectionContent = lines.slice(startLine, Math.min(startLine + 20, endLine));
    const sectionText = sectionContent.join("\n");

    for (const meta of REQUIRED_META) {
      // Match bold or plain metadata markers
      const metaRe = new RegExp(`\\*\\*${meta.replace(":", ":\\*\\*")}|^-\\s+\\*\\*${meta.replace(":", ":\\*\\*")}|${meta}`, "m");
      if (!metaRe.test(sectionText)) {
        errors.push({
          line: h3.line,
          section: h3.text,
          message: `Finding missing metadata field "${meta}" in block after heading`,
        });
      }
    }
  }

  // --- Check 6: Audit_Backlog has 3 sub-sections P0/P1/P2 with 6-column tables ---
  const backlogH2 = h2s.find((h) => h.text === "Audit_Backlog");
  if (backlogH2) {
    const backlogIdx = headings.indexOf(backlogH2);
    const { startLine, endLine } = getSectionLines(lines, backlogH2.line, headings, backlogIdx);

    // Collect H3s within Audit_Backlog
    const backlogH3s = [];
    for (let i = backlogIdx + 1; i < headings.length; i++) {
      if (headings[i].depth <= 2) break;
      if (headings[i].depth === 3) {
        backlogH3s.push(headings[i]);
      }
    }

    const expectedBacklogSections = ["P0", "P1", "P2"];
    const foundBacklogSections = backlogH3s.map((h) => {
      // Extract P0/P1/P2 from heading text like "P0 (Blocker)" or just "P0"
      const match = h.text.match(/^(P[012])/);
      return match ? match[1] : h.text;
    });

    for (const expected of expectedBacklogSections) {
      if (!foundBacklogSections.includes(expected)) {
        errors.push({
          line: backlogH2.line,
          section: "Audit_Backlog",
          message: `Missing required sub-section "### ${expected}" in Audit_Backlog`,
        });
      }
    }

    // Check each backlog sub-section has a 6-column table
    for (const bh3 of backlogH3s) {
      const pMatch = bh3.text.match(/^(P[012])/);
      if (!pMatch) continue;

      const bh3Idx = headings.indexOf(bh3);
      const { startLine: bStart, endLine: bEnd } = getSectionLines(
        lines,
        bh3.line,
        headings,
        bh3Idx
      );

      const sectionLines = lines.slice(bStart, bEnd);
      // Find table rows (lines starting with |)
      const tableRows = sectionLines.filter((l) => l.trim().startsWith("|"));

      if (tableRows.length === 0) {
        errors.push({
          line: bh3.line,
          section: `Audit_Backlog > ${bh3.text}`,
          message: `No Markdown table found in backlog sub-section "${bh3.text}"`,
        });
      } else {
        // Check column count (header row)
        const headerRow = tableRows[0];
        const cols = headerRow.split("|").filter((c) => c.trim() !== "").length;
        if (cols !== 6) {
          errors.push({
            line: bh3.line,
            section: `Audit_Backlog > ${bh3.text}`,
            message: `Backlog table in "${bh3.text}" has ${cols} columns, expected 6`,
          });
        }
      }
    }
  }

  // --- Check 7: No HTML inline color ---
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (HTML_COLOR_RE.test(line)) {
      errors.push({
        line: i + 1,
        section: getSectionContext(headings, i + 1),
        message: `HTML inline style with color detected (R6.5 violation): "${line.trim().slice(0, 80)}"`,
      });
    }
    if (FONT_COLOR_RE.test(line)) {
      errors.push({
        line: i + 1,
        section: getSectionContext(headings, i + 1),
        message: `<font color> tag detected (R6.5 violation): "${line.trim().slice(0, 80)}"`,
      });
    }
  }

  // --- Check 8: All evidence/screenshot paths start with ./audit-evidence/ ---
  const absoluteEvidenceRe = /(?:^|\s|"|'|\()(?:\/|[A-Z]:\\)[\w\\/.-]*audit-evidence[\\/]/gm;
  // Match bare `audit-evidence/` followed by actual path content (file/folder names)
  // This avoids false positives on prose like "audit-evidence/ contains..."
  const bareEvidencePathRe = /(?<!\.)audit-evidence\/[\w][\w./-]*/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for absolute paths to audit-evidence
    absoluteEvidenceRe.lastIndex = 0;
    if (absoluteEvidenceRe.test(line)) {
      errors.push({
        line: i + 1,
        section: getSectionContext(headings, i + 1),
        message: `Absolute path to audit-evidence detected. Must use relative "./audit-evidence/..." (R6.8)`,
      });
    }

    // Check for bare `audit-evidence/something` without `./` prefix
    bareEvidencePathRe.lastIndex = 0;
    let match;
    while ((match = bareEvidencePathRe.exec(line)) !== null) {
      // Check if preceded by `./`
      const prefix = line.slice(Math.max(0, match.index - 2), match.index);
      if (!prefix.endsWith("./")) {
        errors.push({
          line: i + 1,
          section: getSectionContext(headings, i + 1),
          message: `Evidence path missing "./" prefix. Use "./audit-evidence/..." instead of "audit-evidence/..." (R6.8)`,
        });
      }
    }
  }

  return errors;
}

/**
 * Get the section context (nearest heading) for a given line number
 */
function getSectionContext(headings, lineNum) {
  let context = "(document)";
  for (const h of headings) {
    if (h.line <= lineNum) {
      context = h.text;
    } else {
      break;
    }
  }
  return context;
}

// --- Entry point ---

function main() {
  const filePath = process.argv[2] || DEFAULT_REPORT_PATH;

  console.log(`Linting: ${filePath}\n`);

  const errors = lintReport(filePath);

  if (errors.length === 0) {
    console.log("✓ Markdown structure valid");
    process.exit(0);
  }

  console.error(`✗ Markdown structure lint failed (${errors.length} error(s)):\n`);
  for (const err of errors) {
    const lineInfo = err.line > 0 ? `line ${err.line}` : "N/A";
    console.error(`  [${lineInfo}] (${err.section}) ${err.message}`);
  }
  console.error("");
  process.exit(1);
}

main();
