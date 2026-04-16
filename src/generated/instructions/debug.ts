// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "debug",
	toolName: "issue-debug",
	aliases: [],
	displayName: "Debug: Diagnose and Fix Problems",
	description:
		"Use when something is broken, producing wrong output, crashing, behaving unexpectedly, or when you need to trace a failure to its root cause. Triggers: 'something is broken', 'this is failing', 'why does this crash', 'unexpected output', 'trace this error', 'find the bug'.",
	sourcePath: "src/instructions/instruction-specs.ts#debug",
	mission:
		"Diagnose and fix problems: reproduce → locate → understand → fix → prevent recurrence.",
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
			failureMode: {
				type: "string",
				description: "Observed failure or incorrect behavior.",
			},
			reproduction: {
				type: "string",
				description: "Reproduction details or minimal failing case.",
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
		instructionId: "debug",
		steps: [
			{
				kind: "invokeSkill",
				label: "REPRODUCE",
				skillId: "debug-reproduction",
			},
			{
				kind: "invokeSkill",
				label: "LOCATE",
				skillId: "debug-assistant",
			},
			{
				kind: "invokeSkill",
				label: "ROOT CAUSE",
				skillId: "debug-root-cause",
			},
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
						label: "eval-output-grading",
						skillId: "eval-output-grading",
					},
					{
						kind: "invokeSkill",
						label: "eval-variance",
						skillId: "eval-variance",
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
								label: "qm-decoherence-sentinel",
								skillId: "qm-decoherence-sentinel",
							},
							{
								kind: "invokeSkill",
								label: "qm-entanglement-mapper",
								skillId: "qm-entanglement-mapper",
							},
							{
								kind: "invokeSkill",
								label: "qm-uncertainty-tradeoff",
								skillId: "qm-uncertainty-tradeoff",
							},
							{
								kind: "invokeSkill",
								label: "qm-heisenberg-picture",
								skillId: "qm-heisenberg-picture",
							},
							{
								kind: "invokeSkill",
								label: "gr-frame-dragging-detector",
								skillId: "gr-frame-dragging-detector",
							},
						],
					},
				],
			},
			{
				kind: "invokeInstruction",
				label: "FIX",
				instructionId: "implement",
			},
			{
				kind: "invokeSkill",
				label: "POSTMORTEM",
				skillId: "debug-postmortem",
			},
			{
				kind: "invokeSkill",
				label: "PREVENT",
				skillId: "debug-root-cause",
			},
			{
				kind: "invokeSkill",
				label: "MODE SWITCH",
				skillId: "flow-mode-switching",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
	chainTo: ["test-verify", "code-refactor", "policy-govern"],
	preferredModelClass: "cheap",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "once",
};

export const instructionModule = createInstructionModule(instructionManifest);
