/**
 * AgentOrchestrator - Manages agent handoffs and workflow execution
 *
 * @module agents/orchestrator
 */

import { agentRegistry } from "./registry.js";
import type { HandoffRequest, HandoffResult } from "./types.js";

/**
 * Definition of a workflow containing sequential agent steps.
 */
export interface Workflow {
	/** Unique name identifier for the workflow */
	name: string;

	/** Human-readable description of the workflow's purpose */
	description: string;

	/** Ordered sequence of agent steps to execute */
	steps: WorkflowStep[];
}

/**
 * A single step in a workflow execution.
 */
export interface WorkflowStep {
	/** Name of the agent to execute for this step */
	agent: string;

	/** Optional mapping to extract data from previous outputs */
	inputMapping?: Record<string, string>; // Map from previous output
}

/**
 * Result of executing a complete workflow.
 */
export interface WorkflowResult {
	/** Whether the workflow completed successfully */
	success: boolean;

	/** Outputs from each step, keyed by agent name */
	outputs: Record<string, unknown>;

	/** Total time in milliseconds to execute the workflow */
	executionTime: number;

	/** Detailed results for each step */
	steps: StepResult[];

	/** Error message if the workflow failed */
	error?: string;
}

/**
 * Result of executing a single step in a workflow.
 */
interface StepResult {
	/** Name of the agent that executed this step */
	agent: string;

	/** Whether the step completed successfully */
	success: boolean;

	/** Output from the agent */
	output?: unknown;

	/** Time in milliseconds to execute this step */
	executionTime: number;

	/** Error message if the step failed */
	error?: string;
}

/**
 * Orchestrator for managing agent handoffs and multi-step workflows.
 * Coordinates execution between agents and manages data flow.
 */
export class AgentOrchestrator {
	private toolExecutor:
		| ((toolName: string, args: unknown) => Promise<unknown>)
		| undefined;

	/**
	 * Sets the tool executor function for invoking MCP tools.
	 *
	 * @param executor - Function that executes an MCP tool by name with arguments
	 */
	setToolExecutor(
		executor: (toolName: string, args: unknown) => Promise<unknown>,
	): void {
		this.toolExecutor = executor;
	}

	/**
	 * Executes a handoff to a target agent.
	 *
	 * @param request - The handoff request containing target agent and context
	 * @returns Result of the handoff including success status and output
	 */
	async executeHandoff(request: HandoffRequest): Promise<HandoffResult> {
		const startTime = Date.now();

		// Get target agent
		const agent = agentRegistry.getAgent(request.targetAgent);
		if (!agent) {
			return {
				success: false,
				output: null,
				executionTime: Date.now() - startTime,
				error: `Agent not found: ${request.targetAgent}`,
			};
		}

		try {
			if (!this.toolExecutor) {
				throw new Error("Tool executor not configured");
			}

			// Execute the backing tool
			const output = await this.toolExecutor(agent.toolName, request.context);

			return {
				success: true,
				output,
				executionTime: Date.now() - startTime,
			};
		} catch (error) {
			return {
				success: false,
				output: null,
				executionTime: Date.now() - startTime,
				error: error instanceof Error ? error.message : "Unknown error",
			};
		}
	}

	/**
	 * Executes a multi-step workflow with sequential agent handoffs.
	 *
	 * @param workflow - The workflow definition containing steps
	 * @param input - Initial input data for the first step
	 * @returns Result of the workflow execution including all step outputs
	 */
	async executeWorkflow(
		workflow: Workflow,
		input: unknown,
	): Promise<WorkflowResult> {
		const startTime = Date.now();
		const outputs: Record<string, unknown> = { _initial: input };
		const steps: StepResult[] = [];

		let currentInput = input;

		for (const step of workflow.steps) {
			// Map input from previous outputs if specified
			const stepInput = step.inputMapping
				? this.mapInput(outputs, step.inputMapping)
				: currentInput;

			const result = await this.executeHandoff({
				targetAgent: step.agent,
				context: stepInput,
			});

			steps.push({
				agent: step.agent,
				success: result.success,
				output: result.output,
				executionTime: result.executionTime,
				error: result.error,
			});

			if (!result.success) {
				return {
					success: false,
					outputs,
					executionTime: Date.now() - startTime,
					steps,
					error: `Workflow failed at step: ${step.agent}`,
				};
			}

			outputs[step.agent] = result.output;
			currentInput = result.output;
		}

		return {
			success: true,
			outputs,
			executionTime: Date.now() - startTime,
			steps,
		};
	}

	/**
	 * Maps input values from previous outputs based on mapping configuration.
	 *
	 * @param outputs - Record of previous outputs from workflow steps
	 * @param mapping - Mapping configuration with keys to path expressions
	 * @returns Mapped input object
	 */
	private mapInput(
		outputs: Record<string, unknown>,
		mapping: Record<string, string>,
	): Record<string, unknown> {
		const result: Record<string, unknown> = {};
		for (const [key, path] of Object.entries(mapping)) {
			result[key] = this.getValueByPath(outputs, path);
		}
		return result;
	}

	/**
	 * Retrieves a value from a nested object using a dot-notation path.
	 *
	 * @param obj - The object to traverse
	 * @param path - Dot-separated path to the value (e.g., "user.name")
	 * @returns The value at the path, or undefined if not found
	 */
	private getValueByPath(obj: unknown, path: string): unknown {
		return path.split(".").reduce(
			(acc, key) =>
				acc && typeof acc === "object"
					? // biome-ignore lint/suspicious/noExplicitAny: Dynamic object traversal requires any
						(acc as any)[key]
					: undefined,
			obj,
		);
	}
}

/**
 * Singleton instance of the AgentOrchestrator.
 * Use this export for global agent orchestration.
 */
export const agentOrchestrator = new AgentOrchestrator();
