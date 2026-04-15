import { z } from "zod";
import { eval_prompt_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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

const evalPromptInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			scoreMode: z.enum(["single", "vote", "pairwise"]).optional(),
			includeBaselines: z.boolean().optional(),
			benchmarkFamily: z
				.enum(["golden-set", "regression-suite", "task-battery"])
				.optional(),
		})
		.optional(),
});

const EVAL_PROMPT_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(prompt|template|instruction|system|variant)\b/i,
		detail:
			"Evaluate prompts as versioned assets, not isolated strings. Record the prompt version, intended task, and target output contract so the evaluation result is traceable.",
	},
	{
		pattern: /\b(score|grade|quality|judge|rubric)\b/i,
		detail:
			"Define how prompt quality is scored before you run the eval. Prompt scoring without a stable rubric or baseline quickly turns into subjective preference.",
	},
	{
		pattern: /\b(benchmark|suite|golden|dataset|regression)\b/i,
		detail:
			"Run prompts against a stable benchmark family that includes both representative tasks and known weak spots. Prompt evals become brittle when they overfit to a tiny happy-path set.",
	},
	{
		pattern: /\b(compare|versus|variant|ab|head.to.head)\b/i,
		detail:
			"Use comparative evaluation when the real question is which prompt version should survive. Comparative framing is more actionable than scoring one prompt in isolation.",
	},
	{
		pattern: /\b(failure|hallucinat|unsafe|refusal|edge.case)\b/i,
		detail:
			"Capture the failure patterns you expect the prompt to trigger or avoid. Prompt evaluation should verify both desired behavior and controlled refusal behavior.",
	},
	{
		pattern: /\b(cost|latency|token|efficiency)\b/i,
		detail:
			"Include cost or latency checks when prompt length or chaining strategy might affect operational viability. A high-quality prompt that is too expensive may still be the wrong choice.",
	},
	{
		pattern: /\b(vote|majority|rater|multi.model)\b/i,
		detail:
			"If you use multi-rater or multi-model voting, define the tie-break path and the escalation threshold before the eval starts. Voting only helps when disagreement handling is explicit.",
	},
];

const evalPromptHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(evalPromptInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				"Prompt Evaluation needs the prompt objective, benchmark surface, or scoring intent before it can produce targeted evaluation guidance.",
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
				"Prompt Evaluation needs the prompt objective, benchmark surface, or scoring intent before it can produce targeted evaluation guidance.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		if (
			!/\b(prompt|benchmark|score|grade|variant|failure|vote|dataset)\b/i.test(
				combined,
			) &&
			!signals.hasContext
		) {
			return buildInsufficientSignalResult(
				context,
				"Prompt Evaluation needs the prompt family, benchmark shape, and what good or bad behavior should look like before it can suggest an eval plan.",
			);
		}

		const scoreMode = parsed.data.options?.scoreMode ?? "single";
		const includeBaselines = parsed.data.options?.includeBaselines ?? true;
		const benchmarkFamily =
			parsed.data.options?.benchmarkFamily ?? "golden-set";

		const details: string[] = [
			`Evaluate "${summarizeKeywords(parsed.data).join(", ") || "the requested prompt asset"}" with a ${scoreMode} scoring mode against a ${benchmarkFamily} benchmark family. The evaluation should make it obvious which prompt behavior is being rewarded, penalized, or compared.`,
		];

		details.push(...matchEvalRules(EVAL_PROMPT_RULES, combined));

		if (includeBaselines) {
			details.push(
				"Compare the prompt against the last trusted prompt version or a stable baseline prompt. Without a baseline, prompt improvements are hard to separate from evaluator drift.",
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Shape the prompt-eval report to support the requested deliverable: "${parsed.data.deliverable}". The report should make the keep/change/rollback decision explicit.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Turn the success criteria into prompt-eval pass signals: "${parsed.data.successCriteria}". Prompt evaluation should check the actual promise the prompt is supposed to keep.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Respect these prompt-eval constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints often affect dataset choice, grader style, or whether multi-rater voting is affordable.`,
			);
		}

		if (details.length === 2) {
			details.push(
				"Start with a baseline comparison on a stable prompt set, include one failure-focused slice, and require the final report to state whether the new prompt should replace the baseline.",
			);
		}

		details.push(EVAL_ADVISORY_DISCLAIMER);

		const artifacts = [
			buildComparisonMatrixArtifact(
				"Prompt evaluation matrix",
				["prompt_variant", "golden_set", "score", "decision"],
				[
					{
						label: "baseline",
						values: [
							"trusted reference prompt",
							"golden set or regression suite",
							"baseline score",
							"retain as the comparison anchor",
						],
					},
					{
						label: "candidate",
						values: [
							"new prompt revision",
							"same benchmark family",
							"candidate score",
							"keep, change, or rollback",
						],
					},
					{
						label: "failure slice",
						values: [
							"known weak or unsafe case",
							"failure-focused examples",
							"penalize regressions",
							"block if the failure is release-relevant",
						],
					},
				],
				"Compare prompt versions against the same benchmark family so the decision stays grounded.",
			),
			buildEvalCriteriaArtifact(
				"Prompt evaluation acceptance criteria",
				[
					"The prompt version and intended task are named in the report.",
					"The same benchmark family is used for the baseline and candidate.",
					"Failure slices are included so regressions cannot hide in the average score.",
					"The decision is explicit: keep, change, or rollback.",
				],
				"These criteria keep prompt evaluation tied to a release decision.",
			),
			buildOutputTemplateArtifact(
				"Prompt eval report template",
				`{
  "prompt_version": "<id>",
  "benchmark_family": "<golden-set|regression-suite|task-battery>",
  "baseline": "<trusted reference>",
  "score_mode": "<single|vote|pairwise>",
  "decision": "<keep|change|rollback>"
}`,
				[
					"prompt_version",
					"benchmark_family",
					"baseline",
					"score_mode",
					"decision",
				],
				"Use this template for a release-oriented prompt evaluation summary.",
			),
			buildToolChainArtifact(
				"Prompt evaluation workflow",
				[
					{
						tool: "golden-set",
						description:
							"List the prompt versions, intended task, and target contract.",
					},
					{
						tool: "benchmark-dataset",
						description:
							"Run the candidate and baseline against the same benchmark or golden test set.",
					},
					{
						tool: "score",
						description:
							"Apply the selected scoring mode and record failure slices separately.",
					},
					{
						tool: "handoff",
						description:
							"Write the keep/change/rollback call with the evidence behind it.",
					},
				],
				"Use these steps to keep prompt evaluation reproducible and reviewable.",
			),
			buildWorkedExampleArtifact(
				"Prompt baseline comparison example",
				{
					input:
						"compare prompt v12 to the last trusted baseline on the golden set",
					scoreMode,
					benchmarkFamily,
				},
				{
					winner: "prompt v12",
					reason:
						"higher score on representative tasks but still weak on the failure slice",
					nextStep: includeBaselines
						? "keep the baseline as a fallback until the weak slice is fixed"
						: "re-run with a baseline for confirmation",
				},
				"Worked example showing how to translate the comparison into a keep/change decision.",
			),
		];

		return createCapabilityResult(
			context,
			`Prompt Evaluation produced ${details.length - 1} prompt-eval guideline${details.length === 2 ? "" : "s"} (score mode: ${scoreMode}; benchmark family: ${benchmarkFamily}; baseline: ${includeBaselines ? "included" : "omitted"}).`,
			createFocusRecommendations(
				"Prompt evaluation guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(skillManifest, evalPromptHandler);
