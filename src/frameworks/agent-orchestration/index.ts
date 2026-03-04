/**
 * Agent Orchestration Framework (T-045).
 * Consolidates: agent-orchestrator, design-assistant.
 */

import { z } from "zod";
import { agentOrchestratorTool } from "../../tools/agent-orchestrator.js";
import type { DesignAssistantRequest } from "../../tools/design/design-assistant.js";
import { designAssistant } from "../../tools/design/design-assistant.js";
import type { FrameworkDefinition } from "../types.js";

const AgentOrchestrationInputSchema = z.object({
	action: z
		.enum([
			"orchestrate",
			"design-session",
			"handoff",
			"list-agents",
			"list-workflows",
		])
		.describe("Orchestration action"),
	sessionId: z.string().optional().describe("Design session identifier"),
	targetAgent: z.string().optional().describe("Target agent for handoff"),
	workflowName: z.string().optional().describe("Workflow name to execute"),
	workflowInput: z
		.record(z.unknown())
		.optional()
		.describe("Input data for the workflow"),
	context: z
		.record(z.unknown())
		.optional()
		.describe("Context data to pass to target agent"),
	reason: z.string().optional().describe("Reason for the handoff"),
	config: z
		.object({
			goal: z.string(),
			context: z.string().optional(),
			requirements: z.array(z.string()).optional(),
		})
		.optional()
		.describe("Design session configuration"),
});

export const agentOrchestrationFramework: FrameworkDefinition = {
	name: "agent-orchestration",
	description:
		"Agent orchestration: multi-agent workflows, design sessions, agent handoffs, and workflow execution.",
	version: "1.0.0",
	actions: [
		"orchestrate",
		"design-session",
		"handoff",
		"list-agents",
		"list-workflows",
	],
	schema: AgentOrchestrationInputSchema,

	async execute(input: unknown) {
		const validated = AgentOrchestrationInputSchema.parse(input);

		switch (validated.action) {
			case "orchestrate":
			case "handoff":
			case "list-agents":
			case "list-workflows":
				return agentOrchestratorTool({
					action:
						validated.action === "orchestrate" ? "workflow" : validated.action,
					targetAgent: validated.targetAgent,
					workflowName: validated.workflowName,
					workflowInput: validated.workflowInput,
					context: validated.context,
					reason: validated.reason,
				});

			case "design-session": {
				const result = await designAssistant.processRequest({
					action: "start-session",
					sessionId: validated.sessionId ?? `session-${Date.now()}`,
					config: validated.config ?? { goal: "" },
				} as DesignAssistantRequest);
				return {
					content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
				};
			}

			default:
				throw new Error(
					`Unknown agent-orchestration action: ${validated.action}`,
				);
		}
	},
};
