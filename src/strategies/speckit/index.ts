/**
 * Spec-Kit Module
 *
 * Exports for the Spec-Kit methodology implementation.
 *
 * @module strategies/speckit
 * @see {@link https://github.com/Anselmoo/mcp-ai-agent-guidelines/blob/development/plan-v0.13.x/specs/SPEC-005-speckit-integration.md SPEC-005}
 */

// Constitution Parser
export { parseConstitution } from "./constitution-parser.js";
// Progress Tracker
export {
	createProgressTracker,
	type GitCommit,
	type GitSyncOptions,
	ProgressTracker,
	type TaskProgressUpdate,
	type TaskStatus,
} from "./progress-tracker.js";

// Spec Parser
export { parseSpecFromMarkdown } from "./spec-parser.js";
// Spec Validator
export {
	createSpecValidator,
	SpecValidator,
} from "./spec-validator.js";
export { SpecKitStrategy as SpecKitBaseStrategy } from "./speckit-strategy.js";
// Tasks Parser
export { parseTasksFromMarkdown } from "./tasks-parser.js";
// Types
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
	ProgressMetrics,
	ProgressUpdate,
	Requirement,
	Risk,
	SpecContent,
	SpecKitArtifacts,
	Tasks,
	TimelineEntry,
	ValidationIssue,
	ValidationReport,
	ValidationResult,
	ValidationSeverity,
} from "./types.js";
