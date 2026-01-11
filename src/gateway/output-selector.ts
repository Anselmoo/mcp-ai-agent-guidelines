/**
 * Output Selector - Intelligent strategy selection based on context
 *
 * Analyzes context signals to recommend the most appropriate output strategy.
 * Provides automatic selection with confidence scoring and reasoning.
 *
 * @module gateway/output-selector
 */

import { OutputApproach } from "../strategies/output-strategy.js";

/**
 * Context signals used to determine the appropriate output strategy.
 *
 * @interface ContextSignals
 */
export interface ContextSignals {
	/** Keywords extracted from context or user input */
	keywords: string[];

	/** Optional domain type identifier (e.g., "PromptResult", "SessionState") */
	domainType?: string;

	/** Whether the context references a constitution or constraint document */
	hasConstitution?: boolean;
}

/**
 * Result of output strategy recommendation.
 *
 * @interface RecommendationResult
 */
export interface RecommendationResult {
	/** Recommended output approach */
	approach: OutputApproach;

	/** Confidence score (0-100) */
	confidence: number;

	/** Human-readable reasoning for the recommendation */
	reasoning: string;
}

/**
 * Keywords that signal Spec-Kit is the appropriate output format.
 *
 * Spec-Kit is recommended when:
 * - Multiple Spec-Kit signals are present (≥2)
 * - Constitution or constraints are referenced
 * - GitHub workflow or spec-driven development context is detected
 */
const SPECKIT_SIGNALS = [
	"spec",
	"specification",
	"spec.md",
	"plan",
	"plan.md",
	"tasks",
	"tasks.md",
	"task list",
	"progress",
	"progress.md",
	"github workflow",
	"speckit",
	"constitution",
	"constraints",
	"acceptance criteria",
] as const;

/**
 * Extract keywords from context text.
 *
 * Simple extraction that splits on whitespace and punctuation,
 * filters out common stop words, and normalizes to lowercase.
 * Preserves file extensions like .md in filenames.
 *
 * @param context - Input text to analyze
 * @returns Array of extracted keywords
 */
export function extractKeywords(context: string): string[] {
	// Normalize and split on whitespace and specific punctuation
	// Preserve dots in filenames like spec.md
	const words = context
		.toLowerCase()
		.split(/[\s,;!?()[\]{}'"]+/)
		.filter(Boolean);

	// Basic stop word filtering
	const stopWords = new Set([
		"a",
		"an",
		"the",
		"is",
		"are",
		"was",
		"were",
		"be",
		"been",
		"being",
		"have",
		"has",
		"had",
		"do",
		"does",
		"did",
		"will",
		"would",
		"could",
		"should",
		"may",
		"might",
		"can",
		"in",
		"on",
		"at",
		"to",
		"for",
		"of",
		"with",
		"by",
		"from",
		"and",
		"or",
		"but",
		"not",
	]);

	return words.filter((word) => !stopWords.has(word) && word.length > 1);
}

/**
 * Check if a signal matches against keywords.
 * Handles both single-word and multi-word signals.
 *
 * @param signal - Signal to match (e.g., "spec", "github workflow")
 * @param keywords - Array of normalized keywords
 * @returns True if signal matches
 */
function matchesSignal(signal: string, keywords: string[]): boolean {
	const signalWords = signal.split(/\s+/);

	if (signalWords.length > 1) {
		// Multi-word signal: check if exact match exists first
		if (keywords.includes(signal)) {
			return true;
		}
		// Otherwise, all words must be present in keywords
		return signalWords.every((word) => keywords.includes(word));
	}

	// Single-word signal: check exact match or word boundary
	return keywords.some((keyword) => {
		// Exact match
		if (keyword === signal) {
			return true;
		}
		// Match if signal appears as complete word or with separators
		// This prevents "specification" from matching "spec"
		// but allows "spec.md" or "create-spec" to match "spec"
		const pattern = new RegExp(
			`(?:^|[^a-z])${signal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[^a-z]|$)`,
		);
		return pattern.test(keyword);
	});
}

/**
 * Select the appropriate output approach based on context signals.
 *
 * Decision logic:
 * 1. If constitution is referenced → SPECKIT (high confidence)
 * 2. If ≥2 Spec-Kit signals detected → SPECKIT
 * 3. Otherwise → CHAT (default)
 *
 * @param signals - Context signals for strategy selection
 * @returns Recommended output approach
 */
export function selectApproach(signals: ContextSignals): OutputApproach {
	const normalizedKeywords = signals.keywords.map((k) => k.toLowerCase());

	// Constitution reference is a strong signal for Spec-Kit
	if (signals.hasConstitution) {
		return OutputApproach.SPECKIT;
	}

	// Check for Spec-Kit signals - use exact match or word boundary match
	const speckitScore = SPECKIT_SIGNALS.filter((signal) => {
		return matchesSignal(signal, normalizedKeywords);
	}).length;

	// Require multiple signals to avoid false positives from generic keywords
	if (speckitScore >= 2) {
		return OutputApproach.SPECKIT;
	}

	// Default to CHAT approach for general use
	return OutputApproach.CHAT;
}

/**
 * Calculate confidence score for a recommendation.
 *
 * Confidence scoring:
 * - Constitution present: 95%
 * - 3+ Spec-Kit signals: 90%
 * - 2 Spec-Kit signals: 75%
 * - Default (CHAT): 60%
 *
 * @param signals - Context signals
 * @param approach - Selected approach
 * @returns Confidence score (0-100)
 */
export function calculateConfidence(
	signals: ContextSignals,
	approach: OutputApproach,
): number {
	if (approach === OutputApproach.SPECKIT) {
		if (signals.hasConstitution) {
			return 95;
		}

		const normalizedKeywords = signals.keywords.map((k) => k.toLowerCase());
		const speckitScore = SPECKIT_SIGNALS.filter((signal) => {
			return matchesSignal(signal, normalizedKeywords);
		}).length;

		if (speckitScore >= 3) {
			return 90;
		}
		if (speckitScore === 2) {
			return 75;
		}
	}

	// Default confidence for CHAT approach
	return 60;
}

/**
 * Generate human-readable reasoning for the recommendation.
 *
 * @param signals - Context signals
 * @param approach - Selected approach
 * @returns Reasoning explanation
 */
export function generateReasoning(
	signals: ContextSignals,
	approach: OutputApproach,
): string {
	if (approach === OutputApproach.SPECKIT) {
		if (signals.hasConstitution) {
			return "Constitution or constraint document detected. Spec-Kit format provides structured specifications with constitution support.";
		}

		const normalizedKeywords = signals.keywords.map((k) => k.toLowerCase());
		const matchedSignals = SPECKIT_SIGNALS.filter((signal) => {
			return matchesSignal(signal, normalizedKeywords);
		});

		return `Multiple Spec-Kit signals detected (${matchedSignals.length}): ${matchedSignals.slice(0, 3).join(", ")}. Spec-Kit format recommended for spec-driven development workflow.`;
	}

	return "Default markdown format suitable for general-purpose output.";
}

/**
 * Recommend an output approach based on context analysis.
 *
 * This is the main entry point for strategy selection. It:
 * 1. Extracts keywords from context
 * 2. Detects constitution references
 * 3. Selects appropriate approach
 * 4. Calculates confidence and generates reasoning
 *
 * @param context - Input context text to analyze
 * @returns Recommendation with approach, confidence, and reasoning
 *
 * @example
 * ```typescript
 * const result = recommendApproach('Create a spec.md and plan.md for the project');
 * // Returns: { approach: OutputApproach.SPECKIT, confidence: 75, reasoning: "..." }
 * ```
 */
export function recommendApproach(context: string): RecommendationResult {
	const keywords = extractKeywords(context);
	const signals: ContextSignals = { keywords };

	// Detect constitution reference (case-insensitive)
	if (
		context.includes("CONSTITUTION") ||
		context.includes("constitution") ||
		context.includes("Constitution")
	) {
		signals.hasConstitution = true;
	}

	const approach = selectApproach(signals);

	return {
		approach,
		confidence: calculateConfidence(signals, approach),
		reasoning: generateReasoning(signals, approach),
	};
}
