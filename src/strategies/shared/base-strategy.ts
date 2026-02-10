/**
 * Abstract base class for output strategies.
 * Enforces consistent interface, validation, execution tracing, and error handling.
 */

import { ExecutionTrace } from "./execution-trace.js";
import type {
	StrategyResult,
	ValidationError,
	ValidationResult,
} from "./types.js";

/**
 * Configuration for BaseStrategy behavior.
 */
export interface StrategyConfig {
	/** Enable execution tracing (default: true) */
	enableTrace?: boolean;
	/** Fail fast on first validation error (default: false) */
	failFast?: boolean;
	/** Maximum execution time in ms (default: 30000) */
	timeoutMs?: number;
	/** Enable verbose logging (default: false) */
	verbose?: boolean;
}

/**
 * Default strategy configuration.
 */
const DEFAULT_CONFIG: Required<StrategyConfig> = {
	enableTrace: true,
	failFast: false,
	timeoutMs: 30_000,
	verbose: false,
};

/**
 * Abstract base class for all output strategies.
 *
 * Enforces a consistent interface across all strategy implementations:
 * - Input validation via `validate()`
 * - Core logic via `execute()`
 * - Template method pattern via `run()`
 * - Execution tracing via `ExecutionTrace`
 *
 * All 7 strategies (SpecKit, TOGAF, ADR, RFC, Enterprise, SDD, Chat)
 * MUST extend this class.
 *
 * @typeParam TInput - Strategy input type (e.g., SessionState)
 * @typeParam TOutput - Strategy output type (e.g., OutputArtifacts)
 *
 * @example
 * ```typescript
 * class SpecKitStrategy extends BaseStrategy<SessionState, OutputArtifacts> {
 *   validate(input: SessionState): ValidationResult {
 *     // Validate session state
 *   }
 *
 *   async execute(input: SessionState): Promise<OutputArtifacts> {
 *     // Generate SpecKit documents
 *   }
 * }
 * ```
 */
export abstract class BaseStrategy<TInput, TOutput> {
	/** Execution trace for this strategy invocation */
	protected trace: ExecutionTrace;

	/** Configuration for this strategy */
	protected readonly config: Required<StrategyConfig>;

	/** Strategy name for logging */
	protected abstract readonly name: string;

	/** Strategy version */
	protected abstract readonly version: string;

	constructor(config: StrategyConfig = {}) {
		this.config = { ...DEFAULT_CONFIG, ...config };
		this.trace = new ExecutionTrace();
	}

	/**
	 * Validate the input before execution.
	 *
	 * MUST be implemented by subclasses to perform input validation.
	 * Called automatically by `run()` before `execute()`.
	 *
	 * @param input - Strategy input to validate
	 * @returns Validation result with errors and warnings
	 */
	abstract validate(input: TInput): ValidationResult;

	/**
	 * Execute the strategy's core logic.
	 *
	 * MUST be implemented by subclasses to perform the main work.
	 * Only called if `validate()` passes.
	 *
	 * @param input - Validated strategy input
	 * @returns Strategy output
	 * @throws Error if execution fails
	 */
	abstract execute(input: TInput): Promise<TOutput>;

	/**
	 * Run the strategy with validation and tracing.
	 *
	 * This is the main entry point for strategy execution.
	 * Implements the Template Method pattern:
	 * 1. Record start
	 * 2. Validate input
	 * 3. Execute if valid
	 * 4. Record result
	 *
	 * @param input - Strategy input
	 * @returns Strategy result with output or errors
	 */
	async run(input: TInput): Promise<StrategyResult<TOutput>> {
		const runStart = new Date();
		const startTime = runStart.getTime();
		this.trace = new ExecutionTrace(runStart);

		// Record start
		if (this.config.enableTrace) {
			const startData: Record<string, unknown> = {
				strategy: this.name,
				version: this.version,
				config: this.config,
				inputKeys: this.getInputKeys(input),
			};

			if (this.config.verbose) {
				startData.inputType = this.getInputType(input);
			}

			this.trace.recordStart({
				...startData,
			});
		}

		// Step 1: Validate input
		const validation = this.validateWithTrace(input);
		if (!validation.valid) {
			return this.buildErrorResult(validation.errors);
		}

		// Step 2: Execute with timeout
		try {
			const output = await this.executeWithTimeout(input);

			// Record success
			if (this.config.enableTrace) {
				this.trace.recordSuccess({
					outputType: typeof output,
					durationMs: Date.now() - startTime,
				});
			}

			const durationMs = this.trace.getDuration();
			return {
				success: true,
				data: output,
				trace: this.trace.toJSON(),
				durationMs,
			};
		} catch (error) {
			return this.handleExecutionError(error);
		}
	}

	/**
	 * Validate input with tracing.
	 */
	private validateWithTrace(input: TInput): ValidationResult {
		const validateStart = Date.now();

		if (this.config.enableTrace) {
			this.trace.recordDecision(
				"Starting validation",
				`Validating input for ${this.name}`,
			);
		}

		const result = this.normalizeValidationResult(this.validate(input));

		if (this.config.enableTrace) {
			this.trace.recordMetric(
				"validationDuration",
				Date.now() - validateStart,
				"ms",
			);

			if (this.config.verbose) {
				this.trace.recordMetric("validationErrors", result.errors.length);
				this.trace.recordMetric("validationWarnings", result.warnings.length);
			}

			if (!result.valid) {
				for (const error of result.errors) {
					this.trace.recordError(`Validation failed: ${error.message}`, {
						code: error.code,
						field: error.field,
					});
				}
			}

			for (const warning of result.warnings) {
				this.trace.recordWarning(`Validation warning: ${warning.message}`, {
					code: warning.code,
					field: warning.field,
				});
			}
		}

		return result;
	}

	/**
	 * Execute with timeout protection.
	 */
	private async executeWithTimeout(input: TInput): Promise<TOutput> {
		let timeoutId: ReturnType<typeof setTimeout> | undefined;
		const timeoutPromise = new Promise<never>((_, reject) => {
			timeoutId = setTimeout(() => {
				reject(
					new Error(
						`Strategy execution timed out after ${this.config.timeoutMs}ms`,
					),
				);
			}, this.config.timeoutMs);
		});

		try {
			return await Promise.race([this.execute(input), timeoutPromise]);
		} finally {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
		}
	}

	/**
	 * Build error result for validation failures.
	 */
	private buildErrorResult(errors: ValidationError[]): StrategyResult<TOutput> {
		const durationMs = this.trace.getDuration();
		return {
			success: false,
			errors,
			trace: this.trace.toJSON(),
			durationMs,
		};
	}

	/**
	 * Handle execution errors.
	 */
	private handleExecutionError(error: unknown): StrategyResult<TOutput> {
		const errorMessage = error instanceof Error ? error.message : String(error);

		if (this.config.enableTrace) {
			this.trace.recordError(
				error instanceof Error ? error : new Error(errorMessage),
				{ phase: "execute" },
			);
		}

		const durationMs = this.trace.getDuration();
		return {
			success: false,
			errors: [
				{
					code: "EXECUTION_ERROR",
					message: errorMessage,
					context: {
						stack: error instanceof Error ? error.stack : undefined,
					},
				},
			],
			trace: this.trace.toJSON(),
			durationMs,
		};
	}

	/**
	 * Normalize validation results based on configuration.
	 */
	private normalizeValidationResult(
		result: ValidationResult,
	): ValidationResult {
		if (!this.config.failFast || result.errors.length <= 1) {
			return result;
		}

		return {
			...result,
			errors: result.errors.slice(0, 1),
		};
	}

	/**
	 * Get input keys for logging (avoids logging full input).
	 */
	private getInputKeys(input: TInput): string[] {
		if (input && typeof input === "object") {
			return Object.keys(input as object);
		}
		return [];
	}

	private getInputType(input: TInput): string {
		if (input === null) {
			return "null";
		}
		if (Array.isArray(input)) {
			return "array";
		}
		return typeof input;
	}
}

/**
 * Type guard for StrategyResult success.
 */
export function isSuccessResult<T>(
	result: StrategyResult<T>,
): result is StrategyResult<T> & { success: true; data: T } {
	return result.success;
}

/**
 * Type guard for StrategyResult failure.
 */
export function isErrorResult<T>(
	result: StrategyResult<T>,
): result is StrategyResult<T> & { success: false; errors: ValidationError[] } {
	return !result.success;
}
