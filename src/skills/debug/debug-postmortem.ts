import { z } from "zod";
import { debug_postmortem_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";

const debugPostmortemInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			incidentSeverity: z.enum(["critical", "major", "minor"]).optional(),
			hasTimeline: z.boolean().optional(),
			includeActionItems: z.boolean().optional(),
		})
		.optional(),
});

const INCIDENT_TYPE_RULES: Array<{ pattern: RegExp; guidance: string }> = [
	{
		pattern: /\b(outage|down|unavailabl|service.?disrupt|site.?down)\b/i,
		guidance:
			"Document the outage window precisely: first-alert timestamp, detection method, escalation path, mitigation start, and full recovery confirmation — ambiguity in any of these undermines the postmortem's value.",
	},
	{
		pattern: /\b(data.?loss|corrupt|inconsisten|integrity|missing.?record)\b/i,
		guidance:
			"Quantify the data impact: number of affected records, blast radius across services, and whether data is recoverable — data-loss incidents require a separate remediation track in the action items.",
	},
	{
		pattern: /\b(security|breach|unauthori[sz]|expos|leak|vulnerabilit)\b/i,
		guidance:
			"Classify the security incident: unauthorized access scope, data exposure window, and affected user count — security postmortems require disclosure timelines and regulatory notification tracking.",
	},
	{
		pattern: /\b(deploy|rollback|release|regression|broken.?build)\b/i,
		guidance:
			"Trace the deployment timeline: which change was deployed, what validation was skipped or insufficient, and what rollback mechanism was used — deployment incidents reveal process gaps, not just code bugs.",
	},
	{
		pattern: /\b(performance|latency|timeout|degrad|slow|capacity)\b/i,
		guidance:
			"Include performance metrics before, during, and after the incident: p50/p95/p99 latency, error rates, and throughput — performance postmortems without quantified baselines produce vague action items.",
	},
	{
		pattern: /\b(cascade|propagat|domino|depend|downstream|upstream)\b/i,
		guidance:
			"Map the cascade path: which service failed first, how the failure propagated, and which circuit breakers or isolation boundaries did and did not hold — cascade incidents require architectural action items.",
	},
];

function buildPostmortemArtifacts(severity: string, hasTimeline: boolean) {
	return [
		buildOutputTemplateArtifact(
			"Incident postmortem template",
			[
				"# Incident postmortem",
				"## Executive summary",
				"## Customer / business impact",
				"## Timeline",
				"## Root cause",
				"## Contributing factors",
				"## What went well",
				"## What went poorly",
				"## Action items",
			].join("\n"),
			[
				"Executive summary",
				"Customer / business impact",
				"Timeline",
				"Root cause",
				"Contributing factors",
				"What went well",
				"What went poorly",
				"Action items",
			],
			"Use this template to produce a reviewable postmortem that preserves evidence, not just narrative.",
		),
		buildToolChainArtifact("Postmortem collection chain", [
			{
				tool: "reconstruct the incident timeline",
				description:
					"pull timestamps from alerts, logs, and communication history to build the first-detected-to-final-recovery sequence",
			},
			{
				tool: "quantify the impact",
				description:
					"capture the affected users, duration, blast radius, and service-level impact in numbers",
			},
			{
				tool: "separate cause from contribution",
				description:
					"distinguish the root cause from the contributing conditions and the detection or escalation gap",
			},
			{
				tool: "write and assign actions",
				description:
					"turn lessons into owner-and-date action items and validate that each one is tracked to completion",
			},
		]),
		buildEvalCriteriaArtifact("Postmortem quality checklist", [
			hasTimeline
				? "Timeline contains detection, escalation, mitigation, and recovery timestamps"
				: "Timeline is reconstructed from source evidence rather than memory",
			"Impact is quantified with users, duration, and blast radius",
			"Root cause and contributing factors are stated separately",
			"Action items are specific, owned, and dated",
		]),
		buildWorkedExampleArtifact(
			"Postmortem example",
			{
				request: "write a postmortem for a critical outage after a bad deploy",
				options: { incidentSeverity: severity, hasTimeline },
			},
			{
				executiveSummary:
					"the deploy introduced latency spikes, triggered a rollback, and caused a brief outage window",
				timeline: [
					"deploy started",
					"alerts fired",
					"rollback initiated",
					"service recovered",
				],
				actionItems: [
					"add pre-deploy latency validation",
					"tighten rollback automation",
					"review alerting thresholds",
				],
			},
			"Concrete example of a postmortem that turns an incident into accountable follow-up work.",
		),
	];
}

const debugPostmortemHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(debugPostmortemInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				`Invalid input: ${parsed.error}`,
			);
		}

		const signals = extractRequestSignals(parsed.data);
		const text = `${parsed.data.request} ${parsed.data.context ?? ""}`;

		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Incident Postmortem needs a description of the incident: what happened, when, and what was the impact. Provide these before generating a structured postmortem.",
			);
		}

		const details: string[] = [];

		// Match incident-type-specific guidance
		for (const rule of INCIDENT_TYPE_RULES) {
			if (rule.pattern.test(text)) {
				details.push(rule.guidance);
			}
		}

		// Core postmortem structure guidance
		details.push(
			"Structure the postmortem with these required sections: Executive Summary → Timeline → Root Cause → Impact Assessment → What Went Well → What Went Poorly → Action Items. Omitting any section weakens accountability.",
		);

		if (parsed.data.options?.hasTimeline === false) {
			details.push(
				"No timeline provided — reconstruct from alerts, logs, and communication records. A postmortem without a precise timeline cannot identify detection or escalation gaps.",
			);
		} else {
			details.push(
				"Verify the timeline includes detection latency (time from failure to first alert), escalation latency (alert to human engagement), and resolution latency (engagement to mitigation) — these three gaps are the most actionable.",
			);
		}

		const severity = parsed.data.options?.incidentSeverity ?? "unknown";
		if (severity !== "unknown") {
			details.push(
				`Incident classified as ${severity} — ${severity === "critical" ? "require sign-off from engineering leadership on all action items and schedule a follow-up review within 7 days" : severity === "major" ? "assign owners and deadlines to every action item within 48 hours" : "track action items in the team backlog with standard priority"}.`,
			);
		}

		if (parsed.data.options?.includeActionItems !== false) {
			details.push(
				"Write action items as specific, measurable tasks with a single owner and a deadline — 'improve monitoring' is not an action item; 'add latency p99 alert on service X with threshold Y by date Z' is.",
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Apply the stated constraints to the postmortem scope: ${signals.constraintList.slice(0, 3).join("; ")}.`,
			);
		}

		if (signals.hasContext) {
			details.push(
				"Cross-reference the provided context against the timeline: identify gaps between what is documented and what is assumed — postmortem blind spots live in undocumented assumptions.",
			);
		}

		const artifacts = buildPostmortemArtifacts(
			severity,
			Boolean(parsed.data.options?.hasTimeline),
		);

		return createCapabilityResult(
			context,
			`Incident Postmortem generated ${details.length} structured guidance items and ${artifacts.length} artifacts for a ${severity} incident.`,
			createFocusRecommendations(
				"Postmortem section",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	debugPostmortemHandler,
);
