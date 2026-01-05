/**
 * Centralized error handling utilities with typed errors for improved debugging and resilience
 */

import { ERROR_MESSAGES, type ErrorCode, isRetryable } from "./error-codes.js";
import { logger } from "./logger.js";

/**
 * Structured context payload for McpToolError instances.
 */
export interface McpToolErrorContext {
	[key: string]: unknown;
}

/**
 * MCP-aware error with standardized codes, retry hints, and response formatting.
 * @public
 */
export class McpToolError extends Error {
	public readonly code: ErrorCode;
	public readonly context: McpToolErrorContext;
	public readonly timestamp: Date;
	public readonly cause?: Error;

	constructor(
		code: ErrorCode,
		message?: string,
		context?: McpToolErrorContext,
		cause?: Error,
	) {
		super(message ?? ERROR_MESSAGES[code]);
		this.name = "McpToolError";
		this.code = code;
		this.context = context ?? {};
		this.timestamp = new Date();
		this.cause = cause;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, McpToolError);
		}
	}

	/**
	 * Determines if this error is safe to retry based on its code category.
	 */
	isRetryable(): boolean {
		return isRetryable(this.code);
	}

	/**
	 * Formats the error into an MCP-compatible response payload.
	 */
	toResponse(): {
		isError: true;
		content: Array<{ type: "text"; text: string }>;
	} {
		return {
			isError: true,
			content: [
				{
					type: "text",
					text: JSON.stringify(
						{
							error: this.name,
							code: this.code,
							message: this.message,
							context: this.context,
							retryable: this.isRetryable(),
							timestamp: this.timestamp.toISOString(),
						},
						null,
						2,
					),
				},
			],
		};
	}
}

/**
 * Base class for all operational errors in the application
 */
export class OperationError extends Error {
	public readonly code: string;
	public readonly context?: Record<string, unknown>;
	public readonly timestamp: Date;

	constructor(
		message: string,
		code: string,
		context?: Record<string, unknown>,
	) {
		super(message);
		this.name = "OperationError";
		this.code = code;
		this.context = context;
		this.timestamp = new Date();

		// Maintains proper stack trace for where our error was thrown (only available on V8)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, OperationError);
		}
	}
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends OperationError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, "VALIDATION_ERROR", context);
		this.name = "ValidationError";
	}
}

/**
 * Configuration error for invalid or missing configuration
 */
export class ConfigurationError extends OperationError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, "CONFIGURATION_ERROR", context);
		this.name = "ConfigurationError";
	}
}

/**
 * Session error for session-related issues
 */
export class SessionError extends OperationError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, "SESSION_ERROR", context);
		this.name = "SessionError";
	}
}

/**
 * Phase error for design phase workflow issues
 */
export class PhaseError extends OperationError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, "PHASE_ERROR", context);
		this.name = "PhaseError";
	}
}

/**
 * Generation error for artifact generation failures
 */
export class GenerationError extends OperationError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, "GENERATION_ERROR", context);
		this.name = "GenerationError";
	}
}

/**
 * Consistency error for consistency enforcement failures
 */
export class ConsistencyError extends OperationError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, "CONSISTENCY_ERROR", context);
		this.name = "ConsistencyError";
	}
}

/**
 * Centralized error reporter for consistent error handling
 */
// biome-ignore lint/complexity/noStaticOnlyClass: ErrorReporter is a utility namespace that provides static helper functions for error handling
export class ErrorReporter {
	/**
	 * Report and log an error, optionally rethrowing it
	 */
	static report(
		error: Error | unknown,
		context?: Record<string, unknown>,
		options?: {
			rethrow?: boolean;
			defaultMessage?: string;
		},
	): OperationError {
		const operationError = ErrorReporter.toOperationError(
			error,
			context,
			options?.defaultMessage,
		);

		// Log the error
		logger.error(operationError.message, {
			code: operationError.code,
			context: operationError.context,
			stack: operationError.stack,
		});

		// Optionally rethrow
		if (options?.rethrow) {
			throw operationError;
		}

		return operationError;
	}

	/**
	 * Report a non-critical error as a warning
	 */
	static warn(
		error: Error | unknown,
		context?: Record<string, unknown>,
		defaultMessage?: string,
	): void {
		const message = ErrorReporter.extractMessage(error, defaultMessage);
		logger.warn(message, {
			...context,
			error: error instanceof Error ? error.stack : String(error),
		});
	}

	/**
	 * Convert any error to an OperationError
	 */
	private static toOperationError(
		error: Error | unknown,
		context?: Record<string, unknown>,
		defaultMessage?: string,
	): OperationError {
		// If already an OperationError, merge context and return
		if (error instanceof OperationError) {
			return new OperationError(error.message, error.code, {
				...error.context,
				...context,
			});
		}

		// If a regular Error, convert it
		if (error instanceof Error) {
			const opError = new OperationError(
				error.message,
				"UNKNOWN_ERROR",
				context,
			);
			opError.stack = error.stack;
			return opError;
		}

		// Unknown error type
		return new OperationError(
			defaultMessage || "An unknown error occurred",
			"UNKNOWN_ERROR",
			{
				...context,
				originalError: String(error),
			},
		);
	}

	/**
	 * Extract error message from various error types
	 */
	private static extractMessage(
		error: Error | unknown,
		defaultMessage = "Unknown error",
	): string {
		if (error instanceof Error) {
			return error.message;
		}
		if (typeof error === "string") {
			return error;
		}
		return defaultMessage;
	}

	/**
	 * Create a safe error response for API returns
	 */
	static createErrorResponse(
		error: Error | unknown,
		context?: Record<string, unknown>,
	): {
		success: false;
		error: {
			message: string;
			code: string;
			timestamp: string;
			context?: Record<string, unknown>;
		};
	} {
		const operationError = ErrorReporter.toOperationError(error, context);

		return {
			success: false,
			error: {
				message: operationError.message,
				code: operationError.code,
				timestamp: operationError.timestamp.toISOString(),
				...(operationError.context && { context: operationError.context }),
			},
		};
	}

	/**
	 * Create a full error response with standard fields
	 */
	static createFullErrorResponse<T = unknown>(
		error: Error | unknown,
		baseResponse: {
			sessionId: string;
			status?: string;
			recommendations?: string[];
			artifacts?: T[];
		},
	): {
		success: false;
		sessionId: string;
		status: string;
		message: string;
		recommendations: string[];
		artifacts: T[];
	} {
		const operationError = ErrorReporter.toOperationError(error);

		return {
			success: false,
			sessionId: baseResponse.sessionId,
			status: baseResponse.status || "error",
			message: operationError.message,
			recommendations: baseResponse.recommendations || [
				"Check request parameters and try again",
			],
			artifacts: (baseResponse.artifacts || []) as T[],
		};
	}
}
