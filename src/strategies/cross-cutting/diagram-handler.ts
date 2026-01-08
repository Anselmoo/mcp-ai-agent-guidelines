/**
 * Diagram Capability Handler
 *
 * Generates Mermaid diagrams (flowcharts, sequence diagrams, class diagrams, etc.)
 * from domain results as cross-cutting artifacts.
 *
 * @module strategies/cross-cutting/diagram-handler
 * @see {@link https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md SPEC-001 §5.3}
 */

import {
	type CrossCuttingArtifact,
	CrossCuttingCapability,
} from "../output-strategy.js";
import type { CapabilityContext, CapabilityHandler } from "./types.js";

/**
 * Handler for generating Mermaid diagram artifacts.
 *
 * Detects appropriate diagram type based on domain result structure
 * and generates corresponding Mermaid syntax wrapped in markdown.
 *
 * @implements {CapabilityHandler}
 */
export class DiagramCapabilityHandler implements CapabilityHandler {
	readonly capability = CrossCuttingCapability.DIAGRAM;

	/**
	 * Generate a Mermaid diagram artifact from the context.
	 *
	 * @param context - Context with domain result and metadata
	 * @returns Diagram artifact or null if not applicable
	 */
	generate(context: CapabilityContext): CrossCuttingArtifact | null {
		const { domainResult, metadata } = context;

		// Detect appropriate diagram type from domain result
		const diagramType = this.detectDiagramType(domainResult, metadata);

		// Extract description/content for diagram generation
		const description = this.extractDiagramDescription(domainResult, metadata);

		if (!description) {
			return null;
		}

		// Generate Mermaid code
		const mermaidCode = this.generateDiagram(diagramType, description);

		// Wrap in markdown and return artifact
		return {
			type: this.capability,
			name: `diagrams/${diagramType}-diagram.md`,
			content: this.wrapInMarkdown(mermaidCode, diagramType),
		};
	}

	/**
	 * Check if this handler supports the given domain type.
	 *
	 * @param domainType - Domain type identifier
	 * @returns True if diagrams can be generated for this type
	 */
	supports(domainType: string): boolean {
		// Support common domain types that benefit from visualization
		return ["SessionState", "ScoringResult", "PromptResult"].includes(
			domainType,
		);
	}

	/**
	 * Detect appropriate diagram type based on domain result structure.
	 *
	 * @param result - Domain result data
	 * @param metadata - Optional metadata
	 * @returns Diagram type identifier
	 */
	private detectDiagramType(
		result: unknown,
		metadata?: Record<string, unknown>,
	): string {
		// Check metadata for explicit diagram type hint
		if (metadata?.diagramType && typeof metadata.diagramType === "string") {
			return metadata.diagramType;
		}

		// Detect based on domain result structure
		if (result && typeof result === "object") {
			const obj = result as Record<string, unknown>;

			// Session state → flowchart showing phases
			if (obj.phase || obj.phases || obj.currentPhase) {
				return "flowchart";
			}

			// Architecture/components → class diagram
			if (obj.components || obj.classes || obj.interfaces) {
				return "class";
			}

			// Workflow/sequence → sequence diagram
			if (obj.steps || obj.workflow || obj.interactions) {
				return "sequence";
			}
		}

		// Default to flowchart
		return "flowchart";
	}

	/**
	 * Extract description/content for diagram generation.
	 *
	 * @param result - Domain result data
	 * @param metadata - Optional metadata
	 * @returns Description string or null if unavailable
	 */
	private extractDiagramDescription(
		result: unknown,
		metadata?: Record<string, unknown>,
	): string | null {
		// Check metadata for explicit description
		if (metadata?.description && typeof metadata.description === "string") {
			return metadata.description;
		}

		// Extract from domain result
		if (result && typeof result === "object") {
			const obj = result as Record<string, unknown>;

			// Common description fields
			if (obj.description && typeof obj.description === "string") {
				return obj.description;
			}

			if (obj.title && typeof obj.title === "string") {
				return obj.title;
			}

			if (obj.summary && typeof obj.summary === "string") {
				return obj.summary;
			}
		}

		// No description available
		return null;
	}

	/**
	 * Generate Mermaid diagram code based on type.
	 *
	 * @param type - Diagram type
	 * @param description - Content description
	 * @returns Mermaid syntax
	 */
	private generateDiagram(type: string, description: string): string {
		switch (type) {
			case "flowchart":
				return this.generateFlowchart(description);
			case "sequence":
				return this.generateSequence(description);
			case "class":
				return this.generateClassDiagram(description);
			default:
				return this.generateFlowchart(description);
		}
	}

	/**
	 * Generate a flowchart diagram.
	 *
	 * @param _description - Flowchart description (currently unused, reserved for future enhancement)
	 * @returns Mermaid flowchart syntax
	 */
	private generateFlowchart(_description: string): string {
		return `flowchart TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
`;
	}

	/**
	 * Generate a sequence diagram.
	 *
	 * @param _description - Sequence description (currently unused, reserved for future enhancement)
	 * @returns Mermaid sequence syntax
	 */
	private generateSequence(_description: string): string {
		return `sequenceDiagram
    participant U as User
    participant S as System
    U->>S: Request
    S-->>U: Response
`;
	}

	/**
	 * Generate a class diagram.
	 *
	 * @param _description - Class diagram description (currently unused, reserved for future enhancement)
	 * @returns Mermaid class diagram syntax
	 */
	private generateClassDiagram(_description: string): string {
		return `classDiagram
    class Component {
        +method()
    }
`;
	}

	/**
	 * Wrap Mermaid code in markdown with header and footer.
	 *
	 * @param mermaidCode - Generated Mermaid syntax
	 * @param type - Diagram type
	 * @returns Markdown-formatted content
	 */
	private wrapInMarkdown(mermaidCode: string, type: string): string {
		const typeTitle = type.charAt(0).toUpperCase() + type.slice(1);

		return `# ${typeTitle} Diagram

\`\`\`mermaid
${mermaidCode}
\`\`\`

---
*Generated diagram*
`;
	}
}
