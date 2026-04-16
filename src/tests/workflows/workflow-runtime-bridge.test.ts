import { describe, expect, it, vi } from "vitest";
import type { InstructionManifestEntry } from "../../contracts/generated.js";
import type {
	InstructionInput,
	ModelProfile,
	SkillExecutionResult,
	WorkflowExecutionRuntime,
} from "../../contracts/runtime.js";
import { instructionModule as adaptInstruction } from "../../generated/instructions/adapt.js";
import { instructionModule as bootstrapInstruction } from "../../generated/instructions/bootstrap.js";
import { instructionModule as debugInstruction } from "../../generated/instructions/debug.js";
import { instructionModule as designInstruction } from "../../generated/instructions/design.js";
import { instructionModule as documentInstruction } from "../../generated/instructions/document.js";
import { instructionModule as enterpriseInstruction } from "../../generated/instructions/enterprise.js";
import { instructionModule as evaluateInstruction } from "../../generated/instructions/evaluate.js";
import { instructionModule as governInstruction } from "../../generated/instructions/govern.js";
import { instructionModule as implementInstruction } from "../../generated/instructions/implement.js";
import { instructionModule as metaRoutingInstruction } from "../../generated/instructions/meta-routing.js";
import { instructionModule as onboardProjectInstruction } from "../../generated/instructions/onboard_project.js";
import { instructionModule as orchestrateInstruction } from "../../generated/instructions/orchestrate.js";
import { instructionModule as physicsAnalysisInstruction } from "../../generated/instructions/physics-analysis.js";
import { instructionModule as planInstruction } from "../../generated/instructions/plan.js";
import { instructionModule as promptEngineeringInstruction } from "../../generated/instructions/prompt-engineering.js";
import { instructionModule as refactorInstruction } from "../../generated/instructions/refactor.js";
import { instructionModule as researchInstruction } from "../../generated/instructions/research.js";
import { instructionModule as resilienceInstruction } from "../../generated/instructions/resilience.js";
import { instructionModule as reviewInstruction } from "../../generated/instructions/review.js";
import { instructionModule as testingInstruction } from "../../generated/instructions/testing.js";
import { WorkflowEngine } from "../../workflows/workflow-engine.js";
import { onboardProjectWorkflow } from "../../workflows/workflow-spec.js";
import { assertInstructionManifestMatchesWorkflowSpec } from "../../workflows/workflow-state-validator.js";

const modelProfile: ModelProfile = {
	id: "test-model",
	label: "Test Model",
	modelClass: "cheap",
	strengths: ["tests"],
	maxContextWindow: "small",
	costTier: "cheap",
};

function buildRuntime() {
	const workflowEngine = new WorkflowEngine();
	let skillCalls = 0;

	const runtime: WorkflowExecutionRuntime = {
		sessionId: "workflow-runtime-bridge-test",
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
				throw new Error(
					"Nested instruction execution is not expected in this test.",
				);
			},
		},
		skillRegistry: {
			getById: () => undefined,
			execute: async (
				skillId: string,
				_input: InstructionInput,
			): Promise<SkillExecutionResult> => {
				skillCalls += 1;
				return {
					skillId,
					displayName: skillId,
					model: modelProfile,
					summary: `Executed ${skillId}`,
					recommendations: [],
					relatedSkills: [],
				};
			},
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
		getSkillCalls: () => skillCalls,
	};
}

function cloneManifest(
	manifest: InstructionManifestEntry,
): InstructionManifestEntry {
	return {
		...manifest,
		inputSchema: {
			...manifest.inputSchema,
			properties: { ...manifest.inputSchema.properties },
			required: manifest.inputSchema.required
				? [...manifest.inputSchema.required]
				: undefined,
		},
		workflow: {
			...manifest.workflow,
			steps: manifest.workflow.steps.map((step) => ({ ...step })),
		},
	};
}

describe("workflow runtime bridge", () => {
	it("keeps implemented workflow manifests aligned with the authoritative spec layer", () => {
		const allImplementedInstructions = [
			bootstrapInstruction,
			metaRoutingInstruction,
			onboardProjectInstruction,
			designInstruction,
			planInstruction,
			implementInstruction,
			reviewInstruction,
			testingInstruction,
			debugInstruction,
			refactorInstruction,
			documentInstruction,
			researchInstruction,
			evaluateInstruction,
			physicsAnalysisInstruction,
			adaptInstruction,
			enterpriseInstruction,
			governInstruction,
			orchestrateInstruction,
			promptEngineeringInstruction,
			resilienceInstruction,
		];

		for (const instruction of allImplementedInstructions) {
			expect(
				() =>
					assertInstructionManifestMatchesWorkflowSpec(instruction.manifest),
				`${instruction.manifest.id} manifest must align with its workflow spec`,
			).not.toThrow();
		}
	});

	it("uses the authoritative workflow spec during live WorkflowEngine execution", async () => {
		const { runtime } = buildRuntime();
		const workflowEngineForSpy = runtime.workflowEngine as unknown as {
			executeStep: (...args: unknown[]) => Promise<unknown>;
		};
		const executeStepSpy = vi.spyOn(workflowEngineForSpy, "executeStep");

		const result = await runtime.workflowEngine.executeInstruction(
			onboardProjectInstruction,
			{
				request: "get me oriented",
			},
			runtime,
		);
		const executeStepCalls = executeStepSpy.mock.calls as unknown[][];

		expect(result.instructionId).toBe("onboard_project");
		expect(result.steps.map((step) => step.label)).toEqual([
			"req-scope",
			"req-ambiguity-detection",
			"synth-research",
			"arch-system",
			"Finalize",
		]);
		expect(executeStepCalls[0]?.[0]).toBe(
			onboardProjectWorkflow.runtime?.steps[0],
		);
		expect(executeStepCalls[0]?.[0]).not.toBe(
			onboardProjectInstruction.manifest.workflow.steps[0],
		);
	});

	it("rejects authoritative workflow drift before executing any steps", async () => {
		const { runtime, getSkillCalls } = buildRuntime();
		const driftedManifest = cloneManifest(onboardProjectInstruction.manifest);
		driftedManifest.workflow.steps[0] = {
			kind: "invokeSkill",
			label: "scope-has-drifted",
			skillId: "req-scope",
		};

		const driftedInstruction = {
			manifest: driftedManifest,
			execute(
				input: InstructionInput,
				currentRuntime: WorkflowExecutionRuntime,
			) {
				return currentRuntime.workflowEngine.executeInstruction(
					driftedInstruction,
					input,
					currentRuntime,
				);
			},
		};

		await expect(
			runtime.workflowEngine.executeInstruction(
				driftedInstruction,
				{ request: "get me oriented" },
				runtime,
			),
		).rejects.toThrow(/Workflow spec drift/);
		expect(getSkillCalls()).toBe(0);
	});

	it("rejects inputs that bypass tool-surface validation but violate the workflow spec", async () => {
		const { runtime, getSkillCalls } = buildRuntime();

		await expect(
			runtime.workflowEngine.executeInstruction(
				onboardProjectInstruction,
				{ context: "missing request" } as unknown as InstructionInput,
				runtime,
			),
		).rejects.toThrow(/Workflow input failed authoritative spec validation/);
		expect(getSkillCalls()).toBe(0);
	});
});
