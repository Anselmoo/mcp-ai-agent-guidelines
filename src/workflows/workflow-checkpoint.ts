/**
 * workflow-checkpoint.ts
 *
 * Lightweight workflow checkpointing: persists the last-successfully-completed
 * step index to disk so interrupted workflows can resume from where they left
 * off rather than restarting from the beginning.
 *
 * The checkpoint is a small JSON file stored alongside the session state.
 * It is advisory only — the workflow engine checks for a resume point on
 * startup and skips already-completed steps.
 *
 * Storage layout:
 *   .mcp-ai-agent-guidelines/sessions/{sessionId}/checkpoint-{instructionId}.json
 */

import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { StepExecutionRecord } from "../contracts/runtime.js";

// ─── Path safety ──────────────────────────────────────────────────────────────

/**
 * Validate that an identifier is safe to embed in a file path.
 * Accepts alphanumerics, hyphens, underscores, and dots only.
 * Rejects empty strings and path-traversal sequences like `..` or `/`.
 */
function assertSafeId(value: string, label: string): void {
	if (!value || !/^[\w\-. ]+$/.test(value) || value.includes("..")) {
		throw new Error(
			`[checkpoint] Unsafe ${label} "${value}" — only alphanumerics, hyphens, underscores, dots and spaces are allowed.`,
		);
	}
}

// ─── Checkpoint shape ─────────────────────────────────────────────────────────

export interface WorkflowCheckpoint {
	/**
	 * Schema version — guards against loading stale v1 files after an upgrade.
	 * Always written as `"2"` by this module.
	 */
	schemaVersion: "2";
	/** Instruction this checkpoint belongs to. */
	instructionId: string;
	/** Session the instruction was running in. */
	sessionId: string;
	/** ISO-8601 timestamp of the last flush. */
	savedAt: string;
	/**
	 * Index of the last step that completed successfully.
	 * The workflow should resume from index `lastCompletedStepIndex + 1`.
	 */
	lastCompletedStepIndex: number;
	/**
	 * Serialised `StepExecutionRecord` results for already-completed steps
	 * so downstream formatters can include them in the final output.
	 */
	completedSteps: StepExecutionRecord[];
	/**
	 * Arbitrary metadata (e.g. `inputHash` for cache invalidation,
	 * `totalSteps` for progress-ratio computation).
	 */
	meta?: Record<string, unknown>;
}

// ─── CheckpointManager ────────────────────────────────────────────────────────

export class CheckpointManager {
	constructor(private readonly sessionDir: string) {}

	private checkpointPath(instructionId: string, sessionId: string): string {
		assertSafeId(instructionId, "instructionId");
		assertSafeId(sessionId, "sessionId");
		return join(this.sessionDir, sessionId, `checkpoint-${instructionId}.json`);
	}

	/**
	 * Persist the current execution state.
	 * Non-fatal: swallows IO errors and logs a warning.
	 */
	async save(checkpoint: WorkflowCheckpoint): Promise<void> {
		const filePath = this.checkpointPath(
			checkpoint.instructionId,
			checkpoint.sessionId,
		);
		try {
			await mkdir(join(this.sessionDir, checkpoint.sessionId), {
				recursive: true,
			});
			await writeFile(filePath, JSON.stringify(checkpoint, null, 2), "utf8");
		} catch (err) {
			console.warn(
				`[checkpoint] Failed to save checkpoint for ` +
					`${checkpoint.instructionId}/${checkpoint.sessionId}: ${String(err)}`,
			);
		}
	}

	/**
	 * Load a previously saved checkpoint.
	 * Returns `null` when no checkpoint file exists or it cannot be parsed.
	 */
	async load(
		instructionId: string,
		sessionId: string,
	): Promise<WorkflowCheckpoint | null> {
		const filePath = this.checkpointPath(instructionId, sessionId);
		try {
			const raw = await readFile(filePath, "utf8");
			const parsed = JSON.parse(raw) as unknown;
			if (isValidCheckpoint(parsed)) return parsed;
			console.warn(`[checkpoint] Invalid checkpoint shape at ${filePath}`);
			return null;
		} catch {
			return null;
		}
	}

	/**
	 * Delete the checkpoint for a completed (or abandoned) workflow.
	 * Non-fatal.
	 */
	async clear(instructionId: string, sessionId: string): Promise<void> {
		const filePath = this.checkpointPath(instructionId, sessionId);
		try {
			await unlink(filePath);
		} catch {
			// File may not exist — ignore
		}
	}

	/**
	 * Advance the checkpoint after a single step succeeds.
	 * Persists immediately so a crash after step N still saves step N-1.
	 */
	async advance(
		existing: WorkflowCheckpoint,
		completedStep: StepExecutionRecord,
	): Promise<WorkflowCheckpoint> {
		const updated: WorkflowCheckpoint = {
			...existing,
			savedAt: new Date().toISOString(),
			lastCompletedStepIndex: existing.lastCompletedStepIndex + 1,
			completedSteps: [...existing.completedSteps, completedStep],
		};
		await this.save(updated);
		return updated;
	}
}

// ─── Resume helpers ───────────────────────────────────────────────────────────

/**
 * Determine at which step index a workflow should (re-)start.
 *
 * @returns `0` when no checkpoint exists (full run), otherwise the index of
 *          the next step to execute (i.e. `checkpoint.lastCompletedStepIndex + 1`).
 */
export function resolveResumeIndex(
	checkpoint: WorkflowCheckpoint | null,
): number {
	if (!checkpoint) return 0;
	return checkpoint.lastCompletedStepIndex + 1;
}

/**
 * Build a new empty checkpoint for the beginning of an instruction run.
 */
export function createInitialCheckpoint(
	instructionId: string,
	sessionId: string,
	meta?: Record<string, unknown>,
): WorkflowCheckpoint {
	return {
		schemaVersion: "2",
		instructionId,
		sessionId,
		savedAt: new Date().toISOString(),
		lastCompletedStepIndex: -1,
		completedSteps: [],
		meta,
	};
}

// ─── Checkpoint diff ─────────────────────────────────────────────────────────

/**
 * Structured difference between two checkpoint states.
 * Useful for understanding how far a workflow advanced between two saves —
 * e.g. comparing the last known-good checkpoint to a newly-loaded one.
 */
export interface CheckpointDiff {
	/** `lastCompletedStepIndex` of the earlier checkpoint, or -1 if absent. */
	fromIndex: number;
	/** `lastCompletedStepIndex` of the later checkpoint, or -1 if absent. */
	toIndex: number;
	/** Steps that appear in `to` but not in `from` (newly completed). */
	newlyCompletedSteps: StepExecutionRecord[];
	/** How many additional steps were completed (`toIndex - fromIndex`, min 0). */
	stepsAdvanced: number;
}

/**
 * Compute a structured diff between two checkpoints.
 * Pass `null` for `from` to represent the "no prior checkpoint" case.
 * The result is always machine-readable and safe to serialize to JSON.
 */
export function compareCheckpoints(
	from: WorkflowCheckpoint | null,
	to: WorkflowCheckpoint | null,
): CheckpointDiff {
	const fromIndex = from?.lastCompletedStepIndex ?? -1;
	const toIndex = to?.lastCompletedStepIndex ?? -1;
	const toSteps = to?.completedSteps ?? [];
	const fromCompletedCount = from?.completedSteps.length ?? 0;
	const newlyCompletedSteps = toSteps.slice(fromCompletedCount);

	return {
		fromIndex,
		toIndex,
		newlyCompletedSteps,
		stepsAdvanced: Math.max(0, toIndex - fromIndex),
	};
}

// ─── Resume info ─────────────────────────────────────────────────────────────

/**
 * Structured, machine-readable description of the resume state for a workflow.
 * Intended for callers that need to serialize or log the resume decision without
 * re-deriving it from raw checkpoint fields.
 */
export interface ResumeInfo {
	sessionId: string;
	instructionId: string;
	/** Step index to start from on the next run (0 = full restart). */
	resumeFromIndex: number;
	/** Number of steps already completed in the stored checkpoint. */
	completedCount: number;
	/** ISO-8601 timestamp of when the checkpoint was last flushed. */
	savedAt: string;
	/**
	 * `true` when at least one step has completed and the workflow can
	 * meaningfully skip already-done work on resume.
	 */
	canResume: boolean;
	/**
	 * Fraction of known steps completed (0–1), or `null` when
	 * `meta.totalSteps` is absent or zero. Enables progress-bar rendering
	 * without re-parsing raw step arrays.
	 */
	progressRatio: number | null;
	/** Pass-through of the arbitrary metadata stored in the checkpoint. */
	meta?: Record<string, unknown>;
}

/**
 * Build structured resume info from an optional checkpoint.
 * Returns `null` when no checkpoint is available (workflow must start fresh).
 */
export function buildResumeInfo(
	checkpoint: WorkflowCheckpoint | null,
): ResumeInfo | null {
	if (!checkpoint) return null;
	const totalSteps =
		typeof checkpoint.meta?.totalSteps === "number"
			? checkpoint.meta.totalSteps
			: null;
	const completedCount = checkpoint.completedSteps.length;
	const progressRatio =
		totalSteps !== null && totalSteps > 0
			? Math.min(1, completedCount / totalSteps)
			: null;
	return {
		sessionId: checkpoint.sessionId,
		instructionId: checkpoint.instructionId,
		resumeFromIndex: resolveResumeIndex(checkpoint),
		completedCount,
		savedAt: checkpoint.savedAt,
		canResume: checkpoint.lastCompletedStepIndex >= 0,
		progressRatio,
		meta: checkpoint.meta,
	};
}

function isValidStepRecord(value: unknown): boolean {
	if (typeof value !== "object" || value === null) return false;
	const rec = value as Record<string, unknown>;
	return (
		typeof rec.label === "string" &&
		typeof rec.kind === "string" &&
		typeof rec.summary === "string"
	);
}

function isValidCheckpoint(value: unknown): value is WorkflowCheckpoint {
	if (typeof value !== "object" || value === null) return false;
	const cp = value as Record<string, unknown>;
	return (
		cp.schemaVersion === "2" &&
		typeof cp.instructionId === "string" &&
		cp.instructionId.length > 0 &&
		typeof cp.sessionId === "string" &&
		cp.sessionId.length > 0 &&
		typeof cp.savedAt === "string" &&
		cp.savedAt.length > 0 &&
		typeof cp.lastCompletedStepIndex === "number" &&
		Number.isInteger(cp.lastCompletedStepIndex) &&
		cp.lastCompletedStepIndex >= -1 &&
		Array.isArray(cp.completedSteps) &&
		(cp.completedSteps as unknown[]).every(isValidStepRecord) &&
		(cp.meta === undefined ||
			(typeof cp.meta === "object" &&
				cp.meta !== null &&
				!Array.isArray(cp.meta)))
	);
}
