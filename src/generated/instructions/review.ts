// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "review",
	toolName: "code-review",
	aliases: ["review"],
	displayName: "Review: Code, Quality, and Security Review",
	description:
		"Use when reviewing existing code for quality, security vulnerabilities, correctness, maintainability, API surface hygiene, compliance adherence, or evaluation output grading. This is the primary tool for code review and quality assessment — use this instead of adapt or orchestrate for review tasks. Triggers: 'review this code', 'code review', 'check for security issues', 'quality review', 'audit this', 'grade this output', 'inspect this PR'.",
	sourcePath: "src/instructions/instruction-specs.ts#review",
	mission:
		"Inspect → grade → recommend → close the loop. Every review produces actionable findings.",
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
			artifact: {
				type: "string",
				description: "Artifact, branch, or change set to review.",
			},
			focusAreas: {
				type: "array",
				description: "Specific areas to emphasize during review.",
				items: {
					type: "string",
				},
			},
			severityThreshold: {
				type: "string",
				description: "Minimum severity level to report.",
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
		instructionId: "review",
		steps: [
			{
				kind: "parallel",
				label: "QUALITY",
				steps: [
					{
						kind: "invokeSkill",
						label: "qual-code-analysis",
						skillId: "qual-code-analysis",
					},
					{
						kind: "invokeSkill",
						label: "qual-review",
						skillId: "qual-review",
					},
					{
						kind: "invokeSkill",
						label: "qual-performance",
						skillId: "qual-performance",
					},
				],
			},
			{
				kind: "parallel",
				label: "SECURITY",
				steps: [
					{
						kind: "invokeSkill",
						label: "qual-security",
						skillId: "qual-security",
					},
					{
						kind: "invokeSkill",
						label: "gov-policy-validation",
						skillId: "gov-policy-validation",
					},
					{
						kind: "invokeSkill",
						label: "gov-workflow-compliance",
						skillId: "gov-workflow-compliance",
					},
					{
						kind: "invokeSkill",
						label: "gov-model-governance",
						skillId: "gov-model-governance",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "ACCEPTANCE",
				skillId: "req-acceptance-criteria",
			},
			{
				kind: "parallel",
				label: "OUTPUT GRADE",
				steps: [
					{
						kind: "invokeSkill",
						label: "eval-output-grading",
						skillId: "eval-output-grading",
					},
					{
						kind: "invokeSkill",
						label: "eval-prompt-bench",
						skillId: "eval-prompt-bench",
					},
					{
						kind: "invokeSkill",
						label: "eval-variance",
						skillId: "eval-variance",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "API SURFACE",
				skillId: "doc-api",
			},
			{
				kind: "invokeSkill",
				label: "RECOMMEND",
				skillId: "synth-recommendation",
			},
			{
				kind: "gate",
				label: "PHYSICS AUDIT (OPT-IN)",
				condition: "hasPhysicsJustification",
				ifTrue: [
					{
						kind: "parallel",
						label: "PHYSICS AUDIT",
						steps: [
							{
								kind: "invokeSkill",
								label: "qm-wavefunction-coverage",
								skillId: "qm-wavefunction-coverage",
							},
							{
								kind: "invokeSkill",
								label: "qm-entanglement-mapper",
								skillId: "qm-entanglement-mapper",
							},
							{
								kind: "invokeSkill",
								label: "qm-decoherence-sentinel",
								skillId: "qm-decoherence-sentinel",
							},
							{
								kind: "invokeSkill",
								label: "qm-uncertainty-tradeoff",
								skillId: "qm-uncertainty-tradeoff",
							},
							{
								kind: "invokeSkill",
								label: "gr-hawking-entropy-auditor",
								skillId: "gr-hawking-entropy-auditor",
							},
							{
								kind: "invokeSkill",
								label: "gr-schwarzschild-classifier",
								skillId: "gr-schwarzschild-classifier",
							},
							{
								kind: "invokeSkill",
								label: "gr-gravitational-wave-detector",
								skillId: "gr-gravitational-wave-detector",
							},
							{
								kind: "invokeSkill",
								label: "gr-equivalence-principle-checker",
								skillId: "gr-equivalence-principle-checker",
							},
							{
								kind: "invokeSkill",
								label: "gr-redshift-velocity-mapper",
								skillId: "gr-redshift-velocity-mapper",
							},
						],
					},
				],
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
	chainTo: [
		"policy-govern",
		"code-refactor",
		"test-verify",
		"physics-analysis",
	],
	preferredModelClass: "reviewer",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "once",
};

export const instructionModule = createInstructionModule(instructionManifest);
