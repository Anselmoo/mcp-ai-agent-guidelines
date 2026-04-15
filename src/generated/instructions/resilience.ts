// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "resilience",
	toolName: "fault-resilience",
	aliases: [],
	displayName: "Resilience: Self-Healing and Fault Tolerance",
	description:
		"ONLY use when adding structural fault tolerance to an AI workflow, designing retry and fallback strategies, isolating failures from cascading, running N-version redundancy for reliability, implementing self-healing prompts, or adding quality gates that recover automatically from degraded output. Do NOT use for debugging individual errors (use debug), code quality issues (use review), or general fault-finding. Triggers: 'make this more reliable', 'add fault tolerance', 'self-healing', 'reduce hallucinations structurally', 'N-version redundancy', 'retry strategy', 'fallback design'.",
	sourcePath: "src/instructions/instruction-specs.ts#resilience",
	mission:
		"Monitor → detect → isolate → repair → validate. Workflows that recover themselves.",
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
			qualityFloor: {
				type: "string",
				description: "Target minimum quality threshold.",
			},
			latencyCeiling: {
				type: "string",
				description: "Target latency ceiling.",
			},
			costCeiling: {
				type: "string",
				description: "Target cost ceiling.",
			},
		},
		required: ["request"],
	},
	workflow: {
		instructionId: "resilience",
		steps: [
			{
				kind: "parallel",
				label: "MONITOR",
				steps: [
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
				kind: "invokeSkill",
				label: "DETECT",
				skillId: "resil-homeostatic",
			},
			{
				kind: "invokeSkill",
				label: "ISOLATE",
				skillId: "resil-membrane",
			},
			{
				kind: "invokeSkill",
				label: "REPAIR",
				skillId: "resil-clone-mutate",
			},
			{
				kind: "invokeSkill",
				label: "REDUNDANCY",
				skillId: "resil-redundant-voter",
			},
			{
				kind: "invokeSkill",
				label: "LEARN",
				skillId: "resil-replay",
			},
			{
				kind: "invokeSkill",
				label: "ROOT CAUSE",
				skillId: "debug-root-cause",
			},
			{
				kind: "invokeSkill",
				label: "COMPLIANCE",
				skillId: "gov-workflow-compliance",
			},
			{
				kind: "parallel",
				label: "COORDINATION",
				steps: [
					{
						kind: "invokeSkill",
						label: "orch-agent-orchestrator",
						skillId: "orch-agent-orchestrator",
					},
					{
						kind: "invokeSkill",
						label: "orch-multi-agent",
						skillId: "orch-multi-agent",
					},
				],
			},
			{
				kind: "parallel",
				label: "ADAPTIVE",
				steps: [
					{
						kind: "invokeSkill",
						label: "adapt-aco-router",
						skillId: "adapt-aco-router",
					},
					{
						kind: "invokeSkill",
						label: "adapt-hebbian-router",
						skillId: "adapt-hebbian-router",
					},
					{
						kind: "invokeSkill",
						label: "adapt-quorum",
						skillId: "adapt-quorum",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "CONTEXT",
				skillId: "flow-context-handoff",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
	chainTo: ["policy-govern", "quality-evaluate"],
	preferredModelClass: "strong",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "once",
};

export const instructionModule = createInstructionModule(instructionManifest);
