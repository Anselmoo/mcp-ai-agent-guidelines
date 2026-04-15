import type { ToolInputSchema } from "../../contracts/generated.js";
import {
	buildZodSchema,
	type InstructionZodSchema,
} from "../../schemas/zod-validator-builder.js";
import {
	createErrorContext,
	ValidationError,
} from "../../validation/error-handling.js";

export interface ToolDefinitionWithInputSchema {
	name: string;
	description?: string;
	inputSchema: ToolInputSchema;
	annotations?: Record<string, unknown>;
	[key: string]: unknown;
}

function formatValidationIssues(
	toolName: string,
	validator: InstructionZodSchema,
	args: unknown,
) {
	const parseResult = validator.safeParse(args);
	if (parseResult.success) {
		return parseResult.data;
	}

	const issues = parseResult.error.issues
		.map((issue) =>
			issue.path.length > 0
				? `"${issue.path.join(".")}" — ${issue.message}`
				: issue.message,
		)
		.join("; ");

	throw new ValidationError(
		`Invalid input for \`${toolName}\`: ${issues}`,
		createErrorContext(toolName),
	);
}

export function buildToolValidators(
	toolDefinitions: readonly ToolDefinitionWithInputSchema[],
) {
	return new Map<string, InstructionZodSchema>(
		toolDefinitions.map((toolDefinition) => [
			toolDefinition.name,
			buildZodSchema(toolDefinition.inputSchema),
		]),
	);
}

export function validateToolArguments(
	toolName: string,
	args: unknown,
	validators: ReadonlyMap<string, InstructionZodSchema>,
) {
	const validator = validators.get(toolName);
	if (!validator) {
		throw new ValidationError(
			`No validator registered for tool: ${toolName}`,
			createErrorContext(toolName),
		);
	}

	return formatValidationIssues(toolName, validator, args);
}
