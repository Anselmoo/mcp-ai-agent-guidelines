import { z } from "zod";
import { strat_advisor_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
	summarizeKeywords,
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";

const stratAdvisorInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			focusArea: z
				.enum(["adoption", "platform", "operating-model", "governance"])
				.optional(),
			horizonMonths: z.number().int().positive().max(60).optional(),
		})
		.optional(),
});

type FocusArea = "adoption" | "platform" | "operating-model" | "governance";

function buildStrategyContract(
	focusArea: FocusArea,
	horizonMonths: number,
): {
	focusArea: FocusArea;
	horizonMonths: number;
	businessOutcome: string;
	currentState: string;
	constraints: string[];
	evidenceBase: string[];
	strategicBets: string[];
	handoffs: string[];
	nextActions: string[];
} {
	return {
		focusArea,
		horizonMonths,
		businessOutcome:
			"Reduce time-to-value for the first production AI workflow.",
		currentState:
			"Pilot-stage experimentation with no shared platform or governance cadence.",
		constraints: [
			"SOC 2 controls stay in force",
			"Existing platform team remains the primary owner",
		],
		evidenceBase: [
			"Current architecture diagram",
			"Support-ticket benchmark baseline",
		],
		strategicBets: [
			"Separate shared platform contracts from product-specific workflows",
			"Name an executive sponsor and an operating owner before pilot expansion",
		],
		handoffs: [
			"strat-roadmap for phased execution",
			"strat-tradeoff for unresolved build-vs-buy decisions",
		],
		nextActions: [
			"By week 2, document current-state maturity, benchmarks, and top risks",
			"By week 4, lock the first KPI set and approve the phase-1 roadmap",
		],
	};
}

const STRATEGY_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(adopt|adoption|rollout|onboard|introduce|pilot|deploy)\b/i,
		detail:
			"Frame AI adoption in discrete phases: awareness → pilot → production → scale. Each phase must have measurable entry/exit criteria and an explicit owner. Organisations that skip phase gates accumulate adoption debt that surfaces as fragile production deployments.",
	},
	{
		pattern: /\b(platform|infra|infrastructure|stack|foundation|arch)\b/i,
		detail:
			"Separate the AI platform layer (model routing, observability, security controls) from the application layer (skills, agents, workflows). Platform decisions are harder to reverse than application decisions — invest disproportionately in platform contracts and versioning from day one.",
	},
	{
		pattern:
			/\b(operating model|team|org|governance|ownership|responsibilit)\b/i,
		detail:
			"Define the operating model before committing to a platform: who owns model selection, who approves production deployments, who monitors for drift, and who is on-call for AI-caused incidents. Missing ownership is the most common root cause of failed AI programmes.",
	},
	{
		pattern: /\b(strategy|strategic|vision|direction|goal|objective)\b/i,
		detail:
			"Anchor the AI strategy to at most three concrete business outcomes with measurable KPIs. Strategies without outcome anchors drift toward technology-for-technology's-sake and lose executive sponsorship when the next priority cycle hits.",
	},
	{
		pattern: /\b(risk|compliance|regul|audit|govern|safe|secur)\b/i,
		detail:
			"Include a risk register in the strategy document: list each identified risk, its likelihood, impact, and the control that mitigates it. Strategies that defer risk framing to later phases regularly discover that the controls needed are architectural — not patchable after the fact.",
	},
	{
		pattern: /\b(capability|maturity|skill|talent|team|hire|train)\b/i,
		detail:
			"Map the capability gap between current team skills and the skills required to operate the target state. A technically sound strategy is undeliverable if it presupposes capabilities that will take 12+ months to hire or train. Close the gap explicitly in the roadmap.",
	},
	{
		pattern: /\b(build|buy|partner|vendor|make|outsource|source)\b/i,
		detail:
			"Make build/buy/partner decisions at the component level, not at the programme level. Each decision needs: differentiation value (build if this is a competitive moat), total cost of ownership including switching cost, and integration risk with the rest of the platform.",
	},
	{
		pattern: /\b(stakeholder|executive|sponsor|champion|leadership|board)\b/i,
		detail:
			"Identify a named executive sponsor and two to three operational champions before the strategy is finalised. Strategies that go into execution without committed sponsorship stall when they first compete for engineering budget or platform access.",
	},
];

function inferFocusArea(input: string, explicit?: FocusArea): FocusArea {
	if (explicit !== undefined) return explicit;
	if (/\b(platform|infra|stack|foundation)\b/i.test(input)) return "platform";
	if (/\b(governance|compliance|regul|policy|audit)\b/i.test(input))
		return "governance";
	if (/\b(operating model|org|team|ownership)\b/i.test(input))
		return "operating-model";
	return "adoption";
}

const focusAreaLabels: Record<FocusArea, string> = {
	adoption: "AI adoption",
	platform: "AI platform design",
	"operating-model": "AI operating model",
	governance: "AI governance",
};

const stratAdvisorHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(stratAdvisorInputSchema, input);
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
				"Strategy Advisor needs the strategic goal, current state, or focus area before it can frame an actionable strategy. Provide: (1) desired outcome, (2) current AI maturity, (3) key constraints, (4) any existing specs, code, or benchmarks to anchor the strategy.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const focusArea = inferFocusArea(combined, parsed.data.options?.focusArea);
		const horizonMonths = parsed.data.options?.horizonMonths ?? 12;
		const needsRequirementsHandoff =
			/\b(requirement|scope|acceptance criteria|clarif|ambigu|user need)\b/i.test(
				combined,
			);
		const needsResearchHandoff =
			/\b(research|evidence|benchmark|survey|source|study|compare)\b/i.test(
				combined,
			);

		const details: string[] = [
			`Frame the ${focusAreaLabels[focusArea]} strategy around "${summarizeKeywords(parsed.data).join(", ") || "the requested direction"}" over a ${horizonMonths}-month horizon. Anchor every strategic decision to measurable business outcomes — strategy without outcome anchors defaults to technology theatre.`,
			"Start the strategy brief with a four-part intake: business outcome, current state, hard constraints, and the artifacts or benchmarks that already exist. Strategy framing is weaker when it re-asks questions that are already answered in specs, code, or prior research.",
		];

		details.push(
			...STRATEGY_RULES.filter(({ pattern }) => pattern.test(combined)).map(
				({ detail }) => detail,
			),
		);

		if (signals.hasConstraints) {
			details.push(
				`Treat the stated constraints as hard strategy boundaries, not aspirational guidelines: ${signals.constraintList.slice(0, 3).join("; ")}. Strategic options that violate these constraints must be filtered before evaluation — pursuing them burns stakeholder credibility.`,
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Shape the strategy to produce the stated deliverable: "${parsed.data.deliverable}". Every strategy element must trace forward to that artifact — elements that do not are scope creep and should be deferred or cut.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Encode the success criteria as strategy exit conditions: "${parsed.data.successCriteria}". These criteria define when the strategy has been executed — not when it has been written. Build a measurement plan alongside the strategy document.`,
			);
		}

		if (signals.hasContext) {
			details.push(
				"Use the provided context as the baseline state. Avoid re-diagnosing what is already known — the strategy should progress from that baseline, not restate it.",
			);
		} else {
			details.push(
				"No current-state context was provided. Before finalising the strategy, establish baseline metrics: current AI maturity level, existing platform capabilities, team skill gaps, and the benchmark or artifact set that proves the baseline. Strategies built on assumed baselines regularly misallocate investment.",
			);
		}

		if (needsRequirementsHandoff) {
			details.push(
				"If the request still depends on unstable scope or missing acceptance criteria, pause strategy framing long enough to extract requirements first. A strategy built on ambiguous problem framing will optimise the wrong target; hand the ambiguity to requirements analysis before locking the strategic bets.",
			);
		}

		if (needsResearchHandoff) {
			details.push(
				"If the core decision still depends on unresolved research or benchmark evidence, gather and synthesise that material before finalising the strategy. Strategy should consume evidence rather than substituting for it; treat research outputs as inputs to the strategy brief, not as appendices.",
			);
		}

		details.push(
			"End the strategy with concrete next actions: name the owner, the first 30-day milestone, the validation signal, and the downstream handoff (prioritisation, tradeoff analysis, or roadmap). A strategy without an execution handoff is still a concept note, not an operating plan.",
		);

		return createCapabilityResult(
			context,
			`Strategy Advisor framed ${details.length} strategy guardrail${details.length === 1 ? "" : "s"} for ${focusAreaLabels[focusArea]} (horizon: ${horizonMonths} months).`,
			createFocusRecommendations(
				"Strategy guidance",
				details,
				context.model.modelClass,
			),
			[
				buildOutputTemplateArtifact(
					"Strategy brief template",
					[
						"# Strategy brief",
						"## Business outcome",
						"## Current state",
						"## Constraints",
						"## Referenced artifacts / benchmarks",
						"## Strategic bets",
						"## Risks and controls",
						"## Handoffs",
						"## Next 30-day actions",
					].join("\n"),
					[
						"Business outcome",
						"Current state",
						"Constraints",
						"Referenced artifacts / benchmarks",
						"Strategic bets",
						"Risks and controls",
						"Handoffs",
						"Next 30-day actions",
					],
					"Use this to turn strategic framing into a decision-ready brief with explicit evidence anchors and execution handoffs.",
				),
				buildToolChainArtifact(
					"Strategy framing chain",
					[
						{
							tool: "baseline capture",
							description:
								"record the business outcome, current maturity, and referenced specs/code/benchmarks",
						},
						{
							tool: "focus selection",
							description:
								"pick the primary focus area: adoption, platform, operating model, or governance",
						},
						{
							tool: "risk and ownership mapping",
							description:
								"assign control owners, decision cadence, and escalation points before execution",
						},
						{
							tool: "execution handoff",
							description:
								"route the strategy into prioritisation, roadmap planning, or tradeoff analysis with named next actions",
						},
					],
					"Concrete sequence for turning a strategic direction into a bounded operating plan.",
				),
				buildWorkedExampleArtifact(
					"Strategy framing example",
					{
						request:
							"help me build a technical strategy for AI adoption with governance and platform controls",
						context:
							"we have an experimentation sandbox but no production platform or compliance review cadence",
						options: { focusArea: "governance", horizonMonths: 18 },
					},
					buildStrategyContract("governance", 18),
					"Worked example showing how a strategy brief should end in evidence-backed bets, clear handoffs, and concrete next actions.",
				),
				buildEvalCriteriaArtifact(
					"Strategy brief rubric",
					[
						"The strategy names a concrete business outcome and current-state baseline.",
						"Constraints and existing artifacts or benchmarks are explicitly referenced.",
						"Handoffs are clear when requirements or research work must happen first.",
						"The brief ends with named next actions, owners, and validation signals.",
					],
					"Checklist for deciding whether the strategy output is actionable rather than aspirational.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	stratAdvisorHandler,
);
