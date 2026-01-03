#!/usr/bin/env node

/**
 * Automated GitHub Issue Creation from Markdown Drafts
 *
 * Reads issue draft files with metadata headers and creates GitHub issues
 * using the GitHub CLI (gh).
 *
 * Usage:
 *   node scripts/create-github-issues.js [options]
 *
 * Options:
 *   --dry-run            Preview issues without creating them
 *   --phase <number>     Only create issues for specific phase (0-4)
 *   --parallel           Only create parallel issues (can run concurrently)
 *   --serial             Only create serial issues (must run sequentially)
 *   --skip-parents       Skip parent issues (only create sub-tasks)
 *   --create-milestones  Create GitHub milestones from milestones.md
 *   --milestone <id>     Only create specific milestone (requires --create-milestones)
 *   --link-sub-issues    Link sub-issues to parent epics (requires existing issues)
 *   --update-parents     Update parent issue bodies to replace #TBD with issue numbers
 *   --export-mapping     Export task-ID-to-issue-number mapping to unique JSON file
 *   --mapping <file>     Use specific mapping file for --update-parents
 */

import { execFileSync, execSync } from "node:child_process";
import { promises as fs, unlinkSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const ISSUES_DRAFT_DIR = "plan-v0.13.x/issues-draft";
const MILESTONES_FILE = "plan-v0.13.x/issues-draft/milestones.md";
const REPO = "Anselmoo/mcp-ai-agent-guidelines";

// Label definitions with colors (for auto-creation)
const LABEL_DEFINITIONS = {
	"phase-1": {
		color: "1d76db",
		description: "Phase 1: LLM Tool Discoverability",
	},
	"phase-2": {
		color: "0e8a16",
		description: "Phase 2: Domain Layer Extraction",
	},
	"phase-3": { color: "d93f0b", description: "Phase 3: Broken Tools Fix" },
	"phase-4": { color: "5319e7", description: "Phase 4: Spec-Kit Integration" },
	"phase-4a": {
		color: "6f42c1",
		description: "Phase 4a: Constitution & Generation",
	},
	"phase-4b": {
		color: "7c3aed",
		description: "Phase 4b: Validation & Progress",
	},
	"priority-critical": { color: "b60205", description: "Critical priority" },
	"priority-high": { color: "d93f0b", description: "High priority" },
	"priority-medium": { color: "fbca04", description: "Medium priority" },
	"priority-low": { color: "0e8a16", description: "Low priority" },
	"copilot-suitable": {
		color: "84b6eb",
		description: "Suitable for GitHub Copilot Coding Agent",
	},
	"mcp-serena": {
		color: "c5def5",
		description: "Recommend MCP Serena for semantic code operations",
	},
	"human-required": {
		color: "e99695",
		description: "Requires human decision or review",
	},
	serial: { color: "fef2c0", description: "Must be executed sequentially" },
	parallel: { color: "c2e0c6", description: "Can be executed in parallel" },
	epic: { color: "3e4b9e", description: "Epic/Parent issue" },
};

// Cache for existing labels
let existingLabelsCache = null;

// Cache for existing milestones
let existingMilestonesCache = null;

/**
 * Get existing labels from repo (cached)
 */
function getExistingLabels() {
	if (existingLabelsCache !== null) {
		return existingLabelsCache;
	}

	try {
		const output = execSync(
			`gh label list --repo ${REPO} --json name --limit 200`,
			{
				encoding: "utf-8",
			},
		);
		const labels = JSON.parse(output);
		existingLabelsCache = new Set(labels.map((l) => l.name));
		return existingLabelsCache;
	} catch {
		existingLabelsCache = new Set();
		return existingLabelsCache;
	}
}

/**
 * Get existing milestones from repo (cached)
 */
function getExistingMilestones() {
	if (existingMilestonesCache !== null) {
		return existingMilestonesCache;
	}

	try {
		const output = execSync(
			`gh api repos/${REPO}/milestones --jq '.[].title'`,
			{
				encoding: "utf-8",
			},
		);
		existingMilestonesCache = output.trim().split("\n").filter(Boolean);
		return existingMilestonesCache;
	} catch {
		existingMilestonesCache = [];
		return existingMilestonesCache;
	}
}

/**
 * Find matching milestone by prefix (e.g., "M2: Discoverability" matches "M2: Discoverability (End Week 4)")
 */
function findMatchingMilestone(milestoneName) {
	const milestones = getExistingMilestones();

	// Try exact match first
	if (milestones.includes(milestoneName)) {
		return milestoneName;
	}

	// Try prefix match (milestone name starts with the short version)
	const match = milestones.find((m) => m.startsWith(milestoneName));
	if (match) {
		return match;
	}

	// Try matching by milestone ID (e.g., "M2:")
	const idMatch = milestoneName.match(/^(M\d+):/);
	if (idMatch) {
		const idPrefix = idMatch[1] + ":";
		const idMatched = milestones.find((m) => m.startsWith(idPrefix));
		if (idMatched) {
			return idMatched;
		}
	}

	return null;
}

/**
 * Create a label if it doesn't exist
 */
function ensureLabel(labelName) {
	const existing = getExistingLabels();
	if (existing.has(labelName)) {
		return true;
	}

	const definition = LABEL_DEFINITIONS[labelName];
	if (!definition) {
		console.warn(
			`⚠️  Unknown label: ${labelName} (will attempt to create with default color)`,
		);
	}

	const color = definition?.color || "ededed";
	const description = definition?.description || "";

	try {
		execFileSync(
			"gh",
			[
				"label",
				"create",
				labelName,
				"--repo",
				REPO,
				"--color",
				color,
				"--description",
				description,
				"--force",
			],
			{ encoding: "utf-8" },
		);
		console.log(`🏷️  Created label: ${labelName}`);
		existingLabelsCache.add(labelName);
		return true;
	} catch {
		console.error(`❌ Failed to create label: ${labelName}`);
		return false;
	}
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
	dryRun: args.includes("--dry-run"),
	phase: args.find((a) => a.startsWith("--phase="))?.split("=")[1],
	parallel: args.includes("--parallel"),
	serial: args.includes("--serial"),
	skipParents: args.includes("--skip-parents"),
	createMilestones: args.includes("--create-milestones"),
	milestone: args.find((a) => a.startsWith("--milestone="))?.split("=")[1],
	createLabels: args.includes("--create-labels"),
	linkSubIssues: args.includes("--link-sub-issues"),
	updateParents: args.includes("--update-parents"),
	exportMapping: args.includes("--export-mapping"),
	mappingFile: args.find((a) => a.startsWith("--mapping="))?.split("=")[1],
};

/**
 * Parse milestones from milestones.md
 */
function parseMilestones(content) {
	const milestones = [];
	const milestoneBlocks = content.split(/^### M\d+:/gm).slice(1);

	for (const block of milestoneBlocks) {
		const yamlMatch = block.match(/```yaml\n([\s\S]+?)\n```/);
		if (!yamlMatch) continue;

		const yamlContent = yamlMatch[1];
		const milestone = {};

		// Parse YAML manually (simple key: value format)
		const lines = yamlContent.split("\n");
		let currentKey = null;
		let currentValue = [];

		for (const line of lines) {
			if (line.match(/^[a-z_]+:/)) {
				// Save previous key if exists
				if (currentKey) {
					milestone[currentKey] = currentValue.join("\n").trim();
				}

				// Start new key
				const [key, ...valueParts] = line.split(":");
				currentKey = key.trim();
				currentValue = [valueParts.join(":").trim()];
			} else if (currentKey && line.trim()) {
				// Continue multi-line value
				currentValue.push(line.trim());
			}
		}

		// Save last key
		if (currentKey) {
			milestone[currentKey] = currentValue.join("\n").trim();
		}

		// Remove pipe character from description
		if (milestone.description) {
			milestone.description = milestone.description.replace(/^\|/gm, "").trim();
		}

		if (milestone.id && milestone.title) {
			milestones.push(milestone);
		}
	}

	return milestones;
}

/**
 * Create GitHub milestone using gh CLI
 */
function createGitHubMilestone(milestoneData, dryRun = false) {
	const { id, title, description, due_on, state } = milestoneData;

	// Clean title - remove surrounding quotes if present
	const cleanTitle = title.replace(/^"|"$/g, "");
	// Clean due_on - remove surrounding quotes if present
	const cleanDueOn = due_on.replace(/^"|"$/g, "");

	if (dryRun) {
		console.log(`\n📅 [DRY RUN] Would create milestone:`);
		console.log(`   ID: ${id}`);
		console.log(`   Title: ${cleanTitle}`);
		console.log(`   Due: ${cleanDueOn}`);
		console.log(`   State: ${state}`);
		return null;
	}

	try {
		// Use JSON input via stdin to avoid shell escaping issues
		const payload = JSON.stringify({
			title: cleanTitle,
			description: description || "",
			due_on: cleanDueOn,
			state: state || "open",
		});

		const output = execSync(
			`gh api repos/${REPO}/milestones --method POST --input -`,
			{
				encoding: "utf-8",
				input: payload,
			},
		);
		const result = JSON.parse(output);

		console.log(`✅ Created milestone: ${cleanTitle}`);
		console.log(`   Number: ${result.number}`);
		console.log(`   URL: ${result.html_url}`);

		return result;
	} catch (error) {
		// Check if milestone already exists
		if (error.message.includes("already_exists")) {
			console.log(`⚠️  Milestone already exists: ${cleanTitle}`);
			return null;
		}

		console.error(`❌ Failed to create milestone: ${cleanTitle}`);
		console.error(error.message);
		return null;
	}
}

/**
 * Extract metadata from issue markdown header
 * Parses format like:
 *   # 🔧 P4-001: Title [serial]
 *   > **Labels**: `phase-4a`, `priority-high`, `serial`, `copilot-suitable`
 *   > **Milestone**: M5: Spec-Kit Core
 *   > **Estimate**: 2 hours
 *   > **Depends On**: None
 *   > **Blocks**: P4-002, P4-003
 */
function extractMetadata(content) {
	const metadata = {};

	// Extract title and execution mode
	const titleMatch = content.match(/^# (.+)$/m);
	if (titleMatch) {
		const fullTitle = titleMatch[1];

		// Extract task ID first
		const taskIdMatch = fullTitle.match(/(P\d+-\d+):/);
		if (taskIdMatch) {
			metadata.taskId = taskIdMatch[1];
		}

		// Extract mode from brackets
		if (fullTitle.includes("[serial]")) {
			metadata.mode = "serial";
		} else if (fullTitle.includes("[parallel]")) {
			metadata.mode = "parallel";
		}

		// Keep full title as-is
		metadata.title = fullTitle;
	}

	// Extract labels (format: `label1`, `label2`, ...)
	const labelsMatch = content.match(/> \*\*Labels\*\*:\s*`(.+)`/);
	if (labelsMatch) {
		metadata.labels = labelsMatch[1]
			.split(/`,\s*`/)
			.map((l) => l.replace(/`/g, "").trim());
	}

	// Extract milestone
	const milestoneMatch = content.match(/> \*\*Milestone\*\*:\s*(.+)$/m);
	if (milestoneMatch) {
		metadata.milestone = milestoneMatch[1].trim();
	}

	// Extract estimate
	const estimateMatch = content.match(/> \*\*Estimate\*\*:\s*(.+)$/m);
	if (estimateMatch) {
		metadata.estimate = estimateMatch[1].trim();
	}

	// Extract dependencies
	const dependsMatch = content.match(
		/> \*\*(?:Depends On|Blocked by)\*\*:\s*(.+)$/m,
	);
	if (dependsMatch) {
		const deps = dependsMatch[1].trim();
		if (deps !== "None") {
			metadata.dependsOn = deps.split(",").map((d) => d.trim());
		}
	}

	// Extract blocks
	const blocksMatch = content.match(/> \*\*Blocks\*\*:\s*(.+)$/m);
	if (blocksMatch) {
		const blocks = blocksMatch[1].trim();
		if (blocks !== "None") {
			metadata.blocks = blocks.split(",").map((b) => b.trim());
		}
	}

	// Extract parent
	const parentMatch = content.match(/> \*\*Parent\*\*:\s*\[(.+?)\]/);
	if (parentMatch) {
		metadata.parent = parentMatch[1];
	}

	// Determine phase from labels
	const phaseLabel = metadata.labels?.find((l) => l.startsWith("phase-"));
	if (phaseLabel) {
		metadata.phase = phaseLabel;
	}

	// Determine priority from labels
	const priorityLabel = metadata.labels?.find((l) => l.startsWith("priority-"));
	if (priorityLabel) {
		metadata.priority = priorityLabel.replace("priority-", "");
	}

	// Check for copilot-suitable and mcp-serena
	metadata.copilotSuitable =
		metadata.labels?.includes("copilot-suitable") || false;
	metadata.mcpSerena = metadata.labels?.includes("mcp-serena") || false;

	return metadata;
}

/**
 * Create GitHub issue using gh CLI
 */
function createGitHubIssue(issueData, dryRun = false) {
	const { title, body, labels, milestone, assignee } = issueData;

	if (dryRun) {
		console.log(`\n📄 [DRY RUN] Would create issue:`);
		console.log(`   Title: ${title}`);
		console.log(`   Labels: ${labels.join(", ")}`);
		console.log(`   Milestone: ${milestone || "None"}`);
		console.log(`   Assignee: ${assignee || "None"}`);
		return null;
	}

	// Ensure all labels exist before creating the issue
	for (const label of labels) {
		ensureLabel(label);
	}

	// Create temporary file for issue body
	const bodyFile = `/tmp/gh-issue-${Date.now()}.md`;
	writeFileSync(bodyFile, body);

	try {
		// Build command with proper argument handling
		const args = [
			"issue",
			"create",
			"--repo",
			REPO,
			"--title",
			title, // Will be properly escaped by execFileSync
			"--body-file",
			bodyFile,
		];

		// Add labels
		for (const label of labels) {
			args.push("--label", label);
		}

		// Add milestone (find matching milestone by prefix)
		if (milestone) {
			// Clean up milestone name - extract just the short title if it's a full description
			const shortMilestone = milestone.split("(")[0].trim();
			const matchedMilestone = findMatchingMilestone(shortMilestone);
			if (matchedMilestone) {
				args.push("--milestone", matchedMilestone);
			} else {
				console.warn(`⚠️  Milestone not found: ${shortMilestone}`);
			}
		}

		// Add assignee
		if (assignee) {
			args.push("--assignee", assignee);
		}

		const output = execFileSync("gh", args, { encoding: "utf-8" });
		const issueUrl = output.trim();

		console.log(`✅ Created: ${title}`);
		console.log(`   ${issueUrl}`);

		// Clean up temp file
		unlinkSync(bodyFile);

		return issueUrl;
	} catch (error) {
		// Clean up temp file even on error
		try {
			unlinkSync(bodyFile);
		} catch {
			// Ignore cleanup errors
		}
		console.error(`❌ Failed to create issue: ${title}`);
		console.error(error.message);
		return null;
	}
}

/**
 * Process a single issue draft file
 */
async function processIssueFile(filePath) {
	const content = await fs.readFile(filePath, "utf-8");
	const metadata = extractMetadata(content);

	if (!metadata.title) {
		console.warn(`⚠️  Skipping ${basename(filePath)}: No title found`);
		return null;
	}

	// Determine if this is a parent issue
	const isParent = basename(filePath).match(/^\d{3}-parent-/);

	return {
		file: basename(filePath),
		isParent,
		title: metadata.title,
		taskId: metadata.taskId,
		body: content,
		labels: metadata.labels || [],
		milestone: metadata.milestone,
		mode: metadata.mode || "serial",
		phase: metadata.phase,
		priority: metadata.priority,
		dependsOn: metadata.dependsOn,
		blocks: metadata.blocks,
		estimate: metadata.estimate,
		copilotSuitable: metadata.copilotSuitable,
		mcpSerena: metadata.mcpSerena,
	};
}

/**
 * Create milestones from milestones.md
 */
async function createMilestones() {
	console.log("📅 GitHub Milestone Creation Tool\n");

	if (options.dryRun) {
		console.log("📋 Running in DRY RUN mode (no milestones will be created)\n");
	}

	// Read milestones file
	const content = await fs.readFile(MILESTONES_FILE, "utf-8");
	const milestones = parseMilestones(content);

	console.log(`Found ${milestones.length} milestone definitions\n`);

	// Filter by milestone if specified
	let filteredMilestones = milestones;
	if (options.milestone) {
		filteredMilestones = milestones.filter((m) => m.id === options.milestone);
		if (filteredMilestones.length === 0) {
			console.error(`❌ Milestone "${options.milestone}" not found`);
			process.exit(1);
		}
	}

	console.log(`Creating ${filteredMilestones.length} milestones...\n`);

	// Create milestones
	const created = [];
	for (const milestone of filteredMilestones) {
		const result = createGitHubMilestone(milestone, options.dryRun);
		if (result) {
			created.push(result);
		}

		// Rate limit
		if (!options.dryRun) {
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}

	console.log(`\n✨ Done! Created ${created.length} milestones`);
}

/**
 * Get issue ID from GitHub API
 */
function getIssueId(issueNumber) {
	try {
		const output = execSync(
			`gh api repos/${REPO}/issues/${issueNumber} --jq '.node_id'`,
			{ encoding: "utf-8" },
		);
		return output.trim();
	} catch {
		console.error(`❌ Failed to get ID for issue #${issueNumber}`);
		return null;
	}
}

/**
 * Link sub-issues to parent epic using GitHub sub-issues API
 */
async function linkSubIssuesToParents() {
	console.log("🔗 Linking Sub-Issues to Parent Epics\n");

	// Get all epic issues
	const epicsOutput = execSync(
		`gh issue list --repo ${REPO} --label epic --state open --json number,title`,
		{ encoding: "utf-8" },
	);
	const epics = JSON.parse(epicsOutput);

	console.log(`Found ${epics.length} epic issues\n`);

	// For each epic, find matching sub-issues by phase
	for (const epic of epics) {
		const phaseMatch = epic.title.match(/Phase (\d+)/);
		if (!phaseMatch) continue;

		const phase = phaseMatch[1];
		console.log(`\n📋 Processing ${epic.title}`);

		// Get all phase issues that aren't epics
		const phaseIssuesOutput = execSync(
			`gh issue list --repo ${REPO} --label "phase-${phase}" --state open --json number,title,labels`,
			{ encoding: "utf-8" },
		);
		const allPhaseIssues = JSON.parse(phaseIssuesOutput);

		// Filter out epics in JavaScript
		const phaseIssues = allPhaseIssues.filter(
			(issue) => !issue.labels.some((label) => label.name === "epic"),
		);

		console.log(`   Found ${phaseIssues.length} sub-issues for phase ${phase}`);

		// Get parent issue ID
		const parentId = getIssueId(epic.number);
		if (!parentId) continue;

		// Link each sub-issue
		for (const subIssue of phaseIssues) {
			const subIssueId = getIssueId(subIssue.number);
			if (!subIssueId) continue;

			try {
				// Use GraphQL mutation to add sub-issue
				const mutation = `mutation {
					addSubIssue(input: {
						issueId: "${parentId}"
						subIssueId: "${subIssueId}"
					}) {
						issue {
							number
						}
					}
				}`;

				execSync(`gh api graphql -f query='${mutation}'`, {
					encoding: "utf-8",
				});

				console.log(`   ✅ Linked #${subIssue.number} to epic #${epic.number}`);

				// Rate limit
				await new Promise((resolve) => setTimeout(resolve, 300));
			} catch (error) {
				console.error(
					`   ⚠️  Failed to link #${subIssue.number}: ${error.message}`,
				);
			}
		}
	}

	console.log(`\n✨ Done linking sub-issues!`);
}

/**
 * Update parent issue bodies to replace #TBD with actual issue numbers
 */
async function updateParentIssueBodies() {
	console.log("📝 Updating Parent Issue Bodies\n");

	// Load mapping file if specified
	let mappingData = null;
	if (options.mappingFile) {
		try {
			const mappingContent = await fs.readFile(options.mappingFile, "utf-8");
			mappingData = JSON.parse(mappingContent);
			console.log(`📋 Loaded mapping from ${options.mappingFile}\n`);
		} catch (error) {
			console.error(`❌ Failed to load mapping file: ${error.message}`);
			process.exit(1);
		}
	}

	// Get all epic issues
	const epicsOutput = execSync(
		`gh issue list --repo ${REPO} --label epic --state open --json number,title,body`,
		{ encoding: "utf-8" },
	);
	const epics = JSON.parse(epicsOutput);

	console.log(`Found ${epics.length} epic issues\n`);

	for (const epic of epics) {
		const phaseMatch = epic.title.match(/Phase (\d+)/);
		if (!phaseMatch) continue;

		const phase = phaseMatch[1];
		console.log(`\n📋 Processing ${epic.title}`);

		// Check if body contains #TBD
		if (!epic.body.includes("#TBD")) {
			console.log(`   ℹ️  No #TBD placeholders found, skipping`);
			continue;
		}

		// Build task map from either mapping file or GitHub API
		const taskMap = {};

		if (mappingData) {
			// Use mapping file: convert P1-001 keys to numeric taskNum
			for (const [taskId, issueNum] of Object.entries(mappingData)) {
				const match = taskId.match(/P\d+-(\d+)/);
				if (match) {
					const taskNum = Number.parseInt(match[1], 10);
					taskMap[taskNum] = issueNum;
				}
			}
			console.log(`   Using ${Object.keys(taskMap).length} mappings from file`);
		} else {
			// Query GitHub API for phase issues
			const phaseIssuesOutput = execSync(
				`gh issue list --repo ${REPO} --label "phase-${phase}" --state open --json number,title,labels --limit 100`,
				{ encoding: "utf-8" },
			);
			const allPhaseIssues = JSON.parse(phaseIssuesOutput);

			// Filter out epics in JavaScript instead of jq
			const phaseIssues = allPhaseIssues
				.filter((issue) => !issue.labels.some((label) => label.name === "epic"))
				.sort((a, b) => a.number - b.number);

			console.log(`   Found ${phaseIssues.length} sub-issues from GitHub`);

			// Extract task IDs from sub-issue titles (e.g., "P1-001", "P2-015")
			for (const issue of phaseIssues) {
				const taskMatch = issue.title.match(/P\d+-(\d+)/);
				if (taskMatch) {
					const taskNum = Number.parseInt(taskMatch[1], 10);
					taskMap[taskNum] = issue.number;
				}
			}
		}

		// Replace #TBD with actual issue numbers
		let updatedBody = epic.body;
		const tableRows = updatedBody.match(/\|\s*\d+\s*\|\s*#TBD\s*\|[^\n]+/g);

		if (tableRows) {
			for (const row of tableRows) {
				const rowMatch = row.match(
					/\|\s*(\d+)\s*\|\s*#TBD\s*\|\s*P\d+-(\d+)\s*\|/,
				);
				if (rowMatch) {
					const taskNum = Number.parseInt(rowMatch[2], 10);
					const issueNumber = taskMap[taskNum];
					if (issueNumber) {
						const newRow = row.replace("#TBD", `#${issueNumber}`);
						updatedBody = updatedBody.replace(row, newRow);
						console.log(
							`   Updated row ${rowMatch[1]}: #TBD → #${issueNumber}`,
						);
					}
				}
			}

			// Update the issue body
			if (updatedBody !== epic.body) {
				if (options.dryRun) {
					console.log(`   [DRY RUN] Would update issue #${epic.number}`);
				} else {
					try {
						// Write body to temp file
						const bodyFile = `/tmp/gh-epic-body-${Date.now()}.md`;
						writeFileSync(bodyFile, updatedBody);

						execFileSync(
							"gh",
							[
								"issue",
								"edit",
								epic.number.toString(),
								"--body-file",
								bodyFile,
							],
							{ encoding: "utf-8" },
						);

						unlinkSync(bodyFile);
						console.log(`   ✅ Updated issue #${epic.number}`);

						// Rate limit
						await new Promise((resolve) => setTimeout(resolve, 500));
					} catch (error) {
						console.error(
							`   ❌ Failed to update #${epic.number}: ${error.message}`,
						);
					}
				}
			}
		}
	}

	console.log(`\n✨ Done updating parent issues!`);
}

/**
 * Main execution
 */
async function main() {
	// Handle milestone creation mode
	if (options.createMilestones) {
		await createMilestones();
		return;
	}

	// Handle link sub-issues mode
	if (options.linkSubIssues) {
		await linkSubIssuesToParents();
		return;
	}

	// Handle update parents mode
	if (options.updateParents) {
		await updateParentIssueBodies();
		return;
	}

	console.log("🚀 GitHub Issue Creation Tool\n");

	if (options.dryRun) {
		console.log("📋 Running in DRY RUN mode (no issues will be created)\n");
	}

	// Read all issue draft files
	const files = await fs.readdir(ISSUES_DRAFT_DIR);
	const issueFiles = files
		.filter((f) => f.match(/^\d{3}-(sub|parent)-.+\.md$/))
		.sort();

	console.log(`Found ${issueFiles.length} issue draft files\n`);

	// Process each file
	const issues = [];
	for (const file of issueFiles) {
		const filePath = join(ISSUES_DRAFT_DIR, file);
		const issue = await processIssueFile(filePath);

		if (issue) {
			// Apply filters
			if (options.skipParents && issue.isParent) {
				continue;
			}
			if (options.phase && !issue.phase?.includes(`phase-${options.phase}`)) {
				continue;
			}
			if (options.parallel && issue.mode !== "parallel") {
				continue;
			}
			if (options.serial && issue.mode !== "serial") {
				continue;
			}

			issues.push(issue);
		}
	}

	console.log(`\n📊 Summary:`);
	console.log(`   Total issues to create: ${issues.length}`);
	console.log(`   Parent issues: ${issues.filter((i) => i.isParent).length}`);
	console.log(
		`   Sub-task issues: ${issues.filter((i) => !i.isParent).length}`,
	);
	console.log(
		`   By mode: ${issues.filter((i) => i.mode === "parallel").length} parallel, ${issues.filter((i) => i.mode === "serial").length} serial`,
	);
	console.log(
		`   Copilot-suitable: ${issues.filter((i) => i.copilotSuitable).length}`,
	);
	console.log(
		`   Requires MCP Serena: ${issues.filter((i) => i.mcpSerena).length}\n`,
	);

	// Create issues
	const created = [];
	for (const issue of issues) {
		const url = createGitHubIssue(issue, options.dryRun);
		if (url) {
			created.push({ ...issue, url });
		}

		// Rate limit: wait 1 second between creates
		if (!options.dryRun) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}

	console.log(`\n✨ Done! Created ${created.length} issues`);

	// Save mapping file with unique timestamp
	if (!options.dryRun && created.length > 0) {
		const timestamp = new Date()
			.toISOString()
			.replace(/[:.]/g, "-")
			.slice(0, -5);
		const mappingFile = options.exportMapping
			? `artifacts/issue-mapping-${timestamp}.json`
			: "plan-v0.13.x/issue-mapping.json";

		// Ensure artifacts directory exists if using --export-mapping
		if (options.exportMapping) {
			await fs.mkdir("artifacts", { recursive: true });
		}

		// Create mapping with task IDs extracted from titles
		const mapping = {};
		for (const issue of created) {
			const taskMatch = issue.title.match(/P(\d+)-(\d+)/);
			if (taskMatch) {
				const taskId = `P${taskMatch[1]}-${taskMatch[2]}`;
				const issueNumber = issue.url.split("/").pop();
				mapping[taskId] = Number.parseInt(issueNumber, 10);
			}
		}

		await fs.writeFile(mappingFile, JSON.stringify(mapping, null, 2));

		console.log(`📝 Saved issue mapping to ${mappingFile}`);
		if (options.exportMapping) {
			console.log(`   Use: --mapping=${mappingFile} to update parent tables`);
		}
	}
}

main().catch(console.error);
