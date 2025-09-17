// Design Assistant Framework - Main entry point

export { adrGenerator } from "./adr-generator.js";
// Export enhanced confirmation types
export type {
	AlternativeAnalysis,
	ConfirmationRationale,
	DecisionRecord,
	EnhancedConfirmationResult,
	RiskAssessment,
} from "./confirmation-module.js";
export { confirmationModule } from "./confirmation-module.js";
// Export new prompt builder types
export type {
	ConfirmationPrompt,
	ConfirmationPromptRequest,
	ConfirmationPromptSection,
	RationaleQuestion,
	ValidationCheckpoint,
} from "./confirmation-prompt-builder.js";
export { confirmationPromptBuilder } from "./confirmation-prompt-builder.js";
export { constraintConsistencyEnforcer } from "./constraint-consistency-enforcer.js";
export { constraintManager } from "./constraint-manager.js";
export { coverageEnforcer } from "./coverage-enforcer.js";
export type { DesignAssistantRequest } from "./design-assistant.js";
export { designAssistant } from "./design-assistant.js";
export { designPhaseWorkflow } from "./design-phase-workflow.js";
export { methodologySelector } from "./methodology-selector.js";
export { pivotModule } from "./pivot-module.js";
export { roadmapGenerator } from "./roadmap-generator.js";
export { specGenerator } from "./spec-generator.js";
export { strategicPivotPromptBuilder } from "./strategic-pivot-prompt-builder.js";
// Export types
export type {
	Artifact,
	ConfirmationResult,
	ConsistencyEnforcementRequest,
	ConsistencyEnforcementResult,
	ConstraintConsistencyViolation,
	ConstraintEnforcementHistory,
	ConstraintRule,
	CoverageReport,
	CrossSessionValidationResult,
	DesignPhase,
	DesignSessionConfig,
	DesignSessionState,
	EnforcementAction,
	MethodologyProfile,
	MethodologySelection,
	MethodologySignals,
	PivotDecision,
	PivotGuidance,
	PivotImpact,
	StrategicPivotPromptRequest,
	StrategicPivotPromptResult,
} from "./types.js";
