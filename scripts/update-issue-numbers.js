#!/usr/bin/env node

/**
 * Update Issue Numbers in Markdown Files
 *
 * Updates all #TBD placeholders with pre-calculated issue numbers:
 * - Parent headers in sub-issues
 * - Table entries in parent issues
 *
 * Usage:
 *   node scripts/update-issue-numbers.js [--dry-run]
 */

import { promises as fs } from "node:fs";
import { join } from "node:path";

const ISSUES_DRAFT_DIR = "plan-v0.13.x/issues-draft";
const MAPPING_FILE = "artifacts/issue-number-mapping.json";

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

/**
 * Load pre-calculated mapping
 */
async function loadMapping() {
	try {
		const content = await fs.readFile(MAPPING_FILE, "utf-8");
		return JSON.parse(content);
	} catch {
		console.error(`❌ Failed to load mapping file: ${MAPPING_FILE}`);
		console.error("   Run: node scripts/pre-calculate-issue-numbers.js first");
		process.exit(1);
	}
}

/**
 * Update Parent header in sub-issue file
 */
async function updateSubIssueParent(filename, mapping) {
	const filePath = join(ISSUES_DRAFT_DIR, filename);
	const content = await fs.readFile(filePath, "utf-8");

	// Determine parent file based on phase
	const phase = filename.match(/^p(\d+)-/)?.[1];
	if (!phase) {
		console.warn(`⚠️  Skipping ${filename}: Cannot determine phase`);
		return false;
	}

	const parentFilename = Object.keys(mapping.parents).find((f) =>
		f.startsWith(`00${phase}-parent-`),
	);

	if (!parentFilename) {
		console.warn(`⚠️  Skipping ${filename}: No parent found for phase ${phase}`);
		return false;
	}

	const parentIssueNumber = mapping.parents[parentFilename];

	// Check if file has Parent header
	if (content.includes("> **Parent**:")) {
		// Update existing Parent header
		const updated = content.replace(
			/> \*\*Parent\*\*:.*/,
			`> **Parent**: #${parentIssueNumber}`,
		);

		if (!dryRun) {
			await fs.writeFile(filePath, updated);
		}
		console.log(`  ✅ ${filename} → Parent: #${parentIssueNumber}`);
		return true;
	}

	// Add Parent header after title (line 3)
	const lines = content.split("\n");
	lines.splice(2, 0, `> **Parent**: #${parentIssueNumber}`);
	const updated = lines.join("\n");

	if (!dryRun) {
		await fs.writeFile(filePath, updated);
	}
	console.log(`  ➕ ${filename} → Added Parent: #${parentIssueNumber}`);
	return true;
}

/**
 * Update table in parent issue file
 */
async function updateParentTable(filename, mapping) {
	const filePath = join(ISSUES_DRAFT_DIR, filename);
	let content = await fs.readFile(filePath, "utf-8");

	// Extract phase number
	const phase = filename.match(/^00(\d)-parent-/)?.[1];
	if (!phase) {
		console.warn(`⚠️  Skipping ${filename}: Cannot determine phase`);
		return false;
	}

	let updated = false;

	// Find all table rows with #TBD and task IDs
	const tableRowRegex = /\|\s*(\d+)\s*\|\s*#TBD\s*\|\s*(P\d+-\d+)\s*\|/g;

	content = content.replace(tableRowRegex, (match, _rowNum, taskId) => {
		const issueNumber = mapping.taskIds[taskId];
		if (issueNumber) {
			updated = true;
			return match.replace("#TBD", `#${issueNumber}`);
		}
		console.warn(`⚠️  No mapping found for ${taskId} in ${filename}`);
		return match;
	});

	if (updated && !dryRun) {
		await fs.writeFile(filePath, content);
	}

	if (updated) {
		console.log(`  ✅ ${filename} → Updated table with issue numbers`);
	}

	return updated;
}

async function main() {
	console.log("📝 Updating Issue Numbers in Files\n");

	if (dryRun) {
		console.log("🔍 DRY RUN MODE - No files will be modified\n");
	}

	// Load mapping
	const mapping = await loadMapping();
	console.log(
		`📋 Loaded mapping (calculated ${new Date(mapping.calculatedAt).toLocaleString()})\n`,
	);

	// Update sub-issue Parent headers
	console.log("📋 Updating Sub-Issue Parent Headers:");
	const subIssueFiles = Object.keys(mapping.subIssues);
	let subIssuesUpdated = 0;

	for (const filename of subIssueFiles) {
		const success = await updateSubIssueParent(filename, mapping);
		if (success) subIssuesUpdated++;
	}

	// Update parent issue tables
	console.log("\n📋 Updating Parent Issue Tables:");
	const parentFiles = Object.keys(mapping.parents);
	let parentsUpdated = 0;

	for (const filename of parentFiles) {
		const success = await updateParentTable(filename, mapping);
		if (success) parentsUpdated++;
	}

	console.log(`\n✨ ${dryRun ? "Would update" : "Updated"}:`);
	console.log(`   Sub-issues: ${subIssuesUpdated}/${subIssueFiles.length}`);
	console.log(`   Parents: ${parentsUpdated}/${parentFiles.length}`);

	if (dryRun) {
		console.log("\n📝 Run without --dry-run to apply changes");
	} else {
		console.log("\n📝 Next steps:");
		console.log("   1. Review changes: git diff plan-v0.13.x/issues-draft/");
		console.log(
			'   2. Commit changes: git add . && git commit -m "Pre-populate issue numbers"',
		);
		console.log("   3. Create issues: node scripts/create-all-issues.js");
	}
}

main().catch(console.error);
