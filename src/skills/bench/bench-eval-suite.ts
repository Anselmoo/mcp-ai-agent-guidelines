import { z } from "zod";
import { bench_eval_suite_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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

const benchEvalSuiteInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			dimensions: z
				.array(
					z.enum([
						"accuracy",
						"robustness",
						"safety",
						"cost",
						"latency",
						"fairness",
					]),
				)
				.optional(),
			includeHardNegatives: z.boolean().optional(),
			judgeStrategy: z.enum(["rubric", "pairwise", "schema"]).optional(),
		})
		.optional(),
});

const BENCH_EVAL_SUITE_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(suite|framework|dimension|matrix|coverage)\b/i,
		detail:
			"Define the evaluation dimensions first and map each one to a concrete dataset slice, metric, and pass threshold. Eval suites become decorative when dimensions are named without executable checks.",
	},
	{
		pattern: /\b(hard.negative|adversarial|edge.case|corner.case|failure)\b/i,
		detail:
			"Include hard negatives and edge cases explicitly. A suite that measures only the happy path will overestimate quality and miss operational failure modes.",
	},
	{
		pattern: /\b(cost|latency|throughput|budget|slo)\b/i,
		detail:
			"Treat cost and latency as first-class suite dimensions when they matter operationally. Quality-only suites miss the cases where a system is correct but too slow or too expensive to ship.",
	},
	{
		pattern: /\b(judge|rubric|pairwise|schema|grader)\b/i,
		detail:
			"Choose one grading strategy per dimension and explain why. Mixing rubric, schema, and pairwise grading without boundaries makes the suite hard to interpret and harder to maintain.",
	},
	{
		pattern: /\b(maintain|refresh|drift|version|baseline|regression)\b/i,
		detail:
			"Version the suite and baseline its results so future regressions can be attributed to model, prompt, or dataset changes. Unversioned suites drift silently.",
	},
];

const benchEvalSuiteHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(benchEvalSuiteInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				"Eval Suite Designer needs the evaluation surface, quality dimensions, or grading approach before it can produce a useful suite design.",
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
				"Eval Suite Designer needs the evaluation surface, quality dimensions, or grading approach before it can produce a useful suite design.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		if (
			!/\b(eval|suite|dimension|coverage|judge|metric|negative|benchmark)\b/i.test(
				combined,
			) &&
			!signals.hasContext
		) {
			return buildInsufficientSignalResult(
				context,
				"Eval Suite Designer needs the dimensions you care about, the scoring method, and the failure modes you need the suite to catch.",
			);
		}

		const dimensions = parsed.data.options?.dimensions ?? [
			"accuracy",
			"robustness",
		];
		const includeHardNegatives =
			parsed.data.options?.includeHardNegatives ?? true;
		const judgeStrategy = parsed.data.options?.judgeStrategy ?? "rubric";

		const details: string[] = [
			`Design the evaluation suite around "${summarizeKeywords(parsed.data).join(", ") || "the requested system surface"}" with dimensions for ${dimensions.join(", ")}. The suite should connect each dimension to a dataset slice, a grader, and an action threshold.`,
		];

		details.push(...matchBenchRules(BENCH_EVAL_SUITE_RULES, combined));

		if (includeHardNegatives) {
			details.push(
				"Reserve part of the suite for hard negatives and failure-driven examples. Hard negatives keep the suite honest when the main dataset becomes too familiar.",
			);
		}

		details.push(
			`Use ${judgeStrategy} grading as the primary evaluation strategy unless a dimension clearly requires something different. Consistent grading makes suite interpretation easier across releases.`,
		);

		if (signals.hasDeliverable) {
			details.push(
				`Shape the suite design so it supports the requested deliverable: "${parsed.data.deliverable}". The deliverable should show which dimensions block release, not just list test names.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Translate the success criteria into suite thresholds: "${parsed.data.successCriteria}". Thresholds should be explicit enough to support a ship/no-ship conversation.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Respect these suite-design constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints usually affect dataset size, grader sophistication, or how often the suite can run.`,
			);
		}

		if (details.length === 3) {
			details.push(
				"Start with a small suite that covers the highest-risk dimensions and add breadth only after the team can explain how each dimension influences decisions.",
			);
		}

		details.push(BENCH_ADVISORY_DISCLAIMER);

		const dimensionRows = dimensions.map((dimension) => ({
			label: dimension,
			values: [
				dimension === "accuracy"
					? "representative happy-path and baseline cases"
					: dimension === "robustness"
						? "hard negatives and noisy inputs"
						: dimension === "safety"
							? "refusal and policy boundary cases"
							: dimension === "cost"
								? "token or compute budget checks"
								: dimension === "latency"
									? "p95 / tail latency checks"
									: "slice-specific fairness checks",
				judgeStrategy,
				includeHardNegatives ? "include hard negatives" : "happy-path only",
				"record whether the dimension blocks release or only informs review",
			],
		}));

		const artifacts = [
			buildComparisonMatrixArtifact(
				"Eval suite dimension matrix",
				["dimension", "slice", "grader", "gate"],
				dimensionRows,
				"Map each suite dimension to a concrete dataset slice, grader, and release gate.",
			),
			buildOutputTemplateArtifact(
				"Eval suite manifest template",
				`{
  "goal": "<evaluation objective>",
  "current_state": "<system surface and baseline>",
  "constraints": ["<time>", "<team>", "<compliance>"],
  "reference_artifacts": ["<spec>", "<dataset>", "<baseline>"],
  "dimensions": ["<accuracy>", "<robustness>"],
  "dataset_slices": ["<representative>", "<hard-negative>", "<regression>"],
  "grader": "<rubric|pairwise|schema>",
  "release_gate": "<pass threshold>",
  "validation": "<how the suite stays versioned>",
  "next_steps": ["<materialize>", "<grade>", "<review>"]
}`,
				[
					"goal",
					"current_state",
					"constraints",
					"reference_artifacts",
					"dimensions",
					"dataset_slices",
					"grader",
					"release_gate",
					"validation",
					"next_steps",
				],
				"Use this blueprint to keep the suite design explicit about the goal, inputs, and release gate.",
			),
			buildToolChainArtifact(
				"Eval suite execution flow",
				[
					{
						tool: "define",
						description: "Freeze the dimensions, slices, and gate thresholds.",
					},
					{
						tool: "materialize",
						description: "Prepare the dataset slices and hard negatives.",
					},
					{
						tool: "grade",
						description:
							"Run the selected grader consistently across the suite.",
					},
					{
						tool: "review",
						description:
							"Compare results to the baseline and decide whether to ship.",
					},
				],
				"Follow this flow to keep the suite operational instead of decorative.",
			),
			buildEvalCriteriaArtifact(
				"Eval suite release criteria",
				[
					"Every dimension maps to a concrete dataset slice and grader.",
					"Hard negatives are included for the highest-risk failure modes.",
					"Thresholds are explicit enough to support a ship or no-ship decision.",
					"Baseline and versioning details are captured for future regression analysis.",
					"The suite output identifies what blocks release versus what only informs review.",
				],
				"Use these criteria to tell whether the suite is actually decision-ready.",
			),
			buildWorkedExampleArtifact(
				"Eval suite example",
				{
					request:
						"design an eval suite for a support chatbot with accuracy, safety, and cost gates",
					options: {
						dimensions: ["accuracy", "safety", "cost"],
						includeHardNegatives: true,
						judgeStrategy: "rubric",
					},
					context:
						"Version the suite, include hard negatives, and make the release gate obvious.",
				},
				{
					suite_name: "support-chatbot-regression-suite",
					dimensions: ["accuracy", "safety", "cost"],
					release_gate:
						"ship only if accuracy and safety pass while cost remains within budget",
					key_slices: [
						"representative support tickets",
						"hard negatives",
						"policy boundary cases",
					],
				},
				"Shows how to package a benchmark suite into an execution-ready manifest.",
			),
		];

		return createCapabilityResult(
			context,
			`Eval Suite Designer produced ${details.length - 1} suite-design guideline${details.length === 2 ? "" : "s"} (dimensions: ${dimensions.length}; hard negatives: ${includeHardNegatives ? "included" : "omitted"}; grader: ${judgeStrategy}).`,
			createFocusRecommendations(
				"Eval suite guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	benchEvalSuiteHandler,
);
