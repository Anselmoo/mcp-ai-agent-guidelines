import { z } from "zod";
import { bench_blind_comparison_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
import { extractRequestSignals } from "../shared/recommendations.js";
import { BENCH_ADVISORY_DISCLAIMER, matchBenchRules } from "./bench-helpers.js";

const benchBlindComparisonInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			blindLevel: z.enum(["single-blind", "double-blind"]).optional(),
			comparisonMode: z.enum(["pairwise", "ranked", "head-to-head"]).optional(),
			tiePolicy: z.enum(["human-review", "rerun", "judge-model"]).optional(),
		})
		.optional(),
});

const BENCH_BLIND_COMPARISON_RULES: Array<{ pattern: RegExp; detail: string }> =
	[
		{
			pattern: /\b(blind|masked|anonymous|hidden|unlabeled)\b/i,
			detail:
				"Strip model names, prompt variants, and ordering hints before evaluation starts. A blind comparison protocol fails as soon as the evaluator can infer provenance from labels or formatting artifacts.",
		},
		{
			pattern: /\b(pairwise|head.to.head|a.?b|versus|vs)\b/i,
			detail:
				"Use pairwise comparisons when the judgment question is relative quality rather than absolute scoring. Pairwise protocols reduce scale drift and are easier for raters to apply consistently.",
		},
		{
			pattern: /\b(rank|ranking|ladder|tournament)\b/i,
			detail:
				"Use ranked evaluation only when the full ordering matters. Ranking more than a few outputs at once increases rater fatigue and introduces unstable mid-table judgments.",
		},
		{
			pattern: /\b(bias|anchor|order|primacy|recency|leak)\b/i,
			detail:
				"Randomize presentation order and keep formatting symmetric to reduce order bias. Any fixed ordering or formatting asymmetry can leak provenance and distort the result.",
		},
		{
			pattern: /\b(tie|disagree|split|rater|adjudicat|judge)\b/i,
			detail:
				"Define the disagreement policy before rating begins: rerun, adjudicate with a judge model, or escalate to human review. Post-hoc tie handling weakens the credibility of the comparison.",
		},
	];

const benchBlindComparisonHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(benchBlindComparisonInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				"Blind Comparison needs the outputs being compared, the blinding protocol, or the bias concern before it can produce targeted comparison guidance.",
			);
		}

		const signals = extractRequestSignals(parsed.data);
		if (
			signals.keywords.length === 0 &&
			!signals.hasContext &&
			!signals.hasDeliverable
		) {
			return buildInsufficientSignalResult(
				context,
				"Blind Comparison needs the outputs being compared, the blinding protocol, or the bias concern before it can produce targeted comparison guidance.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		if (
			!/\b(blind|pairwise|bias|judge|rank|comparison|output|mask)\b/i.test(
				combined,
			) &&
			!signals.hasContext
		) {
			return buildInsufficientSignalResult(
				context,
				"Blind Comparison needs the comparison mode, the evaluator protocol, and the bias risk you want to control before it can suggest a robust setup.",
			);
		}

		const blindLevel = parsed.data.options?.blindLevel ?? "single-blind";
		const comparisonMode = parsed.data.options?.comparisonMode ?? "pairwise";
		const tiePolicy = parsed.data.options?.tiePolicy ?? "human-review";

		const details: string[] = [
			`Design a ${comparisonMode} comparison with a ${blindLevel} protocol around "${summarizeKeywords(parsed.data).join(", ") || "the requested outputs"}". The setup should make provenance leakage, rater bias, and tie resolution explicit before scoring starts.`,
		];

		details.push(...matchBenchRules(BENCH_BLIND_COMPARISON_RULES, combined));

		details.push(
			`Tie policy: ${tiePolicy}. Document who resolves split judgments and whether disagreement triggers reruns, adjudication, or a final human decision.`,
		);

		if (signals.hasDeliverable) {
			details.push(
				`Format the comparison output so it directly supports the stated deliverable: "${parsed.data.deliverable}". The result should show the winning option, the confidence level, and the unresolved disagreements.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Translate the success criteria into rater instructions: "${parsed.data.successCriteria}". Raters should know what a win means before they review the first pair.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Respect these comparison constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints often affect rater pool size, the number of pairs, or whether double-blind review is feasible.`,
			);
		}

		if (details.length === 2) {
			details.push(
				"Start with a small blinded pilot, confirm that raters cannot infer provenance, and only then scale the protocol to the full comparison set.",
			);
		}

		details.push(BENCH_ADVISORY_DISCLAIMER);

		const artifacts = [
			buildEvalCriteriaArtifact(
				"Blind comparison checklist",
				[
					"Remove model names, prompt labels, and ordering hints before scoring.",
					"Keep formatting symmetric so provenance does not leak through presentation.",
					"Randomize candidate order and record the random seed.",
					"Define the tie policy before any judgments are collected.",
					"Reveal the mapping only after the final comparison is locked.",
				],
				"Use this checklist to verify that the comparison is actually blind.",
			),
			buildComparisonMatrixArtifact(
				"Blind comparison protocol matrix",
				[
					"protocol",
					"bias control",
					"operational cost",
					"best use",
					"known risk",
				],
				[
					{
						label: "single-blind",
						values: [
							"hide provenance from raters",
							"low",
							"lightweight default for most comparisons",
							"operator leakage can still bias the run",
						],
					},
					{
						label: "double-blind",
						values: [
							"hide provenance from raters and operators",
							"medium",
							"high-stakes or sensitive comparisons",
							"harder to set up and reveal correctly",
						],
					},
					{
						label: "pairwise",
						values: [
							"compare two candidates at a time",
							"high for relative decisions",
							"small candidate sets",
							"does not scale well to large rankings",
						],
					},
				],
				"Use this matrix to choose the simplest protocol that still blocks bias and leakage.",
			),
			buildToolChainArtifact(
				"Blind comparison protocol",
				[
					{
						tool: "intake",
						description:
							"Capture the candidate outputs and the intended comparison mode.",
					},
					{
						tool: "mask",
						description:
							"Strip labels, provenance hints, and any ordering artifacts.",
					},
					{
						tool: "shuffle",
						description:
							"Randomize presentation order and preserve a symmetric layout.",
					},
					{
						tool: "score",
						description:
							"Collect pairwise or ranked judgments under the agreed tie policy.",
					},
					{
						tool: "reveal",
						description:
							"Map anonymous labels back to provenance after scoring is complete.",
					},
				],
				"Follow these steps to keep the comparison protocol auditable.",
			),
			buildOutputTemplateArtifact(
				"Blind comparison packet",
				`{
  "goal": "<comparison question>",
  "current_state": "<candidates and decision context>",
  "constraints": ["<time>", "<team>", "<compliance>"],
  "reference_artifacts": ["<outputs>", "<rubric>", "<seed>"],
  "comparison_mode": "<pairwise|ranked|head-to-head>",
  "blind_level": "<single-blind|double-blind>",
  "tie_policy": "<human-review|rerun|judge-model>",
  "validation": "<how labels stay hidden>",
  "next_steps": ["<run>", "<score>", "<reveal>"]
}`,
				[
					"goal",
					"current_state",
					"constraints",
					"reference_artifacts",
					"comparison_mode",
					"blind_level",
					"tie_policy",
					"validation",
					"next_steps",
				],
				"Use this blueprint to keep the blind comparison reproducible, bias-aware, and easy to validate.",
			),
			buildWorkedExampleArtifact(
				"Blind comparison example",
				{
					candidates: [
						{ label: "A", output: "concise answer with one citation" },
						{ label: "B", output: "longer answer with better coverage" },
					],
					comparisonMode: "pairwise",
					blindLevel: "double-blind",
					tiePolicy: "human-review",
				},
				{
					winner: "B",
					rationale:
						"Candidate B covers more required points without leaking provenance cues, so it wins the pairwise blind review.",
					confidence: "moderate",
					tieResolution: "no tie; human review not needed",
				},
				"Demonstrates how to report a blind comparison outcome without exposing labels.",
			),
		];

		return createCapabilityResult(
			context,
			`Blind Comparison produced ${details.length - 1} protocol guideline${details.length === 2 ? "" : "s"} (mode: ${comparisonMode}; blind level: ${blindLevel}; tie policy: ${tiePolicy}).`,
			createFocusRecommendations(
				"Blind comparison guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	benchBlindComparisonHandler,
);
