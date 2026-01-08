/**
 * SDDStrategy - Spec-Driven Development output format
 *
 * Generates three interconnected documents that form a complete development specification:
 * - spec.md: Requirements, constraints, acceptance criteria
 * - plan.md: Implementation phases, timeline, dependencies
 * - tasks.md: Task breakdown with Mermaid dependency graph
 *
 * @module strategies/sdd-strategy
 * @see {@link https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md SPEC-001} §4.4
 */

import type { SessionState } from "../domain/design/types.js";
import type { PromptResult } from "../domain/prompting/types.js";
import type {
	OutputArtifacts,
	OutputDocument,
	OutputStrategy,
	RenderOptions,
} from "./output-strategy.js";
import { OutputApproach } from "./output-strategy.js";

/**
 * SDDStrategy implements Spec-Driven Development output format.
 *
 * Supports rendering:
 * - SessionState: Complete design session state into spec/plan/tasks
 * - PromptResult: Prompt configuration into SDD format
 *
 * @implements {OutputStrategy<SessionState | PromptResult>}
 */
export class SDDStrategy
	implements OutputStrategy<SessionState | PromptResult>
{
	/** The output approach this strategy implements */
	readonly approach = OutputApproach.SDD;

	/**
	 * Render a domain result to SDD artifacts (spec.md, plan.md, tasks.md).
	 *
	 * @param result - The domain result to render (SessionState or PromptResult)
	 * @param options - Optional rendering options
	 * @returns Output artifacts with primary spec.md and secondary plan.md, tasks.md
	 * @throws {Error} If result type is not supported
	 */
	render(
		result: SessionState | PromptResult,
		options?: Partial<RenderOptions>,
	): OutputArtifacts {
		if (this.isSessionState(result)) {
			return this.renderSession(result, options);
		}
		if (this.isPromptResult(result)) {
			return this.renderPrompt(result, options);
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
		return ["SessionState", "PromptResult"].includes(domainType);
	}

	/**
	 * Render a SessionState to SDD artifacts.
	 *
	 * @param result - The session state to render
	 * @param options - Optional rendering options
	 * @returns Output artifacts with spec, plan, and tasks documents
	 * @private
	 */
	private renderSession(
		result: SessionState,
		_options?: Partial<RenderOptions>,
	): OutputArtifacts {
		return {
			primary: this.generateSpec(result),
			secondary: [this.generatePlan(result), this.generateTasks(result)],
		};
	}

	/**
	 * Render a PromptResult to SDD artifacts.
	 *
	 * @param result - The prompt result to render
	 * @param options - Optional rendering options
	 * @returns Output artifacts with spec, plan, and tasks documents
	 * @private
	 */
	private renderPrompt(
		result: PromptResult,
		_options?: Partial<RenderOptions>,
	): OutputArtifacts {
		return {
			primary: this.generateSpecFromPrompt(result),
			secondary: [
				this.generatePlanFromPrompt(result),
				this.generateTasksFromPrompt(result),
			],
		};
	}

	/**
	 * Generate spec.md from SessionState.
	 *
	 * @param result - The session state
	 * @returns Specification document
	 * @private
	 */
	private generateSpec(result: SessionState): OutputDocument {
		const title = this.extractTitle(result);
		const overview = this.extractOverview(result);
		const functionalReqs = this.extractFunctionalRequirements(result);
		const nonFunctionalReqs = this.extractNonFunctionalRequirements(result);
		const constraints = this.extractConstraints(result);
		const successCriteria = this.extractSuccessCriteria(result);

		const content = `# Specification: ${title}

## Overview

${overview}

## Requirements

### Functional Requirements

${functionalReqs}

### Non-Functional Requirements

${nonFunctionalReqs}

## Constraints

${constraints}

## Success Criteria

${successCriteria}
`;

		return { name: "spec.md", content, format: "markdown" };
	}

	/**
	 * Generate plan.md from SessionState.
	 *
	 * @param result - The session state
	 * @returns Implementation plan document
	 * @private
	 */
	private generatePlan(result: SessionState): OutputDocument {
		const phases = this.extractPhases(result);
		const timeline = this.extractTimeline(result);
		const dependencies = this.extractDependencies(result);
		const risks = this.extractRisks(result);

		const content = `# Implementation Plan

## Phases

${phases}

## Timeline

${timeline}

## Dependencies

${dependencies}

## Risks

${risks}
`;

		return { name: "plan.md", content, format: "markdown" };
	}

	/**
	 * Generate tasks.md from SessionState.
	 *
	 * @param result - The session state
	 * @returns Task breakdown document with Mermaid diagram
	 * @private
	 */
	private generateTasks(result: SessionState): OutputDocument {
		const tasks = this.extractTasks(result);
		const dependencyGraph = this.generateDependencyGraph(result);

		const content = `# Tasks

## Task List

${tasks}

## Dependencies Graph

\`\`\`mermaid
${dependencyGraph}
\`\`\`
`;

		return { name: "tasks.md", content, format: "markdown" };
	}

	/**
	 * Generate spec.md from PromptResult.
	 *
	 * @param result - The prompt result
	 * @returns Specification document
	 * @private
	 */
	private generateSpecFromPrompt(result: PromptResult): OutputDocument {
		const title = "Feature";
		const sections = result.sections;

		// Extract overview from first section or default
		const overview = sections.length > 0 ? sections[0].body : "To be defined";

		// Build requirements from sections
		const requirements = sections
			.filter((s) => s.title.toLowerCase().includes("requirement"))
			.map((s, i) => `${i + 1}. ${s.body}`)
			.join("\n");

		const content = `# Specification: ${title}

## Overview

${overview}

## Requirements

${requirements || "To be defined"}

## Constraints

To be defined

## Success Criteria

To be defined
`;

		return { name: "spec.md", content, format: "markdown" };
	}

	/**
	 * Generate plan.md from PromptResult.
	 *
	 * @param result - The prompt result
	 * @returns Implementation plan document
	 * @private
	 */
	private generatePlanFromPrompt(_result: PromptResult): OutputDocument {
		const content = `# Implementation Plan

## Phases

To be defined based on requirements analysis

## Timeline

To be estimated

## Dependencies

To be identified

## Risks

To be assessed
`;

		return { name: "plan.md", content, format: "markdown" };
	}

	/**
	 * Generate tasks.md from PromptResult.
	 *
	 * @param result - The prompt result
	 * @returns Task breakdown document
	 * @private
	 */
	private generateTasksFromPrompt(_result: PromptResult): OutputDocument {
		const content = `# Tasks

## Task List

- [ ] Define requirements
- [ ] Create implementation plan
- [ ] Break down into tasks

## Dependencies Graph

\`\`\`mermaid
graph TD
    A[Define Requirements] --> B[Create Plan]
    B --> C[Break Down Tasks]
\`\`\`
`;

		return { name: "tasks.md", content, format: "markdown" };
	}

	/**
	 * Extract title from SessionState.
	 *
	 * @param result - The session state
	 * @returns Title string
	 * @private
	 */
	private extractTitle(result: SessionState): string {
		if (result.config?.goal) {
			return result.config.goal;
		}
		if (result.context?.title && typeof result.context.title === "string") {
			return result.context.title;
		}
		return "Feature";
	}

	/**
	 * Extract overview from SessionState.
	 *
	 * @param result - The session state
	 * @returns Overview text
	 * @private
	 */
	private extractOverview(result: SessionState): string {
		if (
			result.context?.overview &&
			typeof result.context.overview === "string"
		) {
			return result.context.overview;
		}
		if (result.config?.goal) {
			return result.config.goal;
		}
		return "To be defined";
	}

	/**
	 * Extract functional requirements from SessionState.
	 *
	 * @param result - The session state
	 * @returns Formatted requirements list
	 * @private
	 */
	private extractFunctionalRequirements(result: SessionState): string {
		if (
			result.config?.requirements &&
			Array.isArray(result.config.requirements)
		) {
			return result.config.requirements
				.map((req, i) => `${i + 1}. ${req}`)
				.join("\n");
		}
		if (
			result.context?.requirements &&
			Array.isArray(result.context.requirements)
		) {
			return (result.context.requirements as string[])
				.map((req, i) => `${i + 1}. ${req}`)
				.join("\n");
		}
		return "To be defined";
	}

	/**
	 * Extract non-functional requirements from SessionState.
	 *
	 * @param result - The session state
	 * @returns Formatted non-functional requirements
	 * @private
	 */
	private extractNonFunctionalRequirements(result: SessionState): string {
		if (
			result.context?.nonFunctionalRequirements &&
			Array.isArray(result.context.nonFunctionalRequirements)
		) {
			return (result.context.nonFunctionalRequirements as string[])
				.map((req, i) => `${i + 1}. ${req}`)
				.join("\n");
		}
		return "To be defined";
	}

	/**
	 * Extract constraints from SessionState.
	 *
	 * @param result - The session state
	 * @returns Formatted constraints list
	 * @private
	 */
	private extractConstraints(result: SessionState): string {
		if (
			result.config?.constraints &&
			Array.isArray(result.config.constraints)
		) {
			return (result.config.constraints as string[])
				.map((c) => `- ${c}`)
				.join("\n");
		}
		if (
			result.context?.constraints &&
			Array.isArray(result.context.constraints)
		) {
			return (result.context.constraints as string[])
				.map((c) => `- ${c}`)
				.join("\n");
		}
		return "None specified";
	}

	/**
	 * Extract success criteria from SessionState.
	 *
	 * @param result - The session state
	 * @returns Formatted success criteria
	 * @private
	 */
	private extractSuccessCriteria(result: SessionState): string {
		if (
			result.context?.successCriteria &&
			Array.isArray(result.context.successCriteria)
		) {
			return (result.context.successCriteria as string[])
				.map((c) => `- [ ] ${c}`)
				.join("\n");
		}
		return "To be defined";
	}

	/**
	 * Extract phases from SessionState.
	 *
	 * @param result - The session state
	 * @returns Formatted phases description
	 * @private
	 */
	private extractPhases(result: SessionState): string {
		if (result.phases) {
			const phaseEntries = Object.entries(result.phases);
			if (phaseEntries.length > 0) {
				return phaseEntries
					.map(([phaseId, phaseData], i) => {
						return `### Phase ${i + 1}: ${phaseId}

${typeof phaseData === "string" ? phaseData : "In progress"}
`;
					})
					.join("\n");
			}
		}
		if (result.history && result.history.length > 0) {
			const uniquePhases = [...new Set(result.history.map((h) => h.to))].filter(
				Boolean,
			);
			return uniquePhases
				.map(
					(phase, i) => `### Phase ${i + 1}: ${phase}

Completed or in progress
`,
				)
				.join("\n");
		}
		return "To be defined based on requirements";
	}

	/**
	 * Extract timeline from SessionState.
	 *
	 * @param result - The session state
	 * @returns Formatted timeline
	 * @private
	 */
	private extractTimeline(result: SessionState): string {
		if (
			result.context?.timeline &&
			typeof result.context.timeline === "string"
		) {
			return result.context.timeline;
		}
		if (result.history && result.history.length > 0) {
			const transitions = result.history
				.filter((h) => h.timestamp)
				.map((h) => `- ${h.timestamp}: Transitioned to ${h.to}`)
				.join("\n");
			return transitions || "To be estimated";
		}
		return "To be estimated";
	}

	/**
	 * Extract dependencies from SessionState.
	 *
	 * @param result - The session state
	 * @returns Formatted dependencies
	 * @private
	 */
	private extractDependencies(result: SessionState): string {
		if (
			result.context?.dependencies &&
			Array.isArray(result.context.dependencies)
		) {
			return (result.context.dependencies as string[])
				.map((d) => `- ${d}`)
				.join("\n");
		}
		return "To be identified";
	}

	/**
	 * Extract risks from SessionState.
	 *
	 * @param result - The session state
	 * @returns Formatted risks
	 * @private
	 */
	private extractRisks(result: SessionState): string {
		if (result.context?.risks && Array.isArray(result.context.risks)) {
			return (result.context.risks as string[]).map((r) => `- ${r}`).join("\n");
		}
		return "To be assessed";
	}

	/**
	 * Extract tasks from SessionState.
	 *
	 * @param result - The session state
	 * @returns Formatted task list
	 * @private
	 */
	private extractTasks(result: SessionState): string {
		if (result.context?.tasks && Array.isArray(result.context.tasks)) {
			return (
				result.context.tasks as Array<{ title: string; estimate?: string }>
			)
				.map((t) => {
					const estimate = t.estimate ? ` (${t.estimate})` : "";
					return `- [ ] ${t.title}${estimate}`;
				})
				.join("\n");
		}
		return "- [ ] Define requirements\n- [ ] Create implementation plan\n- [ ] Break down into tasks";
	}

	/**
	 * Generate Mermaid dependency graph from SessionState.
	 *
	 * @param result - The session state
	 * @returns Mermaid diagram syntax
	 * @private
	 */
	private generateDependencyGraph(result: SessionState): string {
		if (result.context?.tasks && Array.isArray(result.context.tasks)) {
			const tasks = result.context.tasks as Array<{
				id?: string;
				title: string;
				dependencies?: string[];
			}>;

			const nodes = tasks
				.map((t, i) => {
					const id = t.id || `T${i + 1}`;
					return `    ${id}[${t.title}]`;
				})
				.join("\n");

			const edges = tasks
				.flatMap((t, i) => {
					const id = t.id || `T${i + 1}`;
					if (t.dependencies && t.dependencies.length > 0) {
						return t.dependencies.map((dep) => `    ${dep} --> ${id}`);
					}
					return [];
				})
				.join("\n");

			if (edges) {
				return `graph TD\n${nodes}\n${edges}`;
			}
		}

		// Default simple graph
		return `graph TD
    A[Define Requirements] --> B[Create Plan]
    B --> C[Break Down Tasks]`;
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
}
