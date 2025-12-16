#!/usr/bin/env node
/**
 * Parse Model Documentation - HTML Parsing Utilities
 *
 * Reusable utilities for parsing GitHub Copilot model documentation pages.
 * Used by sync-models.js and can be imported for testing or other scripts.
 *
 * Data Sources:
 * - Model Comparison: https://docs.github.com/en/copilot/reference/ai-models/model-comparison
 * - Supported Models: https://docs.github.com/en/copilot/reference/ai-models/supported-models
 *
 * Usage:
 *   import { parseModelComparison, normalizeTaskArea } from './parse-model-docs.js';
 */

import * as cheerio from "cheerio";

/**
 * Parse the model comparison table from HTML
 *
 * @param {string} html - Raw HTML content from GitHub Copilot docs
 * @returns {Array<Object>} Parsed model data with name, taskArea, excelsAt, etc.
 */
export function parseModelComparison(html) {
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
 * Normalize task area text to match our schema values
 *
 * @param {string} taskAreaText - Raw task area text from documentation
 * @returns {string} Normalized task area: "general-purpose" | "deep-reasoning" | "fast-simple" | "visual"
 */
export function normalizeTaskArea(taskAreaText) {
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
 *
 * @param {string} modelName - Model name to analyze
 * @returns {string} Inferred provider name
 */
export function inferProvider(modelName) {
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
 * Infer supported modes from capabilities and model name
 *
 * @param {string} capabilities - Additional capabilities text
 * @param {string} modelName - Model name
 * @returns {Object} Object with boolean flags for each mode
 */
export function inferModes(capabilities, modelName) {
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
 *
 * @param {string} modelName - Model name
 * @param {string} taskArea - Task area category
 * @returns {number} Premium request multiplier (e.g., 0.5, 1.0, 1.5, 2.0)
 */
export function inferMultiplier(modelName, taskArea) {
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
 *
 * @param {string} modelName - Model name
 * @param {string} _capabilities - Additional capabilities (unused but kept for API consistency)
 * @returns {string} Status: "ga" | "preview" | "beta" | "retired"
 */
export function inferStatus(modelName, _capabilities) {
	const nameLower = modelName.toLowerCase();

	if (nameLower.includes("raptor") || nameLower.includes("grok")) {
		return "preview";
	}

	return "ga"; // Generally available by default
}

/**
 * Infer pricing tier from task area and multiplier
 *
 * @param {string} _taskArea - Task area (unused but kept for API consistency)
 * @param {number} multiplier - Premium request multiplier
 * @returns {string} Pricing tier: "premium" | "mid-tier" | "budget"
 */
export function inferPricingTier(_taskArea, multiplier) {
	if (multiplier >= 1.5) return "premium";
	if (multiplier <= 0.5) return "budget";
	return "mid-tier";
}

/**
 * Fetch a page with retry logic
 *
 * @param {string} url - URL to fetch
 * @param {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @returns {Promise<string>} HTML content of the page
 * @throws {Error} If all retries fail
 */
export async function fetchWithRetry(url, maxRetries = 3) {
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
 * Documentation URLs for GitHub Copilot models
 */
export const DOCS_URLS = {
	comparison:
		"https://docs.github.com/en/copilot/reference/ai-models/model-comparison",
	supported:
		"https://docs.github.com/en/copilot/reference/ai-models/supported-models",
};
