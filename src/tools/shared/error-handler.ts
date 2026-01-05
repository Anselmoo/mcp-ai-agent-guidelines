import { ZodError } from "zod";
import { ErrorCode } from "./error-codes.js";
// biome-ignore lint/correctness/noUnusedImports: validationError import required by specification
import { schemaViolationError, validationError } from "./error-factory.js";
import { McpToolError } from "./errors.js";

export interface McpResponse {
	isError?: boolean;
	content: Array<{ type: "text"; text: string }>;
}

export function handleToolError(error: unknown): McpResponse {
	// Already an McpToolError - use directly
	if (error instanceof McpToolError) {
		return error.toResponse();
	}

	// ZodError - convert to schema violation
	if (error instanceof ZodError) {
		return schemaViolationError(error.errors).toResponse();
	}

	// Standard Error - detect type from message patterns
	if (error instanceof Error) {
		const mcpError = detectErrorType(error);
		return mcpError.toResponse();
	}

	// Unknown error type
	return new McpToolError(
		ErrorCode.INTERNAL_ERROR,
		"An unexpected error occurred",
		{ originalError: String(error) },
	).toResponse();
}

function detectErrorType(error: Error): McpToolError {
	const message = error.message.toLowerCase();

	if (message.includes("required") || message.includes("missing")) {
		return new McpToolError(ErrorCode.MISSING_REQUIRED_FIELD, error.message);
	}
	if (message.includes("invalid") || message.includes("validation")) {
		return new McpToolError(ErrorCode.VALIDATION_FAILED, error.message);
	}
	if (message.includes("session") && message.includes("not found")) {
		return new McpToolError(ErrorCode.SESSION_NOT_FOUND, error.message);
	}
	if (message.includes("enoent") || message.includes("file not found")) {
		return new McpToolError(ErrorCode.FILE_NOT_FOUND, error.message);
	}

	return new McpToolError(ErrorCode.INTERNAL_ERROR, error.message, {}, error);
}
