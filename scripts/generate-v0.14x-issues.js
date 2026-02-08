#!/usr/bin/env node

import { execFileSync, execSync } from "node:child_process";
import { promises as fs } from "node:fs";
import { basename, join, posix } from "node:path";

const REPO = "Anselmoo/mcp-ai-agent-guidelines";
const REPO_URL = `https://github.com/${REPO}`;
const REPO_BLOB = `${REPO_URL}/blob/main`;
const REPO_ISSUES = `${REPO_URL}/issues`;
const OUTPUT_FILE = "artifacts/issues-v0.14x.json";
const TASK_DIRS = [
	"plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/phase-1-foundation",
	"plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/phase-2-migration",
	"plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/phase-25-unified-prompts",
	"plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/phase-3-consolidation",
	"plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/phase-4-platform",
	"plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/phase-5-cicd",
	"plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/phase-6-testing",
	"plan-v0.14.x/speckit-v0.14.x-strategic-consolidation/tasks/validation",
];

const PARENT_ISSUES = [
	{
		phase: "1",
		title: "Phase 1: Core Infrastructure",
		priority: "P0",
		labels: ["v0.14.x", "phase-1", "implementation", "P0-critical"],
		milestone: 17,
		parent_issue: 968,
	},
	{
		phase: "2",
		title: "Phase 2: Strategy Migration",
		priority: "P0",
		labels: ["v0.14.x", "phase-2", "implementation", "P0-critical"],
		milestone: 18,
		parent_issue: 969,
	},
	{
		phase: "2.5",
		title: "Phase 2.5: Unified Prompt Ecosystem",
		priority: "P0",
		labels: ["v0.14.x", "phase-25", "implementation", "P0-critical"],
		milestone: 19,
		parent_issue: 970,
	},
	{
		phase: "3",
		title: "Phase 3: Framework Consolidation",
		priority: "P0",
		labels: ["v0.14.x", "phase-3", "implementation", "P0-critical"],
		milestone: 20,
		parent_issue: 971,
	},
	{
		phase: "4",
		title: "Phase 4: Platform Abstraction",
		priority: "P0",
		labels: ["v0.14.x", "phase-4", "implementation", "P0-critical"],
		milestone: 21,
		parent_issue: 972,
	},
	{
		phase: "5",
		title: "Phase 5: CI/CD & Documentation",
		priority: "P0",
		labels: ["v0.14.x", "phase-5", "implementation", "P0-critical"],
		milestone: 22,
		parent_issue: 973,
	},
	{
		phase: "6",
		title: "Phase 6: Testing & Validation",
		priority: "P0",
		labels: ["v0.14.x", "phase-6", "testing", "P0-critical"],
		milestone: 23,
		parent_issue: 974,
	},
	{
		phase: "validation",
		title: "Validation: Phase-wide Verification",
		priority: "P0",
		labels: ["v0.14.x", "testing", "P0-critical"],
		milestone: 24,
		parent_issue: 975,
	},
];

const PHASE_LABELS = {
	1: "phase-1",
	2: "phase-2",
	2.5: "phase-25",
	3: "phase-3",
	4: "phase-4",
	5: "phase-5",
	6: "phase-6",
};

const PHASE_MILESTONES = {
	1: 17,
	2: 18,
	2.5: 19,
	3: 20,
	4: 21,
	5: 22,
	6: 23,
	validation: 24,
};

const PHASE_PARENTS = {
	1: 968,
	2: 969,
	2.5: 970,
	3: 971,
	4: 972,
	5: 973,
	6: 974,
	validation: 975,
};

const PRIORITY_LABELS = {
	P0: "P0-critical",
	P1: "P1-high",
	P2: "P2-medium",
	P3: "P3-low",
};

const MERMAID_PLACEHOLDERS = {
	flow: "graph TD\n  A[Load task file] --> B[Extract metadata]\n  B --> C[Normalize fields]\n  C --> D[Build issue body]\n  D --> E[Emit JSON]",
	class:
		"classDiagram\n  class Issue {\n    +title\n    +body\n    +labels\n    +milestone\n  }\n  class Mermaid {\n    +flow\n    +class\n    +sequence\n    +risk_matrix\n  }\n  Issue --> Mermaid",
	sequence:
		"sequenceDiagram\n  participant User\n  participant Script\n  participant GitHubCLI\n  participant GitHubAPI\n  User->>Script: Run generator\n  Script-->>User: JSON output\n  Script->>GitHubCLI: gh issue create (optional)\n  GitHubCLI->>GitHubAPI: Create issue\n  GitHubAPI-->>GitHubCLI: Issue URL\n  GitHubCLI-->>Script: URL\n  Script-->>User: Creation summary",
	risk_matrix:
		'quadrantChart\n  title Risk Matrix\n  x-axis Low Impact --> High Impact\n  y-axis Low Likelihood --> High Likelihood\n  quadrant-1 Low Likelihood / High Impact\n  quadrant-2 High Likelihood / High Impact\n  quadrant-3 High Likelihood / Low Impact\n  quadrant-4 Low Likelihood / Low Impact\n  "Schema mismatch" : [0.7, 0.3]\n  "Missing labels" : [0.6, 0.7]\n  "Dependency error" : [0.4, 0.6]\n  "Large payload" : [0.3, 0.4]',
};

let existingLabelsCache = null;

const args = process.argv.slice(2);
const dryRunIndex = args.findIndex((arg) => arg.startsWith("--dry-run-limit"));
const dryRunLimitValue =
	dryRunIndex === -1
		? null
		: args[dryRunIndex].includes("=")
			? args[dryRunIndex].split("=")[1]
			: args[dryRunIndex + 1];
const dryRunLimit = Math.max(1, Number(dryRunLimitValue || 4));

const options = {
	output: args.includes("--stdout"),
	create: args.includes("--create"),
	dryRun: args.includes("--dry-run"),
};

function getExistingLabels() {
	if (existingLabelsCache) {
		return existingLabelsCache;
	}
	try {
		const output = execSync(
			`gh label list --repo ${REPO} --json name --limit 200`,
			{ encoding: "utf-8" },
		);
		const labels = JSON.parse(output);
		existingLabelsCache = new Set(labels.map((label) => label.name));
		return existingLabelsCache;
	} catch {
		existingLabelsCache = null;
		return null;
	}
}

function getValidationLabelExists() {
	const labels = getExistingLabels();
	return labels ? labels.has("validation") : false;
}

function parseHeader(lines) {
	let title = null;
	let taskId = null;
	let phase = null;
	let priority = null;
	let estimate = null;
	let dependencies = null;

	if (lines.length > 0 && lines[0].startsWith("# ")) {
		title = lines[0].slice(2).trim();
		const match = title.match(/\b([TV]-\d+)\b/);
		if (match) {
			taskId = match[1];
		}
	}

	for (const line of lines) {
		if (line.startsWith("**Task ID**:")) {
			taskId = line.split(":", 2)[1].trim();
		}
		if (line.startsWith("**Phase**:")) {
			const phaseValue = line.split(":", 2)[1].trim();
			if (phaseValue.toLowerCase().startsWith("validation")) {
				phase = "validation";
			} else {
				const match = phaseValue.match(/^(\d+(?:\.5)?)/);
				phase = match ? match[1] : phaseValue;
			}
		}
		if (line.startsWith("**Priority**:")) {
			const match = line.match(/\b(P\d)\b/);
			if (match) {
				priority = match[1];
			}
		}
		if (line.startsWith("**Estimate**:")) {
			estimate = line.split(":", 2)[1].trim();
		}
		if (line.startsWith("**Dependencies**:")) {
			dependencies = line.split(":", 2)[1].trim();
		}
	}

	return { title, taskId, phase, priority, estimate, dependencies };
}

function parseEstimateHours(estimate) {
	if (!estimate) return null;
	const matches = estimate.match(/\d+(?:\.\d+)?/g);
	if (!matches) return null;
	const total = matches.reduce((sum, value) => sum + Number(value), 0);
	return Number.isInteger(total) ? total : Number(total.toFixed(2));
}

function extractDependencies(depText) {
	if (!depText || depText.toLowerCase() === "none") {
		return [];
	}
	const matches = depText.match(/[TV]-\d+/g);
	return matches ? matches : [];
}

function cleanBody(content) {
	// Parse content to identify fenced code blocks
	const lines = content.split("\n");
	const result = [];
	let inCodeBlock = false;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Track code block boundaries
		if (line.trim().startsWith("```")) {
			inCodeBlock = !inCodeBlock;
		}

		// Filter out Owner/Reviewer lines
		if (line.startsWith("**Owner**:") || line.startsWith("**Reviewer**:")) {
			continue;
		}

		// Preserve trailing whitespace in code blocks, trim elsewhere
		const processedLine = inCodeBlock ? line : line.replace(/\s+$/g, "");
		result.push(processedLine);
	}

	return result.join("\n");
}

function ensureSectionsForCodeBlocks(text) {
	if (!text.includes("```")) {
		return text;
	}

	const hasOverview = /^##\s+Overview\b/m.test(text);
	const hasImplementation = /^##\s+Implementation Details\b/m.test(text);
	const lines = text.split("\n");

	if (!hasOverview) {
		let insertIndex = lines.findIndex((line) => line.startsWith("# "));
		insertIndex = insertIndex === -1 ? 0 : insertIndex + 1;
		while (insertIndex < lines.length && lines[insertIndex].trim() === "") {
			insertIndex += 1;
		}
		lines.splice(insertIndex, 0, "## Overview", "");
	}

	if (!hasImplementation) {
		const codeIndex = lines.findIndex((line) => line.trim().startsWith("```"));
		if (codeIndex !== -1) {
			lines.splice(
				codeIndex,
				0,
				"",
				"## Implementation Details",
				"",
				"Summary: See code snippets below for implementation guidance.",
			);
		}
	}

	return lines.join("\n");
}

function detectFooterPriorityMismatch(text, priority) {
	const match = text.match(
		/\*Task:\s*[TV]-\d+\s*\|\s*Phase:[^|]+\|\s*Priority:\s*([^*]+)\*/,
	);
	if (!match) return null;
	const footerPriority = match[1].trim();
	if (footerPriority === "TBD") {
		return `Footer priority is TBD; using header priority ${priority}.`;
	}
	return null;
}

function addInconsistencyNote(text, note) {
	if (!note) return text;
	const lines = text.split("\n");
	let insertIndex = lines.findIndex((line) => line.trim() === "---");
	if (insertIndex === -1) {
		insertIndex = lines.findIndex((line) => line.startsWith("# "));
		insertIndex = insertIndex === -1 ? 0 : insertIndex + 1;
	} else {
		insertIndex += 1;
	}
	lines.splice(insertIndex, 0, `**Note**: ${note}`, "");
	return lines.join("\n");
}

function categoryLabel(title, filename) {
	const lower = `${title} ${filename}`.toLowerCase();
	if (lower.includes("integration test")) return "integration-test";
	if (["test", "verify", "validation"].some((term) => lower.includes(term))) {
		return "testing";
	}
	if (
		["doc", "guide", "documentation", "adr"].some((term) =>
			lower.includes(term),
		)
	) {
		return "documentation";
	}
	if (
		["ci", "workflow", "pipeline", "cicd"].some((term) => lower.includes(term))
	) {
		return "ci-cd";
	}
	return "implementation";
}

async function listTaskFiles() {
	const files = [];
	for (const dir of TASK_DIRS) {
		const entries = await fs.readdir(dir);
		for (const entry of entries) {
			if (
				entry.toLowerCase() === "readme.md" ||
				entry.toLowerCase() === "migration-checklist.md"
			) {
				continue;
			}
			if (!/^[TV]-\d+.*\.md$/.test(entry)) {
				continue;
			}
			files.push(join(dir, entry));
		}
	}
	return files.sort();
}

function buildParentIssueBody(parent) {
	const childSearchUrl = buildChildIssueSearchUrl(parent.phase);
	return `# ${parent.title}\n\n## Summary\n\nPhase-level parent issue for ${parent.title}.\n\n## Scope\n\n- Track all ${parent.title} tasks\n- Monitor milestones and dependencies\n- Ensure validation tasks are completed\n\n## Child Issues\n\n- ${childSearchUrl}\n\n## Acceptance Criteria\n\n- [ ] All child issues for ${parent.title} are created\n- [ ] Milestone ${parent.milestone} assigned\n- [ ] Phase completion verified\n`;
}

function toRepoPath(filePath) {
	const normalized = filePath.replace(/\\/g, "/");
	return normalized.startsWith("/") ? normalized.slice(1) : normalized;
}

function buildBlobUrl(repoPath) {
	return `${REPO_BLOB}/${repoPath}`;
}

function buildIssueUrl(issueNumber) {
	return `${REPO_ISSUES}/${issueNumber}`;
}

function isExternalLink(link) {
	return /^(?:https?:|mailto:|tel:|#)/i.test(link);
}

function splitLink(link) {
	const hashIndex = link.indexOf("#");
	if (hashIndex === -1) {
		return { path: link, hash: "" };
	}
	return {
		path: link.slice(0, hashIndex),
		hash: link.slice(hashIndex),
	};
}

function resolveRepoLink(link, sourcePath) {
	if (!link) return link;
	if (isExternalLink(link)) return link;
	const { path: linkPath, hash } = splitLink(link.trim());
	const repoPath = toRepoPath(sourcePath);
	if (!repoPath) return link;
	if (linkPath.startsWith("/")) {
		return `${REPO_BLOB}/${linkPath.slice(1)}${hash}`;
	}
	const baseDir = posix.dirname(repoPath);
	const resolved = posix.normalize(posix.join(baseDir, linkPath));
	return `${REPO_BLOB}/${resolved}${hash}`;
}

function rewriteMarkdownLinks(text, sourcePath) {
	if (!sourcePath) return text;
	return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, link) => {
		const resolved = resolveRepoLink(link, sourcePath);
		if (resolved === link) return match;
		return `[${label}](${resolved})`;
	});
}

function insertSectionAfterDivider(text, sectionLines) {
	const lines = text.split("\n");
	const dividerIndex = lines.findIndex((line) => line.trim() === "---");
	const insertIndex = dividerIndex === -1 ? 1 : dividerIndex + 1;
	lines.splice(insertIndex, 0, "", ...sectionLines, "");
	return lines.join("\n");
}

function ensureParentIssueSection(text, parentIssue) {
	if (!parentIssue || text.includes("## Parent Issue")) {
		return text;
	}
	const parentUrl = buildIssueUrl(parentIssue);
	return insertSectionAfterDivider(text, [
		"## Parent Issue",
		"",
		`- ${parentUrl}`,
	]);
}

function ensureSourceSection(text, sourceUrl) {
	if (!sourceUrl || text.includes("## Source")) {
		return text;
	}
	return insertSectionAfterDivider(text, ["## Source", "", `- ${sourceUrl}`]);
}

function buildChildIssueSearchUrl(phase) {
	const labels = ["v0.14.x"];
	if (phase === "validation") {
		labels.push(getValidationLabelExists() ? "validation" : "testing");
	} else if (PHASE_LABELS[phase]) {
		labels.push(PHASE_LABELS[phase]);
	}
	const query = labels.map((label) => `label:${label}`).join(" ");
	return `${REPO_URL}/issues?q=${encodeURIComponent(query)}`;
}

function uniqueArray(values) {
	return [...new Set(values.filter(Boolean))];
}

async function buildIssues() {
	const validationLabelExists = getValidationLabelExists();
	const taskFiles = await listTaskFiles();
	const issues = [];

	for (const parent of PARENT_ISSUES) {
		const labels = [...parent.labels];
		if (parent.phase === "validation" && getValidationLabelExists()) {
			labels.splice(labels.indexOf("testing"), 1, "validation");
		}
		const parentIssueUrl = buildIssueUrl(parent.parent_issue);
		issues.push({
			title: parent.title,
			body: buildParentIssueBody(parent),
			labels: uniqueArray(labels),
			milestone: parent.milestone,
			parent_issue: parent.parent_issue,
			parent_issue_url: parentIssueUrl,
			phase: parent.phase,
			priority: parent.priority,
			task_id:
				parent.phase === "validation" ? "V-PARENT" : `PARENT-${parent.phase}`,
			dependencies: [],
			estimate_hours: null,
			source_path: "",
			source_url: "",
			child_issue_query: buildChildIssueSearchUrl(parent.phase),
			child_task_ids: [],
			inconsistencies: [],
			mermaid: { ...MERMAID_PLACEHOLDERS },
		});
	}
	const seen = new Set();

	for (const file of taskFiles) {
		const content = await fs.readFile(file, "utf-8");
		const lines = content.split("\n");
		const { title, taskId, phase, priority, estimate, dependencies } =
			parseHeader(lines);

		if (!title || !taskId || !phase || !priority) {
			continue;
		}

		if (seen.has(taskId)) {
			throw new Error(`Duplicate task ID detected: ${taskId}`);
		}
		seen.add(taskId);

		const estimateHours = parseEstimateHours(estimate);
		const deps = extractDependencies(dependencies);

		const repoPath = toRepoPath(file);
		const sourceUrl = buildBlobUrl(repoPath);

		let body = cleanBody(content);
		body = ensureSectionsForCodeBlocks(body);
		body = rewriteMarkdownLinks(body, repoPath);
		body = ensureParentIssueSection(body, PHASE_PARENTS[phase]);
		body = ensureSourceSection(body, sourceUrl);

		const inconsistencies = [];
		const mismatchNote = detectFooterPriorityMismatch(body, priority);
		if (mismatchNote) {
			inconsistencies.push(mismatchNote);
			body = addInconsistencyNote(body, mismatchNote);
		}

		for (const field of [
			"Target File",
			"Target Files",
			"Dependencies",
			"Acceptance Criteria",
		]) {
			const regex = new RegExp(`${field}[^\n]*TBD`, "i");
			if (regex.test(body)) {
				inconsistencies.push(`${field} contains TBD.`);
			}
		}

		const labels = ["v0.14.x"];
		if (phase === "validation") {
			if (validationLabelExists) {
				labels.push("validation");
			} else {
				labels.push("testing");
			}
		} else {
			labels.push(PHASE_LABELS[phase]);
		}
		labels.push(categoryLabel(title, basename(file)));
		labels.push(PRIORITY_LABELS[priority]);

		issues.push({
			title,
			body,
			labels: uniqueArray(labels),
			milestone: PHASE_MILESTONES[phase],
			parent_issue: PHASE_PARENTS[phase],
			parent_issue_url: buildIssueUrl(PHASE_PARENTS[phase]),
			phase,
			priority,
			task_id: taskId,
			dependencies: deps,
			estimate_hours: estimateHours,
			source_path: repoPath,
			source_url: sourceUrl,
			child_issue_query: "",
			child_task_ids: [],
			inconsistencies,
			mermaid: { ...MERMAID_PLACEHOLDERS },
		});
	}

	const parentByPhase = new Map(
		issues
			.filter(
				(issue) =>
					issue.task_id?.startsWith("PARENT") || issue.task_id === "V-PARENT",
			)
			.map((issue) => [issue.phase, issue]),
	);
	for (const issue of issues) {
		if (!issue.source_path) continue;
		const parent = parentByPhase.get(issue.phase);
		if (!parent) continue;
		parent.child_task_ids.push(issue.task_id);
	}

	for (const issue of issues) {
		if (issue.child_task_ids?.length) {
			issue.child_task_ids = uniqueArray(issue.child_task_ids);
		}
	}

	return issues;
}

function createIssue(issue) {
	const bodyFile = `/tmp/gh-issue-${Date.now()}-${Math.random().toString(36).slice(2)}.md`;
	return fs
		.writeFile(bodyFile, issue.body)
		.then(() => {
			const args = [
				"issue",
				"create",
				"--repo",
				REPO,
				"--title",
				issue.title,
				"--body-file",
				bodyFile,
			];
			const existingLabels = getExistingLabels();
			for (const label of issue.labels) {
				if (!existingLabels || existingLabels.has(label)) {
					args.push("--label", label);
				}
			}
			const output = execFileSync("gh", args, { encoding: "utf-8" });
			return output.trim();
		})
		.finally(() => fs.unlink(bodyFile).catch(() => {}));
}

async function main() {
	const issues = await buildIssues();
	const json = JSON.stringify(issues);

	if (options.dryRun && !options.create) {
		const preview = issues.slice(0, dryRunLimit);
		console.log(
			JSON.stringify(
				{
					mode: "dry-run",
					total: issues.length,
					previewCount: preview.length,
					preview,
				},
				null,
				2,
			),
		);
		return;
	}

	await fs.mkdir("artifacts", { recursive: true });
	await fs.writeFile(OUTPUT_FILE, json);

	if (options.output) {
		process.stdout.write(json);
		return;
	}

	if (options.create) {
		if (options.dryRun) {
			for (const issue of issues) {
				console.log(`[DRY RUN] ${issue.title}`);
			}
			return;
		}

		for (const issue of issues) {
			const url = await createIssue(issue);
			console.log(`Created ${issue.title}: ${url}`);
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
}

process.stdout.on("error", (err) => {
	if (err && err.code === "EPIPE") {
		process.exit(0);
	}
});

main().catch((error) => {
	console.error(error.message || error);
	process.exit(1);
});
