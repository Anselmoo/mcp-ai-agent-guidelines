/**
 * Agent Orchestrator Tool - Refactored Version
 *
 * MCP tool for agent-to-agent (A2A) orchestration using the new infrastructure.
 * Provides actions for agent handoffs, workflow execution, and discovery.
 *
 * Features:
 * - List available agents and workflows
 * - Execute agent handoffs with context passing
 * - Execute multi-step workflows
 * - Error handling with typed error codes
 */

import { z } from "zod";
import { agentOrchestrator } from "../agents/orchestrator.js";
import { agentRegistry } from "../agents/registry.js";
import { getWorkflow, listWorkflows } from "../agents/workflows/index.js";
import { ErrorCode } from "./shared/error-codes.js";
import { McpToolError } from "./shared/errors.js";
import { createMcpResponse } from "./shared/response-utils.js";

/**
 * Zod schema for agent orchestrator action types
 */
const AgentOrchestratorActionSchema = z.enum([
	"handoff",
	"workflow",
	"list-agents",
	"list-workflows",
]);

/**
 * Zod schema for agent orchestrator request
 * Uses discriminated union based on action type for proper validation
 */
const AgentOrchestratorSchema = z.discriminatedUnion("action", [
	// list-agents action - no additional parameters required
	z.object({
		action: z.literal("list-agents"),
	}),
	// list-workflows action - no additional parameters required
	z.object({
		action: z.literal("list-workflows"),
	}),
	// handoff action - requires targetAgent, optional context and reason
	z.object({
		action: z.literal("handoff"),
		targetAgent: z
			.string()
			.min(1, "targetAgent must be a non-empty string")
			.describe(
				"Name of the target agent to hand off to. Example: 'code-reviewer'",
			),
		context: z
			.unknown()
			.optional()
			.describe(
				"Context data to pass to the target agent. Can be any JSON-serializable value. Example: { files: ['src/foo.ts'], task: 'review changes' }",
			),
		reason: z
			.string()
			.optional()
			.describe(
				"Reason for the handoff. Example: 'Quality check required before merge'",
			),
	}),
	// workflow action - requires workflowName, optional workflowInput
	z.object({
		action: z.literal("workflow"),
		workflowName: z
			.string()
			.min(1, "workflowName must be a non-empty string")
			.describe(
				"Name of the workflow to execute. Example: 'code-review-pipeline'",
			),
		workflowInput: z
			.unknown()
			.optional()
			.describe(
				"Input data for the workflow. Can be any JSON-serializable value. Example: { projectPath: '.', branch: 'main' }",
			),
	}),
]);

/**
 * Supported actions for the agent orchestrator tool
 */
export type AgentOrchestratorAction = z.infer<
	typeof AgentOrchestratorActionSchema
>;

/**
 * Request schema for the agent orchestrator tool
 */
export type AgentOrchestratorRequest = z.infer<typeof AgentOrchestratorSchema>;

/**
 * Agent Orchestrator Tool
 *
 * Coordinates agent handoffs and workflow execution using the orchestration infrastructure.
 *
 * @param args - The orchestrator request with action and parameters (validated against schema)
 * @returns MCP-formatted response
 * @throws {McpToolError} If validation fails or action is invalid
 */
export async function agentOrchestratorTool(args: unknown) {
	// Validate input with Zod schema
	const request = AgentOrchestratorSchema.parse(args);

	switch (request.action) {
		case "list-agents":
			return handleListAgents();

		case "list-workflows":
			return handleListWorkflows();

		case "handoff":
			return handleHandoff(request);

		case "workflow":
			return handleWorkflow(request);

		default:
			// This should never happen due to discriminated union, but TypeScript requires it
			throw new McpToolError(
				ErrorCode.INVALID_PARAMETER,
				`Unknown action: ${(request as { action: string }).action}`,
				{
					validActions: [
						"handoff",
						"workflow",
						"list-agents",
						"list-workflows",
					],
				},
			);
	}
}

/**
 * Handles the list-agents action
 *
 * @returns MCP response with list of available agents
 */
function handleListAgents() {
	const agents = agentRegistry.listAgents();

	const content = `# Available Agents

${agents
	.map(
		(a) => `## ${a.name}

${a.description}

**Capabilities**: ${a.capabilities.join(", ")}
`,
	)
	.join("\n")}
`;

	return createMcpResponse({ content });
}

/**
 * Handles the list-workflows action
 *
 * @returns MCP response with list of available workflows
 */
function handleListWorkflows() {
	const workflowNames = listWorkflows();

	const content = `# Available Workflows

${workflowNames
	.map((name) => {
		const wf = getWorkflow(name);
		return `## ${name}

${wf?.description ?? "No description"}

**Steps**: ${wf?.steps.map((s) => s.agent).join(" → ")}
`;
	})
	.join("\n")}
`;

	return createMcpResponse({ content });
}

/**
 * Handles the handoff action
 *
 * @param request - The orchestrator request for handoff action
 * @returns MCP response with handoff result
 */
async function handleHandoff(
	request: Extract<AgentOrchestratorRequest, { action: "handoff" }>,
) {
	// targetAgent is guaranteed to be present due to Zod validation
	const result = await agentOrchestrator.executeHandoff({
		targetAgent: request.targetAgent,
		context: request.context,
		reason: request.reason,
	});

	if (!result.success) {
		return createMcpResponse({
			isError: true,
			content: `Handoff failed: ${result.error}`,
		});
	}

	return createMcpResponse({
		content: `# Handoff Completed

**Target Agent**: ${request.targetAgent}
**Execution Time**: ${result.executionTime}ms

## Output

${JSON.stringify(result.output, null, 2)}
`,
	});
}

/**
 * Handles the workflow action
 *
 * @param request - The orchestrator request for workflow action
 * @returns MCP response with workflow execution result
 */
async function handleWorkflow(
	request: Extract<AgentOrchestratorRequest, { action: "workflow" }>,
) {
	// workflowName is guaranteed to be present due to Zod validation
	const workflow = getWorkflow(request.workflowName);
	if (!workflow) {
		throw new McpToolError(
			ErrorCode.RESOURCE_NOT_FOUND,
			`Workflow not found: ${request.workflowName}`,
			{ availableWorkflows: listWorkflows() },
		);
	}

	const result = await agentOrchestrator.executeWorkflow(
		workflow,
		request.workflowInput,
	);

	// Format workflow result
	if (!result.success) {
		return createMcpResponse({
			isError: true,
			content: `# Workflow Failed

**Workflow**: ${request.workflowName}
**Error**: ${result.error}
**Execution Time**: ${result.executionTime}ms

## Steps Executed

${result.steps
	.map(
		(step) => `### ${step.agent}
- **Success**: ${step.success ? "✅" : "❌"}
- **Execution Time**: ${step.executionTime}ms
${step.error ? `- **Error**: ${step.error}` : ""}
`,
	)
	.join("\n")}
`,
		});
	}

	return createMcpResponse({
		content: `# Workflow Completed

**Workflow**: ${request.workflowName}
**Execution Time**: ${result.executionTime}ms

## Steps

${result.steps
	.map(
		(step) => `### ${step.agent} ✅
- **Execution Time**: ${step.executionTime}ms
`,
	)
	.join("\n")}

## Final Output

${JSON.stringify(result.outputs, null, 2)}
`,
	});
}
