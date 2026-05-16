/**
 * Fixture-based unit tests for validator scripts (TS1–TS4).
 *
 * Runs each validator against known-good and known-bad fixtures,
 * asserting exit codes and key error messages in stderr.
 *
 * Usage: node scripts/test-validators.mjs
 *
 * Requirements: design TS1–TS4
 */

import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = resolve(__dirname, "__fixtures__");

// Script paths
const VALIDATE_SUMMARY = resolve(__dirname, "validate-summary.mjs");
const LINT_REPORT = resolve(__dirname, "lint-report.mjs");

// ─── Test infrastructure ───────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

/**
 * Run a validator script with the given fixture path.
 * Returns { exitCode, stdout, stderr }.
 */
function runValidator(scriptPath, fixturePath) {
  try {
    const stdout = execFileSync("node", [scriptPath, fixturePath], {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
      cwd: __dirname,
    });
    return { exitCode: 0, stdout, stderr: "" };
  } catch (err) {
    return {
      exitCode: err.status ?? 1,
      stdout: err.stdout ?? "",
      stderr: err.stderr ?? "",
    };
  }
}

/**
 * Assert a test case.
 * @param {string} name - Test name
 * @param {object} result - { exitCode, stdout, stderr }
 * @param {number} expectedExitCode - Expected exit code
 * @param {string[]} expectedErrors - Substrings expected in stderr (for failures)
 */
function assertTest(name, result, expectedExitCode, expectedErrors = []) {
  const output = result.stderr + result.stdout;
  let pass = true;
  const reasons = [];

  if (result.exitCode !== expectedExitCode) {
    pass = false;
    reasons.push(
      `exit code: expected ${expectedExitCode}, got ${result.exitCode}`
    );
  }

  for (const keyword of expectedErrors) {
    if (!output.toLowerCase().includes(keyword.toLowerCase())) {
      pass = false;
      reasons.push(`missing expected error keyword: "${keyword}"`);
    }
  }

  if (pass) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}`);
    for (const r of reasons) {
      console.log(`      → ${r}`);
    }
    if (result.stderr) {
      const preview = result.stderr.slice(0, 200).replace(/\n/g, "\n      ");
      console.log(`      stderr: ${preview}`);
    }
    failed++;
    failures.push(name);
  }
}

// ─── TS1: validate-summary.mjs tests ──────────────────────────────────────────

console.log("\n━━━ TS1: validate-summary.mjs ━━━\n");

// Valid fixture should pass
assertTest(
  "valid-summary.json → exit 0",
  runValidator(VALIDATE_SUMMARY, resolve(FIXTURES_DIR, "valid-summary.json")),
  0
);

// Missing required field (meta.auditor)
assertTest(
  "invalid-missing-field.json → exit 1 (missing auditor)",
  runValidator(VALIDATE_SUMMARY, resolve(FIXTURES_DIR, "invalid-missing-field.json")),
  1,
  ["auditor"]
);

// Bad ID format (ANIM-1 instead of F-ANIM-01)
assertTest(
  "invalid-bad-id.json → exit 1 (bad id pattern)",
  runValidator(VALIDATE_SUMMARY, resolve(FIXTURES_DIR, "invalid-bad-id.json")),
  1,
  ["pattern"]
);

// Wrong severity value (CRITICAL not in enum)
assertTest(
  "invalid-wrong-severity.json → exit 1 (invalid severity)",
  runValidator(VALIDATE_SUMMARY, resolve(FIXTURES_DIR, "invalid-wrong-severity.json")),
  1,
  ["allowed values"]
);

// Mismatched totals (totals say 6, only 1 finding)
assertTest(
  "invalid-mismatched-totals.json → exit 1 (totals mismatch)",
  runValidator(VALIDATE_SUMMARY, resolve(FIXTURES_DIR, "invalid-mismatched-totals.json")),
  1,
  ["mismatch"]
);

// ─── TS2: lint-report.mjs tests ───────────────────────────────────────────────

console.log("\n━━━ TS2: lint-report.mjs ━━━\n");

// Valid report should pass
assertTest(
  "valid-report.md → exit 0",
  runValidator(LINT_REPORT, resolve(FIXTURES_DIR, "valid-report.md")),
  0
);

// No Table of Contents
assertTest(
  "invalid-report-no-toc.md → exit 1 (missing ToC)",
  runValidator(LINT_REPORT, resolve(FIXTURES_DIR, "invalid-report-no-toc.md")),
  1,
  ["table of contents"]
);

// Wrong section order (Scope before Executive Summary)
assertTest(
  "invalid-report-wrong-order.md → exit 1 (wrong order)",
  runValidator(LINT_REPORT, resolve(FIXTURES_DIR, "invalid-report-wrong-order.md")),
  1,
  ["out of order"]
);

// Existing invalid-report.md (multiple issues: wrong title, multiple H1, etc.)
assertTest(
  "invalid-report.md → exit 1 (multiple structural errors)",
  runValidator(LINT_REPORT, resolve(FIXTURES_DIR, "invalid-report.md")),
  1,
  ["Frontend UX/UI Audit Report"]
);

// ─── Summary ───────────────────────────────────────────────────────────────────

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(`\n  Results: ${passed} passed, ${failed} failed, ${passed + failed} total\n`);

if (failed > 0) {
  console.log("  Failed tests:");
  for (const f of failures) {
    console.log(`    • ${f}`);
  }
  console.log("");
  process.exit(1);
}

console.log("  All tests passed! ✓\n");
process.exit(0);
