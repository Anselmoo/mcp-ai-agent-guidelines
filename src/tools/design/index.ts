// Design Assistant Framework - Main entry point

export {
	adrGenerator,
	IMPLEMENTATION_STATUS as ADR_GENERATOR_STATUS,
} from "./adr-generator.js";
// Export enhanced confirmation types
export type {
	AlternativeAnalysis,
	ConfirmationRationale,
	DecisionRecord,
	EnhancedConfirmationResult,
	RiskAssessment,
} from "./confirmation-module.js";
export {
	confirmationModule,
	IMPLEMENTATION_STATUS as CONFIRMATION_MODULE_STATUS,
} from "./confirmation-module.js";
// Export new prompt builder types
export type {
	ConfirmationPrompt,
	ConfirmationPromptRequest,
	ConfirmationPromptSection,
	RationaleQuestion,
	ValidationCheckpoint,
} from "./confirmation-prompt-builder.js";
export {
	confirmationPromptBuilder,
	IMPLEMENTATION_STATUS as CONFIRMATION_PROMPT_BUILDER_STATUS,
} from "./confirmation-prompt-builder.js";
export {
	constraintConsistencyEnforcer,
	IMPLEMENTATION_STATUS as CONSTRAINT_CONSISTENCY_ENFORCER_STATUS,
} from "./constraint-consistency-enforcer.js";
export {
	constraintManager,
	IMPLEMENTATION_STATUS as CONSTRAINT_MANAGER_STATUS,
} from "./constraint-manager.js";
export {
	coverageEnforcer,
	IMPLEMENTATION_STATUS as COVERAGE_ENFORCER_STATUS,
} from "./coverage-enforcer.js";
export {
	crossSessionConsistencyEnforcer,
	IMPLEMENTATION_STATUS as CROSS_SESSION_CONSISTENCY_ENFORCER_STATUS,
} from "./cross-session-consistency-enforcer.js";
export type { DesignAssistantRequest } from "./design-assistant.js";
export {
	designAssistant,
	IMPLEMENTATION_STATUS as DESIGN_ASSISTANT_STATUS,
} from "./design-assistant.js";
export {
	designPhaseWorkflow,
	IMPLEMENTATION_STATUS as DESIGN_PHASE_WORKFLOW_STATUS,
} from "./design-phase-workflow.js";
export {
	IMPLEMENTATION_STATUS as METHODOLOGY_SELECTOR_STATUS,
	methodologySelector,
} from "./methodology-selector.js";
export {
	IMPLEMENTATION_STATUS as PIVOT_MODULE_STATUS,
	pivotModule,
} from "./pivot-module.js";
export {
	IMPLEMENTATION_STATUS as ROADMAP_GENERATOR_STATUS,
	roadmapGenerator,
} from "./roadmap-generator.js";
export {
	IMPLEMENTATION_STATUS as SPEC_GENERATOR_STATUS,
	specGenerator,
} from "./spec-generator.js";
export {
	IMPLEMENTATION_STATUS as STRATEGIC_PIVOT_PROMPT_BUILDER_STATUS,
	strategicPivotPromptBuilder,
} from "./strategic-pivot-prompt-builder.js";
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

// Module implementation status summary
export const DESIGN_MODULE_STATUS = {
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
