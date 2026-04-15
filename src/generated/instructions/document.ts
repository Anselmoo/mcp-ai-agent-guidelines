// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "document",
	toolName: "docs-generate",
	aliases: [],
	displayName: "Document: Generate Documentation Artifacts",
	description:
		"Use when generating API reference documentation, README files, operational runbooks, postmortems, technical guides, or any other documentation artifact. Triggers: 'write documentation', 'generate docs', 'create a README', 'document this API', 'write a runbook', 'document this module', 'postmortem for', 'technical guide'.",
	sourcePath: "src/instructions/instruction-specs.ts#document",
	mission:
		"Identify audience → choose format → generate content → publish. Every doc is audience-targeted.",
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
				description: "Intended documentation audience.",
			},
			format: {
				type: "string",
				description: "Requested documentation format.",
			},
		},
		required: ["request"],
	},
	workflow: {
		instructionId: "document",
		steps: [
			{
				kind: "invokeSkill",
				label: "AUDIENCE",
				skillId: "req-analysis",
			},
			{
				kind: "invokeSkill",
				label: "ACCEPTANCE",
				skillId: "req-acceptance-criteria",
			},
			{
				kind: "invokeSkill",
				label: "SYNTHESIZE",
				skillId: "orch-result-synthesis",
			},
			{
				kind: "invokeSkill",
				label: "RECOMMEND",
				skillId: "synth-recommendation",
			},
			{
				kind: "parallel",
				label: "CHOOSE FORMAT",
				steps: [
					{
						kind: "invokeSkill",
						label: "doc-api",
						skillId: "doc-api",
					},
					{
						kind: "invokeSkill",
						label: "doc-readme",
						skillId: "doc-readme",
					},
					{
						kind: "invokeSkill",
						label: "doc-generator",
						skillId: "doc-generator",
					},
					{
						kind: "invokeSkill",
						label: "doc-runbook",
						skillId: "doc-runbook",
					},
					{
						kind: "invokeSkill",
						label: "debug-postmortem",
						skillId: "debug-postmortem",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "REVIEW",
				skillId: "qual-review",
			},
			{
				kind: "invokeSkill",
				label: "GRADE",
				skillId: "eval-output-grading",
			},
			{
				kind: "invokeSkill",
				label: "MENTOR",
				skillId: "lead-staff-mentor",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
	chainTo: ["code-review", "enterprise-strategy"],
	preferredModelClass: "cheap",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "once",
};

export const instructionModule = createInstructionModule(instructionManifest);
