/**
 * TS3 — Cross-file consistency check
 *
 * Ensures audit-report.md and audit-summary.json stay in sync:
 *   1. Bidirectional finding ID match (Markdown ↔ JSON)
 *   2. Severity of each finding matches between the two files
 *   3. Number of rows in Audit_Backlog tables matches totals.P0/P1/P2 of JSON
 *
 * Requirements: 6.7, design TS3, design Error Handling E6
 *
 * Exit 0 if pass, exit 1 + specific errors if fail.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPEC_DIR = resolve(__dirname, '..');

const REPORT_PATH = resolve(SPEC_DIR, 'audit-report.md');
const JSON_PATH = resolve(SPEC_DIR, 'audit-summary.json');

// --- Helpers ---

/**
 * Parse finding IDs and severities from audit-report.md.
 * Finds L3 headings matching F-{AXIS}-NN pattern and extracts severity
 * from the metadata block that follows.
 */
function parseMdFindings(md) {
  const findings = [];
  const lines = md.replace(/\r\n/g, '\n').split('\n');

  for (let i = 0; i < lines.length; i++) {
    const headingMatch = lines[i].match(
      /^###\s+(F-(ANIM|LAYOUT|MODULE|INTERACTION)-\d{2,}):\s+.+$/
    );
    if (!headingMatch) continue;

    const id = headingMatch[1];
    let severity = null;

    // Look ahead in the next ~10 lines for the severity metadata field
    for (let j = i + 1; j < Math.min(i + 15, lines.length); j++) {
      const sevMatch = lines[j].match(
        /^-\s+\*\*Severity:\*\*\s*(P0|P1|P2|INFO)\s*$/
      );
      if (sevMatch) {
        severity = sevMatch[1];
        break;
      }
      // Stop scanning if we hit another heading
      if (/^#{1,3}\s/.test(lines[j])) break;
    }

    findings.push({ id, severity, line: i + 1 });
  }

  return findings;
}

/**
 * Count data rows in each Audit_Backlog sub-table (P0, P1, P2).
 * A data row is a table row (starts with |) that is NOT the header row
 * and NOT the separator row (contains only |, -, and spaces).
 */
function parseBacklogCounts(md) {
  const counts = { P0: 0, P1: 0, P2: 0 };
  const lines = md.replace(/\r\n/g, '\n').split('\n');

  // Find the ## Audit_Backlog section
  let inBacklog = false;
  let currentSeverity = null;
  let tableStarted = false;
  let headerRowSeen = false;
  let separatorSeen = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Detect start of Audit_Backlog section
    if (/^##\s+Audit_Backlog\s*$/.test(line)) {
      inBacklog = true;
      continue;
    }

    // Detect end of Audit_Backlog (next L2 heading)
    if (inBacklog && /^##\s+[^#]/.test(line) && !/^##\s+Audit_Backlog/.test(line)) {
      break;
    }

    if (!inBacklog) continue;

    // Detect P0/P1/P2 sub-sections
    const subMatch = line.match(/^###\s+P(0|1|2)\b/);
    if (subMatch) {
      currentSeverity = `P${subMatch[1]}`;
      tableStarted = false;
      headerRowSeen = false;
      separatorSeen = false;
      continue;
    }

    if (!currentSeverity) continue;

    // Detect table rows
    if (line.trim().startsWith('|')) {
      if (!headerRowSeen) {
        // First row with | is the header
        headerRowSeen = true;
        continue;
      }
      if (!separatorSeen) {
        // Second row with | is the separator (|---|---|...)
        if (/^\|[\s\-:|]+\|$/.test(line.trim()) || /^\|(\s*-+\s*\|)+/.test(line)) {
          separatorSeen = true;
          continue;
        }
        // If it doesn't look like a separator, treat it as data
        separatorSeen = true;
        // Fall through to count as data row
      }

      // Count data rows — but skip placeholder rows like "| — | — | ... |"
      // A placeholder row has all cells as "—" or "(không phát hiện)" etc.
      const cells = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      const isPlaceholder = cells.every(
        (c) => c === '—' || c === '-' || c.startsWith('(không')
      );
      if (!isPlaceholder && cells.length > 0 && cells.some((c) => c.length > 0)) {
        counts[currentSeverity]++;
      }
    } else if (headerRowSeen && line.trim() === '') {
      // Empty line after table — reset for potential next table in same section
      // (unlikely but safe)
    }
  }

  return counts;
}

/**
 * Parse audit-summary.json and extract findings + totals.
 */
function parseJsonSummary(jsonPath) {
  let raw;
  try {
    raw = readFileSync(jsonPath, 'utf-8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { error: `File not found: ${jsonPath}` };
    }
    return { error: `Cannot read ${jsonPath}: ${err.message}` };
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    return { error: `Invalid JSON in ${jsonPath}: ${err.message}` };
  }

  if (!data.findings || !Array.isArray(data.findings)) {
    return { error: `Missing or invalid "findings" array in JSON` };
  }
  if (!data.totals || typeof data.totals !== 'object') {
    return { error: `Missing or invalid "totals" object in JSON` };
  }

  return { data };
}

// --- Main ---

function main() {
  const errors = [];

  // Read Markdown
  let mdContent;
  try {
    mdContent = readFileSync(REPORT_PATH, 'utf-8');
  } catch (err) {
    console.error(`✗ Cannot read audit-report.md: ${err.message}`);
    process.exit(1);
  }

  // Read JSON
  const jsonResult = parseJsonSummary(JSON_PATH);
  if (jsonResult.error) {
    console.error(`✗ ${jsonResult.error}`);
    process.exit(1);
  }
  const { data: jsonData } = jsonResult;

  // --- Check 1: Bidirectional ID match ---
  const mdFindings = parseMdFindings(mdContent);
  const mdIds = new Set(mdFindings.map((f) => f.id));
  const jsonIds = new Set(jsonData.findings.map((f) => f.id));

  // IDs in Markdown but not in JSON
  for (const id of mdIds) {
    if (!jsonIds.has(id)) {
      errors.push(`ID "${id}" found in Markdown but missing from JSON findings`);
    }
  }

  // IDs in JSON but not in Markdown
  for (const id of jsonIds) {
    if (!mdIds.has(id)) {
      errors.push(`ID "${id}" found in JSON but missing from Markdown headings`);
    }
  }

  // --- Check 2: Severity match ---
  const jsonSeverityMap = new Map(
    jsonData.findings.map((f) => [f.id, f.severity])
  );

  for (const mdFinding of mdFindings) {
    if (mdFinding.severity === null) {
      errors.push(
        `Finding "${mdFinding.id}" (line ${mdFinding.line}) in Markdown has no parseable Severity metadata`
      );
      continue;
    }
    const jsonSeverity = jsonSeverityMap.get(mdFinding.id);
    if (jsonSeverity && jsonSeverity !== mdFinding.severity) {
      errors.push(
        `Severity mismatch for "${mdFinding.id}": Markdown says "${mdFinding.severity}", JSON says "${jsonSeverity}"`
      );
    }
  }

  // --- Check 3: Audit_Backlog row counts match totals ---
  const backlogCounts = parseBacklogCounts(mdContent);
  const jsonTotals = jsonData.totals;

  for (const sev of ['P0', 'P1', 'P2']) {
    const mdCount = backlogCounts[sev];
    const jsonCount = jsonTotals[sev];
    if (jsonCount !== undefined && mdCount !== jsonCount) {
      errors.push(
        `Audit_Backlog ${sev} table has ${mdCount} data row(s), but JSON totals.${sev} = ${jsonCount}`
      );
    }
  }

  // --- Output ---
  if (errors.length > 0) {
    console.error(`✗ Cross-file consistency check FAILED (${errors.length} error(s)):\n`);
    for (const err of errors) {
      console.error(`  • ${err}`);
    }
    process.exit(1);
  }

  const matchCount = mdIds.size;
  console.log(`✓ Cross-file consistency OK (${matchCount} finding(s) matched)`);
  process.exit(0);
}

main();
