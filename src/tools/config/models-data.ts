/**
 * Dynamic model configuration data
 * Reference: https://docs.github.com/en/copilot/reference/ai-models/supported-models
 *
 * This file contains the latest GitHub Copilot supported models.
 * Update this file when new models are released or retired.
 */

export interface ModelInfo {
	name: string;
	provider: string;
	status: "available" | "deprecated" | "retired";
	retirementDate?: string;
	alternative?: string;
	planSupport?: string[];
}

/**
 * Latest supported models from GitHub Copilot
 * Last updated: 2025-10-29
 * Source: https://docs.github.com/en/copilot/reference/ai-models/supported-models
 */
export const GITHUB_COPILOT_MODELS: ModelInfo[] = [
	// OpenAI Models
	{
		name: "GPT-4o",
		provider: "OpenAI",
		status: "available",
		planSupport: ["Free", "Pro", "Business", "Enterprise"],
	},
	{
		name: "GPT-4o mini",
		provider: "OpenAI",
		status: "available",
		planSupport: ["Free", "Pro", "Business", "Enterprise"],
	},
	{
		name: "o1-preview",
		provider: "OpenAI",
		status: "available",
		planSupport: ["Pro", "Business", "Enterprise"],
	},
	{
		name: "o1-mini",
		provider: "OpenAI",
		status: "available",
		planSupport: ["Pro", "Business", "Enterprise"],
	},
	{
		name: "o3-mini",
		provider: "OpenAI",
		status: "available",
		planSupport: ["Pro", "Business", "Enterprise"],
	},

	// Anthropic Models
	{
		name: "Claude 3.5 Sonnet",
		provider: "Anthropic",
		status: "available",
		planSupport: ["Pro", "Business", "Enterprise"],
	},
	{
		name: "Claude 3.5 Haiku",
		provider: "Anthropic",
		status: "available",
		planSupport: ["Pro", "Business", "Enterprise"],
	},

	// Google Models
	{
		name: "Gemini 1.5 Pro",
		provider: "Google",
		status: "available",
		planSupport: ["Pro", "Business", "Enterprise"],
	},
	{
		name: "Gemini 2.0 Flash",
		provider: "Google",
		status: "available",
		planSupport: ["Pro", "Business", "Enterprise"],
	},

	// Other Models
	{
		name: "Grok Code Fast 1",
		provider: "xAI",
		status: "available",
		planSupport: ["Pro", "Business", "Enterprise"],
	},
];

/**
 * Retired models with migration information
 * Reference: https://docs.github.com/en/copilot/reference/ai-models/supported-models#model-retirement-history
 */
export const RETIRED_MODELS: ModelInfo[] = [
	{
		name: "GPT-4.0 Turbo",
		provider: "OpenAI",
		status: "retired",
		retirementDate: "2025-01-15",
		alternative: "GPT-4o",
	},
	{
		name: "GPT-3.5 Turbo",
		provider: "OpenAI",
		status: "retired",
		retirementDate: "2024-12-01",
		alternative: "GPT-4o mini",
	},
	{
		name: "Claude 3 Opus",
		provider: "Anthropic",
		status: "retired",
		retirementDate: "2025-01-01",
		alternative: "Claude 3.5 Sonnet",
	},
];

/**
 * Model aliases for backward compatibility
 */
export const MODEL_ALIASES: Record<string, string> = {
	// Legacy aliases
	"gpt-4.1": "GPT-4o",
	"gpt-5": "o1-preview",
	"claude-4": "Claude 3.5 Sonnet",
	"claude-3.7": "Claude 3.5 Sonnet",
	"gemini-2.5": "Gemini 2.0 Flash",
	"o4-mini": "o1-mini",

	// Normalized names
	"gpt-4o": "GPT-4o",
	"gpt-4o-mini": "GPT-4o mini",
	"o1-preview": "o1-preview",
	"o1-mini": "o1-mini",
	"o3-mini": "o3-mini",
	"claude-3.5-sonnet": "Claude 3.5 Sonnet",
	"claude-3.5-haiku": "Claude 3.5 Haiku",
	"gemini-1.5-pro": "Gemini 1.5 Pro",
	"gemini-2.0-flash": "Gemini 2.0 Flash",
	"grok-code-fast-1": "Grok Code Fast 1",
};

/**
 * Get all available model names
 */
export function getAvailableModels(): string[] {
	return GITHUB_COPILOT_MODELS.filter((m) => m.status === "available").map(
		(m) => m.name,
	);
}

/**
 * Get model information by name (supports aliases)
 */
export function getModelInfo(name: string): ModelInfo | undefined {
	const normalizedName = MODEL_ALIASES[name.toLowerCase()] || name;
	return (
		GITHUB_COPILOT_MODELS.find((m) => m.name === normalizedName) ||
		RETIRED_MODELS.find((m) => m.name === normalizedName)
	);
}

/**
 * Check if a model is deprecated or retired
 */
export function isModelDeprecated(name: string): boolean {
	const model = getModelInfo(name);
	return model?.status === "deprecated" || model?.status === "retired";
}

/**
 * Get alternative model for retired models
 */
export function getModelAlternative(name: string): string | undefined {
	const model = getModelInfo(name);
	return model?.alternative;
}
