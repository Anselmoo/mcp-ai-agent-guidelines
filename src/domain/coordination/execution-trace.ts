export interface TraceDecision {
	point: string;
	choice: string;
	reason: string;
}

export interface TraceMetric {
	name: string;
	value: number;
	unit?: string;
}

export interface TraceError {
	code: string;
	message: string;
}

export interface TraceExportData {
	operation: string;
	timestamp: string;
	durationMs: number;
	decisions: TraceDecision[];
	metrics: TraceMetric[];
	errors: TraceError[];
	success: boolean;
}

/**
 * Lightweight execution trace used by coordination workflows.
 */
export class ExecutionTrace {
	private readonly startedAt: Date;
	private completedAt?: Date;
	private readonly _decisions: TraceDecision[] = [];
	private readonly _metrics: TraceMetric[] = [];
	private readonly _errors: TraceError[] = [];
	private _success = false;

	constructor(private readonly operation: string) {
		this.startedAt = new Date();
	}

	recordDecision(point: string, choice: string, reason: string): void {
		this._decisions.push({ point, choice, reason });
	}

	recordMetric(name: string, value: number, unit?: string): void {
		this._metrics.push({ name, value, unit });
	}

	recordError(code: string, message: string): void {
		this._errors.push({ code, message });
	}

	complete(success: boolean): void {
		this._success = success;
		this.completedAt = new Date();
	}

	toJSON(): TraceExportData {
		const endedAt = this.completedAt ?? new Date();
		return {
			operation: this.operation,
			timestamp: this.startedAt.toISOString(),
			durationMs: endedAt.getTime() - this.startedAt.getTime(),
			decisions: [...this._decisions],
			metrics: [...this._metrics],
			errors: [...this._errors],
			success: this._success,
		};
	}
}
