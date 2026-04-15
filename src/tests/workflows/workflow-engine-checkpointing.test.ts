/**
 * End-to-end tests for WorkflowEngine checkpointing.
 *
 * These tests exercise the full engine → CheckpointManager → filesystem
 * pipeline with `enableCheckpointing: true`. They prove that:
 *
 *   1. Checkpoint is saved after each successful step.
 *   2. Checkpoint is cleared on clean completion.
 *   3. A workflow resumes from the correct step after a simulated crash.
 *   4. `meta.totalSteps` and `meta.inputHash` are populated by the engine.
 *   5. `buildResumeInfo.progressRatio` is correctly computed from engine-written meta.
 *
 * All tests use real filesystem I/O via `CheckpointManager` — this is an
 * intentional end-to-end contract check, not an isolation unit test.
 */

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
	InstructionManifestEntry,
	WorkflowStep,
} from "../../contracts/generated.js";
import type {
	ExecutionProgressRecord,
	InstructionModule,
	ModelProfile,
	SkillExecutionResult,
	WorkflowExecutionRuntime,
} from "../../contracts/runtime.js";
import {
	buildResumeInfo,
	CheckpointManager,
} from "../../workflows/workflow-checkpoint.js";
import { WorkflowEngine } from "../../workflows/workflow-engine.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const MODEL: ModelProfile = {
	id: "test-model",
	label: "Test Model",
	modelClass: "cheap",
	strengths: [],
	maxContextWindow: "small",
	costTier: "cheap",
};

const SESSION_ID = "engine-checkpoint-e2e-session";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeSkillResult(skillId: string): SkillExecutionResult {
	return {
		skillId,
		displayName: skillId,
		model: MODEL,
		summary: `${skillId} done`,
		recommendations: [],
		relatedSkills: [],
	};
}

function makeInstruction(id: string, steps: WorkflowStep[]): InstructionModule {
	const manifest: InstructionManifestEntry = {
		id,
		toolName: id,
		displayName: `${id} instruction`,
		description: `test instruction ${id}`,
		sourcePath: `tests/${id}.ts`,
		mission: `Execute ${id}`,
		inputSchema: {
			type: "object",
			properties: { request: { type: "string" } },
			required: ["request"],
		},
		workflow: { instructionId: id, steps },
		chainTo: [],
		preferredModelClass: "cheap",
	} as InstructionManifestEntry;

	const mod: InstructionModule = {
		manifest,
		execute(input, runtime) {
			return runtime.workflowEngine.executeInstruction(mod, input, runtime);
		},
	};
	return mod;
}

function makeRuntime(
	engine: WorkflowEngine,
	skillExecute: (skillId: string) => Promise<SkillExecutionResult>,
): {
	runtime: WorkflowExecutionRuntime;
	skillExecuteMock: ReturnType<typeof vi.fn>;
} {
	const progressRecords: ExecutionProgressRecord[] = [];
	const skillExecuteMock = vi.fn(skillExecute);

	const runtime: WorkflowExecutionRuntime = {
		sessionId: SESSION_ID,
		executionState: { instructionStack: [], progressRecords },
		sessionStore: {
			readSessionHistory: async () => [],
			writeSessionHistory: async () => {},
			appendSessionHistory: async () => {},
		},
		instructionRegistry: {
			getById: () => undefined,
			getByToolName: () => undefined,
			execute: async () => {
				throw new Error("nested instruction not expected in this test");
			},
		},
		skillRegistry: {
			getById: () => undefined,
			execute: skillExecuteMock,
		},
		modelRouter: {
			chooseInstructionModel: () => MODEL,
			chooseSkillModel: () => MODEL,
			chooseReviewerModel: () => MODEL,
		},
		workflowEngine: engine,
	};

	return { runtime, skillExecuteMock };
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

let tempDir: string;
let checkpointManager: CheckpointManager;

beforeEach(async () => {
	tempDir = await mkdtemp(join(tmpdir(), "engine-cp-e2e-"));
	checkpointManager = new CheckpointManager(tempDir);
});

afterEach(async () => {
	await rm(tempDir, { recursive: true, force: true });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("WorkflowEngine checkpointing E2E", () => {
	it("clears the checkpoint after clean completion", async () => {
		const INSTRUCTION_ID = "cp-clean-completion";
		const instruction = makeInstruction(INSTRUCTION_ID, [
			{ kind: "invokeSkill", label: "skill-a", skillId: "skill-a" },
			{ kind: "invokeSkill", label: "skill-b", skillId: "skill-b" },
			{ kind: "finalize", label: "Finalize" },
		]);

		const engine = new WorkflowEngine({
			enableCheckpointing: true,
			checkpointManager,
		});
		const { runtime } = makeRuntime(engine, async (id) => makeSkillResult(id));

		const result = await engine.executeInstruction(
			instruction,
			{ request: "run to completion" },
			runtime,
		);

		// All 3 steps should be in the result
		expect(result.steps).toHaveLength(3);
		expect(result.instructionId).toBe(INSTRUCTION_ID);

		// Checkpoint must be cleared after successful completion
		const checkpoint = await checkpointManager.load(INSTRUCTION_ID, SESSION_ID);
		expect(checkpoint).toBeNull();
	});

	it("persists checkpoint after each step and enables resume after simulated crash", async () => {
		const INSTRUCTION_ID = "cp-resume-after-crash";
		const workflowSteps: WorkflowStep[] = [
			{ kind: "invokeSkill", label: "step-init", skillId: "skill-init" },
			{ kind: "invokeSkill", label: "step-scan", skillId: "skill-scan" },
			{ kind: "invokeSkill", label: "step-report", skillId: "skill-report" },
		];
		const instruction = makeInstruction(INSTRUCTION_ID, workflowSteps);

		// ── Phase A: First run — skill-scan throws (simulated crash) ──────────
		const engine1 = new WorkflowEngine({
			enableCheckpointing: true,
			checkpointManager,
		});
		const { runtime: runtime1, skillExecuteMock: skillExecuteA } = makeRuntime(
			engine1,
			async (skillId) => {
				if (skillId === "skill-scan") throw new Error("disk full");
				return makeSkillResult(skillId);
			},
		);

		await expect(
			engine1.executeInstruction(
				instruction,
				{ request: "crash test" },
				runtime1,
			),
		).rejects.toThrow("disk full");

		// step-init completed, skill-scan was attempted
		expect(skillExecuteA).toHaveBeenCalledWith(
			"skill-init",
			expect.anything(),
			expect.anything(),
		);
		expect(skillExecuteA).toHaveBeenCalledWith(
			"skill-scan",
			expect.anything(),
			expect.anything(),
		);

		// Checkpoint must exist with step-init (index 0) completed
		const crashCheckpoint = await checkpointManager.load(
			INSTRUCTION_ID,
			SESSION_ID,
		);
		expect(crashCheckpoint).not.toBeNull();
		expect(crashCheckpoint?.lastCompletedStepIndex).toBe(0);
		expect(crashCheckpoint?.completedSteps).toHaveLength(1);
		expect(crashCheckpoint?.completedSteps[0]?.label).toBe("step-init");

		// ── Phase B: Second run — resumes from step-scan ──────────────────────
		const engine2 = new WorkflowEngine({
			enableCheckpointing: true,
			checkpointManager,
		});
		const { runtime: runtime2, skillExecuteMock: skillExecuteB } = makeRuntime(
			engine2,
			async (id) => makeSkillResult(id),
		);

		const result = await engine2.executeInstruction(
			instruction,
			{ request: "crash test" },
			runtime2,
		);

		// step-init must NOT have been re-executed (it was in the checkpoint)
		expect(skillExecuteB).not.toHaveBeenCalledWith(
			"skill-init",
			expect.anything(),
			expect.anything(),
		);
		// step-scan and step-report must have run
		expect(skillExecuteB).toHaveBeenCalledWith(
			"skill-scan",
			expect.anything(),
			expect.anything(),
		);
		expect(skillExecuteB).toHaveBeenCalledWith(
			"skill-report",
			expect.anything(),
			expect.anything(),
		);

		// Final result must contain all 3 steps (1 from checkpoint + 2 from resume)
		expect(result.steps).toHaveLength(3);
		expect(result.steps.map((s) => s.label)).toEqual([
			"step-init",
			"step-scan",
			"step-report",
		]);

		// Checkpoint must be cleared after successful completion
		const finalCheckpoint = await checkpointManager.load(
			INSTRUCTION_ID,
			SESSION_ID,
		);
		expect(finalCheckpoint).toBeNull();
	});

	it("populates checkpoint meta.totalSteps with the instruction step count", async () => {
		const INSTRUCTION_ID = "cp-meta-total-steps";
		const instruction = makeInstruction(INSTRUCTION_ID, [
			{ kind: "invokeSkill", label: "step-a", skillId: "skill-a" },
			{ kind: "invokeSkill", label: "step-b", skillId: "skill-b" },
			{ kind: "finalize", label: "Finalize" },
		]);

		// Fail on step-b so the checkpoint is persisted rather than cleared
		const engine = new WorkflowEngine({
			enableCheckpointing: true,
			checkpointManager,
		});
		const { runtime } = makeRuntime(engine, async (skillId) => {
			if (skillId === "skill-b")
				throw new Error("fail for checkpoint inspection");
			return makeSkillResult(skillId);
		});

		await expect(
			engine.executeInstruction(
				instruction,
				{ request: "check meta" },
				runtime,
			),
		).rejects.toThrow();

		const checkpoint = await checkpointManager.load(INSTRUCTION_ID, SESSION_ID);
		expect(checkpoint).not.toBeNull();
		// totalSteps should equal the number of top-level workflow steps
		expect(checkpoint?.meta?.totalSteps).toBe(3);
	});

	it("populates checkpoint meta.inputHash as a non-empty hex string", async () => {
		const INSTRUCTION_ID = "cp-meta-input-hash";
		const instruction = makeInstruction(INSTRUCTION_ID, [
			{ kind: "invokeSkill", label: "step-a", skillId: "skill-a" },
			{ kind: "invokeSkill", label: "step-b", skillId: "skill-b" },
		]);

		// Fail on step-b so the checkpoint is persisted
		const engine = new WorkflowEngine({
			enableCheckpointing: true,
			checkpointManager,
		});
		const { runtime } = makeRuntime(engine, async (skillId) => {
			if (skillId === "skill-b") throw new Error("fail");
			return makeSkillResult(skillId);
		});

		await expect(
			engine.executeInstruction(
				instruction,
				{ request: "hash check" },
				runtime,
			),
		).rejects.toThrow();

		const checkpoint = await checkpointManager.load(INSTRUCTION_ID, SESSION_ID);
		expect(checkpoint).not.toBeNull();
		const inputHash = checkpoint?.meta?.inputHash;
		expect(typeof inputHash).toBe("string");
		expect((inputHash as string).length).toBeGreaterThan(0);
		// Expect a 16-char hex string (first 16 chars of sha256)
		expect(inputHash).toMatch(/^[0-9a-f]{16}$/);
	});

	it("two runs with different inputs produce different inputHash values", async () => {
		const INSTRUCTION_ID = "cp-input-hash-distinct";
		const instruction = makeInstruction(INSTRUCTION_ID, [
			{ kind: "invokeSkill", label: "step-only", skillId: "skill-only" },
			{ kind: "invokeSkill", label: "step-fail", skillId: "skill-fail" },
		]);

		const makeFailingEngine = () =>
			new WorkflowEngine({ enableCheckpointing: true, checkpointManager });

		// Run A
		const engineA = makeFailingEngine();
		const { runtime: runtimeA } = makeRuntime(engineA, async (skillId) => {
			if (skillId === "skill-fail") throw new Error("fail");
			return makeSkillResult(skillId);
		});
		await expect(
			engineA.executeInstruction(instruction, { request: "input A" }, runtimeA),
		).rejects.toThrow();
		const cpA = await checkpointManager.load(INSTRUCTION_ID, SESSION_ID);
		const hashA = cpA?.meta?.inputHash;

		// Clear before run B
		await checkpointManager.clear(INSTRUCTION_ID, SESSION_ID);

		// Run B
		const engineB = makeFailingEngine();
		const { runtime: runtimeB } = makeRuntime(engineB, async (skillId) => {
			if (skillId === "skill-fail") throw new Error("fail");
			return makeSkillResult(skillId);
		});
		await expect(
			engineB.executeInstruction(
				instruction,
				{ request: "input B — completely different" },
				runtimeB,
			),
		).rejects.toThrow();
		const cpB = await checkpointManager.load(INSTRUCTION_ID, SESSION_ID);
		const hashB = cpB?.meta?.inputHash;

		expect(hashA).toBeDefined();
		expect(hashB).toBeDefined();
		expect(hashA).not.toBe(hashB);
	});

	it("buildResumeInfo reflects engine-written checkpoint with correct progressRatio", async () => {
		const INSTRUCTION_ID = "cp-progress-ratio";
		const instruction = makeInstruction(INSTRUCTION_ID, [
			{ kind: "invokeSkill", label: "step-0", skillId: "skill-0" },
			{ kind: "invokeSkill", label: "step-1", skillId: "skill-1" },
			{ kind: "invokeSkill", label: "step-2", skillId: "skill-2" },
			{ kind: "finalize", label: "Finalize" },
		]);

		// Fail on step-1 so we have 1 completed step out of 4 total
		const engine = new WorkflowEngine({
			enableCheckpointing: true,
			checkpointManager,
		});
		const { runtime } = makeRuntime(engine, async (skillId) => {
			if (skillId === "skill-1") throw new Error("fail");
			return makeSkillResult(skillId);
		});

		await expect(
			engine.executeInstruction(
				instruction,
				{ request: "progress ratio test" },
				runtime,
			),
		).rejects.toThrow();

		const checkpoint = await checkpointManager.load(INSTRUCTION_ID, SESSION_ID);
		const info = buildResumeInfo(checkpoint);

		expect(info).not.toBeNull();
		expect(info?.canResume).toBe(true);
		expect(info?.completedCount).toBe(1);
		expect(info?.resumeFromIndex).toBe(1);
		// totalSteps=4, completedCount=1 → ratio=0.25
		expect(info?.progressRatio).toBe(0.25);
	});

	it("checkpoint is not written when enableCheckpointing is false", async () => {
		const INSTRUCTION_ID = "cp-disabled";
		const instruction = makeInstruction(INSTRUCTION_ID, [
			{ kind: "invokeSkill", label: "step-a", skillId: "skill-a" },
			{ kind: "invokeSkill", label: "step-b", skillId: "skill-b" },
		]);

		const engine = new WorkflowEngine({
			enableCheckpointing: false,
			checkpointManager,
		});
		const { runtime } = makeRuntime(engine, async (skillId) => {
			if (skillId === "skill-b") throw new Error("fail");
			return makeSkillResult(skillId);
		});

		await expect(
			engine.executeInstruction(
				instruction,
				{ request: "no checkpoint" },
				runtime,
			),
		).rejects.toThrow();

		// No checkpoint should have been written
		const checkpoint = await checkpointManager.load(INSTRUCTION_ID, SESSION_ID);
		expect(checkpoint).toBeNull();
	});
});
