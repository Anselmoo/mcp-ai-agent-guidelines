// Constraint-related type definitions

import type { ConstraintType } from "./common.types.js";

export interface ConstraintRule {
	id: string;
	name: string;
	type: ConstraintType;
	category: string;
	description: string;
	validation: ValidationRule;
	weight: number;
	mandatory: boolean;
	source: string; // e.g., "Space 7", "ARCHITECTURE_TEMPLATES.md"
}

export interface ValidationRule {
	schema?: Record<string, unknown>;
	keywords?: string[];
	minCoverage?: number;
	customValidator?: string;
}

export interface ConstraintSatisfactionResult {
	passed: boolean;
	violations: number;
	warnings: number;
}

export interface ConstraintDecision {
	action: "applied" | "skipped" | "modified" | "rejected";
	originalRule: ConstraintRule;
	modifiedRule?: Partial<ConstraintRule>;
	coverage: number;
	violations: string[];
	justification: string;
}

export interface ConstraintEnforcementHistory {
	constraintId: string;
	sessionId: string;
	timestamp: string;
	phase: string;
	decision: string;
	rationale: string;
	enforcement: boolean;
	violation?: string;
	resolution?: string;
	context: string;
}

export interface ConstraintConsistencyViolation {
	constraintId: string;
	currentSessionId: string;
	conflictingSessionId: string;
	violationType:
		| "decision_conflict"
		| "rationale_inconsistency"
		| "enforcement_mismatch";
	description: string;
	severity: "critical" | "warning" | "info";
	suggestedResolution: string;
}
