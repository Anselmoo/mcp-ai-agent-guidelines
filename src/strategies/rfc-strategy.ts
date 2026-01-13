/**
 * RFCStrategy - Request for Comments document format
 *
 * Renders domain results as RFC (Request for Comments) documents with
 * standard sections for formal technical proposals.
 *
 * @module strategies/rfc-strategy
 * @see {@link https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md SPEC-001} §4.2
 */

import type { SessionState } from "../domain/design/types.js";
import type { PromptResult } from "../domain/prompting/types.js";
import type {
	OutputArtifacts,
	OutputStrategy,
	RenderOptions,
} from "./output-strategy.js";
import { OutputApproach } from "./output-strategy.js";

/**
 * RFCStrategy implements the RFC (Request for Comments) document format.
 *
 * Supports rendering:
 * - PromptResult: Convert prompt analysis to RFC proposal
 * - SessionState: Convert design session to RFC document
 *
 * @implements {OutputStrategy<PromptResult | SessionState>}
 */
export class RFCStrategy
	implements OutputStrategy<PromptResult | SessionState>
{
	/** The output approach this strategy implements */
	readonly approach = OutputApproach.RFC;

	/**
	 * Render a domain result to RFC format.
	 *
	 * @param result - The domain result to render (PromptResult or SessionState)
	 * @param options - Optional rendering options
	 * @returns Output artifacts with primary RFC document
	 * @throws {Error} If result type is not supported
	 */
	render(
		result: PromptResult | SessionState,
		options?: Partial<RenderOptions>,
	): OutputArtifacts {
		if (this.isPromptResult(result)) {
			return this.renderPromptAsRFC(result, options);
		}
		if (this.isSessionState(result)) {
			return this.renderSessionAsRFC(result, options);
		}
		throw new Error("Unsupported domain result type");
	}

	/**
	 * Check if this strategy supports rendering a specific domain type.
	 *
	 * @param domainType - The domain type identifier
	 * @returns True if this strategy can render the domain type
	 */
	supports(domainType: string): boolean {
		return ["PromptResult", "SessionState"].includes(domainType);
	}

	/**
	 * Render a PromptResult to RFC format.
	 *
	 * @param result - The prompt result to render
	 * @param options - Optional rendering options
	 * @returns Output artifacts with RFC document
	 * @private
	 */
	private renderPromptAsRFC(
		result: PromptResult,
		options?: Partial<RenderOptions>,
	): OutputArtifacts {
		const title = this.extractTitle(result);
		const baseContent = `# RFC: ${title}

## Summary

${this.extractSummary(result)}

## Scope

${this.extractScope(result)}

## Participants

- **Author**: @copilot
- **Reviewers**: TBD
- **Stakeholders**: TBD

## Proposal

${this.extractProposal(result)}

## Pros

${this.extractPros(result)}

## Cons

${this.extractCons(result)}

## Alternatives Considered

${this.extractAlternatives(result)}

## Conclusion

${this.extractConclusion(result)}`;

		return {
			primary: {
				name: "RFC.md",
				content: this.formatRFCContent(baseContent, options),
				format: "markdown",
			},
		};
	}

	/**
	 * Render a SessionState to RFC format.
	 *
	 * @param result - The session state to render
	 * @param options - Optional rendering options
	 * @returns Output artifacts with RFC document
	 * @private
	 */
	private renderSessionAsRFC(
		result: SessionState,
		options?: Partial<RenderOptions>,
	): OutputArtifacts {
		const title = this.extractSessionTitle(result);
		const baseContent = `# RFC: ${title}

## Summary

${this.extractSessionSummary(result)}

## Scope

${this.extractSessionScope(result)}

## Participants

- **Author**: @copilot
- **Reviewers**: TBD
- **Stakeholders**: TBD

## Status

${result.status || "Draft"}

## Proposal

${this.extractSessionProposal(result)}

## Pros

${this.extractSessionPros(result)}

## Cons

${this.extractSessionCons(result)}

## Alternatives Considered

${this.extractSessionAlternatives(result)}

## Conclusion

${this.extractSessionConclusion(result)}`;

		return {
			primary: {
				name: "RFC.md",
				content: this.formatRFCContent(baseContent, options),
				format: "markdown",
			},
		};
	}

	/**
	 * Extract title from PromptResult.
	 *
	 * @param result - The prompt result
	 * @returns Extracted title
	 * @private
	 */
	private extractTitle(result: PromptResult): string {
		const firstSection = result.sections[0];
		return firstSection?.title || "Untitled Proposal";
	}

	/**
	 * Extract summary from PromptResult.
	 *
	 * @param result - The prompt result
	 * @returns Extracted summary
	 * @private
	 */
	private extractSummary(result: PromptResult): string {
		const firstSection = result.sections[0];
		if (firstSection?.body) {
			// Take first paragraph or first 200 chars
			const firstPara = firstSection.body.split("\n\n")[0];
			return firstPara.length > 200
				? `${firstPara.substring(0, 200)}...`
				: firstPara;
		}
		return "No summary available.";
	}

	/**
	 * Extract scope from PromptResult.
	 *
	 * @param result - The prompt result
	 * @returns Extracted scope
	 * @private
	 */
	private extractScope(result: PromptResult): string {
		const scopeSection = result.sections.find((s) =>
			s.title.toLowerCase().includes("scope"),
		);
		if (scopeSection?.body) {
			return scopeSection.body;
		}
		return "To be defined";
	}

	/**
	 * Extract proposal from PromptResult.
	 *
	 * @param result - The prompt result
	 * @returns Extracted proposal
	 * @private
	 */
	private extractProposal(result: PromptResult): string {
		const proposalSection = result.sections.find(
			(s) =>
				s.title.toLowerCase().includes("proposal") ||
				s.title.toLowerCase().includes("goal") ||
				s.title.toLowerCase().includes("objective"),
		);
		if (proposalSection?.body) {
			return proposalSection.body;
		}
		// Use a concise default when no specific proposal section is found
		return "To be defined";
	}

	/**
	 * Extract pros from PromptResult.
	 *
	 * @param result - The prompt result
	 * @returns Extracted pros as bullet list
	 * @private
	 */
	private extractPros(result: PromptResult): string {
		const prosSection = result.sections.find((s) => {
			const title = s.title.toLowerCase();
			return /\b(pros?|benefits?|advantages?)\b/.test(title);
		});
		if (prosSection?.body) {
			// Convert to bullet list if not already
			const lines = prosSection.body.split("\n").filter((l) => l.trim());
			return lines.map((l) => (l.startsWith("-") ? l : `- ${l}`)).join("\n");
		}
		return "- TBD";
	}

	/**
	 * Extract cons from PromptResult.
	 *
	 * @param result - The prompt result
	 * @returns Extracted cons as bullet list
	 * @private
	 */
	private extractCons(result: PromptResult): string {
		const consSection = result.sections.find((s) => {
			const title = s.title.toLowerCase();
			return (
				/\bcons?\b/.test(title) ||
				title.includes("drawback") ||
				title.includes("disadvantage") ||
				title.includes("risk")
			);
		});
		if (consSection?.body) {
			// Convert to bullet list if not already
			const lines = consSection.body.split("\n").filter((l) => l.trim());
			return lines.map((l) => (l.startsWith("-") ? l : `- ${l}`)).join("\n");
		}
		return "- TBD";
	}

	/**
	 * Extract alternatives from PromptResult.
	 *
	 * @param result - The prompt result
	 * @returns Extracted alternatives
	 * @private
	 */
	private extractAlternatives(result: PromptResult): string {
		const altSection = result.sections.find(
			(s) =>
				s.title.toLowerCase().includes("alternative") ||
				s.title.toLowerCase().includes("option"),
		);
		if (altSection?.body) {
			return altSection.body;
		}
		return "None documented";
	}

	/**
	 * Extract conclusion from PromptResult.
	 *
	 * @param result - The prompt result
	 * @returns Extracted conclusion
	 * @private
	 */
	private extractConclusion(result: PromptResult): string {
		const conclusionSection = result.sections.find(
			(s) =>
				s.title.toLowerCase().includes("conclusion") ||
				s.title.toLowerCase().includes("recommendation"),
		);
		if (conclusionSection?.body) {
			return conclusionSection.body;
		}
		return "Pending team discussion";
	}

	/**
	 * Extract title from SessionState.
	 *
	 * @param result - The session state
	 * @returns Extracted title
	 * @private
	 */
	private extractSessionTitle(result: SessionState): string {
		if (result.config?.goal) {
			return result.config.goal;
		}
		if (result.context?.title && typeof result.context.title === "string") {
			return result.context.title;
		}
		return "Untitled Session";
	}

	/**
	 * Extract summary from SessionState.
	 *
	 * @param result - The session state
	 * @returns Extracted summary
	 * @private
	 */
	private extractSessionSummary(result: SessionState): string {
		if (result.context?.summary && typeof result.context.summary === "string") {
			return result.context.summary;
		}
		if (result.config?.goal) {
			return result.config.goal;
		}
		return `Design session in ${result.phase} phase`;
	}

	/**
	 * Extract scope from SessionState.
	 *
	 * @param result - The session state
	 * @returns Extracted scope
	 * @private
	 */
	private extractSessionScope(result: SessionState): string {
		if (result.context?.scope && typeof result.context.scope === "string") {
			return result.context.scope;
		}
		return `Phase: ${result.phase}`;
	}

	/**
	 * Extract proposal from SessionState.
	 *
	 * @param result - The session state
	 * @returns Extracted proposal
	 * @private
	 */
	private extractSessionProposal(result: SessionState): string {
		if (
			result.context?.proposal &&
			typeof result.context.proposal === "string"
		) {
			return result.context.proposal;
		}
		if (result.config?.goal) {
			return result.config.goal;
		}
		if (result.phases) {
			const phaseDescriptions = Object.entries(result.phases)
				.map(
					([phase, data]) => `### ${phase}\n\n${JSON.stringify(data, null, 2)}`,
				)
				.join("\n\n");
			return phaseDescriptions;
		}
		return "To be defined";
	}

	/**
	 * Extract pros from SessionState.
	 *
	 * @param result - The session state
	 * @returns Extracted pros as bullet list
	 * @private
	 */
	private extractSessionPros(result: SessionState): string {
		if (result.context?.pros && Array.isArray(result.context.pros)) {
			return result.context.pros.map((p) => `- ${p}`).join("\n");
		}
		return "- TBD";
	}

	/**
	 * Extract cons from SessionState.
	 *
	 * @param result - The session state
	 * @returns Extracted cons as bullet list
	 * @private
	 */
	private extractSessionCons(result: SessionState): string {
		if (result.context?.cons && Array.isArray(result.context.cons)) {
			return result.context.cons.map((c) => `- ${c}`).join("\n");
		}
		return "- TBD";
	}

	/**
	 * Extract alternatives from SessionState.
	 *
	 * @param result - The session state
	 * @returns Extracted alternatives
	 * @private
	 */
	private extractSessionAlternatives(result: SessionState): string {
		if (
			result.context?.alternatives &&
			typeof result.context.alternatives === "string"
		) {
			return result.context.alternatives;
		}
		if (
			result.context?.alternatives &&
			Array.isArray(result.context.alternatives)
		) {
			return result.context.alternatives.map((a) => `- ${a}`).join("\n");
		}
		return "None documented";
	}

	/**
	 * Extract conclusion from SessionState.
	 *
	 * @param result - The session state
	 * @returns Extracted conclusion
	 * @private
	 */
	private extractSessionConclusion(result: SessionState): string {
		if (
			result.context?.conclusion &&
			typeof result.context.conclusion === "string"
		) {
			return result.context.conclusion;
		}
		if (result.status === "completed") {
			return "Session completed successfully.";
		}
		return "Pending team discussion";
	}

	/**
	 * Format RFC content with optional metadata footer.
	 *
	 * @param baseContent - The base RFC content without metadata
	 * @param options - Optional rendering options
	 * @returns Formatted content with or without metadata footer
	 * @private
	 */
	private formatRFCContent(
		baseContent: string,
		options?: Partial<RenderOptions>,
	): string {
		// Only include metadata if explicitly requested (aligning with ChatStrategy)
		if (options?.includeMetadata === true) {
			return `${baseContent}\n\n---\n*RFC generated: ${new Date().toISOString()}*`;
		}
		return baseContent;
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
	 * Type guard for SessionState.
	 *
	 * @param result - The value to check
	 * @returns True if result is a SessionState
	 * @private
	 */
	private isSessionState(result: unknown): result is SessionState {
		return (
			typeof result === "object" &&
			result !== null &&
			"id" in result &&
			"phase" in result &&
			"context" in result &&
			"history" in result
		);
	}
}
