// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "plan",
	toolName: "strategy-plan",
	aliases: [],
	displayName: "Plan: Strategy, Roadmap, and Sprint Planning",
	description:
		"Use when creating a project roadmap, running sprint planning, prioritizing a backlog, mapping capability gaps, sequencing technical investments, estimating effort, or framing strategic recommendations for leadership. Triggers: 'plan this sprint', 'roadmap for', 'prioritize the backlog', 'strategy for', 'capability map', 'what do we do next', 'sequence this work'.",
	sourcePath: "src/instructions/instruction-specs.ts#plan",
	mission:
		"Prioritize → sequence → estimate → commit. Every plan produces concrete next actions.",
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
			horizon: {
				type: "string",
				description: "Planning horizon such as sprint, quarter, or year.",
			},
			dependencies: {
				type: "array",
				description: "Known dependencies that constrain sequencing.",
				items: {
					type: "string",
				},
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
		instructionId: "plan",
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
						label: "synth-recommendation",
						skillId: "synth-recommendation",
					},
				],
			},
			{
				kind: "parallel",
				label: "PRIORITIZE",
				steps: [
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
						label: "strat-advisor",
						skillId: "strat-advisor",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "DELEGATE",
				skillId: "orch-delegation",
			},
			{
				kind: "parallel",
				label: "LEADERSHIP",
				steps: [
					{
						kind: "invokeSkill",
						label: "lead-transformation-roadmap",
						skillId: "lead-transformation-roadmap",
					},
					{
						kind: "invokeSkill",
						label: "lead-capability-mapping",
						skillId: "lead-capability-mapping",
					},
					{
						kind: "invokeSkill",
						label: "lead-l9-engineer",
						skillId: "lead-l9-engineer",
					},
					{
						kind: "invokeSkill",
						label: "lead-exec-briefing",
						skillId: "lead-exec-briefing",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "EVAL DESIGN",
				skillId: "eval-design",
			},
			{
				kind: "invokeSkill",
				label: "RUNBOOK",
				skillId: "doc-runbook",
			},
			{
				kind: "invokeSkill",
				label: "ROADMAP",
				skillId: "strat-roadmap",
			},
			{
				kind: "gate",
				label: "QM PLANNING (OPT-IN)",
				condition: "hasPhysicsJustification",
				ifTrue: [
					{
						kind: "parallel",
						label: "QM PLANNING",
						steps: [
							{
								kind: "invokeSkill",
								label: "qm-schrodinger-picture",
								skillId: "qm-schrodinger-picture",
							},
							{
								kind: "invokeSkill",
								label: "qm-tunneling-breakthrough",
								skillId: "qm-tunneling-breakthrough",
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
	chainTo: ["feature-implement", "enterprise-strategy", "evidence-research"],
	preferredModelClass: "strong",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "once",
};

export const instructionModule = createInstructionModule(instructionManifest);
