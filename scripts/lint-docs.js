#!/usr/bin/env node

/**
 * Documentation Linter
 *
 * Validates documentation files for consistency in:
 * - File naming conventions
 * - Header/Footer structure
 * - Table of Contents format
 * - SVG text visibility in dark mode
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Configuration
const DOCS_DIR = join(__dirname, "..", "docs");
// All documentation files should use kebab-case (lowercase, dash-separated)
// This standardizes naming across all doc directories for consistency
const NAMING_CONVENTION = "kebab-case";

// Issue tracking
const issues = {
	naming: [],
	headers: [],
	footers: [],
	toc: [],
	svg: [],
};

/**
 * Check if a filename matches the kebab-case convention
 */
function checkNamingConvention(filepath) {
	const filename = basename(filepath, extname(filepath));

	// README.md is always valid
	if (filename === "README") return true;

	// kebab-case: lowercase letters, numbers, and dashes
	return /^[a-z][a-z0-9-]*$/.test(filename);
}

/**
 * Get expected convention description for error messages
 */
function getExpectedConvention() {
	return NAMING_CONVENTION;
}

/**
 * Check markdown file for header/footer structure
 */
function checkMarkdownStructure(filepath, content) {
	const lines = content.split("\n");

	// Check for header markers
	const hasHeaderStart = lines.some((line) =>
		line.includes("<!-- HEADER:START -->"),
	);
	const hasHeaderEnd = lines.some((line) =>
		line.includes("<!-- HEADER:END -->"),
	);
	const hasHeaderImage = lines.some((line) =>
		/!\[Header\]\(.+\.svg\)/.test(line),
	);

	// Check for footer markers
	const hasFooterStart = lines.some((line) =>
		line.includes("<!-- FOOTER:START -->"),
	);
	const hasFooterEnd = lines.some((line) =>
		line.includes("<!-- FOOTER:END -->"),
	);
	const hasFooterImage = lines.some((line) =>
		/!\[Footer\]\(.+\.svg\)/.test(line),
	);

	// Report missing headers
	if (!hasHeaderStart || !hasHeaderEnd || !hasHeaderImage) {
		issues.headers.push({
			file: relative(DOCS_DIR, filepath),
			issue: "Missing or incomplete header structure",
			details: {
				hasStart: hasHeaderStart,
				hasEnd: hasHeaderEnd,
				hasImage: hasHeaderImage,
			},
		});
	}

	// Report missing footers (optional but should be consistent if present)
	const hasAnyFooter = hasFooterStart || hasFooterEnd || hasFooterImage;
	if (hasAnyFooter && (!hasFooterStart || !hasFooterEnd || !hasFooterImage)) {
		issues.footers.push({
			file: relative(DOCS_DIR, filepath),
			issue: "Incomplete footer structure",
			details: {
				hasStart: hasFooterStart,
				hasEnd: hasFooterEnd,
				hasImage: hasFooterImage,
			},
		});
	}

	// Check for proper heading hierarchy
	const headings = lines.filter((line) => line.startsWith("#"));
	if (headings.length > 0) {
		const firstHeading = headings[0];
		if (!firstHeading.startsWith("# ")) {
			issues.toc.push({
				file: relative(DOCS_DIR, filepath),
				issue: "First heading should be H1 (#)",
				details: { firstHeading },
			});
		}
	}
}

/**
 * Check SVG file for dark mode text visibility issues
 */
function checkSVGVisibility(filepath, content) {
	const relativePath = relative(DOCS_DIR, filepath);

	// Check for text elements
	const hasTextElements = /<text/.test(content);
	if (!hasTextElements) return; // No text to check

	// Check for dark mode styles
	const hasDarkModeQuery = /@media \(prefers-color-scheme: dark\)/.test(
		content,
	);

	// Extract text fill colors in dark mode
	const darkModeMatch = content.match(
		/@media \(prefers-color-scheme: dark\)\s*\{([^}]+)\}/s,
	);
	if (darkModeMatch) {
		const darkModeStyles = darkModeMatch[1];

		// Check if text has explicit fill colors
		const hasTextFill = /\.text-[a-z]+\s*\{\s*fill:\s*#[a-fA-F0-9]+/.test(
			darkModeStyles,
		);

		// Check for potentially invisible colors (dark colors)
		const hasDarkFill = /#[0-2][0-9a-fA-F]{5}/.test(darkModeStyles);

		if (!hasTextFill) {
			issues.svg.push({
				file: relativePath,
				issue: "No explicit text fill color in dark mode",
				severity: "warning",
			});
		}

		if (hasDarkFill) {
			issues.svg.push({
				file: relativePath,
				issue: "Potentially invisible dark text color in dark mode",
				severity: "error",
			});
		}
	} else if (hasDarkModeQuery) {
		issues.svg.push({
			file: relativePath,
			issue: "Dark mode query exists but styles not properly structured",
			severity: "warning",
		});
	}

	// Check for hardcoded dark fill attributes on text elements
	const textElements = content.match(/<text[^>]*>/g) || [];
	for (const element of textElements) {
		if (/fill=["']#[0-2][0-9a-fA-F]{5}["']/.test(element)) {
			issues.svg.push({
				file: relativePath,
				issue: "Text element has hardcoded dark fill color",
				severity: "error",
				element: element.substring(0, 100),
			});
		}
	}
}

/**
 * Recursively scan directory for files
 */
function scanDirectory(dir, fileHandler) {
	const entries = readdirSync(dir);

	for (const entry of entries) {
		const fullPath = join(dir, entry);
		const stat = statSync(fullPath);

		if (stat.isDirectory()) {
			// Skip node_modules, .git, etc.
			if (!entry.startsWith(".") && entry !== "node_modules") {
				scanDirectory(fullPath, fileHandler);
			}
		} else if (stat.isFile()) {
			fileHandler(fullPath);
		}
	}
}

/**
 * Main linting function
 */
function lintDocumentation() {
	console.log("🔍 Linting documentation files...\n");

	scanDirectory(DOCS_DIR, (filepath) => {
		const ext = extname(filepath);
		const content = readFileSync(filepath, "utf-8");

		// Check markdown files
		if (ext === ".md") {
			const isValidNaming = checkNamingConvention(filepath);

			if (!isValidNaming) {
				issues.naming.push({
					file: relative(DOCS_DIR, filepath),
					expected: getExpectedConvention(),
					actual: basename(filepath),
				});
			}

			checkMarkdownStructure(filepath, content);
		}

		// Check SVG files
		if (ext === ".svg") {
			checkSVGVisibility(filepath, content);
		}
	});

	// Print results
	printResults();
}

/**
 * Print linting results
 */
function printResults() {
	let totalIssues = 0;

	console.log("📊 Linting Results\n");
	console.log("=".repeat(80));
	console.log();

	// Naming convention issues
	if (issues.naming.length > 0) {
		console.log(`❌ Naming Convention Issues (${issues.naming.length})`);
		console.log("-".repeat(80));
		for (const issue of issues.naming) {
			console.log(`  File: ${issue.file}`);
			console.log(`  Expected: ${issue.expected}`);
			console.log(`  Actual: ${issue.actual}`);
			console.log();
		}
		totalIssues += issues.naming.length;
	} else {
		console.log("✅ Naming Convention: All files follow conventions");
	}

	console.log();

	// Header issues
	if (issues.headers.length > 0) {
		console.log(`⚠️  Header Structure Issues (${issues.headers.length})`);
		console.log("-".repeat(80));
		for (const issue of issues.headers) {
			console.log(`  File: ${issue.file}`);
			console.log(`  Issue: ${issue.issue}`);
			console.log(
				`  Details: START=${issue.details.hasStart}, END=${issue.details.hasEnd}, IMAGE=${issue.details.hasImage}`,
			);
			console.log();
		}
		totalIssues += issues.headers.length;
	} else {
		console.log("✅ Header Structure: All files have proper headers");
	}

	console.log();

	// Footer issues
	if (issues.footers.length > 0) {
		console.log(`⚠️  Footer Structure Issues (${issues.footers.length})`);
		console.log("-".repeat(80));
		for (const issue of issues.footers) {
			console.log(`  File: ${issue.file}`);
			console.log(`  Issue: ${issue.issue}`);
			console.log(
				`  Details: START=${issue.details.hasStart}, END=${issue.details.hasEnd}, IMAGE=${issue.details.hasImage}`,
			);
			console.log();
		}
		totalIssues += issues.footers.length;
	} else {
		console.log("✅ Footer Structure: All footers are properly structured");
	}

	console.log();

	// ToC issues
	if (issues.toc.length > 0) {
		console.log(`⚠️  Table of Contents Issues (${issues.toc.length})`);
		console.log("-".repeat(80));
		for (const issue of issues.toc) {
			console.log(`  File: ${issue.file}`);
			console.log(`  Issue: ${issue.issue}`);
			console.log();
		}
		totalIssues += issues.toc.length;
	} else {
		console.log("✅ Table of Contents: All ToCs are properly structured");
	}

	console.log();

	// SVG issues
	if (issues.svg.length > 0) {
		console.log(`🎨 SVG Visibility Issues (${issues.svg.length})`);
		console.log("-".repeat(80));

		const errors = issues.svg.filter((i) => i.severity === "error");
		const warnings = issues.svg.filter((i) => i.severity === "warning");

		if (errors.length > 0) {
			console.log(`  ❌ Errors (${errors.length}):`);
			for (const issue of errors) {
				console.log(`    File: ${issue.file}`);
				console.log(`    Issue: ${issue.issue}`);
				if (issue.element) {
					console.log(`    Element: ${issue.element}`);
				}
				console.log();
			}
		}

		if (warnings.length > 0) {
			console.log(`  ⚠️  Warnings (${warnings.length}):`);
			for (const issue of warnings) {
				console.log(`    File: ${issue.file}`);
				console.log(`    Issue: ${issue.issue}`);
				console.log();
			}
		}

		totalIssues += issues.svg.length;
	} else {
		console.log("✅ SVG Visibility: All SVGs have proper dark mode support");
	}

	console.log();
	console.log("=".repeat(80));
	console.log(`\n📈 Summary: Found ${totalIssues} total issues\n`);

	// Exit with error code if issues found
	if (totalIssues > 0) {
		process.exit(1);
	}
}

// Run the linter
lintDocumentation();
