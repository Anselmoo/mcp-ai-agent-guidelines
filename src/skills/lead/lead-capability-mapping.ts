import { z } from "zod";
import { lead_capability_mapping_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
	buildEvalCriteriaArtifact,
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
	buildWorkedExampleArtifact,
	createCapabilityResult,
	createFocusRecommendations,
	summarizeKeywords,
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";

const leadCapabilityMappingInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			targetHorizonMonths: z.number().int().positive().max(60).optional(),
			includeHeatmap: z.boolean().optional(),
			mappingDepth: z.enum(["portfolio", "function", "team"]).optional(),
		})
		.optional(),
});

const CAPABILITY_MAPPING_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(current|baseline|today|target|future|gap|maturity)\b/i,
		detail:
			"Map current capability, target capability, and the evidence-backed gap separately. Teams often collapse these into one optimistic status label, which hides whether the issue is missing skill, missing tooling, or missing operating discipline.",
	},
	{
		pattern: /\b(skill|talent|hire|train|mentor|people|org)\b/i,
		detail:
			"Track people capabilities independently from platform capabilities. Hiring and training timelines are slower than software timelines, so talent gaps should appear as first-class mapping items rather than notes on technical workstreams.",
	},
	{
		pattern:
			/\b(process|workflow|operating model|governance|approval|policy)\b/i,
		detail:
			"Include process and governance capabilities, not just technology. Organisations rarely fail because they cannot buy tools; they fail because they cannot decide, approve, and operate them repeatedly.",
	},
	{
		pattern: /\b(data|model|platform|tool|infra|security|observability)\b/i,
		detail:
			"Separate enabling platform capabilities from downstream product use cases. Capability maps become actionable when they show which shared platform gaps block multiple use cases at once.",
	},
	{
		pattern: /\b(priority|sequence|dependency|value|critical|portfolio)\b/i,
		detail:
			"Rank gaps by business dependency and leverage. The right first capability is often the one that unlocks several others, not the one with the loudest local sponsor.",
	},
	{
		pattern: /\b(metric|measure|evidence|kpi|proof|assessment)\b/i,
		detail:
			"Attach observable evidence to every capability rating: artifacts, operating metrics, or demonstrated behaviors. Self-assessed labels without evidence turn capability maps into opinion surveys.",
	},
	{
		pattern: /\b(owner|stakeholder|sponsor|leader|accountab)\b/i,
		detail:
			"Assign a named owner for each target capability and each major gap. If ownership is missing, the map may describe reality accurately but it will not change it.",
	},
];

const leadCapabilityMappingHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(leadCapabilityMappingInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				`Invalid input: ${parsed.error}`,
			);
		}

		const signals = extractRequestSignals(parsed.data);
		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Capability Mapping needs the organisation scope, target capability, or current-state evidence before it can identify meaningful gaps. Provide: (1) who is being mapped, (2) the target state, (3) any known baseline evidence.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const targetHorizonMonths = parsed.data.options?.targetHorizonMonths ?? 18;
		const includeHeatmap = parsed.data.options?.includeHeatmap ?? true;
		const mappingDepth = parsed.data.options?.mappingDepth ?? "function";

		const details: string[] = [
			`Map capabilities for "${summarizeKeywords(parsed.data).join(", ") || "the requested organisation scope"}" at ${mappingDepth} depth across a ${targetHorizonMonths}-month target horizon. Separate enabling capabilities, operating capabilities, and adoption capabilities so the map reveals what is actually missing.`,
		];

		details.push(
			...CAPABILITY_MAPPING_RULES.filter(({ pattern }) =>
				pattern.test(combined),
			).map(({ detail }) => detail),
		);

		if (includeHeatmap) {
			details.push(
				"Use an evidence-based heatmap only after you define what red, amber, and green mean. Heatmaps are useful summaries, but they mislead when colours are chosen before rating criteria exist.",
			);
		}

		details.push(
			"Attach observable evidence to every capability rating: artifacts, operating metrics, or demonstrated behaviours. Self-assessed labels without evidence turn capability maps into opinion surveys.",
		);

		if (signals.hasContext) {
			details.push(
				"Start from the provided baseline context rather than rebuilding the inventory from scratch. A capability map should expose the delta from the current state, not erase what is already known.",
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Shape the mapping output toward the stated deliverable: "${parsed.data.deliverable}". The final map should make it easy to lift directly into that artifact without rewriting the logic.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Use the success criteria to decide when a gap is "closed enough": "${parsed.data.successCriteria}". Capability maps become operational when they define what evidence qualifies a target capability as achieved.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Apply the stated constraints as scope filters for the map: ${signals.constraintList.slice(0, 3).join("; ")}. A map that ignores hard constraints will prioritise capabilities the organisation cannot actually pursue.`,
			);
		}

		const artifacts = [
			buildOutputTemplateArtifact(
				`Capability Map (${mappingDepth}, ${targetHorizonMonths}mo)`,
				`| Capability | Current State | Target State | Gap | Owner | Evidence |
|------------|--------------|-------------|-----|-------|----------|
| ...        | ...          | ...         | ... | ...   | ...      |`,
				[
					"Capability",
					"Current State",
					"Target State",
					"Gap",
					"Owner",
					"Evidence",
				],
				"Template for mapping current, target, and gap capabilities across people, platform, and process.",
			),
			buildComparisonMatrixArtifact(
				"Capability rating guide",
				["Capability type", "What to rate", "Common evidence", "Typical owner"],
				[
					{
						label: "People capability",
						values: [
							"skill depth and decision fluency",
							"delivery examples and mentoring outcomes",
							"people manager or capability lead",
						],
					},
					{
						label: "Platform capability",
						values: [
							"tooling, reliability, and reuse potential",
							"service metrics, uptime, and reusable components",
							"platform or architecture owner",
						],
					},
					{
						label: "Process capability",
						values: [
							"how repeatably the work gets done",
							"runbooks, approvals, and cycle-time data",
							"operating model owner",
						],
					},
					{
						label: "Adoption capability",
						values: [
							"whether teams actually use the capability",
							"usage metrics and change adoption signals",
							"product or transformation owner",
						],
					},
				],
				"Use this guide to keep the heatmap evidence-based instead of opinion-based.",
			),
			buildWorkedExampleArtifact(
				"Capability map example",
				{
					scope: "AI platform transformation",
					currentState:
						"fragmented tooling, unclear ownership, and manual approvals",
					targetState:
						"shared platform services, named owners, and a repeatable approval path",
					gap: "missing operating discipline and evidence for decision quality",
				},
				{
					heatmap: [
						{
							capability: "policy enforcement",
							status: "red",
							evidence: "exceptions are handled ad hoc today",
						},
						{
							capability: "platform observability",
							status: "amber",
							evidence: "partial metrics exist but are not tied to decisions",
						},
						{
							capability: "team enablement",
							status: "green",
							evidence: "training materials and office hours already exist",
						},
					],
					nextActions: [
						"assign owners to the red capabilities",
						"define red/amber/green criteria",
						"sequence the highest-leverage gap first",
					],
				},
				"Use this worked example to convert the mapping logic into an actionable operating view.",
			),
			buildEvalCriteriaArtifact(
				"Capability mapping checklist",
				[
					"Current, target, and gap states are separated clearly.",
					"Every rating has evidence attached to it.",
					"People, platform, process, and adoption capabilities are all represented.",
					"Owners are named for each major gap.",
					"Priority reflects leverage and dependency, not just urgency.",
				],
				"Use this checklist to verify that the map is specific enough to drive decisions.",
			),
		];
		return createCapabilityResult(
			context,
			`Capability Mapping produced ${details.length} mapping guardrail${details.length === 1 ? "" : "s"} (${mappingDepth} depth; horizon: ${targetHorizonMonths} months; heatmap: ${includeHeatmap ? "included" : "omitted"}).`,
			createFocusRecommendations(
				"Capability mapping guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	leadCapabilityMappingHandler,
);
