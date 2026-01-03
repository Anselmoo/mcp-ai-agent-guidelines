#!/usr/bin/env node

/**
 * Create All Issues in Correct Order
 *
 * Creates parent and sub-issues in the correct sequence.
 * Files should already have correct issue numbers populated.
 *
 * Usage:
 *   node scripts/create-all-issues.js [--dry-run] [--parents-only] [--subs-only]
 */

import { execFileSync, execSync } from "node:child_process";
import { promises as fs, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ISSUES_DRAFT_DIR = "plan-v0.13.x/issues-draft";
const REPO = "Anselmoo/mcp-ai-agent-guidelines";
const MAPPING_FILE = "artifacts/issue-number-mapping.json";

// Parent issue files in order
const PARENT_FILES = [
	"001-parent-phase1-discoverability.md",
	"002-parent-phase2-domain-extraction.md",
	"003-parent-phase3-broken-tools.md",
	"004-parent-phase4-speckit-integration.md",
];

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const parentsOnly = args.includes("--parents-only");
const subsOnly = args.includes("--subs-only");

/**
 * Extract metadata from markdown
 */
function extractMetadata(content) {
	const metadata = {};

	const titleMatch = content.match(/^# (.+)$/m);
	if (titleMatch) {
		metadata.title = titleMatch[1];
	}

	const labelsMatch = content.match(/> \*\*Labels\*\*:\s*(.+)/);
	if (labelsMatch) {
		metadata.labels = labelsMatch[1]
			.split(",")
			.map((l) => l.trim().replace(/`/g, ""));
	}

	const milestoneMatch = content.match(/> \*\*Milestone\*\*:\s*(.+)/);
	if (milestoneMatch) {
		metadata.milestone = milestoneMatch[1].trim();
	}

	return metadata;
}

/**
 * Find matching milestone
 */
function findMatchingMilestone(milestoneTitle) {
	try {
		const output = execSync(
			`gh api 'repos/${REPO}/milestones' | jq -r '.[].title'`,
			{ encoding: "utf-8", shell: "/bin/bash" },
		);
		const milestones = output.trim().split("\n");

		if (milestones.includes(milestoneTitle)) {
			return milestoneTitle;
		}

		const prefixMatch = milestones.find((m) => m.startsWith(milestoneTitle));
		return prefixMatch || null;
	} catch {
		return null;
	}
}

/**
 * Create GitHub issue
 */
function createGitHubIssue(issueData, expectedNumber, dryRun = false) {
	const { title, body, labels, milestone } = issueData;

	if (dryRun) {
		console.log(`\n📄 [DRY RUN] Would create issue #${expectedNumber}:`);
		console.log(`   Title: ${title}`);
		console.log(`   Labels: ${labels.join(", ")}`);
		console.log(`   Milestone: ${milestone || "None"}`);
		return expectedNumber;
	}

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

		for (const label of labels) {
			args.push("--label", label);
		}

		if (milestone) {
			const shortMilestone = milestone.split("(")[0].trim();
			const matched = findMatchingMilestone(shortMilestone);
			if (matched) {
				args.push("--milestone", matched);
			}
		}

		const output = execFileSync("gh", args, { encoding: "utf-8" });
		const issueUrl = output.trim();
		const actualNumber = Number.parseInt(issueUrl.split("/").pop(), 10);

		unlinkSync(bodyFile);

		if (actualNumber !== expectedNumber) {
			console.error(
				`⚠️  WARNING: Expected #${expectedNumber} but got #${actualNumber}`,
			);
			console.error(`   This may indicate concurrent issue creation!`);
		} else {
			console.log(`✅ Created #${actualNumber}: ${title}`);
		}

		return actualNumber;
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
 * Process issue file
 */
async function processIssueFile(filename, expectedNumber) {
	const filePath = join(ISSUES_DRAFT_DIR, filename);
	const content = await fs.readFile(filePath, "utf-8");
	const metadata = extractMetadata(content);

	if (!metadata.title) {
		console.warn(`⚠️  Skipping ${filename}: No title found`);
		return null;
	}

	return {
		file: filename,
		expectedNumber,
		title: metadata.title,
		body: content,
		labels: metadata.labels || [],
		milestone: metadata.milestone,
	};
}

async function main() {
	console.log("🚀 Creating All GitHub Issues\n");

	if (dryRun) {
		console.log("📋 DRY RUN MODE\n");
	}

	// Load mapping
	let mapping;
	try {
		const content = await fs.readFile(MAPPING_FILE, "utf-8");
		mapping = JSON.parse(content);
		console.log(`📋 Using pre-calculated numbers from ${MAPPING_FILE}\n`);
	} catch {
		console.error("❌ Mapping file not found!");
		console.error("   Run: node scripts/pre-calculate-issue-numbers.js");
		process.exit(1);
	}

	const created = [];

	// Create parent issues first (unless --subs-only)
	if (!subsOnly) {
		console.log("📋 Creating Parent Issues:\n");
		for (const filename of PARENT_FILES) {
			const expectedNumber = mapping.parents[filename];
			const issue = await processIssueFile(filename, expectedNumber);

			if (issue) {
				const actualNumber = createGitHubIssue(issue, expectedNumber, dryRun);
				if (actualNumber) {
					created.push({ ...issue, actualNumber });
				}

				// Rate limit
				if (!dryRun) {
					await new Promise((resolve) => setTimeout(resolve, 1000));
				}
			}
		}
	}

	// Create sub-issues (unless --parents-only)
	if (!parentsOnly) {
		console.log("\n📋 Creating Sub-Issues:\n");
		const subFiles = Object.keys(mapping.subIssues).sort();

		for (const filename of subFiles) {
			const expectedNumber = mapping.subIssues[filename];
			const issue = await processIssueFile(filename, expectedNumber);

			if (issue) {
				const actualNumber = createGitHubIssue(issue, expectedNumber, dryRun);
				if (actualNumber) {
					created.push({ ...issue, actualNumber });
				}

				// Rate limit
				if (!dryRun) {
					await new Promise((resolve) => setTimeout(resolve, 1000));
				}
			}
		}
	}

	console.log(
		`\n✨ Done! ${dryRun ? "Would create" : "Created"} ${created.length} issues`,
	);

	if (!dryRun && created.length > 0) {
		// Verify all got expected numbers
		const mismatches = created.filter(
			(c) => c.actualNumber !== c.expectedNumber,
		);
		if (mismatches.length > 0) {
			console.warn(`\n⚠️  ${mismatches.length} issues got unexpected numbers!`);
			console.warn("   This may require manual fixing of references.");
		} else {
			console.log("\n✅ All issues got expected numbers!");
			console.log("   All #references should work correctly.");
		}
	}
}

main().catch(console.error);
