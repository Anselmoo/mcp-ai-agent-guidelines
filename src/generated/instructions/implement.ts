// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "implement",
	toolName: "feature-implement",
	aliases: ["implement"],
	displayName: "Implement: Build New Feature or Tool",
	description:
		"Use when building a new tool, feature, endpoint, agent, workflow component, or capability from scratch. Covers the full lifecycle: requirements gathering, design decisions, code structure, tests, governance checks, and documentation. Triggers: 'build this', 'add a new', 'create a tool', 'implement feature', 'new functionality'.",
	sourcePath: "src/instructions/instruction-specs.ts#implement",
	mission:
		"Build new tools or features end-to-end: requirements → design → code → tests → docs.",
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
			deliverable: {
				type: "string",
				description: "Expected implementation deliverable.",
			},
			successCriteria: {
				type: "string",
				description: "Success criteria for the new feature or tool.",
			},
			constraints: {
				type: "array",
				description: "Technical or product constraints.",
				items: {
					type: "string",
				},
			},
		},
		required: ["request"],
	},
	workflow: {
		instructionId: "implement",
		steps: [
			{
				kind: "parallel",
				label: "REQUIREMENTS",
				steps: [
					{
						kind: "invokeSkill",
						label: "req-analysis",
						skillId: "req-analysis",
					},
					{
						kind: "invokeSkill",
						label: "req-acceptance-criteria",
						skillId: "req-acceptance-criteria",
					},
					{
						kind: "invokeSkill",
						label: "req-scope",
						skillId: "req-scope",
					},
					{
						kind: "invokeSkill",
						label: "req-ambiguity-detection",
						skillId: "req-ambiguity-detection",
					},
				],
			},
			{
				kind: "parallel",
				label: "DESIGN",
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
					{
						kind: "invokeSkill",
						label: "arch-scalability",
						skillId: "arch-scalability",
					},
					{
						kind: "invokeSkill",
						label: "arch-security",
						skillId: "arch-security",
					},
					{
						kind: "invokeSkill",
						label: "strat-tradeoff",
						skillId: "strat-tradeoff",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "PRIORITY",
				skillId: "strat-prioritization",
			},
			{
				kind: "parallel",
				label: "BUILD",
				steps: [
					{
						kind: "invokeSkill",
						label: "prompt-engineering",
						skillId: "prompt-engineering",
					},
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
				label: "COORDINATION",
				steps: [
					{
						kind: "invokeSkill",
						label: "orch-multi-agent",
						skillId: "orch-multi-agent",
					},
					{
						kind: "invokeSkill",
						label: "orch-delegation",
						skillId: "orch-delegation",
					},
				],
			},
			{
				kind: "parallel",
				label: "EVALUATION",
				steps: [
					{
						kind: "invokeSkill",
						label: "eval-design",
						skillId: "eval-design",
					},
					{
						kind: "invokeSkill",
						label: "bench-eval-suite",
						skillId: "bench-eval-suite",
					},
				],
			},
			{
				kind: "parallel",
				label: "GOVERNANCE",
				steps: [
					{
						kind: "invokeSkill",
						label: "gov-policy-validation",
						skillId: "gov-policy-validation",
					},
					{
						kind: "invokeSkill",
						label: "gov-model-governance",
						skillId: "gov-model-governance",
					},
					{
						kind: "invokeSkill",
						label: "gov-model-compatibility",
						skillId: "gov-model-compatibility",
					},
					{
						kind: "invokeSkill",
						label: "gov-data-guardrails",
						skillId: "gov-data-guardrails",
					},
					{
						kind: "invokeSkill",
						label: "gov-prompt-injection-hardening",
						skillId: "gov-prompt-injection-hardening",
					},
				],
			},
			{
				kind: "parallel",
				label: "DOCS",
				steps: [
					{
						kind: "invokeSkill",
						label: "doc-api",
						skillId: "doc-api",
					},
					{
						kind: "invokeSkill",
						label: "doc-generator",
						skillId: "doc-generator",
					},
					{
						kind: "invokeSkill",
						label: "doc-readme",
						skillId: "doc-readme",
					},
				],
			},
			{
				kind: "parallel",
				label: "CONTEXT FLOW",
				steps: [
					{
						kind: "invokeSkill",
						label: "flow-context-handoff",
						skillId: "flow-context-handoff",
					},
					{
						kind: "invokeSkill",
						label: "flow-orchestrator",
						skillId: "flow-orchestrator",
					},
				],
			},
			{
				kind: "parallel",
				label: "DEBUGGING",
				steps: [
					{
						kind: "invokeSkill",
						label: "debug-assistant",
						skillId: "debug-assistant",
					},
					{
						kind: "invokeSkill",
						label: "debug-reproduction",
						skillId: "debug-reproduction",
					},
				],
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
	chainTo: ["test-verify", "code-review"],
	preferredModelClass: "strong",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "once",
};

export const instructionModule = createInstructionModule(instructionManifest);
