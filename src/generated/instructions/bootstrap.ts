// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "bootstrap",
	toolName: "task-bootstrap",
	aliases: [],
	displayName: "Bootstrap: First Contact",
	description:
		"Use when starting a new task or work session with unclear scope, before any implementation begins, when requirements are vague or ambiguous, when exploring what a codebase does, or when getting oriented in a project for the first time. Covers scope clarification, requirements extraction, priority setting, project orientation, and context loading. Triggers: 'start a new task', 'onboard', 'what does this project do', 'first session', 'where do I start', 'help me orient'. Example call: {\"request\": \"Onboard me: what does this repo do and where do I start on the flaky coverage gate?\"}. Companion tools (full surface only, MCP_FULL_SURFACE=true): `agent-workspace` for source-file access, `graph-visualize` (skill-graph, chain-graph) to explore the skill topology.",
	sourcePath: "src/instructions/instruction-specs.ts#bootstrap",
	mission:
		"Orient the agent, load project context, identify scope and unknowns before any implementation starts.",
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
			scope: {
				type: "string",
				description: "Known scope or uncertainty framing for the task.",
			},
			constraints: {
				type: "array",
				description: "Constraints already known at bootstrap time.",
				items: {
					type: "string",
				},
			},
		},
		required: ["request"],
	},
	workflow: {
		instructionId: "bootstrap",
		steps: [
			{
				kind: "invokeSkill",
				label: "SESSION-PRELOAD",
				skillId: "flow-context-handoff",
			},
			{
				kind: "invokeSkill",
				label: "SCOPE",
				skillId: "req-scope",
			},
			{
				kind: "invokeSkill",
				label: "AMBIGUITY",
				skillId: "req-ambiguity-detection",
			},
			{
				kind: "invokeSkill",
				label: "REQUIREMENTS",
				skillId: "req-analysis",
			},
			{
				kind: "invokeSkill",
				label: "PRIORITY",
				skillId: "strat-prioritization",
			},
			{
				kind: "invokeSkill",
				label: "CONTEXT",
				skillId: "synth-research",
			},
			{
				kind: "invokeSkill",
				label: "MODE",
				skillId: "flow-mode-switching",
			},
			{
				kind: "invokeInstruction",
				label: "ROUTING",
				instructionId: "meta-routing",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
	chainTo: [
		"meta-routing",
		"system-design",
		"feature-implement",
		"evidence-research",
		"code-review",
		"strategy-plan",
		"issue-debug",
		"code-refactor",
		"test-verify",
		"agent-orchestrate",
		"policy-govern",
		"enterprise-strategy",
	],
	preferredModelClass: "free",
	autoChainOnCompletion: true,
	requiredPreconditions: [],
	reactivationPolicy: "periodic",
};

export const instructionModule = createInstructionModule(instructionManifest);
