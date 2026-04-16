// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "refactor",
	toolName: "code-refactor",
	aliases: [],
	displayName: "Refactor: Improve Existing Code Safely",
	description:
		"Use when improving existing code quality, reducing technical debt, eliminating coupling, splitting oversized modules, improving performance, or hardening security of existing code. Triggers: 'refactor this', 'reduce tech debt', 'clean up', 'improve code quality', 'split this module', 'too complex'.",
	sourcePath: "src/instructions/instruction-specs.ts#refactor",
	mission:
		"Improve existing code: measure → prioritize → transform → verify. Never break working behavior.",
	inputSchema: {
		type: "object",
		properties: {
			request: {
				type: "string",
				description: "Primary task request for this workflow.",
			},
			context: {
				type: "string",
				description: "Relevant background context for the workflow.",
			},
			targetArea: {
				type: "string",
				description: "Module or surface to refactor.",
			},
			riskTolerance: {
				type: "string",
				description: "Allowed risk level for the refactor.",
			},
			physicsAnalysisJustification: {
				type: "string",
				description:
					"Why conventional analysis is insufficient and a physics-inspired pass is justified.",
			},
		},
		required: ["request"],
	},
	workflow: {
		instructionId: "refactor",
		steps: [
			{
				kind: "parallel",
				label: "MEASURE",
				steps: [
					{
						kind: "invokeSkill",
						label: "qual-code-analysis",
						skillId: "qual-code-analysis",
					},
					{
						kind: "invokeSkill",
						label: "qual-performance",
						skillId: "qual-performance",
					},
					{
						kind: "invokeSkill",
						label: "qual-security",
						skillId: "qual-security",
					},
				],
			},
			{
				kind: "parallel",
				label: "PRIORITIZE",
				steps: [
					{
						kind: "invokeSkill",
						label: "qual-refactoring-priority",
						skillId: "qual-refactoring-priority",
					},
					{
						kind: "invokeSkill",
						label: "strat-prioritization",
						skillId: "strat-prioritization",
					},
					{
						kind: "invokeSkill",
						label: "strat-tradeoff",
						skillId: "strat-tradeoff",
					},
				],
			},
			{
				kind: "parallel",
				label: "ROOT CAUSE",
				steps: [
					{
						kind: "invokeSkill",
						label: "debug-root-cause",
						skillId: "debug-root-cause",
					},
					{
						kind: "invokeSkill",
						label: "debug-assistant",
						skillId: "debug-assistant",
					},
				],
			},
			{
				kind: "gate",
				label: "PHYSICS SCAN (OPT-IN)",
				condition: "hasPhysicsJustification",
				ifTrue: [
					{
						kind: "parallel",
						label: "PHYSICS SCAN",
						steps: [
							{
								kind: "invokeSkill",
								label: "gr-geodesic-refactor",
								skillId: "gr-geodesic-refactor",
							},
							{
								kind: "invokeSkill",
								label: "gr-neutron-star-compactor",
								skillId: "gr-neutron-star-compactor",
							},
							{
								kind: "invokeSkill",
								label: "gr-tidal-force-analyzer",
								skillId: "gr-tidal-force-analyzer",
							},
							{
								kind: "invokeSkill",
								label: "gr-schwarzschild-classifier",
								skillId: "gr-schwarzschild-classifier",
							},
							{
								kind: "invokeSkill",
								label: "gr-event-horizon-detector",
								skillId: "gr-event-horizon-detector",
							},
							{
								kind: "invokeSkill",
								label: "gr-spacetime-debt-metric",
								skillId: "gr-spacetime-debt-metric",
							},
							{
								kind: "invokeSkill",
								label: "gr-dark-energy-forecaster",
								skillId: "gr-dark-energy-forecaster",
							},
							{
								kind: "invokeSkill",
								label: "gr-frame-dragging-detector",
								skillId: "gr-frame-dragging-detector",
							},
							{
								kind: "invokeSkill",
								label: "gr-gravitational-wave-detector",
								skillId: "gr-gravitational-wave-detector",
							},
							{
								kind: "invokeSkill",
								label: "gr-inflation-detector",
								skillId: "gr-inflation-detector",
							},
							{
								kind: "invokeSkill",
								label: "qm-entanglement-mapper",
								skillId: "qm-entanglement-mapper",
							},
							{
								kind: "invokeSkill",
								label: "qm-hamiltonian-descent",
								skillId: "qm-hamiltonian-descent",
							},
							{
								kind: "invokeSkill",
								label: "qm-tunneling-breakthrough",
								skillId: "qm-tunneling-breakthrough",
							},
						],
					},
				],
			},
			{
				kind: "parallel",
				label: "REDESIGN",
				steps: [
					{
						kind: "invokeSkill",
						label: "arch-system",
						skillId: "arch-system",
					},
					{
						kind: "invokeSkill",
						label: "arch-reliability",
						skillId: "arch-reliability",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "TRANSFORM",
				skillId: "qual-review",
			},
			{
				kind: "invokeSkill",
				label: "DOCUMENT",
				skillId: "doc-generator",
			},
			{
				kind: "invokeSkill",
				label: "VERIFY",
				skillId: "eval-design",
			},
			{
				kind: "invokeSkill",
				label: "CONTEXT FLOW",
				skillId: "flow-context-handoff",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
	chainTo: ["test-verify", "code-review", "physics-analysis"],
	preferredModelClass: "cheap",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "once",
};

export const instructionModule = createInstructionModule(instructionManifest);
