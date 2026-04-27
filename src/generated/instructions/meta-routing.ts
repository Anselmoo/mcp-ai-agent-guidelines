// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "meta-routing",
	toolName: "meta-routing",
	aliases: [],
	displayName: "Meta-Routing: Task Router",
	description:
		"Use at session start to classify the problem before any domain tool is called; use when a task spans multiple domains; use when instructions should run serially vs in parallel; use when escalation or cross-instruction chaining is needed. This is the master decision guide — call it when unsure which tool to use. Do NOT use for single-domain tasks where the right tool is obvious (just call the domain tool directly). Anti-patterns: do not call meta-routing for straightforward implement/debug/review requests; do not call it after every single step. Companion tools: use `graph-visualize` (chain-graph) to inspect instruction chains and routing topology. Triggers: 'not sure which tool', 'multi-domain task', 'how should I approach this', 'route this request', 'classify the problem', 'session start', 'orient myself'.",
	sourcePath: "src/instructions/instruction-specs.ts#meta-routing",
	mission:
		"Decide which instruction(s) to invoke, in what order, and how to chain them for compound or ambiguous tasks.",
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
			taskType: {
				type: "string",
				description: "Task type or uncertainty about routing.",
			},
			currentPhase: {
				type: "string",
				description: "Current phase if routing an in-flight task.",
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
		instructionId: "meta-routing",
		steps: [
			{
				kind: "invokeSkill",
				label: "req-ambiguity-detection",
				skillId: "req-ambiguity-detection",
			},
			{
				kind: "invokeSkill",
				label: "req-scope",
				skillId: "req-scope",
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
			{
				kind: "invokeSkill",
				label: "debug-root-cause",
				skillId: "debug-root-cause",
			},
			{
				kind: "invokeSkill",
				label: "qual-refactoring-priority",
				skillId: "qual-refactoring-priority",
			},
			{
				kind: "invokeSkill",
				label: "arch-system",
				skillId: "arch-system",
			},
			{
				kind: "invokeSkill",
				label: "eval-design",
				skillId: "eval-design",
			},
			{
				kind: "invokeSkill",
				label: "gov-policy-validation",
				skillId: "gov-policy-validation",
			},
			{
				kind: "invokeSkill",
				label: "adapt-aco-router",
				skillId: "adapt-aco-router",
			},
			{
				kind: "invokeSkill",
				label: "resil-redundant-voter",
				skillId: "resil-redundant-voter",
			},
			{
				kind: "invokeSkill",
				label: "lead-l9-engineer",
				skillId: "lead-l9-engineer",
			},
			{
				kind: "invokeSkill",
				label: "prompt-hierarchy",
				skillId: "prompt-hierarchy",
			},
			{
				kind: "gate",
				label: "PHYSICS TOOLS (OPT-IN)",
				condition: "hasPhysicsJustification",
				ifTrue: [
					{
						kind: "parallel",
						label: "PHYSICS TOOLS",
						steps: [
							{
								kind: "invokeSkill",
								label: "qm-superposition-generator",
								skillId: "qm-superposition-generator",
							},
							{
								kind: "invokeSkill",
								label: "gr-spacetime-debt-metric",
								skillId: "gr-spacetime-debt-metric",
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
	chainTo: [],
	preferredModelClass: "cheap",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "session-start",
};

export const instructionModule = createInstructionModule(instructionManifest);
