import { z } from "zod";
import { eval_variance_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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

const evalVarianceInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			runCount: z.number().int().positive().optional(),
			tolerancePct: z.number().min(0).max(100).optional(),
			varianceSource: z
				.enum(["model", "prompt", "tooling", "data", "mixed"])
				.optional(),
		})
		.optional(),
});

const EVAL_VARIANCE_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(variance|spread|distribution|std.dev|range)\b/i,
		detail:
			"Measure the spread of results across repeated runs rather than relying on one average score. Variance analysis is about the shape of outcomes, not just the center point.",
	},
	{
		pattern: /\b(flak|inconsisten|jitter|noise|unstable)\b/i,
		detail:
			"Classify whether the instability likely comes from the model, prompt, tooling, or data. A useful variance report narrows the suspected source of randomness.",
	},
	{
		pattern: /\b(run|repeat|sample|replica|multi.run)\b/i,
		detail:
			"Choose a repeat count that is large enough to separate real instability from incidental noise. If the run count is too small, variance claims will not be credible.",
	},
	{
		pattern: /\b(tolerance|threshold|gate|budget|acceptable)\b/i,
		detail:
			"Define the acceptable variance threshold before looking at the data. Without a tolerance policy, teams debate whether variance matters instead of whether it exceeds the allowed window.",
	},
	{
		pattern: /\b(root.cause|source|prompt|model|tool|dataset)\b/i,
		detail:
			"Use the variance result to prioritize the next isolation experiment: hold the prompt fixed, pin the model, freeze tooling, or resample data. Variance analysis should lead to a smaller next experiment, not just a bigger report.",
	},
	{
		pattern: /\b(consisten|stable|reliable|repeatable)\b/i,
		detail:
			"Report both stability and variability. Teams need to know not only that a system is noisy, but also whether the noise still leaves it inside an acceptable operating band.",
	},
];

const evalVarianceHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(evalVarianceInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				"Variance Analysis needs the repeated-run surface, the instability concern, or the tolerance policy before it can produce targeted variance guidance.",
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
				"Variance Analysis needs the repeated-run surface, the instability concern, or the tolerance policy before it can produce targeted variance guidance.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		if (
			!/\b(variance|flaky|consistent|stable|repeat|noise|tolerance)\b/i.test(
				combined,
			) &&
			!signals.hasContext
		) {
			return buildInsufficientSignalResult(
				context,
				"Variance Analysis needs the repeated-run setup, the suspected source of instability, and the allowed tolerance before it can suggest a useful analysis plan.",
			);
		}

		const runCount = parsed.data.options?.runCount;
		const tolerancePct = parsed.data.options?.tolerancePct;
		const varianceSource = parsed.data.options?.varianceSource ?? "mixed";

		const details: string[] = [
			`Analyze variance for "${summarizeKeywords(parsed.data).join(", ") || "the requested workflow surface"}" with a focus on ${varianceSource} as the likely source. The report should explain the spread of outcomes, the acceptable tolerance, and the next isolation step.`,
		];

		details.push(...matchEvalRules(EVAL_VARIANCE_RULES, combined));

		if (runCount !== undefined) {
			details.push(
				`Use the requested repeat count (${runCount}) as the initial sample plan and state whether that sample size is strong enough for a stable variance judgment.`,
			);
		}

		if (tolerancePct !== undefined) {
			details.push(
				`Treat ${tolerancePct}% as the tolerance window and make the report explicit about whether the observed spread stays inside or outside that band.`,
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Shape the variance report to support the requested deliverable: "${parsed.data.deliverable}". The deliverable should show whether instability is acceptable, actionable, or release-blocking.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Translate the success criteria into variance acceptance language: "${parsed.data.successCriteria}". Success criteria should state both the target quality and the allowed stability band.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Respect these variance-analysis constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints often change how many reruns you can afford or which isolation experiments are feasible.`,
			);
		}

		if (details.length === 1) {
			details.push(
				"Run repeated measurements, compare the spread against a named tolerance band, and end with the single next experiment most likely to isolate the dominant variance source.",
			);
		}

		details.push(EVAL_ADVISORY_DISCLAIMER);

		const artifacts = [
			buildComparisonMatrixArtifact(
				"Variance run matrix",
				["run", "score", "spread", "source", "decision"],
				[
					{
						label: "run-1",
						values: [
							"first repeated measurement",
							"record the observed score",
							"compare to the mean and tolerance band",
							varianceSource,
							"retain if inside tolerance",
						],
					},
					{
						label: "run-2",
						values: [
							"second repeated measurement",
							"record the observed score",
							"compare to the mean and tolerance band",
							varianceSource,
							"retain if inside tolerance",
						],
					},
					{
						label: "outlier",
						values: [
							"largest deviation from the median",
							"flag the outlier score",
							"report why it diverged",
							varianceSource,
							"investigate before release",
						],
					},
				],
				"Use this matrix to tie repeated measurements to a concrete variance call.",
			),
			buildToolChainArtifact(
				"Variance analysis workflow",
				[
					{
						tool: "repeat",
						description:
							"Run the same request multiple times under a fixed configuration.",
					},
					{
						tool: "measure",
						description:
							"Capture score spread, outliers, and any pattern that suggests drift.",
					},
					{
						tool: "compare",
						description:
							"Compare the spread against the tolerance band and the expected operating range.",
					},
					{
						tool: "isolate",
						description:
							"Hold one variable constant and rerun to identify the dominant variance source.",
					},
				],
				"Use this chain to move from noisy outcomes to a specific follow-up experiment.",
			),
			buildOutputTemplateArtifact(
				"Variance report template",
				`{
  "variance_source": "<model|prompt|tooling|data|mixed>",
  "run_count": <number>,
  "tolerance_pct": <number>,
  "summary": "<inside|outside> tolerance",
  "next_experiment": "<single isolation step>"
}`,
				[
					"variance_source",
					"run_count",
					"tolerance_pct",
					"summary",
					"next_experiment",
				],
				"Use this template for a repeatable variance summary.",
			),
			buildEvalCriteriaArtifact(
				"Variance acceptance criteria",
				[
					"The run count is large enough to support the claim.",
					"The tolerance band is explicit before looking at the data.",
					"The report distinguishes acceptable noise from release-blocking instability.",
					"The likely variance source is narrowed to the next isolation step.",
					"The result is framed as flakiness or consistency across multiple runs.",
				],
				"These criteria keep the variance analysis actionable.",
			),
			buildWorkedExampleArtifact(
				"Variance triage example",
				{
					input:
						"measure output variance across repeated runs of the same prompt and check for flakiness",
					runCount: runCount ?? 7,
					tolerancePct: tolerancePct ?? 12,
					varianceSource,
				},
				{
					observation:
						"one run falls outside the tolerance band while the other six cluster tightly",
					call: "treat the result as a noisy but actionable variance signal",
					nextStep:
						"freeze the suspected source and rerun to isolate whether the model or tooling is drifting",
				},
				"Worked example showing how to turn spread into a concrete isolation step.",
			),
		];

		return createCapabilityResult(
			context,
			`Variance Analysis produced ${details.length - 1} variance-guideline${details.length === 2 ? "" : "s"} (variance source: ${varianceSource}${runCount !== undefined ? `; run count: ${runCount}` : ""}${tolerancePct !== undefined ? `; tolerance: ${tolerancePct}%` : ""}).`,
			createFocusRecommendations(
				"Variance analysis guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	evalVarianceHandler,
);
