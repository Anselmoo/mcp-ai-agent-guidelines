#!/usr/bin/env node

/**
 * Link Sub-Issues to Parent Epics
 *
 * This script links all sub-issues to their parent epics using GitHub's GraphQL API.
 * Should be run AFTER create-all-issues.js has created all issues.
 *
 * Usage:
 *   node scripts/link-sub-issues.js [--dry-run]
 *
 * Prerequisites:
 *   - All issues must be created on GitHub
 *   - artifacts/issue-number-mapping.json must exist
 *   - GitHub CLI (gh) must be installed and authenticated
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dryRun = process.argv.includes("--dry-run");

/**
 * Get the internal GitHub ID for an issue number
 */
function getIssueId(issueNumber) {
	try {
		const result = execSync(
			`gh api graphql -f query='query { repository(owner: "Anselmoo", name: "mcp-ai-agent-guidelines") { issue(number: ${issueNumber}) { id } } }'`,
			{ encoding: "utf-8" },
		);
		const data = JSON.parse(result);
		return data.data?.repository?.issue?.id;
	} catch (error) {
		console.error(
			`Failed to get ID for issue #${issueNumber}: ${error.message}`,
		);
		return null;
	}
}

/**
 * Link a sub-issue to its parent using GraphQL mutation
 */
async function linkSubIssue(parentNumber, subIssueNumber) {
	const parentId = getIssueId(parentNumber);
	if (!parentId) {
		throw new Error(`Could not get ID for parent issue #${parentNumber}`);
	}

	const subIssueId = getIssueId(subIssueNumber);
	if (!subIssueId) {
		throw new Error(`Could not get ID for sub-issue #${subIssueNumber}`);
	}

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

	if (dryRun) {
		console.log(
			`   [DRY-RUN] Would link #${subIssueNumber} to parent #${parentNumber}`,
		);
		return;
	}

	try {
		execSync(`gh api graphql -f query='${mutation}'`, {
			encoding: "utf-8",
			stdio: "pipe",
		});
		console.log(`   ✅ Linked #${subIssueNumber} to parent #${parentNumber}`);
	} catch (error) {
		console.error(`   ❌ Failed to link #${subIssueNumber}: ${error.message}`);
		throw error;
	}

	// Rate limit - GitHub API rate limit is 5000/hour, so 300ms should be safe
	await new Promise((resolve) => setTimeout(resolve, 300));
}

/**
 * Get parent issue number from a sub-issue file
 */
function getParentNumber(filename, mapping) {
	// Extract parent prefix (e.g., "p1" from "p1-001-sub-...")
	const match = filename.match(/^p(\d+)-/);
	if (!match) {
		throw new Error(`Invalid sub-issue filename: ${filename}`);
	}

	const phaseNum = match[1];

	// Find the matching parent file
	const parentFile = Object.keys(mapping.parents).find((f) =>
		f.startsWith(`00${phaseNum}-parent-`),
	);

	if (!parentFile) {
		throw new Error(`Could not find parent file for phase ${phaseNum}`);
	}

	return mapping.parents[parentFile];
}

/**
 * Main execution
 */
async function main() {
	console.log("🔗 Linking Sub-Issues to Parent Epics\n");

	if (dryRun) {
		console.log(
			"ℹ️  Running in DRY-RUN mode - no actual changes will be made\n",
		);
	}

	// Load the mapping file
	const mappingPath = path.join(
		__dirname,
		"..",
		"artifacts",
		"issue-number-mapping.json",
	);
	const mapping = JSON.parse(readFileSync(mappingPath, "utf-8"));

	console.log(
		`📊 Total sub-issues to link: ${Object.keys(mapping.subIssues).length}\n`,
	);

	// Group sub-issues by parent
	const linksByParent = new Map();

	for (const [filename, subIssueNumber] of Object.entries(mapping.subIssues)) {
		const parentNumber = getParentNumber(filename, mapping);

		if (!linksByParent.has(parentNumber)) {
			linksByParent.set(parentNumber, []);
		}

		linksByParent.get(parentNumber).push({ filename, subIssueNumber });
	}

	// Link each parent's sub-issues
	let totalLinked = 0;
	let totalFailed = 0;

	for (const [parentNumber, subIssues] of linksByParent) {
		console.log(`\n📌 Parent Issue #${parentNumber}:`);
		console.log(`   Linking ${subIssues.length} sub-issues...\n`);

		for (const { filename, subIssueNumber } of subIssues) {
			try {
				await linkSubIssue(parentNumber, subIssueNumber);
				totalLinked++;
			} catch (error) {
				console.error(`   ⚠️  Failed: ${filename} → ${error.message}`);
				totalFailed++;
			}
		}
	}

	// Summary
	console.log("\n" + "=".repeat(60));
	console.log("📊 Linking Summary:");
	console.log("=".repeat(60));
	console.log(`✅ Successfully linked: ${totalLinked}`);
	if (totalFailed > 0) {
		console.log(`❌ Failed to link: ${totalFailed}`);
	}
	console.log("=".repeat(60));

	if (dryRun) {
		console.log(
			"\nℹ️  This was a dry-run. To actually link issues, run without --dry-run",
		);
	} else {
		console.log("\n✨ All sub-issues have been linked to their parent epics!");
	}
}

// Run the script
main().catch((error) => {
	console.error("\n❌ Fatal error:", error.message);
	process.exit(1);
});
