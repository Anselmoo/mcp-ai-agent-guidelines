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
 * Session error for session-related issues
 */
export class SessionError extends Error {
	public readonly code: string;
	public readonly context?: Record<string, unknown>;
	public readonly timestamp: Date;

	constructor(message: string, context?: Record<string, unknown>) {
		super(message);
		this.name = "SessionError";
		this.code = "SESSION_ERROR";
		this.context = context;
		this.timestamp = new Date();

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, SessionError);
		}
	}
}

/**
 * Phase error for design phase workflow issues
 */
export class PhaseError extends Error {
	public readonly code: string;
	public readonly context?: Record<string, unknown>;
	public readonly timestamp: Date;

	constructor(message: string, context?: Record<string, unknown>) {
		super(message);
		this.name = "PhaseError";
		this.code = "PHASE_ERROR";
		this.context = context;
		this.timestamp = new Date();

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, PhaseError);
		}
	}
}

/**
 * Generation error for artifact generation failures
 */
export class GenerationError extends Error {
	public readonly code: string;
	public readonly context?: Record<string, unknown>;
	public readonly timestamp: Date;

	constructor(message: string, context?: Record<string, unknown>) {
		super(message);
		this.name = "GenerationError";
		this.code = "GENERATION_ERROR";
		this.context = context;
		this.timestamp = new Date();

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, GenerationError);
		}
	}
}

/**
 * Consistency error for consistency enforcement failures
 */
export class ConsistencyError extends Error {
	public readonly code: string;
	public readonly context?: Record<string, unknown>;
	public readonly timestamp: Date;

	constructor(message: string, context?: Record<string, unknown>) {
		super(message);
		this.name = "ConsistencyError";
		this.code = "CONSISTENCY_ERROR";
		this.context = context;
		this.timestamp = new Date();

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, ConsistencyError);
		}
	}
}

/**
 * Unknown error for unrecognized error types
 */
export class UnknownError extends Error {
	public readonly code: string;
	public readonly context?: Record<string, unknown>;
	public readonly timestamp: Date;

	constructor(message: string, context?: Record<string, unknown>) {
		super(message);
		this.name = "UnknownError";
		this.code = "UNKNOWN_ERROR";
		this.context = context;
		this.timestamp = new Date();

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, UnknownError);
		}
	}
}

/**
 * Type representing errors with standard structure
 */
export interface StandardError extends Error {
	code: string;
	context?: Record<string, unknown>;
	timestamp: Date;
}

/**
 * Type guard to check if an error has standard error properties
 */
function isStandardError(error: unknown): error is StandardError {
	return (
		error instanceof Error &&
		"code" in error &&
		typeof (error as { code: unknown }).code === "string" &&
		"timestamp" in error &&
		(error as { timestamp: unknown }).timestamp instanceof Date
	);
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
	): StandardError {
		const standardError = ErrorReporter.toStandardError(
			error,
			context,
			options?.defaultMessage,
		);

		// Log the error
		logger.error(standardError.message, {
			code: standardError.code,
			context: standardError.context,
			stack: standardError.stack,
		});

		// Optionally rethrow
		if (options?.rethrow) {
			throw standardError;
		}

		return standardError;
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
	 * Convert any error to a StandardError
	 */
	private static toStandardError(
		error: Error | unknown,
		context?: Record<string, unknown>,
		defaultMessage?: string,
	): StandardError {
		// If already a StandardError, preserve its type and merge context
		if (isStandardError(error)) {
			// If it already has all the context we need, return as-is
			if (!context || Object.keys(context).length === 0) {
				return error;
			}
			// Create a new error of the same type with merged context
			const ErrorConstructor = error.constructor as new (
				message: string,
				ctx?: Record<string, unknown>,
			) => StandardError;
			const newError = new ErrorConstructor(error.message, {
				...error.context,
				...context,
			});
			newError.stack = error.stack;
			return newError;
		}

		// If a regular Error, convert it with UNKNOWN_ERROR code
		if (error instanceof Error) {
			const unknownError = new UnknownError(error.message, {
				...context,
				originalError: error.name,
			});
			unknownError.stack = error.stack;
			return unknownError;
		}

		// Unknown error type
		return new UnknownError(defaultMessage || "An unknown error occurred", {
			...context,
			originalError: String(error),
		});
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
		const standardError = ErrorReporter.toStandardError(error, context);

		return {
			success: false,
			error: {
				message: standardError.message,
				code: standardError.code,
				timestamp: standardError.timestamp.toISOString(),
				...(standardError.context && { context: standardError.context }),
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
		const standardError = ErrorReporter.toStandardError(error);

		return {
			success: false,
			sessionId: baseResponse.sessionId,
			status: baseResponse.status || "error",
			message: standardError.message,
			recommendations: baseResponse.recommendations || [
				"Check request parameters and try again",
			],
			artifacts: (baseResponse.artifacts || []) as T[],
		};
	}
}
