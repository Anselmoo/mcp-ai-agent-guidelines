import { describe, expect, it } from "vitest";
import type {
	InstructionInput,
	SkillExecutionResult,
} from "../contracts/runtime.js";
import { instructionModule as debugInstruction } from "../generated/instructions/debug.js";
import { instructionModule as implementInstruction } from "../generated/instructions/implement.js";
import {
	arch_system_manifest as archSystemManifest,
	bench_analyzer_manifest as benchAnalyzerManifest,
	debug_assistant_manifest as debugAssistantManifest,
	debug_reproduction_manifest as debugReproductionManifest,
	debug_root_cause_manifest as debugRootCauseManifest,
	req_acceptance_criteria_manifest as reqAcceptanceCriteriaManifest,
	req_ambiguity_detection_manifest as reqAmbiguityDetectionManifest,
	req_analysis_manifest as reqAnalysisManifest,
} from "../generated/manifests/skill-manifests.js";
import { InstructionRegistry } from "../instructions/instruction-registry.js";
import { ModelRouter } from "../models/model-router.js";
import { createSkillModule } from "../skills/create-skill-module.js";
import type {
	SkillExecutionContext,
	SkillHandler,
} from "../skills/runtime/contracts.js";
import { DefaultSkillResolver } from "../skills/runtime/default-skill-resolver.js";
import { metadataSkillHandler } from "../skills/runtime/metadata-skill-handler.js";
import { SkillRegistry } from "../skills/skill-registry.js";
import { WorkflowEngine } from "../workflows/workflow-engine.js";

function createWorkflowRuntime() {
	const instructionRegistry = new InstructionRegistry();
	const skillRegistry = new SkillRegistry();
	const modelRouter = new ModelRouter();

	return {
		sessionId: "test-session",
		executionState: {
			instructionStack: [],
			progressRecords: [],
		},
		sessionStore: {
			async readSessionHistory() {
				return [];
			},
			async writeSessionHistory() {
				return;
			},
			async appendSessionHistory() {
				return;
			},
		},
		instructionRegistry,
		skillRegistry,
		modelRouter,
		workflowEngine: new WorkflowEngine(),
	};
}

describe("skill runtime architecture", () => {
	it("uses the metadata fallback handler by default", async () => {
		const runtime = createWorkflowRuntime();
		// Pass an explicit empty resolver so arch-system is not picked up by
		// defaultSkillResolver (which now has it registered as a Phase 2 handler).
		const registry = new SkillRegistry({
			modules: [createSkillModule(archSystemManifest)],
			resolver: new DefaultSkillResolver(),
		});

		const result = await registry.execute(
			archSystemManifest.id,
			{ request: "design an agent platform" },
			runtime,
		);

		expect(result.summary).toContain("generated");
		expect(typeof result.recommendations[0]?.title).toBe("string");
		expect(typeof result.model.id).toBe("string");
		expect((result.model.id as string).length).toBeGreaterThan(0);
		expect(result.executionMode).toBe("fallback");
	});

	it("routes matched skills through an explicit resolver handler", async () => {
		const runtime = createWorkflowRuntime();
		const capturedContexts: SkillExecutionContext[] = [];
		const customHandler: SkillHandler = {
			async execute(
				_input: InstructionInput,
				context: SkillExecutionContext,
			): Promise<SkillExecutionResult> {
				capturedContexts.push(context);
				return {
					skillId: context.skillId,
					displayName: `${context.manifest.displayName} Custom`,
					model: context.model,
					summary: "Handled by explicit runtime handler.",
					recommendations: [
						{
							title: "Custom",
							detail:
								"Use the runtime handler contract for explicit execution.",
							modelClass: context.model.modelClass,
						},
					],
					relatedSkills: context.manifest.relatedSkills,
					artifacts: [
						{
							kind: "worked-example",
							title: "Example artifact",
							input: { foo: 1 },
							expectedOutput: { bar: 2 },
							description: "A minimal worked example for test validation.",
						},
					],
				};
			},
		};
		const resolver = new DefaultSkillResolver([], metadataSkillHandler);
		resolver.register(archSystemManifest.id, customHandler);
		const registry = new SkillRegistry({
			modules: [createSkillModule(archSystemManifest)],
			resolver,
		});

		const result = await registry.execute(
			archSystemManifest.id,
			{ request: "design an agent platform" },
			runtime,
		);

		expect(result.summary).toBe("Handled by explicit runtime handler.");
		expect(result.displayName).toContain("Custom");
		expect(capturedContexts).toHaveLength(1);
		expect(capturedContexts[0]).toMatchObject({
			skillId: archSystemManifest.id,
			manifest: {
				id: archSystemManifest.id,
			},
			input: {
				request: "design an agent platform",
			},
		});
		expect(typeof capturedContexts[0]?.model.id).toBe("string");
		expect((capturedContexts[0]?.model.id as string)?.length).toBeGreaterThan(
			0,
		);
	});

	it("executes a first tranche of registered capability handlers", async () => {
		const runtime = createWorkflowRuntime();

		const [
			reqAnalysisResult,
			reqAmbiguityResult,
			reqAcceptanceCriteriaResult,
			debugAssistantResult,
			debugRootCauseResult,
			debugReproductionResult,
			archSystemResult,
			benchAnalyzerResult,
		] = await Promise.all([
			runtime.skillRegistry.execute(
				reqAnalysisManifest.id,
				{
					request:
						"Turn this MCP server brief into requirements for hidden capability execution",
					deliverable: "capability runtime plan",
					constraints: ["preserve public behavior", "avoid generator changes"],
				},
				runtime,
			),
			runtime.skillRegistry.execute(
				reqAmbiguityDetectionManifest.id,
				{
					request:
						"Optimize this workflow so it always handles every enterprise case better",
				},
				runtime,
			),
			runtime.skillRegistry.execute(
				reqAcceptanceCriteriaManifest.id,
				{
					request:
						"Ship deterministic hidden capability handlers for debug workflows",
					deliverable: "runtime handler wave",
					successCriteria:
						"registered handlers use request-derived signals and preserve fallback behavior",
					constraints: ["keep edits surgical"],
				},
				runtime,
			),
			runtime.skillRegistry.execute(
				debugAssistantManifest.id,
				{
					request:
						"Investigate an intermittent timeout error in tool execution after a cache refresh",
				},
				runtime,
			),
			runtime.skillRegistry.execute(
				debugRootCauseManifest.id,
				{
					request:
						"Trace the exception to the earliest stale cache state causing the timeout",
					context: "The failure started after state synchronization changes.",
				},
				runtime,
			),
			runtime.skillRegistry.execute(
				debugReproductionManifest.id,
				{
					request:
						"Reproduce the flaky tool failure with the smallest deterministic case possible",
					context:
						"The issue appears during hidden-skill execution on repeated runs.",
					constraints: ["no shell access", "no external APIs"],
				},
				runtime,
			),
			// arch-system is promoted to capability in Phase 2 (substrate wave)
			runtime.skillRegistry.execute(
				archSystemManifest.id,
				{
					request:
						"Design an agent platform with memory, retrieval, and observability",
				},
				runtime,
			),
			// bench-analyzer is now promoted and executes via a capability handler
			runtime.skillRegistry.execute(
				benchAnalyzerManifest.id,
				{ request: "analyze benchmark results" },
				runtime,
			),
		]);

		expect(reqAnalysisResult.executionMode).toBe("capability");
		expect(reqAnalysisResult.summary).toContain("input-specific");
		expect(
			reqAnalysisResult.recommendations.some((item) =>
				item.detail.includes("preserve public behavior"),
			),
		).toBe(true);

		expect(reqAmbiguityResult.executionMode).toBe("capability");
		expect(
			reqAmbiguityResult.recommendations.some((item) =>
				/subjective|exact boundaries|edge cases|exceptions/i.test(item.detail),
			),
		).toBe(true);

		expect(reqAcceptanceCriteriaResult.executionMode).toBe("capability");
		expect(
			reqAcceptanceCriteriaResult.recommendations.some((item) =>
				item.detail.includes("runtime handler wave"),
			),
		).toBe(true);
		expect(
			reqAcceptanceCriteriaResult.recommendations.some((item) =>
				item.detail.includes("registered handlers use request-derived signals"),
			),
		).toBe(true);

		expect(debugAssistantResult.executionMode).toBe("capability");
		expect(
			debugAssistantResult.recommendations.some((item) =>
				/intermittent|nondeterministic|performance degradation|failing symptom/i.test(
					item.detail,
				),
			),
		).toBe(true);

		expect(debugRootCauseResult.executionMode).toBe("capability");
		expect(
			debugRootCauseResult.recommendations.some((item) =>
				/stale|invalid state transition|causal chain|underlying cause/i.test(
					item.detail,
				),
			),
		).toBe(true);

		expect(debugReproductionResult.executionMode).toBe("capability");
		expect(
			debugReproductionResult.recommendations.some((item) =>
				item.detail.includes("no shell access"),
			),
		).toBe(true);

		// arch-system Phase 2 capability assertions
		expect(archSystemResult.executionMode).toBe("capability");
		expect(
			archSystemResult.recommendations.some((item) =>
				/memory|retrieval|observ/i.test(item.detail),
			),
		).toBe(true);

		expect(benchAnalyzerResult.executionMode).toBe("capability");
		expect(
			benchAnalyzerResult.recommendations.some((item) =>
				/benchmark|baseline|analysis/i.test(item.detail),
			),
		).toBe(true);
	});

	it("uses capability handlers inside instruction workflows after full promotion", async () => {
		const runtime = createWorkflowRuntime();

		const implementResult = await implementInstruction.execute(
			{
				request: "Build hidden skill runtime execution",
				deliverable: "working capability runtime",
				constraints: ["preserve public tools", "minimal handwritten diff"],
				successCriteria:
					"requirements and security steps produce actionable guidance",
			},
			runtime,
		);
		const debugResult = await debugInstruction.execute(
			{
				request:
					"Debug intermittent prompt injection failure in MCP tool execution",
				context:
					"The failure is flaky and seems tied to untrusted resource content.",
			},
			runtime,
		);

		const implementSkillModes = implementResult.steps
			.flatMap((step) => step.children ?? [step])
			.flatMap((step) => step.skillResult ?? [])
			.map((skillResult) => skillResult.executionMode);
		const debugSkillModes = debugResult.steps
			.flatMap((step) => step.children ?? [step])
			.flatMap((step) => step.skillResult ?? [])
			.map((skillResult) => skillResult.executionMode);

		expect(implementSkillModes).toContain("capability");
		expect(implementSkillModes).not.toContain("fallback");
		expect(debugSkillModes).toContain("capability");
		expect(debugSkillModes).not.toContain("fallback");
		expect(
			implementResult.recommendations.some((item) =>
				/Requirement focus|Security control|Acceptance criterion/.test(
					item.title,
				),
			),
		).toBe(true);
	});
});
