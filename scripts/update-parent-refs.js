#!/usr/bin/env node

/**
 * Update Parent References in Sub-Issue Files
 *
 * After parent issues are created, replace #TBD with actual parent issue numbers.
 *
 * Usage:
 *   node scripts/update-parent-refs.js --mapping artifacts/parent-mapping.json
 */

import { promises as fs } from "node:fs";
import { join } from "node:path";

const ISSUES_DRAFT_DIR = "plan-v0.13.x/issues-draft";

// Parse command line arguments
const args = process.argv.slice(2);
const mappingFile =
	args.find((a) => a.startsWith("--mapping="))?.split("=")[1] ||
	"artifacts/parent-mapping.json";

/**
 * Load parent issue mapping
 * Format: { "001-parent-phase1-discoverability.md": 617, ... }
 */
async function loadParentMapping() {
	try {
		const content = await fs.readFile(mappingFile, "utf-8");
		return JSON.parse(content);
	} catch (error) {
		console.error(`❌ Failed to load mapping file: ${mappingFile}`);
		console.error(error.message);
		process.exit(1);
	}
}

/**
 * Update Parent header in a file
 */
async function updateParentHeader(filePath, parentIssueNumber) {
	const content = await fs.readFile(filePath, "utf-8");
	const lines = content.split("\n");

	// Find Parent header line
	const parentLineIndex = lines.findIndex((line) =>
		line.match(/^> \*\*Parent\*\*:/),
	);

	if (parentLineIndex === -1) {
		console.warn(`⚠️  No Parent header found in ${filePath}`);
		return false;
	}

	// Extract parent filename from comment
	const commentMatch = lines[parentLineIndex].match(/<!-- (.+?) -->/);
	if (!commentMatch) {
		console.warn(`⚠️  No parent filename comment in ${filePath}`);
		return false;
	}

	// Replace #TBD with actual issue number
	lines[parentLineIndex] =
		`> **Parent**: #${parentIssueNumber} <!-- ${commentMatch[1]} -->`;

	await fs.writeFile(filePath, lines.join("\n"));
	return true;
}

async function main() {
	console.log("📝 Updating Parent References in Sub-Issue Files\n");

	// Load parent mapping
	const parentMapping = await loadParentMapping();
	console.log(
		`📋 Loaded ${Object.keys(parentMapping).length} parent issue mappings\n`,
	);

	// Get all sub-issue files
	const files = await fs.readdir(ISSUES_DRAFT_DIR);
	const subIssueFiles = files
		.filter((f) => f.match(/^p\d+-\d+-sub-.+\.md$/))
		.sort();

	console.log(`Found ${subIssueFiles.length} sub-issue files\n`);

	let updated = 0;
	let skipped = 0;

	for (const file of subIssueFiles) {
		const filePath = join(ISSUES_DRAFT_DIR, file);
		const content = await fs.readFile(filePath, "utf-8");

		// Extract parent filename from comment
		const parentMatch = content.match(/> \*\*Parent\*\*:.*<!-- (.+?) -->/);
		if (!parentMatch) {
			console.warn(`⚠️  Skipping ${file}: No parent comment found`);
			skipped++;
			continue;
		}

		const parentFilename = parentMatch[1];
		const parentIssueNumber = parentMapping[parentFilename];

		if (!parentIssueNumber) {
			console.warn(
				`⚠️  Skipping ${file}: Parent ${parentFilename} not in mapping`,
			);
			skipped++;
			continue;
		}

		const success = await updateParentHeader(filePath, parentIssueNumber);
		if (success) {
			console.log(`✅ Updated ${file} → Parent: #${parentIssueNumber}`);
			updated++;
		} else {
			skipped++;
		}
	}

	console.log(`\n✨ Done!`);
	console.log(`   Updated: ${updated} files`);
	console.log(`   Skipped: ${skipped} files`);
}

main().catch(console.error);
