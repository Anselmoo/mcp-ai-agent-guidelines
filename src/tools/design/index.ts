// Design Assistant Framework - Main entry point
export { designAssistant } from './design-assistant.js';
export { designPhaseWorkflow } from './design-phase-workflow.js';
export { confirmationModule } from './confirmation-module.js';
export { pivotModule } from './pivot-module.js';
export { constraintManager } from './constraint-manager.js';
export { coverageEnforcer } from './coverage-enforcer.js';
export { adrGenerator } from './adr-generator.js';
export { specGenerator } from './spec-generator.js';
export { roadmapGenerator } from './roadmap-generator.js';

// Export types
export type {
	DesignSessionConfig,
	DesignPhase,
	ConstraintRule,
	CoverageReport,
	ConfirmationResult,
	PivotDecision,
	Artifact,
	DesignSessionState,
} from './types.js';