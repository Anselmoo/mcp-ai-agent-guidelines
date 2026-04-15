// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "evaluate",
	toolName: "quality-evaluate",
	aliases: [],
	displayName: "Evaluate: Benchmark and Assess Quality",
	description:
		"Use when benchmarking AI system quality, measuring output consistency, running eval suites, comparing model versions, detecting quality regressions, grading outputs against rubrics, or generating evaluation reports. Triggers: 'benchmark this', 'run evals', 'measure quality', 'compare model outputs', 'quality gate', 'detect regression', 'grade these outputs', 'eval suite'.",
	sourcePath: "src/instructions/instruction-specs.ts#evaluate",
	mission:
		"Define metrics → measure → compare → report → act. Every evaluation produces a decision or action.",
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
			metricGoal: {
				type: "string",
				description: "Primary metric or benchmark objective.",
			},
			baseline: {
				type: "string",
				description: "Baseline system or comparison point.",
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
		instructionId: "evaluate",
		steps: [
			{
				kind: "invokeSkill",
				label: "DEFINE",
				skillId: "eval-design",
			},
			{
				kind: "invokeSkill",
				label: "GRADE",
				skillId: "eval-output-grading",
			},
			{
				kind: "invokeSkill",
				label: "BENCHMARK",
				skillId: "eval-prompt-bench",
			},
			{
				kind: "invokeSkill",
				label: "BLIND COMPARE",
				skillId: "bench-blind-comparison",
			},
			{
				kind: "invokeSkill",
				label: "ANALYZE",
				skillId: "bench-analyzer",
			},
			{
				kind: "invokeSkill",
				label: "SUITE",
				skillId: "bench-eval-suite",
			},
			{
				kind: "parallel",
				label: "VARIANCE",
				steps: [
					{
						kind: "invokeSkill",
						label: "eval-variance",
						skillId: "eval-variance",
					},
					{
						kind: "invokeSkill",
						label: "eval-prompt",
						skillId: "eval-prompt",
					},
				],
			},
			{
				kind: "gate",
				label: "PHYSICS METRICS (OPT-IN)",
				condition: "hasPhysicsJustification",
				ifTrue: [
					{
						kind: "invokeSkill",
						label: "COVERAGE",
						skillId: "qm-wavefunction-coverage",
					},
					{
						kind: "parallel",
						label: "QM METRICS",
						steps: [
							{
								kind: "invokeSkill",
								label: "qm-hamiltonian-descent",
								skillId: "qm-hamiltonian-descent",
							},
							{
								kind: "invokeSkill",
								label: "qm-heisenberg-picture",
								skillId: "qm-heisenberg-picture",
							},
							{
								kind: "invokeSkill",
								label: "qm-uncertainty-tradeoff",
								skillId: "qm-uncertainty-tradeoff",
							},
							{
								kind: "invokeSkill",
								label: "qm-path-integral-historian",
								skillId: "qm-path-integral-historian",
							},
						],
					},
				],
			},
			{
				kind: "parallel",
				label: "RESEARCH",
				steps: [
					{
						kind: "invokeSkill",
						label: "synth-comparative",
						skillId: "synth-comparative",
					},
					{
						kind: "invokeSkill",
						label: "synth-research",
						skillId: "synth-research",
					},
					{
						kind: "invokeSkill",
						label: "synth-engine",
						skillId: "synth-engine",
					},
				],
			},
			{
				kind: "parallel",
				label: "RESILIENCE",
				steps: [
					{
						kind: "invokeSkill",
						label: "resil-redundant-voter",
						skillId: "resil-redundant-voter",
					},
					{
						kind: "invokeSkill",
						label: "resil-replay",
						skillId: "resil-replay",
					},
				],
			},
			{
				kind: "parallel",
				label: "CODE QUALITY",
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
				],
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
	chainTo: [
		"prompt-engineering",
		"code-refactor",
		"policy-govern",
		"physics-analysis",
	],
	preferredModelClass: "reviewer",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "once",
};

export const instructionModule = createInstructionModule(instructionManifest);
