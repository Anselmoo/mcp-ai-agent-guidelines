/**
 * Validation and error handling system.
 *
 * Provides schema validation, environment validation, error handling,
 * and input sanitization with graceful fallbacks.
 */

import type { z } from "zod";

// Export core schemas
export * from "./core-schemas.js";

// Export environment validation
export * from "./environment.js";

// Export error handling (avoiding conflicts with core-schemas)
export {
	AuthorizationError,
	createErrorContext,
	type ErrorCategory,
	type ErrorContext,
	formatErrorForDisplay,
	InputSanitizer,
	ModelExecutionError,
	ResourceError,
	SkillExecutionError,
	type StandardError,
	TimeoutError,
	withErrorBoundary,
	withRetry,
} from "./error-handling.js";

// Export input guards
export * from "./input-guards.js";

import type { InstructionInput } from "../contracts/runtime.js";
import {
	getWorkflowErrorMessage,
	getWorkflowErrorType,
} from "../infrastructure/workflow-error-utilities.js";
import { skillRequestSchema } from "./core-schemas.js";
import {
	type EnvironmentConfig,
	type EnvironmentValidationResult,
	initializeEnvironment,
	validateEnvironment,
} from "./environment.js";
import {
	createErrorContext,
	type ErrorContext,
	formatErrorForDisplay,
	type StandardError,
	withErrorBoundary,
	withRetry,
} from "./error-handling.js";
import {
	criticalSkillGuard,
	type ValidationGuardResult,
	type ValidationOptions,
	validateSkillInput,
	validateSkillOutput,
} from "./input-guards.js";

function getValidationLogMessage(error: unknown): string {
	if (
		error &&
		typeof error === "object" &&
		"message" in error &&
		typeof error.message === "string"
	) {
		return error.message;
	}

	return getWorkflowErrorMessage(error);
}

/**
 * Main validation service for the entire system
 */
export class ValidationService {
	private static instance: ValidationService | null = null;
	private config: EnvironmentConfig;
	private initialized = false;

	private constructor(config: EnvironmentConfig) {
		this.config = config;
	}

	/**
	 * Initialize the validation service (called once at startup)
	 */
	public static initialize(): ValidationService {
		if (!ValidationService.instance) {
			const config = initializeEnvironment();
			ValidationService.instance = new ValidationService(config);
			ValidationService.instance.initialized = true;

			process.stderr.write(
				`✅ Validation Service initialized (mode: ${config.validationMode})\n`,
			);
		}
		return ValidationService.instance;
	}

	/**
	 * Get the singleton instance
	 */
	public static getInstance(): ValidationService {
		if (!ValidationService.instance) {
			throw new Error(
				"ValidationService not initialized. Call ValidationService.initialize() first.",
			);
		}
		return ValidationService.instance;
	}

	/**
	 * Get current configuration
	 */
	public getConfig(): EnvironmentConfig {
		return { ...this.config };
	}

	/**
	 * Validate skill input with full pipeline
	 */
	public async validateSkillExecution<T = InstructionInput>(
		skillId: string,
		input: unknown,
		context: Partial<ErrorContext> = {},
	): Promise<ValidationGuardResult<T>> {
		if (!this.initialized) {
			throw new Error("ValidationService not properly initialized");
		}

		const fullContext = createErrorContext(
			skillId,
			context.instructionId,
			context.modelId,
			context.sessionId,
			typeof input === "object" && input !== null && "request" in input
				? String((input as Record<string, unknown>).request)
				: undefined,
		);

		const options: ValidationOptions = {
			strict: this.config.validationMode === "strict",
			sanitize: true,
			allowPhysicsSkills: this.config.enablePhysicsSkills,
			maxInputLength: this.config.maxFileSize,
			allowFileOperations: this.config.allowFileOperations,
			allowNetworkAccess: this.config.allowNetworkAccess,
			traceValidation: this.config.traceValidation,
		};

		// Skip validation if disabled
		if (this.config.validationMode === "disabled") {
			console.debug(`Validation disabled - skipping for ${skillId}`);
			return {
				success: true,
				data: input as T,
				errors: [],
				warnings: ["Validation disabled"],
				sanitized: false,
				context: fullContext,
			};
		}

		// Pre-execution critical skill guard
		const guardResult = await criticalSkillGuard(
			skillId,
			input as InstructionInput,
			fullContext,
		);
		if (!guardResult.allowed) {
			return {
				success: false,
				data: undefined,
				errors: [guardResult.reason || "Skill execution not allowed"],
				warnings: [],
				sanitized: false,
				context: fullContext,
			};
		}

		// Main validation
		// Use type assertion through unknown for generic compatibility
		return await validateSkillInput(
			input,
			skillRequestSchema as unknown as z.ZodSchema<T>,
			fullContext,
			options,
		);
	}

	/**
	 * Validate skill output
	 */
	public validateOutput(
		output: unknown,
		skillId: string,
	): { success: boolean; error?: string } {
		const result = validateSkillOutput(output, skillId);

		if (!result.success) {
			console.error(
				`Output validation failed for ${skillId} [errorType=${getWorkflowErrorType(result.error)}, error=${getValidationLogMessage(result.error)}]`,
			);
			return { success: false, error: result.error?.message };
		}

		return { success: true };
	}

	/**
	 * Execute operation with full error boundary and retry logic
	 */
	public async executeWithValidation<T>(
		operation: () => Promise<T>,
		skillId: string,
		context: Partial<ErrorContext> = {},
		enableRetry = true,
	): Promise<
		{ success: true; data: T } | { success: false; error: StandardError }
	> {
		const fullContext = createErrorContext(
			skillId,
			context.instructionId,
			context.modelId,
			context.sessionId,
		);

		const executeOperation = async () => {
			if (enableRetry && this.config.maxRetries > 1) {
				return await withRetry(operation, fullContext, this.config.maxRetries);
			} else {
				return await operation();
			}
		};

		return await withErrorBoundary(executeOperation, fullContext);
	}

	/**
	 * Format error for display to user
	 */
	public formatError(error: StandardError): string {
		return formatErrorForDisplay(error);
	}

	/**
	 * Check if validation is enabled
	 */
	public isValidationEnabled(): boolean {
		return this.config.validationMode !== "disabled";
	}

	/**
	 * Check if strict mode is enabled
	 */
	public isStrictMode(): boolean {
		return this.config.validationMode === "strict";
	}

	/**
	 * Get validation statistics
	 */
	public getValidationStats(): {
		mode: string;
		enabledFeatures: string[];
		limits: Record<string, number>;
	} {
		return {
			mode: this.config.validationMode,
			enabledFeatures: [
				this.config.enablePhysicsSkills && "physics-skills",
				this.config.enableAdaptiveRouting && "adaptive-routing",
				this.config.allowFileOperations && "file-operations",
				this.config.allowNetworkAccess && "network-access",
				this.config.enableMetrics && "metrics",
				this.config.debugSkillExecution && "debug-execution",
				this.config.traceValidation && "trace-validation",
			].filter(Boolean) as string[],
			limits: {
				maxSessions: this.config.maxSessions,
				sessionTtlMinutes: this.config.sessionTtlMinutes,
				maxInstructionDepth: this.config.maxInstructionDepth,
				maxParallelSkills: this.config.maxParallelSkills,
				defaultModelTimeout: this.config.defaultModelTimeout,
				maxRetries: this.config.maxRetries,
				maxFileSize: this.config.maxFileSize,
			},
		};
	}

	/**
	 * Update configuration at runtime (limited subset)
	 */
	public updateConfig(
		updates: Partial<
			Pick<
				EnvironmentConfig,
				| "validationMode"
				| "enablePhysicsSkills"
				| "enableAdaptiveRouting"
				| "debugSkillExecution"
				| "traceValidation"
			>
		>,
	): void {
		this.config = { ...this.config, ...updates };
		console.log(`Updated validation config:`, updates);
	}
}

/**
 * Convenience functions for common validation tasks
 */

/**
 * Quick validation for skill inputs
 */
export async function validateSkill(
	skillId: string,
	input: unknown,
	context?: Partial<ErrorContext>,
): Promise<ValidationGuardResult<InstructionInput>> {
	const service = ValidationService.getInstance();
	return await service.validateSkillExecution<InstructionInput>(
		skillId,
		input,
		context,
	);
}

/**
 * Execute skill with full validation pipeline
 */
export async function executeSkillSafely<T>(
	skillId: string,
	input: unknown,
	operation: (validatedInput: InstructionInput) => Promise<T>,
	context: Partial<ErrorContext> = {},
): Promise<
	{ success: true; data: T } | { success: false; error: StandardError }
> {
	const service = ValidationService.getInstance();

	// Validate input first
	const validation = await service.validateSkillExecution<InstructionInput>(
		skillId,
		input,
		context,
	);

	if (!validation.success) {
		const error: StandardError = {
			code: `VALIDATION_${Date.now()}`,
			message: validation.errors.join("; "),
			context: validation.context || createErrorContext(skillId),
			recoverable: true,
			suggestedAction: "Fix the input validation errors and try again.",
		};

		return { success: false, error };
	}

	// Execute with error boundary
	return await service.executeWithValidation(
		() => operation(validation.data as InstructionInput),
		skillId,
		context,
	);
}

/**
 * Environment validation status check
 */
export function checkEnvironment(): {
	valid: boolean;
	errors: string[];
	warnings: string[];
} {
	const result: EnvironmentValidationResult = validateEnvironment();
	return {
		valid: result.success,
		errors: result.errors,
		warnings: result.warnings,
	};
}
