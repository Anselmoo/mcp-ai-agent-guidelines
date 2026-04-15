// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "orchestrate",
	toolName: "agent-orchestrate",
	aliases: [],
	displayName: "Orchestrate: Compose Multi-Agent Workflows",
	description:
		"ONLY use when explicitly coordinating multiple specialized agents on a shared task, designing multi-agent pipelines, routing tasks between agents, synthesizing results from parallel agents, or managing agent handoffs and context flow. Do NOT use for single-task requests — use system-design, evidence-research, code-review, or feature-implement instead. Companion tools: use `orchestration-config` (read/write) to inspect or patch the orchestration configuration; use `model-discover` to list available models and their capabilities. Triggers: 'coordinate agents', 'multi-agent workflow', 'agent pipeline', 'assign tasks to agents', 'parallel agents', 'orchestrate this workflow'.",
	sourcePath: "src/instructions/instruction-specs.ts#orchestrate",
	mission:
		"Decompose → assign → coordinate → synthesize results. Every orchestration produces a coherent unified output.",
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
			agentCount: {
				type: "string",
				description: "Expected number of participating agents.",
			},
			routingGoal: {
				type: "string",
				description: "Primary orchestration or routing objective.",
			},
		},
		required: ["request"],
	},
	workflow: {
		instructionId: "orchestrate",
		steps: [
			{
				kind: "invokeSkill",
				label: "SCOPE",
				skillId: "req-scope",
			},
			{
				kind: "invokeSkill",
				label: "DECOMPOSE",
				skillId: "orch-multi-agent",
			},
			{
				kind: "invokeSkill",
				label: "ASSIGN",
				skillId: "orch-delegation",
			},
			{
				kind: "parallel",
				label: "FLOW",
				steps: [
					{
						kind: "invokeSkill",
						label: "flow-context-handoff",
						skillId: "flow-context-handoff",
					},
					{
						kind: "invokeSkill",
						label: "flow-mode-switching",
						skillId: "flow-mode-switching",
					},
					{
						kind: "invokeSkill",
						label: "flow-orchestrator",
						skillId: "flow-orchestrator",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "COORDINATE",
				skillId: "orch-agent-orchestrator",
			},
			{
				kind: "parallel",
				label: "COMPLIANCE",
				steps: [
					{
						kind: "invokeSkill",
						label: "gov-workflow-compliance",
						skillId: "gov-workflow-compliance",
					},
					{
						kind: "invokeSkill",
						label: "gov-data-guardrails",
						skillId: "gov-data-guardrails",
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
						label: "adapt-physarum-router",
						skillId: "adapt-physarum-router",
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
				label: "PRIORITY",
				skillId: "strat-prioritization",
			},
			{
				kind: "invokeSkill",
				label: "SYNTHESIZE",
				skillId: "orch-result-synthesis",
			},
			{
				kind: "invokeSkill",
				label: "EVALUATE",
				skillId: "eval-design",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
	chainTo: ["quality-evaluate", "fault-resilience"],
	preferredModelClass: "strong",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "once",
};

export const instructionModule = createInstructionModule(instructionManifest);
