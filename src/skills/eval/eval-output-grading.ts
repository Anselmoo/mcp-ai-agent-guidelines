import { z } from "zod";
import { eval_output_grading_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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

const evalOutputGradingInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			gradingMode: z
				.enum(["rubric", "schema", "pairwise", "judge-model"])
				.optional(),
			includeCalibration: z.boolean().optional(),
			disagreementPolicy: z
				.enum(["human-review", "adjudicate", "rerun"])
				.optional(),
		})
		.optional(),
});

const EVAL_OUTPUT_GRADING_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(rubric|criterion|criteria|scorecard)\b/i,
		detail:
			"Use a rubric when quality is multi-dimensional and needs human-readable criteria. Every rubric dimension should include a pass signal, a failure signal, and one concrete example.",
	},
	{
		pattern: /\b(schema|json|field|structure|validator)\b/i,
		detail:
			"Use schema grading for structural guarantees such as fields, types, and allowed values. Schema checks are strongest when they run before any subjective grading step.",
	},
	{
		pattern: /\b(pairwise|versus|compare|head.to.head)\b/i,
		detail:
			"Use pairwise grading when relative preference matters more than an absolute score. Pairwise methods reduce scale drift but still need a policy for ties and disagreement.",
	},
	{
		pattern: /\b(judge|grader|model|arbiter)\b/i,
		detail:
			"Judge-model grading needs calibration examples and audit traces. Without calibration, judge scores become hard to interpret across releases or prompt variants.",
	},
	{
		pattern: /\b(disagree|split|tie|variance|inconsisten)\b/i,
		detail:
			"Define the disagreement policy before running the grader. You need to know whether disagreement triggers reruns, adjudication, or human escalation.",
	},
	{
		pattern: /\b(calibrat|anchor|golden|reference)\b/i,
		detail:
			"Keep a small set of reference examples to calibrate graders over time. Calibration examples make it obvious when the grading system itself drifts.",
	},
	{
		pattern: /\b(explain|rationale|justify|evidence)\b/i,
		detail:
			"Require the grader to provide a short rationale tied to the rubric or schema. Explanations make reviewer audits far easier when a surprising score appears.",
	},
];

const evalOutputGradingHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(evalOutputGradingInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				"Output Grading needs the grading protocol, rubric shape, or disagreement policy before it can produce targeted grading guidance.",
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
				"Output Grading needs the grading protocol, rubric shape, or disagreement policy before it can produce targeted grading guidance.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		if (
			!/\b(grade|rubric|schema|pairwise|judge|score|disagree|rationale)\b/i.test(
				combined,
			) &&
			!signals.hasContext
		) {
			return buildInsufficientSignalResult(
				context,
				"Output Grading needs the scoring mode, the evidence standard, and how disagreements should be resolved before it can suggest a grading design.",
			);
		}

		const gradingMode = parsed.data.options?.gradingMode ?? "rubric";
		const includeCalibration = parsed.data.options?.includeCalibration ?? true;
		const disagreementPolicy =
			parsed.data.options?.disagreementPolicy ?? "human-review";

		const details: string[] = [
			`Grade "${summarizeKeywords(parsed.data).join(", ") || "the requested outputs"}" with a ${gradingMode} primary mode. The grading plan should define what the grader looks for, how evidence is recorded, and what happens when scores conflict.`,
		];

		details.push(...matchEvalRules(EVAL_OUTPUT_GRADING_RULES, combined));

		if (includeCalibration) {
			details.push(
				"Include calibration examples before launching the full grading pass. Calibration turns grading from an opinion exercise into a repeatable protocol.",
			);
		}

		details.push(
			`Disagreement policy: ${disagreementPolicy}. Document whether the first response is final or whether conflicting grades trigger adjudication, reruns, or human review.`,
		);

		if (signals.hasDeliverable) {
			details.push(
				`Shape the grading output so it supports the requested deliverable: "${parsed.data.deliverable}". The deliverable should clearly show the grade, the evidence, and any unresolved disagreement.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Turn the success criteria into grade thresholds: "${parsed.data.successCriteria}". If a grade cannot be mapped back to the stated success criteria, the protocol is still underspecified.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Respect these grading constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints usually affect grader choice, evidence depth, or whether human escalation is mandatory.`,
			);
		}

		if (details.length === 3) {
			details.push(
				"Start with a rubric plus rationale requirement, add schema validation for structural checks, and only then bring in pairwise or judge-model grading where it clearly adds value.",
			);
		}

		details.push(EVAL_ADVISORY_DISCLAIMER);

		const artifacts = [
			buildOutputTemplateArtifact(
				"Grading rubric template",
				`{
  "dimension": "<name>",
  "pass_signal": "<what success looks like>",
  "fail_signal": "<what failure looks like>",
  "example": "<concrete example>"
}`,
				["dimension", "pass_signal", "fail_signal", "example"],
				"Use one record per rubric dimension so the grader stays auditable.",
			),
			buildEvalCriteriaArtifact(
				"Grading acceptance criteria",
				[
					"Every grading mode names the evidence it consumes.",
					"Rubric dimensions define pass and fail signals with concrete examples.",
					"Schema validation runs before subjective judgment when structure matters.",
					"Pairwise and judge-model grading have calibration examples.",
					"Disagreement policy is explicit and actioned consistently.",
					"Every score can be traced back to a rubric, schema, pairwise, or judge-model decision.",
				],
				"These criteria keep grading decisions reviewable instead of subjective.",
			),
			buildComparisonMatrixArtifact(
				"Grading mode comparison",
				["mode", "best for", "strength", "limit"],
				[
					{
						label: "rubric",
						values: [
							"multi-dimensional quality",
							"human-readable scoring",
							"requires clear examples per dimension",
						],
					},
					{
						label: "schema",
						values: [
							"field- and type-level guarantees",
							"fast structural validation",
							"cannot capture nuanced quality alone",
						],
					},
					{
						label: "pairwise",
						values: [
							"relative preference",
							"stable choice under scale drift",
							"needs explicit tie handling",
						],
					},
					{
						label: "judge-model",
						values: [
							"calibrated free-form judgment",
							"scales to more complex responses",
							"needs anchors and audit traces",
						],
					},
				],
				"Use the matrix to choose the primary grading mode instead of mixing them implicitly.",
			),
			buildToolChainArtifact(
				"Output grading workflow",
				[
					{
						tool: "rubric",
						description:
							"Write the rubric dimensions and scoring anchors before scoring begins.",
					},
					{
						tool: "schema",
						description:
							"Validate structure first when fields or types must be correct.",
					},
					{
						tool: "pairwise",
						description:
							"Compare candidate outputs when relative preference matters more than absolute score.",
					},
					{
						tool: "judge-model",
						description:
							"Escalate ambiguous cases to a calibrated judge model and record the final call.",
					},
				],
				"Use these steps to keep the grading protocol repeatable and auditable.",
			),
			buildWorkedExampleArtifact(
				"Calibration and disagreement example",
				{
					input:
						"calibrate a rubric with one reference answer, one near miss, and one clear failure",
					gradingMode,
					disagreementPolicy,
				},
				{
					calibration: [
						"reference answer scores full points",
						"near miss scores partial credit with a rationale",
						"clear failure triggers rerun or human review",
					],
					disagreementResolution:
						disagreementPolicy === "human-review"
							? "send split grades to a reviewer"
							: disagreementPolicy === "adjudicate"
								? "ask a judge to choose the final score"
								: "rerun the grade with the same rubric",
				},
				"Worked example for the handoff between calibration and final grading.",
			),
		];

		return createCapabilityResult(
			context,
			`Output Grading produced ${details.length - 1} grading-protocol guideline${details.length === 2 ? "" : "s"} (mode: ${gradingMode}; calibration: ${includeCalibration ? "included" : "omitted"}; disagreement: ${disagreementPolicy}).`,
			createFocusRecommendations(
				"Output grading guidance",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	evalOutputGradingHandler,
);
