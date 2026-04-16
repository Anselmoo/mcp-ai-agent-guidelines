import { describe, expect, it, vi } from "vitest";
import type {
	InstructionManifestEntry,
	WorkflowStep,
} from "../../contracts/generated.js";
import type {
	ExecutionProgressRecord,
	InstructionInput,
	InstructionModule,
	ModelProfile,
	RecommendationItem,
	SkillArtifact,
	SkillExecutionResult,
	StepExecutionRecord,
	WorkflowExecutionResult,
	WorkflowExecutionRuntime,
} from "../../contracts/runtime.js";
import { ModelRouter } from "../../models/model-router.js";
import { createSkillModule } from "../../skills/create-skill-module.js";
import { SkillRegistry } from "../../skills/skill-registry.js";
import { WorkflowEngine } from "../../workflows/workflow-engine.js";

const modelProfile: ModelProfile = {
	id: "test-model",
	label: "Test Model",
	modelClass: "cheap",
	strengths: ["tests"],
	maxContextWindow: "small",
	costTier: "cheap",
};

function createRecommendation(title: string): RecommendationItem {
	return {
		title,
		detail: `${title} detail`,
		modelClass: "cheap",
	};
}

function createSkillResult(
	skillId: string,
	summary = `Executed ${skillId}`,
	recommendations: RecommendationItem[] = [],
): SkillExecutionResult {
	return {
		skillId,
		displayName: skillId,
		model: modelProfile,
		summary,
		recommendations,
		relatedSkills: [],
	};
}

function createInstructionModule(config: {
	id: string;
	displayName?: string;
	steps: WorkflowStep[];
	inputSchema?: InstructionManifestEntry["inputSchema"];
}): InstructionModule {
	const manifest: InstructionManifestEntry = {
		id: config.id,
		toolName: config.id,
		displayName: config.displayName ?? config.id,
		description: `${config.id} test instruction`,
		sourcePath: `tests/${config.id}.ts`,
		mission: `Execute ${config.id}`,
		inputSchema: config.inputSchema ?? {
			type: "object",
			properties: {
				request: { type: "string" },
			},
			required: ["request"],
		},
		workflow: {
			instructionId: config.id,
			steps: config.steps,
		},
		chainTo: [],
		preferredModelClass: "cheap",
	};

	const instructionModule: InstructionModule = {
		manifest,
		execute(input, runtime) {
			return runtime.workflowEngine.executeInstruction(
				instructionModule,
				input,
				runtime,
			);
		},
	};

	return instructionModule;
}

function createRuntime(options?: {
	skillResults?: Record<string, SkillExecutionResult>;
	instructionResults?: Record<string, WorkflowExecutionResult>;
	instructionRegistryExecute?: (
		instructionId: string,
		input: InstructionInput,
		runtime: WorkflowExecutionRuntime,
	) => Promise<WorkflowExecutionResult>;
}) {
	const workflowEngine = new WorkflowEngine();
	const sessionHistory: ExecutionProgressRecord[] = [];

	const appendSessionHistory = vi.fn(
		async (_sessionId: string, record: ExecutionProgressRecord) => {
			sessionHistory.push(record);
		},
	);
	const writeSessionHistory = vi.fn(async () => {});
	const skillExecute = vi.fn(
		async (skillId: string): Promise<SkillExecutionResult> =>
			options?.skillResults?.[skillId] ?? createSkillResult(skillId),
	);
	const instructionExecute = vi.fn(
		async (
			instructionId: string,
			input: InstructionInput,
			runtime: WorkflowExecutionRuntime,
		): Promise<WorkflowExecutionResult> => {
			if (options?.instructionRegistryExecute) {
				return options.instructionRegistryExecute(
					instructionId,
					input,
					runtime,
				);
			}
			const result = options?.instructionResults?.[instructionId];
			if (!result) {
				throw new Error(`Unexpected instruction ${instructionId}`);
			}
			return result;
		},
	);

	const runtime: WorkflowExecutionRuntime = {
		sessionId: "workflow-engine-test-session",
		executionState: {
			instructionStack: [],
			progressRecords: [],
		},
		sessionStore: {
			readSessionHistory: async () => [],
			writeSessionHistory,
			appendSessionHistory,
		},
		instructionRegistry: {
			getById: () => undefined,
			getByToolName: () => undefined,
			execute: instructionExecute,
		},
		skillRegistry: {
			getById: () => undefined,
			execute: skillExecute,
		},
		modelRouter: {
			chooseInstructionModel: () => modelProfile,
			chooseSkillModel: () => modelProfile,
			chooseReviewerModel: () => modelProfile,
		},
		workflowEngine,
	};

	return {
		runtime,
		appendSessionHistory,
		writeSessionHistory,
		skillExecute,
		instructionExecute,
		sessionHistory,
	};
}

describe("workflow-engine", () => {
	it("rejects instruction cycles when the instruction is already on the execution stack", async () => {
		const instruction = createInstructionModule({
			id: "cycle-loop",
			steps: [
				{
					kind: "finalize",
					label: "Finalize",
				},
			],
		});
		// Use maxSelfCallDepth=1 so the first self-call (depth 1) is rejected.
		const workflowEngine = new WorkflowEngine({ maxSelfCallDepth: 1 });
		const { runtime, appendSessionHistory, writeSessionHistory, skillExecute } =
			createRuntime();
		runtime.executionState.instructionStack = ["cycle-loop"];
		// Replace the default engine with our depth-1 engine
		(runtime as WorkflowExecutionRuntime).workflowEngine = {
			executeInstruction:
				workflowEngine.executeInstruction.bind(workflowEngine),
		};

		await expect(
			workflowEngine.executeInstruction(
				instruction,
				{ request: "recurse forever" },
				runtime,
			),
		).rejects.toThrow(/cycle|depth/i);
		expect(skillExecute).not.toHaveBeenCalled();
		expect(appendSessionHistory).not.toHaveBeenCalled();
		expect(writeSessionHistory).not.toHaveBeenCalled();
		expect(runtime.executionState.progressRecords).toEqual([]);
	});

	it("warns instead of throwing when session history append fails", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		const instruction = createInstructionModule({
			id: "append-warning",
			steps: [
				{
					kind: "note",
					label: "prepare",
					note: "keep going",
				},
				{
					kind: "finalize",
					label: "done",
				},
			],
		});
		const { runtime } = createRuntime();
		runtime.sessionStore.appendSessionHistory = vi.fn(async () => {
			throw new Error("disk full");
		});

		try {
			await expect(
				runtime.workflowEngine.executeInstruction(
					instruction,
					{ request: "continue" },
					runtime,
				),
			).resolves.toMatchObject({
				instructionId: "append-warning",
			});
			await Promise.resolve();
			expect(warnSpy).toHaveBeenCalledWith(
				expect.stringContaining(
					"Failed to append session history for workflow-engine-test-session: disk full",
				),
			);
		} finally {
			warnSpy.mockRestore();
		}
	});

	it("routes invokeSkill steps through the integrated runtime when available", async () => {
		const instruction = createInstructionModule({
			id: "integrated-runtime-bridge",
			steps: [
				{
					kind: "invokeSkill",
					label: "Run skill through integrated runtime",
					skillId: "debug-root-cause",
				},
			],
		});
		const { runtime, skillExecute } = createRuntime();
		const integratedExecute = vi.fn(async () => ({
			result: createSkillResult(
				"debug-root-cause",
				"Integrated runtime handled the skill",
			),
		}));
		runtime.integratedRuntime = {
			executeSkill: integratedExecute,
		};

		const result = await runtime.workflowEngine.executeInstruction(
			instruction,
			{ request: "trace the integrated path" },
			runtime,
		);

		expect(integratedExecute).toHaveBeenCalledWith(
			"debug-root-cause",
			{ request: "trace the integrated path" },
			{ sessionId: runtime.sessionId },
		);
		expect(skillExecute).not.toHaveBeenCalled();
		expect(result.steps[0]?.summary).toContain("Integrated runtime handled");
	});

	it("executes true gate branches and records progress per top-level step", async () => {
		const instruction = createInstructionModule({
			id: "gated-workflow",
			displayName: "Gated Workflow",
			steps: [
				{
					kind: "invokeSkill",
					label: "prepare",
					skillId: "prepare-skill",
				},
				{
					kind: "gate",
					label: "inspect-context",
					condition: "hasContext",
					ifTrue: [
						{
							kind: "note",
							label: "context-note",
							note: "Context was provided.",
						},
						{
							kind: "parallel",
							label: "parallel-analysis",
							steps: [
								{
									kind: "invokeSkill",
									label: "analyze-a",
									skillId: "skill-a",
								},
								{
									kind: "invokeSkill",
									label: "analyze-b",
									skillId: "skill-b",
								},
							],
						},
					],
				},
				{
					kind: "finalize",
					label: "Finalize",
				},
			],
		});
		const { runtime, appendSessionHistory, writeSessionHistory } =
			createRuntime({
				skillResults: {
					"prepare-skill": createSkillResult("prepare-skill", "Prepared.", [
						createRecommendation("Prepare"),
					]),
					"skill-a": createSkillResult("skill-a", "Analyzed A.", [
						createRecommendation("Analyze A"),
					]),
					"skill-b": createSkillResult("skill-b", "Analyzed B.", [
						createRecommendation("Analyze B"),
					]),
				},
			});

		const result = await runtime.workflowEngine.executeInstruction(
			instruction,
			{
				request: "inspect the repository",
				context: "docs and runtime modules changed",
			},
			runtime,
		);

		expect(result.steps).toHaveLength(3);
		expect(result.steps[1]).toEqual({
			label: "inspect-context",
			kind: "gate",
			summary: "2 serial step(s) executed.",
			children: [
				{
					label: "context-note",
					kind: "note",
					summary: "Context was provided.",
				},
				{
					label: "parallel-analysis",
					kind: "parallel",
					summary: "2 parallel step(s) completed.",
					children: [
						{
							label: "analyze-a",
							kind: "invokeSkill",
							summary: "Analyzed A.",
							skillResult: createSkillResult("skill-a", "Analyzed A.", [
								createRecommendation("Analyze A"),
							]),
						},
						{
							label: "analyze-b",
							kind: "invokeSkill",
							summary: "Analyzed B.",
							skillResult: createSkillResult("skill-b", "Analyzed B.", [
								createRecommendation("Analyze B"),
							]),
						},
					],
				},
			],
		});
		expect(result.recommendations.map((item) => item.title)).toEqual([
			"Prepare",
			"Analyze A",
			"Analyze B",
		]);
		expect(runtime.executionState.progressRecords).toEqual([
			{
				stepLabel: "prepare",
				kind: "invokeSkill",
				summary: "Prepared.",
			},
			{
				stepLabel: "inspect-context",
				kind: "gate",
				summary: "2 serial step(s) executed.",
			},
			{
				stepLabel: "Finalize",
				kind: "finalize",
				summary: "Workflow finalized.",
			},
		]);
		expect(
			appendSessionHistory.mock.calls.map((call) => call[1]?.stepLabel),
		).toEqual(["prepare", "inspect-context", "Finalize"]);
		expect(writeSessionHistory).toHaveBeenCalledWith(
			runtime.sessionId,
			runtime.executionState.progressRecords,
		);
	});

	it("delegates invokeInstruction steps and flattens child recommendations", async () => {
		const delegatedSteps: StepExecutionRecord[] = [
			{
				label: "delegated-skill",
				kind: "invokeSkill",
				summary: "Delegated skill ran.",
				skillResult: createSkillResult(
					"delegated-skill",
					"Delegated skill ran.",
					[createRecommendation("Delegated Recommendation")],
				),
			},
		];
		const instruction = createInstructionModule({
			id: "parent-instruction",
			displayName: "Parent Instruction",
			steps: [
				{
					kind: "invokeInstruction",
					label: "delegate",
					instructionId: "child-instruction",
				},
				{
					kind: "finalize",
					label: "Finalize",
				},
			],
		});
		const { runtime, instructionExecute } = createRuntime({
			instructionResults: {
				"child-instruction": {
					instructionId: "child-instruction",
					displayName: "Child Instruction",
					model: modelProfile,
					steps: delegatedSteps,
					recommendations: [],
				},
			},
		});

		const result = await runtime.workflowEngine.executeInstruction(
			instruction,
			{ request: "delegate this task" },
			runtime,
		);

		expect(instructionExecute).toHaveBeenCalledTimes(1);
		expect(instructionExecute.mock.calls[0]?.[0]).toBe("child-instruction");
		expect(
			instructionExecute.mock.calls[0]?.[2].executionState.instructionStack,
		).toEqual(["parent-instruction"]);
		expect(result.steps[0]).toEqual({
			label: "delegate",
			kind: "invokeInstruction",
			summary: "Delegated to instruction child-instruction.",
			children: delegatedSteps,
		});
		expect(result.recommendations.map((item) => item.title)).toEqual([
			"Delegated Recommendation",
		]);
	});

	it("prioritizes grounded recommendations when flattening nested workflow output", async () => {
		const delegatedSteps: StepExecutionRecord[] = [
			{
				label: "delegated-skill",
				kind: "invokeSkill",
				summary: "Delegated skill ran.",
				skillResult: createSkillResult(
					"delegated-skill",
					"Delegated skill ran.",
					[
						{
							title: "Manifest-only",
							detail: "Generic",
							modelClass: "cheap",
							groundingScope: "manifest",
						},
						{
							title: "Workspace fix",
							detail: "Specific",
							modelClass: "cheap",
							groundingScope: "workspace",
						},
					],
				),
			},
		];
		const instruction = createInstructionModule({
			id: "grounded-parent",
			steps: [
				{
					kind: "invokeInstruction",
					label: "delegate",
					instructionId: "grounded-child",
				},
				{
					kind: "finalize",
					label: "Finalize",
				},
			],
		});
		const { runtime } = createRuntime({
			instructionResults: {
				"grounded-child": {
					instructionId: "grounded-child",
					displayName: "Grounded Child",
					model: modelProfile,
					steps: delegatedSteps,
					recommendations: [],
				},
			},
		});

		const result = await runtime.workflowEngine.executeInstruction(
			instruction,
			{ request: "delegate this task" },
			runtime,
		);

		expect(result.recommendations.map((item) => item.title)).toEqual([
			"Workspace fix",
			"Manifest-only",
		]);
	});

	it("executes false gate branches when representative conditions are not met", async () => {
		const instruction = createInstructionModule({
			id: "empty-false-branch",
			steps: [
				{
					kind: "gate",
					label: "check-deliverable",
					condition: "hasDeliverable",
					ifTrue: [
						{
							kind: "invokeSkill",
							label: "should-not-run",
							skillId: "blocked-skill",
						},
					],
					ifFalse: [
						{
							kind: "note",
							label: "missing-deliverable",
							note: "Deliverable is required before branching.",
						},
					],
				},
				{
					kind: "finalize",
					label: "Finalize",
				},
			],
		});
		const { runtime, skillExecute } = createRuntime();

		const result = await runtime.workflowEngine.executeInstruction(
			instruction,
			{ request: "skip gated work" },
			runtime,
		);

		expect(skillExecute).not.toHaveBeenCalled();
		expect(result.steps[0]).toEqual({
			label: "check-deliverable",
			kind: "gate",
			summary: "1 serial step(s) executed.",
			children: [
				{
					label: "missing-deliverable",
					kind: "note",
					summary: "Deliverable is required before branching.",
				},
			],
		});
		expect(runtime.executionState.progressRecords).toEqual([
			{
				stepLabel: "check-deliverable",
				kind: "gate",
				summary: "1 serial step(s) executed.",
			},
			{
				stepLabel: "Finalize",
				kind: "finalize",
				summary: "Workflow finalized.",
			},
		]);
	});

	it("uses config-driven skill routing during workflow execution", async () => {
		const workflowEngine = new WorkflowEngine();
		const modelRouter = new ModelRouter();
		const skillModule = createSkillModule(
			{
				id: "orch-config-proof",
				canonicalId: "orch-config-proof",
				domain: "orch",
				displayName: "Orchestration Config Proof",
				description: "Verifies routed model selection",
				sourcePath: "tests/orch-config-proof.ts",
				purpose: "Test config-driven routing",
				triggerPhrases: [],
				antiTriggerPhrases: [],
				usageSteps: [],
				intakeQuestions: [],
				relatedSkills: [],
				outputContract: [],
				recommendationHints: [],
				preferredModelClass: "strong",
			},
			{
				async execute(_input, context) {
					return {
						skillId: context.skillId,
						displayName: context.manifest.displayName,
						model: context.model,
						summary: `Routed via ${context.model.id}`,
						recommendations: [],
						relatedSkills: [],
					};
				},
			},
		);
		const skillRegistry = new SkillRegistry({
			modules: [skillModule],
			workspace: null,
		});
		const instruction = createInstructionModule({
			id: "config-driven-workflow",
			steps: [
				{
					kind: "invokeSkill",
					label: "route",
					skillId: "orch-config-proof",
				},
				{
					kind: "finalize",
					label: "Finalize",
				},
			],
		});

		const runtime: WorkflowExecutionRuntime = {
			sessionId: "workflow-engine-config-routing-test",
			executionState: {
				instructionStack: [],
				progressRecords: [],
			},
			sessionStore: {
				readSessionHistory: async () => [],
				writeSessionHistory: async () => {},
				appendSessionHistory: async () => {},
			},
			instructionRegistry: {
				getById: () => undefined,
				getByToolName: () => undefined,
				execute: async () => {
					throw new Error("Nested instruction execution is not expected.");
				},
			},
			skillRegistry,
			modelRouter,
			workflowEngine,
		};

		const result = await workflowEngine.executeInstruction(
			instruction,
			{ request: "route this through orchestration config" },
			runtime,
		);

		const modelId = result.steps[0]?.skillResult?.model.id;
		expect(typeof modelId).toBe("string");
		expect(modelId?.length).toBeGreaterThan(0);
		expect(result.steps[0]?.skillResult?.summary).toBe(`Routed via ${modelId}`);
	});

	it("propagates artifacts from invokeInstruction children to result.artifacts", async () => {
		const artifact: SkillArtifact = {
			kind: "worked-example",
			title: "Nested artifact",
			input: "example problem",
			expectedOutput: "example solution",
		};
		const delegatedSteps: StepExecutionRecord[] = [
			{
				label: "child-skill-step",
				kind: "invokeSkill",
				summary: "Child skill ran.",
				skillResult: {
					skillId: "child-skill",
					displayName: "Child Skill",
					model: modelProfile,
					summary: "Child skill ran.",
					recommendations: [],
					relatedSkills: [],
					artifacts: [artifact],
				},
			},
		];
		const instruction = createInstructionModule({
			id: "artifact-propagation-parent",
			steps: [
				{
					kind: "invokeInstruction",
					label: "delegate-with-artifacts",
					instructionId: "artifact-child",
				},
				{ kind: "finalize", label: "Finalize" },
			],
		});
		const { runtime } = createRuntime({
			instructionResults: {
				"artifact-child": {
					instructionId: "artifact-child",
					displayName: "Artifact Child",
					model: modelProfile,
					steps: delegatedSteps,
					recommendations: [],
					artifacts: [artifact],
				},
			},
		});

		const result = await runtime.workflowEngine.executeInstruction(
			instruction,
			{ request: "propagate artifacts" },
			runtime,
		);

		expect(result.artifacts).toHaveLength(1);
		expect(result.artifacts?.[0]).toEqual(artifact);
	});

	it("propagates artifacts from external invokeInstruction result when steps carry no skillResult", async () => {
		// Simulates an external registry implementation that returns top-level
		// artifacts without embedding them in individual step skillResults.
		const artifact: SkillArtifact = {
			kind: "worked-example",
			title: "External artifact",
			input: "external problem",
			expectedOutput: "external solution",
		};
		const externalSteps: StepExecutionRecord[] = [
			{
				label: "ext-step",
				kind: "note",
				summary: "External step — no skillResult, no child artifacts.",
			},
		];
		const instruction = createInstructionModule({
			id: "artifact-external-parent",
			steps: [
				{
					kind: "invokeInstruction",
					label: "delegate-external",
					instructionId: "external-instruction",
				},
				{ kind: "finalize", label: "Finalize" },
			],
		});
		const { runtime } = createRuntime({
			instructionResults: {
				"external-instruction": {
					instructionId: "external-instruction",
					displayName: "External Instruction",
					model: modelProfile,
					steps: externalSteps,
					recommendations: [],
					artifacts: [artifact],
				},
			},
		});

		const result = await runtime.workflowEngine.executeInstruction(
			instruction,
			{ request: "external artifacts" },
			runtime,
		);

		// Without the fix, this would be 0 (artifacts silently dropped).
		expect(result.artifacts).toHaveLength(1);
		expect(result.artifacts?.[0]).toEqual(artifact);
	});
});
