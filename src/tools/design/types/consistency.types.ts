// Cross-session consistency enforcement type definitions

import type { Artifact } from "./artifact.types.js";
import type {
	ConstraintConsistencyViolation,
	ConstraintDecision,
	ConstraintEnforcementHistory,
	ConstraintRule,
} from "./constraint.types.js";
import type { DesignSessionState } from "./session.types.js";

export interface CrossSessionConstraintHistory {
	constraintId: string;
	sessionId: string;
	timestamp: string;
	phase: string;
	decision: ConstraintDecision;
	rationale: string;
	context: string;
	space7Reference?: string;
}

export interface CrossSessionConsistencyReport {
	sessionId: string;
	timestamp: string;
	overallConsistency: number; // 0-100
	constraintConsistency: Record<string, ConsistencyResult>;
	phaseConsistency: Record<string, ConsistencyResult>;
	violations: ConsistencyViolation[];
	recommendations: ConsistencyRecommendation[];
	historicalPatterns: HistoricalPattern[];
	space7Alignment: number; // 0-100
}

export interface ConsistencyResult {
	consistent: boolean;
	score: number; // 0-100
	historicalUsage: number;
	currentUsage: number;
	deviation: number;
	trend: "improving" | "stable" | "declining";
}

export interface ConsistencyViolation {
	type:
		| "constraint_inconsistency"
		| "phase_coverage"
		| "space7_deviation"
		| "pattern_break";
	severity: "critical" | "warning" | "info";
	constraintId?: string;
	phaseId?: string;
	description: string;
	historicalExample: string;
	currentExample: string;
	recommendedAction: string;
	space7Reference?: string;
}

export interface ConsistencyRecommendation {
	type: "alignment" | "pattern" | "coverage" | "documentation";
	priority: "high" | "medium" | "low";
	title: string;
	description: string;
	actionItems: string[];
	expectedImpact: string;
	estimatedEffort: "minimal" | "moderate" | "significant";
}

export interface HistoricalPattern {
	patternId: string;
	type:
		| "constraint_usage"
		| "phase_progression"
		| "coverage_trend"
		| "decision_pattern";
	frequency: number;
	confidence: number; // 0-100
	description: string;
	sessions: string[];
	lastSeen: string;
	recommendation: string;
}

export interface CrossSessionEnforcementConfig {
	enabled: boolean;
	minSessionsForPattern: number;
	consistencyThreshold: number; // 0-100
	space7ComplianceLevel: "strict" | "moderate" | "lenient";
	autoApplyPatterns: boolean;
	generateDocumentation: boolean;
	trackRationale: boolean;
	enforcePhaseSequence: boolean;
}

export interface EnforcementPrompt {
	type:
		| "consistency_check"
		| "pattern_confirmation"
		| "space7_alignment"
		| "rationale_request";
	severity: "critical" | "warning" | "info";
	title: string;
	message: string;
	options: EnforcementOption[];
	context: string;
	historicalData?: string;
	space7Reference?: string;
}

export interface EnforcementOption {
	id: string;
	label: string;
	description: string;
	impact: "breaking" | "moderate" | "minimal";
	consequences: string[];
	recommended: boolean;
	decision?: string;
	rationale?: string;
	enforcement?: boolean;
	violation?: string;
	resolution?: string;
	context?: string;
}

export interface CrossSessionValidationResult {
	passed: boolean;
	consistencyScore: number;
	violations: ConstraintConsistencyViolation[];
	recommendations: string[];
	enforcementActions: EnforcementAction[];
	historicalContext: ConstraintEnforcementHistory[];
}

export interface EnforcementAction {
	id: string;
	type: "prompt_for_clarification" | "auto_align" | "generate_adr" | "escalate";
	constraintId: string;
	description: string;
	interactive: boolean;
	prompt?: string;
	expectedOutcome?: string;
}

export interface ConsistencyEnforcementRequest {
	sessionState: DesignSessionState;
	constraintId?: string;
	phaseId?: string;
	context?: string;
	strictMode?: boolean;
}

export interface ConsistencyEnforcementResult {
	success: boolean;
	consistencyScore: number;
	enforcementActions: EnforcementAction[];
	generatedArtifacts: Artifact[];
	interactivePrompts: string[];
	recommendations: string[];
	historicalAlignments: string[];
}
