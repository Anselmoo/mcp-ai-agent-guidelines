#!/usr/bin/env node
/**
 * push-ready.js — PreToolUse gate for push/merge operations
 *
 * Runs four fast, deterministic checks before the agent pushes or merges:
 *
 *   1. Biome lint/format       — `npm run check`
 *   2. Generated-file drift    — `git diff --exit-code src/generated/`
 *                                 (fails if auto-generated files are dirty/unstaged)
 *   3. Skill/instructions      — warns when skill-specs.ts, instruction-specs.ts, or
 *      freshness                  workflow-spec.ts are newer than the .github/ files
 *                                 they should be reflected in
 *   4. Changelog guard         — CHANGELOG.md must have content under ## [Unreleased]
 *                                 (mirrors lefthook's rrt-changelog pre-push check)
 *
 * If all checks pass the tool call is allowed silently.  Any failure returns
 * `permissionDecision: "ask"` with a detailed, actionable message.
 *
 * Hook JSON (see .github/hooks/push-ready.json):
 *   "PreToolUse": [{ "type": "command", "command": "node .github/hooks/scripts/push-ready.js" }]
 *
 * Environment variables:
 *   PUSH_READY_DISABLE=true   — bypass entirely (CI/automation escape hatch)
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// ── Escape hatch ───────────────────────────────────────────────────────────

if (process.env.PUSH_READY_DISABLE === "true") {
  process.exit(0);
}

// ── Tool-name gate ─────────────────────────────────────────────────────────

/** Only intercept push / merge / PR-create tool calls. */
const PUSH_TOOL_PATTERNS = [
  "git_push",
  "git push",
  "merge_pull_request",
  "mcp_github_merge",
  "push_files",
  "mcp_gitkraken_git_push",
  "create_pull_request",
  "mcp_github_create_pull_request",
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

const isGateTool = PUSH_TOOL_PATTERNS.some((p) => toolName.includes(p));
if (!isGateTool) {
  process.exit(0);
}

// ── Checks ─────────────────────────────────────────────────────────────────

const issues = [];

// 1. Biome lint / format
try {
  execSync("npm run check", { stdio: "pipe" });
} catch {
  issues.push(
    "❌ **Biome** lint/format errors detected.\n" +
      "     Fix: `npm run check:fix`  (safe fixes) or `npm run check:fix -- --unsafe` (all fixes)",
  );
}

// 2. Generated-file drift
try {
  execSync("git diff --exit-code src/generated/ docs/architecture/03-skill-graph.md", {
    stdio: "pipe",
  });
} catch {
  issues.push(
    "❌ **Generated files** are out of sync with the source.\n" +
      "     Fix: `python3 scripts/generate-tool-definitions.py && npm run check:generated`\n" +
      "     Then stage the updated files: `git add src/generated/ docs/architecture/`",
  );
}

// 3. Skills / instructions freshness
const SPEC_FILES = [
  "src/skills/skill-specs.ts",
  "src/instructions/instruction-specs.ts",
  "src/workflows/workflow-spec.ts",
];

const CUSTOMIZATION_DIRS = [
  ".github/skills",
  ".github/instructions",
];

function newestMtime(paths) {
  let newest = 0;
  for (const p of paths) {
    if (!existsSync(p)) continue;
    try {
      const m = statSync(p).mtimeMs;
      if (m > newest) newest = m;
    } catch {
      // skip
    }
  }
  return newest;
}

function allFilesIn(dir) {
  if (!existsSync(dir)) return [];
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true, recursive: true })) {
    if (entry.isFile()) {
      results.push(join(entry.parentPath ?? entry.path ?? dir, entry.name));
    }
  }
  return results;
}

const specMtime = newestMtime(SPEC_FILES);
const customFiles = CUSTOMIZATION_DIRS.flatMap(allFilesIn);
const customMtime = newestMtime(customFiles.length > 0 ? customFiles : ["/dev/null"]);

if (specMtime > 0 && specMtime > customMtime) {
  const specAge = Math.round((Date.now() - specMtime) / 60_000);
  issues.push(
    `⚠️  **Skill/instruction specs** were modified ~${specAge}m ago but .github/skills/ and\n` +
      "     .github/instructions/ may not reflect those changes.\n" +
      "     Review: re-run the relevant SKILL.md skill or update .github/instructions/ manually.\n" +
      "     Skills affected: pr-quality-cycle, fix-codecov-gaps, address-pr-review-locally, coverage-guard\n" +
      "     Hook affected: .github/hooks/coverage-guard.json (95% target)",
  );
}

// 4. Changelog guard — mirrors lefthook's rrt-changelog check
const changelogPath = join(process.cwd(), "CHANGELOG.md");
if (existsSync(changelogPath)) {
  const changelog = readFileSync(changelogPath, "utf8");
  const unreleasedMatch = changelog.match(/##\s+\[Unreleased\]([\s\S]*?)(?=\n##\s+\[|$)/i);
  const unreleasedContent = (unreleasedMatch?.[1] ?? "").trim();
  if (!unreleasedContent) {
    issues.push(
      "❌ **CHANGELOG.md** `## [Unreleased]` section is empty.\n" +
        "     Add a changelog entry for this change before pushing.\n" +
        "     Format: `- fix: <description>` or `- feat: <description>`",
    );
  }
}

// ── Result ─────────────────────────────────────────────────────────────────

if (issues.length === 0) {
  process.stdout.write(JSON.stringify({ continue: true }));
  process.exit(0);
}

const message = [
  "🚦 Push-ready gate found issues. Resolve before pushing:",
  "",
  ...issues.map((issue, i) => `  ${i + 1}. ${issue}`),
  "",
  "Set PUSH_READY_DISABLE=true to bypass (not recommended for PRs).",
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
