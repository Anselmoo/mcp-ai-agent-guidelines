// Model compatibility types

// Mode support types (from GitHub Copilot docs)
export type ModelMode =
	| "agent"
	| "reasoning"
	| "vision"
	| "chat"
	| "edit"
	| "completions";

// Task area categorization
export type TaskArea =
	| "general-purpose"
	| "deep-reasoning"
	| "fast-simple"
	| "visual";

// Model status
export type ModelStatus = "ga" | "preview" | "beta" | "retired";

// Mode support interface
export interface ModelModes {
	agent?: boolean;
	reasoning?: boolean;
	vision?: boolean;
	chat?: boolean;
	edit?: boolean;
	completions?: boolean;
}

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

	// New optional fields for mode-based categorization and metadata
	modes?: ModelModes;
	taskArea?: TaskArea;
	multiplier?: number;
	status?: ModelStatus;
	documentationUrl?: string;
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
