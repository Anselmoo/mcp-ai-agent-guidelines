#!/usr/bin/env node

/**
 * Apply Minimalistic Documentation Frames to Markdown Files
 *
 * Idempotently injects iframe references with hardcoded absolute GitHub URLs
 * for compatibility with GitHub markdown rendering.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// GitHub repository information
const GITHUB_REPO = "Anselmoo/mcp-ai-agent-guidelines";
const GITHUB_BRANCH = "main";
const FRAMES_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/docs/.frames-interactive`;

// Injection markers
const HEADER_START = "<!-- AUTO-GENERATED INTERACTIVE HEADER - DO NOT EDIT -->";
const HEADER_END = "<!-- END AUTO-GENERATED INTERACTIVE HEADER -->";
const FOOTER_START = "<!-- AUTO-GENERATED INTERACTIVE FOOTER - DO NOT EDIT -->";
const FOOTER_END = "<!-- END AUTO-GENERATED INTERACTIVE FOOTER -->";

// File mappings: markdown file -> frame file base name
const FILE_MAPPINGS = {
	"README.md": "README",
	"CHANGELOG.md": "CHANGELOG",
	"CONTRIBUTING.md": "CONTRIBUTING",
	"DISCLAIMER.md": "DISCLAIMER",
	"docs/README.md": "docs-README",
	"docs/tips/README.md": "tips-README",
	"docs/about/README.md": "about-README",
	"docs/tools/README.md": "tools-README",
};

/**
 * Remove existing frames from content
 */
function removeExistingFrames(content) {
	// Remove header
	const headerRegex = new RegExp(
		`${HEADER_START}[\\s\\S]*?${HEADER_END}\\n*`,
		"g",
	);
	content = content.replace(headerRegex, "");

	// Remove footer
	const footerRegex = new RegExp(
		`${FOOTER_START}[\\s\\S]*?${FOOTER_END}\\n*`,
		"g",
	);
	content = content.replace(footerRegex, "");

	return content;
}

/**
 * Create iframe HTML with hardcoded absolute URL
 */
function createFrameHTML(frameFile, type) {
	const height = type === "header" ? "120px" : "80px";
	const frameUrl = `${FRAMES_BASE_URL}/${frameFile}`;

	return `${type === "header" ? HEADER_START : FOOTER_START}
<iframe
    src="${frameUrl}"
    style="width: 100%; height: ${height}; border: none; display: block; margin: 0; padding: 0;"
    title="${type === "header" ? "Interactive Header" : "Interactive Footer"}"
    loading="lazy"
    sandbox="allow-scripts allow-same-origin"
></iframe>
${type === "header" ? HEADER_END : FOOTER_END}

`;
}

/**
 * Apply frames to a single markdown file
 */
function applyFramesToFile(filePath, frameBaseName, dryRun = false) {
	const projectRoot = dirname(__dirname);
	const fullPath = join(projectRoot, filePath);

	try {
		// Read file
		let content = readFileSync(fullPath, "utf-8");
		const originalContent = content;

		// Remove existing frames
		content = removeExistingFrames(content);

		// Create header and footer HTML with absolute URLs
		const headerHTML = createFrameHTML(
			`header-${frameBaseName}.html`,
			"header",
		);
		const footerHTML = createFrameHTML(
			`footer-${frameBaseName}.html`,
			"footer",
		);

		// Inject frames
		const newContent = `${headerHTML}${content}\n${footerHTML}`;

		// Check if content changed
		if (newContent === originalContent) {
			console.log(`  ⊝ No changes needed: ${filePath}`);
			return false;
		}

		if (dryRun) {
			console.log(`  ⊕ Would update: ${filePath}`);
			console.log(
				`    - Header: ${FRAMES_BASE_URL}/header-${frameBaseName}.html`,
			);
			console.log(
				`    - Footer: ${FRAMES_BASE_URL}/footer-${frameBaseName}.html`,
			);
			return true;
		}

		// Write file
		writeFileSync(fullPath, newContent, "utf-8");
		console.log(`  ✓ Updated: ${filePath}`);
		console.log(
			`    - Header: ${FRAMES_BASE_URL}/header-${frameBaseName}.html`,
		);
		console.log(
			`    - Footer: ${FRAMES_BASE_URL}/footer-${frameBaseName}.html`,
		);
		return true;
	} catch (error) {
		console.error(`  ✗ Error processing ${filePath}: ${error.message}`);
		return false;
	}
}

/**
 * Main application function
 */
function applyFrames() {
	// Check for dry-run flag
	const dryRun = process.argv.includes("--dry-run");

	console.log("🎨 Applying Minimalistic Documentation Frames...\n");
	console.log(`🔗 Base URL: ${FRAMES_BASE_URL}\n`);

	if (dryRun) {
		console.log("🔍 DRY RUN MODE - No files will be modified\n");
	}

	let filesProcessed = 0;
	let filesUpdated = 0;

	// Process each file
	for (const [filePath, frameBaseName] of Object.entries(FILE_MAPPINGS)) {
		filesProcessed++;
		const updated = applyFramesToFile(filePath, frameBaseName, dryRun);
		if (updated) {
			filesUpdated++;
		}
	}

	console.log(`\n📊 Summary:`);
	console.log(`  Files processed: ${filesProcessed}`);
	console.log(
		`  Files ${dryRun ? "to be updated" : "updated"}: ${filesUpdated}`,
	);

	if (dryRun) {
		console.log(
			"\n💡 Run without --dry-run flag to apply changes:\n   npm run frames:apply-interactive",
		);
	} else {
		console.log("\n✅ Minimalistic frames applied successfully!");
		console.log(`🔗 Frames are hosted at: ${FRAMES_BASE_URL}`);
	}
}

// Run application
applyFrames();
