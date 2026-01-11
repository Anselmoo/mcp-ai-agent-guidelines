/**
 * Spec-Kit Module - Barrel Exports
 *
 * Re-exports all Spec-Kit types and utilities.
 *
 * @module strategies/speckit
 * @see {@link https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-005-speckit-integration.md SPEC-005}
 */

// Export all types
export type {
	AcceptanceCriterion,
	ArchitectureRule,
	Blocker,
	Constitution,
	ConstitutionMetadata,
	Constraint,
	ConstraintReference,
	Dependency,
	DerivedTask,
	DesignPrinciple,
	Objective,
	ParsedSpec,
	Phase,
	Plan,
	Principle,
	Progress,
	ProgressUpdate,
	Requirement,
	Risk,
	SpecKitArtifacts,
	TimelineEntry,
} from "./types.js";
