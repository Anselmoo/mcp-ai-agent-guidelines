import { z } from "zod";
import { eval_prompt_bench_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
import { EVAL_ADVISORY_DISCLAIMER, matchEvalRules } from "./eval-helpers.js";

const evalPromptBenchInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			promptCount: z.number().int().positive().optional(),
			comparisonMode: z
				.enum(["head-to-head", "ladder", "baseline-first"])
				.optional(),
			regressionWindow: z.enum(["single-release", "multi-release"]).optional(),
		})
		.optional(),
});

const EVAL_PROMPT_BENCH_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(benchmark|bench|suite|task.battery|golden)\b/i,
		detail:
			"Use a stable benchmark family and keep the prompt variants fixed for the duration of the run. Prompt benchmarking loses credibility when the suite changes mid-comparison.",
	},
	{
		pattern: /\b(compare|versus|variant|ladder|head.to.head|baseline)\b/i,
		detail:
			"Choose a comparison mode that matches the decision. Head-to-head works for a small number of serious candidates; ladder or baseline-first works better when many prompt variants compete.",
	},
	{
		pattern: /\b(regress|release|window|history|trend)\b/i,
		detail:
			"Look for regressions across an explicit release window rather than a single comparison point. Multi-release regression windows catch slow prompt decay that one-off comparisons miss.",
	},
	{
		pattern: /\b(segment|slice|persona|language|task.type)\b/i,
		detail:
			"Segment prompt-benchmark results by task or user slice. A prompt that wins overall but fails a critical segment may still be the wrong production choice.",
	},
	{
		pattern: /\b(cost|latency|token|budget)\b/i,
		detail:
			"Track operational cost alongside benchmark wins when prompts differ in verbosity or chain depth. Benchmark winners should still satisfy deployment constraints.",
	},
	{
		pattern: /\b(vote|judge|pairwise|tie)\b/i,
		detail:
			"Document the tiebreak method for prompt-benchmark disagreements. If multiple prompts cluster closely, you need a deterministic way to choose the production candidate.",
	},
];

const evalPromptBenchHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(evalPromptBenchInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				"Prompt Benchmarking needs the prompt variants, comparison mode, or regression focus before it can produce a useful benchmark plan.",
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
				"Prompt Benchmarking needs the prompt variants, comparison mode, or regression focus before it can produce a useful benchmark plan.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		if (
			!/\b(prompt|benchmark|variant|compare|baseline|regress|release)\b/i.test(
				combined,
			) &&
			!signals.hasContext
		) {
			return buildInsufficientSignalResult(
				context,
				"Prompt Benchmarking needs the prompt set, the comparison mode, and the regression horizon before it can suggest a benchmark protocol.",
			);
		}

		const promptCount = parsed.data.options?.promptCount;
		const comparisonMode =
			parsed.data.options?.comparisonMode ?? "baseline-first";
		const regressionWindow =
			parsed.data.options?.regressionWindow ?? "single-release";

		const details: string[] = [
			`Benchmark "${summarizeKeywords(parsed.data).join(", ") || "the requested prompt variants"}" with a ${comparisonMode} comparison mode over a ${regressionWindow} regression window. The benchmark should support an explicit keep/replace decision for each prompt variant.`,
		];

		details.push(...matchEvalRules(EVAL_PROMPT_BENCH_RULES, combined));

		if (promptCount !== undefined) {
			details.push(
				`Constrain the run to the requested prompt count (${promptCount}) and explain how the variants were shortlisted. Too many prompt variants dilute benchmark attention and slow interpretation.`,
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Format the prompt-benchmark report for the requested deliverable: "${parsed.data.deliverable}". The deliverable should show the winner, the regression risks, and any unresolved close calls.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Map the success criteria to prompt-benchmark thresholds: "${parsed.data.successCriteria}". Thresholds should make the production selection obvious rather than subjective.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Respect these prompt-benchmark constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints often affect how many prompt variants can be compared or how much judge-model grading is feasible.`,
			);
		}

		if (details.length === 1) {
			details.push(
				"Start with a baseline-first comparison, keep the benchmark family fixed, and report both the overall winner and the segments where that winner is still weak.",
			);
		}

		details.push(EVAL_ADVISORY_DISCLAIMER);

		const artifacts = [
			buildComparisonMatrixArtifact(
				"Prompt benchmark matrix",
				["prompt_variant", "baseline", "regression_window", "decision"],
				[
					{
						label: "baseline-first",
						values: [
							"single trusted reference prompt",
							"explicit baseline comparison",
							"single-release or multi-release",
							"keep or replace against the baseline",
						],
					},
					{
						label: "head-to-head",
						values: [
							"small candidate set",
							"one champion and one challenger",
							"best for immediate trade-offs",
							"declare a winner or escalate ties",
						],
					},
					{
						label: "ladder",
						values: [
							"multiple shortlisted prompts",
							"ordered elimination across variants",
							"best for larger prompt pools",
							"keep the top-ranked prompt",
						],
					},
				],
				"Use the matrix to make prompt benchmarking decisions comparable across release windows.",
			),
			buildEvalCriteriaArtifact(
				"Prompt benchmark acceptance criteria",
				[
					"The benchmark family stays fixed for the duration of the run.",
					"The comparison mode matches the decision being made.",
					"Regression windows are explicit and traceable to a release.",
					"The report names the prompt version that should survive.",
					"Ties and near-ties have a deterministic escalation path.",
					"Operational cost is recorded alongside quality scores when relevant.",
				],
				"These criteria prevent benchmark wins from becoming ambiguous release decisions.",
			),
			buildOutputTemplateArtifact(
				"Prompt benchmark protocol template",
				`{
  "comparison_mode": "<head-to-head|ladder|baseline-first>",
  "regression_window": "<single-release|multi-release>",
  "prompt_count": <number>,
  "segments": ["<slice>"],
  "decision": "<keep|replace|escalate>"
}`,
				[
					"comparison_mode",
					"regression_window",
					"prompt_count",
					"segments",
					"decision",
				],
				"Use this template for a benchmark plan that can be executed and reviewed.",
			),
			buildToolChainArtifact(
				"Prompt benchmarking flow",
				[
					{
						tool: "score",
						description:
							"Score each prompt version against the same benchmark family.",
					},
					{
						tool: "compare",
						description:
							"Compare prompt versions using head-to-head, ladder, or baseline-first framing.",
					},
					{
						tool: "detect-regression",
						description: "Break results down by segment or regression window.",
					},
					{
						tool: "report",
						description:
							"Return the winner, the weak slices, and the release decision.",
					},
				],
				"Follow these steps to turn prompt benchmarking into a reproducible workflow.",
			),
			buildWorkedExampleArtifact(
				"Prompt benchmark decision example",
				{
					input:
						"score three prompt versions against a golden benchmark set and flag regressions",
					comparisonMode,
					regressionWindow,
					promptCount: promptCount ?? 3,
				},
				{
					winner: "prompt variant B",
					reason:
						"wins head-to-head on the representative slice while staying inside the regression window",
					decision:
						regressionWindow === "multi-release"
							? "keep the winner and monitor the next release"
							: "replace the baseline if the failure slice remains stable",
				},
				"Worked example for turning a benchmark result into a release decision.",
			),
		];

		return createCapabilityResult(
			context,
			`Prompt Benchmarking produced ${details.length - 1} prompt-benchmark guideline${details.length === 2 ? "" : "s"} (comparison mode: ${comparisonMode}; regression window: ${regressionWindow}${promptCount !== undefined ? `; prompt count: ${promptCount}` : ""}).`,
			createFocusRecommendations(
				"Prompt benchmarking guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	evalPromptBenchHandler,
);
