// Model compatibility types

export interface ModelDefinition {
	name: string;
	provider: string;
	pricingTier: "premium" | "mid-tier" | "budget";
	contextTokens: number;
	baseScore: number;
	capabilities: string[]; // reasoning, code, speed, multimodal, safety, large-context, cost
	strengths: string[];
	limitations: string[];
	specialFeatures: string[];
	pricing: string;
}

export interface ScoredModel {
	name: string;
	provider: string;
	score: number;
	strengths: string[];
	limitations: string[];
	pricing: string;
	contextWindow: string;
	specialFeatures: string[];
	breakdown: string[];
}
