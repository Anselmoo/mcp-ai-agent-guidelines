/**
 * Standardized error responses and handling patterns.
 *
 * Provides consistent error boundaries, recovery mechanisms, and
 * improved debugging information across all skills.
 */

import { toErrorMessage } from "../infrastructure/object-utilities.js";
import { calculateExponentialBackoffDelay } from "../infrastructure/retry-utilities.js";

export interface ErrorContext {
	skillId?: string;
	instructionId?: string;
	modelId?: string;
	sessionId?: string;
	timestamp: string;
	requestHash?: string;
	inputSample?: string; // First 100 chars for debugging
	stackTrace?: string;
	retryCount?: number;
	recoveryAction?: string;
}

export interface StandardError {
	code: string;
	message: string;
	details?: string;
	context: ErrorContext;
	recoverable: boolean;
	suggestedAction?: string;
	relatedDocs?: string[];
}

export type ErrorCategory =
	| "validation"
	| "execution"
	| "timeout"
	| "model"
	| "network"
	| "authorization"
	| "rate_limit"
	| "resource"
	| "configuration"
	| "internal";

export class SkillExecutionError extends Error {
	public readonly category: ErrorCategory;
	public readonly context: ErrorContext;
	public readonly recoverable: boolean;
	public readonly suggestedAction?: string;
	public readonly errorCode: string;

	constructor(
		category: ErrorCategory,
		message: string,
		context: ErrorContext,
		recoverable = true,
		suggestedAction?: string,
	) {
		super(message);
		this.name = "SkillExecutionError";
		this.category = category;
		this.context = context;
		this.recoverable = recoverable;
		this.suggestedAction = suggestedAction;
		this.errorCode = `${category.toUpperCase()}_${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

		// Capture stack trace
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, SkillExecutionError);
		}
	}

	toStandardError(): StandardError {
		return {
			code: this.errorCode,
			message: this.message,
			details: this.stack,
			context: this.context,
			recoverable: this.recoverable,
			suggestedAction: this.suggestedAction,
		};
	}
}

export class ValidationError extends SkillExecutionError {
	constructor(message: string, context: ErrorContext, field?: string) {
		const enhancedMessage = field ? `${field}: ${message}` : message;
		const action =
			"Review input parameters and ensure all required fields are provided with valid values.";
		super("validation", enhancedMessage, context, true, action);
	}
}

export class ModelExecutionError extends SkillExecutionError {
	constructor(message: string, context: ErrorContext, modelId: string) {
		const enhancedContext = { ...context, modelId };
		const action =
			"Try again with a different model or check model availability.";
		super("model", message, enhancedContext, true, action);
	}
}

export class TimeoutError extends SkillExecutionError {
	constructor(timeout: number, context: ErrorContext) {
		const message = `Operation timed out after ${timeout}ms`;
		const action =
			"Increase timeout or simplify the request to reduce processing time.";
		super("timeout", message, context, true, action);
	}
}

export class AuthorizationError extends SkillExecutionError {
	constructor(operation: string, context: ErrorContext) {
		const message = `Unauthorized to perform: ${operation}`;
		const action = "Check permissions or API keys for the requested operation.";
		super("authorization", message, context, false, action);
	}
}

export class ResourceError extends SkillExecutionError {
	constructor(resource: string, context: ErrorContext) {
		const message = `Resource limit exceeded: ${resource}`;
		const action = "Reduce resource usage or increase limits if available.";
		super("resource", message, context, true, action);
	}
}

export class DependencyCycleError extends SkillExecutionError {
	public readonly cyclePath: string[];

	constructor(cyclePath: string[], context: ErrorContext) {
		const normalizedCyclePath = [...cyclePath];
		const message =
			normalizedCyclePath.length > 0
				? `Dependency cycle detected: ${normalizedCyclePath.join(" -> ")}`
				: "Dependency cycle detected";
		super(
			"execution",
			message,
			context,
			false,
			"Remove or break the cycle before retrying the workflow.",
		);
		this.cyclePath = normalizedCyclePath;
	}
}

export class SessionDataError extends SkillExecutionError {
	constructor(message: string, context: ErrorContext, recoverable = false) {
		super(
			"resource",
			message,
			context,
			recoverable,
			"Repair or replace the affected session data before retrying.",
		);
	}
}

type DomainErrorOptions = {
	defaultCategory?: ErrorCategory;
	recoverable?: boolean;
	suggestedAction?: string;
};

export function toDomainError(
	error: unknown,
	context: ErrorContext,
	options: DomainErrorOptions = {},
): SkillExecutionError {
	if (error instanceof SkillExecutionError) {
		return error;
	}

	const message = toErrorMessage(error);
	const category = options.defaultCategory ?? "execution";
	return new SkillExecutionError(
		category,
		message,
		context,
		options.recoverable ?? true,
		options.suggestedAction,
	);
}

/**
 * Error boundary wrapper for skill execution
 */
export async function withErrorBoundary<T>(
	operation: () => Promise<T>,
	context: Partial<ErrorContext>,
): Promise<
	{ success: true; data: T } | { success: false; error: StandardError }
> {
	const fullContext: ErrorContext = {
		timestamp: new Date().toISOString(),
		retryCount: 0,
		...context,
	};

	try {
		const data = await operation();
		return { success: true, data };
	} catch (error) {
		let standardError: StandardError;

		if (error instanceof SkillExecutionError) {
			standardError = error.toStandardError();
		} else {
			// Convert unknown errors to standard format
			const message = toErrorMessage(error);
			const details = error instanceof Error ? error.stack : undefined;

			standardError = {
				code: `INTERNAL_${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
				message: `Unexpected error: ${message}`,
				details,
				context: fullContext,
				recoverable: true,
				suggestedAction:
					"Try the operation again or contact support if the issue persists.",
			};
		}

		return { success: false, error: standardError };
	}
}

/**
 * Retry wrapper with exponential backoff
 */
export async function withRetry<T>(
	operation: () => Promise<T>,
	context: Partial<ErrorContext>,
	maxRetries = 3,
	baseDelayMs = 1000,
): Promise<T> {
	let lastError: unknown;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			return await operation();
		} catch (error) {
			lastError = error;

			// Don't retry non-recoverable errors
			if (error instanceof SkillExecutionError && !error.recoverable) {
				throw error;
			}

			// Don't retry on final attempt
			if (attempt === maxRetries - 1) {
				break;
			}

			const delay = calculateExponentialBackoffDelay(baseDelayMs, attempt, {
				jitterMs: 1000,
			});
			await new Promise((resolve) => setTimeout(resolve, delay));

			console.warn(
				`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`,
			);
		}
	}

	// Enhance final error with retry context
	if (lastError instanceof SkillExecutionError) {
		lastError.context.retryCount = maxRetries;
		throw lastError;
	}

	const errorMessage =
		lastError instanceof Error ? lastError.message : String(lastError);
	throw new SkillExecutionError(
		"execution",
		`Operation failed after ${maxRetries} retries: ${errorMessage}`,
		{
			...context,
			timestamp: new Date().toISOString(),
			retryCount: maxRetries,
			recoveryAction: "max_retries_exceeded",
		},
		false,
		"The operation failed repeatedly. Check logs and try again later.",
	);
}

/**
 * Input sanitization utilities
 */
export const InputSanitizer: {
	MAX_STRING_LENGTH: number;
	DANGEROUS_PATTERNS: RegExp[];
	sanitizeString: (input: string, maxLength?: number) => string;
	sanitizeFilePath: (path: string) => string;
	sanitizeUrl: (url: string) => string;
} = {
	MAX_STRING_LENGTH: 10000,
	DANGEROUS_PATTERNS: [
		/\.\./g, // Path traversal
		/\/tmp\//g, // Temp directory access
		/<script/gi, // Script injection
		/javascript:/gi, // JavaScript URLs
		/data:.*base64/gi, // Data URLs with base64
	],

	sanitizeString(
		input: string,
		maxLength = InputSanitizer.MAX_STRING_LENGTH,
	): string {
		if (typeof input !== "string") {
			throw new ValidationError("Input must be a string", {
				timestamp: new Date().toISOString(),
			});
		}

		if (input.length > maxLength) {
			throw new ValidationError(
				`Input too long (${input.length} > ${maxLength} characters)`,
				{ timestamp: new Date().toISOString() },
			);
		}

		// Check for dangerous patterns
		for (const pattern of InputSanitizer.DANGEROUS_PATTERNS) {
			if (pattern.test(input)) {
				throw new ValidationError(
					`Input contains potentially dangerous pattern: ${pattern}`,
					{ timestamp: new Date().toISOString() },
				);
			}
		}

		// Basic XSS prevention
		return input
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;")
			.replace(/'/g, "&#x27;");
	},

	sanitizeFilePath(path: string): string {
		const sanitized = InputSanitizer.sanitizeString(path);

		// Additional file path validation
		if (sanitized.includes("..")) {
			throw new ValidationError(
				"File path cannot contain '..' (directory traversal)",
				{ timestamp: new Date().toISOString() },
			);
		}

		if (sanitized.startsWith("/tmp/")) {
			throw new ValidationError("Access to /tmp directory is not allowed", {
				timestamp: new Date().toISOString(),
			});
		}

		return sanitized;
	},

	sanitizeUrl(url: string): string {
		const sanitized = InputSanitizer.sanitizeString(url);

		try {
			const parsed = new URL(sanitized);

			// Only allow safe protocols
			const allowedProtocols = ["http:", "https:", "ftp:"];
			if (!allowedProtocols.includes(parsed.protocol)) {
				throw new ValidationError(
					`URL protocol '${parsed.protocol}' is not allowed`,
					{ timestamp: new Date().toISOString() },
				);
			}

			return parsed.toString();
		} catch (error) {
			throw new ValidationError(
				`Invalid URL format: ${toErrorMessage(error)}`,
				{ timestamp: new Date().toISOString() },
			);
		}
	},
};

/**
 * Format error for user display
 */
export function formatErrorForDisplay(error: StandardError): string {
	const contextInfo = [
		error.context.skillId && `Skill: ${error.context.skillId}`,
		error.context.instructionId &&
			`Instruction: ${error.context.instructionId}`,
		error.context.modelId && `Model: ${error.context.modelId}`,
		error.context.retryCount && `Retries: ${error.context.retryCount}`,
	]
		.filter(Boolean)
		.join(" | ");

	const sections = [
		`**Error:** ${error.message}`,
		contextInfo && `**Context:** ${contextInfo}`,
		error.suggestedAction && `**Suggestion:** ${error.suggestedAction}`,
		`**Error Code:** ${error.code}`,
		error.recoverable
			? "🔄 This error may be temporary - you can try again."
			: "❌ This error requires intervention to resolve.",
	].filter(Boolean);

	return sections.join("\n\n");
}

/**
 * Create error context from current execution state
 */
export function createErrorContext(
	skillId?: string,
	instructionId?: string,
	modelId?: string,
	sessionId?: string,
	inputSample?: string,
): ErrorContext {
	return {
		skillId,
		instructionId,
		modelId,
		sessionId,
		timestamp: new Date().toISOString(),
		inputSample: inputSample?.substring(0, 100),
	};
}
