// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "adapt",
	toolName: "routing-adapt",
	aliases: [],
	displayName: "Adapt: Bio-Inspired Adaptive Routing",
	description:
		"ONLY use when an existing multi-agent workflow needs autonomous bio-inspired route optimization based on historical performance — e.g. Hebbian reinforcement, ant-colony pheromone trails, simulated annealing, quorum sensing, or Physarum network pruning. Disable with DISABLE_ADAPTIVE_ROUTING=true. Do NOT use for: general research, design, review, debugging, planning, implementation, code quality, documentation, or any task that does not involve bio-inspired routing algorithms. If unsure, use the specific domain tool (design, research, review, implement, etc.) instead.",
	sourcePath: "src/instructions/instruction-specs.ts#adapt",
	mission:
		"Deploy → observe → reinforce → prune → converge. Workflows that get smarter over time.",
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
			routingGoal: {
				type: "string",
				description: "Adaptive routing objective or performance goal.",
			},
			availableModels: {
				type: "array",
				description: "Available models or lanes for adaptive execution.",
				items: {
					type: "string",
				},
			},
		},
		required: ["request"],
	},
	workflow: {
		instructionId: "adapt",
		steps: [
			{
				kind: "parallel",
				label: "BASELINE",
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
				label: "OBSERVE",
				steps: [
					{
						kind: "invokeSkill",
						label: "eval-variance",
						skillId: "eval-variance",
					},
					{
						kind: "invokeSkill",
						label: "flow-orchestrator",
						skillId: "flow-orchestrator",
					},
				],
			},
			{
				kind: "note",
				label: "CHOOSE METHOD",
				note: "(see routing selector below)",
			},
			{
				kind: "parallel",
				label: "ADAPTIVE ROUTING",
				steps: [
					{
						kind: "invokeSkill",
						label: "adapt-annealing",
						skillId: "adapt-annealing",
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
				kind: "note",
				label: "DEPLOY",
				note: "adapt-<chosen> (deploy adaptive layer)",
			},
			{
				kind: "note",
				label: "REINFORCE",
				note: "adapt-<chosen> reinforcement loop",
			},
			{
				kind: "parallel",
				label: "PRUNE",
				steps: [
					{
						kind: "invokeSkill",
						label: "adapt-physarum-router",
						skillId: "adapt-physarum-router",
					},
					{
						kind: "invokeSkill",
						label: "adapt-aco-router",
						skillId: "adapt-aco-router",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "BALANCE",
				skillId: "resil-homeostatic",
			},
			{
				kind: "parallel",
				label: "TRADEOFF",
				steps: [
					{
						kind: "invokeSkill",
						label: "strat-tradeoff",
						skillId: "strat-tradeoff",
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
				label: "CONTEXT FLOW",
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
				],
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
	chainTo: ["agent-orchestrate", "quality-evaluate"],
	preferredModelClass: "strong",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "once",
};

export const instructionModule = createInstructionModule(instructionManifest);
