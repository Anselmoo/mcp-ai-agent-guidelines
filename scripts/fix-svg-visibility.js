#!/usr/bin/env node

/**
 * SVG Visibility Fixer
 *
 * Fixes SVG text visibility issues in dark mode by:
 * 1. Adding explicit light-colored fills for text elements
 * 2. Using color schemes that work in both light and dark modes
 * 3. Adding fallback colors for better compatibility
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL(".", import.meta.url));

const DOCS_DIR = join(__dirname, "..", "docs");
const DRY_RUN = process.argv.includes("--dry-run");

// Track changes
const changes = [];

/**
 * Fix SVG text visibility by ensuring proper color values
 *
 * Strategy:
 * - For dark mode, use light colors (#f0f6fc, #c9d1d9, #fff)
 * - For light mode, use dark colors (#24292f, #1f2328, #000)
 * - Add picture element suggestions for better GitHub rendering
 */
function fixSVGVisibility(_filepath, content) {
	let modified = content;
	const changesMade = [];

	// Check if SVG has dark mode media query
	const hasDarkMode = /@media \(prefers-color-scheme: dark\)/.test(content);

	if (!hasDarkMode) {
		// SVG doesn't use media queries, might need different approach
		return { modified: content, changes: [] };
	}

	// Ensure dark mode text colors are light
	// Pattern: find dark mode styles and ensure text fills are light
	modified = modified.replace(
		/@media \(prefers-color-scheme: dark\)\s*\{([^}]+)\}/gs,
		(_match, styles) => {
			let updatedStyles = styles;

			// Fix text-primary to use light color
			updatedStyles = updatedStyles.replace(
				/(\.text-primary\s*\{[^}]*fill:\s*)#[0-9a-fA-F]{6}/g,
				(m, prefix) => {
					if (!m.includes("#f0f6fc") && !m.includes("#fff")) {
						changesMade.push(
							"Updated text-primary fill in dark mode to #f0f6fc",
						);
						return `${prefix}#f0f6fc`;
					}
					return m;
				},
			);

			// Fix text-secondary to use light color
			updatedStyles = updatedStyles.replace(
				/(\.text-secondary\s*\{[^}]*fill:\s*)#[0-9a-fA-F]{6}/g,
				(m, prefix) => {
					if (!m.includes("#c9d1d9") && !m.includes("#fff")) {
						changesMade.push(
							"Updated text-secondary fill in dark mode to #c9d1d9",
						);
						return `${prefix}#c9d1d9`;
					}
					return m;
				},
			);

			return `@media (prefers-color-scheme: dark) {${updatedStyles}}`;
		},
	);

	// Add a default light fill for all text elements that don't have explicit fill
	// This acts as a fallback when media queries don't work
	modified = modified.replace(/<text([^>]*)>/g, (match, attrs) => {
		// If text doesn't have fill attribute and doesn't have a class, add a light fill
		if (!attrs.includes("fill=") && !attrs.includes('class="text-')) {
			changesMade.push("Added default light fill to unclassed text element");
			return `<text${attrs} fill="#f0f6fc">`;
		}
		return match;
	});

	return { modified, changes: changesMade };
}

/**
 * Create a markdown snippet showing how to use picture element for better rendering
 */
function generatePictureElementGuide() {
	return `
<!-- Alternative approach for SVG rendering in different themes -->
<!--
<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../.frames-static/header-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="../.frames-static/header-light.svg">
  <img alt="Header" src="../.frames-static/header.svg">
</picture>
-->
`.trim();
}

/**
 * Scan and fix all SVG files
 */
function fixAllSVGs() {
	console.log("🔧 Fixing SVG visibility issues...\n");

	if (DRY_RUN) {
		console.log("🔍 DRY RUN MODE - No files will be modified\n");
	}

	const svgDir = join(DOCS_DIR, ".frames-static");
	const files = readdirSync(svgDir);

	let totalFixed = 0;
	let totalChanges = 0;

	for (const file of files) {
		if (extname(file) !== ".svg") continue;

		const filepath = join(svgDir, file);
		const content = readFileSync(filepath, "utf-8");

		const { modified, changes: fileChanges } = fixSVGVisibility(
			filepath,
			content,
		);

		if (fileChanges.length > 0) {
			totalFixed++;
			totalChanges += fileChanges.length;

			console.log(`📝 ${relative(DOCS_DIR, filepath)}`);
			for (const change of fileChanges) {
				console.log(`   ✓ ${change}`);
			}
			console.log();

			changes.push({
				file: relative(DOCS_DIR, filepath),
				changes: fileChanges,
			});

			if (!DRY_RUN) {
				writeFileSync(filepath, modified, "utf-8");
			}
		}
	}

	console.log("=".repeat(80));
	console.log(`\n✨ Summary:`);
	console.log(`   Files fixed: ${totalFixed}`);
	console.log(`   Total changes: ${totalChanges}`);

	if (DRY_RUN) {
		console.log("\n💡 Run without --dry-run to apply changes");
	} else if (totalFixed > 0) {
		console.log("\n✅ SVG files have been updated!");
	} else {
		console.log("\n✅ All SVG files already have proper visibility!");
	}

	// Print guide about picture element
	if (totalFixed > 0) {
		console.log("\n📖 Additional Recommendation:");
		console.log(
			"   For better GitHub dark mode support, consider using <picture> elements",
		);
		console.log("   or creating separate light/dark SVG variants.");
		console.log("\n   Example markdown:");
		console.log(generatePictureElementGuide());
	}

	console.log();
}

// Run the fixer
fixAllSVGs();
