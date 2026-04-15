import { doc_runbook_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildEvalCriteriaArtifact,
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
	buildToolChainArtifact,
	buildWorkedExampleArtifact,
	createCapabilityResult,
	createFocusRecommendations,
} from "../shared/handler-helpers.js";
import { extractRequestSignals } from "../shared/recommendations.js";

const RUNBOOK_SECTION_RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern: /\b(incident|alert|page|oncall|escalat|triage)\b/i,
		guidance:
			"Structure the incident response as a decision tree: each section should answer 'what symptom am I seeing?' and lead to a concrete action — runbooks that require reading top-to-bottom under pressure will be skipped.",
	},
	{
		pattern: /\b(rollback|revert|undo|restore|recover|backup)\b/i,
		guidance:
			"Document the rollback procedure step-by-step: exact commands, expected output at each step, and verification checks — a rollback section without verification steps creates a new incident instead of resolving the current one.",
	},
	{
		pattern: /\b(deploy|release|ship|push|pipeline|ci.?cd)\b/i,
		guidance:
			"Include deployment verification steps: health checks to run after deploy, metrics to watch for 15 minutes post-deploy, and the decision criteria for proceeding vs rolling back.",
	},
	{
		pattern: /\b(degrad|partial|failover|fallback|circuit|bypass)\b/i,
		guidance:
			"Document degraded-mode operation: what features are disabled, what user impact is expected, what monitoring changes, and how to return to full operation — degraded mode without documentation becomes permanent mode.",
	},
	{
		pattern: /\b(monitor|metric|dashboard|graph|alert|threshold)\b/i,
		guidance:
			"Link to specific dashboards and alert definitions: a runbook that says 'check the dashboard' without a URL or metric name is useless at 3 AM.",
	},
	{
		pattern: /\b(secret|credential|key|rotate|certificate|tls)\b/i,
		guidance:
			"Include credential rotation procedures: where secrets are stored, how to rotate them, how to verify the new credential works, and how to revoke the old one — credential runbooks must include revocation, not just rotation.",
	},
	{
		pattern: /\b(scale|capacity|traffic|load|spike|burst)\b/i,
		guidance:
			"Document scaling procedures: manual scale-up commands, auto-scaling configuration, capacity limits, and the decision criteria for when to scale vs when to shed load.",
	},
];

const docRunbookHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Runbook Generator needs a description of the system, service, or operational scenario to document before it can produce a structured runbook.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;
		const findings: string[] = RUNBOOK_SECTION_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ guidance }) => guidance);

		if (findings.length === 0) {
			findings.push(
				"Structure the runbook with these sections: Overview (what this runbook covers), Prerequisites (access, tools, permissions), Procedures (step-by-step with verification), Rollback (how to undo), and Escalation (who to contact when the runbook fails).",
				"Write every procedure step as: Action → Expected Output → Verification — a step without expected output cannot be debugged when it goes wrong.",
			);
		}

		if (signals.hasConstraints) {
			findings.push(
				`Apply operational constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Tailor procedure depth and escalation paths to the stated operational context.`,
			);
		}

		if (signals.hasContext) {
			findings.push(
				"Use the provided context to identify runbook scope: which services, failure modes, and operational scenarios should be covered — scope the runbook tightly to avoid a document that covers everything and helps with nothing.",
			);
		}

		return createCapabilityResult(
			context,
			`Runbook Generator identified ${findings.length} operational procedure${findings.length === 1 ? "" : "s"} and structure recommendation${findings.length === 1 ? "" : "s"}.`,
			createFocusRecommendations(
				"Runbook section",
				findings,
				context.model.modelClass,
			),
			[
				buildOutputTemplateArtifact(
					"Runbook template",
					[
						"# Runbook title",
						"## Trigger / symptom",
						"## Scope",
						"## Prerequisites",
						"## Immediate containment",
						"## Triage procedure",
						"## Rollback / recovery",
						"## Verification",
						"## Escalation",
						"## Communications",
					].join("\n"),
					[
						"Trigger / symptom",
						"Scope",
						"Prerequisites",
						"Immediate containment",
						"Triage procedure",
						"Rollback / recovery",
						"Verification",
						"Escalation",
						"Communications",
					],
					"Runbook skeleton optimized for incident response and operational execution.",
				),
				buildToolChainArtifact(
					"Incident response workflow",
					[
						{
							tool: "symptom identification",
							description:
								"match the observed behavior to the most likely failure mode before taking action",
						},
						{
							tool: "containment step",
							description:
								"stabilize the system with the least risky action that stops user impact",
						},
						{
							tool: "verification loop",
							description:
								"confirm recovery using named metrics, dashboards, or logs before closing the incident",
						},
					],
					"Concrete procedure chain for moving from incident signal to verified recovery.",
				),
				buildEvalCriteriaArtifact(
					"Runbook readiness checklist",
					[
						"Every step has an action, an expected output, and a verification check.",
						"Rollback or recovery commands are listed with precise preconditions.",
						"Dashboards, metrics, or logs are named explicitly instead of referenced vaguely.",
						"Escalation contacts and communications steps are available when self-service recovery fails.",
					],
					"Criteria for a runbook that can be executed under pressure.",
				),
				buildWorkedExampleArtifact(
					"Runbook incident example",
					{
						scenario: "Deployment causes degraded API latency",
						keySignals: [
							"p95 latency spikes",
							"error budget burn",
							"recent release",
						],
					},
					{
						sections: [
							"Containment",
							"Triage",
							"Rollback decision",
							"Verification",
							"Escalation",
						],
						commands: [
							"check latency dashboard",
							"compare release version",
							"rollback if recovery thresholds are not met",
						],
						validation: [
							"Runbook names the symptom and the first action",
							"Rollback is paired with a verification threshold",
							"Escalation is explicit if recovery fails",
						],
					},
					"Worked example showing how a symptom-driven incident entry should read.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(skillManifest, docRunbookHandler);
