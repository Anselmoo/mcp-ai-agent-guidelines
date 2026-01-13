/**
 * Code Scorer Agent Definition
 *
 * @module agents/definitions/code-scorer-agent
 */

import type { AgentDefinition } from "../types.js";

/**
 * Agent for analyzing code quality and returning clean code scores.
 * Provides 0-100 scoring with breakdown by category (hygiene, coverage, TypeScript, etc.).
 */
export const codeScorerAgent: AgentDefinition = {
	name: "code-scorer",
	description:
		"Analyzes code quality and returns a 0-100 clean code score with breakdown by category",
	capabilities: ["code-analysis", "quality-metrics", "scoring"],
	toolName: "clean-code-scorer",
	inputSchema: {
		type: "object",
		properties: {
			coverageMetrics: {
				type: "object",
				properties: {
					lines: { type: "number" },
					branches: { type: "number" },
					functions: { type: "number" },
					statements: { type: "number" },
				},
			},
			projectPath: { type: "string" },
			codeContent: { type: "string" },
			language: { type: "string" },
			framework: { type: "string" },
		},
	},
	outputSchema: {
		type: "object",
		properties: {
			overallScore: { type: "number" },
			breakdown: { type: "object" },
			recommendations: { type: "array" },
		},
	},
};
