// Common type definitions used across the Design Assistant Framework

import type { Artifact } from "./artifact.types.js";

export type PhaseStatus =
	| "pending"
	| "in-progress"
	| "completed"
	| "blocked"
	| "skipped";

export type ConstraintType =
	| "functional"
	| "non-functional"
	| "technical"
	| "business"
	| "compliance"
	| "architectural";

export type ArtifactType =
	| "adr"
	| "specification"
	| "roadmap"
	| "diagram"
	| "template"
	| "validation"
	| "coverage-report";

export type OutputFormat =
	| "markdown"
	| "mermaid"
	| "yaml"
	| "json"
	| "typescript"
	| "javascript";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type SessionStatus =
	| "initializing"
	| "active"
	| "paused"
	| "completed"
	| "aborted"
	| "pivoting";

export type EventType =
	| "phase-start"
	| "phase-complete"
	| "confirmation"
	| "pivot"
	| "constraint-violation"
	| "coverage-update"
	| "artifact-generated"
	| "methodology-selected"
	| "methodology-changed";

/**
 * Represents a single phase in the design workflow.
 * This interface was extracted from session.types.ts to break circular dependency
 * between session.types.ts and methodology.types.ts.
 */
export interface DesignPhase {
	id: string;
	name: string;
	description: string;
	inputs: string[];
	outputs: string[];
	criteria: string[];
	coverage: number;
	status: PhaseStatus;
	artifacts: Artifact[];
	dependencies: string[];
}
