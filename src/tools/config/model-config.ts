// Data-driven configuration for model compatibility scoring
import type { ModelDefinition, ScoredModel } from "./types/index.js";

export type { ModelDefinition, ScoredModel };

// See also: https://docs.github.com/en/copilot/reference/ai-models/model-comparison#recommended-models-by-task
export const MODELS: ModelDefinition[] = [
	{
		name: "GPT-4.1",
		provider: "OpenAI",
		pricingTier: "mid-tier",
		contextTokens: 128_000,
		baseScore: 52,
		capabilities: ["reasoning", "code", "speed", "multimodal"],
		strengths: [
			"Fast, accurate code completions",
			"General-purpose coding",
			"Writing tasks",
			"Wide ecosystem",
		],
		limitations: ["Context window limitations"],
		specialFeatures: ["Agent mode", "Vision capabilities", "Function calling"],
		pricing: "Mid-tier ($5-10/1M tokens)",
	},
	{
		name: "GPT-5",
		provider: "OpenAI",
		pricingTier: "premium",
		contextTokens: 128_000,
		baseScore: 54,
		capabilities: ["reasoning", "code", "multimodal"],
		strengths: [
			"Multi-step problem solving",
			"Architecture-level code analysis",
			"Deep reasoning",
		],
		limitations: ["Higher cost", "Context limitations"],
		specialFeatures: ["Advanced reasoning", "Complex debugging"],
		pricing: "Premium ($10-20/1M tokens)",
	},
	{
		name: "o3",
		provider: "OpenAI",
		pricingTier: "premium",
		contextTokens: 128_000,
		baseScore: 55,
		capabilities: ["reasoning", "code"],
		strengths: [
			"Multi-step problem solving",
			"Architecture-level code analysis",
			"Deep reasoning",
		],
		limitations: ["Higher cost", "Slower inference"],
		specialFeatures: ["Advanced reasoning chains", "Complex problem solving"],
		pricing: "Premium ($15-30/1M tokens)",
	},
	{
		name: "o4-mini",
		provider: "OpenAI",
		pricingTier: "budget",
		contextTokens: 128_000,
		baseScore: 48,
		capabilities: ["speed", "cost"],
		strengths: [
			"Fast, reliable answers",
			"Lightweight coding questions",
			"Lower latency",
		],
		limitations: ["Limited reasoning", "Simple tasks only"],
		specialFeatures: ["Ultra-fast responses", "Cost efficient"],
		pricing: "Budget ($0.25-1.25/1M tokens)",
	},
	{
		name: "Claude Opus 4.1",
		provider: "Anthropic",
		pricingTier: "premium",
		contextTokens: 200_000,
		baseScore: 55,
		capabilities: ["reasoning", "large-context", "multimodal", "code"],
		strengths: [
			"Complex problem-solving",
			"Sophisticated reasoning",
			"Vision capabilities",
		],
		limitations: ["Higher cost", "Slower inference"],
		specialFeatures: ["Constitutional AI", "Vision support", "Deep reasoning"],
		pricing: "Premium ($15-30/1M tokens)",
	},
	{
		name: "Claude Opus 4",
		provider: "Anthropic",
		pricingTier: "premium",
		contextTokens: 200_000,
		baseScore: 54,
		capabilities: ["reasoning", "large-context", "multimodal", "code"],
		strengths: [
			"Complex problem-solving",
			"Sophisticated reasoning",
			"Vision capabilities",
		],
		limitations: ["Higher cost", "Slower inference"],
		specialFeatures: ["Constitutional AI", "Vision support", "Deep reasoning"],
		pricing: "Premium ($15-30/1M tokens)",
	},
	{
		name: "Claude Sonnet 3.5",
		provider: "Anthropic",
		pricingTier: "budget",
		contextTokens: 200_000,
		baseScore: 49,
		capabilities: ["speed", "cost", "multimodal"],
		strengths: ["Quick responses for code", "Syntax help", "Documentation"],
		limitations: ["Limited reasoning"],
		specialFeatures: ["Agent mode", "Vision support", "Fast responses"],
		pricing: "Budget ($0.25-1.25/1M tokens)",
	},
	{
		name: "Claude Sonnet 3.7",
		provider: "Anthropic",
		pricingTier: "mid-tier",
		contextTokens: 200_000,
		baseScore: 52,
		capabilities: ["reasoning", "multimodal", "large-context", "code"],
		strengths: [
			"Structured reasoning",
			"Large, complex codebases",
			"Clear output",
		],
		limitations: ["Moderate cost"],
		specialFeatures: ["Agent mode", "Vision support", "Structured output"],
		pricing: "Mid-tier ($3-6/1M tokens)",
	},
	{
		name: "Claude Sonnet 4",
		provider: "Anthropic",
		pricingTier: "mid-tier",
		contextTokens: 200_000,
		baseScore: 53,
		capabilities: ["reasoning", "speed", "multimodal", "code"],
		strengths: [
			"Performance and practicality",
			"Balanced for coding workflows",
		],
		limitations: ["Moderate cost"],
		specialFeatures: ["Agent mode", "Vision support", "Balanced speed/quality"],
		pricing: "Mid-tier ($3-6/1M tokens)",
	},
	{
		name: "Gemini 2.5 Pro",
		provider: "Google",
		pricingTier: "mid-tier",
		contextTokens: 2_000_000,
		baseScore: 54,
		capabilities: ["reasoning", "multimodal", "large-context", "code"],
		strengths: [
			"Complex code generation",
			"Debugging",
			"Research workflows",
			"Massive context",
		],
		limitations: ["Limited third-party integration"],
		specialFeatures: [
			"2M token context",
			"Vision support",
			"Google integration",
		],
		pricing: "Competitive ($1-3/1M tokens)",
	},
	{
		name: "Gemini 2.0 Flash",
		provider: "Google",
		pricingTier: "budget",
		contextTokens: 1_000_000,
		baseScore: 50,
		capabilities: ["speed", "multimodal", "cost"],
		strengths: [
			"Real-time responses",
			"Visual reasoning",
			"UI and diagram tasks",
		],
		limitations: ["Limited reasoning depth"],
		specialFeatures: ["Vision capabilities", "Fast inference", "Low latency"],
		pricing: "Budget ($0.25-1/1M tokens)",
	},
];

export const REQUIREMENT_KEYWORDS: Record<string, string[]> = {
	reasoning: ["analysis", "reasoning", "complex", "chain-of-thought", "logic"],
	code: ["code", "programming", "development", "refactor", "api"],
	"large-context": ["large", "document", "context", "long", "200k", "2m"],
	speed: ["fast", "real-time", "quick", "low-latency", "interactive"],
	multimodal: ["image", "visual", "multimodal", "audio", "video"],
	safety: ["safety", "reliable", "production", "alignment", "guardrail"],
	cost: ["cheap", "cost", "budget", "economical", "low-cost"],
};

export const CAPABILITY_WEIGHTS: Record<string, number> = {
	reasoning: 18,
	code: 14,
	"large-context": 22,
	speed: 16,
	multimodal: 18,
	safety: 15,
	cost: 15,
};

export const BUDGET_ADJUSTMENTS: Record<
	"low" | "medium" | "high",
	{ bonus: string[]; penalty: string[] }
> = {
	low: { bonus: ["budget", "mid-tier"], penalty: ["premium"] },
	medium: { bonus: ["mid-tier"], penalty: [] },
	high: { bonus: ["premium"], penalty: [] },
};
export const BUDGET_BONUS = 12;
export const BUDGET_PENALTY = 14;
