export interface PromptSection {
	title: string;
	body: string;
	/** Optional depth indicator for hierarchical ordering. */
	level?: number;
}

export interface PromptMetadata {
	/** Numeric complexity score (0-100). */
	complexity: number;
	/** Estimated token count for the assembled prompt. */
	tokenEstimate: number;
	/** Total sections included. */
	sections: number;
	/** Techniques applied (normalized). */
	techniques: string[];
	/** Requirement count used to derive complexity. */
	requirementsCount: number;
	/** Issue count used to derive complexity. */
	issuesCount: number;
}

export interface PromptResult {
	sections: PromptSection[];
	metadata: PromptMetadata;
}
