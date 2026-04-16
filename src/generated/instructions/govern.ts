// AUTO-GENERATED — do not edit manually.

import type { InstructionManifestEntry } from "../../contracts/generated.js";
import { createInstructionModule } from "../../instructions/create-instruction-module.js";

export const instructionManifest: InstructionManifestEntry = {
	id: "govern",
	toolName: "policy-govern",
	aliases: [],
	displayName: "Govern: Safety, Compliance, and Guardrails",
	description:
		"Use when auditing AI workflows for policy compliance, enforcing data guardrails, validating model governance, hardening against prompt injection, designing regulated workflows, monitoring compliance drift, or remediating security and governance issues. Triggers: 'compliance check', 'safety audit', 'policy validation', 'data guardrails', 'prompt injection hardening', 'regulated workflow', 'governance review', 'model version policy'.",
	sourcePath: "src/instructions/instruction-specs.ts#govern",
	mission:
		"Audit → enforce → monitor → remediate. Zero tolerance for undetected compliance violations.",
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
			policyDomain: {
				type: "string",
				description: "Policy or regulatory domain.",
			},
			riskClass: {
				type: "string",
				description: "Risk or sensitivity class.",
			},
		},
		required: ["request"],
	},
	workflow: {
		instructionId: "govern",
		steps: [
			{
				kind: "parallel",
				label: "AUDIT",
				steps: [
					{
						kind: "invokeSkill",
						label: "gov-data-guardrails",
						skillId: "gov-data-guardrails",
					},
					{
						kind: "invokeSkill",
						label: "gov-model-governance",
						skillId: "gov-model-governance",
					},
					{
						kind: "invokeSkill",
						label: "gov-policy-validation",
						skillId: "gov-policy-validation",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "INJECTION",
				skillId: "gov-prompt-injection-hardening",
			},
			{
				kind: "invokeSkill",
				label: "WORKFLOW",
				skillId: "gov-workflow-compliance",
			},
			{
				kind: "invokeSkill",
				label: "REGULATED",
				skillId: "gov-regulated-workflow-design",
			},
			{
				kind: "invokeSkill",
				label: "COMPATIBILITY",
				skillId: "gov-model-compatibility",
			},
			{
				kind: "parallel",
				label: "SECURITY CODE",
				steps: [
					{
						kind: "invokeSkill",
						label: "arch-security",
						skillId: "arch-security",
					},
					{
						kind: "invokeSkill",
						label: "qual-security",
						skillId: "qual-security",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "ACCEPTANCE",
				skillId: "req-acceptance-criteria",
			},
			{
				kind: "parallel",
				label: "ROOT CAUSE",
				steps: [
					{
						kind: "invokeSkill",
						label: "debug-root-cause",
						skillId: "debug-root-cause",
					},
					{
						kind: "invokeSkill",
						label: "debug-postmortem",
						skillId: "debug-postmortem",
					},
				],
			},
			{
				kind: "parallel",
				label: "SELF-HEALING",
				steps: [
					{
						kind: "invokeSkill",
						label: "resil-clone-mutate",
						skillId: "resil-clone-mutate",
					},
					{
						kind: "invokeSkill",
						label: "resil-homeostatic",
						skillId: "resil-homeostatic",
					},
					{
						kind: "invokeSkill",
						label: "resil-membrane",
						skillId: "resil-membrane",
					},
				],
			},
			{
				kind: "invokeSkill",
				label: "RUNBOOK",
				skillId: "doc-runbook",
			},
			{
				kind: "finalize",
				label: "Finalize",
			},
		],
	},
	chainTo: ["code-review", "fault-resilience", "docs-generate"],
	preferredModelClass: "strong",
	autoChainOnCompletion: false,
	requiredPreconditions: [],
	reactivationPolicy: "once",
};

export const instructionModule = createInstructionModule(instructionManifest);
