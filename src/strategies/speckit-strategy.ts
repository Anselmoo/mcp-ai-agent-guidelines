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
import { validationError } from "../tools/shared/error-factory.js";
import type {
	OutputArtifacts,
	OutputDocument,
	OutputStrategy,
	RenderOptions,
} from "./output-strategy.js";
import { OutputApproach } from "./output-strategy.js";
import {
	createSpecValidator,
	type SpecValidator,
} from "./speckit/spec-validator.js";
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
	Progress,
	Requirement,
	Risk,
	SpecContent,
	TimelineEntry,
	ValidationResult,
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

	/** Whether to fail rendering if validation produces errors */
	failOnValidationErrors?: boolean;
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

	/** Optional validator for spec validation */
	private validator?: SpecValidator;

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

		// Initialize validator if constitution provided
		if (options?.constitution) {
			this.validator = createSpecValidator(options.constitution);
		}

		// Prepare spec content for validation
		const specContent = this.extractSpecContent(result);

		// Validate before rendering if requested
		let validationResult: ValidationResult | undefined;
		if (options?.validateBeforeRender && this.validator) {
			validationResult = this.validator.validate(specContent);

			// Fail if errors and failOnValidationErrors is true
			if (options.failOnValidationErrors && !validationResult.valid) {
				throw validationError("Spec validation failed", {
					issues: validationResult.issues,
					score: validationResult.score,
				});
			}
		}

		const title = this.extractTitle(result);
		const slug = this.slugify(title);

		return {
			primary: this.generateReadme(result, slug),
			secondary: [
				this.generateSpec(result, slug, options, validationResult),
				this.renderPlan(result, slug),
				this.generateTasks(result, slug),
				this.renderProgress(result, slug),
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
- [progress.md](./progress.md) - Progress tracking and status updates
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
	 * @param validationResult - Optional validation result to include
	 * @returns Specification document with requirements and constraints
	 * @private
	 */
	private generateSpec(
		result: SessionState,
		slug: string,
		options?: SpecKitRenderOptions,
		validationResult?: ValidationResult,
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

${outOfScope}${validationResult ? `\n${this.renderValidationSection(validationResult)}` : ""}

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
		// Check if we can derive tasks from a spec (has requirements or acceptance criteria)
		const hasSpecData =
			(result.config?.requirements &&
				Array.isArray(result.config.requirements) &&
				result.config.requirements.length > 0) ||
			(result.context?.requirements &&
				Array.isArray(result.context.requirements) &&
				(result.context.requirements as unknown[]).length > 0) ||
			(result.context?.acceptanceCriteria &&
				Array.isArray(result.context.acceptanceCriteria) &&
				(result.context.acceptanceCriteria as unknown[]).length > 0);

		if (hasSpecData) {
			// Use the new enhanced renderTasks method
			try {
				const spec = this.extractSpec(result);
				return this.renderTasks(result, slug, spec);
			} catch (error) {
				// Fallback to simple task list generation if extraction fails,
				// but surface the underlying problem in non-production environments
				if (
					typeof process !== "undefined" &&
					process.env?.NODE_ENV !== "production"
				) {
					// eslint-disable-next-line no-console -- Safe debug logging for unexpected errors
					console.error(
						"SpecKitStrategy.generateTasks: enhanced task rendering failed, falling back to basic generation.",
						error,
					);
				}
			}
		}

		// Fallback to simple task list generation (backward compatible)
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
	 * Extract ParsedSpec from SessionState.
	 *
	 * Transforms SessionState data into a ParsedSpec structure
	 * for task derivation.
	 *
	 * @param result - The session state
	 * @returns ParsedSpec object
	 * @private
	 */
	private extractSpec(result: SessionState): ParsedSpec {
		const title = this.extractTitle(result);
		const overview = this.extractOverview(result);

		// Extract functional requirements
		const functionalReqs: Requirement[] = [];
		if (
			result.config?.requirements &&
			Array.isArray(result.config.requirements)
		) {
			functionalReqs.push(
				...result.config.requirements.map((req, i) => ({
					id: `REQ-${String(i + 1).padStart(3, "0")}`,
					description: req,
					priority: "high" as const,
				})),
			);
		} else if (
			result.context?.requirements &&
			Array.isArray(result.context.requirements)
		) {
			functionalReqs.push(
				...(result.context.requirements as string[]).map((req, i) => ({
					id: `REQ-${String(i + 1).padStart(3, "0")}`,
					description: req,
					priority: "high" as const,
				})),
			);
		}

		// Extract non-functional requirements
		const nonFunctionalReqs: Requirement[] = [];
		if (
			result.context?.nonFunctionalRequirements &&
			Array.isArray(result.context.nonFunctionalRequirements)
		) {
			nonFunctionalReqs.push(
				...(result.context.nonFunctionalRequirements as string[]).map(
					(req, i) => ({
						id: `NFR-${String(i + 1).padStart(3, "0")}`,
						description: req,
						priority: "medium" as const,
					}),
				),
			);
		}

		// Extract acceptance criteria
		const acceptanceCriteria: AcceptanceCriterion[] = [];
		if (
			result.context?.acceptanceCriteria &&
			Array.isArray(result.context.acceptanceCriteria)
		) {
			acceptanceCriteria.push(
				...(result.context.acceptanceCriteria as string[]).map((ac, i) => ({
					id: `AC-${String(i + 1).padStart(3, "0")}`,
					description: ac,
					verificationMethod: "automated" as const,
				})),
			);
		} else if (
			result.context?.successCriteria &&
			Array.isArray(result.context.successCriteria)
		) {
			acceptanceCriteria.push(
				...(result.context.successCriteria as string[]).map((ac, i) => ({
					id: `AC-${String(i + 1).padStart(3, "0")}`,
					description: ac,
					verificationMethod: "automated" as const,
				})),
			);
		}

		return {
			title,
			overview,
			objectives: [],
			functionalRequirements: functionalReqs,
			nonFunctionalRequirements: nonFunctionalReqs,
			constraints: this.extractConstraintReferences(result),
			acceptanceCriteria,
			outOfScope: (result.context?.outOfScope as string[]) ?? [],
		};
	}

	/**
	 * Render tasks.md with enhanced structure.
	 *
	 * Creates a comprehensive tasks document with grouped tasks,
	 * dependency graph, and priority sections.
	 *
	 * @param result - The session state
	 * @param slug - The slugified folder name
	 * @param spec - Optional parsed spec (if available)
	 * @returns OutputDocument for tasks.md
	 * @private
	 */
	private renderTasks(
		result: SessionState,
		slug: string,
		spec?: ParsedSpec,
	): OutputDocument {
		let tasks: DerivedTask[];

		if (spec) {
			tasks = this.deriveTasksFromSpec(spec);
		} else {
			// Fallback: create basic tasks from context
			tasks = [];
			if (result.context?.tasks && Array.isArray(result.context.tasks)) {
				tasks = (result.context.tasks as Array<{ title: string }>).map(
					(t, i) => ({
						id: `T${String(i + 1).padStart(3, "0")}`,
						title: t.title,
						description: "",
						priority: "medium" as const,
						estimate: "3h",
						acceptanceCriteria: [],
					}),
				);
			}
		}

		const groupedTasks = this.groupTasksByPhase(tasks);
		const totalEstimate =
			tasks.length > 0
				? this.calculateTotalEstimate(tasks)
				: "To be determined";

		// Filter out empty phases to keep output clean
		const nonEmptyPhases = Object.entries(groupedTasks).filter(
			([, phaseTasks]) => phaseTasks.length > 0,
		);

		const content = `# Tasks

## Overview

**Total Tasks**: ${tasks.length}
**Estimated Effort**: ${totalEstimate}

## Task List

${
	nonEmptyPhases.length > 0
		? nonEmptyPhases
				.map(
					([phase, phaseTasks]) => `### ${phase}

${phaseTasks
	.map(
		(t) => `#### ${t.id}: ${t.title}

- **Priority**: ${t.priority}
- **Estimate**: ${t.estimate}
${t.dependencies?.length ? `- **Dependencies**: ${t.dependencies.join(", ")}` : ""}

${t.description}

**Acceptance Criteria**:
${t.acceptanceCriteria.map((ac) => `- [ ] ${ac}`).join("\n")}

---
`,
	)
	.join("\n")}`,
				)
				.join("\n")
		: "No tasks defined yet.\n"
}

## Dependencies Graph

\`\`\`mermaid
${this.generateDependencyGraph(tasks)}
\`\`\`${tasks.length === 0 ? "\n\n*No tasks defined*" : ""}

## By Priority

### High Priority
${
	tasks
		.filter((t) => t.priority === "high")
		.map((t) => `- [ ] ${t.id}: ${t.title}`)
		.join("\n") || "None"
}

### Medium Priority
${
	tasks
		.filter((t) => t.priority === "medium")
		.map((t) => `- [ ] ${t.id}: ${t.title}`)
		.join("\n") || "None"
}

### Low Priority
${
	tasks
		.filter((t) => t.priority === "low")
		.map((t) => `- [ ] ${t.id}: ${t.title}`)
		.join("\n") || "None"
}

---
*Generated by SpecKitStrategy*
`;

		return {
			name: `${slug}/tasks.md`,
			content,
			format: "markdown",
		};
	}

	/**
	 * Group tasks by phase.
	 *
	 * Organizes tasks into phase buckets, defaulting to "Unassigned"
	 * for tasks without a phase.
	 *
	 * @param tasks - Array of derived tasks
	 * @returns Tasks grouped by phase
	 * @private
	 */
	private groupTasksByPhase(
		tasks: DerivedTask[],
	): Record<string, DerivedTask[]> {
		const grouped: Record<string, DerivedTask[]> = {
			"Phase 1": [],
			"Phase 2": [],
			Unassigned: [],
		};

		for (const task of tasks) {
			const phase = task.phase ?? "Unassigned";
			if (!grouped[phase]) grouped[phase] = [];
			grouped[phase].push(task);
		}

		return grouped;
	}

	/**
	 * Generate Mermaid dependency graph.
	 *
	 * Creates a Mermaid graph showing task dependencies.
	 *
	 * @param tasks - Array of derived tasks
	 * @returns Mermaid graph definition
	 * @private
	 */
	private generateDependencyGraph(tasks: DerivedTask[]): string {
		const lines = ["graph TD"];

		for (const task of tasks) {
			if (task.dependencies?.length) {
				for (const dep of task.dependencies) {
					lines.push(`    ${dep} --> ${task.id}`);
				}
			} else {
				lines.push(`    ${task.id}[${task.id}]`);
			}
		}

		return lines.join("\n");
	}

	/**
	 * Calculate total estimate from tasks.
	 *
	 * Sums task estimates (in hours) and converts to days.
	 * Note: Only parses estimates in "Xh" format (e.g., "3h", "8h").
	 * Other formats like "1d", "2 days", or "1 week" are not supported
	 * and will be ignored in the calculation.
	 *
	 * @param tasks - Array of derived tasks
	 * @returns Total estimate string (e.g., "24h (~3 days)")
	 * @private
	 */
	private calculateTotalEstimate(tasks: DerivedTask[]): string {
		let totalHours = 0;

		for (const task of tasks) {
			const match = task.estimate.match(/(\d+)h/);
			if (match) {
				totalHours += Number.parseInt(match[1], 10);
			}
		}

		const totalDays = Math.ceil(totalHours / 8);
		const dayLabel = totalDays === 1 ? "day" : "days";

		return `${totalHours}h (~${totalDays} ${dayLabel})`;
	}

	/**
	 * Derive actionable tasks from a parsed specification.
	 *
	 * Transforms requirements and acceptance criteria into concrete,
	 * estimable tasks with verification tasks for each requirement.
	 *
	 * @param spec - The parsed specification
	 * @returns Array of derived tasks with IDs, estimates, and dependencies
	 * @throws {Error} If spec structure is invalid
	 * @private
	 */
	private deriveTasksFromSpec(spec: ParsedSpec): DerivedTask[] {
		// Validate spec structure
		if (!spec || typeof spec !== "object") {
			throw new Error("Invalid spec: spec must be an object");
		}

		if (!Array.isArray(spec.functionalRequirements)) {
			throw new Error("Invalid spec: functionalRequirements must be an array");
		}

		if (!Array.isArray(spec.acceptanceCriteria)) {
			throw new Error("Invalid spec: acceptanceCriteria must be an array");
		}

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
	 * suitable for task titles. Strips common action verbs
	 * (Implement, Create, Add, Build, etc.) to avoid redundancy
	 * when used with prefixes like "Implement:" or "Verify:".
	 *
	 * @param description - Full description text
	 * @returns Truncated title without action verb prefix
	 * @private
	 */
	private extractTaskTitle(description: string): string {
		const trimmed = description.trim();

		if (!trimmed) {
			return "Untitled task";
		}

		// Extract first sentence (or similar segment) as title
		const firstSegment = trimmed.split(/[.!?]/)[0]?.trim() ?? "";

		if (!firstSegment) {
			return "Untitled task";
		}

		// Strip common action verbs to avoid redundancy like "Implement: Implement..."
		const actionVerbs = [
			"implement",
			"create",
			"add",
			"build",
			"develop",
			"write",
			"update",
			"modify",
			"refactor",
			"fix",
			"remove",
			"delete",
		];

		let cleanedSegment = firstSegment;
		for (const verb of actionVerbs) {
			// Match verb at start of string (case insensitive) followed by space
			const pattern = new RegExp(`^${verb}\\s+`, "i");
			if (pattern.test(cleanedSegment)) {
				cleanedSegment = cleanedSegment.replace(pattern, "");
				break; // Only strip the first matching verb
			}
		}

		// Ensure first character is lowercase unless it's an acronym
		if (
			cleanedSegment.length > 0 &&
			cleanedSegment[0] === cleanedSegment[0].toUpperCase()
		) {
			// Check if it's likely an acronym (next char is also uppercase)
			if (
				cleanedSegment.length === 1 ||
				cleanedSegment[1] !== cleanedSegment[1].toUpperCase()
			) {
				cleanedSegment =
					cleanedSegment[0].toLowerCase() + cleanedSegment.slice(1);
			}
		}

		return cleanedSegment.length > 50
			? `${cleanedSegment.slice(0, 50)}...`
			: cleanedSegment;
	}

	/**
	 * Render progress.md document with progress tracking.
	 *
	 * Creates a progress tracking document with status indicators,
	 * completion metrics, progress bar, recent updates, blockers,
	 * and next steps.
	 *
	 * @param result - The session state
	 * @param slug - The slugified folder name
	 * @returns OutputDocument for progress.md
	 * @private
	 */
	private renderProgress(result: SessionState, slug: string): OutputDocument {
		const progress = this.extractProgress(result);

		const statusEmoji = {
			"on-track": "🟢",
			"at-risk": "🟡",
			blocked: "🔴",
			completed: "✅",
		};

		// Format status consistently: uppercase with spaces instead of hyphens
		const formattedStatus = progress.status.toUpperCase().replace(/-/g, " ");

		// Cap completion percentage at 100 to prevent progress bar overflow
		const cappedPercentage = Math.min(progress.completionPercentage, 100);
		const filledBlocks = Math.floor(cappedPercentage / 5);
		const emptyBlocks = 20 - filledBlocks;

		const content = `# Progress

## Status: ${statusEmoji[progress.status]} ${formattedStatus}

**Last Updated**: ${progress.lastUpdated.toISOString().split("T")[0]}

## Summary

| Metric | Value |
|--------|-------|
| Completion | ${cappedPercentage}% |
| Tasks Completed | ${progress.tasksCompleted}/${progress.totalTasks} |
| Status | ${formattedStatus} |

## Progress Bar

\`\`\`
[${"█".repeat(filledBlocks)}${"░".repeat(emptyBlocks)}] ${cappedPercentage}%
\`\`\`

## Recent Updates

${progress.recentUpdates
	.map(
		(u) => `### ${u.date.toISOString().split("T")[0]}

${u.description}

**Tasks Completed**:
${u.tasksCompleted.length > 0 ? u.tasksCompleted.map((t) => `- ${t}`).join("\n") : "- None"}
`,
	)
	.join("\n")}

${
	progress.blockers.length > 0
		? `## Blockers

${progress.blockers
	.map(
		(b) => `### ${b.id}: ${b.description}

- **Severity**: ${b.severity}
- **Owner**: ${b.owner ?? "Unassigned"}
`,
	)
	.join("\n")}`
		: ""
}

## Next Steps

${progress.nextSteps.map((step, i) => `${i + 1}. ${step}`).join("\n")}

---
*Generated by SpecKitStrategy*
`;

		return {
			name: `${slug}/progress.md`,
			content,
			format: "markdown",
		};
	}

	/**
	 * Extract progress data from SessionState.
	 *
	 * Initializes a Progress object with default values for a new spec.
	 * Derives total tasks from the spec's requirements and acceptance criteria.
	 *
	 * @param result - The session state
	 * @returns Progress object with default values
	 * @private
	 */
	private extractProgress(result: SessionState): Progress {
		// Try to derive total tasks from spec, fallback to 0 if extraction fails
		let totalTasks = 0;
		try {
			totalTasks = this.deriveTasksFromSpec(this.extractSpec(result)).length;
		} catch {
			// Spec extraction failed, use default value of 0
			totalTasks = 0;
		}

		// Initialize with default values for new spec
		return {
			status: "on-track",
			completionPercentage: 0,
			tasksCompleted: 0,
			totalTasks,
			recentUpdates: [
				{
					date: new Date(),
					description: "Spec-Kit initialized",
					tasksCompleted: [],
				},
			],
			blockers: [],
			nextSteps: [
				"Review spec.md for completeness",
				"Assign tasks to team members",
				"Begin Phase 1 implementation",
			],
			lastUpdated: new Date(),
		};
	}

	/**
	 * Extract spec content for validation.
	 *
	 * Prepares SpecContent from SessionState for validation against
	 * constitutional constraints.
	 *
	 * @param result - The session state
	 * @returns SpecContent object ready for validation
	 * @private
	 */
	private extractSpecContent(result: SessionState): SpecContent {
		const title = this.extractTitle(result);
		const overview = this.extractOverview(result);

		// Extract objectives
		const objectives: { description: string; priority?: string }[] = [];
		if (
			result.context?.objectives &&
			Array.isArray(result.context.objectives)
		) {
			objectives.push(
				...(result.context.objectives as string[]).map((obj) => ({
					description: obj,
					priority: "medium",
				})),
			);
		}

		// Extract requirements
		const requirements: { description: string; type?: string }[] = [];
		if (
			result.config?.requirements &&
			Array.isArray(result.config.requirements)
		) {
			requirements.push(
				...result.config.requirements.map((req) => ({
					description: req,
					type: "functional",
				})),
			);
		} else if (
			result.context?.requirements &&
			Array.isArray(result.context.requirements)
		) {
			requirements.push(
				...(result.context.requirements as string[]).map((req) => ({
					description: req,
					type: "functional",
				})),
			);
		}

		// Add non-functional requirements
		if (
			result.context?.nonFunctionalRequirements &&
			Array.isArray(result.context.nonFunctionalRequirements)
		) {
			requirements.push(
				...(result.context.nonFunctionalRequirements as string[]).map(
					(req) => ({
						description: req,
						type: "non-functional",
					}),
				),
			);
		}

		// Extract acceptance criteria
		const acceptanceCriteria: string[] = [];
		if (
			result.context?.acceptanceCriteria &&
			Array.isArray(result.context.acceptanceCriteria)
		) {
			acceptanceCriteria.push(
				...(result.context.acceptanceCriteria as string[]),
			);
		} else if (
			result.context?.successCriteria &&
			Array.isArray(result.context.successCriteria)
		) {
			acceptanceCriteria.push(...(result.context.successCriteria as string[]));
		}

		return {
			title,
			overview,
			objectives,
			requirements,
			acceptanceCriteria,
		};
	}

	/**
	 * Render validation results section.
	 *
	 * Formats validation results into a markdown section showing
	 * score, constraints checked, and any issues found.
	 *
	 * @param result - The validation result
	 * @returns Formatted validation section
	 * @private
	 */
	private renderValidationSection(result: ValidationResult): string {
		const sections: string[] = [];

		sections.push("\n---\n\n## ⚠️ Validation Results\n");
		sections.push(`**Score**: ${result.score}/100\n`);
		sections.push(`**Constraints Checked**: ${result.checkedConstraints}\n`);
		sections.push(`**Constraints Passed**: ${result.passedConstraints}\n\n`);

		if (result.issues.length > 0) {
			sections.push("### Issues Found\n\n");

			const errors = result.issues.filter((i) => i.severity === "error");
			const warnings = result.issues.filter((i) => i.severity === "warning");
			const infos = result.issues.filter((i) => i.severity === "info");

			if (errors.length > 0) {
				sections.push("#### ❌ Errors\n");
				for (const e of errors) {
					sections.push(`- **${e.code}**: ${e.message}\n`);
					if (e.suggestion)
						sections.push(`  - *Suggestion*: ${e.suggestion}\n`);
				}
			}

			if (warnings.length > 0) {
				sections.push("\n#### ⚠️ Warnings\n");
				for (const w of warnings) {
					sections.push(`- **${w.code}**: ${w.message}\n`);
				}
			}

			if (infos.length > 0) {
				sections.push("\n#### ℹ️ Info\n");
				for (const i of infos) {
					sections.push(`- **${i.code}**: ${i.message}\n`);
				}
			}
		} else {
			sections.push("✅ No validation issues found.\n");
		}

		return sections.join("");
	}
}
