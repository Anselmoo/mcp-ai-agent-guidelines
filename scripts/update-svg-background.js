#!/usr/bin/env node

/**
 * SVG Background Updater
 *
 * Updates SVG background gradients to use lighter, more colorful palette
 * that provides better contrast for text visibility in all modes.
 *
 * New color scheme: #D0B0FF, #C06EFF, #501DAF, #000240
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DOCS_DIR = join(__dirname, "..", "docs");
const DRY_RUN = process.argv.includes("--dry-run");

// Track changes
const changes = [];

/**
 * Update SVG background gradient to use new color scheme
 */
function updateSVGBackground(_filepath, content) {
	let modified = content;
	const changesMade = [];

	// Pattern 1: Update linearGradient backgrounds (most common pattern)
	// Replace dark backgrounds with new purple/blue gradient
	modified = modified.replace(
		/(<linearGradient id="bg[^"]*"[^>]*>[\s\S]*?<stop offset="0%"[^>]*stop-color:)(#[0-9a-fA-F]{6})/g,
		(_match, prefix, _color) => {
			changesMade.push("Updated gradient start color to #000240");
			return `${prefix}#000240`;
		},
	);

	modified = modified.replace(
		/(<linearGradient id="bg[^"]*"[\s\S]*?<stop offset="50%"[^>]*stop-color:)(#[0-9a-fA-F]{6})/g,
		(_match, prefix, _color) => {
			changesMade.push("Updated gradient middle color to #501DAF");
			return `${prefix}#501DAF`;
		},
	);

	modified = modified.replace(
		/(<linearGradient id="bg[^"]*"[\s\S]*?<stop offset="100%"[^>]*stop-color:)(#[0-9a-fA-F]{6})/g,
		(_match, prefix, _color) => {
			changesMade.push("Updated gradient end color to #D0B0FF");
			return `${prefix}#D0B0FF`;
		},
	);

	// Pattern 2: Update animate values to use new colors
	modified = modified.replace(
		/(<animate attributeName="stop-color" values=")[^"]+(")/g,
		(match, prefix, suffix) => {
			if (
				match.includes("0d1117") ||
				match.includes("161b22") ||
				match.includes("1c2128")
			) {
				changesMade.push("Updated animation colors");
				return `${prefix}#000240;#501DAF;#000240${suffix}`;
			}
			return match;
		},
	);

	// Pattern 3: Also update any radial gradients to complement the new scheme
	modified = modified.replace(
		/(<radialGradient[^>]*>[\s\S]*?<stop offset="0%"[^>]*stop-color:)(#[0-9a-fA-F]{6})/g,
		(match, _prefix, _color) => {
			// Keep existing radial gradient colors (glow effects) but could adjust if needed
			return match;
		},
	);

	return { modified, changes: changesMade };
}

/**
 * Scan and update all SVG files
 */
function updateAllSVGs() {
	console.log("🎨 Updating SVG backgrounds to new color scheme...\n");
	console.log("New colors: #D0B0FF, #C06EFF, #501DAF, #000240\n");

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

		const { modified, changes: fileChanges } = updateSVGBackground(
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
	console.log(`   Files updated: ${totalFixed}`);
	console.log(`   Total changes: ${totalChanges}`);

	if (DRY_RUN) {
		console.log("\n💡 Run without --dry-run to apply changes");
	} else if (totalFixed > 0) {
		console.log("\n✅ SVG backgrounds have been updated!");
		console.log("\nThe new gradient provides better contrast and visibility:");
		console.log("   - Deep blue base (#000240)");
		console.log("   - Rich purple mid (#501DAF)");
		console.log("   - Light lavender top (#D0B0FF)");
		console.log(
			"\nThis ensures text remains visible in both light and dark modes.",
		);
	} else {
		console.log("\n✅ All SVG backgrounds already use the new color scheme!");
	}

	console.log();
}

// Run the updater
updateAllSVGs();
