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
 */

import { execSync } from "node:child_process";
import { promises as fs, unlinkSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const ISSUES_DRAFT_DIR = "plan-v0.13.x/issues-draft";
const MILESTONES_FILE = "plan-v0.13.x/issues-draft/milestones.md";
const REPO = "Anselmoo/mcp-ai-agent-guidelines";

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

	if (dryRun) {
		console.log(`\n📅 [DRY RUN] Would create milestone:`);
		console.log(`   ID: ${id}`);
		console.log(`   Title: ${title}`);
		console.log(`   Due: ${due_on}`);
		console.log(`   State: ${state}`);
		return null;
	}

	try {
		const cmd = `gh api repos/${REPO}/milestones --method POST -f title="${title}" -f description="${description}" -f due_on="${due_on}" -f state="${state}"`;

		const output = execSync(cmd, { encoding: "utf-8" });
		const result = JSON.parse(output);

		console.log(`✅ Created milestone: ${title}`);
		console.log(`   Number: ${result.number}`);
		console.log(`   URL: ${result.html_url}`);

		return result;
	} catch (error) {
		// Check if milestone already exists
		if (error.message.includes("already_exists")) {
			console.log(`⚠️  Milestone already exists: ${title}`);
			return null;
		}

		console.error(`❌ Failed to create milestone: ${title}`);
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

	const labelArgs = labels.map((l) => `--label "${l}"`).join(" ");
	const milestoneArg = milestone ? `--milestone "${milestone}"` : "";
	const assigneeArg = assignee ? `--assignee "${assignee}"` : "";

	// Create temporary file for issue body
	const bodyFile = `/tmp/gh-issue-${Date.now()}.md`;
	writeFileSync(bodyFile, body);

	try {
		const cmd = `gh issue create --repo ${REPO} --title "${title}" ${labelArgs} ${milestoneArg} ${assigneeArg} --body-file "${bodyFile}"`;

		const output = execSync(cmd, { encoding: "utf-8" });
		const issueUrl = output.trim();

		console.log(`✅ Created: ${title}`);
		console.log(`   ${issueUrl}`);

		// Clean up temp file
		unlinkSync(bodyFile);

		return issueUrl;
	} catch (error) {
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
 * Main execution
 */
async function main() {
	// Handle milestone creation mode
	if (options.createMilestones) {
		await createMilestones();
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

	// Save mapping file
	if (!options.dryRun && created.length > 0) {
		const mapping = created.map((i) => ({
			file: i.file,
			title: i.title,
			url: i.url,
			issueNumber: i.url.split("/").pop(),
		}));

		await fs.writeFile(
			"plan-v0.13.x/issue-mapping.json",
			JSON.stringify(mapping, null, 2),
		);

		console.log(`📝 Saved issue mapping to plan-v0.13.x/issue-mapping.json`);
	}
}

main().catch(console.error);
