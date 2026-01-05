export interface PromptSection {
	name: string;
	content: string;
	level: number;
}

export interface PromptMetadata {
	technique: string;
	complexity: "low" | "medium" | "high";
	estimatedTokens: number;
}

export interface PromptResult {
	sections: PromptSection[];
	metadata: PromptMetadata;
}
