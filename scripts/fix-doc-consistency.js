#!/usr/bin/env node

/**
 * Documentation Consistency Fixer
 *
 * Automatically fixes common documentation inconsistencies:
 * - File naming conventions (SCREAMING_SNAKE_CASE vs kebab-case)
 * - Missing header/footer structures
 * - Incomplete header/footer markers
 */

import {
	readdirSync,
	readFileSync,
	renameSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Configuration
const DOCS_DIR = join(__dirname, "..", "docs");
const DRY_RUN = process.argv.includes("--dry-run");

const NAMING_CONVENTIONS = {
	tips: "SCREAMING_SNAKE_CASE",
	tools: "kebab-case",
	root: "SCREAMING_SNAKE_CASE",
};

// Track changes
const changes = {
	renamed: [],
	headersAdded: [],
	footersFixed: [],
};

/**
 * Convert filename to expected convention
 */
function convertToConvention(filename, convention) {
	const ext = extname(filename);
	const base = basename(filename, ext);

	if (base === "README") return filename;

	switch (convention) {
		case "SCREAMING_SNAKE_CASE": {
			// kebab-case or camelCase to SCREAMING_SNAKE_CASE
			const converted = base
				.replace(/([a-z])([A-Z])/g, "$1_$2") // camelCase to snake_case
				.replace(/-/g, "_") // kebab-case to snake_case
				.toUpperCase();
			return converted + ext;
		}
		case "kebab-case": {
			// SCREAMING_SNAKE_CASE or camelCase to kebab-case
			const converted = base
				.replace(/([a-z])([A-Z])/g, "$1-$2") // camelCase to kebab-case
				.replace(/_/g, "-") // snake_case to kebab-case
				.toLowerCase();
			return converted + ext;
		}
		default:
			return filename;
	}
}

/**
 * Get expected convention based on directory
 */
function getExpectedConvention(filepath) {
	const relativePath = relative(DOCS_DIR, filepath);
	const parts = relativePath.split("/");

	if (parts.includes("tips")) return NAMING_CONVENTIONS.tips;
	if (parts.includes("tools")) return NAMING_CONVENTIONS.tools;
	return NAMING_CONVENTIONS.root;
}

/**
 * Check and fix file naming
 */
function fixFileNaming(filepath) {
	const expectedConvention = getExpectedConvention(filepath);
	const currentName = basename(filepath);
	const expectedName = convertToConvention(currentName, expectedConvention);

	if (currentName !== expectedName) {
		const newPath = join(dirname(filepath), expectedName);

		changes.renamed.push({
			from: relative(DOCS_DIR, filepath),
			to: relative(DOCS_DIR, newPath),
			convention: expectedConvention,
		});

		if (!DRY_RUN) {
			renameSync(filepath, newPath);
		}

		return newPath;
	}

	return filepath;
}

/**
 * Add header if missing
 */
function fixHeader(filepath, content) {
	const lines = content.split("\n");

	const hasHeaderStart = lines.some((line) =>
		line.includes("<!-- HEADER:START -->"),
	);
	const hasHeaderEnd = lines.some((line) =>
		line.includes("<!-- HEADER:END -->"),
	);
	const hasHeaderImage = lines.some((line) =>
		/!\[Header\]\(.+\.svg\)/.test(line),
	);

	// Determine relative path to .frames-static
	const relativePath = relative(DOCS_DIR, filepath);
	const depth = relativePath.split("/").length - 1;
	const svgPath = "../".repeat(depth) + ".frames-static/09-header.svg";

	if (!hasHeaderStart || !hasHeaderEnd || !hasHeaderImage) {
		const header = `<!-- HEADER:START -->

![Header](${svgPath})

<!-- HEADER:END -->

`;

		changes.headersAdded.push(relative(DOCS_DIR, filepath));

		if (!DRY_RUN) {
			return header + content;
		}
	}

	return content;
}

/**
 * Fix footer typos and structure
 */
function fixFooter(filepath, content) {
	// Fix common typo: !-- instead of <!--
	if (content.includes("!-- FOOTER:START -->")) {
		const fixed = content.replace(
			"!-- FOOTER:START -->",
			"<!-- FOOTER:START -->",
		);

		changes.footersFixed.push({
			file: relative(DOCS_DIR, filepath),
			issue: "Fixed typo: !-- → <!--",
		});

		return fixed;
	}

	return content;
}

/**
 * Process a single markdown file
 */
function processMarkdownFile(filepath) {
	// First, fix naming
	const updatedPath = fixFileNaming(filepath);

	// Read content
	const content = readFileSync(updatedPath, "utf-8");

	// Fix header and footer
	let modified = fixHeader(updatedPath, content);
	modified = fixFooter(updatedPath, modified);

	// Write back if changed
	if (modified !== content && !DRY_RUN) {
		writeFileSync(updatedPath, modified, "utf-8");
	}
}

/**
 * Recursively scan directory
 */
function scanDirectory(dir) {
	const entries = readdirSync(dir);

	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);

		if (stat.isDirectory()) {
			// Skip special directories
			if (!entry.startsWith(".") && entry !== "node_modules") {
				scanDirectory(fullPath);
			}
		} else if (stat.isFile() && extname(fullPath) === ".md") {
			processMarkdownFile(fullPath);
		}
	}
}

/**
 * Main function
 */
function main() {
	console.log("🔧 Fixing documentation consistency issues...\n");

	if (DRY_RUN) {
		console.log("🔍 DRY RUN MODE - No files will be modified\n");
	}

	scanDirectory(DOCS_DIR);

	// Print summary
	console.log("=".repeat(80));
	console.log("\n📊 Summary:\n");

	if (changes.renamed.length > 0) {
		console.log(`✏️  Files Renamed: ${changes.renamed.length}`);
		for (const change of changes.renamed) {
			console.log(`   ${change.from} → ${change.to} (${change.convention})`);
		}
		console.log();
	}

	if (changes.headersAdded.length > 0) {
		console.log(`📝 Headers Added: ${changes.headersAdded.length}`);
		for (const file of changes.headersAdded) {
			console.log(`   ${file}`);
		}
		console.log();
	}

	if (changes.footersFixed.length > 0) {
		console.log(`🔧 Footers Fixed: ${changes.footersFixed.length}`);
		for (const fix of changes.footersFixed) {
			console.log(`   ${fix.file}: ${fix.issue}`);
		}
		console.log();
	}

	const totalChanges =
		changes.renamed.length +
		changes.headersAdded.length +
		changes.footersFixed.length;

	if (totalChanges === 0) {
		console.log("✅ No issues found - documentation is already consistent!");
	} else if (DRY_RUN) {
		console.log(`💡 Run without --dry-run to apply ${totalChanges} changes`);
	} else {
		console.log(`✅ Applied ${totalChanges} fixes successfully!`);
		console.log("\n💡 Don't forget to run: npm run docs:lint");
	}

	console.log();
}

// Run the fixer
main();
