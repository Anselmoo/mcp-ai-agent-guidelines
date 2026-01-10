/**
 * Agent orchestration module - barrel export
 *
 * @module agents
 */

// Export orchestrator and singleton
export {
	AgentOrchestrator,
	agentOrchestrator,
	type StepResult,
	type Workflow,
	type WorkflowResult,
	type WorkflowStep,
} from "./orchestrator.js";
// Export registry and singleton
export { AgentRegistry, agentRegistry } from "./registry.js";

// Export types
export type {
	AgentDefinition,
	AgentInfo,
	HandoffRequest,
	HandoffResult,
} from "./types.js";

// Export workflows
export {
	codeReviewChainWorkflow,
	designToSpecWorkflow,
	getWorkflow,
	listWorkflows,
	workflows,
} from "./workflows/index.js";
