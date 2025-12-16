#!/usr/bin/env node
/**
 * Sync AI Models from GitHub Copilot Documentation
 *
 * Fetches the latest model information from GitHub Copilot documentation
 * and updates models.yaml with any changes.
 *
 * Data Sources:
 * - Model Comparison: https://docs.github.com/en/copilot/reference/ai-models/model-comparison
 * - Supported Models: https://docs.github.com/en/copilot/reference/ai-models/supported-models
 *
 * Usage: node scripts/sync-models.js
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dump, load } from "js-yaml";

// Import parsing utilities from the separate module
import {
	DOCS_URLS,
	fetchWithRetry,
	inferModes,
	inferMultiplier,
	inferPricingTier,
	inferProvider,
	inferStatus,
	parseModelComparison,
} from "./parse-model-docs.js";

const MODELS_YAML_PATH = "src/tools/config/models.yaml";

/**
 * Update or add a model in the models array
 */
function updateModel(existingModels, newModelData) {
	const existingIndex = existingModels.findIndex(
		(m) => m.name === newModelData.name,
	);

	if (existingIndex >= 0) {
		// Merge with existing model, preserving manually curated fields
		const existing = existingModels[existingIndex];
		existingModels[existingIndex] = {
			...existing,
			...newModelData,
			// Preserve manually curated fields
			contextTokens: existing.contextTokens,
			baseScore: existing.baseScore,
			capabilities: existing.capabilities,
			strengths: existing.strengths,
			limitations: existing.limitations,
			specialFeatures: existing.specialFeatures,
			pricing: existing.pricing,
			pricingTier: existing.pricingTier,
		};
		return "updated";
	} else {
		// New model - add with default values
		existingModels.push({
			name: newModelData.name,
			provider: newModelData.provider,
			pricingTier: inferPricingTier(
				newModelData.taskArea,
				newModelData.multiplier,
			),
			contextTokens: 128000, // Default
			baseScore: 50, // Default
			capabilities: ["code"],
			strengths: [newModelData.excelsAt],
			limitations: ["Requires validation"],
			specialFeatures: newModelData.additionalCapabilities
				.split(",")
				.map((s) => s.trim())
				.filter(Boolean),
			pricing: "To be determined",
			modes: newModelData.modes,
			taskArea: newModelData.taskArea,
			multiplier: newModelData.multiplier,
			status: newModelData.status,
			documentationUrl: newModelData.documentationUrl,
		});
		return "added";
	}
}

/**
 * Main sync function
 */
async function main() {
	console.log(
		"🔄 Starting AI model sync from GitHub Copilot documentation...\n",
	);

	try {
		// Fetch documentation pages
		const comparisonHtml = await fetchWithRetry(DOCS_URLS.comparison);
		console.log("✅ Fetched model comparison page\n");

		// Parse model data
		const parsedModels = parseModelComparison(comparisonHtml);
		console.log(`📊 Found ${parsedModels.length} models in documentation\n`);

		if (parsedModels.length === 0) {
			console.log(
				"⚠️  No models found in documentation. Exiting without changes.",
			);
			process.exit(0);
		}

		// Load current models.yaml
		console.log("📖 Loading current models.yaml...");
		const yamlContent = readFileSync(MODELS_YAML_PATH, "utf8");
		const currentYaml = load(yamlContent);

		if (!currentYaml.models || !Array.isArray(currentYaml.models)) {
			throw new Error("Invalid models.yaml structure");
		}

		// Process each parsed model
		const changes = { added: [], updated: [], unchanged: [] };

		for (const parsedModel of parsedModels) {
			const provider = inferProvider(parsedModel.name);
			const modes = inferModes(
				parsedModel.additionalCapabilities,
				parsedModel.name,
			);
			const multiplier = inferMultiplier(
				parsedModel.name,
				parsedModel.taskArea,
			);
			const status = inferStatus(
				parsedModel.name,
				parsedModel.additionalCapabilities,
			);

			const modelData = {
				name: parsedModel.name,
				provider,
				modes,
				taskArea: parsedModel.taskArea,
				multiplier,
				status,
				documentationUrl: parsedModel.documentationUrl,
				excelsAt: parsedModel.excelsAt,
				additionalCapabilities: parsedModel.additionalCapabilities,
			};

			const result = updateModel(currentYaml.models, modelData);

			if (result === "added") {
				changes.added.push(parsedModel.name);
			} else if (result === "updated") {
				changes.updated.push(parsedModel.name);
			} else {
				changes.unchanged.push(parsedModel.name);
			}
		}

		// Update last updated timestamp
		currentYaml.lastUpdated = new Date().toISOString().split("T")[0];

		// Write updated YAML
		console.log("\n💾 Writing updated models.yaml...");
		const yamlOutput = dump(currentYaml, {
			lineWidth: -1, // Don't wrap lines
			noRefs: true,
			sortKeys: false,
		});

		writeFileSync(MODELS_YAML_PATH, yamlOutput, "utf8");

		// Report changes
		console.log("\n✅ Sync complete!\n");
		console.log("📈 Summary:");
		console.log(`   - Added: ${changes.added.length} models`);
		console.log(`   - Updated: ${changes.updated.length} models`);
		console.log(`   - Unchanged: ${changes.unchanged.length} models`);

		if (changes.added.length > 0) {
			console.log("\n➕ Added models:");
			for (const name of changes.added) {
				console.log(`   - ${name}`);
			}
		}

		if (changes.updated.length > 0) {
			console.log("\n📝 Updated models:");
			for (const name of changes.updated) {
				console.log(`   - ${name}`);
			}
		}

		// Exit code indicates if changes were made
		const hasChanges = changes.added.length > 0 || changes.updated.length > 0;
		process.exit(hasChanges ? 0 : 0); // Always exit 0 - changes detected via git diff
	} catch (error) {
		console.error("\n❌ Error syncing models:", error.message);
		console.error(error.stack);
		process.exit(1);
	}
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}
