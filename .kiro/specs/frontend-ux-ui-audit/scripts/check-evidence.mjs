/**
 * TS4 — Evidence File Checker
 *
 * Validates:
 *  1. All paths `./audit-evidence/...` referenced in Markdown + JSON exist on disk
 *  2. All files under `audit-evidence/` ≤ 5MB (R13.5)
 *  3. File naming matches Evidence file naming patterns (Design > Data Models)
 *  4. Minimum coverage: ≥ 1 file per type (lighthouse, axe, responsive, reduced-motion, keyboard)
 *
 * Exit 0 = pass, Exit 1 = fail with specific errors.
 *
 * Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 13.1.e, 13.5, design TS4
 */

import { readFileSync, existsSync, statSync, readdirSync } from "node:fs";
import { resolve, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SPEC_DIR = resolve(__dirname, "..");
const EVIDENCE_DIR = resolve(SPEC_DIR, "audit-evidence");
const REPORT_PATH = resolve(SPEC_DIR, "audit-report.md");
const SUMMARY_PATH = resolve(SPEC_DIR, "audit-summary.json");

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// ─── Evidence file naming patterns ─────────────────────────────────────────────

const NAMING_PATTERNS = {
  lighthouse: /^lighthouse\/[a-z0-9-]+\.json$/,
  axe: /^axe\/[a-z0-9-]+\.json$/,
  responsive: /^responsive\/[a-z0-9-]+-\d+x\d+\.png$/,
  "reduced-motion": /^reduced-motion\/[a-z0-9-]+-reduced\.png$/,
  keyboard: /^keyboard\/flow-[abc]-[a-z0-9-]+\.md$/,
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const errors = [];

function fail(msg) {
  errors.push(msg);
}

/**
 * Extract all `./audit-evidence/...` paths from a text string.
 * Matches paths in markdown links, JSON strings, and inline references.
 */
function extractEvidencePaths(text) {
  const paths = new Set();
  // Match ./audit-evidence/ followed by non-whitespace, non-quote, non-paren, non-backtick chars
  const regex = /\.\/audit-evidence\/[^\s"'`)\]},]+/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    paths.add(match[0]);
  }
  return paths;
}

/**
 * Recursively list all files under a directory (relative to that directory).
 */
function listFilesRecursive(dir, base = "") {
  const results = [];
  if (!existsSync(dir)) return results;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      results.push(...listFilesRecursive(join(dir, entry.name), relPath));
    } else if (entry.isFile()) {
      results.push(relPath);
    }
  }
  return results;
}

// ─── Check 1: Referenced paths exist on disk ───────────────────────────────────

const referencedPaths = new Set();

// Extract from Markdown
if (existsSync(REPORT_PATH)) {
  const mdContent = readFileSync(REPORT_PATH, "utf-8");
  for (const p of extractEvidencePaths(mdContent)) {
    referencedPaths.add(p);
  }
}

// Extract from JSON
if (existsSync(SUMMARY_PATH)) {
  const jsonContent = readFileSync(SUMMARY_PATH, "utf-8");
  for (const p of extractEvidencePaths(jsonContent)) {
    referencedPaths.add(p);
  }
}

let missingCount = 0;
for (const refPath of referencedPaths) {
  // Resolve relative to spec dir (paths are like ./audit-evidence/...)
  const absPath = resolve(SPEC_DIR, refPath);
  if (!existsSync(absPath)) {
    fail(`Missing file: ${refPath} (referenced in Markdown/JSON but not found on disk)`);
    missingCount++;
  }
}

// ─── Check 2: All files under audit-evidence/ ≤ 5MB ───────────────────────────

const allEvidenceFiles = listFilesRecursive(EVIDENCE_DIR);
let oversizedCount = 0;

for (const relFile of allEvidenceFiles) {
  const absFile = join(EVIDENCE_DIR, relFile);
  try {
    const stat = statSync(absFile);
    if (stat.size > MAX_FILE_SIZE) {
      const sizeMB = (stat.size / (1024 * 1024)).toFixed(2);
      fail(
        `Oversized file: audit-evidence/${relFile} (${sizeMB} MB > 5 MB). ` +
          `Suggestion: optimize with pngquant/oxipng or crop to relevant area.`
      );
      oversizedCount++;
    }
  } catch {
    // Skip files that can't be stat'd (shouldn't happen normally)
  }
}

// ─── Check 3: Naming matches Evidence file naming patterns ─────────────────────

let namingErrorCount = 0;

for (const relFile of allEvidenceFiles) {
  // Skip README.md and .gitkeep files
  const basename = relFile.split("/").pop();
  if (basename === "README.md" || basename === ".gitkeep") continue;

  // Determine which category this file belongs to
  const category = relFile.split("/")[0];
  const pattern = NAMING_PATTERNS[category];

  if (!pattern) {
    fail(
      `Unexpected directory: audit-evidence/${relFile} — ` +
        `expected subdirectory to be one of: lighthouse, axe, responsive, reduced-motion, keyboard`
    );
    namingErrorCount++;
    continue;
  }

  // Normalize path separators to forward slash for regex matching
  const normalizedPath = relFile.replace(/\\/g, "/");
  if (!pattern.test(normalizedPath)) {
    fail(
      `Naming violation: audit-evidence/${relFile} does not match expected pattern. ` +
        `Expected: ${pattern.source}`
    );
    namingErrorCount++;
  }
}

// ─── Check 4: Minimum coverage ─────────────────────────────────────────────────

const coverageChecks = [
  { dir: "lighthouse", glob: /\.json$/, label: "lighthouse/*.json" },
  { dir: "axe", glob: /\.json$/, label: "axe/*.json" },
  { dir: "responsive", glob: /\.png$/, label: "responsive/*.png" },
  { dir: "reduced-motion", glob: /\.png$/, label: "reduced-motion/*.png" },
  { dir: "keyboard", glob: /^flow-.*\.md$/, label: "keyboard/flow-*.md" },
];

const coverageCounts = {};

for (const check of coverageChecks) {
  const dirPath = join(EVIDENCE_DIR, check.dir);
  let count = 0;

  if (existsSync(dirPath)) {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && check.glob.test(entry.name) && entry.name !== ".gitkeep") {
        count++;
      }
    }
  }

  coverageCounts[check.label] = count;

  if (count === 0) {
    fail(
      `Minimum coverage not met: expected ≥ 1 file matching ${check.label}, found 0. ` +
        `(R13.1.e requires evidence for each tooling type)`
    );
  }
}

// ─── Output ────────────────────────────────────────────────────────────────────

if (errors.length === 0) {
  const totalFiles = allEvidenceFiles.filter(
    (f) => !f.endsWith(".gitkeep") && !f.endsWith("README.md")
  ).length;

  console.log("✓ Evidence files check passed");
  console.log(
    `  Referenced paths: ${referencedPaths.size} (all exist)`
  );
  console.log(`  Total evidence files: ${totalFiles} (all ≤ 5MB)`);
  console.log(
    `  Coverage: lighthouse: ${coverageCounts["lighthouse/*.json"]}, ` +
      `axe: ${coverageCounts["axe/*.json"]}, ` +
      `responsive: ${coverageCounts["responsive/*.png"]}, ` +
      `reduced-motion: ${coverageCounts["reduced-motion/*.png"]}, ` +
      `keyboard: ${coverageCounts["keyboard/flow-*.md"]}`
  );
  process.exit(0);
} else {
  console.error(`✗ Evidence file check failed (${errors.length} error(s)):\n`);
  for (const e of errors) {
    console.error(`  • ${e}`);
  }
  process.exit(1);
}
