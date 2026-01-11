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
	AcceptanceCriterion,
	ArchitectureRule,
	Constitution,
	Constraint,
	ConstraintReference,
	Dependency,
	DerivedTask,
	DesignPrinciple,
	ParsedSpec,
	Phase,
	Plan,
	Principle,
	Requirement,
	Risk,
	TimelineEntry,
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
				this.renderPlan(result, slug),
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

${constraints}${
	options?.includeConstitutionalConstraints && options.constitution
		? `\n\n${this.renderConstraints(constraintRefs, options.constitution)}`
		: ""
}

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

		const renderedConstraints = constraints
			.map((c) => {
				const item = this.findConstitutionItem(c.constitutionId, constitution);
				const notes = c.notes ? `\n**Notes**: ${c.notes}` : "";

				return `### ${c.constitutionId}: ${item?.title ?? "Unknown"}
${item?.description ?? ""}${notes}`;
			})
			.join("\n\n");

		return `## Constitutional Constraints

${renderedConstraints}`;
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
	 * Render plan.md document with structured Plan data.
	 *
	 * This is the enhanced method that creates a structured Plan object
	 * and renders it into the plan.md format as specified in P4-005.
	 *
	 * @param result - The session state
	 * @param slug - The slugified folder name
	 * @returns OutputDocument for plan.md
	 * @private
	 */
	private renderPlan(result: SessionState, slug: string): OutputDocument {
		const plan = this.extractPlan(result);
		const title = this.extractTitle(result);

		const content = `# Implementation Plan: ${title}

## Approach

${plan.approach}

## Phases

${plan.phases
	.map(
		(p) => `### ${p.id}: ${p.name}

${p.description}

**Duration**: ${p.duration}

**Deliverables**:
${p.deliverables.map((d) => `- ${d}`).join("\n")}
`,
	)
	.join("\n")}

## Dependencies

| ID | Description | Owner |
|----|-------------|-------|
${plan.dependencies.map((d) => `| ${d.id} | ${d.description} | ${d.owner ?? "TBD"} |`).join("\n")}

## Risks

| ID | Risk | Severity | Mitigation |
|----|------|----------|------------|
${plan.risks.map((r) => `| ${r.id} | ${r.description} | ${r.severity} | ${r.mitigation} |`).join("\n")}

## Timeline

| Phase | Start | End |
|-------|-------|-----|
${plan.timeline.map((t) => `| ${t.phase} | Week ${t.startWeek} | Week ${t.endWeek} |`).join("\n")}

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
	 * Extract structured Plan data from SessionState.
	 *
	 * Maps the design session data to the Plan interface,
	 * deriving phases, dependencies, risks, and timeline.
	 *
	 * @param result - The session state
	 * @returns Structured Plan object
	 * @private
	 */
	private extractPlan(result: SessionState): Plan {
		const phases = this.derivePhases(result);
		return {
			approach:
				(result.context?.approach as string) ??
				"Iterative implementation following Spec-Kit methodology",
			phases,
			dependencies: this.deriveDependencies(result),
			risks: this.deriveRisks(result),
			timeline: this.deriveTimeline(phases),
		};
	}

	/**
	 * Derive phases from SessionState.
	 *
	 * Maps design session phases to structured Phase objects
	 * with IDs, names, descriptions, deliverables, and durations.
	 *
	 * @param result - The session state
	 * @returns Array of Phase objects
	 * @private
	 */
	private derivePhases(result: SessionState): Phase[] {
		if (result.phases && Object.keys(result.phases).length > 0) {
			return Object.entries(result.phases).map(([phaseId, phaseData], i) => {
				const description =
					typeof phaseData === "string"
						? phaseData
						: typeof phaseData === "object" &&
								phaseData !== null &&
								"description" in phaseData
							? String(phaseData.description)
							: "In progress";

				// Extract deliverables if available
				const deliverables =
					typeof phaseData === "object" &&
					phaseData !== null &&
					"deliverables" in phaseData &&
					Array.isArray(phaseData.deliverables)
						? (phaseData.deliverables as string[])
						: ["Complete phase objectives"];

				// Extract duration if available
				const duration =
					typeof phaseData === "object" &&
					phaseData !== null &&
					"duration" in phaseData
						? String(phaseData.duration)
						: "TBD";

				return {
					id: `PHASE-${String(i + 1).padStart(3, "0")}`,
					name: phaseId,
					description,
					deliverables,
					duration,
				};
			});
		}

		// Default phases if none defined
		return [
			{
				id: "PHASE-001",
				name: "Requirements Gathering",
				description:
					"Define and document all functional and non-functional requirements.",
				deliverables: ["Requirements specification", "Use cases"],
				duration: "1 week",
			},
			{
				id: "PHASE-002",
				name: "Design & Architecture",
				description:
					"Create architectural design and make key technical decisions.",
				deliverables: ["Architecture diagrams", "Technical specifications"],
				duration: "2 weeks",
			},
			{
				id: "PHASE-003",
				name: "Implementation",
				description: "Execute development according to the plan.",
				deliverables: ["Working code", "Unit tests"],
				duration: "4 weeks",
			},
			{
				id: "PHASE-004",
				name: "Testing & Validation",
				description: "Verify all acceptance criteria are met.",
				deliverables: ["Test reports", "Quality assurance sign-off"],
				duration: "1 week",
			},
		];
	}

	/**
	 * Derive dependencies from SessionState.
	 *
	 * Extracts project dependencies and formats them as Dependency objects.
	 *
	 * @param result - The session state
	 * @returns Array of Dependency objects
	 * @private
	 */
	private deriveDependencies(result: SessionState): Dependency[] {
		if (
			result.context?.dependencies &&
			Array.isArray(result.context.dependencies)
		) {
			return (result.context.dependencies as Array<string | Dependency>).map(
				(dep, i) => {
					if (typeof dep === "string") {
						return {
							id: `DEP-${String(i + 1).padStart(3, "0")}`,
							description: dep,
							owner: undefined,
						};
					}
					return {
						id: dep.id ?? `DEP-${String(i + 1).padStart(3, "0")}`,
						description: dep.description,
						owner: dep.owner,
					};
				},
			);
		}

		return [
			{
				id: "DEP-001",
				description: "No dependencies identified",
				owner: undefined,
			},
		];
	}

	/**
	 * Derive risks from SessionState.
	 *
	 * Extracts project risks and formats them as Risk objects
	 * with severity levels and mitigation strategies.
	 *
	 * @param result - The session state
	 * @returns Array of Risk objects
	 * @private
	 */
	private deriveRisks(result: SessionState): Risk[] {
		if (result.context?.risks && Array.isArray(result.context.risks)) {
			return (
				result.context.risks as Array<
					| string
					| {
							name?: string;
							description?: string;
							mitigation?: string;
							severity?: string;
					  }
				>
			).map((risk, i) => {
				if (typeof risk === "string") {
					return {
						id: `RISK-${String(i + 1).padStart(3, "0")}`,
						description: risk,
						severity: "medium" as const,
						mitigation: "To be defined",
					};
				}

				const description = risk.description ?? risk.name ?? "Unnamed risk";
				const severity = (
					risk.severity?.toLowerCase() === "high" ||
					risk.severity?.toLowerCase() === "low"
						? risk.severity.toLowerCase()
						: "medium"
				) as "high" | "medium" | "low";

				return {
					id: `RISK-${String(i + 1).padStart(3, "0")}`,
					description,
					severity,
					mitigation: risk.mitigation ?? "To be defined",
				};
			});
		}

		return [
			{
				id: "RISK-001",
				description: "No significant risks identified yet",
				severity: "low",
				mitigation: "Continue monitoring during implementation",
			},
		];
	}

	/**
	 * Derive timeline from Phase array.
	 *
	 * Generates a timeline by assigning week numbers to each phase
	 * based on their sequence and estimated durations.
	 *
	 * @param phases - Array of Phase objects
	 * @returns Array of TimelineEntry objects
	 * @private
	 */
	private deriveTimeline(phases: Phase[]): TimelineEntry[] {
		let currentWeek = 1;

		return phases.map((phase) => {
			// Parse duration to estimate weeks (simple heuristic)
			const durationMatch = phase.duration.match(/(\d+)\s*week/i);
			const weekCount = durationMatch
				? Number.parseInt(durationMatch[1], 10)
				: 1;

			const entry: TimelineEntry = {
				phase: phase.id,
				startWeek: currentWeek,
				endWeek: currentWeek + weekCount - 1,
			};

			currentWeek += weekCount;
			return entry;
		});
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
	 * Derive actionable tasks from a parsed specification.
	 *
	 * Transforms requirements and acceptance criteria into concrete,
	 * estimable tasks with verification tasks for each requirement.
	 *
	 * @param spec - The parsed specification
	 * @returns Array of derived tasks with IDs, estimates, and dependencies
	 * @private
	 */
	private deriveTasksFromSpec(spec: ParsedSpec): DerivedTask[] {
		const tasks: DerivedTask[] = [];
		let taskCounter = 1;

		// Derive tasks from functional requirements
		for (const req of spec.functionalRequirements) {
			const task = this.deriveTaskFromRequirement(req, taskCounter++);
			tasks.push(task);

			// Add verification task for each requirement
			const verifyTask = this.deriveVerificationTask(req, taskCounter++);
			tasks.push(verifyTask);
		}

		// Derive tasks from acceptance criteria
		for (const ac of spec.acceptanceCriteria) {
			const task = this.deriveTaskFromAcceptanceCriterion(ac, taskCounter++);
			tasks.push(task);
		}

		return tasks;
	}

	/**
	 * Derive an implementation task from a requirement.
	 *
	 * Converts a requirement into an actionable task with estimate
	 * based on complexity keywords in the description.
	 *
	 * @param req - The requirement to derive a task from
	 * @param id - Numeric task ID
	 * @returns Implementation task
	 * @private
	 */
	private deriveTaskFromRequirement(req: Requirement, id: number): DerivedTask {
		// Estimate based on complexity keywords
		const estimate = this.estimateFromDescription(req.description);

		return {
			id: `T${String(id).padStart(3, "0")}`,
			title: `Implement: ${this.extractTaskTitle(req.description)}`,
			description: `Implement functionality to satisfy requirement ${req.id}.\n\n**Requirement**: ${req.description}`,
			priority: req.priority,
			estimate,
			acceptanceCriteria: [
				`Requirement ${req.id} is satisfied`,
				"Unit tests pass",
				"Code review approved",
			],
		};
	}

	/**
	 * Derive a verification task for a requirement.
	 *
	 * Creates a testing/verification task that depends on the
	 * implementation task for the same requirement.
	 *
	 * @param req - The requirement to verify
	 * @param id - Numeric task ID
	 * @returns Verification task with dependency
	 * @private
	 */
	private deriveVerificationTask(req: Requirement, id: number): DerivedTask {
		return {
			id: `T${String(id).padStart(3, "0")}`,
			title: `Verify: ${this.extractTaskTitle(req.description)}`,
			description: `Write tests to verify requirement ${req.id} is correctly implemented.`,
			priority: req.priority,
			estimate: "2h",
			acceptanceCriteria: [
				"Tests cover happy path",
				"Tests cover edge cases",
				"Tests cover error conditions",
			],
			dependencies: [`T${String(id - 1).padStart(3, "0")}`],
		};
	}

	/**
	 * Derive a validation task from an acceptance criterion.
	 *
	 * Creates a task to validate that an acceptance criterion is met,
	 * with estimate based on verification method (automated vs manual).
	 *
	 * @param ac - The acceptance criterion to validate
	 * @param id - Numeric task ID
	 * @returns Validation task
	 * @private
	 */
	private deriveTaskFromAcceptanceCriterion(
		ac: AcceptanceCriterion,
		id: number,
	): DerivedTask {
		return {
			id: `T${String(id).padStart(3, "0")}`,
			title: `Validate: ${this.extractTaskTitle(ac.description)}`,
			description: `Verify acceptance criterion ${ac.id} is met.`,
			priority: "high",
			estimate: ac.verificationMethod === "automated" ? "1h" : "2h",
			acceptanceCriteria: [
				`${ac.description} is verified`,
				`Verification method: ${ac.verificationMethod}`,
			],
		};
	}

	/**
	 * Estimate task duration from description complexity.
	 *
	 * Uses keyword analysis to estimate work duration:
	 * - "simple" or "basic" → 2h
	 * - "complex" or "comprehensive" → 8h
	 * - "integration" or "refactor" → 4h
	 * - default → 3h
	 *
	 * @param description - Task or requirement description
	 * @returns Estimated duration string
	 * @private
	 */
	private estimateFromDescription(description: string): string {
		const lowercased = description.toLowerCase();

		if (lowercased.includes("simple") || lowercased.includes("basic")) {
			return "2h";
		}
		if (
			lowercased.includes("complex") ||
			lowercased.includes("comprehensive")
		) {
			return "8h";
		}
		if (lowercased.includes("integration") || lowercased.includes("refactor")) {
			return "4h";
		}

		return "3h"; // Default estimate
	}

	/**
	 * Extract a concise title from a description.
	 *
	 * Takes the first sentence or truncates to 50 characters,
	 * suitable for task titles.
	 *
	 * @param description - Full description text
	 * @returns Truncated title
	 * @private
	 */
	private extractTaskTitle(description: string): string {
		// Extract first sentence or first N words as title
		const firstSentence = description.split(".")[0];
		return (
			firstSentence.slice(0, 50) + (firstSentence.length > 50 ? "..." : "")
		);
	}
}
