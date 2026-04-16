import { z } from "zod";
import { strat_roadmap_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildComparisonMatrixArtifact,
	buildEvalCriteriaArtifact,
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
	buildToolChainArtifact,
	buildWorkedExampleArtifact,
	createCapabilityResult,
	createFocusRecommendations,
	summarizeKeywords,
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import {
	extractRequestSignals,
	summarizeContextEvidence,
} from "../shared/recommendations.js";

const stratRoadmapInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			horizonMonths: z.number().int().positive().max(60).optional(),
			phaseCount: z.number().int().positive().max(6).optional(),
			includeMaturityModel: z.boolean().optional(),
		})
		.optional(),
});

function buildRoadmapRows(phaseCount: number, horizonMonths: number) {
	const phaseDuration = Math.max(1, Math.floor(horizonMonths / phaseCount));
	return Array.from({ length: phaseCount }, (_, index) => ({
		label: `Phase ${index + 1}`,
		values: [
			`Months ${index * phaseDuration + 1}-${Math.min(horizonMonths, (index + 1) * phaseDuration)}`,
			"Observable exit milestone",
			"Capability target",
			`Owner for phase ${index + 1}`,
		],
	}));
}

function buildRoadmapExample(phaseCount: number, horizonMonths: number) {
	return {
		horizonMonths,
		phaseCount,
		maturityBaseline: "Level 1 — ad-hoc experimentation",
		phases: Array.from({ length: phaseCount }, (_, index) => ({
			phase: index + 1,
			timebox: `Months ${index * Math.max(1, Math.floor(horizonMonths / phaseCount)) + 1}-${Math.min(horizonMonths, (index + 1) * Math.max(1, Math.floor(horizonMonths / phaseCount)))}`,
			exitMilestone:
				index === 0
					? "Pilot workflow shipped with explicit review gate"
					: index === phaseCount - 1
						? "Target capability operating in production with KPI review"
						: "Capability handoff accepted for the next phase",
			capabilityTarget:
				index === 0
					? "Baseline operating model and controls established"
					: "Platform, workflow, and team capability expanded for the next stage",
			owner: index === 0 ? "Platform lead" : "Programme owner",
		})),
		nextAction:
			"Approve phase-1 owner, maturity baseline, and first validation checkpoint.",
	};
}

const ROADMAP_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(phase|stage|wave|horizon|quarter|sprint|mileston)\b/i,
		detail:
			"Give each phase a concrete name, a fixed time boundary, and an observable exit milestone. Phases defined only by feature lists rather than observable outcomes are systematically late — teams complete features but miss the state change the phase was meant to produce.",
	},
	{
		pattern: /\b(maturity|level|capabilit|readiness|baseline|current state)\b/i,
		detail:
			"Anchor the roadmap to a documented maturity baseline. Without a baseline, phase durations are guesses and maturity model levels are aspirational labels. Run an explicit readiness assessment before committing the first phase boundary.",
	},
	{
		pattern: /\b(depend|prerequisite|block|sequence|order|before|after)\b/i,
		detail:
			"Map phase dependencies explicitly. Each phase entry condition should reference the phase it depends on, not just a date. Date-only dependencies create false confidence — a phase cannot start on its planned date if its predecessor missed its exit milestone.",
	},
	{
		pattern: /\b(adopt|rollout|deploy|pilot|scale|expand|produc)\b/i,
		detail:
			"Separate the pilot phase from the production phase with an explicit promotion gate. Pilots that scale to production without a promotion decision typically carry prototype-grade reliability into production — define the gate criteria (SLA, coverage, review) before the pilot starts.",
	},
	{
		pattern: /\b(team|skill|capabilit|hire|train|ramp|talent|people)\b/i,
		detail:
			"Include capability-building milestones alongside technical milestones. A roadmap phase that requires skills the team does not yet have must include the training or hiring milestone as a phase prerequisite, not a parallel nice-to-have.",
	},
	{
		pattern: /\b(risk|mitigation|fallback|contingency|buffer|reserve)\b/i,
		detail:
			"Embed a risk buffer in each phase: add 15–20% schedule slack for discovery work and late-breaking dependencies. Roadmaps without explicit buffers systematically slip because every phase's first two weeks are consumed by residual issues from the previous phase.",
	},
	{
		pattern: /\b(KPI|metric|measure|success|outcome|target|OKR)\b/i,
		detail:
			"Attach one to three measurable outcomes to each phase. Phase outcomes should be observable from production signals, not from delivery checklist completion. Outcomes that cannot be measured signal that the phase goal is underspecified.",
	},
	{
		pattern: /\b(govern|compliance|review|approval|audit|regul)\b/i,
		detail:
			"Identify governance gates on the roadmap — reviews, audits, compliance checks — and schedule them as phase milestones, not post-completion activities. Late-discovered governance blockers have terminated more AI programmes than technical failures.",
	},
];

const stratRoadmapHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(stratRoadmapInputSchema, input);
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
				"Roadmap Planning needs the goal, current state, or planning horizon before it can produce a phased plan. Provide: (1) target capability or outcome, (2) current maturity baseline, (3) time horizon, (4) any existing specs, code, or benchmarks that define the starting point.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const horizonMonths = parsed.data.options?.horizonMonths ?? 12;
		const phaseCount = parsed.data.options?.phaseCount ?? 3;
		const includeMaturityModel =
			parsed.data.options?.includeMaturityModel ?? true;
		const needsStrategyHandoff =
			/\b(strategy|vision|why now|business case|objective)\b/i.test(combined);
		const needsPrioritizationHandoff =
			/\b(prioriti|rank|sequence backlog|what first|top use case)\b/i.test(
				combined,
			);

		const details: string[] = [
			`Build a ${phaseCount}-phase roadmap for "${summarizeKeywords(parsed.data).join(", ") || "the requested capability"}" over ${horizonMonths} months. Each phase must have an observable exit milestone, a capability target, and an owner — a phase is complete only when the organisation can demonstrably do something it could not do before.`,
			"Begin with the reference intake: target outcome, current maturity, constraints, and any existing specs, code, benchmarks, or audits that already define the starting point. A roadmap should inherit its baseline from known artifacts instead of inventing a fresh narrative.",
		];

		details.push(
			...ROADMAP_RULES.filter(({ pattern }) => pattern.test(combined)).map(
				({ detail }) => detail,
			),
		);

		if (includeMaturityModel) {
			details.push(
				"Layer a maturity model alongside the phase plan: map each phase exit milestone to a maturity level (1 = ad-hoc, 2 = repeatable, 3 = defined, 4 = managed, 5 = optimising). The maturity level provides an external reference that stakeholders outside the programme can use to calibrate expectations.",
			);
		}

		details.push(
			"Define capability targets in every phase across at least people, process, platform, and governance. Capability targets prevent roadmaps from collapsing into delivery checklists by making the desired operating-state change explicit.",
		);

		if (signals.hasConstraints) {
			details.push(
				`Apply the stated constraints as hard phase-planning boundaries: ${signals.constraintList.slice(0, 3).join("; ")}. Phase plans that optimistically ignore constraints get revised under pressure, which resets stakeholder confidence. Constraints belong in the roadmap from the start.`,
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`The roadmap must culminate in the stated deliverable: "${parsed.data.deliverable}". Work backwards from that deliverable to determine which phase must produce it, then sequence the earlier phases as necessary preconditions. Roadmaps that do not trace backwards from their end-state regularly miss the deliverable even when all phases complete on time.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Use the success criteria as the final-phase exit condition: "${parsed.data.successCriteria}". If the criteria are not measurable by the planned observation method, refine them before the roadmap is socialised — vague exit conditions are the most common cause of "done by whose definition?" disputes.`,
			);
		}

		if (signals.hasContext) {
			details.push(
				summarizeContextEvidence(signals) ??
					"Ground phase 1 in the provided current state. The first phase should close the gap between the current state and the minimum viable entry point for phase 2, not attempt to deliver the full programme capability.",
			);
		} else {
			details.push(
				"No baseline context was provided. Add a phase 0 discovery checkpoint to capture current maturity, dependency risks, and any benchmark baseline before socialising dates to stakeholders.",
			);
		}

		if (needsStrategyHandoff) {
			details.push(
				"If the programme objective is still unsettled, frame strategy before locking dates and phases. Roadmap precision cannot compensate for a missing strategic thesis; use strategy framing to decide what the roadmap is trying to achieve.",
			);
		}

		if (needsPrioritizationHandoff) {
			details.push(
				"If the roadmap input is a large, unranked set of candidates, prioritise before assigning them to phases. Roadmaps sequence work that already matters; they are not a substitute for deciding what is worth doing first.",
			);
		}

		details.push(
			"End the roadmap with concrete next actions: approve the phase-1 owner, publish the maturity baseline, and define the review date for the first exit milestone. This is the commit point that moves the roadmap from planning into execution.",
		);

		return createCapabilityResult(
			context,
			`Roadmap Planning produced ${details.length} planning guardrail${details.length === 1 ? "" : "s"} for a ${phaseCount}-phase, ${horizonMonths}-month plan (maturity model: ${includeMaturityModel ? "included" : "omitted"}).`,
			createFocusRecommendations(
				"Roadmap guidance",
				details,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Roadmap phase matrix",
					["Timebox", "Exit milestone", "Capability target", "Owner"],
					buildRoadmapRows(phaseCount, horizonMonths),
					"Use this matrix to make each phase observable, owned, and tied to a capability outcome.",
				),
				buildOutputTemplateArtifact(
					"Roadmap plan template",
					[
						"# Roadmap plan",
						"## Target outcome",
						"## Current maturity baseline",
						"## Constraints and referenced artifacts",
						"## Phase breakdown",
						"## Capability targets",
						"## Dependency and governance gates",
						"## Success measures",
						"## Immediate next actions",
					].join("\n"),
					[
						"Target outcome",
						"Current maturity baseline",
						"Constraints and referenced artifacts",
						"Phase breakdown",
						"Capability targets",
						"Dependency and governance gates",
						"Success measures",
						"Immediate next actions",
					],
					"Template for a roadmap that ties dates, maturity, and capability targets together.",
				),
				buildToolChainArtifact(
					"Roadmap planning chain",
					[
						{
							tool: "baseline assessment",
							description:
								"capture the current maturity level, benchmarks, and known starting artifacts",
						},
						{
							tool: "phase design",
							description:
								"assign timeboxes, exit milestones, and capability targets to each phase",
						},
						{
							tool: "dependency and governance gating",
							description:
								"map prerequisites, approvals, and review checkpoints before phase transitions",
						},
						{
							tool: "execution commit",
							description:
								"publish the first owner, first milestone review date, and success measures",
						},
					],
					"Concrete sequence for converting a roadmap request into a phase-backed execution contract.",
				),
				buildWorkedExampleArtifact(
					"Roadmap planning example",
					{
						request:
							"create an AI adoption roadmap with milestones, maturity levels, and capability targets",
						context:
							"the team is at ad-hoc maturity with one pilot and no shared platform standards",
						options: {
							horizonMonths: 12,
							phaseCount: 3,
							includeMaturityModel: true,
						},
					},
					buildRoadmapExample(phaseCount, horizonMonths),
					"Worked example showing the expected shape of a roadmap with explicit capability targets and next actions.",
				),
				buildEvalCriteriaArtifact(
					"Roadmap release checklist",
					[
						"Every phase has a timebox, owner, exit milestone, and capability target.",
						"The roadmap references the current maturity baseline and supporting artifacts.",
						"Dependencies, governance gates, and success measures are visible before execution starts.",
						"The plan ends with concrete next actions for phase 1.",
					],
					"Checklist for validating that the roadmap is specific enough to execute and review.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	stratRoadmapHandler,
);
