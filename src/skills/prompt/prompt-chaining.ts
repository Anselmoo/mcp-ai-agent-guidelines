import { z } from "zod";
import { prompt_chaining_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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

const promptChainingInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			stageCount: z.number().int().positive().max(8).optional(),
			handoffStyle: z
				.enum(["structured", "compact", "schema-first"])
				.optional(),
			includeValidation: z.boolean().optional(),
		})
		.optional(),
});

const CHAINING_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(decompose|break down|sequence|step|stage|pipeline|workflow)\b/i,
		detail:
			"Give each chain stage exactly one transformation responsibility and one exit artifact. Stages that both interpret and transform inputs are hard to debug because the failure can come from either the reasoning step or the formatting step.",
	},
	{
		pattern: /\b(extract|summari[sz]e|classif|transform|rewrite|convert)\b/i,
		detail:
			"Normalize the intermediate output contract between stages. If stage 1 emits prose but stage 2 expects fields, the chain drifts because downstream prompts must infer structure that upstream prompts never guaranteed.",
	},
	{
		pattern:
			/\b(reference|retriev|source|document|context|knowledge|citation)\b/i,
		detail:
			"Freeze the source set before the chain starts and require each stage to preserve provenance for reused facts. Chains that let later stages silently substitute new sources become impossible to verify.",
	},
	{
		pattern: /\b(validate|check|review|qa|assert|verify|test)\b/i,
		detail:
			"Insert a validator stage that inspects the previous stage's artifact against the expected schema, factual grounding, and task completion criteria before the chain advances.",
	},
	{
		pattern: /\b(branch|fallback|retry|recover|repair|rework)\b/i,
		detail:
			"Define a bounded repair path for stage failures: retry once with a narrower instruction, otherwise route to a repair prompt or a human checkpoint. Unbounded retries hide a weak stage design behind extra tokens.",
	},
	{
		pattern: /\b(token|latency|cost|budget|window|efficien)\b/i,
		detail:
			"Trim intermediate artifacts to the minimum fields the next stage needs. Passing full transcripts across the chain expands cost and increases the chance that stale details override the current task.",
	},
	{
		pattern: /\b(policy|privacy|secur|compliance|regulated|sensitive)\b/i,
		detail:
			"Scrub or mask sensitive content before every handoff stage and state which fields may cross the boundary. Prompt chains often violate policy at handoff boundaries, not at the initial intake.",
	},
];

const promptChainingHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(promptChainingInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				`Invalid input: ${parsed.error}`,
			);
		}

		const signals = extractRequestSignals(parsed.data);
		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Prompt Chaining needs the chain goal, stage boundaries, or source artifacts before it can suggest a reliable sequence. Provide: (1) the end-to-end task, (2) what each stage should transform, (3) the expected final artifact.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const stageCount = parsed.data.options?.stageCount ?? 3;
		const handoffStyle = parsed.data.options?.handoffStyle ?? "structured";
		const includeValidation = parsed.data.options?.includeValidation ?? true;
		const successCriteria = parsed.data.successCriteria;

		const details: string[] = [
			`Design a ${stageCount}-stage prompt chain for "${summarizeKeywords(parsed.data).join(", ") || "the requested workflow"}" with ${handoffStyle} handoffs. Each handoff should specify the artifact shape, completion test, and what the next stage is allowed to assume.`,
		];

		details.push(
			...CHAINING_RULES.filter(({ pattern }) => pattern.test(combined)).map(
				({ detail }) => detail,
			),
		);

		if (includeValidation) {
			details.push(
				"Reserve one stage or checkpoint for validation before the final output is released. Chains that only validate at the very end force every upstream error to survive until the most expensive point in the workflow.",
			);
		}

		if (signals.hasContext) {
			details.push(
				"Seed the first stage with the provided artifacts and known context instead of asking the chain to rediscover them. A chain should transform supplied information, not paraphrase it back to itself.",
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Make the last stage produce the stated deliverable: "${parsed.data.deliverable}". Work backwards from that artifact so earlier stages emit only the ingredients the final stage needs.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Turn the success criteria into per-stage exit checks: "${parsed.data.successCriteria}". If a criterion cannot be checked at any stage, the chain is under-specified and should not be promoted to production use.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Apply the stated constraints to stage design and handoffs as hard limits: ${signals.constraintList.slice(0, 3).join("; ")}. Constraint violations should stop the chain, not merely annotate the output.`,
			);
		}

		const steps = Array.from({ length: stageCount }, (_, i) => ({
			tool: `stage-${i + 1}`,
			description: `Stage ${i + 1} in the prompt chain${i === stageCount - 1 && signals.hasDeliverable ? ` (produces: ${parsed.data.deliverable})` : ""}`,
		}));

		const artifacts = [
			buildComparisonMatrixArtifact(
				"Handoff style matrix",
				["Style", "Best use", "Boundary shape"],
				[
					{
						label: "structured",
						values: [
							"the next stage needs clear handoff fields",
							"every stage emits a named artifact and completion check",
						],
					},
					{
						label: "compact",
						values: [
							"the chain is short and the payload is already obvious",
							"the next stage must infer hidden structure",
						],
					},
					{
						label: "schema-first",
						values: [
							"downstream stages need stable fields and validation",
							"the schema is likely to drift between stages",
						],
					},
				],
				"Compare handoff styles before you lock the prompt chain contract.",
			),
			buildOutputTemplateArtifact(
				"Stage contract template",
				[
					"{",
					'  "stage": "<n>",',
					'  "purpose": "<transformation>",',
					'  "input_contract": ["<field>"],',
					'  "exit_criteria": ["<check>"],',
					'  "handoff_artifact": "<next-stage input>",',
					'  "validator": "<schema or review gate>"',
					"}",
				].join("\n"),
				[
					"stage",
					"purpose",
					"input_contract",
					"exit_criteria",
					"handoff_artifact",
					"validator",
				],
				"Explicit output-schema guidance for each stage in the chain.",
			),
			buildToolChainArtifact(
				"Prompt chain workflow",
				steps,
				`Chain manifest for ${stageCount} stages with ${handoffStyle} handoffs.`,
			),
			buildWorkedExampleArtifact(
				"Prompt chain example",
				{
					request: parsed.data.request,
					context: parsed.data.context ?? "",
					deliverable: parsed.data.deliverable ?? "",
					options: {
						stageCount,
						handoffStyle,
						includeValidation,
					},
				},
				{
					stages: [
						{
							name: "extract",
							output: "normalized facts and source labels",
						},
						{
							name: "synthesize",
							output: "draft answer in the target schema",
						},
						{
							name: "validate",
							output: "pass/fail with repair notes",
						},
					],
				},
				"Worked example showing how one handoff becomes the next stage's input contract.",
			),
			buildEvalCriteriaArtifact(
				"Chain exit criteria",
				[
					"The final stage has a named deliverable or release artifact.",
					"Every stage has a single transformation responsibility.",
					"The next stage's allowed assumptions are explicit.",
					"The chain includes a validation checkpoint before release.",
					...(successCriteria ? [successCriteria] : []),
				],
				"Exit criteria for the prompt chain.",
			),
		];

		return {
			...createCapabilityResult(
				context,
				`Prompt Chaining produced ${details.length} sequencing guardrail${details.length === 1 ? "" : "s"} across ${stageCount} planned stage${stageCount === 1 ? "" : "s"} (handoff style: ${handoffStyle}; validation: ${includeValidation ? "included" : "omitted"}).`,
				createFocusRecommendations(
					"Prompt chaining guidance",
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
	promptChainingHandler,
);
