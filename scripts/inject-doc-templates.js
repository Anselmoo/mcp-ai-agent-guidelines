#!/usr/bin/env node

/**
 * inject-doc-templates.js
 *
 * Automatically injects category-specific animated header and footer templates
 * into documentation files using the capsule-render API.
 *
 * Usage:
 *   node scripts/inject-doc-templates.js docs/YOUR_DOC.md
 *   node scripts/inject-doc-templates.js --all              # Process all docs
 *   node scripts/inject-doc-templates.js --dry-run          # Preview changes
 *   node scripts/inject-doc-templates.js --category user-guide --dry-run
 *   node scripts/inject-doc-templates.js --file docs/AI_INTERACTION_TIPS.md
 */

import {
	existsSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");
const docsDir = join(rootDir, "docs");
const templatesDir = join(docsDir, ".templates");

// Template markers
const HEADER_MARKER = "<!-- AUTO-GENERATED HEADER - DO NOT EDIT -->";
const FOOTER_MARKER = "<!-- AUTO-GENERATED FOOTER - DO NOT EDIT -->";
const HEADER_END_MARKER = "<!-- END AUTO-GENERATED HEADER -->";
const FOOTER_END_MARKER = "<!-- END AUTO-GENERATED FOOTER -->";

// Category detection patterns
const CATEGORY_PATTERNS = {
	"user-guide": [
		/AI_INTERACTION_TIPS/i,
		/PROMPTING_HIERARCHY/i,
		/AGENT_RELATIVE_CALLS/i,
		/AGENT_COORDINATION/i,
		/BEST_PRACTICES/i,
	],
	developer: [
		/CONTRIBUTING/i,
		/CLEAN_CODE/i,
		/ERROR_HANDLING/i,
		/BRIDGE_CONNECTORS/i,
		/TECHNICAL_IMPROVEMENTS/i,
		/TESTING/i,
	],
	reference: [
		/REFERENCES/i,
		/SERENA_STRATEGIES/i,
		/CONTEXT_AWARE_GUIDANCE/i,
		/DESIGN_MODULE_STATUS/i,
		/design-module-status/i,
		/METHODOLOGY/i,
		/MIGRATION_STRATEGY/i,
	],
	specialized: [
		/visualization/i,
		/export-formats/i,
		/maintaining-models/i,
		/sprint-planning/i,
		/DIAGRAM_GENERATION/i,
		/AGILE_WORKFLOW/i,
		/MERMAID/i,
	],
};

/**
 * Detect category based on filename patterns
 */
function detectCategory(filePath) {
	const filename = basename(filePath);

	// Check specialized patterns first (most specific)
	if (CATEGORY_PATTERNS.specialized.some((p) => p.test(filename))) {
		return "specialized";
	}

	// Then developer patterns
	if (CATEGORY_PATTERNS.developer.some((p) => p.test(filename))) {
		return "developer";
	}

	// Then user guide patterns
	if (CATEGORY_PATTERNS["user-guide"].some((p) => p.test(filename))) {
		return "user-guide";
	}

	// Then reference patterns
	if (CATEGORY_PATTERNS.reference.some((p) => p.test(filename))) {
		return "reference";
	}

	// Default fallback
	return "reference";
}

/**
 * Load template content for specific category
 */
function loadTemplate(category, type, _docPath) {
	const templateName = `${type}-${category}.html`;
	const templatePath = join(templatesDir, templateName);

	if (!existsSync(templatePath)) {
		throw new Error(`Template not found: ${templateName}`);
	}

	const content = readFileSync(templatePath, "utf-8");
	return content;
}

/**
 * Check if file already has templates
 */
function hasTemplate(content, marker) {
	return content.includes(marker);
}

/**
 * Inject header template with category detection
 */
function injectHeader(content, docPath, category = null) {
	const detectedCategory = category || detectCategory(docPath);
	const header = loadTemplate(detectedCategory, "header", docPath);

	// Template already contains markers, no need to wrap
	if (hasTemplate(content, HEADER_MARKER)) {
		// Replace existing header (including markers)
		const regex = new RegExp(
			`${HEADER_MARKER}[\\s\\S]*?${HEADER_END_MARKER}`,
			"g",
		);
		return content.replace(regex, header.trim());
	} else {
		// Add header at the beginning
		return `${header}\n\n${content}`;
	}
}

/**
 * Inject footer template with category detection
 */
function injectFooter(content, docPath, category = null) {
	const detectedCategory = category || detectCategory(docPath);
	const footer = loadTemplate(detectedCategory, "footer", docPath);

	// Template already contains markers, no need to wrap
	if (hasTemplate(content, FOOTER_MARKER)) {
		// Replace existing footer (including markers)
		const regex = new RegExp(
			`${FOOTER_MARKER}[\\s\\S]*?${FOOTER_END_MARKER}`,
			"g",
		);
		return content.replace(regex, footer.trim());
	} else {
		// Add footer at the end
		return `${content}\n\n${footer}`;
	}
}

/**
 * Process a single file
 */
function processFile(
	filePath,
	dryRun = false,
	category = null,
	verbose = false,
) {
	const relPath = relative(rootDir, filePath);
	const detectedCategory = category || detectCategory(filePath);

	console.log(`Processing: ${relPath} [${detectedCategory}]`);

	const content = readFileSync(filePath, "utf-8");
	let updated = content;

	// Inject header and footer with category
	updated = injectHeader(updated, filePath, category);
	updated = injectFooter(updated, filePath, category);

	if (content === updated) {
		console.log("  ✓ No changes needed");
		return false;
	}

	if (verbose) {
		const headerDiff =
			updated.includes(HEADER_MARKER) && !content.includes(HEADER_MARKER)
				? " [+header]"
				: " [~header]";
		const footerDiff =
			updated.includes(FOOTER_MARKER) && !content.includes(FOOTER_MARKER)
				? " [+footer]"
				: " [~footer]";
		console.log(`  ℹ Changes:${headerDiff}${footerDiff}`);
	}

	if (dryRun) {
		console.log("  ℹ Would update (dry-run mode)");
		return false;
	}

	writeFileSync(filePath, updated, "utf-8");
	console.log("  ✓ Updated");
	return true;
}

/**
 * Get all markdown files in docs directory
 */
function getAllDocsFiles(categoryFilter = null) {
	const files = [];

	function walk(dir) {
		const items = readdirSync(dir);

		for (const item of items) {
			const fullPath = join(dir, item);
			const stat = statSync(fullPath);

			if (stat.isDirectory()) {
				// Skip templates directory
				if (item !== ".templates") {
					walk(fullPath);
				}
			} else if (item.endsWith(".md") && item !== "README.md") {
				// Skip README files
				if (categoryFilter) {
					const fileCategory = detectCategory(fullPath);
					if (fileCategory === categoryFilter) {
						files.push(fullPath);
					}
				} else {
					files.push(fullPath);
				}
			}
		}
	}

	walk(docsDir);
	return files;
}

/**
 * Parse command-line arguments
 */
function parseArgs() {
	const args = process.argv.slice(2);
	const options = {
		dryRun: false,
		processAll: false,
		category: null,
		file: null,
		verbose: false,
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === "--dry-run") {
			options.dryRun = true;
		} else if (arg === "--all") {
			options.processAll = true;
		} else if (arg === "--category") {
			options.category = args[++i];
		} else if (arg === "--file") {
			options.file = args[++i];
		} else if (arg === "--verbose" || arg === "-v") {
			options.verbose = true;
		} else if (!arg.startsWith("--")) {
			// Treat as file path
			options.file = arg;
		}
	}

	return options;
}

/**
 * Display usage information
 */
function showUsage() {
	console.log("Usage: node scripts/inject-doc-templates.js [options]");
	console.log("\nOptions:");
	console.log("  --all                   Process all documentation files");
	console.log("  --file <path>           Process specific markdown file");
	console.log(
		"  --category <name>       Filter by category (user-guide, developer, reference, specialized)",
	);
	console.log("  --dry-run               Preview changes without writing");
	console.log("  --verbose, -v           Show detailed changes");
	console.log("\nExamples:");
	console.log(
		"  node scripts/inject-doc-templates.js docs/AI_INTERACTION_TIPS.md",
	);
	console.log("  node scripts/inject-doc-templates.js --all");
	console.log("  node scripts/inject-doc-templates.js --all --dry-run");
	console.log(
		"  node scripts/inject-doc-templates.js --category user-guide --dry-run",
	);
	console.log(
		"  node scripts/inject-doc-templates.js --file docs/TECHNICAL_IMPROVEMENTS.md -v",
	);
	console.log("\nCategories:");
	console.log("  user-guide    Purple/Pink - User-facing documentation");
	console.log("  developer     Green/Cyan - Developer and contributor docs");
	console.log("  reference     Orange/Pink - Reference and research docs");
	console.log("  specialized   Cyan/Green - Tool-specific documentation");
}

/**
 * Main execution
 */
function main() {
	const options = parseArgs();

	if (!options.processAll && !options.file) {
		showUsage();
		process.exit(1);
	}

	console.log("🎨 Documentation Template Injector\n");

	if (options.dryRun) {
		console.log("⚠️  DRY RUN MODE - No files will be modified\n");
	}

	if (options.category) {
		console.log(`📁 Filtering by category: ${options.category}\n`);
	}

	let filesProcessed = 0;
	let filesUpdated = 0;
	const categoryCounts = {
		"user-guide": 0,
		developer: 0,
		reference: 0,
		specialized: 0,
	};

	if (options.processAll) {
		const files = getAllDocsFiles(options.category);
		console.log(`Found ${files.length} documentation files\n`);

		for (const file of files) {
			filesProcessed++;
			const category = detectCategory(file);
			categoryCounts[category]++;

			if (
				processFile(file, options.dryRun, options.category, options.verbose)
			) {
				filesUpdated++;
			}
		}
	} else if (options.file) {
		const filePath = options.file.startsWith("/")
			? options.file
			: join(rootDir, options.file);

		if (!existsSync(filePath)) {
			console.error(`❌ File not found: ${filePath}`);
			process.exit(1);
		}

		filesProcessed = 1;
		const category = detectCategory(filePath);
		categoryCounts[category]++;

		if (
			processFile(filePath, options.dryRun, options.category, options.verbose)
		) {
			filesUpdated = 1;
		}
	}

	console.log(
		`\n✨ Done! Processed ${filesProcessed} files, updated ${filesUpdated}`,
	);

	if (options.verbose && options.processAll) {
		console.log("\n📊 Category Distribution:");
		for (const [cat, count] of Object.entries(categoryCounts)) {
			if (count > 0) {
				console.log(`  ${cat}: ${count} files`);
			}
		}
	}

	if (options.dryRun && filesUpdated > 0) {
		console.log("\nRun without --dry-run to apply changes");
	}
}

main();
