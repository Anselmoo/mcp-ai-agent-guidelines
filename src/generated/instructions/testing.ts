// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "testing",
	toolName: "test-verify",
	aliases: [],
	displayName: "Testing: Write, Run, and Verify Tests",
	description:
		"Use when writing unit tests, integration tests, or eval test cases; measuring test coverage; closing coverage gaps; verifying correctness of AI outputs; preventing regressions; or setting up testing infrastructure. Triggers: 'write tests', 'add tests', 'test coverage', 'regression tests', 'eval test cases', 'test this', 'verify this works'.",
	sourcePath: "src/instructions/instruction-specs.ts#testing",
	mission:
		"Write, run, and verify tests: define what to prove → choose strategy → implement → measure coverage → close gaps → prevent regression.",
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
			coverageGoal: {
				type: "string",
				description: "Desired test coverage or risk surface target.",
			},
			regressionRisk: {
				type: "string",
				description: "Known regression area or risk class.",
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
		instructionId: "testing",
		steps: [
			{
				kind: "invokeSkill",
				label: "DEFINE",
				skillId: "req-acceptance-criteria",
			},
			{
				kind: "invokeSkill",
				label: "STRATEGY",
				skillId: "eval-design",
			},
			{
				kind: "parallel",
				label: "IMPLEMENT",
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
				],
			},
			{
				kind: "parallel",
				label: "COVERAGE",
				steps: [
					{
						kind: "invokeSkill",
						label: "bench-eval-suite",
						skillId: "bench-eval-suite",
					},
					{
						kind: "invokeSkill",
						label: "bench-analyzer",
						skillId: "bench-analyzer",
					},
				],
			},
			{
				kind: "gate",
				label: "COVERAGE PHYSICS (OPT-IN)",
				condition: "hasPhysicsJustification",
				ifTrue: [
					{
						kind: "invokeSkill",
						label: "qm-wavefunction-coverage",
						skillId: "qm-wavefunction-coverage",
					},
				],
			},
			{
				kind: "parallel",
				label: "GAPS",
				steps: [
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
				],
			},
			{
				kind: "parallel",
				label: "RELIABILITY",
				steps: [
					{
						kind: "invokeSkill",
						label: "arch-reliability",
						skillId: "arch-reliability",
					},
					{
						kind: "invokeSkill",
						label: "resil-redundant-voter",
						skillId: "resil-redundant-voter",
					},
				],
			},
			{
				kind: "gate",
				label: "PHYSICS DIAGNOSTICS (OPT-IN)",
				condition: "hasPhysicsJustification",
				ifTrue: [
					{
						kind: "invokeSkill",
						label: "FLAKINESS",
						skillId: "qm-decoherence-sentinel",
					},
					{
						kind: "invokeSkill",
						label: "UNCERTAINTY",
						skillId: "qm-uncertainty-tradeoff",
					},
				],
			},
			{
				kind: "parallel",
				label: "REGRESSION",
				steps: [
					{
						kind: "invokeSkill",
						label: "debug-reproduction",
						skillId: "debug-reproduction",
					},
					{
						kind: "invokeSkill",
						label: "debug-assistant",
						skillId: "debug-assistant",
					},
					{
						kind: "invokeSkill",
						label: "debug-root-cause",
						skillId: "debug-root-cause",
					},
				],
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
						label: "eval-prompt",
						skillId: "eval-prompt",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "PERF",
				skillId: "qual-performance",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
	chainTo: ["code-review", "issue-debug", "quality-evaluate"],
	preferredModelClass: "cheap",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "once",
};

export const instructionModule = createInstructionModule(instructionManifest);
