import { z } from "zod";
import { MODEL_PROVIDER_KEYWORDS } from "../../constants/provider-keywords.js";
import { strat_tradeoff_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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

// Note: this skill compares architectural/model/workflow alternatives with
// explicit tradeoff axes.  It produces axis-structured analysis — not a
// ranked recommendation.  Recommendation framing belongs in synth-recommendation;
// broad comparative research belongs in synth-comparative.
const stratTradeoffInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			decisionType: z
				.enum(["architectural", "model", "workflow", "technology"])
				.optional(),
			tradeoffAxes: z.array(z.string().min(1).max(60)).max(8).optional(),
		})
		.passthrough()
		.optional(),
});

type DecisionType = "architectural" | "model" | "workflow" | "technology";

function buildTradeoffRows(axes: string[]) {
	const visibleAxes = axes.slice(0, 3);
	return [
		{
			label: "Option A",
			values: [
				...visibleAxes.map(() => "score + evidence"),
				"empirical / heuristic",
			],
		},
		{
			label: "Option B",
			values: [
				...visibleAxes.map(() => "score + evidence"),
				"empirical / heuristic",
			],
		},
	];
}

function buildTradeoffExample(decisionType: DecisionType, axes: string[]) {
	return {
		decisionType,
		axes,
		options: [
			{
				name: "Single-agent pipeline",
				strength: "Lower coordination overhead",
				risk: "Larger blast radius per failure",
				evidence: "Latency benchmark and incident replay",
			},
			{
				name: "Multi-agent pipeline",
				strength: "Higher task specialization",
				risk: "Higher observability and routing complexity",
				evidence: "Prototype benchmark and operations review",
			},
		],
		nextValidation: "Benchmark the tie-breaking axis before framing a winner.",
	};
}

const TRADEOFF_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(axis|axes|criteri|dimension|factor|aspect|attribute)\b/i,
		detail:
			"Define tradeoff axes before evaluating alternatives. Axes must be independent (changing one does not automatically change another) and exhaustive (cover all dimensions the decision-maker cares about). Missing axes produce analyses that look thorough but omit the dimension that determines the actual choice.",
	},
	{
		pattern: /\b(alternative|option|approach|candidate|choice|solution)\b/i,
		detail:
			"Evaluate each alternative against every axis, even when the result is 'not applicable'. Skipping an axis for a specific alternative creates an asymmetric comparison that implicitly favours the alternative for which the axis was skipped.",
	},
	{
		pattern:
			/\b(RAG|fine.?tun|finetun|embed|retriev|vector|model selection)\b/i,
		detail:
			"For AI model architecture decisions, always include latency, cost-per-inference, fine-tuning data requirements, and model update frequency as mandatory axes. These four axes determine production viability independently of accuracy benchmarks.",
	},
	{
		pattern:
			/\b(single.?agent|multi.?agent|monolith|microservice|agent|pipeline)\b/i,
		detail:
			"For agent architecture decisions, compare on: coordination overhead (how much work is spent routing and synthesising vs. doing), failure blast radius (how much of the system fails when one component fails), and observability complexity (how hard it is to trace a result back to its root cause).",
	},
	{
		pattern:
			/\b(latency|performance|throughput|speed|response time|SLA|SLO)\b/i,
		detail:
			"Include latency and throughput as explicit axes in every architecture tradeoff. Alternatives that are architecturally elegant but fail their SLA under expected load are not viable — measure under realistic concurrency before finalising the tradeoff comparison.",
	},
	{
		pattern:
			/\b(cost|price|budget|expense|TCO|total cost|licence|operational)\b/i,
		detail:
			"Break cost into three axes: build cost (one-time), operational cost (recurring), and switching cost (what it costs to change your mind). Alternatives with low build costs often have high switching costs — a tradeoff analysis that omits switching cost systematically underestimates lock-in risk.",
	},
	{
		pattern:
			/\b(complexit|maintain|operat|support|team|skill|learning curve)\b/i,
		detail:
			"Include operational complexity as an axis: how much team expertise is required to deploy, maintain, and debug this alternative in production? The technically superior alternative that requires skills the team does not have is operationally inferior to the slightly less capable alternative the team can actually run.",
	},
	{
		pattern: /\b(revers|lock.?in|vendor|escape|migrate|exit|commit)\b/i,
		detail:
			"Score reversibility for each alternative: how much effort is required to undo this decision in 12 months if the chosen alternative underperforms? High-reversibility alternatives should be preferred when uncertainty is high, even if they score lower on performance axes.",
	},
	{
		pattern: /\b(recommend|choose|select|prefer|decide|winner|best)\b/i,
		detail:
			"This analysis surfaces structured tradeoffs — it does not make the final choice. Present the axis scores without a forced winner so the decision-maker can apply their own weighting. If a recommendation is required after the analysis, use synth-recommendation to frame it with explicit rationale and confidence level.",
	},
];

const DEFAULT_TRADEOFF_AXES: Record<DecisionType, string[]> = {
	architectural: [
		"latency",
		"scalability",
		"operational complexity",
		"reversibility",
	],
	model: [
		"cost-per-inference",
		"latency",
		"fine-tuning requirement",
		"update frequency",
	],
	workflow: [
		"coordination overhead",
		"failure blast radius",
		"observability",
		"throughput",
	],
	technology: [
		"build cost",
		"operational cost",
		"switching cost",
		"team skill fit",
	],
};

function inferDecisionType(
	input: string,
	explicit?: DecisionType,
): DecisionType {
	if (explicit !== undefined) return explicit;
	if (/\b(architecture|arch|system|platform|infra)\b/i.test(input))
		return "architectural";
	if (
		new RegExp(
			`\\b(model|llm|RAG|fine.?tun|embed|${MODEL_PROVIDER_KEYWORDS})\\b`,
			"i",
		).test(input)
	)
		return "model";
	if (/\b(workflow|pipeline|agent|orchestrat|process)\b/i.test(input))
		return "workflow";
	return "technology";
}

const stratTradeoffHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(stratTradeoffInputSchema, input);
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
				"Tradeoff Analysis needs the alternatives to compare and the decision context before it can produce an axis-structured analysis. Provide: (1) the alternatives, (2) the decision type (architectural/model/workflow/technology), (3) any hard constraints, (4) any specs, code, or benchmark evidence already available.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const decisionType = inferDecisionType(
			combined,
			parsed.data.options?.decisionType,
		);
		const axes =
			parsed.data.options?.tradeoffAxes ?? DEFAULT_TRADEOFF_AXES[decisionType];
		const needsStrategyHandoff =
			/\b(strategy|vision|roadmap|adoption plan|operating model)\b/i.test(
				combined,
			);
		const needsComparativeResearch =
			/\b(research|survey|benchmark|source|study|evidence base)\b/i.test(
				combined,
			);

		const details: string[] = [
			`Analyse the ${decisionType} tradeoffs for "${summarizeKeywords(parsed.data).join(", ") || "the stated alternatives"}" across axes: ${axes.slice(0, 4).join(", ")}${axes.length > 4 ? `, +${axes.length - 4} more` : ""}. Score every alternative on every axis — asymmetric coverage invalidates the comparison.`,
			"Start the tradeoff memo with the user goal, current state, constraints, and the artifact or benchmark set that already exists. Tradeoff analysis is strongest when every claimed advantage can be traced back to a spec, benchmark, architecture note, or operating constraint.",
		];

		details.push(
			...TRADEOFF_RULES.filter(({ pattern }) => pattern.test(combined)).map(
				({ detail }) => detail,
			),
		);

		if (signals.hasConstraints) {
			details.push(
				`Apply the stated constraints as axis pre-filters: ${signals.constraintList.slice(0, 3).join("; ")}. Alternatives that violate a constraint should be excluded from the axis scoring rather than scored low — a low score signals "consider in the next cycle", not "structurally incompatible".`,
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`The tradeoff analysis must produce the stated deliverable: "${parsed.data.deliverable}". Structure the axis scores so they feed directly into that deliverable's format — post-hoc translation from a freeform analysis to a structured deliverable introduces interpretation errors.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Validate the analysis completeness against the success criteria: "${parsed.data.successCriteria}". An axis comparison that does not address the success criteria leaves the decision unresolved even when the analysis is technically correct.`,
			);
		}

		if (signals.hasContext || signals.hasEvidence) {
			details.push(
				summarizeContextEvidence(signals) ??
					"Ground the axis scores in the provided context. Prior decisions, existing system constraints, and team capabilities documented in the context are not just background — they are weighting factors that change the relative scores of the alternatives.",
			);
		}

		details.push(
			"Capture evidence quality per axis: mark each score as empirical benchmark, production observation, reviewed specification, or heuristic judgement. Tradeoff tables become decision-grade only when the reader can distinguish measured facts from expert assumptions.",
			"Where a high-impact axis is still uncertain, define the smallest benchmark or experiment that would break the tie before escalating to a recommendation. Tradeoff analysis should expose what must be tested next, not pretend the uncertainty is already resolved.",
		);

		if (needsStrategyHandoff) {
			details.push(
				"If the real question is strategic direction rather than option analysis, frame the strategy first and then return to tradeoffs. Strategy defines what success means; tradeoff analysis only helps once the decision frame is already stable.",
			);
		}

		if (needsComparativeResearch) {
			details.push(
				"If the evidence base is still being gathered, route the request through comparative research or benchmarking before final scoring. Tradeoff outputs should consume evidence, not act as a substitute for collecting it.",
			);
		}

		details.push(
			"Close with a validation contract: which benchmark, review, or prototype result would confirm or overturn the current axis picture, and which downstream skill should frame the final recommendation once the tie-breaking evidence exists.",
		);

		return createCapabilityResult(
			context,
			`Tradeoff Analysis produced ${details.length} analysis guardrail${details.length === 1 ? "" : "s"} for a ${decisionType} decision across ${axes.length} ${axes.length === 1 ? "axis" : "axes"}.`,
			createFocusRecommendations(
				"Tradeoff guidance",
				details,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Tradeoff evidence matrix",
					[...axes.slice(0, 3), "Evidence quality"],
					buildTradeoffRows(axes),
					"Template for recording axis scores alongside the quality of supporting evidence.",
				),
				buildOutputTemplateArtifact(
					"Tradeoff memo template",
					[
						"# Tradeoff memo",
						"## Decision question",
						"## Alternatives",
						"## Axes and weights",
						"## Evidence quality notes",
						"## Constraint filters",
						"## Key tradeoffs per option",
						"## Required benchmark / validation",
						"## Recommendation handoff",
					].join("\n"),
					[
						"Decision question",
						"Alternatives",
						"Axes and weights",
						"Evidence quality notes",
						"Constraint filters",
						"Key tradeoffs per option",
						"Required benchmark / validation",
						"Recommendation handoff",
					],
					"Use this template to keep the analysis axis-structured, evidence-labeled, and ready for downstream recommendation framing.",
				),
				buildToolChainArtifact(
					"Tradeoff analysis chain",
					[
						{
							tool: "axis definition",
							description:
								"lock the evaluation axes and hard constraints before scoring options",
						},
						{
							tool: "evidence capture",
							description:
								"attach specs, benchmarks, and operating context to each axis score",
						},
						{
							tool: "gap-to-benchmark mapping",
							description:
								"identify which uncertain axis needs a prompt benchmark, prototype, or measurement pass",
						},
						{
							tool: "decision handoff",
							description:
								"send the completed matrix to recommendation framing once the tie-breaking evidence exists",
						},
					],
					"Concrete sequence for producing a tradeoff analysis that is traceable and testable.",
				),
				buildWorkedExampleArtifact(
					"Tradeoff analysis example",
					{
						request:
							"analyze tradeoffs between single-agent and multi-agent workflows",
						context:
							"the team has one working prototype plus latency and observability concerns",
						options: {
							decisionType: "workflow",
							tradeoffAxes: [
								"coordination overhead",
								"failure blast radius",
								"observability",
							],
						},
					},
					buildTradeoffExample(decisionType, axes),
					"Worked example showing the expected shape of an evidence-backed tradeoff memo before recommendation framing.",
				),
				buildEvalCriteriaArtifact(
					"Tradeoff analysis rubric",
					[
						"Every alternative is scored on the same axes.",
						"Constraint violations are treated as exclusion filters, not soft penalties.",
						"Each axis score includes an evidence-quality label or benchmark follow-up.",
						"The output names the validation step or downstream recommendation handoff needed to finish the decision.",
					],
					"Checklist for deciding whether a tradeoff analysis is ready for stakeholder review.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	stratTradeoffHandler,
);
