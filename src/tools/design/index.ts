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
export { crossSessionConsistencyEnforcer } from "./cross-session-consistency-enforcer.js";
export {
	DesignAssistantErrorCode,
	designErrorFactory,
	handleToolError,
} from "./design-assistant.errors.js";
export type { DesignAssistantRequest } from "./design-assistant.js";
export { designAssistant } from "./design-assistant.js";
export { designPhaseWorkflow } from "./design-phase-workflow.js";
export { methodologySelector } from "./methodology-selector.js";
export { pivotModule } from "./pivot-module.js";
export { roadmapGenerator } from "./roadmap-generator.js";
export { specGenerator } from "./spec-generator.js";
export { strategicPivotPromptBuilder } from "./strategic-pivot-prompt-builder.js";
// Export types from the modular types directory
export type {
	Artifact,
	ConfirmationResult,
	ConsistencyEnforcementRequest,
	ConsistencyEnforcementResult,
	ConsistencyRecommendation,
	ConsistencyResult,
	ConsistencyViolation,
	ConstraintConsistencyViolation,
	ConstraintDecision,
	ConstraintEnforcementHistory,
	ConstraintRule,
	CoverageReport,
	CrossSessionConsistencyReport,
	CrossSessionConstraintHistory,
	CrossSessionEnforcementConfig,
	CrossSessionValidationResult,
	DesignPhase,
	DesignSessionConfig,
	DesignSessionState,
	EnforcementAction,
	EnforcementOption,
	EnforcementPrompt,
	HistoricalPattern,
	MethodologyProfile,
	MethodologySelection,
	MethodologySignals,
	PivotDecision,
	PivotGuidance,
	PivotImpact,
	StrategicPivotPromptRequest,
	StrategicPivotPromptResult,
} from "./types/index.js";

/**
 * Consolidated implementation status for all design modules.
 *
 * This map provides a centralized view of module implementation status,
 * replacing individual IMPLEMENTATION_STATUS exports from each module.
 *
 * @example
 * ```typescript
 * import { DESIGN_MODULE_STATUSES } from './tools/design';
 * if (DESIGN_MODULE_STATUSES.adrGenerator === 'IMPLEMENTED') {
 *   // Use ADR generator
 * }
 * ```
 *
 * @stability stable - This export is part of the public API
 */
export const DESIGN_MODULE_STATUSES = {
	adrGenerator: "IMPLEMENTED",
	confirmationModule: "IMPLEMENTED",
	confirmationPromptBuilder: "IMPLEMENTED",
	constraintConsistencyEnforcer: "IMPLEMENTED",
	constraintManager: "IMPLEMENTED",
	coverageEnforcer: "IMPLEMENTED",
	crossSessionConsistencyEnforcer: "IMPLEMENTED",
	designAssistant: "IMPLEMENTED",
	designPhaseWorkflow: "IMPLEMENTED",
	methodologySelector: "IMPLEMENTED",
	pivotModule: "IMPLEMENTED",
	roadmapGenerator: "IMPLEMENTED",
	specGenerator: "IMPLEMENTED",
	strategicPivotPromptBuilder: "IMPLEMENTED",
} as const;
