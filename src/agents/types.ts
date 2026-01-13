/**
 * Type definitions for agent orchestration system
 *
 * @module agents/types
 */

/**
 * Definition of an agent in the registry.
 * Contains metadata about the agent's capabilities and how to invoke it.
 */
export interface AgentDefinition {
	/** Unique name identifier for the agent */
	name: string;

	/** Human-readable description of the agent's purpose */
	description: string;

	/** List of capabilities this agent provides */
	capabilities: string[];

	/** JSON schema for the agent's input */
	inputSchema: object;

	/** Optional JSON schema for the agent's output */
	outputSchema?: object;

	/** Name of the MCP tool backing this agent */
	toolName: string;
}

/**
 * Information about an agent returned in queries.
 * Lightweight version of AgentDefinition for listing purposes.
 */
export interface AgentInfo {
	/** Unique name identifier for the agent */
	name: string;

	/** Human-readable description of the agent's purpose */
	description: string;

	/** List of capabilities this agent provides */
	capabilities: string[];

	/** Whether the agent is currently available */
	available: boolean;
}

/**
 * Request to hand off work from one agent to another.
 */
export interface HandoffRequest {
	/** Name of the agent initiating the handoff (optional) */
	sourceAgent?: string;

	/** Name of the target agent to receive the handoff */
	targetAgent: string;

	/** Context data to pass to the target agent */
	context: unknown;

	/** Optional reason for the handoff */
	reason?: string;
}

/**
 * Result of executing a handoff to another agent.
 */
export interface HandoffResult {
	/** Whether the handoff was successful */
	success: boolean;

	/** Output from the target agent */
	output: unknown;

	/** Time in milliseconds it took to execute the handoff */
	executionTime: number;

	/** Error message if the handoff failed */
	error?: string;
}
