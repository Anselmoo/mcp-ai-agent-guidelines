import { z } from "zod";
import { synth_recommendation_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
import {
	extractRequestSignals,
	summarizeContextEvidence,
} from "../shared/recommendations.js";

const synthRecommendationInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			includeTradeoffs: z.boolean().optional(),
			confidenceMode: z.enum(["explicit", "inferred"]).optional(),
			confidenceLevel: z.enum(["low", "medium", "high"]).optional(),
		})
		.optional(),
});

type ConfidenceMode = "explicit" | "inferred";
type ConfidenceLevel = "low" | "medium" | "high";

function buildRecommendationExample(
	confidence: ConfidenceLevel,
	includeTradeoffs: boolean,
) {
	return {
		recommendation:
			"Adopt the managed vector store for the first production rollout.",
		evidence: [
			"Benchmark shows acceptable latency at target load",
			"Operations review confirms the team lacks bandwidth for self-hosting",
		],
		reasoning:
			"The managed option best satisfies the current reliability and staffing constraints.",
		confidence,
		...(includeTradeoffs
			? {
					tradeoffs: [
						"Managed service wins on speed to production but loses some infrastructure control",
					],
				}
			: {}),
		conditions: ["Revisit if data residency rules change"],
		nextAction:
			"By Friday, the platform owner should prepare the procurement and rollout checklist.",
		risks: ["Cost may rise if query volume doubles faster than forecast"],
		stakeholders: [
			"Platform lead",
			"Security reviewer",
			"Engineering director",
		],
	};
}

function hasEvidenceBase(text: string): boolean {
	return /\b(evidence|comparison|trade.?off|finding|findings|source|benchmark|option|alternative|research|analysis)\b/i.test(
		text,
	);
}

const RECOMMENDATION_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(evidence|data|research|finding|source|basis|grounded|support)\b/i,
		detail:
			"Lead with evidence, not conclusion. State the evidence that warrants the recommendation before stating the recommendation itself. A recommendation that appears before its evidence trains the reader to accept conclusions before evaluating their basis — the opposite of good decision hygiene.",
	},
	{
		pattern: /\b(rationale|reason|because|justify|explain|why|basis)\b/i,
		detail:
			"Make the reasoning chain explicit: evidence → inference → recommendation. If any link in the chain is missing, the recommendation is less defensible and harder to adapt when the context changes. Readers who understand the reasoning can update the recommendation themselves when new evidence arrives.",
	},
	{
		pattern: /\b(confidence|certain|sure|reliable|strong|weak|uncertain)\b/i,
		detail:
			"Assign a confidence level to every recommendation: high (strong direct evidence, low ambiguity), medium (indirect evidence or some conflicting signals), low (limited evidence, high uncertainty, or material assumptions). Confidence levels allow the consumer to calibrate how much weight to place on the recommendation relative to their own judgement.",
	},
	{
		pattern: /\b(trade.?off|alternative|option|instead|but|however|caveat)\b/i,
		detail:
			"Include the main alternative that was not recommended and the specific reason it was not selected. A recommendation that does not acknowledge its strongest competitor appears unaware of the full option space — stakeholders who independently identified that competitor will distrust the recommendation.",
	},
	{
		pattern: /\b(condition|when|if|depend|context|scenario|assume)\b/i,
		detail:
			"State the conditions under which the recommendation holds. Every recommendation is contextual — stating the conditions that make it valid also tells the reader the conditions under which they should seek a different recommendation. Unconditional recommendations are either overconfident or underspecified.",
	},
	{
		pattern:
			/\b(action|next step|implement|decide|commit|adopt|proceed|act)\b/i,
		detail:
			"Close the recommendation with a concrete first action: not 'consider doing X' but 'by [date], [person] should [specific action]'. Recommendations that do not specify an owner and a next action regularly sit unactioned because the gap between recommendation and execution is left to the reader to bridge.",
	},
	{
		pattern: /\b(risk|concern|limit|caveat|downside|challenge|fail)\b/i,
		detail:
			"Document the top risk associated with accepting this recommendation: what would cause it to fail, and what is the mitigation? A recommendation without a named risk falsely implies the decision is low-stakes. Naming the risk enables the consumer to monitor for early warning signals.",
	},
	{
		pattern: /\b(stakeholder|team|owner|sponsor|execut|decision.?maker)\b/i,
		detail:
			"Identify the decision-maker and any stakeholders whose alignment is required to act on this recommendation. Recommendations directed at the wrong audience, or that require sign-off from parties not mentioned, stall in the handoff between analysis and action.",
	},
];

const confidenceModeDescriptions: Record<ConfidenceMode, string> = {
	explicit:
		"explicit — caller provides confidence level as an input to be reflected in the recommendation framing",
	inferred:
		"inferred — confidence level is derived from evidence signal strength, source quality, and constraint satisfaction",
};

const synthRecommendationHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(synthRecommendationInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				`Invalid input: ${parsed.error}`,
			);
		}

		const signals = extractRequestSignals(parsed.data);
		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Recommendation Framing needs the evidence base, the decision question, and the options considered before it can produce a defensible recommendation. Provide: (1) the key evidence or comparison results, (2) the decision to be made, (3) the audience and any constraints.",
			);
		}

		if (
			!signals.hasContext &&
			!signals.hasEvidence &&
			!hasEvidenceBase(combined) &&
			!signals.hasConstraints &&
			!signals.hasDeliverable &&
			!signals.hasSuccessCriteria
		) {
			return buildInsufficientSignalResult(
				context,
				"Recommendation Framing needs a visible evidence base before it can defend a choice. Provide the comparison, findings, benchmarks, or options considered — or gather that evidence first.",
			);
		}

		const includeTradeoffs = parsed.data.options?.includeTradeoffs ?? true;
		const confidenceMode: ConfidenceMode =
			parsed.data.options?.confidenceMode ?? "inferred";
		const confidenceLevel = parsed.data.options?.confidenceLevel;
		const needsStrategyHandoff =
			/\b(strategy|vision|roadmap|operating model|adoption plan)\b/i.test(
				combined,
			);

		if (confidenceMode === "explicit" && confidenceLevel === undefined) {
			return buildInsufficientSignalResult(
				context,
				"Recommendation Framing with explicit confidence requires `options.confidenceLevel` (`low`, `medium`, or `high`) so the recommendation can reflect the caller-supplied certainty level.",
			);
		}

		const details: string[] = [
			`Frame an evidence-based recommendation for "${summarizeKeywords(parsed.data).join(", ") || "the stated decision"}" using ${confidenceModeDescriptions[confidenceMode]}. Structure: evidence → reasoning → recommendation → confidence → conditions. Skipping any structural element produces a recommendation that cannot be independently validated.`,
			"Start from the reference intake: user goal, current state, constraints, and the existing specs, code, benchmarks, or comparison outputs that justify the recommendation. Recommendations should inherit their evidence base; they should not imply that one exists.",
		];

		details.push(
			...RECOMMENDATION_RULES.filter(({ pattern }) =>
				pattern.test(combined),
			).map(({ detail }) => detail),
		);

		if (includeTradeoffs) {
			details.push(
				"Include a tradeoff summary: the top dimension on which the recommended option wins, and the top dimension on which the next-best alternative wins. Tradeoff summaries make the recommendation honest — they show the decision-maker what they are trading away, not just what they are gaining.",
			);
		}

		if (confidenceMode === "explicit" && confidenceLevel !== undefined) {
			details.push(
				`Reflect the caller-supplied confidence level directly in the output: ${confidenceLevel}. This makes the recommendation contract explicit about certainty instead of forcing a downstream reader to infer whether confidence was estimated or provided.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Verify that the recommendation satisfies the stated constraints before framing it: ${signals.constraintList.slice(0, 3).join("; ")}. A recommendation that violates a stated constraint is not a valid recommendation — it is an aspirational suggestion that requires a constraint-change decision first.`,
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Shape the recommendation to produce the stated deliverable: "${parsed.data.deliverable}". Recommendation framing that does not address the deliverable's format and acceptance criteria may be analytically correct but practically unusable.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Tie the recommendation's confidence level to the success criteria: "${parsed.data.successCriteria}". If the available evidence does not support a confident claim that the recommendation will satisfy the criteria, state that explicitly and specify what additional evidence would close the gap.`,
			);
		}

		if (signals.hasContext || signals.hasEvidence) {
			details.push(
				summarizeContextEvidence(signals) ??
					"Ground the recommendation in the provided context: explicitly state which contextual facts most directly influenced the recommendation. Recommendations that do not acknowledge their contextual basis cannot be adapted when the context changes.",
			);
		}

		if (needsStrategyHandoff) {
			details.push(
				"If the real task is to set strategic direction rather than choose from an evidence-backed option set, route the work to strategy framing first. Recommendation framing is for defended choices within a known frame, not for inventing the frame itself.",
			);
		}

		details.push(
			"Close with a recommendation contract: the named decision-maker, the first concrete action, the top risk to monitor, and the evidence gap that would most likely change the recommendation if new data arrived.",
		);

		// --- Artifact Construction ---
		const artifacts = [];
		const recommendationTemplate = includeTradeoffs
			? `{
  "recommendation": string,
  "evidence": string[],
  "reasoning": string,
  "confidence": string,
  "tradeoffs": string[],
  "conditions": string[],
  "nextAction": string,
  "risks": string[],
  "stakeholders": string[]
}`
			: `{
  "recommendation": string,
  "evidence": string[],
  "reasoning": string,
  "confidence": string,
  "conditions": string[],
  "nextAction": string,
  "risks": string[],
  "stakeholders": string[]
}`;
		const recommendationFields = includeTradeoffs
			? [
					"recommendation",
					"evidence",
					"reasoning",
					"confidence",
					"tradeoffs",
					"conditions",
					"nextAction",
					"risks",
					"stakeholders",
				]
			: [
					"recommendation",
					"evidence",
					"reasoning",
					"confidence",
					"conditions",
					"nextAction",
					"risks",
					"stakeholders",
				];

		// Output template for structured recommendation
		artifacts.push(
			buildOutputTemplateArtifact(
				"Recommendation Output Template",
				recommendationTemplate,
				recommendationFields,
				"Structured output for evidence-based recommendations.",
			),
		);

		artifacts.push(
			buildToolChainArtifact(
				"Recommendation framing chain",
				[
					{
						tool: "evidence review",
						description:
							"confirm the findings, comparison, or benchmark inputs that support the choice",
					},
					{
						tool: "reasoning chain",
						description:
							"translate evidence into an explicit why-this-option argument with conditions",
					},
					{
						tool: "confidence declaration",
						description:
							confidenceMode === "explicit"
								? "reflect the caller-supplied confidence level"
								: "infer confidence from evidence quality, conflicts, and constraint fit",
					},
					{
						tool: "action contract",
						description:
							"name the first action, owner, top risk, and stakeholder alignment path",
					},
				],
				"Concrete sequence for turning research outputs into a defended recommendation.",
			),
		);

		artifacts.push(
			buildWorkedExampleArtifact(
				"Recommendation framing example",
				{
					request:
						"frame an evidence-based recommendation from the completed comparison",
					context:
						"the managed option leads on reliability and time-to-production but costs more per query",
					options: {
						confidenceMode,
						...(confidenceLevel === undefined ? {} : { confidenceLevel }),
						includeTradeoffs,
					},
				},
				buildRecommendationExample(
					confidenceLevel ?? "medium",
					includeTradeoffs,
				),
				"Worked example showing the expected contract for recommendation, confidence, risks, and next action.",
			),
		);

		// Recommendation evaluation criteria
		artifacts.push(
			buildEvalCriteriaArtifact(
				"Recommendation Quality Criteria",
				includeTradeoffs
					? [
							"Recommendation is grounded in evidence",
							"Reasoning chain is explicit",
							"Confidence level is stated",
							"Tradeoffs and risks are documented",
							"Next action and stakeholders are specified",
						]
					: [
							"Recommendation is grounded in evidence",
							"Reasoning chain is explicit",
							"Confidence level is stated",
							"Risks are documented",
							"Next action and stakeholders are specified",
						],
				"Criteria for evaluating the quality of recommendation outputs.",
			),
		);

		return createCapabilityResult(
			context,
			`Recommendation Framing produced ${details.length} framing guardrail${details.length === 1 ? "" : "s"} (confidence: ${confidenceMode}, tradeoffs: ${includeTradeoffs ? "included" : "omitted"}).`,
			createFocusRecommendations(
				"Recommendation guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	synthRecommendationHandler,
);
