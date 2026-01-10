/**
 * Code Review Chain Workflow Definition
 *
 * @module agents/workflows/code-review-chain
 */

import type { Workflow } from "../orchestrator.js";

/**
 * Code Review Chain Workflow
 *
 * Executes a complete code review process by chaining three specialized agents:
 * 1. code-scorer - Analyzes code quality and returns a 0-100 score
 * 2. security-analyzer - Performs security analysis and OWASP compliance check
 * 3. documentation-generator - Generates documentation based on review results
 *
 * **Flow**: code-scorer → security-analyzer → documentation-generator
 *
 * **Use case**: Complete code review with quality score, security check,
 * and documentation suggestions.
 *
 * @example
 * ```typescript
 * const input = {
 *   projectPath: '/path/to/project',
 *   coverageMetrics: { lines: 85, branches: 80, functions: 90, statements: 85 },
 *   codeContext: 'Authentication module implementation',
 * };
 * const result = await orchestrator.executeWorkflow(codeReviewChainWorkflow, input);
 * ```
 */
export const codeReviewChainWorkflow: Workflow = {
	name: "code-review-chain",
	description:
		"Complete code review: quality scoring → security analysis → documentation",
	steps: [
		{
			agent: "code-scorer",
			// Input: { projectPath, coverageMetrics, codeContent, language, framework }
			// Outputs: { overallScore, breakdown, recommendations }
		},
		{
			agent: "security-analyzer",
			inputMapping: {
				codeContext: "_initial.codeContext",
				// Carry forward code context from initial input
			},
			// Outputs: Security analysis prompt with OWASP compliance
		},
		{
			agent: "documentation-generator",
			inputMapping: {
				projectPath: "_initial.projectPath",
				analysisResults: "code-scorer",
				securityResults: "security-analyzer",
			},
			// Outputs: Documentation generation prompt
		},
	],
};
