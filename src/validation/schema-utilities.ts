/**
 * Schema utilities: Zod ↔ JSON Schema conversion and enhanced error formatting.
 *
 * Integrates three packages:
 *   - `zod-to-json-schema`   — convert any Zod schema to a JSON Schema object
 *   - `zod-validation-error` — produce human-readable Zod parse-error messages
 *   - `json-schema-to-ts`    — derive static TypeScript types from JSON Schema
 */

import type { FromSchema } from "json-schema-to-ts";
import type { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { fromZodError, fromZodIssue } from "zod-validation-error";

// ---------------------------------------------------------------------------
// Re-exports so consumers need only import from this module
// ---------------------------------------------------------------------------

export type { FromSchema };
export { fromZodError, fromZodIssue };

// ---------------------------------------------------------------------------
// JSON Schema conversion
// ---------------------------------------------------------------------------

export type JsonSchemaObject = Record<string, unknown>;

/**
 * Convert a Zod schema to a JSON Schema 7-compatible object.
 *
 * @param schema      The Zod schema to convert
 * @param name        Optional `$id` / `title` for the generated schema
 */
export function toJsonSchema(
	schema: z.ZodTypeAny,
	name?: string,
): JsonSchemaObject {
	return zodToJsonSchema(schema, {
		name,
		target: "jsonSchema7",
	}) as JsonSchemaObject;
}

// ---------------------------------------------------------------------------
// Enhanced validation helpers
// ---------------------------------------------------------------------------

export interface ParseSuccess<T> {
	success: true;
	data: T;
}

export interface ParseFailure {
	success: false;
	message: string;
	issues: Array<{ path: string; message: string }>;
}

export type ParseOutcome<T> = ParseSuccess<T> | ParseFailure;

/**
 * Parse `input` through `schema`, returning a typed outcome with a
 * human-readable error message on failure (via `zod-validation-error`).
 */
export function safeParse<T>(
	schema: z.ZodSchema<T>,
	input: unknown,
): ParseOutcome<T> {
	const result = schema.safeParse(input);

	if (result.success) {
		return { success: true, data: result.data };
	}

	const validationError = fromZodError(result.error, {
		prefix: null,
		prefixSeparator: "",
		issueSeparator: "; ",
	});

	const issues = result.error.issues.map((issue) => ({
		path: issue.path.map(String).join(".") || "(root)",
		message: issue.message,
	}));

	return {
		success: false,
		message: validationError.message,
		issues,
	};
}

/**
 * Parse `input` through `schema` or throw a readable error.
 *
 * The error thrown is an instance of `ZodValidationError` (from the
 * `zod-validation-error` package) with a clean, end-user–facing message.
 */
export function parseOrThrow<T>(schema: z.ZodSchema<T>, input: unknown): T {
	const result = schema.safeParse(input);
	if (result.success) return result.data;
	throw fromZodError(result.error);
}

// ---------------------------------------------------------------------------
// Utility: extract field descriptions from a Zod schema
// ---------------------------------------------------------------------------

/**
 * Extract a flat map of `fieldPath → description` from a Zod object schema.
 * Only processes top-level fields; nested objects are represented as their
 * full JSON Schema sub-object.
 */
export function extractFieldDescriptions(
	schema: z.ZodObject<z.ZodRawShape>,
): Record<string, string> {
	const result: Record<string, string> = {};
	const jsonSchema = toJsonSchema(schema) as {
		properties?: Record<string, { description?: string }>;
	};

	const properties = jsonSchema.properties ?? {};
	for (const [key, value] of Object.entries(properties)) {
		if (value.description) {
			result[key] = value.description;
		}
	}

	return result;
}
