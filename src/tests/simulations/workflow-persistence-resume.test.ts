/**
 * Simulation: workflow-persistence-resume
 *
 * Validates the full persist → compare → resume loop mandated by the
 * workflow-persistence-protocol-v2 todo.  All tests use real filesystem I/O
 * via CheckpointManager (same approach as the unit tests in
 * workflow-checkpoint.test.ts) so the round-trip is end-to-end without
 * requiring the MCP server to be running.
 *
 * Scenarios covered:
 *   1. Full run (no prior checkpoint) — starts at step 0.
 *   2. Resume after crash — manager reloads from disk, picks up mid-run.
 *   3. Checkpoint comparison — compareCheckpoints surfaces incremental progress.
 *   4. buildResumeInfo — returns machine-readable resume metadata.
 *   5. Completed workflow — clear removes checkpoint; subsequent load returns null.
 *   6. Idempotent advance — advancing the same step twice still persists correctly.
 */

import { mkdtemp, rm } from "node:fs/promises";
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
} from "../../workflows/workflow-checkpoint.js";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const INSTRUCTION_ID = "sim-instruction";
const SESSION_ID = "session-sim-persist-resume-01";

function makeStep(
	label: string,
	summary = `Output of ${label}`,
): StepExecutionRecord {
	return { label, kind: "invokeSkill", summary };
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

let tempDir: string;
let manager: CheckpointManager;

beforeEach(async () => {
	tempDir = await mkdtemp(join(tmpdir(), "sim-persist-"));
	manager = new CheckpointManager(tempDir);
});

afterEach(async () => {
	await rm(tempDir, { recursive: true, force: true });
});

// ─── Scenarios ────────────────────────────────────────────────────────────────

describe("Simulation: persist → compare → resume", () => {
	it("scenario 1 — full run: no checkpoint means start at step 0", async () => {
		const loaded = await manager.load(INSTRUCTION_ID, SESSION_ID);
		const resumeIndex = resolveResumeIndex(loaded);
		const resumeInfo = buildResumeInfo(loaded);

		expect(loaded).toBeNull();
		expect(resumeIndex).toBe(0);
		expect(resumeInfo).toBeNull();
	});

	it("scenario 2 — resume after crash: reloads mid-run state from disk", async () => {
		// --- Phase A: Simulate first run, completed steps 0 and 1 before crash ---
		const steps = [makeStep("init"), makeStep("scan"), makeStep("report")];
		const [initStep, scanStep, reportStep] = steps;
		let cp = createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID, {
			inputHash: "abc",
		});
		await manager.save(cp);

		cp = await manager.advance(cp, initStep);
		cp = await manager.advance(cp, scanStep);
		// "Crash" — discard in-memory cp, simulate process restart by creating a fresh manager
		const freshManager = new CheckpointManager(tempDir);

		// --- Phase B: New process boots, loads checkpoint from disk ---
		const recovered = await freshManager.load(INSTRUCTION_ID, SESSION_ID);
		expect(recovered).not.toBeNull();
		if (!recovered) {
			throw new Error("Expected checkpoint recovery to succeed");
		}

		const resumeIndex = resolveResumeIndex(recovered);
		expect(resumeIndex).toBe(2); // next step after index 1

		const info = buildResumeInfo(recovered);
		expect(info?.canResume).toBe(true);
		expect(info?.resumeFromIndex).toBe(2);
		expect(info?.completedCount).toBe(2);
		expect(info?.meta?.inputHash).toBe("abc");

		// --- Phase C: Complete remaining step after resume ---
		let resumed = recovered;
		resumed = await freshManager.advance(resumed, reportStep);
		expect(resumed.lastCompletedStepIndex).toBe(2);
		expect(resumed.completedSteps).toHaveLength(3);
	});

	it("scenario 3 — compareCheckpoints shows incremental progress", async () => {
		const steps = [makeStep("step-0"), makeStep("step-1"), makeStep("step-2")];
		const [step0, step1, step2] = steps;

		let cp = createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID);
		await manager.save(cp);

		// Snapshot A: after step 0
		cp = await manager.advance(cp, step0);
		const snapshotA = { ...cp, completedSteps: [...cp.completedSteps] };

		// Snapshot B: after step 1 and step 2
		cp = await manager.advance(cp, step1);
		cp = await manager.advance(cp, step2);
		const snapshotB = { ...cp, completedSteps: [...cp.completedSteps] };

		// Compare A → B
		const diff = compareCheckpoints(snapshotA, snapshotB);
		expect(diff.fromIndex).toBe(0);
		expect(diff.toIndex).toBe(2);
		expect(diff.stepsAdvanced).toBe(2);
		expect(diff.newlyCompletedSteps.map((s) => s.label)).toEqual([
			"step-1",
			"step-2",
		]);

		// Compare null → A (very first checkpoint)
		const firstDiff = compareCheckpoints(null, snapshotA);
		expect(firstDiff.stepsAdvanced).toBe(1);
		expect(firstDiff.newlyCompletedSteps.map((s) => s.label)).toEqual([
			"step-0",
		]);
	});

	it("scenario 4 — buildResumeInfo returns serializable machine-readable metadata", async () => {
		let cp = createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID, {
			workflow: "triage-v2",
		});

		// Before any step: canResume must be false
		expect(buildResumeInfo(cp)?.canResume).toBe(false);

		cp = await manager.advance(cp, makeStep("triage"));
		const info = buildResumeInfo(cp);

		expect(info).not.toBeNull();
		expect(info?.canResume).toBe(true);
		expect(info?.resumeFromIndex).toBe(1);
		expect(info?.completedCount).toBe(1);
		expect(info?.sessionId).toBe(SESSION_ID);
		expect(info?.instructionId).toBe(INSTRUCTION_ID);
		expect(typeof info?.savedAt).toBe("string");
		expect(info?.meta?.workflow).toBe("triage-v2");

		// Must be JSON-serializable
		const serialized = JSON.stringify(info);
		const round = JSON.parse(serialized) as typeof info;
		expect(round?.canResume).toBe(true);
	});

	it("scenario 5 — clear on completion: no dangling checkpoint after a full run", async () => {
		let cp = createInitialCheckpoint(INSTRUCTION_ID, SESSION_ID);
		cp = await manager.advance(cp, makeStep("step-0"));
		cp = await manager.advance(cp, makeStep("step-1"));

		// Workflow completes — clear the checkpoint
		await manager.clear(INSTRUCTION_ID, SESSION_ID);

		const reloaded = await manager.load(INSTRUCTION_ID, SESSION_ID);
		expect(reloaded).toBeNull();
		expect(resolveResumeIndex(reloaded)).toBe(0);
	});

	it("scenario 6 — multiple independent sessions share the same CheckpointManager without collision", async () => {
		const SESSION_A = "session-sim-persist-resume-A1";
		const SESSION_B = "session-sim-persist-resume-B1";

		let cpA = createInitialCheckpoint(INSTRUCTION_ID, SESSION_A);
		let cpB = createInitialCheckpoint(INSTRUCTION_ID, SESSION_B);

		cpA = await manager.advance(cpA, makeStep("step-0"));
		cpA = await manager.advance(cpA, makeStep("step-1"));
		cpB = await manager.advance(cpB, makeStep("step-0"));

		const loadedA = await manager.load(INSTRUCTION_ID, SESSION_A);
		const loadedB = await manager.load(INSTRUCTION_ID, SESSION_B);

		expect(loadedA?.lastCompletedStepIndex).toBe(1);
		expect(loadedB?.lastCompletedStepIndex).toBe(0);

		// Sessions must not see each other's steps
		expect(loadedA?.completedSteps).toHaveLength(2);
		expect(loadedB?.completedSteps).toHaveLength(1);
	});
});
