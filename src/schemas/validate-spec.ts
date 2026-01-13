/**
 * Validation schema for validate-spec tool
 *
 * @module schemas/validate-spec
 */

import { z } from "zod";

/**
 * Schema for validate-spec tool input
 */
export const validateSpecSchema = z.object({
	/** The spec.md content to validate */
	specContent: z.string().describe("The spec.md content to validate"),

	/** Path to CONSTITUTION.md file */
	constitutionPath: z
		.string()
		.optional()
		.describe("Path to CONSTITUTION.md file"),

	/** CONSTITUTION.md content directly */
	constitutionContent: z
		.string()
		.optional()
		.describe("CONSTITUTION.md content directly"),

	/** Output format for validation results */
	outputFormat: z
		.enum(["json", "markdown", "summary"])
		.default("markdown")
		.describe("Output format for validation results"),

	/** Whether to include recommendations in the output */
	includeRecommendations: z
		.boolean()
		.default(true)
		.describe("Whether to include recommendations in the output"),
});

/**
 * TypeScript type inferred from the validation schema
 */
export type ValidateSpecRequest = z.infer<typeof validateSpecSchema>;
