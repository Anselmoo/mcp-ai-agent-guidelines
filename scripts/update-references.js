#!/usr/bin/env node
/**
 * Script to update all buildFurtherReadingSection calls to use the new three-part format
 * with {title, url, description} objects instead of "Title: URL" strings.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { glob } from "glob";

// Files already updated manually
const SKIP_FILES = [
	"src/tools/prompt/l9-distinguished-engineer-prompt-builder.ts",
	"src/tools/prompt/enterprise-architect-prompt-builder.ts",
	"src/tools/prompt/architecture-design-prompt-builder.ts",
];

async function main() {
	// Find all TypeScript files in src/
	const files = await glob("src/**/*.ts", {
		ignore: ["**/*.spec.ts", "**/*.test.ts", ...SKIP_FILES],
	});

	let totalUpdates = 0;

	for (const file of files) {
		const content = readFileSync(file, "utf-8");

		// Skip if file doesn't contain buildFurtherReadingSection
		if (!content.includes("buildFurtherReadingSection")) {
			continue;
		}

		console.log(`Processing: ${file}`);
		// This is a placeholder - actual updates should be done manually
		// or with more sophisticated parsing
		console.log(
			`  → File contains buildFurtherReadingSection - manual review needed`,
		);
		totalUpdates++;
	}

	console.log(`\nTotal files requiring updates: ${totalUpdates}`);
	console.log(
		"Note: This is a detection script. Actual updates should be done with the replace_string_in_file tool.",
	);
}

main().catch(console.error);
