import { ErrorCode } from "./error-codes.js";
import { McpToolError } from "./errors.js";

export function validationError(
	message: string,
	context?: Record<string, unknown>,
): McpToolError {
	return new McpToolError(ErrorCode.VALIDATION_FAILED, message, context);
}

export function missingRequiredError(
	fieldName: string,
	context?: Record<string, unknown>,
): McpToolError {
	return new McpToolError(
		ErrorCode.MISSING_REQUIRED_FIELD,
		`Missing required field: ${fieldName}`,
		{ fieldName, ...context },
	);
}

export function sessionNotFoundError(sessionId: string): McpToolError {
	return new McpToolError(
		ErrorCode.SESSION_NOT_FOUND,
		`Session not found: ${sessionId}`,
		{ sessionId },
	);
}

export function fileSystemError(
	operation: "read" | "write",
	path: string,
	cause?: Error,
): McpToolError {
	const code =
		operation === "read"
			? ErrorCode.FILE_READ_ERROR
			: ErrorCode.FILE_WRITE_ERROR;

	return new McpToolError(
		code,
		`File ${operation} failed: ${path}`,
		{ path },
		cause,
	);
}

export function schemaViolationError(
	zodError: unknown,
	context?: Record<string, unknown>,
): McpToolError {
	return new McpToolError(
		ErrorCode.SCHEMA_VIOLATION,
		"Schema validation failed",
		{ zodError, ...context },
	);
}

export function phaseTransitionError(
	currentPhase: string,
	targetPhase: string,
	reason: string,
): McpToolError {
	return new McpToolError(
		ErrorCode.INVALID_PHASE_TRANSITION,
		`Cannot transition from ${currentPhase} to ${targetPhase}: ${reason}`,
		{ currentPhase, targetPhase, reason },
	);
}
