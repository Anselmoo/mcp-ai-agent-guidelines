/**
 * Tests for workflow-checkpoint: CheckpointManager, createInitialCheckpoint,
 * resolveResumeIndex, compareCheckpoints, buildResumeInfo.
 */

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { StepExecutionRecord } from "../../contracts/runtime.js";
import {
	buildResumeInfo,
	CheckpointManager,
	compareCheckpoints,
	createInitialCheckpoint,
	resolveResumeIndex,
	type WorkflowCheckpoint,
} from "../../workflows/workflow-checkpoint.js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeStep(label: string): StepExecutionRecord {
	return { label, kind: "invokeSkill", summary: `Summary for ${label}` };
}

const INSTRUCTION_ID = "test-instruction";
const SESSION_ID = "sess-abc";

// ─── createInitialCheckpoint ──────────────────────────────────────────────────

describe("createInitialCheckpoint", () => {
	it("creates a fresh checkpoint with index -1", () => {
		const cp = createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID);
		expect(cp.instructionId).toBe(INSTRUCTION_ID);
		expect(cp.sessionId).toBe(SESSION_ID);
		expect(cp.lastCompletedStepIndex).toBe(-1);
		expect(cp.completedSteps).toHaveLength(0);
	});

	it("includes meta when provided", () => {
		const cp = createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID, {
			inputHash: "abc123",
		});
		expect(cp.meta?.inputHash).toBe("abc123");
	});
});

// ─── resolveResumeIndex ───────────────────────────────────────────────────────

describe("resolveResumeIndex", () => {
	it("returns 0 when no checkpoint", () => {
		expect(resolveResumeIndex(null)).toBe(0);
	});

	it("returns lastCompletedStepIndex + 1", () => {
		const cp = createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID);
		const advanced: WorkflowCheckpoint = {
			...cp,
			lastCompletedStepIndex: 2,
		};
		expect(resolveResumeIndex(advanced)).toBe(3);
	});

	it("returns 0 for a fresh checkpoint (index -1)", () => {
		const cp = createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID);
		expect(resolveResumeIndex(cp)).toBe(0);
	});
});

// ─── CheckpointManager ───────────────────────────────────────────────────────

describe("CheckpointManager (filesystem)", () => {
	let tempDir: string;
	let manager: CheckpointManager;

	beforeEach(async () => {
		tempDir = await mkdtemp(join(tmpdir(), "cp-test-"));
		manager = new CheckpointManager(tempDir);
	});

	afterEach(async () => {
		await rm(tempDir, { recursive: true, force: true });
	});

	it("returns null when no checkpoint exists", async () => {
		const cp = await manager.load(INSTRUCTION_ID, SESSION_ID);
		expect(cp).toBeNull();
	});

	it("round-trips a checkpoint via save → load", async () => {
		const initial = createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID);
		await manager.save(initial);

		const loaded = await manager.load(INSTRUCTION_ID, SESSION_ID);
		expect(loaded).not.toBeNull();
		expect(loaded?.instructionId).toBe(INSTRUCTION_ID);
		expect(loaded?.sessionId).toBe(SESSION_ID);
		expect(loaded?.lastCompletedStepIndex).toBe(-1);
	});

	it("advances the checkpoint after a step", async () => {
		let cp = createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID);
		await manager.save(cp);

		cp = await manager.advance(cp, makeStep("step-0"));
		expect(cp.lastCompletedStepIndex).toBe(0);
		expect(cp.completedSteps).toHaveLength(1);

		cp = await manager.advance(cp, makeStep("step-1"));
		expect(cp.lastCompletedStepIndex).toBe(1);
		expect(cp.completedSteps).toHaveLength(2);

		// Reload and verify persistence
		const loaded = await manager.load(INSTRUCTION_ID, SESSION_ID);
		expect(loaded?.lastCompletedStepIndex).toBe(1);
		expect(loaded?.completedSteps).toHaveLength(2);
	});

	it("clear removes the checkpoint file", async () => {
		const cp = createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID);
		await manager.save(cp);

		await manager.clear(INSTRUCTION_ID, SESSION_ID);
		const loaded = await manager.load(INSTRUCTION_ID, SESSION_ID);
		expect(loaded).toBeNull();
	});

	it("clear is non-fatal when file does not exist", async () => {
		// Should not throw
		await expect(
			manager.clear("non-existent", SESSION_ID),
		).resolves.toBeUndefined();
	});

	it("handles corrupted checkpoint gracefully", async () => {
		// Write invalid JSON
		const sessionDir = join(tempDir, SESSION_ID);
		await mkdir(sessionDir, { recursive: true });
		await writeFile(
			join(sessionDir, `checkpoint-${INSTRUCTION_ID}.json`),
			"{ corrupted json !!!",
		);

		const loaded = await manager.load(INSTRUCTION_ID, SESSION_ID);
		expect(loaded).toBeNull();
	});

	it("handles invalid checkpoint shape gracefully", async () => {
		const sessionDir = join(tempDir, SESSION_ID);
		await mkdir(sessionDir, { recursive: true });
		await writeFile(
			join(sessionDir, `checkpoint-${INSTRUCTION_ID}.json`),
			JSON.stringify({ notValid: true }),
		);

		const loaded = await manager.load(INSTRUCTION_ID, SESSION_ID);
		expect(loaded).toBeNull();
	});
});

// ─── compareCheckpoints ──────────────────────────────────────────────────────

describe("compareCheckpoints", () => {
	it("returns zero-advancement when both checkpoints are null", () => {
		const diff = compareCheckpoints(null, null);
		expect(diff.fromIndex).toBe(-1);
		expect(diff.toIndex).toBe(-1);
		expect(diff.stepsAdvanced).toBe(0);
		expect(diff.newlyCompletedSteps).toHaveLength(0);
	});

	it("treats null-from as starting from scratch", () => {
		const cp = createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID);
		const after: WorkflowCheckpoint = {
			...cp,
			lastCompletedStepIndex: 1,
			completedSteps: [makeStep("step-0"), makeStep("step-1")],
		};
		const diff = compareCheckpoints(null, after);
		expect(diff.fromIndex).toBe(-1);
		expect(diff.toIndex).toBe(1);
		expect(diff.stepsAdvanced).toBe(2);
		expect(diff.newlyCompletedSteps).toHaveLength(2);
		expect(diff.newlyCompletedSteps[0]?.label).toBe("step-0");
	});

	it("computes incremental progress between two non-null checkpoints", () => {
		const base = createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID);
		const after1: WorkflowCheckpoint = {
			...base,
			lastCompletedStepIndex: 0,
			completedSteps: [makeStep("step-0")],
		};
		const after2: WorkflowCheckpoint = {
			...base,
			lastCompletedStepIndex: 2,
			completedSteps: [
				makeStep("step-0"),
				makeStep("step-1"),
				makeStep("step-2"),
			],
		};
		const diff = compareCheckpoints(after1, after2);
		expect(diff.fromIndex).toBe(0);
		expect(diff.toIndex).toBe(2);
		expect(diff.stepsAdvanced).toBe(2);
		expect(diff.newlyCompletedSteps).toHaveLength(2);
		expect(diff.newlyCompletedSteps.map((s) => s.label)).toEqual([
			"step-1",
			"step-2",
		]);
	});

	it("returns stepsAdvanced 0 when checkpoints are the same position", () => {
		const cp: WorkflowCheckpoint = {
			...createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID),
			lastCompletedStepIndex: 3,
			completedSteps: [
				makeStep("a"),
				makeStep("b"),
				makeStep("c"),
				makeStep("d"),
			],
		};
		const diff = compareCheckpoints(cp, cp);
		expect(diff.stepsAdvanced).toBe(0);
		expect(diff.newlyCompletedSteps).toHaveLength(0);
	});
});

// ─── buildResumeInfo ──────────────────────────────────────────────────────────

describe("buildResumeInfo", () => {
	it("returns null when no checkpoint exists", () => {
		expect(buildResumeInfo(null)).toBeNull();
	});

	it("reports canResume=false for a fresh checkpoint (index -1)", () => {
		const cp = createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID);
		const info = buildResumeInfo(cp);
		expect(info).not.toBeNull();
		expect(info?.canResume).toBe(false);
		expect(info?.resumeFromIndex).toBe(0);
		expect(info?.completedCount).toBe(0);
	});

	it("reports canResume=true after at least one step completes", () => {
		const cp: WorkflowCheckpoint = {
			...createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID),
			lastCompletedStepIndex: 0,
			completedSteps: [makeStep("step-0")],
		};
		const info = buildResumeInfo(cp);
		expect(info?.canResume).toBe(true);
		expect(info?.resumeFromIndex).toBe(1);
		expect(info?.completedCount).toBe(1);
	});

	it("carries through sessionId, instructionId, savedAt, and meta", () => {
		const cp = createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID, {
			inputHash: "deadbeef",
		});
		const info = buildResumeInfo(cp);
		expect(info?.sessionId).toBe(SESSION_ID);
		expect(info?.instructionId).toBe(INSTRUCTION_ID);
		expect(info?.savedAt).toBe(cp.savedAt);
		expect(info?.meta?.inputHash).toBe("deadbeef");
	});

	it("computes progressRatio when meta.totalSteps is set", () => {
		const cp: WorkflowCheckpoint = {
			...createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID, { totalSteps: 4 }),
			lastCompletedStepIndex: 1,
			completedSteps: [makeStep("a"), makeStep("b")],
		};
		const info = buildResumeInfo(cp);
		expect(info?.progressRatio).toBe(0.5); // 2 of 4
	});

	it("returns progressRatio=null when meta.totalSteps is absent", () => {
		const cp: WorkflowCheckpoint = {
			...createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID),
			lastCompletedStepIndex: 1,
			completedSteps: [makeStep("a"), makeStep("b")],
		};
		const info = buildResumeInfo(cp);
		expect(info?.progressRatio).toBeNull();
	});

	it("clamps progressRatio to 1.0 if completedSteps exceeds totalSteps", () => {
		const cp: WorkflowCheckpoint = {
			...createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID, { totalSteps: 2 }),
			lastCompletedStepIndex: 4,
			completedSteps: [
				makeStep("a"),
				makeStep("b"),
				makeStep("c"),
				makeStep("d"),
				makeStep("e"),
			],
		};
		const info = buildResumeInfo(cp);
		expect(info?.progressRatio).toBe(1.0);
	});
});

// ─── schemaVersion ─────────────────────────────────────────────────────────────

describe("checkpoint schemaVersion", () => {
	it("createInitialCheckpoint emits schemaVersion '2'", () => {
		const cp = createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID);
		expect((cp as unknown as Record<string, unknown>).schemaVersion).toBe("2");
	});
});

// ─── isValidCheckpoint (strengthened validation) ──────────────────────────────

describe("checkpoint validation (strengthened isValidCheckpoint)", () => {
	let tempDir: string;
	let manager: CheckpointManager;

	beforeEach(async () => {
		tempDir = await mkdtemp(join(tmpdir(), "cp-validation-"));
		manager = new CheckpointManager(tempDir);
	});

	afterEach(async () => {
		await rm(tempDir, { recursive: true, force: true });
	});
	it("rejects a checkpoint with missing savedAt field", async () => {
		const sessionDir = join(tempDir, SESSION_ID);
		await mkdir(sessionDir, { recursive: true });
		const invalid = {
			schemaVersion: "2",
			instructionId: INSTRUCTION_ID,
			sessionId: SESSION_ID,
			// savedAt intentionally omitted
			lastCompletedStepIndex: 0,
			completedSteps: [],
		};
		await writeFile(
			join(sessionDir, `checkpoint-${INSTRUCTION_ID}.json`),
			JSON.stringify(invalid),
		);
		const loaded = await manager.load(INSTRUCTION_ID, SESSION_ID);
		expect(loaded).toBeNull();
	});

	it("rejects a checkpoint with a non-integer lastCompletedStepIndex", async () => {
		const sessionDir = join(tempDir, SESSION_ID);
		await mkdir(sessionDir, { recursive: true });
		const invalid = {
			schemaVersion: "2",
			instructionId: INSTRUCTION_ID,
			sessionId: SESSION_ID,
			savedAt: new Date().toISOString(),
			lastCompletedStepIndex: 1.5,
			completedSteps: [],
		};
		await writeFile(
			join(sessionDir, `checkpoint-${INSTRUCTION_ID}.json`),
			JSON.stringify(invalid),
		);
		const loaded = await manager.load(INSTRUCTION_ID, SESSION_ID);
		expect(loaded).toBeNull();
	});

	it("rejects a checkpoint with lastCompletedStepIndex below -1", async () => {
		const sessionDir = join(tempDir, SESSION_ID);
		await mkdir(sessionDir, { recursive: true });
		const invalid = {
			schemaVersion: "2",
			instructionId: INSTRUCTION_ID,
			sessionId: SESSION_ID,
			savedAt: new Date().toISOString(),
			lastCompletedStepIndex: -2,
			completedSteps: [],
		};
		await writeFile(
			join(sessionDir, `checkpoint-${INSTRUCTION_ID}.json`),
			JSON.stringify(invalid),
		);
		const loaded = await manager.load(INSTRUCTION_ID, SESSION_ID);
		expect(loaded).toBeNull();
	});

	it("rejects a checkpoint with malformed completedSteps items (missing kind/summary)", async () => {
		const sessionDir = join(tempDir, SESSION_ID);
		await mkdir(sessionDir, { recursive: true });
		const invalid = {
			schemaVersion: "2",
			instructionId: INSTRUCTION_ID,
			sessionId: SESSION_ID,
			savedAt: new Date().toISOString(),
			lastCompletedStepIndex: 0,
			completedSteps: [{ label: "step-0" }], // missing kind and summary
		};
		await writeFile(
			join(sessionDir, `checkpoint-${INSTRUCTION_ID}.json`),
			JSON.stringify(invalid),
		);
		const loaded = await manager.load(INSTRUCTION_ID, SESSION_ID);
		expect(loaded).toBeNull();
	});

	it("rejects a checkpoint with meta set to an array", async () => {
		const sessionDir = join(tempDir, SESSION_ID);
		await mkdir(sessionDir, { recursive: true });
		const invalid = {
			schemaVersion: "2",
			instructionId: INSTRUCTION_ID,
			sessionId: SESSION_ID,
			savedAt: new Date().toISOString(),
			lastCompletedStepIndex: -1,
			completedSteps: [],
			meta: ["not", "an", "object"],
		};
		await writeFile(
			join(sessionDir, `checkpoint-${INSTRUCTION_ID}.json`),
			JSON.stringify(invalid),
		);
		const loaded = await manager.load(INSTRUCTION_ID, SESSION_ID);
		expect(loaded).toBeNull();
	});

	it("accepts a valid checkpoint with meta.totalSteps and meta.inputHash", async () => {
		const sessionDir = join(tempDir, SESSION_ID);
		await mkdir(sessionDir, { recursive: true });
		const valid = {
			schemaVersion: "2",
			instructionId: INSTRUCTION_ID,
			sessionId: SESSION_ID,
			savedAt: new Date().toISOString(),
			lastCompletedStepIndex: 0,
			completedSteps: [{ label: "step-0", kind: "invokeSkill", summary: "ok" }],
			meta: { totalSteps: 3, inputHash: "abc1234567890123" },
		};
		await writeFile(
			join(sessionDir, `checkpoint-${INSTRUCTION_ID}.json`),
			JSON.stringify(valid),
		);
		const loaded = await manager.load(INSTRUCTION_ID, SESSION_ID);
		expect(loaded).not.toBeNull();
		expect(loaded?.meta?.totalSteps).toBe(3);
		expect(loaded?.meta?.inputHash).toBe("abc1234567890123");
	});
});
