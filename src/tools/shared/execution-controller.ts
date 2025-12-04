/**
 * Execution Controller - Orchestration strategies for A2A tool chaining
 *
 * Provides declarative execution patterns:
 * - Sequential execution (one after another)
 * - Parallel execution (concurrent with Promise.all)
 * - Parallel with join (merge results)
 * - Conditional branching
 * - Retry with exponential backoff
 */

import type { A2AContext } from "./a2a-context.js";
import { ExecutionStrategyError, OrchestrationError } from "./a2a-errors.js";
import { logger } from "./logger.js";
import { type InvokeOptions, invokeTool } from "./tool-invoker.js";
import type { ToolResult } from "./tool-registry.js";

/**
 * Execution strategy types
 */
export type ExecutionStrategy =
	| "sequential"
	| "parallel"
	| "parallel-with-join"
	| "conditional"
	| "retry-with-backoff";

/**
 * Error handling mode
 */
export type ErrorHandling = "abort" | "skip" | "fallback";

/**
 * Step in an execution plan
 */
export interface ExecutionStep {
	/** Step identifier */
	id: string;
	/** Tool to invoke */
	toolName: string;
	/** Arguments for the tool */
	args: unknown;
	/** Dependencies on other steps (by ID) */
	dependencies?: string[];
	/** Optional transform function for previous step output */
	transform?: (previousOutput: unknown) => unknown;
	/** Invocation options */
	options?: InvokeOptions;
	/** Condition for conditional execution */
	condition?: (sharedState: Map<string, unknown>) => boolean;
}

/**
 * Execution plan configuration
 */
export interface ExecutionPlan {
	/** Execution strategy */
	strategy: ExecutionStrategy;
	/** Steps to execute */
	steps: ExecutionStep[];
	/** Error handling mode */
	onError: ErrorHandling;
	/** Fallback tool if onError is 'fallback' */
	fallbackTool?: string;
	/** Fallback args */
	fallbackArgs?: unknown;
	/** Retry configuration for retry-with-backoff strategy */
	retryConfig?: {
		maxRetries: number;
		initialDelayMs: number;
		maxDelayMs: number;
		backoffMultiplier: number;
	};
}

/**
 * Result of executing a chain
 */
export interface ChainResult {
	/** Whether the entire chain succeeded */
	success: boolean;
	/** Results from each step (keyed by step ID) */
	stepResults: Map<string, ToolResult>;
	/** Final output (from last successful step) */
	finalOutput?: unknown;
	/** Error if chain failed */
	error?: string;
	/** Execution summary */
	summary: {
		totalSteps: number;
		successfulSteps: number;
		failedSteps: number;
		skippedSteps: number;
		totalDurationMs: number;
	};
}

/**
 * Execute a chain of tools according to the execution plan
 *
 * @param plan - Execution plan
 * @param context - A2A context
 * @returns Chain execution result
 */
export async function executeChain(
	plan: ExecutionPlan,
	context: A2AContext,
): Promise<ChainResult> {
	const startTime = Date.now();
	const stepResults = new Map<string, ToolResult>();

	logger.info("Starting chain execution", {
		strategy: plan.strategy,
		stepCount: plan.steps.length,
		correlationId: context.correlationId,
	});

	try {
		switch (plan.strategy) {
			case "sequential":
				await executeSequential(plan.steps, context, stepResults, plan.onError);
				break;

			case "parallel":
				await executeParallel(plan.steps, context, stepResults, plan.onError);
				break;

			case "parallel-with-join":
				await executeParallelWithJoin(
					plan.steps,
					context,
					stepResults,
					plan.onError,
				);
				break;

			case "conditional":
				await executeConditional(
					plan.steps,
					context,
					stepResults,
					plan.onError,
				);
				break;

			case "retry-with-backoff":
				await executeWithRetry(
					plan.steps,
					context,
					stepResults,
					plan.onError,
					plan.retryConfig || getDefaultRetryConfig(),
				);
				break;

			default:
				throw new ExecutionStrategyError(
					plan.strategy,
					`Unknown execution strategy: ${plan.strategy}`,
				);
		}

		// Calculate summary
		const summary = calculateSummary(stepResults, startTime, context);

		// Determine final output
		const finalOutput = getFinalOutput(plan.steps, stepResults);

		return {
			success: summary.failedSteps === 0,
			stepResults,
			finalOutput,
			summary,
		};
	} catch (error) {
		// Try fallback if configured
		if (plan.onError === "fallback" && plan.fallbackTool) {
			logger.warn("Chain execution failed, trying fallback", {
				fallbackTool: plan.fallbackTool,
				error: error instanceof Error ? error.message : String(error),
			});

			try {
				const fallbackResult = await invokeTool(
					plan.fallbackTool,
					plan.fallbackArgs || {},
					context,
				);

				stepResults.set("fallback", fallbackResult);

				const summary = calculateSummary(stepResults, startTime, context);

				return {
					success: fallbackResult.success,
					stepResults,
					finalOutput: fallbackResult.data,
					summary,
				};
			} catch (fallbackError) {
				logger.error("Fallback execution also failed", {
					fallbackTool: plan.fallbackTool,
					error:
						fallbackError instanceof Error
							? fallbackError.message
							: String(fallbackError),
				});
			}
		}

		const summary = calculateSummary(stepResults, startTime, context);

		return {
			success: false,
			stepResults,
			error: error instanceof Error ? error.message : String(error),
			summary,
		};
	}
}

/**
 * Execute steps sequentially
 */
async function executeSequential(
	steps: ExecutionStep[],
	context: A2AContext,
	results: Map<string, ToolResult>,
	onError: ErrorHandling,
): Promise<void> {
	for (const step of steps) {
		// Check dependencies
		if (!areDependenciesMet(step, results)) {
			logger.warn(`Skipping step ${step.id} due to unmet dependencies`);
			results.set(step.id, {
				success: false,
				error: "Dependencies not met",
			});
			continue;
		}

		try {
			// Get args (potentially transformed from previous output)
			const args = step.transform
				? step.transform(getPreviousOutput(step, results))
				: step.args;

			const result = await invokeTool(
				step.toolName,
				args,
				context,
				step.options,
			);
			results.set(step.id, result);

			if (!result.success && onError === "abort") {
				throw new OrchestrationError(
					`Step ${step.id} failed: ${result.error}`,
					{ stepId: step.id },
				);
			}
		} catch (error) {
			if (onError === "abort") {
				throw error;
			}

			if (onError === "skip") {
				logger.warn(`Step ${step.id} failed, skipping`, {
					error: error instanceof Error ? error.message : String(error),
				});
				results.set(step.id, {
					success: false,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}
	}
}

/**
 * Execute steps in parallel
 */
async function executeParallel(
	steps: ExecutionStep[],
	context: A2AContext,
	results: Map<string, ToolResult>,
	onError: ErrorHandling,
): Promise<void> {
	// Group steps by dependency level
	const levels = groupStepsByDependency(steps);

	// Execute each level in sequence, but steps within level in parallel
	for (const levelSteps of levels) {
		const promises = levelSteps.map(async (step) => {
			try {
				const args = step.transform
					? step.transform(getPreviousOutput(step, results))
					: step.args;

				const result = await invokeTool(
					step.toolName,
					args,
					context,
					step.options,
				);
				return { stepId: step.id, result };
			} catch (error) {
				if (onError === "abort") {
					throw error;
				}
				return {
					stepId: step.id,
					result: {
						success: false,
						error: error instanceof Error ? error.message : String(error),
					} as ToolResult,
				};
			}
		});

		const levelResults = await Promise.all(promises);

		for (const { stepId, result } of levelResults) {
			results.set(stepId, result);

			if (!result.success && onError === "abort") {
				throw new OrchestrationError(`Step ${stepId} failed: ${result.error}`, {
					stepId,
				});
			}
		}
	}
}

/**
 * Execute steps in parallel and join/merge results
 */
async function executeParallelWithJoin(
	steps: ExecutionStep[],
	context: A2AContext,
	results: Map<string, ToolResult>,
	onError: ErrorHandling,
): Promise<void> {
	// Execute all independent steps in parallel
	await executeParallel(steps, context, results, onError);

	// Store merged output in shared state
	const mergedOutput = Array.from(results.values())
		.filter((r) => r.success)
		.map((r) => r.data);

	context.sharedState.set("merged_results", mergedOutput);
}

/**
 * Execute steps with conditional branching
 */
async function executeConditional(
	steps: ExecutionStep[],
	context: A2AContext,
	results: Map<string, ToolResult>,
	onError: ErrorHandling,
): Promise<void> {
	for (const step of steps) {
		// Check condition if present
		if (step.condition && !step.condition(context.sharedState)) {
			logger.debug(`Skipping step ${step.id} due to condition`);
			continue;
		}

		// Check dependencies
		if (!areDependenciesMet(step, results)) {
			continue;
		}

		try {
			const args = step.transform
				? step.transform(getPreviousOutput(step, results))
				: step.args;

			const result = await invokeTool(
				step.toolName,
				args,
				context,
				step.options,
			);
			results.set(step.id, result);

			if (!result.success && onError === "abort") {
				throw new OrchestrationError(
					`Step ${step.id} failed: ${result.error}`,
					{ stepId: step.id },
				);
			}
		} catch (error) {
			if (onError === "abort") {
				throw error;
			}
			results.set(step.id, {
				success: false,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}
}

/**
 * Execute steps with retry and exponential backoff
 */
async function executeWithRetry(
	steps: ExecutionStep[],
	context: A2AContext,
	results: Map<string, ToolResult>,
	onError: ErrorHandling,
	retryConfig: Required<NonNullable<ExecutionPlan["retryConfig"]>>,
): Promise<void> {
	for (const step of steps) {
		if (!areDependenciesMet(step, results)) {
			continue;
		}

		let lastError: Error | undefined;
		let delayMs = retryConfig.initialDelayMs;

		for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
			try {
				const args = step.transform
					? step.transform(getPreviousOutput(step, results))
					: step.args;

				const result = await invokeTool(
					step.toolName,
					args,
					context,
					step.options,
				);
				results.set(step.id, result);

				if (!result.success && onError === "abort") {
					throw new OrchestrationError(
						`Step ${step.id} failed: ${result.error}`,
						{ stepId: step.id },
					);
				}

				break; // Success, exit retry loop
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error));

				if (attempt < retryConfig.maxRetries) {
					logger.warn(`Step ${step.id} failed, retrying in ${delayMs}ms`, {
						attempt: attempt + 1,
						maxRetries: retryConfig.maxRetries,
					});

					await sleep(delayMs);
					delayMs = Math.min(
						delayMs * retryConfig.backoffMultiplier,
						retryConfig.maxDelayMs,
					);
				}
			}
		}

		// All retries failed
		if (lastError) {
			if (onError === "abort") {
				throw lastError;
			}
			results.set(step.id, {
				success: false,
				error: lastError.message,
			});
		}
	}
}

/**
 * Helper functions
 */

function areDependenciesMet(
	step: ExecutionStep,
	results: Map<string, ToolResult>,
): boolean {
	if (!step.dependencies || step.dependencies.length === 0) {
		return true;
	}

	return step.dependencies.every(
		(depId) => results.has(depId) && results.get(depId)?.success,
	);
}

function getPreviousOutput(
	step: ExecutionStep,
	results: Map<string, ToolResult>,
): unknown {
	if (!step.dependencies || step.dependencies.length === 0) {
		return undefined;
	}

	// Return output from first dependency
	const depId = step.dependencies[0];
	return results.get(depId)?.data;
}

function groupStepsByDependency(steps: ExecutionStep[]): ExecutionStep[][] {
	const levels: ExecutionStep[][] = [];
	const processed = new Set<string>();

	while (processed.size < steps.length) {
		const currentLevel = steps.filter(
			(step) =>
				!processed.has(step.id) &&
				(!step.dependencies ||
					step.dependencies.every((dep) => processed.has(dep))),
		);

		if (currentLevel.length === 0) {
			throw new OrchestrationError(
				"Circular dependency detected in execution plan",
			);
		}

		levels.push(currentLevel);
		for (const step of currentLevel) {
			processed.add(step.id);
		}
	}

	return levels;
}

function getFinalOutput(
	steps: ExecutionStep[],
	results: Map<string, ToolResult>,
): unknown {
	// Return output from last successful step
	for (let i = steps.length - 1; i >= 0; i--) {
		const result = results.get(steps[i].id);
		if (result?.success) {
			return result.data;
		}
	}
	return undefined;
}

function calculateSummary(
	results: Map<string, ToolResult>,
	startTime: number,
	context: A2AContext,
): ChainResult["summary"] {
	const values = Array.from(results.values());

	// Count skipped steps from execution log
	const skippedCount = context.executionLog.filter(
		(entry) => entry.status === "skipped",
	).length;

	return {
		totalSteps: values.length,
		successfulSteps: values.filter((r) => r.success).length,
		failedSteps: values.filter((r) => !r.success).length,
		skippedSteps: skippedCount,
		totalDurationMs: Date.now() - startTime,
	};
}

function getDefaultRetryConfig(): Required<
	NonNullable<ExecutionPlan["retryConfig"]>
> {
	return {
		maxRetries: 3,
		initialDelayMs: 1000,
		maxDelayMs: 10000,
		backoffMultiplier: 2,
	};
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
