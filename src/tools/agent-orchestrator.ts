/**
 * Agent Orchestrator Tool
 *
 * High-level MCP tool for Agent-to-Agent (A2A) orchestration.
 * Enables declarative workflow execution using registered tools.
 *
 * Features:
 * - Execute pre-defined workflow templates
 * - Custom workflow execution from user-provided plans
 * - Automatic context management and tracing
 * - Error handling with fallback strategies
 * - Execution visualization and reporting
 */

import { z } from "zod";
import {
	type A2AContext,
	createA2AContext,
	getExecutionSummary,
} from "./shared/a2a-context.js";
import {
	type ChainResult,
	type ExecutionPlan,
	type ExecutionStep,
	executeChain,
} from "./shared/execution-controller.js";
import { logger } from "./shared/logger.js";
import { createTraceFromContext, traceLogger } from "./shared/trace-logger.js";

/**
 * Workflow template identifier
 */
export type WorkflowTemplate =
	| "quality-audit"
	| "security-scan"
	| "code-analysis-pipeline"
	| "documentation-generation";

/**
 * Input schema for agent orchestrator
 */
const AgentOrchestratorSchema = z.object({
	// Workflow execution mode
	mode: z
		.enum(["template", "custom"])
		.describe(
			"Execution mode: template for pre-defined workflows, custom for user-defined",
		),

	// Template workflow (for mode: template)
	template: z
		.enum([
			"quality-audit",
			"security-scan",
			"code-analysis-pipeline",
			"documentation-generation",
		])
		.optional()
		.describe("Pre-defined workflow template to execute"),

	// Custom execution plan (for mode: custom)
	executionPlan: z
		.object({
			strategy: z.enum([
				"sequential",
				"parallel",
				"parallel-with-join",
				"conditional",
				"retry-with-backoff",
			]),
			steps: z.array(
				z.object({
					id: z.string(),
					toolName: z.string(),
					args: z.unknown().describe("Arguments to pass to the tool"),
					dependencies: z.array(z.string()).optional(),
				}),
			),
			onError: z.enum(["abort", "skip", "fallback"]),
			fallbackTool: z.string().optional(),
			fallbackArgs: z
				.unknown()
				.optional()
				.describe("Arguments for fallback tool"),
		})
		.optional()
		.describe("Custom execution plan for the workflow"),

	// Workflow parameters (passed to tools in the workflow)
	parameters: z
		.record(z.unknown())
		.optional()
		.describe("Parameters to pass to workflow steps"),

	// Orchestration config
	config: z
		.object({
			maxDepth: z.number().optional().describe("Maximum recursion depth"),
			timeoutMs: z
				.number()
				.optional()
				.describe("Per-tool timeout in milliseconds"),
			chainTimeoutMs: z
				.number()
				.optional()
				.describe("Total chain timeout in milliseconds"),
			correlationId: z
				.string()
				.optional()
				.describe("Custom correlation ID for tracing"),
		})
		.optional()
		.describe("Orchestration configuration"),

	// Output options
	includeTrace: z
		.boolean()
		.optional()
		.default(true)
		.describe("Include execution trace in output"),
	includeVisualization: z
		.boolean()
		.optional()
		.default(false)
		.describe("Include Mermaid visualization of execution"),
});

type AgentOrchestratorInput = z.infer<typeof AgentOrchestratorSchema>;

/**
 * Agent Orchestrator Tool
 *
 * Orchestrates multi-tool workflows with A2A chaining capabilities.
 *
 * @param args - Orchestrator configuration
 * @returns Workflow execution result with trace and summary
 */
export async function agentOrchestrator(args: unknown) {
	const input = AgentOrchestratorSchema.parse(args);

	logger.info("Starting agent orchestration", {
		mode: input.mode,
		template: input.template,
	});

	// Create A2A context
	const context = createA2AContext(input.config?.correlationId, input.config);

	// Start tracing
	if (input.includeTrace) {
		traceLogger.startChain(context);
	}

	try {
		// Get execution plan
		let plan: ExecutionPlan;
		if (input.mode === "template") {
			if (!input.template) {
				throw new Error("Template name is required for template mode");
			}
			plan = getTemplateWorkflow(input.template, input.parameters || {});
		} else {
			if (!input.executionPlan) {
				throw new Error("Execution plan is required for custom mode");
			}
			plan = convertCustomPlan(input.executionPlan, input.parameters || {});
		}

		// Execute workflow
		const result = await executeChain(plan, context);

		// End tracing
		if (input.includeTrace) {
			traceLogger.endChain(context, result.success);
		}

		// Get execution summary
		const summary = getExecutionSummary(context);

		// Build response
		const response: Record<string, unknown> = {
			success: result.success,
			finalOutput: result.finalOutput,
			summary: {
				...result.summary,
				correlationId: summary.correlationId,
				maxDepthReached: summary.maxDepthReached,
			},
		};

		// Add trace if requested
		if (input.includeTrace) {
			const trace = createTraceFromContext(context);
			response.trace = {
				correlationId: trace.correlationId,
				spans: trace.spans.map((span) => ({
					toolName: span.toolName,
					durationMs: span.durationMs,
					status: span.status,
					depth: span.depth,
				})),
			};
		}

		// Add visualization if requested
		if (input.includeVisualization) {
			response.visualization = generateWorkflowVisualization(context, result);
		}

		// Add step details
		response.steps = Array.from(result.stepResults.entries()).map(
			([id, stepResult]) => ({
				id,
				success: stepResult.success,
				error: stepResult.error,
			}),
		);

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(response, null, 2),
				},
			],
		};
	} catch (error) {
		// End tracing with error
		if (input.includeTrace) {
			traceLogger.endChain(
				context,
				false,
				error instanceof Error ? error.message : String(error),
			);
		}

		logger.error("Agent orchestration failed", {
			error: error instanceof Error ? error.message : String(error),
			correlationId: context.correlationId,
		});

		return {
			content: [
				{
					type: "text",
					text: JSON.stringify(
						{
							success: false,
							error: error instanceof Error ? error.message : String(error),
							correlationId: context.correlationId,
						},
						null,
						2,
					),
				},
			],
			isError: true,
		};
	}
}

/**
 * Get pre-defined workflow template
 */
function getTemplateWorkflow(
	template: WorkflowTemplate,
	parameters: Record<string, unknown>,
): ExecutionPlan {
	switch (template) {
		case "quality-audit":
			return {
				strategy: "sequential",
				onError: "abort",
				steps: [
					{
						id: "clean-code",
						toolName: "clean-code-scorer",
						args: {
							projectPath: parameters.projectPath || ".",
							...parameters,
						},
					},
					{
						id: "code-hygiene",
						toolName: "code-hygiene-analyzer",
						args: {
							codeContent: parameters.codeContent || "",
							language: parameters.language || "typescript",
							...parameters,
						},
						dependencies: ["clean-code"],
					},
				],
			};

		case "security-scan":
			return {
				strategy: "parallel",
				onError: "skip",
				steps: [
					{
						id: "dependency-audit",
						toolName: "dependency-auditor",
						args: {
							dependencyContent: parameters.dependencyContent || "",
							...parameters,
						},
					},
					{
						id: "security-hardening",
						toolName: "security-hardening-prompt-builder",
						args: {
							codeContext: parameters.codeContext || "",
							...parameters,
						},
					},
				],
			};

		case "code-analysis-pipeline":
			return {
				strategy: "sequential",
				onError: "abort",
				steps: [
					{
						id: "semantic-analysis",
						toolName: "semantic-code-analyzer",
						args: {
							codeContent: parameters.codeContent || "",
							...parameters,
						},
					},
					{
						id: "clean-code-score",
						toolName: "clean-code-scorer",
						args: {
							projectPath: parameters.projectPath || ".",
							...parameters,
						},
						dependencies: ["semantic-analysis"],
					},
					{
						id: "diagram-generation",
						toolName: "mermaid-diagram-generator",
						args: {
							description: parameters.description || "Code analysis results",
							diagramType: "flowchart",
							...parameters,
						},
						dependencies: ["clean-code-score"],
					},
				],
			};

		case "documentation-generation":
			return {
				strategy: "sequential",
				onError: "abort",
				steps: [
					{
						id: "project-onboarding",
						toolName: "project-onboarding",
						args: {
							projectPath: parameters.projectPath || ".",
							...parameters,
						},
					},
					{
						id: "doc-generation",
						toolName: "documentation-generator-prompt-builder",
						args: {
							contentType: parameters.contentType || "API",
							...parameters,
						},
						dependencies: ["project-onboarding"],
					},
				],
			};
	}
}

/**
 * Convert custom execution plan to internal format
 */
function convertCustomPlan(
	customPlan: NonNullable<AgentOrchestratorInput["executionPlan"]>,
	parameters: Record<string, unknown>,
): ExecutionPlan {
	const steps: ExecutionStep[] = customPlan.steps.map((step) => ({
		id: step.id,
		toolName: step.toolName,
		args:
			typeof step.args === "object" && step.args !== null
				? { ...(step.args as Record<string, unknown>), ...parameters }
				: parameters || step.args,
		dependencies: step.dependencies,
	}));

	return {
		strategy: customPlan.strategy,
		steps,
		onError: customPlan.onError,
		fallbackTool: customPlan.fallbackTool,
		fallbackArgs: customPlan.fallbackArgs,
	};
}

/**
 * Generate Mermaid visualization of workflow execution
 */
function generateWorkflowVisualization(
	context: A2AContext,
	_result: ChainResult,
): string {
	const lines: string[] = ["```mermaid", "graph TD"];

	// Add nodes for each tool invocation
	for (const entry of context.executionLog) {
		const nodeId = `${entry.toolName}_${entry.depth}`;
		const status = entry.status === "success" ? "✅" : "❌";
		const label = `${status} ${entry.toolName}<br/>${entry.durationMs}ms`;

		lines.push(`    ${nodeId}["${label}"]`);

		// Add edge from parent if exists
		if (entry.parentToolName) {
			const parentId = `${entry.parentToolName}_${entry.depth - 1}`;
			lines.push(`    ${parentId} --> ${nodeId}`);
		}
	}

	lines.push("```");

	return lines.join("\n");
}
