/**
 * Agent orchestration module - barrel export
 *
 * @module agents
 */

// Export registry and singleton
export { AgentRegistry, agentRegistry } from "./registry.js";

// Export types
export type {
	AgentDefinition,
	AgentInfo,
	HandoffRequest,
	HandoffResult,
} from "./types.js";
