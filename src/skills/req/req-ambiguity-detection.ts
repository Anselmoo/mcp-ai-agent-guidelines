import { z } from "zod";
import { req_ambiguity_detection_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
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
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";

const ambiguityInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			includeClarifyingQuestions: z.boolean().optional(),
		})
		.optional(),
});

const SUBJECTIVE_TERMS =
	/\b(good|better|fast|slow|simple|easy|nice|clean|reasonable|appropriate|suitable|optimal|flexible|robust)\b/gi;
const VAGUE_EXPANSION =
	/\b(etc|and so on|and more|among others|various|several|many|some)\b/gi;
const ABSOLUTE_LANGUAGE =
	/\b(always|never|all|none|every|no one|everybody|nobody)\b/gi;
const MISSING_ACTOR = /\b(it should|should be|must be|needs to|has to)\b/gi;

function buildAmbiguityExample(includeClarifyingQuestions: boolean) {
	return {
		ambiguities: [
			{
				phrase: "fast",
				pattern: "subjective term",
				risk: "Teams will disagree on what acceptable latency means.",
				rewrite: "p99 latency stays below 200 ms for the export endpoint.",
				...(includeClarifyingQuestions
					? {
							clarifyingQuestion:
								"What exact latency target defines fast for this workflow?",
						}
					: {}),
			},
			{
				phrase: "it should validate",
				pattern: "missing actor",
				risk: "Ownership is unclear, so validation may be skipped or duplicated.",
				rewrite: "The API gateway validates the payload before forwarding it.",
				...(includeClarifyingQuestions
					? {
							clarifyingQuestion:
								"Which component owns validation and what happens on failure?",
						}
					: {}),
			},
		],
	};
}

const reqAmbiguityHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(ambiguityInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				`Invalid input: ${parsed.error}`,
			);
		}

		const signals = extractRequestSignals(parsed.data);
		const text = `${parsed.data.request} ${parsed.data.context ?? ""}`;
		const includeClarifyingQuestions =
			parsed.data.options?.includeClarifyingQuestions ?? true;

		const findings: string[] = [];

		const subjectiveMatches = text.match(SUBJECTIVE_TERMS);
		if (subjectiveMatches) {
			const unique = [
				...new Set(subjectiveMatches.map((m) => m.toLowerCase())),
			];
			findings.push(
				`Subjective terms found: ${unique.join(", ")}. Replace each with a measurable criterion (e.g. "fast" → "p99 latency < 200ms").`,
			);
			if (includeClarifyingQuestions) {
				findings.push(
					`Clarifying question: what measurable threshold will replace ${unique
						.slice(0, 2)
						.map((term) => `"${term}"`)
						.join(" and ")}?`,
				);
			}
		}

		const vagueMatches = text.match(VAGUE_EXPANSION);
		if (vagueMatches) {
			findings.push(
				`Vague expansion language found: ${[...new Set(vagueMatches)].join(", ")}. Enumerate the complete list explicitly.`,
			);
			if (includeClarifyingQuestions) {
				findings.push(
					"Clarifying question: what is the full enumerated list instead of the implied 'and more' bucket?",
				);
			}
		}

		const absoluteMatches = text.match(ABSOLUTE_LANGUAGE);
		if (absoluteMatches) {
			findings.push(
				`Absolute language found: ${[...new Set(absoluteMatches)].join(", ")}. Validate whether these are truly universal or need scoping.`,
			);
			if (includeClarifyingQuestions) {
				findings.push(
					"Clarifying question: which users, environments, or failure modes are excluded from the absolute claim?",
				);
			}
		}

		const actorMatches = text.match(MISSING_ACTOR);
		if (actorMatches) {
			findings.push(
				`Passive/actor-free language found ${actorMatches.length} time(s). Assign an explicit actor to each requirement (e.g. "it should validate" → "the API gateway validates").`,
			);
			if (includeClarifyingQuestions) {
				findings.push(
					"Clarifying question: which system component or user owns each required action?",
				);
			}
		}

		if (!signals.hasSuccessCriteria) {
			findings.push(
				"No success criteria defined. Add explicit, testable acceptance criteria to resolve this ambiguity.",
			);
		}

		if (findings.length === 0) {
			findings.push(
				"No obvious linguistic ambiguity detected. Run a clarity pass for actor, trigger, observable outcome, threshold, and failure behavior before treating the requirement as implementation-ready.",
			);
			findings.push(
				"Check whether the request omits error-case behaviour, rollback paths, or concurrent-access scenarios.",
			);
		}

		return createCapabilityResult(
			context,
			`Ambiguity Detection found ${findings.length} potential ambiguity pattern(s) in the provided input.`,
			createFocusRecommendations(
				"Ambiguity finding",
				findings,
				context.model.modelClass,
			),
			[
				buildComparisonMatrixArtifact(
					"Ambiguity pattern matrix",
					["Pattern", "Why it is risky", "Rewrite strategy"],
					[
						{
							label: "Subjective term",
							values: [
								"Readers interpret quality words differently",
								"Replace with a measurable threshold or observable condition",
								"Turn adjectives into metrics or pass/fail checks",
							],
						},
						{
							label: "Vague expansion",
							values: [
								"Hidden items slip in through an implied list",
								"Enumerate the exact items or categories",
								"Name the full set instead of using 'etc.'",
							],
						},
						{
							label: "Absolute claim",
							values: [
								"Universal language often ignores edge cases",
								"Scope the claim to users, environments, or thresholds",
								"Add explicit exceptions or boundaries",
							],
						},
						{
							label: "Missing actor",
							values: [
								"Ownership is unclear, so work gets skipped or duplicated",
								"Name the component or user responsible for the action",
								"Rewrite passive statements into actor-owned behavior",
							],
						},
					],
					"Use this matrix to convert ambiguous phrases into reviewable requirement language.",
				),
				buildOutputTemplateArtifact(
					"Ambiguity register template",
					[
						"# Ambiguity register",
						"## Original phrase",
						"## Pattern",
						"## Why it is ambiguous",
						"## Clarifying question",
						"## Proposed rewrite",
						"## Owner / source of clarification",
					].join("\n"),
					[
						"Original phrase",
						"Pattern",
						"Why it is ambiguous",
						"Clarifying question",
						"Proposed rewrite",
						"Owner / source of clarification",
					],
					"Template for tracking each ambiguous phrase until it is replaced with testable requirement language.",
				),
				buildEvalCriteriaArtifact(
					"Requirement clarity checklist",
					[
						"Every requirement names an actor and an action.",
						"Subjective words are replaced with measurable thresholds.",
						"Lists are explicit instead of hidden behind vague expansion language.",
						"Edge cases, failure behavior, and success criteria are visible.",
					],
					"Checklist for deciding whether the requirement text is concrete enough for downstream work.",
				),
				buildWorkedExampleArtifact(
					"Ambiguity resolution example",
					{
						request:
							"It should always be fast, simple, and flexible, with several export options and more",
						options: { includeClarifyingQuestions },
					},
					buildAmbiguityExample(includeClarifyingQuestions),
					"Worked example showing how to rewrite ambiguous language into measurable, actor-owned requirements.",
				),
			],
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	reqAmbiguityHandler,
);
