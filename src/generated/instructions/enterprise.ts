// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "enterprise",
	toolName: "enterprise-strategy",
	aliases: [],
	displayName: "Enterprise: Leadership and Enterprise Scale",
	description:
		"Use when designing enterprise AI platforms, mapping capability gaps across an organization, creating transformation roadmaps, preparing executive briefings, mentoring staff engineers, providing distinguished-engineer-level architectural review, or framing multi-year AI strategy. Triggers: 'enterprise AI strategy', 'executive briefing', 'transformation roadmap', 'capability map', 'AI platform design', 'staff engineering', 'distinguished engineer review', 'organisation-wide'.",
	sourcePath: "src/instructions/instruction-specs.ts#enterprise",
	mission:
		"Vision → capability map → transformation roadmap → governance. AI at organisational scale.",
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
			audience: {
				type: "string",
				description: "Target enterprise or leadership audience.",
			},
			horizon: {
				type: "string",
				description: "Transformation horizon or maturity target.",
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
		instructionId: "enterprise",
		steps: [
			{
				kind: "parallel",
				label: "VISION",
				steps: [
					{
						kind: "invokeSkill",
						label: "lead-l9-engineer",
						skillId: "lead-l9-engineer",
					},
					{
						kind: "invokeSkill",
						label: "lead-digital-architect",
						skillId: "lead-digital-architect",
					},
					{
						kind: "invokeSkill",
						label: "lead-software-evangelist",
						skillId: "lead-software-evangelist",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "CAPABILITY",
				skillId: "lead-capability-mapping",
			},
			{
				kind: "parallel",
				label: "STRATEGY",
				steps: [
					{
						kind: "invokeSkill",
						label: "strat-roadmap",
						skillId: "strat-roadmap",
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
				label: "TRANSFORMATION",
				skillId: "lead-transformation-roadmap",
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
						label: "arch-scalability",
						skillId: "arch-scalability",
					},
					{
						kind: "invokeSkill",
						label: "arch-reliability",
						skillId: "arch-reliability",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "MULTI-AGENT",
				skillId: "orch-multi-agent",
			},
			{
				kind: "parallel",
				label: "GOVERNANCE",
				steps: [
					{
						kind: "invokeSkill",
						label: "gov-model-governance",
						skillId: "gov-model-governance",
					},
					{
						kind: "invokeSkill",
						label: "gov-regulated-workflow-design",
						skillId: "gov-regulated-workflow-design",
					},
				],
			},
			{
				kind: "parallel",
				label: "EVALUATE",
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
				kind: "invokeSkill",
				label: "DOCUMENT",
				skillId: "doc-generator",
			},
			{
				kind: "invokeSkill",
				label: "EXECUTIVE",
				skillId: "lead-exec-briefing",
			},
			{
				kind: "invokeSkill",
				label: "MENTOR",
				skillId: "lead-staff-mentor",
			},
			{
				kind: "invokeSkill",
				label: "RESEARCH",
				skillId: "synth-research",
			},
			{
				kind: "gate",
				label: "PHYSICS DEBT (OPT-IN)",
				condition: "hasPhysicsJustification",
				ifTrue: [
					{
						kind: "parallel",
						label: "PHYSICS DEBT",
						steps: [
							{
								kind: "invokeSkill",
								label: "gr-spacetime-debt-metric",
								skillId: "gr-spacetime-debt-metric",
							},
							{
								kind: "invokeSkill",
								label: "gr-schwarzschild-classifier",
								skillId: "gr-schwarzschild-classifier",
							},
							{
								kind: "invokeSkill",
								label: "gr-event-horizon-detector",
								skillId: "gr-event-horizon-detector",
							},
							{
								kind: "invokeSkill",
								label: "gr-penrose-diagram-mapper",
								skillId: "gr-penrose-diagram-mapper",
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
	chainTo: ["policy-govern", "system-design", "strategy-plan"],
	preferredModelClass: "strong",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "once",
};

export const instructionModule = createInstructionModule(instructionManifest);
