import { z } from "zod";
import { eval_design_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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

const evalDesignInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			datasetStyle: z
				.enum(["golden-set", "hard-negative-heavy", "mixed"])
				.optional(),
			includeAssertions: z.boolean().optional(),
			sampleCount: z.number().int().positive().optional(),
		})
		.optional(),
});

const EVAL_DESIGN_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(dataset|golden|corpus|sample|coverage)\b/i,
		detail:
			"Define the dataset shape first: representative tasks, hard negatives, and the slices that correspond to real operational risk. Eval design should explain why each slice is in the set, not just how many samples it has.",
	},
	{
		pattern: /\b(assert|oracle|check|schema|pass.fail)\b/i,
		detail:
			"Pair every test case with an explicit oracle: schema validation, exact assertions, rubric checks, or pairwise criteria. Without a defined oracle the eval set is just a prompt collection.",
	},
	{
		pattern: /\b(hard.negative|adversarial|edge.case|counterexample)\b/i,
		detail:
			"Reserve capacity for hard negatives and adversarial examples. These cases are what turn an eval from optimistic measurement into a release gate.",
	},
	{
		pattern: /\b(metric|threshold|score|pass|failure|gate)\b/i,
		detail:
			"Name the score threshold and the release implication for crossing it. Teams often discuss eval metrics without saying what score would actually block a launch.",
	},
	{
		pattern: /\b(variance|repeat|flaky|multi.run|stability)\b/i,
		detail:
			"If the system is non-deterministic, plan repeated runs and a variance policy up front. A one-shot eval design cannot separate model randomness from real quality change.",
	},
	{
		pattern: /\b(baseline|compare|previous|regression|version)\b/i,
		detail:
			"Baseline the eval set against the last trusted system version. Regression detection is much stronger when the comparison point is designed into the eval from the start.",
	},
];

const evalDesignHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(evalDesignInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				"Eval Design needs the target behavior, dataset scope, or scoring intent before it can produce a useful evaluation plan.",
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
				"Eval Design needs the target behavior, dataset scope, or scoring intent before it can produce a useful evaluation plan.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		if (
			!/\b(eval|dataset|assert|oracle|score|gate|negative|baseline)\b/i.test(
				combined,
			) &&
			!signals.hasContext
		) {
			return buildInsufficientSignalResult(
				context,
				"Eval Design needs the dataset scope, the grading method, and the failure cases you want the evaluation plan to catch.",
			);
		}

		const datasetStyle = parsed.data.options?.datasetStyle ?? "mixed";
		const includeAssertions = parsed.data.options?.includeAssertions ?? true;
		const sampleCount = parsed.data.options?.sampleCount;

		const details: string[] = [
			`Design the evaluation plan around "${summarizeKeywords(parsed.data).join(", ") || "the requested system behavior"}" using a ${datasetStyle} dataset shape. The plan should explain the dataset slices, the grading oracle, and the release implications of failure.`,
		];

		details.push(...matchEvalRules(EVAL_DESIGN_RULES, combined));

		if (includeAssertions) {
			details.push(
				"Write assertions or rubric checks for the highest-risk cases first. Assertion coverage should grow from the failure modes that matter most, not from whatever is easiest to grade.",
			);
		}

		if (sampleCount !== undefined) {
			details.push(
				`Use the requested sample-count target (${sampleCount}) as a planning constraint, but still explain how the samples distribute across key slices. Sample totals without slice allocation hide coverage gaps.`,
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Make the eval design support the requested deliverable: "${parsed.data.deliverable}". The deliverable should show the test catalog, grading strategy, and what the results will be used to decide.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Convert the success criteria into evaluation thresholds: "${parsed.data.successCriteria}". If the criteria cannot be checked in the plan, they are not yet real acceptance criteria.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Respect these eval-design constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints should change dataset shape or grading approach, not just be appended after the design is complete.`,
			);
		}

		if (details.length === 2) {
			details.push(
				"Start with a mixed golden-set plus hard-negative plan, define the grading oracle explicitly, and tie each dataset slice to a release decision or known failure mode.",
			);
		}

		details.push(EVAL_ADVISORY_DISCLAIMER);

		const artifacts = [
			buildComparisonMatrixArtifact(
				"Eval dataset slice matrix",
				["slice", "count", "oracle", "release role"],
				[
					{
						label: "representative",
						values: [
							datasetStyle === "hard-negative-heavy"
								? "lower share"
								: "primary share",
							"baseline or rubric checks",
							"confirms ordinary behavior",
						],
					},
					{
						label: "hard negatives",
						values: [
							datasetStyle === "golden-set" ? "small share" : "explicit share",
							"strict assertions or schema checks",
							"blocks optimistic false positives",
						],
					},
					{
						label: "edge cases",
						values: [
							"small but mandatory",
							"oracle defined per failure mode",
							"catches rare release regressions",
						],
					},
					{
						label: "baseline regression",
						values: [
							sampleCount !== undefined
								? `${sampleCount} sample target`
								: "tracked separately",
							"compare against last trusted version",
							"separates drift from intentional change",
						],
					},
				],
				"Use this matrix to show how the dataset is intentionally balanced across risk slices.",
			),
			buildToolChainArtifact(
				"Eval design workflow",
				[
					{
						tool: "realistic-prompts",
						description:
							"Write representative prompts that match the real task, not placeholders.",
					},
					{
						tool: "hard-negatives",
						description:
							"Add adversarial and failure-heavy cases that the system should not pass.",
					},
					{
						tool: "discriminative-assertions",
						description:
							"Attach an explicit oracle to each slice so pass and fail are distinguishable.",
					},
					{
						tool: "release-gate",
						description: "Map thresholds to ship, revise, or block decisions.",
					},
				],
				"Use these steps to keep the eval plan tied to release risk.",
			),
			buildOutputTemplateArtifact(
				"Eval plan template",
				`{
  "dataset_style": "<golden-set|hard-negative-heavy|mixed>",
  "sample_count": <number>,
  "slices": [
    {"name": "representative", "oracle": "<type>", "gate": "<pass|review|block>"},
    {"name": "hard negatives", "oracle": "<type>", "gate": "<pass|review|block>"}
  ],
  "baseline": "<trusted reference>",
  "decision": "<ship|revise|block>"
}`,
				["dataset_style", "sample_count", "slices", "baseline", "decision"],
				"Use this template for the machine-readable eval design output.",
			),
			buildEvalCriteriaArtifact(
				"Eval design criteria",
				[
					"Representative prompts are realistic and tied to the target workflow.",
					"Hard negatives and adversarial cases are included explicitly when release risk warrants it.",
					"Every important slice has a discriminative assertion or oracle.",
					"The baseline comparison is versioned and described.",
					"Thresholds map to a concrete release decision.",
				],
				"These criteria keep the design tied to a real release gate.",
			),
			buildWorkedExampleArtifact(
				"Eval design example",
				{
					input:
						"design an eval set with realistic prompts, hard negatives, and discriminative assertions",
					datasetStyle,
					includeAssertions,
					sampleCount: sampleCount ?? 24,
				},
				{
					slices: [
						{ name: "representative", gate: "pass" },
						{ name: "hard negatives", gate: "block" },
						{ name: "baseline regression", gate: "review" },
					],
					oracle: "rubric plus schema checks",
					decision: "block until the regression slice passes",
				},
				"Worked example showing how to turn the dataset plan into an explicit release decision.",
			),
		];

		return createCapabilityResult(
			context,
			`Eval Design produced ${details.length - 1} evaluation-design guideline${details.length === 2 ? "" : "s"} (dataset style: ${datasetStyle}; assertions: ${includeAssertions ? "included" : "omitted"}${sampleCount !== undefined ? `; sample target: ${sampleCount}` : ""}).`,
			createFocusRecommendations(
				"Eval design guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(skillManifest, evalDesignHandler);
