#!/usr/bin/env node
/**
 * Generate Model Changelog for PR Description
 *
 * Analyzes git diff of models.yaml and generates a human-readable changelog
 * for inclusion in automated PR descriptions.
 *
 * Usage: node scripts/generate-model-changelog.js
 * Output: Markdown-formatted changelog to stdout
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { load } from "js-yaml";

const MODELS_YAML_PATH = "src/tools/config/models.yaml";

/**
 * Get git diff for models.yaml
 */
function getGitDiff() {
	try {
		return execSync("git diff src/tools/config/models.yaml", {
			encoding: "utf8",
		});
	} catch (_error) {
		// No diff or git error
		return "";
	}
}

/**
 * Parse diff to extract added, removed, and modified models
 */
function parseDiff(diff) {
	const changes = {
		added: [],
		removed: [],
		modified: [],
	};

	if (!diff) {
		return changes;
	}

	const lines = diff.split("\n");
	let currentModel = null;
	let inModelBlock = false;

	for (const line of lines) {
		// Detect model name lines
		const nameMatch = line.match(/^\+?-?\s*-?\s*name:\s*["']?([^"'\n]+)["']?/);
		if (nameMatch) {
			currentModel = nameMatch[1].trim();

			if (line.startsWith("+") && !line.startsWith("+++")) {
				// Added model
				if (!changes.added.includes(currentModel)) {
					changes.added.push(currentModel);
				}
				inModelBlock = true;
			} else if (line.startsWith("-") && !line.startsWith("---")) {
				// Removed model
				if (!changes.removed.includes(currentModel)) {
					changes.removed.push(currentModel);
				}
				inModelBlock = true;
			} else {
				inModelBlock = false;
			}
		}

		// Detect modifications to existing models
		if (currentModel && !inModelBlock) {
			if (
				(line.startsWith("+") || line.startsWith("-")) &&
				!line.startsWith("+++") &&
				!line.startsWith("---") &&
				!changes.added.includes(currentModel) &&
				!changes.removed.includes(currentModel) &&
				!changes.modified.includes(currentModel)
			) {
				changes.modified.push(currentModel);
			}
		}
	}

	return changes;
}

/**
 * Get detailed model info from current YAML
 */
function getModelDetails(modelName) {
	try {
		const yamlContent = readFileSync(MODELS_YAML_PATH, "utf8");
		const data = load(yamlContent);

		const model = data.models.find((m) => m.name === modelName);
		if (!model) return null;

		return {
			provider: model.provider,
			taskArea: model.taskArea,
			status: model.status,
			multiplier: model.multiplier,
		};
	} catch (_error) {
		return null;
	}
}

/**
 * Format changelog as markdown
 */
function formatChangelog(changes) {
	const parts = [];

	if (
		changes.added.length === 0 &&
		changes.removed.length === 0 &&
		changes.modified.length === 0
	) {
		parts.push("No model changes detected.");
		return parts.join("\n");
	}

	if (changes.added.length > 0) {
		parts.push("#### ➕ Added Models\n");
		for (const modelName of changes.added) {
			const details = getModelDetails(modelName);
			if (details) {
				parts.push(`- **${modelName}** (${details.provider})`);
				parts.push(`  - Task Area: ${details.taskArea}`);
				parts.push(`  - Status: ${details.status}`);
				parts.push(`  - Multiplier: ${details.multiplier}x`);
			} else {
				parts.push(`- **${modelName}**`);
			}
		}
		parts.push("");
	}

	if (changes.removed.length > 0) {
		parts.push("#### ➖ Removed Models\n");
		for (const modelName of changes.removed) {
			parts.push(`- **${modelName}**`);
		}
		parts.push("");
	}

	if (changes.modified.length > 0) {
		parts.push("#### 📝 Modified Models\n");
		for (const modelName of changes.modified) {
			const details = getModelDetails(modelName);
			if (details) {
				parts.push(`- **${modelName}** (${details.provider})`);
				parts.push(`  - Current Task Area: ${details.taskArea}`);
				parts.push(`  - Current Status: ${details.status}`);
			} else {
				parts.push(`- **${modelName}**`);
			}
		}
		parts.push("");
	}

	return parts.join("\n");
}

/**
 * Main function
 */
function main() {
	try {
		const diff = getGitDiff();
		const changes = parseDiff(diff);
		const changelog = formatChangelog(changes);

		console.log(changelog);
	} catch (error) {
		console.error("Error generating changelog:", error.message);
		process.exit(1);
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
