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
import * as cheerio from "cheerio";
import { dump, load } from "js-yaml";

const DOCS_URLS = {
	comparison:
		"https://docs.github.com/en/copilot/reference/ai-models/model-comparison",
	supported:
		"https://docs.github.com/en/copilot/reference/ai-models/supported-models",
};

const MODELS_YAML_PATH = "src/tools/config/models.yaml";

/**
 * Fetch a page with retry logic
 */
async function fetchWithRetry(url, maxRetries = 3) {
	for (let i = 0; i < maxRetries; i++) {
		try {
			console.log(`📥 Fetching: ${url} (attempt ${i + 1}/${maxRetries})`);
			const response = await fetch(url);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			return await response.text();
		} catch (error) {
			if (i === maxRetries - 1) {
				throw error;
			}

			const delay = 2 ** i * 1000; // 1s, 2s, 4s
			console.log(`⚠️  Retry in ${delay}ms...`);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}
}

/**
 * Parse the model comparison table from HTML
 */
function parseModelComparison(html) {
	const $ = cheerio.load(html);
	const models = [];

	// Find the main comparison table
	$("table").each((_, table) => {
		const $table = $(table);
		const headers = $table
			.find("th")
			.map((_, th) => $(th).text().trim())
			.get();

		// Look for the model comparison table
		if (headers.includes("Model") && headers.includes("Task area")) {
			$table.find("tbody tr").each((_, row) => {
				const $row = $(row);
				const cells = $row
					.find("td")
					.map((_, td) => $(td).text().trim())
					.get();

				if (cells.length >= 3) {
					const modelName = cells[0];
					const taskArea = cells[1];
					const excelsAt = cells[2];
					const additionalCapabilities = cells[3] || "";

					// Extract documentation URL
					const docLink = $row.find("a").last().attr("href") || "";
					const documentationUrl = docLink.startsWith("http")
						? docLink
						: docLink.startsWith("/")
							? `https://docs.github.com${docLink}`
							: "";

					models.push({
						name: modelName,
						taskArea: normalizeTaskArea(taskArea),
						excelsAt,
						additionalCapabilities,
						documentationUrl,
					});
				}
			});
		}
	});

	return models;
}

/**
 * Normalize task area to match our schema
 */
function normalizeTaskArea(taskAreaText) {
	const normalized = taskAreaText.toLowerCase();
	if (
		normalized.includes("general-purpose") ||
		normalized.includes("general purpose")
	) {
		return "general-purpose";
	}
	if (
		normalized.includes("deep reasoning") ||
		normalized.includes("debugging")
	) {
		return "deep-reasoning";
	}
	if (
		normalized.includes("fast") ||
		normalized.includes("simple") ||
		normalized.includes("repetitive")
	) {
		return "fast-simple";
	}
	if (normalized.includes("visual") || normalized.includes("diagram")) {
		return "visual";
	}
	return "general-purpose"; // Default
}

/**
 * Infer provider from model name
 */
function inferProvider(modelName) {
	const name = modelName.toLowerCase();
	if (name.startsWith("gpt") || name.startsWith("o")) return "OpenAI";
	if (name.startsWith("claude")) return "Anthropic";
	if (name.startsWith("gemini")) return "Google";
	if (name.startsWith("grok")) return "xAI";
	if (name.startsWith("qwen")) return "Alibaba";
	if (name.startsWith("raptor")) return "Meta";
	return "Unknown";
}

/**
 * Infer modes from additional capabilities and model characteristics
 */
function inferModes(capabilities, modelName) {
	const capLower = capabilities.toLowerCase();
	const nameLower = modelName.toLowerCase();

	return {
		agent:
			capLower.includes("agent") ||
			nameLower.includes("codex") ||
			nameLower.includes("sonnet"),
		reasoning:
			capLower.includes("reasoning") ||
			nameLower.includes("opus") ||
			nameLower.includes("qwen"),
		vision: capLower.includes("vision") || capLower.includes("multimodal"),
		chat: true, // Most models support chat
		edit: true, // Most models support editing
		completions:
			!nameLower.includes("opus") &&
			!nameLower.includes("gpt-5.1") &&
			!nameLower.includes("gpt-5 "),
	};
}

/**
 * Infer multiplier based on model characteristics
 */
function inferMultiplier(modelName, taskArea) {
	const nameLower = modelName.toLowerCase();

	// Premium models (2.0x)
	if (nameLower.includes("opus") || nameLower.includes("gpt-5.1")) {
		return 2.0;
	}

	// Mid-tier reasoning models (1.5x)
	if (
		nameLower.includes("gpt-5 ") &&
		!nameLower.includes("mini") &&
		!nameLower.includes("codex")
	) {
		return 1.5;
	}

	// Budget models (0.5x)
	if (
		nameLower.includes("haiku") ||
		nameLower.includes("mini") ||
		nameLower.includes("flash") ||
		taskArea === "fast-simple"
	) {
		return 0.5;
	}

	// Complimentary models (0.0x)
	if (nameLower.includes("grok")) {
		return 0.0;
	}

	// Default (1.0x)
	return 1.0;
}

/**
 * Infer status from model name and characteristics
 */
function inferStatus(modelName, _capabilities) {
	const nameLower = modelName.toLowerCase();

	if (nameLower.includes("raptor") || nameLower.includes("grok")) {
		return "preview";
	}

	return "ga"; // Generally available by default
}

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
 * Infer pricing tier from task area and multiplier
 */
function inferPricingTier(_taskArea, multiplier) {
	if (multiplier >= 1.5) return "premium";
	if (multiplier <= 0.5) return "budget";
	return "mid-tier";
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
