#!/usr/bin/env node

/**
 * Create Parent Issues Only
 *
 * Creates the 4 parent (epic) issues and saves their issue numbers to a mapping file.
 *
 * Usage:
 *   node scripts/create-parent-issues.js [--dry-run]
 */

import { execFileSync, execSync } from "node:child_process";
import { promises as fs, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ISSUES_DRAFT_DIR = "plan-v0.13.x/issues-draft";
const REPO = "Anselmoo/mcp-ai-agent-guidelines";

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

// Parent issue files in order
const PARENT_FILES = [
	"001-parent-phase1-discoverability.md",
	"002-parent-phase2-domain-extraction.md",
	"003-parent-phase3-broken-tools.md",
	"004-parent-phase4-speckit-integration.md",
];

/**
 * Extract metadata from issue markdown header
 */
function extractMetadata(content) {
	const metadata = {};

	// Extract title
	const titleMatch = content.match(/^# (.+)$/m);
	if (titleMatch) {
		metadata.title = titleMatch[1];
	}

	// Extract labels
	const labelsMatch = content.match(/> \*\*Labels\*\*:\s*(.+)/);
	if (labelsMatch) {
		const labelsStr = labelsMatch[1];
		metadata.labels = labelsStr
			.split(",")
			.map((l) => l.trim().replace(/`/g, ""));
	}

	// Extract milestone
	const milestoneMatch = content.match(/> \*\*Milestone\*\*:\s*(.+)/);
	if (milestoneMatch) {
		metadata.milestone = milestoneMatch[1].trim();
	}

	return metadata;
}

/**
 * Find matching milestone by prefix
 */
function findMatchingMilestone(milestoneTitle) {
	try {
		const output = execSync(
			`gh api repos/${REPO}/milestones --jq '.[].title'`,
			{ encoding: "utf-8" },
		);
		const milestones = output.trim().split("\n");

		// Try exact match first
		if (milestones.includes(milestoneTitle)) {
			return milestoneTitle;
		}

		// Try prefix match (e.g., "M2: Discoverability" matches "M2: Discoverability (End Week 4)")
		const prefixMatch = milestones.find((m) => m.startsWith(milestoneTitle));
		return prefixMatch || null;
	} catch (error) {
		console.warn(`⚠️  Could not query milestones: ${error.message}`);
		return null;
	}
}

/**
 * Ensure label exists
 */
function ensureLabel(label) {
	try {
		const output = execSync(
			`gh label list --repo ${REPO} --json name --jq '.[].name'`,
			{ encoding: "utf-8" },
		);
		const labels = output.trim().split("\n");

		if (!labels.includes(label)) {
			console.warn(`⚠️  Label not found: ${label}`);
		}
	} catch {
		// Ignore - label might exist
	}
}

/**
 * Create GitHub issue
 */
function createGitHubIssue(issueData, dryRun = false) {
	const { title, body, labels, milestone } = issueData;

	if (dryRun) {
		console.log(`\n📄 [DRY RUN] Would create parent issue:`);
		console.log(`   Title: ${title}`);
		console.log(`   Labels: ${labels.join(", ")}`);
		console.log(`   Milestone: ${milestone || "None"}`);
		return null;
	}

	// Ensure all labels exist
	for (const label of labels) {
		ensureLabel(label);
	}

	// Create temporary file for issue body
	const bodyFile = `/tmp/gh-issue-${Date.now()}.md`;
	writeFileSync(bodyFile, body);

	try {
		const args = [
			"issue",
			"create",
			"--repo",
			REPO,
			"--title",
			title,
			"--body-file",
			bodyFile,
		];

		// Add labels
		for (const label of labels) {
			args.push("--label", label);
		}

		// Add milestone
		if (milestone) {
			const shortMilestone = milestone.split("(")[0].trim();
			const matchedMilestone = findMatchingMilestone(shortMilestone);
			if (matchedMilestone) {
				args.push("--milestone", matchedMilestone);
			} else {
				console.warn(`⚠️  Milestone not found: ${shortMilestone}`);
			}
		}

		const output = execFileSync("gh", args, { encoding: "utf-8" });
		const issueUrl = output.trim();
		const issueNumber = Number.parseInt(issueUrl.split("/").pop(), 10);

		console.log(`✅ Created: ${title}`);
		console.log(`   ${issueUrl}`);

		unlinkSync(bodyFile);

		return { url: issueUrl, number: issueNumber };
	} catch (error) {
		try {
			unlinkSync(bodyFile);
		} catch {
			// Ignore
		}
		console.error(`❌ Failed to create issue: ${title}`);
		console.error(error.message);
		return null;
	}
}

/**
 * Process parent issue file
 */
async function processParentFile(filename) {
	const filePath = join(ISSUES_DRAFT_DIR, filename);
	const content = await fs.readFile(filePath, "utf-8");
	const metadata = extractMetadata(content);

	if (!metadata.title) {
		console.warn(`⚠️  Skipping ${filename}: No title found`);
		return null;
	}

	return {
		file: filename,
		title: metadata.title,
		body: content,
		labels: metadata.labels || [],
		milestone: metadata.milestone,
	};
}

async function main() {
	console.log("🚀 Creating Parent (Epic) Issues\n");

	if (dryRun) {
		console.log("📋 Running in DRY RUN mode\n");
	}

	// Process parent files
	const parentIssues = [];
	for (const filename of PARENT_FILES) {
		const issue = await processParentFile(filename);
		if (issue) {
			parentIssues.push(issue);
		}
	}

	console.log(`Found ${parentIssues.length} parent issues to create\n`);

	// Create issues
	const created = [];
	for (const issue of parentIssues) {
		const result = createGitHubIssue(issue, dryRun);
		if (result) {
			created.push({
				file: issue.file,
				number: result.number,
				url: result.url,
			});
		}

		// Rate limit
		if (!dryRun) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}

	console.log(`\n✨ Done! Created ${created.length} parent issues`);

	// Save mapping
	if (!dryRun && created.length > 0) {
		await fs.mkdir("artifacts", { recursive: true });

		const mapping = {};
		for (const item of created) {
			mapping[item.file] = item.number;
		}

		const mappingFile = "artifacts/parent-mapping.json";
		await fs.writeFile(mappingFile, JSON.stringify(mapping, null, 2));

		console.log(`\n📝 Saved parent mapping to ${mappingFile}`);
		console.log("\nNext steps:");
		console.log(
			"1. Update sub-issue Parent headers: node scripts/update-parent-refs.js",
		);
		console.log(
			"2. Create sub-issues: node scripts/create-github-issues.js --skip-parents --export-mapping",
		);
		console.log(
			"3. Link sub-issues to parents: node scripts/create-github-issues.js --link-sub-issues",
		);
		console.log(
			"4. Update parent tables: node scripts/create-github-issues.js --update-parents --mapping <file>",
		);
	}
}

main().catch(console.error);
