/**
 * TS6 — Smoke run script (audit-verify.mjs)
 *
 * Runs all verification scripts sequentially in fail-fast mode:
 *   1. validate-summary.mjs  (TS1 — JSON schema validation)
 *   2. lint-report.mjs       (TS2 — Markdown structure linting)
 *   3. check-consistency.mjs (TS3 — Cross-file consistency)
 *   4. check-evidence.mjs    (TS4 — Evidence file existence)
 *
 * If any step fails (non-zero exit), prints the error and exits 1 immediately.
 * If all pass, prints "Audit verification PASSED." and exits 0.
 *
 * Usage: node scripts/audit-verify.mjs
 *   or:  npm run audit:verify
 *
 * Requirements: 13.1, 13.2, design TS6
 */

import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const STEPS = [
  {
    script: "validate-summary.mjs",
    label: "JSON schema validation",
  },
  {
    script: "lint-report.mjs",
    label: "Markdown structure linting",
  },
  {
    script: "check-consistency.mjs",
    label: "Cross-file consistency",
  },
  {
    script: "check-evidence.mjs",
    label: "Evidence file check",
  },
];

let allPassed = true;

for (const step of STEPS) {
  const scriptPath = resolve(__dirname, step.script);

  try {
    const output = execFileSync(process.execPath, [scriptPath], {
      cwd: resolve(__dirname, ".."),
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Print stdout from the step (contains the ✓ line)
    if (output.trim()) {
      console.log(output.trim());
    }
  } catch (err) {
    allPassed = false;

    // Print stderr from the failed step
    const stderr = err.stderr ? err.stderr.trim() : "";
    const stdout = err.stdout ? err.stdout.trim() : "";

    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    console.error(`\n✗ Step failed: ${step.label} (${step.script})`);
    process.exit(1);
  }
}

if (allPassed) {
  console.log("\nAudit verification PASSED.");
  process.exit(0);
}
