// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "design",
	toolName: "system-design",
	aliases: [],
	displayName: "Design: Architecture and System Design",
	description:
		"Use when designing a new system, service, agent architecture, data pipeline, or infrastructure component; evaluating architectural options; making build-vs-buy decisions; or establishing constraints and tradeoffs before coding begins. This is the primary tool for architecture work — use this instead of adapt or orchestrate for system design tasks. Companion tools: use `graph-visualize` (chain-graph, skill-graph) to inspect the instruction chain and skill topology. Triggers: 'design this system', 'architecture for', 'how should we structure', 'system design', 'greenfield', 'architectural decision'.",
	sourcePath: "src/instructions/instruction-specs.ts#design",
	mission:
		"Understand constraints → explore options → decide → document. Produces a decision-backed architecture.",
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
			constraints: {
				type: "array",
				description: "Architecture constraints and non-negotiables.",
				items: {
					type: "string",
				},
			},
			successCriteria: {
				type: "string",
				description: "What success looks like for the architecture.",
			},
		},
		required: ["request"],
	},
	workflow: {
		instructionId: "design",
		steps: [
			{
				kind: "parallel",
				label: "CONSTRAINTS",
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
				],
			},
			{
				kind: "parallel",
				label: "RESEARCH",
				steps: [
					{
						kind: "invokeSkill",
						label: "synth-research",
						skillId: "synth-research",
					},
					{
						kind: "invokeSkill",
						label: "synth-comparative",
						skillId: "synth-comparative",
					},
				],
			},
			{
				kind: "parallel",
				label: "OPTIONS",
				steps: [
					{
						kind: "invokeSkill",
						label: "strat-tradeoff",
						skillId: "strat-tradeoff",
					},
					{
						kind: "invokeSkill",
						label: "strat-advisor",
						skillId: "strat-advisor",
					},
				],
			},
			{
				kind: "parallel",
				label: "ARCHITECTURE",
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
				],
			},
			{
				kind: "invokeSkill",
				label: "MULTI-AGENT",
				skillId: "orch-multi-agent",
			},
			{
				kind: "invokeSkill",
				label: "EVALUATION",
				skillId: "eval-design",
			},
			{
				kind: "invokeSkill",
				label: "LEADERSHIP",
				skillId: "lead-digital-architect",
			},
			{
				kind: "invokeSkill",
				label: "COMPLIANCE",
				skillId: "gov-regulated-workflow-design",
			},
			{
				kind: "invokeSkill",
				label: "ROADMAP",
				skillId: "strat-roadmap",
			},
			{
				kind: "invokeSkill",
				label: "DOCUMENT",
				skillId: "doc-generator",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
	chainTo: ["feature-implement", "policy-govern"],
	preferredModelClass: "strong",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "once",
};

export const instructionModule = createInstructionModule(instructionManifest);
