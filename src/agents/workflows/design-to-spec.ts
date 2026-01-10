/**
 * Design to Spec Workflow Definition
 *
 * @module agents/workflows/design-to-spec
 */

import type { Workflow } from "../orchestrator.js";

/**
 * Design to Spec Workflow
 *
 * Orchestrates a complete design session from initial setup through specification generation.
 * Uses the design-assistant agent to manage multi-phase design workflows with constraint
 * validation and artifact generation.
 *
 * **Flow**: design-assistant (start) → design-assistant (advance) → design-assistant (generate)
 *
 * **Use case**: Full design session from discovery to specification generation.
 * Suitable for creating ADRs and specifications for new features or architectural changes.
 *
 * @example
 * ```typescript
 * const input = {
 *   sessionId: 'design-session-123',
 *   config: {
 *     context: 'E-commerce platform',
 *     goal: 'Implement checkout flow',
 *     requirements: ['Payment processing', 'Cart validation'],
 *     sessionId: 'design-session-123',
 *     coverageThreshold: 85,
 *     enablePivots: true,
 *   },
 * };
 * const result = await orchestrator.executeWorkflow(designToSpecWorkflow, input);
 * ```
 */
export const designToSpecWorkflow: Workflow = {
	name: "design-to-spec",
	description: "Complete design workflow from discovery to specification",
	steps: [
		{
			agent: "design-assistant",
			// Start session
			inputMapping: {
				action: "_initial.action",
				sessionId: "_initial.sessionId",
				config: "_initial.config",
			},
			// Outputs: Session state with initial phase
		},
		{
			agent: "design-assistant",
			// Advance to requirements phase
			inputMapping: {
				action: "_initial.advanceAction",
				sessionId: "_initial.sessionId",
				phaseId: "_initial.targetPhase",
			},
			// Outputs: Updated session state in requirements phase
		},
		{
			agent: "design-assistant",
			// Generate artifacts
			inputMapping: {
				action: "_initial.generateAction",
				sessionId: "_initial.sessionId",
				artifactTypes: "_initial.artifactTypes",
			},
			// Outputs: Generated ADRs and specifications
		},
	],
};
