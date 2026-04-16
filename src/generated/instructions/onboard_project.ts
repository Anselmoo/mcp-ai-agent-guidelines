// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "onboard_project",
	toolName: "project-onboard",
	aliases: [],
	displayName: "Onboard: Project Familiarization",
	description:
		"Use when starting a new work session, exploring what this codebase does, understanding the skill taxonomy, or getting oriented in mcp-ai-agent-guidelines for the first time. Covers project structure, skill navigation, instruction index, and verification workflow. Companion tools: use `graph-visualize` (skill-graph, chain-graph) to explore the skill topology and instruction chains; use `agent-workspace` (list) to browse source files, `agent-session` (list or fetch) to inspect session artifacts, and `agent-snapshot` (status) to confirm the current codebase baseline.",
	sourcePath: "src/instructions/instruction-specs.ts#onboard_project",
	mission: "",
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
			primaryGoal: {
				type: "string",
				description: "Immediate goal after onboarding.",
			},
		},
		required: ["request"],
	},
	workflow: {
		instructionId: "onboard_project",
		steps: [
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
			{
				kind: "invokeSkill",
				label: "synth-research",
				skillId: "synth-research",
			},
			{
				kind: "invokeSkill",
				label: "arch-system",
				skillId: "arch-system",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
	chainTo: [],
	preferredModelClass: "free",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "once",
};

export const instructionModule = createInstructionModule(instructionManifest);
