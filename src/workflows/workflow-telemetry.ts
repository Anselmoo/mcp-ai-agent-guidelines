/**
 * workflow-telemetry.ts
 *
 * Step-level telemetry for workflow execution.
 *
 * Captures timing, retry counts, and error information per step so that
 * higher-level consumers (dashboards, memory artifacts, CI checks) have
 * structured execution metadata without parsing log strings.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface StepTiming {
	startedAt: string; // ISO-8601
	finishedAt: string; // ISO-8601
	durationMs: number;
}

export interface StepTelemetryRecord {
	/** Workflow step label. */
	label: string;
	/** Step kind (invokeSkill, parallel, serial, gate, …). */
	kind: string;
	/** Timing information — set when the step completes. */
	timing?: StepTiming;
	/** Number of attempts (1 = first try, >1 includes retries). */
	attempts: number;
	/** Whether the step ultimately succeeded. */
	succeeded: boolean;
	/** Error message if the step failed. */
	errorMessage?: string;
	/** Error class from classifyStepError(). */
	errorClass?: string;
	/** Child step telemetry (for serial/parallel steps). */
	children?: StepTelemetryRecord[];
}

export interface WorkflowTelemetry {
	instructionId: string;
	sessionId: string;
	startedAt: string;
	finishedAt?: string;
	totalDurationMs?: number;
	stepCount: number;
	succeededSteps: number;
	failedSteps: number;
	totalRetries: number;
	steps: StepTelemetryRecord[];
}

// ─── Telemetry collector ──────────────────────────────────────────────────────

/**
 * Mutable collector that accumulates telemetry across a workflow execution.
 * One instance lives for the lifetime of a single `executeInstruction` call.
 *
 * Usage:
 *   const telemetry = new WorkflowTelemetryCollector(instructionId, sessionId);
 *   const timer = telemetry.startStep(label, kind);
 *   // ...execute step...
 *   timer.finish(succeeded, { attempts, errorMessage, errorClass });
 *   const report = telemetry.finalise();
 */
export class WorkflowTelemetryCollector {
	private readonly startedAt: Date;
	private readonly records: StepTelemetryRecord[] = [];

	constructor(
		private readonly instructionId: string,
		private readonly sessionId: string,
	) {
		this.startedAt = new Date();
	}

	/**
	 * Begin timing a step. Returns a `StepTimer` whose `finish()` method
	 * records the completed timing onto `record`.
	 */
	startStep(label: string, kind: string): StepTimer {
		const record: StepTelemetryRecord = {
			label,
			kind,
			attempts: 1,
			succeeded: false,
		};
		this.records.push(record);
		return new StepTimer(record, new Date());
	}

	/**
	 * Produce the final `WorkflowTelemetry` snapshot.
	 * Can be called at any point — partial data is still useful.
	 */
	finalise(): WorkflowTelemetry {
		const finishedAt = new Date();
		const totalDurationMs = finishedAt.getTime() - this.startedAt.getTime();

		let succeededSteps = 0;
		let failedSteps = 0;
		let totalRetries = 0;

		const countRecursive = (records: StepTelemetryRecord[]): void => {
			for (const r of records) {
				if (r.succeeded) succeededSteps++;
				else failedSteps++;
				totalRetries += Math.max(0, r.attempts - 1);
				if (r.children) countRecursive(r.children);
			}
		};
		countRecursive(this.records);

		return {
			instructionId: this.instructionId,
			sessionId: this.sessionId,
			startedAt: this.startedAt.toISOString(),
			finishedAt: finishedAt.toISOString(),
			totalDurationMs,
			stepCount: this.records.length,
			succeededSteps,
			failedSteps,
			totalRetries,
			steps: structuredClone(this.records),
		};
	}

	/** All currently collected step records (live reference — do not mutate). */
	get currentRecords(): readonly StepTelemetryRecord[] {
		return this.records;
	}

	/** Attach child telemetry records to the most-recent step record. */
	attachChildRecords(children: StepTelemetryRecord[]): void {
		const last = this.records.at(-1);
		if (last) {
			last.children = children;
		}
	}
}

/**
 * Returned by `WorkflowTelemetryCollector.startStep()`.
 * Call `finish()` when the step is done.
 */
export class StepTimer {
	constructor(
		private readonly record: StepTelemetryRecord,
		private readonly startedAt: Date,
	) {}

	finish(
		succeeded: boolean,
		meta?: {
			attempts?: number;
			errorMessage?: string;
			errorClass?: string;
			children?: StepTelemetryRecord[];
		},
	): void {
		const finishedAt = new Date();
		this.record.timing = {
			startedAt: this.startedAt.toISOString(),
			finishedAt: finishedAt.toISOString(),
			durationMs: finishedAt.getTime() - this.startedAt.getTime(),
		};
		this.record.succeeded = succeeded;
		if (meta?.attempts !== undefined) this.record.attempts = meta.attempts;
		if (meta?.errorMessage) this.record.errorMessage = meta.errorMessage;
		if (meta?.errorClass) this.record.errorClass = meta.errorClass;
		if (meta?.children) this.record.children = meta.children;
	}
}

// ─── Telemetry summary helpers ────────────────────────────────────────────────

/**
 * Produce a compact human-readable summary line from a `WorkflowTelemetry`.
 */
export function formatTelemetrySummary(t: WorkflowTelemetry): string {
	const status = t.failedSteps === 0 ? "✓" : `✗(${t.failedSteps} failed)`;
	const retries = t.totalRetries > 0 ? `, ${t.totalRetries} retries` : "";
	const ms =
		t.totalDurationMs !== undefined ? ` in ${t.totalDurationMs}ms` : "";
	return `[${t.instructionId}] ${status} ${t.stepCount} steps${ms}${retries}`;
}

/**
 * Flatten a nested `StepTelemetryRecord` tree into a single-level array.
 */
export function flattenTelemetryRecords(
	records: StepTelemetryRecord[],
): StepTelemetryRecord[] {
	const out: StepTelemetryRecord[] = [];
	const visit = (r: StepTelemetryRecord): void => {
		out.push(r);
		if (r.children) r.children.forEach(visit);
	};
	records.forEach(visit);
	return out;
}

/**
 * Find the slowest step in a telemetry report (by `durationMs`).
 */
export function findSlowestStep(
	t: WorkflowTelemetry,
): StepTelemetryRecord | undefined {
	const flat = flattenTelemetryRecords(t.steps);
	return flat.reduce<StepTelemetryRecord | undefined>((prev, cur) => {
		if (!cur.timing) return prev;
		if (!prev?.timing) return cur;
		return cur.timing.durationMs > prev.timing.durationMs ? cur : prev;
	}, undefined);
}

/**
 * Aggregate telemetry across multiple workflow runs.
 */
export function aggregateTelemetry(runs: WorkflowTelemetry[]): {
	runCount: number;
	totalSteps: number;
	totalSucceeded: number;
	totalFailed: number;
	totalRetries: number;
	averageDurationMs: number | null;
	p95DurationMs: number | null;
} {
	if (runs.length === 0) {
		return {
			runCount: 0,
			totalSteps: 0,
			totalSucceeded: 0,
			totalFailed: 0,
			totalRetries: 0,
			averageDurationMs: null,
			p95DurationMs: null,
		};
	}

	let totalSteps = 0;
	let totalSucceeded = 0;
	let totalFailed = 0;
	let totalRetries = 0;
	const durations: number[] = [];

	for (const run of runs) {
		totalSteps += run.stepCount;
		totalSucceeded += run.succeededSteps;
		totalFailed += run.failedSteps;
		totalRetries += run.totalRetries;
		if (run.totalDurationMs !== undefined) durations.push(run.totalDurationMs);
	}

	const sorted = durations.slice().sort((a, b) => a - b);
	const averageDurationMs =
		durations.length > 0
			? durations.reduce((s, d) => s + d, 0) / durations.length
			: null;

	const p95DurationMs =
		sorted.length > 0
			? (sorted[Math.floor(sorted.length * 0.95)] ??
				sorted[sorted.length - 1] ??
				null)
			: null;

	return {
		runCount: runs.length,
		totalSteps,
		totalSucceeded,
		totalFailed,
		totalRetries,
		averageDurationMs:
			averageDurationMs !== null ? Math.round(averageDurationMs) : null,
		p95DurationMs,
	};
}
