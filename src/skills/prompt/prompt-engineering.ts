import { z } from "zod";
import type { SkillArtifact } from "../../contracts/runtime.js";
import { prompt_engineering_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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

const promptEngineeringInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			promptType: z
				.enum(["system", "template", "few-shot", "rubric"])
				.optional(),
			includeVersioning: z.boolean().optional(),
			includeVariables: z.boolean().optional(),
		})
		.optional(),
});

const PROMPT_ENGINEERING_RULES: Array<{ pattern: RegExp; detail: string }> = [
	{
		pattern: /\b(system|instruction|role|policy|guardrail|persona)\b/i,
		detail:
			"Separate role, task, constraints, and escalation policy into distinct prompt sections. Prompt assets fail when one sentence tries to establish authority, describe the job, and define safety boundaries at the same time.",
	},
	{
		pattern: /\b(example|few.?shot|demonstrat|sample|illustrat)\b/i,
		detail:
			"Use representative examples that cover both the happy path and one failure-prone edge case. Examples teach the output pattern faster than extra prose, but only when they match the real task distribution.",
	},
	{
		pattern: /\b(json|schema|format|field|structure|parse|yaml)\b/i,
		detail:
			"Specify the output contract explicitly: field names, allowed values, and what to do when information is missing. If the model must infer the schema, the prompt is underspecified.",
	},
	{
		pattern: /\b(context|retriev|source|document|knowledge|reference)\b/i,
		detail:
			"State the order in which the model should use context: system rules first, task instructions second, retrieved evidence third. Prompt assets become brittle when context outranks the contract that interprets it.",
	},
	{
		pattern: /\b(version|change|release|rollback|experiment|test)\b/i,
		detail:
			"Version prompt assets with a named hypothesis for each change. Without a change hypothesis, teams accumulate prompt edits but cannot explain which edit improved or degraded behavior.",
	},
	{
		pattern: /\b(tone|voice|style|audience|persona|brand)\b/i,
		detail:
			"Keep style instructions separate from task logic. Tone is easy to swap; task rules are not. Coupling them makes reuse hard and failure analysis ambiguous.",
	},
	{
		pattern: /\b(safe|policy|compliance|forbid|must not|regulated)\b/i,
		detail:
			"Encode non-negotiable boundaries as direct prohibitions plus escalation behavior. A prompt asset should say what the model must do when it cannot comply safely, not just what it should avoid.",
	},
];

const promptEngineeringHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(promptEngineeringInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				`Invalid input: ${parsed.error}`,
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
				"Prompt Engineering needs the prompt's goal, target artifact, or reference context before it can frame a reusable prompt asset. Provide: (1) the task the prompt must complete, (2) the expected output format, (3) any non-negotiable constraints.",
			);
		}

		const combined = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const promptType = parsed.data.options?.promptType ?? "template";
		const includeVersioning = parsed.data.options?.includeVersioning ?? true;
		const includeVariables = parsed.data.options?.includeVariables ?? true;

		const details: string[] = [
			`Design a ${promptType} prompt asset for "${summarizeKeywords(parsed.data).join(", ") || "the requested task"}". The asset should define task intent, input assumptions, output contract, and failure handling so the prompt can be reused without re-explaining the job every time.`,
		];

		details.push(
			...PROMPT_ENGINEERING_RULES.filter(({ pattern }) =>
				pattern.test(combined),
			).map(({ detail }) => detail),
		);

		if (includeVariables) {
			details.push(
				"Declare typed variables at the top of the asset: required inputs, optional inputs, allowed value ranges, and defaults. Variable contracts stop prompt reuse from turning into copy-paste drift.",
			);
		}

		if (includeVersioning) {
			details.push(
				"Add a version header with purpose, change hypothesis, evaluation status, and rollback note. Prompt assets mature when they are treated like versioned interface contracts rather than disposable snippets.",
			);
		}

		if (signals.hasContext) {
			details.push(
				"Capture the provided context as stable background, then separate it from run-specific inputs. Stable context belongs in the reusable asset; transient request data belongs in variables.",
			);
		}

		if (signals.hasDeliverable) {
			details.push(
				`Shape the prompt asset to reliably produce the stated deliverable: "${parsed.data.deliverable}". The output contract should make it obvious whether the prompt has met that deliverable without manual interpretation.`,
			);
		}

		if (signals.hasSuccessCriteria) {
			details.push(
				`Convert the success criteria into prompt acceptance tests: "${parsed.data.successCriteria}". If the prompt cannot be evaluated against explicit checks, it is not ready for versioning.`,
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Treat the stated constraints as prompt contract clauses, not optional reminders: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints that live outside the prompt are regularly violated in production use.`,
			);
		}

		const artifacts: SkillArtifact[] = [
			buildComparisonMatrixArtifact(
				"Prompt asset design matrix",
				["Prompt type", "Best use", "Avoid when"],
				[
					{
						label: "system",
						values: [
							"task rules need a stable governing layer",
							"the prompt is mostly variable or per-request",
						],
					},
					{
						label: "template",
						values: [
							"you want a reusable contract with placeholders",
							"the response format is still unknown",
						],
					},
					{
						label: "few-shot",
						values: [
							"examples teach the model faster than prose",
							"you do not yet know the target output pattern",
						],
					},
					{
						label: "rubric",
						values: [
							"you need an explicit quality bar or judge",
							"the task has no measurable output contract",
						],
					},
				],
				`Compare prompt archetypes before committing to a ${promptType} asset.`,
			),
			buildOutputTemplateArtifact(
				`${promptType} prompt template`,
				[
					"---",
					`version: ${includeVersioning ? "1.0.0" : "<set-version>"}`,
					`purpose: ${parsed.data.deliverable || "Describe the prompt goal"}`,
					"inputs:",
					"  - required: <required variables>",
					"  - optional: <optional variables>",
					"instructions:",
					"  1. <task rule>",
					"  2. <task rule>",
					"constraints:",
					"  - <non-negotiable constraint>",
					"output_contract:",
					"  - <field or format requirement>",
					"validation:",
					"  - <acceptance check>",
				].join("\n"),
				[
					"version",
					"purpose",
					"inputs",
					"instructions",
					"constraints",
					"output_contract",
					"validation",
				],
				"Explicit output-schema guidance for a reusable prompt asset.",
			),
			buildWorkedExampleArtifact(
				"Prompt template example",
				{
					request: parsed.data.request,
					context: parsed.data.context ?? "",
					deliverable: parsed.data.deliverable ?? "",
					options: {
						promptType,
						includeVersioning,
						includeVariables,
					},
				},
				{
					role: "system",
					variables: ["task", "constraints", "output_contract"],
					output_contract: {
						format: "structured response",
						fields: ["summary", "steps", "validation"],
					},
					validation: [
						"matches the target contract",
						"covers the requested task",
					],
				},
				"Worked example showing how a generic request becomes a versioned prompt asset.",
			),
			buildToolChainArtifact(
				"Prompt asset build chain",
				[
					{
						tool: "structure",
						description:
							"separate role, input assumptions, constraints, and output contract",
					},
					{
						tool: "validate",
						description:
							"check the asset against the target output schema and success criteria",
					},
					{
						tool: "version",
						description:
							"record a change hypothesis and rollback note for the new prompt revision",
					},
				],
				"Concrete sequence for turning a prompt idea into a reusable prompt artifact.",
			),
		];

		if (signals.hasSuccessCriteria) {
			artifacts.push(
				buildEvalCriteriaArtifact(
					"Prompt Acceptance Criteria",
					[
						"The prompt has a named purpose and output contract.",
						"The output schema is explicit enough to validate without guesswork.",
						"Examples or variables are included when they improve reuse.",
						`The prompt satisfies: ${parsed.data.successCriteria}`,
					],
					"Criteria for prompt asset acceptance.",
				),
			);
		}

		return {
			...createCapabilityResult(
				context,
				`Prompt Engineering produced ${details.length} asset-design guardrail${details.length === 1 ? "" : "s"} for a ${promptType} prompt (variables: ${includeVariables ? "included" : "omitted"}; versioning: ${includeVersioning ? "included" : "omitted"}).`,
				createFocusRecommendations(
					"Prompt engineering guidance",
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
	promptEngineeringHandler,
);
