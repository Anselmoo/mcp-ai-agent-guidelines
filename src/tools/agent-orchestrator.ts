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

import { agentOrchestrator } from "../agents/orchestrator.js";
import { agentRegistry } from "../agents/registry.js";
import { getWorkflow, listWorkflows } from "../agents/workflows/index.js";
import { ErrorCode } from "./shared/error-codes.js";
import { McpToolError } from "./shared/errors.js";
import { createMcpResponse } from "./shared/response-utils.js";

/**
 * Supported actions for the agent orchestrator tool
 */
export type AgentOrchestratorAction =
	| "handoff"
	| "workflow"
	| "list-agents"
	| "list-workflows";

/**
 * Request schema for the agent orchestrator tool
 */
export interface AgentOrchestratorRequest {
	/** The action to perform */
	action: AgentOrchestratorAction;

	// For handoff action
	/** Target agent for handoff (required for 'handoff' action) */
	targetAgent?: string;
	/** Context data to pass to target agent */
	context?: unknown;
	/** Reason for the handoff */
	reason?: string;

	// For workflow action
	/** Name of the workflow to execute (required for 'workflow' action) */
	workflowName?: string;
	/** Input data for the workflow */
	workflowInput?: unknown;
}

/**
 * Agent Orchestrator Tool
 *
 * Coordinates agent handoffs and workflow execution using the orchestration infrastructure.
 *
 * @param request - The orchestrator request with action and parameters
 * @returns MCP-formatted response
 */
export async function agentOrchestratorTool(request: AgentOrchestratorRequest) {
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
			throw new McpToolError(
				ErrorCode.INVALID_PARAMETER,
				`Unknown action: ${request.action}`,
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
 * @param request - The orchestrator request
 * @returns MCP response with handoff result
 */
async function handleHandoff(request: AgentOrchestratorRequest) {
	if (!request.targetAgent) {
		throw new McpToolError(
			ErrorCode.MISSING_REQUIRED_FIELD,
			"targetAgent is required for handoff action",
		);
	}

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
 * @param request - The orchestrator request
 * @returns MCP response with workflow execution result
 */
async function handleWorkflow(request: AgentOrchestratorRequest) {
	if (!request.workflowName) {
		throw new McpToolError(
			ErrorCode.MISSING_REQUIRED_FIELD,
			"workflowName is required for workflow action",
		);
	}

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
