// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "bootstrap",
	toolName: "task-bootstrap",
	aliases: [],
	displayName: "Bootstrap: First Contact",
	description:
		"Use when starting a new task with unclear scope, before any implementation begins, when requirements are vague or ambiguous, or when the agent needs to orient itself on what the user actually wants. Covers scope clarification, requirements extraction, priority setting, and context loading. Companion tools: use `agent-snapshot-write` (refresh) or `agent-snapshot-compare` to load the codebase baseline, `agent-session-fetch` to inspect session-scoped artifacts, `agent-memory-fetch` / `agent-memory-read` for long-term artifacts, and `agent-workspace` for source-file access.",
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
		"physics-analysis",
	],
	preferredModelClass: "free",
	autoChainOnCompletion: true,
	requiredPreconditions: [
		"agent-snapshot-fetch",
		"agent-session-fetch",
		"agent-memory-fetch",
	],
	reactivationPolicy: "periodic",
};

export const instructionModule = createInstructionModule(instructionManifest);
