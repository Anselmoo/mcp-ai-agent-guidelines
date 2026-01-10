/**
 * Default agent definitions - barrel export and registration
 *
 * @module agents/definitions
 */

import { agentRegistry } from "../registry.js";
import { codeScorerAgent } from "./code-scorer-agent.js";
import { designAgent } from "./design-agent.js";
import { securityAgent } from "./security-agent.js";

/**
 * Array of all default agent definitions to be registered.
 */
export const defaultAgents = [codeScorerAgent, securityAgent, designAgent];

/**
 * Registers all default agents with the agent registry.
 * Should be called during server startup.
 */
export function registerDefaultAgents(): void {
	for (const agent of defaultAgents) {
		agentRegistry.registerAgent(agent);
	}
}

// Export individual agent definitions
export { codeScorerAgent } from "./code-scorer-agent.js";
export { designAgent } from "./design-agent.js";
export { securityAgent } from "./security-agent.js";
