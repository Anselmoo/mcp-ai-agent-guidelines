import { z } from "zod";
import type { SkillArtifact } from "../../contracts/runtime.js";
import { prompt_refinement_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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

const promptRefinementInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			evidenceMode: z
				.enum(["eval-results", "observed-failures", "paired-comparison"])
				.optional(),
			maxExperiments: z.number().int().positive().max(6).optional(),
			preserveStructure: z.boolean().optional(),
		})
		.optional(),
});

const REFINEMENT_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(hallucin|factual|accuracy|grounded|unsupported|wrong|citation)\b/i,
		detail:
			"Separate grounding failures from instruction failures. If the model invents facts, first tighten evidence-use rules and citation requirements before changing tone or output format.",
	},
	{
		pattern: /\b(verbose|length|concise|too long|too short|rambl)\b/i,
		detail:
			"Constrain output budget explicitly and show one example at the target level of detail. Length problems persist when prompts ask for 'concise' output but never show what concise means in the task context.",
	},
	{
		pattern: /\b(json|schema|format|parse|field|malformed)\b/i,
		detail:
			"Treat schema failures as contract failures. Tighten the response template, specify invalid-output recovery behavior, and change only one formatting clause per experiment so the winning edit is attributable.",
	},
	{
		pattern:
			/\b(refus|policy|safe|compliance|blocked|over.?refus|under.?refus)\b/i,
		detail:
			"Distinguish between over-refusal and under-refusal before editing the prompt. The corrective move is opposite in each case: either clarify permitted work or strengthen the boundary and escalation language.",
	},
	{
		pattern: /\b(cost|latency|token|slow|window|expensive)\b/i,
		detail:
			"Reduce prompt surface area deliberately: remove duplicated rules, collapse low-value examples, and keep only the context that changes model behavior. Prompt length is an optimization target only after you know which clauses matter.",
	},
	{
		pattern: /\b(variance|flaky|inconsisten|drift|repeat|unstable)\b/i,
		detail:
			"Run paired comparisons with one controlled edit at a time. Multi-clause edits may improve one run and degrade the next without revealing which clause caused the shift.",
	},
	{
		pattern: /\b(edge case|coverage|miss|fail case|test case|corner)\b/i,
		detail:
			"Expand the evaluation set with targeted failure cases before declaring the prompt fixed. Refinement that optimizes only the previously observed examples often overfits and regresses elsewhere.",
	},
];

const REFINEMENT_EXPERIMENTS = [
	{
		change: "preserve structure and tighten one clause",
		when: "the prompt works structurally but fails a narrow behavior",
		risk: "too much edit churn can hide the real cause",
	},
	{
		change: "add an explicit counterexample or failure case",
		when: "the model confuses the desired and undesired behavior",
		risk: "examples can overfit if they are too specific",
	},
	{
		change: "strengthen the output schema or recovery path",
		when: "format drift or malformed output blocks downstream use",
		risk: "over-constraining may reduce useful flexibility",
	},
	{
		change: "compare two prompt versions with the same eval slice",
		when: "the result is flaky or the improvement is unclear",
		risk: "multi-clause edits make attribution harder",
	},
];

function hasRefinementEvidence(input: string) {
	return /\b(eval|fail|failure|wrong|hallucin|issue|problem|compare|version|regress|drift|flaky|latency|cost|json|format|refus)\b/i.test(
		input,
	);
}

const promptRefinementHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(promptRefinementInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				`Invalid input: ${parsed.error}`,
			);
		}

		const signals = extractRequestSignals(parsed.data);
		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		if (
			!signals.hasContext &&
			!signals.hasSuccessCriteria &&
			!signals.hasDeliverable &&
			!hasRefinementEvidence(combined)
		) {
			return buildInsufficientSignalResult(
				context,
				"Prompt Refinement needs an existing prompt failure, evaluation signal, or success target before it can recommend a disciplined iteration loop. Provide: (1) what is failing, (2) how you observed it, (3) what better looks like.",
			);
		}

		const evidenceMode =
			parsed.data.options?.evidenceMode ?? "observed-failures";
		const maxExperiments = parsed.data.options?.maxExperiments ?? 3;
		const preserveStructure = parsed.data.options?.preserveStructure ?? true;

		const details: string[] = [
			`Plan up to ${maxExperiments} refinement experiment${maxExperiments === 1 ? "" : "s"} for "${summarizeKeywords(parsed.data).join(", ") || "the failing prompt"}" using ${evidenceMode}. Change one causal variable per experiment so the result can be attributed to a specific edit rather than to prompt churn.`,
		];

		details.push(
			...REFINEMENT_RULES.filter(({ pattern }) => pattern.test(combined)).map(
				({ detail }) => detail,
			),
		);

		if (preserveStructure) {
			details.push(
				"Preserve the current prompt skeleton unless the evidence shows the structure itself is broken. Refinement should start with the smallest edit that can plausibly fix the failure mode.",
			);
		}

		if (signals.hasContext) {
			details.push(
				"Use the provided context as the failure record: capture the failing inputs, observed outputs, and why they missed the mark before proposing any revision. Refinement without a failure record is guesswork.",
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Judge each candidate revision by whether it improves delivery of "${parsed.data.deliverable}". If the refinement hypothesis does not connect to the deliverable, it should not enter the experiment queue.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Treat the success criteria as the stop condition for refinement: "${parsed.data.successCriteria}". Do not keep iterating after the prompt reaches the required threshold — further changes are a new hypothesis, not the same experiment.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Keep the refinement loop inside the stated constraints: ${signals.constraintList.slice(0, 3).join("; ")}. A prompt that improves quality by violating deployment constraints has not actually improved.`,
			);
		}

		const artifacts: SkillArtifact[] = [
			buildComparisonMatrixArtifact(
				"Refinement experiment plan",
				["Experiment", "Change", "Best when", "Risk"],
				Array.from({ length: maxExperiments }, (_, i) => ({
					label: `Experiment ${i + 1}`,
					values: [
						REFINEMENT_EXPERIMENTS[i % REFINEMENT_EXPERIMENTS.length].change,
						REFINEMENT_EXPERIMENTS[i % REFINEMENT_EXPERIMENTS.length].when,
						REFINEMENT_EXPERIMENTS[i % REFINEMENT_EXPERIMENTS.length].risk,
					],
				})),
				`Plan for up to ${maxExperiments} prompt refinement experiments.`,
			),
			buildOutputTemplateArtifact(
				"Prompt refinement change log",
				[
					"# Prompt refinement log",
					"## Failure summary",
					"## Hypothesis",
					"## Before excerpt",
					"## After excerpt",
					"## Evaluation result",
					"## Decision",
					"## Rollback note",
				].join("\n"),
				[
					"Failure summary",
					"Hypothesis",
					"Before excerpt",
					"After excerpt",
					"Evaluation result",
					"Decision",
					"Rollback note",
				],
				"Explicit output-schema guidance for a prompt refinement loop.",
			),
			buildToolChainArtifact(
				"Refinement loop",
				[
					{
						tool: "diagnose",
						description:
							"separate grounding, formatting, refusal, and variance failures",
					},
					{
						tool: "edit",
						description:
							"change one causal variable and keep the rest of the prompt stable",
					},
					{
						tool: "compare",
						description:
							"run the revised prompt against the same eval slice or failure record",
					},
					{
						tool: "decide",
						description:
							"keep, roll back, or queue the next experiment based on the evidence",
					},
				],
				"Concrete sequence for disciplined prompt refinement.",
			),
			buildWorkedExampleArtifact(
				"Before/after refinement example",
				{
					before: "Answer with JSON.",
					failure: "The model adds unsupported citations and malformed fields.",
					evidenceMode,
					successCriteria: parsed.data.successCriteria ?? "",
				},
				{
					before: "Answer with JSON.",
					after:
						"Return valid JSON with fields `summary`, `sources`, and `confidence`; if sources are unsupported, say so instead of inventing them.",
					expected_effect: [
						"fewer malformed outputs",
						"no unsupported citations",
						"clear recovery behavior when evidence is missing",
					],
				},
				"Worked example showing a concrete before/after refinement move.",
			),
		];

		if (signals.hasSuccessCriteria) {
			artifacts.push(
				buildEvalCriteriaArtifact(
					"Refinement success criteria",
					[
						"The failure mode is named and traced to one causal hypothesis.",
						"The revised prompt changes one main variable at a time.",
						"The same evaluation slice is used before and after the edit.",
						`The result satisfies: ${parsed.data.successCriteria}`,
					],
					"Criteria for prompt refinement success.",
				),
			);
		}

		return {
			...createCapabilityResult(
				context,
				`Prompt Refinement produced ${details.length} iteration guardrail${details.length === 1 ? "" : "s"} (${evidenceMode}; max experiments: ${maxExperiments}; preserve structure: ${preserveStructure ? "yes" : "no"}).`,
				createFocusRecommendations(
					"Prompt refinement guidance",
					details,
					context.model.modelClass,
				),
			),
			artifacts,
		};
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	promptRefinementHandler,
);
