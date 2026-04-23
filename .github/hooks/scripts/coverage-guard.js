#!/usr/bin/env node
/**
 * coverage-guard.js — PreToolUse gate for commit/push operations
 *
 * Enforces a 95% total coverage target before any commit or push is allowed.
 * The gate reads the local Vitest v8 coverage report (`coverage/coverage-summary.json`)
 * which is produced by `npm run test:coverage`.  It does NOT re-run the test suite —
 * checking an existing report is fast and non-blocking.
 *
 * Target thresholds (see also coverage-guard.instructions.md):
 *
 *   Statements  ≥ 95 %
 *   Lines       ≥ 95 %
 *   Functions   ≥ 95 %
 *   Branches    ≥ 90 %   (branch coverage is structurally harder to drive to 95)
 *
 * If all thresholds pass → tool call is allowed silently.
 * If any threshold fails → returns `permissionDecision: "ask"` with:
 *   - per-metric breakdown
 *   - gap in absolute covered/total lines
 *   - actionable fix instructions referencing the coverage-guard skill
 *
 * If the report is missing or stale (> 30 min) → warns but does not block
 * (avoids false positives when the test suite hasn't been run yet).
 *
 * Hook JSON (see .github/hooks/coverage-guard.json):
 *   "PreToolUse": [{ "type": "command", "command": "node .github/hooks/scripts/coverage-guard.js" }]
 *
 * Environment variables:
 *   COVERAGE_GUARD_DISABLE=true   — bypass entirely (CI escape hatch)
 *   COVERAGE_REPORT_PATH          — override report path (default: coverage/coverage-summary.json)
 */

import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// ── Configuration ──────────────────────────────────────────────────────────

/** Total coverage targets (percentage, 0–100). */
const TARGETS = {
  statements: 95,
  lines: 95,
  functions: 95,
  branches: 90,
};

/** Warn (but don't block) when the report is older than this. */
const REPORT_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

const REPORT_PATH =
  process.env.COVERAGE_REPORT_PATH ??
  join(process.cwd(), "coverage", "coverage-summary.json");

// ── Escape hatch ───────────────────────────────────────────────────────────

if (process.env.COVERAGE_GUARD_DISABLE === "true") {
  process.exit(0);
}

// ── Tool-name gate ─────────────────────────────────────────────────────────

/** Only intercept commit and push/merge tool calls. */
const GATE_TOOL_PATTERNS = [
  "git_commit",
  "git commit",
  "git_push",
  "git push",
  "merge_pull_request",
  "mcp_github_merge",
  "push_files",
  "mcp_gitkraken_git_push",
  "mcp_gitkraken_git_add_or_commit",
];

let hookInput = {};
try {
  const raw = readFileSync("/dev/stdin", "utf8");
  hookInput = raw.trim() ? JSON.parse(raw) : {};
} catch {
  // No stdin in some environments — pass through.
  process.exit(0);
}

const toolName = (
  hookInput?.toolName ??
  hookInput?.tool_name ??
  process.env.TOOL_NAME ??
  process.argv[2] ??
  ""
).toLowerCase();

const isGateTool = GATE_TOOL_PATTERNS.some((p) => toolName.includes(p));
if (!isGateTool) {
  process.exit(0);
}

// ── Load coverage report ───────────────────────────────────────────────────

if (!existsSync(REPORT_PATH)) {
  // No report yet — warn but don't block.
  process.stderr.write(
    "[coverage-guard] WARNING: No coverage report found at coverage/coverage-summary.json.\n" +
      "  Run `npm run test:coverage` to generate a report before committing/pushing.\n" +
      "  Target: ≥95% statements/lines/functions, ≥90% branches.\n",
  );
  process.exit(0);
}

const reportAge = Date.now() - statSync(REPORT_PATH).mtimeMs;
const reportAgeMin = Math.round(reportAge / 60_000);

if (reportAge > REPORT_MAX_AGE_MS) {
  process.stderr.write(
    `[coverage-guard] WARNING: Coverage report is ${reportAgeMin} min old — it may not reflect recent changes.\n` +
      "  Run `npm run test:coverage` to refresh it.\n",
  );
  // Stale report: warn but don't block (prevents false positives after no-test edits).
  process.exit(0);
}

let summary;
try {
  summary = JSON.parse(readFileSync(REPORT_PATH, "utf8"));
} catch {
  process.stderr.write(
    "[coverage-guard] WARNING: Could not parse coverage-summary.json — skipping gate.\n",
  );
  process.exit(0);
}

const total = summary?.total ?? {};

// ── Evaluate thresholds ────────────────────────────────────────────────────

/**
 * Returns a human-readable status line for one metric.
 * @param {string} name
 * @param {{ pct: number, covered: number, total: number } | undefined} data
 * @param {number} target
 */
function metricLine(name, data, target) {
  if (!data) return `  ${name.padEnd(12)} — data unavailable`;
  const pct = data.pct ?? 0;
  const pass = pct >= target;
  const icon = pass ? "✅" : "❌";
  const gap =
    !pass && data.total > 0
      ? ` (need ${Math.ceil((target / 100) * data.total - data.covered)} more covered)`
      : "";
  return `  ${icon} ${name.padEnd(12)}  ${pct.toFixed(2).padStart(6)}%  (target: ${target}%)${gap}`;
}

const failures = [];
for (const [metric, target] of Object.entries(TARGETS)) {
  const data = total[metric];
  const pct = data?.pct ?? 0;
  if (pct < target) {
    failures.push({ metric, pct, data, target });
  }
}

// ── Emit result ────────────────────────────────────────────────────────────

if (failures.length === 0) {
  // All targets met — allow silently.
  process.stdout.write(JSON.stringify({ continue: true }));
  process.exit(0);
}

const metricsBlock = Object.entries(TARGETS)
  .map(([name, target]) => metricLine(name, total[name], target))
  .join("\n");

const failNames = failures.map((f) => f.metric).join(", ");

const message = [
  `🛡️  Coverage-guard blocked: total coverage is below the 95% target (${failNames} below threshold).`,
  "",
  "Current totals (report from " + reportAgeMin + " min ago):",
  metricsBlock,
  "",
  "To fix:",
  "  1. Follow the `coverage-guard` skill instructions in .github/instructions/coverage-guard.instructions.md",
  "  2. Add tests for uncovered code paths — focus on the files with the largest gap first:",
  "       npx vitest run --coverage --reporter=text 2>&1 | head -60",
  "  3. Re-run `npm run test:coverage` to refresh the report",
  "  4. Retry the commit/push once all metrics are green",
  "",
  "Set COVERAGE_GUARD_DISABLE=true to bypass (not recommended before merging to main).",
].join("\n");

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: message,
    },
  }),
);
process.exit(0);
