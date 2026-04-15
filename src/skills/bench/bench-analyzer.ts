import { z } from "zod";
import { bench_analyzer_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
import { BENCH_ADVISORY_DISCLAIMER, matchBenchRules } from "./bench-helpers.js";

const benchAnalyzerInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			analysisLens: z
				.enum(["regression", "trend", "segmentation", "mixed"])
				.optional(),
			includeOutliers: z.boolean().optional(),
			baselineRequired: z.boolean().optional(),
		})
		.optional(),
});

const BENCH_ANALYZER_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(regress|drop|degrad|worse|backslide)\b/i,
		detail:
			"Check regressions against the last trusted baseline before discussing fixes. Benchmark reviews that skip a baseline often confuse normal variance with real quality loss.",
	},
	{
		pattern: /\b(trend|time.series|over.time|release|history|drift)\b/i,
		detail:
			"Plot the trend across releases or benchmark runs instead of comparing only two points. A single before/after comparison hides slow drift and recovery patterns.",
	},
	{
		pattern: /\b(outlier|spike|anomal|exception|tail)\b/i,
		detail:
			"Separate outliers from the central trend and explain whether they represent benchmark noise, data skew, or a real failure mode. Outlier handling should be explicit in the analysis write-up.",
	},
	{
		pattern: /\b(segment|slice|cohort|language|tenant|category)\b/i,
		detail:
			"Segment benchmark results by the most likely failure slices such as tenant, language, difficulty, or document type. Aggregates alone hide which slice is driving the problem.",
	},
	{
		pattern: /\b(quality|accuracy|precision|recall|metric|score)\b/i,
		detail:
			"Name the primary quality metric, the supporting metrics, and the pass threshold for each one. Benchmark analysis becomes vague when metrics are listed without decision thresholds.",
	},
	{
		pattern: /\b(root.cause|diagnos|why|cause|signal)\b/i,
		detail:
			"Link every benchmark signal to a likely cause hypothesis: prompt drift, retrieval quality, model change, tool instability, or dataset skew. Good benchmark analysis narrows causes, not just symptoms.",
	},
];

const benchAnalyzerHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(benchAnalyzerInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				"Benchmark Analyzer needs a benchmark question, quality signal, or baseline context before it can produce targeted analysis guidance.",
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
				"Benchmark Analyzer needs a benchmark question, quality signal, or baseline context before it can produce targeted analysis guidance.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		if (
			!/\b(benchmark|regress|trend|quality|metric|outlier|segment|baseline|score)\b/i.test(
				combined,
			) &&
			!signals.hasContext
		) {
			return buildInsufficientSignalResult(
				context,
				"Benchmark Analyzer needs the benchmark surface, the quality concern, and the comparison baseline to produce a useful analysis plan.",
			);
		}

		const analysisLens = parsed.data.options?.analysisLens ?? "mixed";
		const includeOutliers = parsed.data.options?.includeOutliers ?? true;
		const baselineRequired = parsed.data.options?.baselineRequired ?? true;

		const details: string[] = [
			`Frame the benchmark review around "${summarizeKeywords(parsed.data).join(", ") || "the requested benchmark surface"}" with a ${analysisLens} analysis lens. The output should distinguish what changed, how confident you are, and what follow-up investigation is justified.`,
		];

		details.push(...matchBenchRules(BENCH_ANALYZER_RULES, combined));

		if (baselineRequired) {
			details.push(
				"Require an explicit baseline comparison in the analysis packet. If there is no trusted baseline, say so clearly and downgrade any regression claim to a hypothesis rather than a conclusion.",
			);
		}

		if (includeOutliers) {
			details.push(
				"Report top outliers separately from the aggregate summary and explain whether they change the release decision. Outlier-aware reporting prevents one bad slice from disappearing inside a mean score.",
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Shape the benchmark report to produce the requested deliverable: "${parsed.data.deliverable}". The deliverable should make the release or rollback implication obvious.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Tie the benchmark analysis to the stated success criteria: "${parsed.data.successCriteria}". A benchmark result is only actionable when it can be judged against explicit pass/fail language.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Respect these benchmark-analysis constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints should change what you compare, not just how you explain it.`,
			);
		}

		if (details.length === 1) {
			details.push(
				"Summarize the current benchmark state, compare it with the last trusted baseline, identify the most suspicious slices, and end with the smallest next investigation that could confirm or reject the suspected regression.",
			);
		}

		details.push(BENCH_ADVISORY_DISCLAIMER);

		const artifacts = [
			buildComparisonMatrixArtifact(
				"Benchmark decision matrix",
				["metric", "baseline", "current", "delta", "decision"],
				[
					{
						label: "quality",
						values: [
							"trusted baseline score",
							"current benchmark score",
							"report the delta and whether it crosses the pass threshold",
							"keep, rollback, or investigate",
						],
					},
					{
						label: "latency",
						values: [
							"baseline p95 latency",
							"current p95 latency",
							"show the release impact of the change",
							"ship only if within latency budget",
						],
					},
					{
						label: "cost",
						values: [
							"baseline token or compute cost",
							"current token or compute cost",
							"capture the operational delta",
							"approve only if the cost increase is justified",
						],
					},
					{
						label: "outliers",
						values: [
							"known noisy slice",
							"current tail behavior",
							"separate from the aggregate trend",
							"investigate before release",
						],
					},
				],
				"Use this matrix to anchor the analysis in concrete release evidence instead of generic benchmark prose.",
			),
			buildOutputTemplateArtifact(
				"Benchmark analysis report template",
				`{
  "goal": "<benchmark question>",
  "current_state": "<baseline, current result, and delta>",
  "constraints": ["<time>", "<team>", "<compliance>"],
  "reference_artifacts": ["<evals>", "<logs>", "<benchmarks>"],
  "analysis_lens": "<regression|trend|segmentation|mixed>",
  "findings": ["<metric>", "<outlier>", "<slice>"],
  "next_steps": ["<confirm>", "<reject>", "<follow-up>"]
}`,
				[
					"goal",
					"current_state",
					"constraints",
					"reference_artifacts",
					"analysis_lens",
					"findings",
					"next_steps",
				],
				"Use this blueprint to keep the benchmark response anchored to the request, the reference artifacts, and the next validation step.",
			),
			buildEvalCriteriaArtifact(
				"Benchmark interpretation checklist",
				[
					"Name the benchmark surface, the trusted baseline, and the comparison window.",
					"Call out the primary metric plus any supporting metrics with explicit thresholds.",
					"Separate aggregate movement from slice-level outliers and explain which one drives the decision.",
					"State whether the result is a keep, rollback, or investigate outcome.",
					"End with the smallest next benchmark step that can confirm or reject the hypothesis.",
				],
				"Use this checklist to make benchmark interpretation measurable instead of impressionistic.",
			),
			buildWorkedExampleArtifact(
				"Benchmark analysis example",
				{
					request:
						"analyze a 2.4-point accuracy drop after release 42 with one noisy tenant slice",
					context:
						"Compare against the last trusted baseline, keep outliers visible, and explain the release implication.",
					options: {
						analysisLens: "regression",
						includeOutliers: true,
						baselineRequired: true,
					},
				},
				{
					summary:
						"Regression confirmed against the release-41 baseline; tenant-b and the long-document slice explain most of the drop.",
					decision: "investigate",
					evidence: [
						"accuracy down 2.4 points versus baseline",
						"tenant-b accounts for the largest outlier",
						"latency and cost remain within budget",
					],
					nextStep:
						"rerun the tenant-b and long-document slices with tracing enabled before deciding on rollback",
				},
				"Shows how to turn benchmark deltas into a release-facing decision packet.",
			),
		];

		return createCapabilityResult(
			context,
			`Benchmark Analyzer produced ${details.length - 1} benchmark-analysis guideline${details.length === 2 ? "" : "s"} (lens: ${analysisLens}; outliers: ${includeOutliers ? "included" : "omitted"}; baseline: ${baselineRequired ? "required" : "optional"}).`,
			createFocusRecommendations(
				"Benchmark analysis guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	benchAnalyzerHandler,
);
