/**
 * Design Assistant Agent Definition
 *
 * @module agents/definitions/design-agent
 */

import type { AgentDefinition } from "../types.js";

/**
 * Agent for orchestrating multi-phase design workflows.
 * Manages design sessions with constraint validation, coverage enforcement, and artifact generation.
 */
export const designAgent: AgentDefinition = {
	name: "design-assistant",
	description:
		"Orchestrates multi-phase design workflows with constraint validation",
	capabilities: ["design", "architecture", "specification", "planning"],
	toolName: "design-assistant",
	inputSchema: {
		type: "object",
		properties: {
			action: {
				type: "string",
				enum: [
					"start-session",
					"advance-phase",
					"validate-phase",
					"evaluate-pivot",
					"generate-strategic-pivot-prompt",
					"generate-artifacts",
					"enforce-coverage",
					"enforce-consistency",
					"get-status",
					"load-constraints",
					"select-methodology",
					"enforce-cross-session-consistency",
					"generate-enforcement-prompts",
					"generate-constraint-documentation",
					"generate-context-aware-guidance",
				],
			},
			sessionId: { type: "string" },
			config: {
				type: "object",
				properties: {
					context: { type: "string" },
					goal: { type: "string" },
					requirements: { type: "array", items: { type: "string" } },
					sessionId: { type: "string" },
					coverageThreshold: { type: "number" },
					enablePivots: { type: "boolean" },
					outputFormats: { type: "array", items: { type: "string" } },
					templateRefs: { type: "array", items: { type: "string" } },
				},
			},
			phaseId: { type: "string" },
			content: { type: "string" },
			constraintId: { type: "string" },
			artifactTypes: {
				type: "array",
				items: { type: "string", enum: ["adr", "specification", "roadmap"] },
			},
		},
		required: ["action", "sessionId"],
	},
};
