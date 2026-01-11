/**
 * SpecKitStrategy - GitHub Spec-Kit output format
 *
 * Generates a complete "Spec Kit" folder structure with comprehensive
 * documentation for implementing a feature following GitHub's Spec-Kit methodology.
 * This is the premium output format - the signature output of the refactored project.
 *
 * Generates:
 * - README.md: Overview and navigation (primary)
 * - spec.md: Full specification with requirements
 * - plan.md: Implementation plan with phases
 * - tasks.md: Detailed task breakdown
 * - adr.md: Architecture decision record
 * - roadmap.md: Timeline and milestones
 *
 * @module strategies/speckit-strategy
 * @see {@link https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-001-output-strategy-layer.md SPEC-001} §4.5
 * @see {@link https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-005-speckit-integration.md SPEC-005}
 */

import type { SessionState } from "../domain/design/types.js";
import type {
	OutputArtifacts,
	OutputDocument,
	OutputStrategy,
	RenderOptions,
} from "./output-strategy.js";
import { OutputApproach } from "./output-strategy.js";
import type {
	ArchitectureRule,
	Constitution,
	Constraint,
	ConstraintReference,
	DesignPrinciple,
	Principle,
} from "./speckit/types.js";

/**
 * Rendering options specific to SpecKit output format.
 *
 * Extends the base RenderOptions with SpecKit-specific capabilities
 * like constitutional constraints and validation.
 *
 * @interface SpecKitRenderOptions
 */
export interface SpecKitRenderOptions extends Partial<RenderOptions> {
	/** Optional constitution to apply constraints from */
	constitution?: Constitution;

	/** Whether to include constitutional constraints in spec.md */
	includeConstitutionalConstraints?: boolean;

	/** Whether to validate spec against constitution before rendering */
	validateBeforeRender?: boolean;
}

/**
 * SpecKitStrategy implements GitHub's Spec-Kit output format.
 *
 * Generates a complete folder structure with 6 documents:
 * - README.md (primary): Navigation and quick start
 * - spec.md: Requirements and constraints
 * - plan.md: Implementation phases and timeline
 * - tasks.md: Detailed task breakdown
 * - adr.md: Architecture decision record
 * - roadmap.md: Milestones and deliverables
 *
 * Supports rendering:
 * - SessionState: Complete design session into Spec-Kit format
 *
 * @implements {OutputStrategy<SessionState>}
 */
export class SpecKitStrategy implements OutputStrategy<SessionState> {
	/** The output approach this strategy implements */
	readonly approach = OutputApproach.SPECKIT;

	/**
	 * Render a domain result to Spec-Kit artifacts.
	 *
	 * @param result - The SessionState to render
	 * @param options - Optional SpecKit rendering options
	 * @returns Output artifacts with README.md and 5 secondary documents
	 * @throws {Error} If result is not a SessionState
	 */
	render(
		result: SessionState,
		options?: SpecKitRenderOptions,
	): OutputArtifacts {
		if (!this.isSessionState(result)) {
			throw new Error("SpecKitStrategy only supports SessionState");
		}

		const title = this.extractTitle(result);
		const slug = this.slugify(title);

		return {
			primary: this.generateReadme(result, slug),
			secondary: [
				this.generateSpec(result, slug, options),
				this.generatePlan(result, slug),
				this.generateTasks(result, slug),
				this.generateAdr(result, slug),
				this.generateRoadmap(result, slug),
			],
		};
	}

	/**
	 * Check if this strategy supports rendering a specific domain type.
	 *
	 * @param domainType - The domain type identifier
	 * @returns True if this strategy can render the domain type
	 */
	supports(domainType: string): boolean {
		return ["SessionState"].includes(domainType);
	}

	/**
	 * Generate README.md - primary navigation document.
	 *
	 * @param result - The session state
	 * @param slug - The slugified folder name
	 * @returns README document with navigation and quick start
	 * @private
	 */
	private generateReadme(result: SessionState, slug: string): OutputDocument {
		const title = this.extractTitle(result);
		const overview = this.extractOverview(result);
		const currentDate = new Date().toISOString().split("T")[0];
		const status = result.status || "Draft";

		const content = `# Spec Kit: ${title}

This Spec Kit contains the complete documentation for implementing this feature.

## Overview

${overview}

## Contents

- [spec.md](./spec.md) - Full specification with requirements and constraints
- [plan.md](./plan.md) - Implementation plan with phases and timeline
- [tasks.md](./tasks.md) - Detailed task breakdown with dependencies
- [adr.md](./adr.md) - Architecture decision record
- [roadmap.md](./roadmap.md) - Timeline and milestones

## Quick Start

1. Read the specification (spec.md)
2. Review the ADR for design decisions
3. Follow the implementation plan
4. Execute tasks in order

## Status

- **Created**: ${currentDate}
- **Status**: ${status}
- **Owner**: @copilot

---
*Generated by design-assistant with SpecKit strategy*
`;

		return {
			name: `${slug}/README.md`,
			content,
			format: "markdown",
		};
	}

	/**
	 * Generate spec.md - full specification document.
	 *
	 * @param result - The session state
	 * @param slug - The slugified folder name
	 * @param options - Optional SpecKit rendering options
	 * @returns Specification document with requirements and constraints
	 * @private
	 */
	private generateSpec(
		result: SessionState,
		slug: string,
		options?: SpecKitRenderOptions,
	): OutputDocument {
		const title = this.extractTitle(result);
		const overview = this.extractOverview(result);
		const functionalReqs = this.extractFunctionalRequirements(result);
		const nonFunctionalReqs = this.extractNonFunctionalRequirements(result);
		const constraints = this.extractConstraints(result);
		const acceptanceCriteria = this.extractAcceptanceCriteria(result);
		const outOfScope = this.extractOutOfScope(result);
		const constraintRefs = this.extractConstraintReferences(result);

		const content = `# Specification: ${title}

## Overview

${overview}

## Objectives

${this.extractObjectives(result)}

## Requirements

### Functional Requirements

${functionalReqs}

### Non-Functional Requirements

${nonFunctionalReqs}

## Constraints

${constraints}

${options?.includeConstitutionalConstraints && options.constitution ? this.renderConstraints(constraintRefs, options.constitution) : ""}

## Acceptance Criteria

${acceptanceCriteria}

## Out of Scope

${outOfScope}

---
*See [plan.md](./plan.md) for implementation details*
*See [adr.md](./adr.md) for architectural decisions*
`;

		return {
			name: `${slug}/spec.md`,
			content,
			format: "markdown",
		};
	}

	/**
	 * Generate plan.md - implementation plan document.
	 *
	 * @param result - The session state
	 * @param slug - The slugified folder name
	 * @returns Implementation plan with phases and timeline
	 * @private
	 */
	private generatePlan(result: SessionState, slug: string): OutputDocument {
		const title = this.extractTitle(result);
		const approach = this.extractApproach(result);
		const phases = this.extractPhasesDetailed(result);
		const timeline = this.extractTimeline(result);
		const dependencies = this.extractDependencies(result);
		const risks = this.extractRisks(result);

		const content = `# Implementation Plan: ${title}

## Approach

${approach}

## Phases

${phases}

## Timeline

${timeline}

## Dependencies

${dependencies}

## Risks & Mitigation

${risks}

---
*See [tasks.md](./tasks.md) for detailed task breakdown*
*See [roadmap.md](./roadmap.md) for milestones and deliverables*
`;

		return {
			name: `${slug}/plan.md`,
			content,
			format: "markdown",
		};
	}

	/**
	 * Generate tasks.md - detailed task breakdown.
	 *
	 * @param result - The session state
	 * @param slug - The slugified folder name
	 * @returns Task breakdown document with checklist
	 * @private
	 */
	private generateTasks(result: SessionState, slug: string): OutputDocument {
		const title = this.extractTitle(result);
		const tasks = this.extractTaskList(result);
		const dependencies = this.generateTaskDependencies(result);

		const content = `# Tasks: ${title}

## Task List

${tasks}

## Task Dependencies

${dependencies}

## Completion Tracking

- Total Tasks: ${this.countTasks(result)}
- Completed: 0
- In Progress: 0
- Blocked: 0

---
*Update this document as tasks are completed*
*Mark tasks with [x] when complete*
`;

		return {
			name: `${slug}/tasks.md`,
			content,
			format: "markdown",
		};
	}

	/**
	 * Generate adr.md - architecture decision record.
	 *
	 * @param result - The session state
	 * @param slug - The slugified folder name
	 * @returns Architecture decision record
	 * @private
	 */
	private generateAdr(result: SessionState, slug: string): OutputDocument {
		const title = this.extractTitle(result);
		const context = this.extractAdrContext(result);
		const decision = this.extractAdrDecision(result);
		const consequences = this.extractAdrConsequences(result);
		const currentDate = new Date().toLocaleDateString("en-US", {
			month: "long",
			year: "numeric",
		});

		const content = `# ADR: ${title}

## Status

Proposed — ${currentDate}

## Context

${context}

## Decision

${decision}

## Consequences

### Positive

${consequences.positive}

### Negative

${consequences.negative}

### Neutral

${consequences.neutral}

---
*See [spec.md](./spec.md) for full requirements*
*See [plan.md](./plan.md) for implementation approach*
`;

		return {
			name: `${slug}/adr.md`,
			content,
			format: "markdown",
		};
	}

	/**
	 * Generate roadmap.md - timeline and milestones.
	 *
	 * @param result - The session state
	 * @param slug - The slugified folder name
	 * @returns Roadmap with milestones and deliverables
	 * @private
	 */
	private generateRoadmap(result: SessionState, slug: string): OutputDocument {
		const title = this.extractTitle(result);
		const milestones = this.extractMilestones(result);
		const deliverables = this.extractDeliverables(result);

		const content = `# Roadmap: ${title}

## Overview

This roadmap outlines the key milestones and deliverables for implementing this feature.

## Milestones

${milestones}

## Key Deliverables

${deliverables}

## Progress Tracking

Track progress against this roadmap and update status as milestones are completed.

---
*See [plan.md](./plan.md) for detailed phase breakdown*
*See [tasks.md](./tasks.md) for task-level tracking*
`;

		return {
			name: `${slug}/roadmap.md`,
			content,
			format: "markdown",
		};
	}

	/**
	 * Slugify a title for use as a folder name.
	 *
	 * Converts to lowercase, replaces non-alphanumeric with hyphens,
	 * and truncates to 50 characters.
	 *
	 * @param title - The title to slugify
	 * @returns Slugified string suitable for folder name
	 * @private
	 */
	private slugify(title: string): string {
		return title
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/^-+|-+$/g, "")
			.slice(0, 50);
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
	 * Extract objectives from SessionState.
	 *
	 * @param result - The session state
	 * @returns Formatted objectives list
	 * @private
	 */
	private extractObjectives(result: SessionState): string {
		if (
			result.context?.objectives &&
			Array.isArray(result.context.objectives)
		) {
			return (result.context.objectives as string[])
				.map((obj, i) => `${i + 1}. ${obj}`)
				.join("\n");
		}
		if (result.config?.goal) {
			return `1. ${result.config.goal}`;
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
	 * Extract acceptance criteria from SessionState.
	 *
	 * @param result - The session state
	 * @returns Formatted acceptance criteria
	 * @private
	 */
	private extractAcceptanceCriteria(result: SessionState): string {
		if (
			result.context?.acceptanceCriteria &&
			Array.isArray(result.context.acceptanceCriteria)
		) {
			return (result.context.acceptanceCriteria as string[])
				.map((c) => `- [ ] ${c}`)
				.join("\n");
		}
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
	 * Extract out-of-scope items from SessionState.
	 *
	 * @param result - The session state
	 * @returns Formatted out-of-scope list
	 * @private
	 */
	private extractOutOfScope(result: SessionState): string {
		if (
			result.context?.outOfScope &&
			Array.isArray(result.context.outOfScope)
		) {
			return (result.context.outOfScope as string[])
				.map((item) => `- ${item}`)
				.join("\n");
		}
		return "None specified";
	}

	/**
	 * Extract implementation approach from SessionState.
	 *
	 * @param result - The session state
	 * @returns Approach description
	 * @private
	 */
	private extractApproach(result: SessionState): string {
		if (
			result.context?.approach &&
			typeof result.context.approach === "string"
		) {
			return result.context.approach;
		}
		return "To be defined based on requirements analysis";
	}

	/**
	 * Extract detailed phases from SessionState.
	 *
	 * @param result - The session state
	 * @returns Formatted phases description
	 * @private
	 */
	private extractPhasesDetailed(result: SessionState): string {
		if (result.phases) {
			const phaseEntries = Object.entries(result.phases);
			if (phaseEntries.length > 0) {
				return phaseEntries
					.map(([phaseId, phaseData], i) => {
						const description =
							typeof phaseData === "string" ? phaseData : "In progress";
						return `### Phase ${i + 1}: ${phaseId}

${description}

**Status**: ${typeof phaseData === "object" && phaseData !== null && "status" in phaseData ? phaseData.status : "Pending"}
`;
					})
					.join("\n");
			}
		}

		// Default phases if not defined
		return `### Phase 1: Requirements Gathering

Define and document all functional and non-functional requirements.

**Status**: Pending

### Phase 2: Design & Architecture

Create architectural design and make key technical decisions.

**Status**: Pending

### Phase 3: Implementation

Execute development according to the plan.

**Status**: Pending

### Phase 4: Testing & Validation

Verify all acceptance criteria are met.

**Status**: Pending
`;
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

		// Generate timeline from phases if available
		if (result.phases) {
			const phaseCount = Object.keys(result.phases).length;
			return `Estimated ${phaseCount} phases, timeline to be determined based on complexity`;
		}

		return "To be estimated based on requirements and team capacity";
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
		return "- None identified yet";
	}

	/**
	 * Extract risks from SessionState.
	 *
	 * @param result - The session state
	 * @returns Formatted risks with mitigation
	 * @private
	 */
	private extractRisks(result: SessionState): string {
		if (result.context?.risks && Array.isArray(result.context.risks)) {
			return (
				result.context.risks as Array<
					string | { name: string; mitigation?: string }
				>
			)
				.map((risk) => {
					if (typeof risk === "string") {
						return `- **Risk**: ${risk}\n  - **Mitigation**: To be defined`;
					}
					return `- **Risk**: ${risk.name}\n  - **Mitigation**: ${risk.mitigation || "To be defined"}`;
				})
				.join("\n");
		}
		return "- None identified yet";
	}

	/**
	 * Extract task list from SessionState.
	 *
	 * @param result - The session state
	 * @returns Formatted task list
	 * @private
	 */
	private extractTaskList(result: SessionState): string {
		if (result.context?.tasks && Array.isArray(result.context.tasks)) {
			return (
				result.context.tasks as Array<{
					title: string;
					estimate?: string;
					priority?: string;
				}>
			)
				.map((task, i) => {
					const estimate = task.estimate ? ` (${task.estimate})` : "";
					const priority = task.priority ? ` [${task.priority}]` : "";
					return `${i + 1}. [ ] ${task.title}${estimate}${priority}`;
				})
				.join("\n");
		}

		// Default tasks derived from requirements
		if (
			result.config?.requirements &&
			Array.isArray(result.config.requirements)
		) {
			return result.config.requirements
				.map((req, i) => `${i + 1}. [ ] Implement: ${req}`)
				.join("\n");
		}

		return "1. [ ] Define detailed requirements\n2. [ ] Create implementation plan\n3. [ ] Execute development\n4. [ ] Test and validate";
	}

	/**
	 * Generate task dependencies description.
	 *
	 * @param result - The session state
	 * @returns Task dependencies description
	 * @private
	 */
	private generateTaskDependencies(result: SessionState): string {
		if (result.context?.tasks && Array.isArray(result.context.tasks)) {
			const tasks = result.context.tasks as Array<{
				id?: string;
				title: string;
				dependencies?: string[];
			}>;

			const withDeps = tasks.filter(
				(t) => t.dependencies && t.dependencies.length > 0,
			);

			if (withDeps.length > 0) {
				return withDeps
					.map((task) => {
						const taskId = task.id || task.title;
						return `- **${taskId}** depends on: ${task.dependencies?.join(", ")}`;
					})
					.join("\n");
			}
		}

		return "No explicit task dependencies defined yet";
	}

	/**
	 * Count total tasks.
	 *
	 * @param result - The session state
	 * @returns Task count
	 * @private
	 */
	private countTasks(result: SessionState): number {
		if (result.context?.tasks && Array.isArray(result.context.tasks)) {
			return result.context.tasks.length;
		}
		if (
			result.config?.requirements &&
			Array.isArray(result.config.requirements)
		) {
			return result.config.requirements.length;
		}
		return 4; // Default task count
	}

	/**
	 * Extract ADR context from SessionState.
	 *
	 * @param result - The session state
	 * @returns ADR context description
	 * @private
	 */
	private extractAdrContext(result: SessionState): string {
		if (
			result.context?.adrContext &&
			typeof result.context.adrContext === "string"
		) {
			return result.context.adrContext;
		}
		return `${this.extractOverview(result)}\n\nThis decision addresses the key architectural and design considerations for implementing this feature.`;
	}

	/**
	 * Extract ADR decision from SessionState.
	 *
	 * @param result - The session state
	 * @returns ADR decision description
	 * @private
	 */
	private extractAdrDecision(result: SessionState): string {
		if (
			result.context?.adrDecision &&
			typeof result.context.adrDecision === "string"
		) {
			return result.context.adrDecision;
		}
		if (
			result.context?.approach &&
			typeof result.context.approach === "string"
		) {
			return `We have decided to: ${result.context.approach}`;
		}
		return "To be documented based on architectural analysis";
	}

	/**
	 * Extract ADR consequences from SessionState.
	 *
	 * @param result - The session state
	 * @returns ADR consequences (positive, negative, neutral)
	 * @private
	 */
	private extractAdrConsequences(result: SessionState): {
		positive: string;
		negative: string;
		neutral: string;
	} {
		const consequences = {
			positive: "- To be documented",
			negative: "- To be documented",
			neutral: "- To be documented",
		};

		if (result.context?.adrConsequences) {
			const adrCons = result.context.adrConsequences as {
				positive?: string[];
				negative?: string[];
				neutral?: string[];
			};

			if (adrCons.positive && Array.isArray(adrCons.positive)) {
				consequences.positive = adrCons.positive
					.map((c) => `- ${c}`)
					.join("\n");
			}
			if (adrCons.negative && Array.isArray(adrCons.negative)) {
				consequences.negative = adrCons.negative
					.map((c) => `- ${c}`)
					.join("\n");
			}
			if (adrCons.neutral && Array.isArray(adrCons.neutral)) {
				consequences.neutral = adrCons.neutral.map((c) => `- ${c}`).join("\n");
			}
		}

		return consequences;
	}

	/**
	 * Extract milestones from SessionState.
	 *
	 * @param result - The session state
	 * @returns Formatted milestones
	 * @private
	 */
	private extractMilestones(result: SessionState): string {
		if (
			result.context?.milestones &&
			Array.isArray(result.context.milestones)
		) {
			return (
				result.context.milestones as Array<{
					name: string;
					date?: string;
					deliverables?: string[];
				}>
			)
				.map((milestone, i) => {
					const date = milestone.date || "TBD";
					const deliverables = milestone.deliverables
						? `\n  - ${milestone.deliverables.join("\n  - ")}`
						: "";
					return `### Milestone ${i + 1}: ${milestone.name}

**Target Date**: ${date}${deliverables}
`;
				})
				.join("\n");
		}

		// Generate default milestones from phases
		if (result.phases) {
			return Object.keys(result.phases)
				.map(
					(phase, i) => `### Milestone ${i + 1}: Complete ${phase} phase

**Target Date**: TBD
`,
				)
				.join("\n");
		}

		return `### Milestone 1: Requirements Complete

**Target Date**: TBD

### Milestone 2: Design Complete

**Target Date**: TBD

### Milestone 3: Implementation Complete

**Target Date**: TBD

### Milestone 4: Testing Complete

**Target Date**: TBD
`;
	}

	/**
	 * Extract deliverables from SessionState.
	 *
	 * @param result - The session state
	 * @returns Formatted deliverables list
	 * @private
	 */
	private extractDeliverables(result: SessionState): string {
		if (
			result.context?.deliverables &&
			Array.isArray(result.context.deliverables)
		) {
			return (result.context.deliverables as string[])
				.map((d) => `- ${d}`)
				.join("\n");
		}

		// Generate deliverables from requirements
		if (
			result.config?.requirements &&
			Array.isArray(result.config.requirements)
		) {
			return result.config.requirements
				.map((req) => `- Implemented: ${req}`)
				.join("\n");
		}

		return "- Complete specification document\n- Working implementation\n- Comprehensive test suite\n- Documentation";
	}

	/**
	 * Extract constraint references from SessionState.
	 *
	 * Looks for constraint references in the context that link to
	 * constitutional constraints.
	 *
	 * @param result - The session state
	 * @returns Array of constraint references
	 * @private
	 */
	private extractConstraintReferences(
		result: SessionState,
	): ConstraintReference[] {
		if (
			result.context?.constraintReferences &&
			Array.isArray(result.context.constraintReferences)
		) {
			return result.context.constraintReferences as ConstraintReference[];
		}
		return [];
	}

	/**
	 * Render constitutional constraints section.
	 *
	 * Generates a markdown section with constitutional constraints
	 * referenced by this specification. Each constraint is looked up
	 * in the constitution and rendered with its full details.
	 *
	 * @param constraints - Array of constraint references
	 * @param constitution - The constitution to look up constraints from
	 * @returns Formatted constitutional constraints section
	 * @private
	 */
	private renderConstraints(
		constraints: ConstraintReference[],
		constitution: Constitution,
	): string {
		if (constraints.length === 0) return "";

		return `## Constitutional Constraints

${constraints
	.map((c) => {
		const item = this.findConstitutionItem(c.constitutionId, constitution);
		return `### ${c.constitutionId}: ${item?.title ?? "Unknown"}
${item?.description ?? ""}
${c.notes ? `\n**Notes**: ${c.notes}` : ""}
`;
	})
	.join("\n")}`;
	}

	/**
	 * Find a constitution item by ID.
	 *
	 * Searches through all constitution sections (principles, constraints,
	 * architecture rules, design principles) to find an item with the
	 * matching ID.
	 *
	 * @param id - The constitution item ID to find
	 * @param constitution - The constitution to search
	 * @returns The found constitution item or undefined
	 * @private
	 */
	private findConstitutionItem(
		id: string,
		constitution: Constitution,
	): Principle | Constraint | ArchitectureRule | DesignPrinciple | undefined {
		// Search principles
		const principle = constitution.principles.find((p) => p.id === id);
		if (principle) return principle;

		// Search constraints
		const constraint = constitution.constraints.find((c) => c.id === id);
		if (constraint) return constraint;

		// Search architecture rules
		const archRule = constitution.architectureRules.find((ar) => ar.id === id);
		if (archRule) return archRule;

		// Search design principles
		const designPrinciple = constitution.designPrinciples.find(
			(dp) => dp.id === id,
		);
		if (designPrinciple) return designPrinciple;

		return undefined;
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
