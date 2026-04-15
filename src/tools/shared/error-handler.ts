/**
 * Shared MCP error formatting utilities.
 *
 * Uses `neverthrow` for Result-typed error propagation and `ts-pattern` for
 * exhaustive error-category matching so that every category maps to a
 * well-structured MCP error response.
 */

import { err, ok, type Result } from "neverthrow";
import { match } from "ts-pattern";
import type { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

// ---------------------------------------------------------------------------
// Error categories
// ---------------------------------------------------------------------------

export type McpErrorCategory =
	| "validation"
	| "execution"
	| "timeout"
	| "model"
	| "network"
	| "authorization"
	| "rate_limit"
	| "not_found"
	| "internal";

export interface McpErrorPayload {
	category: McpErrorCategory;
	code: string;
	message: string;
	details?: string;
	recoverable: boolean;
	suggestedAction?: string;
}

// ---------------------------------------------------------------------------
// Result type alias for MCP tool handlers
// ---------------------------------------------------------------------------

export type McpResult<T> = Result<T, McpErrorPayload>;

// ---------------------------------------------------------------------------
// Constructors
// ---------------------------------------------------------------------------

/** Wrap a successful value in an Ok result */
export function mcpOk<T>(value: T): McpResult<T> {
	return ok(value);
}

/** Wrap an error payload in an Err result */
export function mcpErr<T = never>(payload: McpErrorPayload): McpResult<T> {
	return err(payload);
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/**
 * Format a {@link McpErrorPayload} as a human-readable string.
 *
 * Uses `ts-pattern` for exhaustive category matching so that new categories
 * added in the future produce a compile-time error rather than a silent
 * fallthrough.
 */
export function formatMcpError(error: McpErrorPayload): string {
	const prefix = match(error.category)
		.with("validation", () => "❌ Validation error")
		.with("execution", () => "⚠️  Execution error")
		.with("timeout", () => "⏱  Timeout")
		.with("model", () => "🤖 Model error")
		.with("network", () => "🌐 Network error")
		.with("authorization", () => "🔒 Authorization error")
		.with("rate_limit", () => "🚦 Rate limit exceeded")
		.with("not_found", () => "🔍 Not found")
		.with("internal", () => "💥 Internal error")
		.exhaustive();

	const lines = [`${prefix} [${error.code}]: ${error.message}`];
	if (error.details) lines.push(`Details: ${error.details}`);
	if (error.suggestedAction) lines.push(`Suggestion: ${error.suggestedAction}`);
	if (error.recoverable)
		lines.push("(This error may be recoverable — retry is safe.)");

	return lines.join("\n");
}

/**
 * Produce an MCP-compatible tool error content block from a
 * {@link McpErrorPayload}.
 */
export function buildMcpErrorContent(error: McpErrorPayload): {
	isError: true;
	content: Array<{ type: "text"; text: string }>;
} {
	return {
		isError: true,
		content: [{ type: "text" as const, text: formatMcpError(error) }],
	};
}

// ---------------------------------------------------------------------------
// Category classifiers
// ---------------------------------------------------------------------------

/**
 * Classify an arbitrary thrown value as a {@link McpErrorPayload}.
 *
 * Uses `ts-pattern` to branch on the shape of the unknown value.
 */
export function classifyError(
	error: unknown,
	code = `ERR_${Date.now()}`,
): McpErrorPayload {
	return match(error)
		.when(
			(e): e is { name: "ZodError"; issues: unknown[] } =>
				typeof e === "object" &&
				e !== null &&
				(e as Record<string, unknown>).name === "ZodError",
			(e) => ({
				category: "validation" as McpErrorCategory,
				code,
				message: fromZodError(e as ZodError).message,
				recoverable: true,
				suggestedAction: "Fix the input and retry.",
			}),
		)
		.when(
			(e): e is { name: string; message: string } =>
				e instanceof Error && e.name === "AbortError",
			(e) => ({
				category: "timeout" as McpErrorCategory,
				code,
				message: e.message,
				recoverable: true,
				suggestedAction:
					"Retry with a shorter request or increase the timeout.",
			}),
		)
		.when(
			(e): e is Error => e instanceof Error,
			(e) => ({
				category: "execution" as McpErrorCategory,
				code,
				message: e.message,
				details: e.stack,
				recoverable: false,
			}),
		)
		.otherwise((e) => ({
			category: "internal" as McpErrorCategory,
			code,
			message: String(e),
			recoverable: false,
		}));
}

/**
 * Convenience: wrap an async operation, catching any thrown error and
 * converting it to a {@link McpResult}.
 */
export async function tryCatchMcp<T>(
	fn: () => Promise<T>,
	code?: string,
): Promise<McpResult<T>> {
	try {
		return mcpOk(await fn());
	} catch (e) {
		return mcpErr<T>(classifyError(e, code));
	}
}
