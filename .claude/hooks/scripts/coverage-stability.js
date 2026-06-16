#!/usr/bin/env node
/**
 * coverage-stability.js — PreToolUse gate for commit/push operations.
 *
 * Enforces that the repository has a fresh coverage report and that changed
 * TypeScript sources meet the project coverage thresholds before pushing.
 *
 * This hook is intentionally strict for pushes: if the coverage report is
 * missing, stale, or a changed file falls below the allowed thresholds, the
 * tool call is gated with a detailed `permissionDecision: ask` message.
 *
 * Hook JSON: .github/hooks/coverage-stability.json
 *
 * Environment variables:
 *   COVERAGE_STABILITY_DISABLE=true
 *   COVERAGE_REPORT_PATH
 *   COVERAGE_STABILITY_TOTAL_STATEMENTS=90
 *   COVERAGE_STABILITY_TOTAL_LINES=90
 *   COVERAGE_STABILITY_TOTAL_FUNCTIONS=90
 *   COVERAGE_STABILITY_TOTAL_BRANCHES=85
 *   COVERAGE_STABILITY_FILE_STATEMENTS=85
 *   COVERAGE_STABILITY_FILE_LINES=85
 *   COVERAGE_STABILITY_FILE_FUNCTIONS=85
 *   COVERAGE_STABILITY_FILE_BRANCHES=80
 *   COVERAGE_STABILITY_REPORT_MAX_AGE_MINUTES=60
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_TOTAL_TARGETS = {
	statements: 95,
	lines: 95,
	functions: 95,
	branches: 90,
};

const DEFAULT_FILE_TARGETS = {
	statements: 90,
	lines: 90,
	functions: 90,
	branches: 85,
};

function parseTarget(value, fallback) {
	const parsed = Number.parseFloat(value);
	return Number.isFinite(parsed) ? parsed : fallback;
}

const TOTAL_TARGETS = {
	statements: parseTarget(
		process.env.COVERAGE_STABILITY_TOTAL_STATEMENTS,
		DEFAULT_TOTAL_TARGETS.statements,
	),
	lines: parseTarget(
		process.env.COVERAGE_STABILITY_TOTAL_LINES,
		DEFAULT_TOTAL_TARGETS.lines,
	),
	functions: parseTarget(
		process.env.COVERAGE_STABILITY_TOTAL_FUNCTIONS,
		DEFAULT_TOTAL_TARGETS.functions,
	),
	branches: parseTarget(
		process.env.COVERAGE_STABILITY_TOTAL_BRANCHES,
		DEFAULT_TOTAL_TARGETS.branches,
	),
};

const FILE_TARGETS = {
	statements: parseTarget(
		process.env.COVERAGE_STABILITY_FILE_STATEMENTS,
		DEFAULT_FILE_TARGETS.statements,
	),
	lines: parseTarget(
		process.env.COVERAGE_STABILITY_FILE_LINES,
		DEFAULT_FILE_TARGETS.lines,
	),
	functions: parseTarget(
		process.env.COVERAGE_STABILITY_FILE_FUNCTIONS,
		DEFAULT_FILE_TARGETS.functions,
	),
	branches: parseTarget(
		process.env.COVERAGE_STABILITY_FILE_BRANCHES,
		DEFAULT_FILE_TARGETS.branches,
	),
};

const REPORT_MAX_AGE_MS =
	parseTarget(process.env.COVERAGE_STABILITY_REPORT_MAX_AGE_MINUTES, 30) *
	60 *
	1000; // minutes to milliseconds
const REPORT_PATH =
	process.env.COVERAGE_REPORT_PATH ??
	join(process.cwd(), "coverage", "coverage-summary.json");

if (process.env.COVERAGE_STABILITY_DISABLE === "true") {
	process.exit(0);
}

const GATE_TOOL_PATTERNS = [
	"git_commit",
	"git commit",
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
	// No stdin or invalid payload; fall through and use environment/tool args.
}

const toolName = (
	hookInput?.toolName ??
	hookInput?.tool_name ??
	process.env.TOOL_NAME ??
	process.argv[2] ??
	""
).toLowerCase();

if (!GATE_TOOL_PATTERNS.some((pattern) => toolName.includes(pattern))) {
	process.exit(0);
}

function runGit(command) {
	return execSync(command, {
		encoding: "utf8",
		stdio: ["pipe", "pipe", "ignore"],
	})
		.trim()
		.split("\n")
		.filter(Boolean);
}

function getChangedTsFiles() {
	const isCommit = toolName.includes("commit");
	const isPush =
		toolName.includes("push") ||
		toolName.includes("merge") ||
		toolName.includes("create_pull_request");

	try {
		if (isCommit) {
			return runGit("git diff --cached --name-only --diff-filter=ACMRT");
		}

		if (isPush) {
			try {
				const upstream = execSync(
					"git rev-parse --abbrev-ref --symbolic-full-name @{u}",
					{
						encoding: "utf8",
						stdio: ["pipe", "pipe", "ignore"],
					},
				).trim();
				if (upstream) {
					return runGit(
						`git diff --name-only ${upstream}...HEAD --diff-filter=ACMRT`,
					);
				}
			} catch {
				// upstream not available; fallback to last commit if possible
			}

			return runGit("git diff --name-only HEAD~1..HEAD --diff-filter=ACMRT");
		}
	} catch {
		return [];
	}

	return [];
}

function isRelevantTsFile(filePath) {
	return (
		filePath.startsWith("src/") &&
		filePath.endsWith(".ts") &&
		!filePath.startsWith("src/generated/") &&
		!filePath.startsWith("src/tests/") &&
		!filePath.includes("/node_modules/")
	);
}

function findCoverageEntry(summary, filePath) {
	if (Object.hasOwn(summary, filePath)) {
		return summary[filePath];
	}
	const normalized = filePath.replace(/\\/g, "/");
	return (
		Object.entries(summary).find(([key]) => key.endsWith(normalized))?.[1] ??
		null
	);
}

function formatMetricLine(name, data, target) {
	if (!data) return `  ${name.padEnd(12)} — data unavailable`;
	const pct = data.pct ?? 0;
	const pass = pct >= target;
	const icon = pass ? "✅" : "❌";
	const gap =
		!pass && data.total > 0
			? ` (need ${Math.ceil((target / 100) * data.total - data.covered)} more)`
			: "";
	return `  ${icon} ${name.padEnd(12)} ${pct.toFixed(2).padStart(6)}%  (target: ${target}%)${gap}`;
}

if (!existsSync(REPORT_PATH)) {
	const message = [
		"🛡️  Coverage stability blocked: missing coverage report.",
		"",
		`No report found at ${REPORT_PATH}.`,
		"Run `npm run test:coverage` and commit the updated report before pushing.",
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
}

const reportAge = Date.now() - statSync(REPORT_PATH).mtimeMs;
const reportAgeMin = Math.round(reportAge / 60_000);
if (reportAge > REPORT_MAX_AGE_MS) {
	const message = [
		"🛡️  Coverage stability blocked: stale coverage report.",
		"",
		`Coverage report at ${REPORT_PATH} is ${reportAgeMin} minutes old.`,
		"Refresh it by running `npm run test:coverage` before pushing.",
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
}

let report;
try {
	report = JSON.parse(readFileSync(REPORT_PATH, "utf8"));
} catch {
	const message = [
		"🛡️  Coverage stability blocked: invalid coverage report.",
		"",
		`Could not parse ${REPORT_PATH}.`,
		"Regenerate it with `npm run test:coverage`.",
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
}

const total = report?.total ?? {};
const changedFiles = getChangedTsFiles().filter(isRelevantTsFile);
const issues = [];

for (const [metric, target] of Object.entries(TOTAL_TARGETS)) {
	const data = total[metric];
	if (!data || (data.pct ?? 0) < target) {
		issues.push(
			`Total coverage ${metric} is below target: ${formatMetricLine(metric, data, target)}`,
		);
	}
}

if (changedFiles.length > 0) {
	for (const filePath of changedFiles) {
		const entry = findCoverageEntry(report, filePath);
		if (!entry) {
			issues.push(
				`No coverage summary entry found for changed file ${filePath}.`,
			);
			continue;
		}

		for (const [metric, target] of Object.entries(FILE_TARGETS)) {
			const data = entry[metric];
			if (!data || (data.pct ?? 0) < target) {
				issues.push(
					`Changed file ${filePath} is below file-level target for ${metric}: ${formatMetricLine(metric, data, target)}`,
				);
			}
		}
	}
}

if (issues.length === 0) {
	process.stdout.write(JSON.stringify({ continue: true }));
	process.exit(0);
}

const message = [
	"🛡️  Coverage stability gate blocked this push/commit because the current coverage report does not meet the required thresholds.",
	"",
	...issues.map((issue, index) => `  ${index + 1}. ${issue}`),
	"",
	"Fix this by:",
	"  1. Running `npm run test:coverage`",
	"  2. Addressing any uncovered paths in changed TypeScript files",
	"  3. Re-running `npm run test:coverage` and recommitting/retrying the push",
	"",
	"Set COVERAGE_STABILITY_DISABLE=true only for exceptional local debugging; do not use it before merging to main.",
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
