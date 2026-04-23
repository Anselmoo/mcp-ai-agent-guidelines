#!/usr/bin/env node
/**
 * mcp-ai-agent-guidelines — PR Quality Gate hook (PreToolUse)
 *
 * Intercepts git-push, git-merge, and PR-merge tool calls and injects a
 * blocking reminder when either of the following is detected:
 *
 *   1. Unresolved, non-outdated PR review threads exist
 *   2. Codecov patch coverage is below the project baseline (87.55%)
 *
 * The gate reads its state from a local cache file written by the companion
 * `refresh-pr-quality-cache.js` script (run manually or on SessionStart).
 * If the cache is absent or stale (>10 min), it warns but does not block.
 *
 * Hook JSON snippet (see .github/hooks/pr-quality-gate.json):
 *   "PreToolUse": [{ "type": "command", "command": "node .github/hooks/scripts/pr-quality-gate.js" }]
 *
 * To pre-populate the cache before a session:
 *   node .github/hooks/scripts/refresh-pr-quality-cache.js <pr-number>
 *
 * Environment variables:
 *   PR_QUALITY_GATE_DISABLE=true   — completely bypass the gate (CI escape hatch)
 *   PR_QUALITY_CACHE_FILE          — override cache file path
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

// ── Configuration ──────────────────────────────────────────────────────────

const CACHE_FILE =
  process.env.PR_QUALITY_CACHE_FILE ??
  join(tmpdir(), "mcp-ai-agent-guidelines-pr-quality.json");

const CACHE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

/** Codecov project baseline for this repo (from PR #1461 report). */
const COVERAGE_BASELINE_PCT = 87.55;

/** Tool names / substrings that indicate a push or merge is about to happen. */
const GATE_TOOL_PATTERNS = [
  "git_push",
  "git push",
  "merge_pull_request",
  "mcp_github_merge",
  "push_files",
  "mcp_gitkraken_git_push",
];

// ── Read hook input ────────────────────────────────────────────────────────

if (process.env.PR_QUALITY_GATE_DISABLE === "true") {
  process.exit(0);
}

let hookInput = {};
try {
  const raw = readFileSync("/dev/stdin", "utf8");
  hookInput = raw ? JSON.parse(raw) : {};
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

// ── Load quality cache ─────────────────────────────────────────────────────

let cache = null;
try {
  const raw = readFileSync(CACHE_FILE, "utf8");
  cache = JSON.parse(raw);
} catch {
  // Cache missing — warn and pass through.
  console.error(
    "[pr-quality-gate] WARNING: No quality cache found. " +
    "Run `node .github/hooks/scripts/refresh-pr-quality-cache.js <pr>` " +
    "to populate it before pushing."
  );
  process.exit(0);
}

const ageMs = Date.now() - (cache.fetchedAt ?? 0);
if (ageMs > CACHE_MAX_AGE_MS) {
  console.error(
    `[pr-quality-gate] WARNING: Quality cache is ${Math.round(ageMs / 60000)} min old. ` +
    "Refresh with `node .github/hooks/scripts/refresh-pr-quality-cache.js <pr>`."
  );
  process.exit(0);
}

// ── Evaluate quality gates ─────────────────────────────────────────────────

const issues = [];

// Gate 1: Unresolved PR review threads
const unresolvedThreads = (cache.reviewThreads ?? []).filter(
  (t) => !t.is_resolved && !t.is_outdated
);
if (unresolvedThreads.length > 0) {
  issues.push(
    `${unresolvedThreads.length} unresolved PR review thread(s):\n` +
    unresolvedThreads
      .map((t) => `  • [${t.path}#L${t.line}] ${t.summary}`)
      .join("\n")
  );
}

// Gate 2: Codecov patch coverage below baseline
const patchPct = cache.codecov?.patchCoverage ?? null;
if (patchPct !== null && patchPct < COVERAGE_BASELINE_PCT) {
  const missingFiles = (cache.codecov?.missingFiles ?? [])
    .map((f) => `  • ${f.path} — ${f.patchPct.toFixed(1)}% (${f.missing} missing, ${f.partials} partials)`)
    .join("\n");
  issues.push(
    `Codecov patch coverage is ${patchPct.toFixed(2)}% (baseline: ${COVERAGE_BASELINE_PCT}%).\n` +
    (missingFiles ? `Files with gaps:\n${missingFiles}` : "")
  );
}

// ── Emit result ────────────────────────────────────────────────────────────

if (issues.length === 0) {
  // All gates pass — allow the tool call.
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "allow",
      },
    })
  );
  process.exit(0);
}

// Gates failed — ask the agent to confirm or fix first.
const message =
  "[pr-quality-gate] Push/merge blocked. Address the following before continuing:\n\n" +
  issues.map((issue, i) => `${i + 1}. ${issue}`).join("\n\n") +
  "\n\nUse the `fix-codecov-gaps` and `address-pr-review-locally` skills to resolve these, " +
  "then re-run `refresh-pr-quality-cache.js` to clear the gate.";

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: message,
    },
  })
);
process.exit(0);
