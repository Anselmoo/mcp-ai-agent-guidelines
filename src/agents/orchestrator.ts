/**
 * AgentOrchestrator - Manages agent handoffs and workflow execution
 *
 * @module agents/orchestrator
 */

import { ErrorCode } from "../tools/shared/error-codes.js";
import { McpToolError } from "../tools/shared/errors.js";
import { executionGraph } from "./execution-graph.js";
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
export interface StepResult {
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
			const executionTime = Date.now() - startTime;
			const error = `Agent not found: ${request.targetAgent}`;

			// Record failed handoff
			executionGraph.recordHandoff({
				sourceAgent: request.sourceAgent,
				targetAgent: request.targetAgent,
				executionTime,
				success: false,
				error,
			});

			return {
				success: false,
				output: null,
				executionTime,
				error,
			};
		}

		try {
			if (!this.toolExecutor) {
				throw new McpToolError(
					ErrorCode.CONFIG_INVALID,
					"Tool executor not configured",
					{ targetAgent: request.targetAgent },
				);
			}

			// Execute the backing tool
			const output = await this.toolExecutor(agent.toolName, request.context);
			const executionTime = Date.now() - startTime;

			// Record successful handoff
			executionGraph.recordHandoff({
				sourceAgent: request.sourceAgent,
				targetAgent: request.targetAgent,
				executionTime,
				success: true,
			});

			return {
				success: true,
				output,
				executionTime,
			};
		} catch (error) {
			const executionTime = Date.now() - startTime;
			const errorMessage =
				error instanceof McpToolError
					? error.message
					: error instanceof Error
						? error.message
						: "Unknown error";

			// Record failed handoff
			executionGraph.recordHandoff({
				sourceAgent: request.sourceAgent,
				targetAgent: request.targetAgent,
				executionTime,
				success: false,
				error: errorMessage,
			});

			return {
				success: false,
				output: null,
				executionTime,
				error: errorMessage,
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
				sourceAgent:
					workflow.steps.indexOf(step) > 0
						? workflow.steps[workflow.steps.indexOf(step) - 1].agent
						: undefined,
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
		return path.split(".").reduce<unknown>((acc, key) => {
			if (acc === null || typeof acc !== "object") {
				return undefined;
			}

			const record = acc as Record<string, unknown>;
			if (!(key in record)) {
				return undefined;
			}

			return record[key];
		}, obj);
	}
}

/**
 * Singleton instance of the AgentOrchestrator.
 * Use this export for global agent orchestration.
 */
export const agentOrchestrator = new AgentOrchestrator();
