/**
 * Code Quality Framework — shared types.
 */
import { z } from "zod";

export const CodeQualityActionEnum = z.enum([
	"score",
	"hygiene",
	"coverage",
	"semantic",
]);

export type CodeQualityAction = z.infer<typeof CodeQualityActionEnum>;

export const CodeQualityInputSchema = z.object({
	action: CodeQualityActionEnum.describe("Quality analysis action"),
	codeContent: z.string().optional().describe("Code content to analyze"),
	projectPath: z.string().optional().describe("Path to project root"),
	language: z.string().optional().describe("Programming language"),
	framework: z.string().optional().describe("Framework or tech stack"),
	coverageMetrics: z
		.object({
			lines: z.number().min(0).max(100).optional(),
			branches: z.number().min(0).max(100).optional(),
			functions: z.number().min(0).max(100).optional(),
			statements: z.number().min(0).max(100).optional(),
		})
		.optional()
		.describe("Current coverage percentages"),
	includeReferences: z.boolean().optional().default(true),
	includeMetadata: z.boolean().optional().default(true),
});

export type CodeQualityInput = z.infer<typeof CodeQualityInputSchema>;
