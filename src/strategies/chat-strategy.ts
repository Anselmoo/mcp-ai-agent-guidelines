/**
 * ChatStrategy - Default output format for LLM chat interfaces
 *
 * Renders domain results as simple, clean markdown optimized for
 * chat-based LLM interfaces. This is the baseline output strategy.
 *
 * @module strategies/chat-strategy
 * @see {@link https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md SPEC-001} §4.1
 */

import type { ScoringResult } from "../domain/analysis/types.js";
import type { PromptResult } from "../domain/prompting/types.js";
import type { OutputArtifacts, RenderOptions } from "./output-strategy.js";
import { OutputApproach } from "./output-strategy.js";
import { BaseStrategy } from "./shared/base-strategy.js";
import type { ValidationResult } from "./shared/types.js";

/**
 * ChatStrategy implements the default chat-optimized markdown output format.
 *
 * Supports rendering:
 * - PromptResult: Hierarchical sections with optional metadata
 * - ScoringResult: Score breakdown table with recommendations
 *
 * @extends {BaseStrategy<PromptResult | ScoringResult, OutputArtifacts>}
 */
export class ChatStrategy extends BaseStrategy<
	PromptResult | ScoringResult,
	OutputArtifacts
> {
	protected readonly name = "chat";
	protected readonly version = "2.0.0";

	/** The output approach this strategy implements */
	readonly approach = OutputApproach.CHAT;

	/**
	 * Validate that the input is a supported domain result type.
	 *
	 * @param input - Input to validate
	 * @returns Validation result
	 */
	validate(input: PromptResult | ScoringResult): ValidationResult {
		if (this.isPromptResult(input) || this.isScoringResult(input)) {
			return { valid: true, errors: [], warnings: [] };
		}
		return {
			valid: false,
			errors: [
				{
					code: "UNSUPPORTED_TYPE",
					message: "Input must be PromptResult or ScoringResult",
				},
			],
			warnings: [],
		};
	}

	/**
	 * Execute the chat rendering strategy.
	 *
	 * @param input - The domain result to render
	 * @returns Output artifacts with primary markdown document
	 */
	async execute(
		input: PromptResult | ScoringResult,
		options?: Partial<RenderOptions>,
	): Promise<OutputArtifacts> {
		if (this.isPromptResult(input)) {
			return this.renderPrompt(input, options);
		}
		return this.renderScoring(input as ScoringResult);
	}

	/**
	 * Check if this strategy supports rendering a specific domain type.
	 *
	 * @param domainType - The domain type identifier
	 * @returns True if this strategy can render the domain type
	 */
	supports(domainType: string): boolean {
		return ["PromptResult", "ScoringResult"].includes(domainType);
	}

	/**
	 * Render a PromptResult to markdown.
	 *
	 * Converts hierarchical prompt sections to markdown headings and content.
	 * Optionally includes metadata footer with technique and token estimate.
	 *
	 * @param result - The prompt result to render
	 * @param options - Optional rendering options
	 * @returns Output artifacts with formatted prompt
	 * @private
	 */
	private renderPrompt(
		result: PromptResult,
		options?: Partial<RenderOptions>,
	): OutputArtifacts {
		const sections = result.sections
			.map((s) => {
				const level = s.level ?? 1;
				const heading = "#".repeat(level);
				return `${heading} ${s.title}\n\n${s.body}`;
			})
			.join("\n\n");

		let metadata = "";
		if (options?.includeMetadata && result.metadata) {
			const techniques = result.metadata.techniques?.join(", ") ?? "";
			const tokens = result.metadata.tokenEstimate ?? 0;
			metadata = `\n\n---\nTechnique: ${techniques}\nTokens: ~${tokens}`;
		}

		return {
			primary: {
				name: "prompt.md",
				content: sections + metadata,
				format: "markdown",
			},
		};
	}

	/**
	 * Render a ScoringResult to markdown table.
	 *
	 * Creates a formatted score report with:
	 * - Overall score heading
	 * - Breakdown table with all metrics
	 * - Recommendations list
	 *
	 * @param result - The scoring result to render
	 * @param options - Optional rendering options (currently unused)
	 * @returns Output artifacts with score report
	 * @private
	 */
	private renderScoring(
		result: ScoringResult,
		_options?: Partial<RenderOptions>,
	): OutputArtifacts {
		const content = `# Clean Code Score: ${result.overallScore}/100

## Breakdown

| Metric | Score |
|--------|-------|
| Hygiene | ${result.breakdown.hygiene.score} |
| Coverage | ${result.breakdown.coverage.score} |
| Documentation | ${result.breakdown.documentation.score} |
| Security | ${result.breakdown.security.score} |

## Recommendations

${result.recommendations.map((r) => `- ${r}`).join("\n")}
`;

		return {
			primary: {
				name: "score-report.md",
				content,
				format: "markdown",
			},
		};
	}

	/**
	 * Type guard for PromptResult.
	 *
	 * @param result - The value to check
	 * @returns True if result is a PromptResult
	 * @private
	 */
	private isPromptResult(result: unknown): result is PromptResult {
		return (
			typeof result === "object" &&
			result !== null &&
			"sections" in result &&
			"metadata" in result
		);
	}

	/**
	 * Type guard for ScoringResult.
	 *
	 * @param result - The value to check
	 * @returns True if result is a ScoringResult
	 * @private
	 */
	private isScoringResult(result: unknown): result is ScoringResult {
		return (
			typeof result === "object" &&
			result !== null &&
			"overallScore" in result &&
			"breakdown" in result
		);
	}
}
