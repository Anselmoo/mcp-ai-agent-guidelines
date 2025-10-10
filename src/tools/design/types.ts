/**
 * @deprecated This file is deprecated. Import types from `./types/index.js` instead.
 *
 * This file now re-exports all types from the modular types directory for backward compatibility.
 * The types have been reorganized into domain-specific files for better maintainability:
 *
 * - `./types/common.types.ts` - Common types (PhaseStatus, ConstraintType, etc.)
 * - `./types/session.types.ts` - Session and state management types
 * - `./types/constraint.types.ts` - Constraint-related types
 * - `./types/coverage.types.ts` - Coverage and validation types
 * - `./types/artifact.types.ts` - Artifact-related types
 * - `./types/methodology.types.ts` - Methodology selection types
 * - `./types/pivot.types.ts` - Strategic pivot types
 * - `./types/consistency.types.ts` - Cross-session consistency types
 *
 * Please update your imports to use `./types/index.js` directly.
 */

// Re-export all types from the modular types directory for backward compatibility
export type {
	// Artifact types
	Artifact,
	ArtifactQualityResult,
	ArtifactType,
	ComplianceReport,
	ConfirmationReport,
	ConfirmationResult,
	ConsistencyEnforcementRequest,
	ConsistencyEnforcementResult,
	ConsistencyRecommendation,
	ConsistencyResult,
	ConsistencyViolation,
	ConstraintConsistencyViolation,
	ConstraintDecision,
	ConstraintEnforcementHistory,
	// Constraint types
	ConstraintRule,
	ConstraintSatisfactionResult,
	ConstraintType,
	CoverageCheckResult,
	CoverageGap,
	// Coverage types
	CoverageReport,
	CrossSessionConsistencyReport,
	// Consistency types
	CrossSessionConstraintHistory,
	CrossSessionEnforcementConfig,
	CrossSessionValidationResult,
	DesignPhase,
	// Session types
	DesignSessionConfig,
	DesignSessionState,
	DetailedCoverage,
	EnforcementAction,
	EnforcementOption,
	EnforcementPrompt,
	EventType,
	HistoricalPattern,
	MethodologyCandidate,
	MethodologyProfile,
	MethodologySelection,
	// Methodology types
	MethodologySignals,
	Milestone,
	OutputFormat,
	// Common types
	PhaseStatus,
	// Pivot types
	PivotDecision,
	PivotGuidance,
	PivotImpact,
	ProblemFraming,
	ProjectType,
	RiskLevel,
	SessionEvent,
	SessionStatus,
	SessionValidationResult,
	StakeholderMode,
	StrategicPivotPromptRequest,
	StrategicPivotPromptResult,
	TimelinePressure,
	ValidationRule,
} from "./types/index.js";
