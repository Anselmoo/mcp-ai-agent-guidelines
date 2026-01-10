/**
 * Workflow Registry - Central registry for pre-defined agent workflows
 *
 * @module agents/workflows
 */

import type { Workflow } from "../orchestrator.js";
import { codeReviewChainWorkflow } from "./code-review-chain.js";
import { designToSpecWorkflow } from "./design-to-spec.js";

/**
 * Map of all registered workflows.
 * Key is the workflow name, value is the workflow definition.
 */
export const workflows: Map<string, Workflow> = new Map([
	["code-review-chain", codeReviewChainWorkflow],
	["design-to-spec", designToSpecWorkflow],
]);

/**
 * Retrieves a workflow by name.
 *
 * @param name - The name of the workflow to retrieve
 * @returns The workflow definition, or undefined if not found
 *
 * @example
 * ```typescript
 * const workflow = getWorkflow('code-review-chain');
 * if (workflow) {
 *   const result = await orchestrator.executeWorkflow(workflow, input);
 * }
 * ```
 */
export function getWorkflow(name: string): Workflow | undefined {
	return workflows.get(name);
}

/**
 * Lists all registered workflow names.
 *
 * @returns Array of workflow names
 *
 * @example
 * ```typescript
 * const names = listWorkflows();
 * console.log('Available workflows:', names);
 * // Output: ['code-review-chain', 'design-to-spec']
 * ```
 */
export function listWorkflows(): string[] {
	return Array.from(workflows.keys());
}

// Export individual workflow definitions for direct import
export { codeReviewChainWorkflow } from "./code-review-chain.js";
export { designToSpecWorkflow } from "./design-to-spec.js";
