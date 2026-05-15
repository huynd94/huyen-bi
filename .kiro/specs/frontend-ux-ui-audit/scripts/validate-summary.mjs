/**
 * TS1 — JSON Schema Validator for audit-summary.json
 *
 * Validates:
 *  1. JSON.parse succeeds
 *  2. All required fields exist (Ajv schema)
 *  3. Finding id regex: /^F-(ANIM|LAYOUT|MODULE|INTERACTION)-\d{2,}$/
 *  4. findings.length === totals.P0 + P1 + P2 + INFO
 *  5. totals.byAxis[axis] === findings.filter(f => f.axis === axis).length
 *  6. Each evidence item has exactly one non-null/non-empty branch
 *  7. All relative paths start with ./audit-evidence/
 *
 * Exit 0 = pass, Exit 1 = fail with specific errors.
 *
 * Requirements: 2.1, 2.6, 6.7, 6.8, 13.1.f
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUMMARY_PATH = process.argv[2]
  ? resolve(process.cwd(), process.argv[2])
  : resolve(__dirname, "..", "audit-summary.json");

// ─── Ajv Schema ────────────────────────────────────────────────────────────────

const severityEnum = ["P0", "P1", "P2", "INFO"];
const axisEnum = ["ANIM", "LAYOUT", "MODULE", "INTERACTION"];

const evidenceItemSchema = {
  type: "object",
  properties: {
    fileLine: { type: "string" },
    screenshot: { type: "string" },
    toolingOutput: { type: "string" },
    reproSteps: { type: "array", items: { type: "string" }, minItems: 3 },
  },
  additionalProperties: false,
};

const referenceSchema = {
  type: "object",
  properties: {
    text: { type: "string" },
  },
  required: ["text"],
  additionalProperties: false,
};

const findingSchema = {
  type: "object",
  properties: {
    id: { type: "string", pattern: "^F-(ANIM|LAYOUT|MODULE|INTERACTION)-\\d{2,}$" },
    title: { type: "string", maxLength: 100 },
    axis: { type: "string", enum: axisEnum },
    severity: { type: "string", enum: severityEnum },
    surface: { type: "string" },
    description: { type: "string" },
    evidence: { type: "array", items: evidenceItemSchema, minItems: 1 },
    recommendation: {
      type: "object",
      properties: {
        what: { type: "string" },
        why: { type: "string" },
        where: { type: "string" },
      },
      required: ["what", "why", "where"],
      additionalProperties: false,
    },
    references: { type: "array", items: referenceSchema },
    effort: { type: "string", enum: ["S", "M", "L"] },
  },
  required: [
    "id",
    "title",
    "axis",
    "severity",
    "surface",
    "description",
    "evidence",
    "recommendation",
    "references",
  ],
  additionalProperties: false,
};

const viewportSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    width: { type: "number" },
    height: { type: "number" },
  },
  required: ["name", "width", "height"],
  additionalProperties: false,
};

const auditSummarySchema = {
  type: "object",
  properties: {
    meta: {
      type: "object",
      properties: {
        auditor: { type: "string" },
        auditDate: { type: "string" },
        repoCommit: { type: "string" },
        appVersion: { type: "string" },
        browsers: { type: "array", items: { type: "string" }, minItems: 1 },
        viewports: { type: "array", items: viewportSchema, minItems: 1 },
      },
      required: ["auditor", "auditDate", "repoCommit", "appVersion", "browsers", "viewports"],
      additionalProperties: false,
    },
    scope: {
      type: "object",
      properties: {
        auditedSurfaces: { type: "array", items: { type: "string" } },
        skippedSurfaces: {
          type: "array",
          items: {
            type: "object",
            properties: {
              surface: { type: "string" },
              reason: { type: "string" },
            },
            required: ["surface", "reason"],
            additionalProperties: false,
          },
        },
        unauditedStates: {
          type: "array",
          items: {
            type: "object",
            properties: {
              surface: { type: "string" },
              state: { type: "string" },
              reason: { type: "string" },
            },
            required: ["surface", "state", "reason"],
            additionalProperties: false,
          },
        },
      },
      required: ["auditedSurfaces", "skippedSurfaces", "unauditedStates"],
      additionalProperties: false,
    },
    rubric: {
      type: "object",
      properties: {
        severityDefinitions: {
          type: "object",
          properties: {
            P0: { type: "string" },
            P1: { type: "string" },
            P2: { type: "string" },
            INFO: { type: "string" },
          },
          required: ["P0", "P1", "P2", "INFO"],
          additionalProperties: false,
        },
        heuristicSets: { type: "array", items: { type: "string" }, minItems: 1 },
      },
      required: ["severityDefinitions", "heuristicSets"],
      additionalProperties: false,
    },
    totals: {
      type: "object",
      properties: {
        P0: { type: "number", minimum: 0 },
        P1: { type: "number", minimum: 0 },
        P2: { type: "number", minimum: 0 },
        INFO: { type: "number", minimum: 0 },
        byAxis: {
          type: "object",
          properties: {
            ANIM: { type: "number", minimum: 0 },
            LAYOUT: { type: "number", minimum: 0 },
            MODULE: { type: "number", minimum: 0 },
            INTERACTION: { type: "number", minimum: 0 },
          },
          required: ["ANIM", "LAYOUT", "MODULE", "INTERACTION"],
          additionalProperties: false,
        },
      },
      required: ["P0", "P1", "P2", "INFO", "byAxis"],
      additionalProperties: false,
    },
    findings: { type: "array", items: findingSchema },
  },
  required: ["meta", "scope", "rubric", "totals", "findings"],
  additionalProperties: false,
};

// ─── Validation Logic ──────────────────────────────────────────────────────────

const errors = [];

function fail(msg) {
  errors.push(msg);
}

// Step 1: Read and parse JSON
let raw;
try {
  raw = readFileSync(SUMMARY_PATH, "utf-8");
} catch (err) {
  console.error(`✗ Cannot read file: ${SUMMARY_PATH}`);
  console.error(`  ${err.message}`);
  process.exit(1);
}

let data;
try {
  data = JSON.parse(raw);
} catch (err) {
  console.error(`✗ JSON.parse failed: ${err.message}`);
  process.exit(1);
}

// Step 2: Ajv schema validation (covers required fields, types, id regex)
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(auditSummarySchema);
const valid = validate(data);

if (!valid) {
  for (const err of validate.errors) {
    fail(`Schema: ${err.instancePath || "/"} ${err.message}`);
  }
}

// Step 3–7: Custom cross-field validations (only if basic structure is present)
if (data.totals && data.findings) {
  // Step 4: findings.length === totals.P0 + P1 + P2 + INFO
  const expectedTotal = data.totals.P0 + data.totals.P1 + data.totals.P2 + data.totals.INFO;
  if (data.findings.length !== expectedTotal) {
    fail(
      `Totals mismatch: findings.length (${data.findings.length}) !== ` +
        `P0(${data.totals.P0}) + P1(${data.totals.P1}) + P2(${data.totals.P2}) + INFO(${data.totals.INFO}) = ${expectedTotal}`
    );
  }

  // Step 5: totals.byAxis[axis] matches actual count
  if (data.totals.byAxis) {
    for (const axis of axisEnum) {
      const expected = data.totals.byAxis[axis] ?? 0;
      const actual = data.findings.filter((f) => f.axis === axis).length;
      if (expected !== actual) {
        fail(
          `byAxis mismatch: totals.byAxis.${axis} (${expected}) !== ` +
            `findings.filter(axis==="${axis}").length (${actual})`
        );
      }
    }

    // Also check byAxis total equals findings.length
    const byAxisTotal = axisEnum.reduce((sum, ax) => sum + (data.totals.byAxis[ax] ?? 0), 0);
    if (byAxisTotal !== data.findings.length) {
      fail(
        `byAxis total (${byAxisTotal}) !== findings.length (${data.findings.length})`
      );
    }
  }

  // Step 6: Each evidence item has exactly one non-null/non-empty branch
  const evidenceBranches = ["fileLine", "screenshot", "toolingOutput", "reproSteps"];

  for (let i = 0; i < data.findings.length; i++) {
    const finding = data.findings[i];
    if (!Array.isArray(finding.evidence)) continue;

    for (let j = 0; j < finding.evidence.length; j++) {
      const item = finding.evidence[j];
      let filledCount = 0;

      for (const branch of evidenceBranches) {
        const val = item[branch];
        if (val === undefined || val === null || val === "") continue;
        if (Array.isArray(val) && val.length === 0) continue;
        filledCount++;
      }

      if (filledCount === 0) {
        fail(
          `findings[${i}].evidence[${j}]: no non-empty branch found ` +
            `(id: ${finding.id || "?"})`
        );
      } else if (filledCount > 1) {
        fail(
          `findings[${i}].evidence[${j}]: expected exactly 1 non-empty branch, ` +
            `found ${filledCount} (id: ${finding.id || "?"})`
        );
      }
    }
  }

  // Step 7: All relative paths start with ./audit-evidence/
  const PATH_PREFIX = "./audit-evidence/";

  for (let i = 0; i < data.findings.length; i++) {
    const finding = data.findings[i];
    if (!Array.isArray(finding.evidence)) continue;

    for (let j = 0; j < finding.evidence.length; j++) {
      const item = finding.evidence[j];

      if (item.screenshot && !item.screenshot.startsWith(PATH_PREFIX)) {
        fail(
          `findings[${i}].evidence[${j}].screenshot must start with "${PATH_PREFIX}" ` +
            `(got: "${item.screenshot}", id: ${finding.id || "?"})`
        );
      }
      if (item.toolingOutput && !item.toolingOutput.startsWith(PATH_PREFIX)) {
        fail(
          `findings[${i}].evidence[${j}].toolingOutput must start with "${PATH_PREFIX}" ` +
            `(got: "${item.toolingOutput}", id: ${finding.id || "?"})`
        );
      }
    }
  }
}

// ─── Output ────────────────────────────────────────────────────────────────────

if (errors.length === 0) {
  console.log("✓ JSON schema valid");
  process.exit(0);
} else {
  console.error(`✗ audit-summary.json validation failed (${errors.length} error(s)):\n`);
  for (const e of errors) {
    console.error(`  • ${e}`);
  }
  process.exit(1);
}
