/**
 * Testing Framework — shared types.
 */
import { z } from "zod";

export const TestingActionEnum = z.enum([
	"suggest",
	"enhance",
	"coverage",
	"workflow",
]);

export type TestingAction = z.infer<typeof TestingActionEnum>;

export const TestingInputSchema = z.object({
	action: TestingActionEnum.describe("Testing action"),
	projectPath: z.string().optional().describe("Path to project root"),
	language: z.string().optional().describe("Programming language"),
	framework: z.string().optional().describe("Testing framework"),
	currentCoverage: z
		.object({
			lines: z.number().min(0).max(100).optional(),
			branches: z.number().min(0).max(100).optional(),
			functions: z.number().min(0).max(100).optional(),
			statements: z.number().min(0).max(100).optional(),
		})
		.optional()
		.describe("Current coverage metrics"),
	targetCoverage: z
		.object({
			lines: z.number().min(0).max(100).optional(),
			branches: z.number().min(0).max(100).optional(),
			functions: z.number().min(0).max(100).optional(),
			statements: z.number().min(0).max(100).optional(),
		})
		.optional()
		.describe("Target coverage goals"),
	includeCodeExamples: z.boolean().optional().default(true),
	includeReferences: z.boolean().optional().default(true),
});

export type TestingInput = z.infer<typeof TestingInputSchema>;
