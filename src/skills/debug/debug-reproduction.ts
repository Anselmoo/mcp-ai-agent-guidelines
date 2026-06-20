// src/skills/debug/debug-reproduction.ts
import { z } from "zod";
import { debug_reproduction_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildEvalCriteriaArtifact,
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
	buildToolChainArtifact,
	buildWorkedExampleArtifact,
	createCapabilityResult,
	createFocusRecommendations,
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";

const debugReproductionInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			targetEnvironment: z.string().optional(),
			hasExistingTest: z.boolean().optional(),
		})
		.optional(),
});

function buildReproductionArtifacts(env: string, hasExistingTest: boolean) {
	return [
		buildOutputTemplateArtifact(
			"Minimal reproduction plan",
			[
				"# Minimal reproduction plan",
				"## Failure symptom",
				"## Target environment",
				"## Minimal state or input set",
				"## Reproduction steps",
				"## Expected vs actual",
				"## Regression test or command",
				"## Verification",
			].join("\n"),
			[
				"Failure symptom",
				"Target environment",
				"Minimal state or input set",
				"Reproduction steps",
				"Expected vs actual",
				"Regression test or command",
				"Verification",
			],
			"Use the smallest possible case so the bug can be replayed by another engineer in one pass.",
		),
		buildToolChainArtifact(
			"Reproduction workflow",
			[
				{
					tool: "capture the failing symptom",
					description:
						"write down the exact error, output mismatch, or interaction that proves the bug exists",
				},
				{
					tool: "pin the environment",
					description: `recreate the relevant environment (${env}) including runtime, dependencies, and state`,
				},
				{
					tool: "remove unrelated inputs",
					description:
						"strip the case down to the minimal data, action, or state transition that still fails",
				},
				{
					tool: "codify the repro",
					description: hasExistingTest
						? "confirm the existing test fails deterministically and annotate it as the reproduction anchor"
						: "turn the scenario into a failing test or single command so the reproduction becomes executable",
				},
			],
			"Step-by-step path from symptom capture to a replayable minimal case.",
		),
		buildEvalCriteriaArtifact("Reproduction quality checklist", [
			"Fails reliably in the chosen environment",
			"Uses the minimum input, state, or steps required to trigger the bug",
			"Records the environment and dependencies needed to replay it",
			"Ends as a runnable test, script, or command another engineer can execute",
		]),
		buildWorkedExampleArtifact(
			"Reproduction example",
			{
				request: `reproduce stale cache race in ${env}`,
				options: { targetEnvironment: env, hasExistingTest },
			},
			{
				steps: [
					"Run the request in the staging environment with cache instrumentation enabled.",
					"Use the smallest payload that still produces the stale read.",
					"Convert the failing path into a deterministic regression test or single command.",
				],
				expectedOutcome:
					"the stale value appears on every replay until the cache invalidation path is fixed",
			},
			"Worked example showing how the minimal reproduction becomes a deterministic replay and regression test.",
		),
	];
}

const debugReproductionHandler: SkillHandler = {
	async execute(input, context) {
		const parsed = parseSkillInput(debugReproductionInputSchema, input);
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
				"Reproduction Planner needs more detail. Provide: (1) the failure symptom, (2) the environment it occurred in, (3) any input or state known at failure time.",
			);
		}

		const env = parsed.data.options?.targetEnvironment ?? "local";
		const hasExistingTest = parsed.data.options?.hasExistingTest ?? false;

		const details: string[] = [
			`Identify the minimal input set that triggers the failure in ${env}. Remove all data unrelated to the bug — the smallest failing case is the most reliable test.`,
			"Capture the complete environment state at failure: OS, runtime version, dependency versions, relevant env vars. A bug that fails in CI but not locally is a state mismatch, not a code bug.",
		];

		if (!hasExistingTest) {
			details.push(
				"Write a failing unit or integration test FIRST that captures this exact scenario. The test is the reproduction — do not rely on manual steps.",
			);
		} else {
			details.push(
				"Existing test available — confirm it fails reliably and deterministically before using it as the reproduction baseline.",
			);
		}

		if (signals.hasConstraints) {
			details.push(
				`Reproduction is bounded by: ${signals.constraintList.slice(0, 2).join("; ")}. Consider these constraints when choosing the reproduction environment.`,
			);
		}

		details.push(
			"Share the reproduction in a format that others can run in under 5 minutes: a single command, a test case, or a minimal repository link.",
		);

		const artifacts = buildReproductionArtifacts(env, hasExistingTest);

		return createCapabilityResult(
			context,
			`Reproduction Planner produced ${details.length} steps and ${artifacts.length} artifacts for a ${env} reproduction (existing test: ${hasExistingTest}).`,
			createFocusRecommendations(
				"Reproduction step",
				details,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	debugReproductionHandler,
);
