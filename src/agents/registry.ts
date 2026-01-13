/**
 * AgentRegistry - Central registry for managing available agents
 *
 * @module agents/registry
 */

import { ErrorCode } from "../tools/shared/error-codes.js";
import { McpToolError } from "../tools/shared/errors.js";
import type { AgentDefinition, AgentInfo } from "./types.js";

/**
 * Registry for managing agent definitions and queries.
 * Maintains a catalog of available agents and supports capability-based lookups.
 */
export class AgentRegistry {
	private agents: Map<string, AgentDefinition> = new Map();

	/**
	 * Registers a new agent in the registry.
	 *
	 * @param agent - The agent definition to register
	 * @throws {McpToolError} If an agent with the same name is already registered
	 */
	registerAgent(agent: AgentDefinition): void {
		if (this.agents.has(agent.name)) {
			throw new McpToolError(
				ErrorCode.DOMAIN_ERROR,
				`Agent already registered: ${agent.name}`,
				{ agentName: agent.name },
			);
		}
		this.agents.set(agent.name, agent);
	}

	/**
	 * Retrieves an agent by name.
	 *
	 * @param name - The name of the agent to retrieve
	 * @returns The agent definition, or undefined if not found
	 */
	getAgent(name: string): AgentDefinition | undefined {
		return this.agents.get(name);
	}

	/**
	 * Queries for agents that have at least one of the specified capabilities.
	 *
	 * @param capabilities - Array of capabilities to search for
	 * @returns Array of agent definitions that match at least one capability
	 */
	queryByCapability(capabilities: string[]): AgentDefinition[] {
		return Array.from(this.agents.values()).filter((agent) =>
			capabilities.some((cap) => agent.capabilities.includes(cap)),
		);
	}

	/**
	 * Lists all registered agents as AgentInfo objects.
	 *
	 * @returns Array of agent information for all registered agents
	 */
	listAgents(): AgentInfo[] {
		return Array.from(this.agents.values()).map((agent) => ({
			name: agent.name,
			description: agent.description,
			capabilities: agent.capabilities,
			available: true,
		}));
	}

	/**
	 * Unregisters an agent by name.
	 *
	 * @param name - The name of the agent to unregister
	 * @returns true if the agent was unregistered, false if it was not found
	 */
	unregisterAgent(name: string): boolean {
		return this.agents.delete(name);
	}

	/**
	 * Clears all registered agents from the registry.
	 * Useful for testing or resetting the registry state.
	 */
	clear(): void {
		this.agents.clear();
	}
}

/**
 * Singleton instance of the AgentRegistry.
 * Use this export for global agent management.
 */
export const agentRegistry = new AgentRegistry();
