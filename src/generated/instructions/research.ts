// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "research",
	toolName: "evidence-research",
	aliases: [],
	displayName: "Research: Synthesis, Comparison, and Recommendations",
	description:
		"Use when gathering information from multiple sources, comparing tools or approaches, synthesizing evidence into a structured summary, framing a recommendation with clear rationale, or answering questions that require surveying a landscape before deciding. This is the primary tool for information gathering and comparison — use this instead of adapt or orchestrate for research tasks. Triggers: 'research this', 'compare these options', 'what should we use', 'gather evidence', 'synthesize findings', 'recommendation on'.",
	sourcePath: "src/instructions/instruction-specs.ts#research",
	mission:
		"Gather → compare → synthesize → frame. Every research output ends with a structured recommendation.",
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
			comparisonAxes: {
				type: "array",
				description: "Axes for comparison or synthesis.",
				items: {
					type: "string",
				},
			},
			decisionGoal: {
				type: "string",
				description: "Decision this research should support.",
			},
		},
		required: ["request"],
	},
	workflow: {
		instructionId: "research",
		steps: [
			{
				kind: "invokeSkill",
				label: "GATHER",
				skillId: "synth-research",
			},
			{
				kind: "invokeSkill",
				label: "COMPARE",
				skillId: "synth-comparative",
			},
			{
				kind: "parallel",
				label: "BENCHMARK",
				steps: [
					{
						kind: "invokeSkill",
						label: "bench-analyzer",
						skillId: "bench-analyzer",
					},
					{
						kind: "invokeSkill",
						label: "bench-blind-comparison",
						skillId: "bench-blind-comparison",
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
				label: "SYNTHESIZE",
				skillId: "synth-engine",
			},
			{
				kind: "parallel",
				label: "ADVISE",
				steps: [
					{
						kind: "invokeSkill",
						label: "strat-advisor",
						skillId: "strat-advisor",
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
				label: "RECOMMEND",
				skillId: "synth-recommendation",
			},
			{
				kind: "parallel",
				label: "LEADERSHIP",
				steps: [
					{
						kind: "invokeSkill",
						label: "lead-exec-briefing",
						skillId: "lead-exec-briefing",
					},
					{
						kind: "invokeSkill",
						label: "lead-capability-mapping",
						skillId: "lead-capability-mapping",
					},
				],
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
	chainTo: [
		"strategy-plan",
		"system-design",
		"enterprise-strategy",
		"physics-analysis",
	],
	preferredModelClass: "strong",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "once",
};

export const instructionModule = createInstructionModule(instructionManifest);
