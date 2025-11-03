#!/usr/bin/env node

/**
 * Apply SVG frames (header and footer) to all markdown documents
 * Excludes: LICENSE, node_modules, .git, .venv, .serena, .pytest_cache
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

// Frame files
const HEADER_FILE = "docs/.frames-static/09-header.svg";
const FOOTER_FILE = "docs/.frames-static/09-footer.svg";

// Exclusion patterns
const EXCLUDE_PATTERNS = [
	"LICENSE",
	"LICENSE.md",
	"node_modules",
	".git",
	".venv",
	".serena",
	".pytest_cache",
	"dist-info",
];

/**
 * Check if a file path should be excluded
 */
function shouldExclude(filePath) {
	return EXCLUDE_PATTERNS.some((pattern) => filePath.includes(pattern));
}

/**
 * Find all markdown files in the repository
 */
function findMarkdownFiles() {
	try {
		const output = execSync('find . -name "*.md" -type f', {
			cwd: rootDir,
			encoding: "utf-8",
		});

		return output
			.split("\n")
			.filter((line) => line.trim())
			.filter((file) => !shouldExclude(file))
			.map((file) => file.replace(/^\.\//, ""));
	} catch (error) {
		console.error("Error finding markdown files:", error.message);
		return [];
	}
}

/**
 * Calculate relative path from markdown file to frame SVG
 */
function getRelativePath(markdownFile, svgFile) {
	const mdDir = dirname(markdownFile);
	const relPath = relative(mdDir, svgFile);
	// Normalize to forward slashes for SVG URLs
	return relPath.replace(/\\/g, "/");
}

/**
 * Remove existing frame markers from content
 */
function removeExistingFrames(content) {
	// Remove HTML comment markers and everything between them
	const headerPattern = /<!-- HEADER:START -->[\s\S]*?<!-- HEADER:END -->\n*/g;
	const footerPattern = /<!-- FOOTER:START -->[\s\S]*?<!-- FOOTER:END -->\n*/g;

	let cleaned = content.replace(headerPattern, "");
	cleaned = cleaned.replace(footerPattern, "");

	return cleaned.trim();
}

/**
 * Apply frames to a markdown file
 */
function applyFrames(markdownFile) {
	const filePath = join(rootDir, markdownFile);

	if (!existsSync(filePath)) {
		console.warn(`File not found: ${markdownFile}`);
		return false;
	}

	try {
		// Read current content
		let content = readFileSync(filePath, "utf-8");

		// Remove existing frames
		content = removeExistingFrames(content);

		// Calculate relative paths
		const headerPath = getRelativePath(markdownFile, HEADER_FILE);
		const footerPath = getRelativePath(markdownFile, FOOTER_FILE);

		// Create frame markers
		const header = `<!-- HEADER:START -->
![Header](${headerPath})
<!-- HEADER:END -->

`;

		const footer = `

<!-- FOOTER:START -->
![Footer](${footerPath})
<!-- FOOTER:END -->`;

		// Apply frames
		const framedContent = header + content + footer;

		// Write back
		writeFileSync(filePath, framedContent, "utf-8");

		console.log(`✓ Applied frames to: ${markdownFile}`);
		return true;
	} catch (error) {
		console.error(`✗ Error processing ${markdownFile}:`, error.message);
		return false;
	}
}

/**
 * Main execution
 */
function main() {
	console.log("🎨 Applying SVG frames to markdown documents...\n");

	// Verify frame files exist
	const headerPath = join(rootDir, HEADER_FILE);
	const footerPath = join(rootDir, FOOTER_FILE);

	if (!existsSync(headerPath)) {
		console.error(`❌ Header file not found: ${HEADER_FILE}`);
		process.exit(1);
	}

	if (!existsSync(footerPath)) {
		console.error(`❌ Footer file not found: ${FOOTER_FILE}`);
		process.exit(1);
	}

	console.log(`Using frames:`);
	console.log(`  Header: ${HEADER_FILE}`);
	console.log(`  Footer: ${FOOTER_FILE}\n`);

	// Find all markdown files
	const markdownFiles = findMarkdownFiles();

	console.log(`Found ${markdownFiles.length} markdown files\n`);

	if (markdownFiles.length === 0) {
		console.log("No markdown files found to process");
		return;
	}

	// Apply frames to each file
	let successCount = 0;
	let failCount = 0;

	for (const file of markdownFiles) {
		if (applyFrames(file)) {
			successCount++;
		} else {
			failCount++;
		}
	}

	// Summary
	console.log("\n📊 Summary:");
	console.log(`  ✓ Success: ${successCount}`);
	console.log(`  ✗ Failed: ${failCount}`);
	console.log(`  📁 Total: ${markdownFiles.length}`);

	if (failCount > 0) {
		process.exit(1);
	}
}

// Run the script
main();
