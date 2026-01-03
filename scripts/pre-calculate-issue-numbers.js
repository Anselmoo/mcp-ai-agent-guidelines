#!/usr/bin/env node

/**
 * Pre-Calculate GitHub Issue Numbers
 *
 * Queries GitHub for the latest issue number, then pre-calculates
 * all issue numbers for parent and sub-issues before creation.
 *
 * This enables updating all markdown files with correct issue numbers
 * before creating the issues, so all links work immediately.
 *
 * Usage:
 *   node scripts/pre-calculate-issue-numbers.js
 */

import { execSync } from "node:child_process";
import { promises as fs } from "node:fs";

const REPO = "Anselmoo/mcp-ai-agent-guidelines";
const ISSUES_DRAFT_DIR = "plan-v0.13.x/issues-draft";

// Parent issue files in creation order
const PARENT_FILES = [
	"001-parent-phase1-discoverability.md",
	"002-parent-phase2-domain-extraction.md",
	"003-parent-phase3-broken-tools.md",
	"004-parent-phase4-speckit-integration.md",
];

/**
 * Get latest issue number from GitHub
 */
function getLatestIssueNumber() {
	try {
		const output = execSync(
			`gh api 'repos/${REPO}/issues?state=all&per_page=1' | jq '.[0].number'`,
			{ encoding: "utf-8", shell: "/bin/bash" },
		);
		const latestNumber = Number.parseInt(output.trim(), 10);
		console.log(`📊 Latest issue number in repo: #${latestNumber}`);
		return latestNumber;
	} catch (error) {
		console.error("❌ Failed to query GitHub API:", error.message);
		process.exit(1);
	}
}

/**
 * Get all sub-issue files in order
 */
async function getSubIssueFiles() {
	const files = await fs.readdir(ISSUES_DRAFT_DIR);
	return files.filter((f) => f.match(/^p\d+-\d+-sub-.+\.md$/)).sort();
}

/**
 * Extract task ID from filename or content
 */
function extractTaskId(filename) {
	const match = filename.match(/^(p\d+-\d+)-sub-/);
	return match ? match[1].toUpperCase() : null;
}

/**
 * Pre-calculate all issue numbers
 */
async function preCalculateNumbers() {
	console.log("🔢 Pre-Calculating Issue Numbers\n");

	// Get latest issue number
	const latestNumber = getLatestIssueNumber();
	let nextNumber = latestNumber + 1;

	// Calculate parent issue numbers
	const parentMapping = {};
	console.log("\n📋 Parent Issues:");
	for (const filename of PARENT_FILES) {
		parentMapping[filename] = nextNumber;
		console.log(`   ${filename} → #${nextNumber}`);
		nextNumber++;
	}

	// Calculate sub-issue numbers
	const subIssueFiles = await getSubIssueFiles();
	const subIssueMapping = {};
	const taskIdMapping = {};

	console.log(`\n📋 Sub-Issues (${subIssueFiles.length} total):`);
	for (const filename of subIssueFiles) {
		subIssueMapping[filename] = nextNumber;

		// Also map by task ID (e.g., P1-001 → issue number)
		const taskId = extractTaskId(filename);
		if (taskId) {
			taskIdMapping[taskId] = nextNumber;
		}

		console.log(`   ${filename} → #${nextNumber}`);
		nextNumber++;
	}

	// Create comprehensive mapping
	const mapping = {
		calculatedAt: new Date().toISOString(),
		latestIssueNumber: latestNumber,
		nextIssueNumber: nextNumber,
		totalIssues: PARENT_FILES.length + subIssueFiles.length,
		parents: parentMapping,
		subIssues: subIssueMapping,
		taskIds: taskIdMapping,
	};

	// Save mapping
	await fs.mkdir("artifacts", { recursive: true });
	const mappingFile = "artifacts/issue-number-mapping.json";
	await fs.writeFile(mappingFile, JSON.stringify(mapping, null, 2));

	console.log(`\n✅ Saved mapping to ${mappingFile}`);
	console.log(`\n📊 Summary:`);
	console.log(`   Latest issue: #${latestNumber}`);
	console.log(`   First parent: #${latestNumber + 1}`);
	console.log(`   Last parent: #${latestNumber + 4}`);
	console.log(`   First sub-issue: #${latestNumber + 5}`);
	console.log(`   Last sub-issue: #${nextNumber - 1}`);
	console.log(`   Total to create: ${mapping.totalIssues}`);

	console.log("\n📝 Next steps:");
	console.log("   1. Review mapping: cat artifacts/issue-number-mapping.json");
	console.log("   2. Update files: node scripts/update-issue-numbers.js");
	console.log("   3. Review changes: git diff plan-v0.13.x/issues-draft/");
	console.log("   4. Create issues: node scripts/create-all-issues.js");

	return mapping;
}

preCalculateNumbers().catch(console.error);
