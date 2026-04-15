import { z } from "zod";
import { lead_transformation_roadmap_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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

const leadTransformationRoadmapInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			phaseCount: z.number().int().positive().max(6).optional(),
			horizonMonths: z.number().int().positive().max(60).optional(),
			includeGovernanceTrack: z.boolean().optional(),
		})
		.optional(),
});

const TRANSFORMATION_ROADMAP_RULES: Array<{ pattern: RegExp; detail: string }> =
	[
		{
			pattern: /\b(baseline|maturity|current state|today|assessment|gap)\b/i,
			detail:
				"Anchor the roadmap to a baseline maturity assessment before phase 1 starts. Transformation programmes fail when phases are defined against an imagined current state instead of an evidenced one.",
		},
		{
			pattern:
				/\b(platform|data|model|tooling|infra|foundation|observability)\b/i,
			detail:
				"Carry a platform-foundation track alongside visible use-case delivery. Enterprises that pursue only front-stage pilots accumulate hidden platform debt that later blocks scale.",
		},
		{
			pattern:
				/\b(team|operating model|talent|process|change|adoption|training)\b/i,
			detail:
				"Run a people-and-operating-model track in parallel with the technical track. Transformation is slower than implementation because people, incentives, and decision rights change more slowly than software.",
		},
		{
			pattern: /\b(governance|compliance|risk|policy|control|audit)\b/i,
			detail:
				"Schedule governance work as a first-class track with its own milestones. Governance discovered late becomes a release blocker; governance planned early becomes a design constraint teams can work with.",
		},
		{
			pattern: /\b(funding|investment|portfolio|budget|business case)\b/i,
			detail:
				"Attach funding and business-case decision points to phase boundaries. Enterprise transformation roadmaps need investment gates, not just engineering milestones.",
		},
		{
			pattern: /\b(metric|kpi|okr|measure|outcome|adoption)\b/i,
			detail:
				"Define one or two enterprise outcomes per phase that leadership can observe from production or operating metrics. Checklist-only phases create the illusion of progress without proving change.",
		},
		{
			pattern: /\b(depend|sequence|wave|prerequisite|before|after|block)\b/i,
			detail:
				"Map cross-track dependencies explicitly. A roadmap is credible when each phase shows what must be true before the next wave can start, not merely when the calendar says it should.",
		},
	];

const leadTransformationRoadmapHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(leadTransformationRoadmapInputSchema, input);
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
				"Transformation Roadmap needs the target transformation, baseline state, or planning horizon before it can produce a credible phased roadmap. Provide: (1) the target enterprise change, (2) the current baseline, (3) the horizon or phase structure.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const phaseCount = parsed.data.options?.phaseCount ?? 4;
		const horizonMonths = parsed.data.options?.horizonMonths ?? 24;
		const includeGovernanceTrack =
			parsed.data.options?.includeGovernanceTrack ?? true;

		const details: string[] = [
			`Build a ${phaseCount}-phase enterprise transformation roadmap for "${summarizeKeywords(parsed.data).join(", ") || "the requested AI transformation"}" over ${horizonMonths} months. Each phase should show the platform, people, and business state change it is meant to create, not just the work to be performed.`,
		];

		details.push(
			...TRANSFORMATION_ROADMAP_RULES.filter(({ pattern }) =>
				pattern.test(combined),
			).map(({ detail }) => detail),
		);

		if (includeGovernanceTrack) {
			details.push(
				"Keep governance checkpoints visible in every phase, even when the main focus is capability delivery. Enterprise programmes drift when governance is treated as an afterthought that someone else will retrofit later.",
			);
		}

		details.push(
			"Map cross-track dependencies explicitly. A roadmap is credible when each phase shows what must be true before the next wave can start, not merely when the calendar says it should.",
		);

		if (signals.hasContext) {
			details.push(
				"Use the provided context as the transformation baseline and make phase 1 about closing the most critical readiness gaps. The first phase should create the conditions for acceleration, not attempt full transformation immediately.",
			);
		} else {
			details.push(
				"No baseline context was provided. Before socializing the roadmap, run a readiness assessment covering platform capability, governance posture, talent depth, and adoption readiness so the first phase is grounded in evidence.",
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Shape the roadmap to produce the stated deliverable: "${parsed.data.deliverable}". Enterprise roadmaps should work backwards from the decision artifact leadership expects, not from a generic roadmap template.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Use the success criteria as the final-phase exit condition: "${parsed.data.successCriteria}". If the roadmap cannot show how those criteria will be measured, its later phases are still aspirational.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Apply the stated constraints as roadmap guardrails across all phases: ${signals.constraintList.slice(0, 3).join("; ")}. Transformation plans that ignore hard constraints are re-written under stress, usually after confidence has already dropped.`,
			);
		}

		const artifacts = [
			buildOutputTemplateArtifact(
				`Transformation Roadmap (${phaseCount} phases, ${horizonMonths}mo)`,
				`| Phase | Platform Track | People/Org Track | Governance Track | Key Outcomes | Dependencies |
|-------|----------------|------------------|------------------|--------------|--------------|
| 1     | ...            | ...              | ...              | ...          | ...          |
| ...   | ...            | ...              | ...              | ...          | ...          |`,
				[
					"Phase",
					"Platform Track",
					"People/Org Track",
					"Governance Track",
					"Key Outcomes",
					"Dependencies",
				],
				"Template for an enterprise transformation roadmap with phases, tracks, and outcomes.",
			),
			buildComparisonMatrixArtifact(
				"Phase design tradeoff matrix",
				["Phase", "Primary purpose", "Exit signal", "Common failure mode"],
				[
					{
						label: "Phase 1",
						values: [
							"close the readiness gaps",
							"baseline updated and owners assigned",
							"trying to scale before the foundation is ready",
						],
					},
					{
						label: "Phase 2",
						values: [
							"deliver the first production slice",
							"first operating metrics are available",
							"staying stuck in pilot mode",
						],
					},
					{
						label: "Phase 3",
						values: [
							"scale across teams and use cases",
							"repeatable handoffs and stable governance",
							"expanding scope without operating discipline",
						],
					},
					{
						label: "Phase 4",
						values: [
							"optimise and transfer to steady state",
							"run-state ownership and scorecards are in place",
							"handoff without durable accountability",
						],
					},
				],
				"Use this matrix to make the roadmap phases specific enough to govern.",
			),
			buildWorkedExampleArtifact(
				"Transformation roadmap example",
				{
					currentState:
						"fragmented ML tooling, manual approvals, and unclear operating ownership",
					targetState:
						"governed shared AI platform with named owners and repeatable adoption",
					horizonMonths,
					phaseCount,
				},
				{
					phases: [
						{
							phase: 1,
							outcome: "readiness gaps closed and ownership clarified",
						},
						{
							phase: 2,
							outcome:
								"first production slice shipped with governance in place",
						},
						{
							phase: 3,
							outcome: "platform reused by multiple teams",
						},
						{
							phase: 4,
							outcome:
								"steady-state operating model and funding gate established",
						},
					],
					dependencies: [
						"baseline assessment",
						"platform service owners",
						"governance decision points",
					],
				},
				"Use this example to turn the phase structure into an executable transformation plan.",
			),
			buildEvalCriteriaArtifact(
				"Roadmap validation checklist",
				[
					"Each phase has an observable enterprise outcome, not just activity.",
					"People, platform, and governance tracks advance in parallel where needed.",
					"Dependencies and gates are explicit before the next wave begins.",
					"Funding or decision points are attached to the phase boundaries.",
					"The roadmap can be validated against production or operating metrics.",
				],
				"Use this checklist to verify that the roadmap can survive leadership review and execution pressure.",
			),
		];
		return createCapabilityResult(
			context,
			`Transformation Roadmap produced ${details.length} roadmap guardrail${details.length === 1 ? "" : "s"} for a ${phaseCount}-phase, ${horizonMonths}-month plan (governance track: ${includeGovernanceTrack ? "included" : "omitted"}).`,
			createFocusRecommendations(
				"Transformation roadmap guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	leadTransformationRoadmapHandler,
);
