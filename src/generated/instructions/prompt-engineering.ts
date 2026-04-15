// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "prompt-engineering",
	toolName: "prompt-engineering",
	aliases: [],
	displayName: "Prompt Engineering: Build, Evaluate, and Optimize Prompts",
	description:
		"Use when writing a new system prompt, building a prompt template, improving an existing prompt that is failing or hallucinating, versioning prompts, chaining prompts into pipelines, calibrating agent autonomy levels, or evaluating prompt quality against benchmarks. Triggers: 'write a system prompt', 'improve this prompt', 'prompt is hallucinating', 'prompt template', 'chain these prompts', 'calibrate autonomy', 'prompt version'.",
	sourcePath: "src/instructions/instruction-specs.ts#prompt-engineering",
	mission:
		"Structure → test → refine → version. Every prompt is a versioned, tested artifact.",
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
			promptTarget: {
				type: "string",
				description: "Prompt or prompt family being changed.",
			},
			benchmarkGoal: {
				type: "string",
				description: "Desired prompt benchmark objective.",
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
		instructionId: "prompt-engineering",
		steps: [
			{
				kind: "invokeSkill",
				label: "STRUCTURE",
				skillId: "prompt-engineering",
			},
			{
				kind: "invokeSkill",
				label: "HIERARCHY",
				skillId: "prompt-hierarchy",
			},
			{
				kind: "invokeSkill",
				label: "CHAIN",
				skillId: "prompt-chaining",
			},
			{
				kind: "invokeSkill",
				label: "SECURITY",
				skillId: "gov-prompt-injection-hardening",
			},
			{
				kind: "parallel",
				label: "EVALUATE",
				steps: [
					{
						kind: "invokeSkill",
						label: "eval-prompt",
						skillId: "eval-prompt",
					},
					{
						kind: "invokeSkill",
						label: "eval-prompt-bench",
						skillId: "eval-prompt-bench",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "GRADE OUTPUT",
				skillId: "eval-output-grading",
			},
			{
				kind: "invokeSkill",
				label: "BLIND COMPARE",
				skillId: "bench-blind-comparison",
			},
			{
				kind: "invokeSkill",
				label: "COMPARE",
				skillId: "synth-comparative",
			},
			{
				kind: "invokeSkill",
				label: "REFINE",
				skillId: "prompt-refinement",
			},
			{
				kind: "gate",
				label: "QM TOOLS (OPT-IN)",
				condition: "hasPhysicsJustification",
				ifTrue: [
					{
						kind: "parallel",
						label: "QM TOOLS",
						steps: [
							{
								kind: "invokeSkill",
								label: "qm-superposition-generator",
								skillId: "qm-superposition-generator",
							},
							{
								kind: "invokeSkill",
								label: "qm-bloch-interpolator",
								skillId: "qm-bloch-interpolator",
							},
							{
								kind: "invokeSkill",
								label: "qm-double-slit-interference",
								skillId: "qm-double-slit-interference",
							},
							{
								kind: "invokeSkill",
								label: "qm-phase-kickback-reviewer",
								skillId: "qm-phase-kickback-reviewer",
							},
							{
								kind: "invokeSkill",
								label: "qm-measurement-collapse",
								skillId: "qm-measurement-collapse",
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
	chainTo: ["quality-evaluate", "policy-govern"],
	preferredModelClass: "cheap",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "once",
};

export const instructionModule = createInstructionModule(instructionManifest);
