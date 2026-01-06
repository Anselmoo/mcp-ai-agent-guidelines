/**
 * Represents a logical section of a generated prompt with a consistent role and hierarchy level.
 */

export interface PromptSection {
	/** Human-readable section label describing the content. */
	name: string;
	/** The prompt text for this section. */
	content: string;
	/** Hierarchical depth used to order or group sections. */
	level: number;
}

/**
 * Metadata describing how a prompt was constructed and its expected complexity.
 */

export interface PromptMetadata {
	/** Prompting technique or pattern used (e.g., chain-of-thought). */
	technique: string;
	/** Qualitative complexity rating influencing downstream cost. */
	complexity: "low" | "medium" | "high";
	/** Estimated token count for the assembled prompt. */
	estimatedTokens: number;
}

/**
 * Output shape returned by prompt builders combining ordered sections with metadata.
 */

export interface PromptResult {
	/** Ordered sections that compose the final prompt. */
	sections: PromptSection[];
	/** Metadata describing prompt construction attributes. */
	metadata: PromptMetadata;
}
