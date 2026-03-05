/**
 * Prompt Engineering Framework — shared types.
 */
import { z } from "zod";

export const PromptEngineeringActionEnum = z.enum([
	"build",
	"evaluate",
	"select-level",
	"chain",
	"flow",
]);

export type PromptEngineeringAction = z.infer<
	typeof PromptEngineeringActionEnum
>;

export const PromptEngineeringInputSchema = z.object({
	action: PromptEngineeringActionEnum.describe(
		"Prompt engineering action to perform",
	),
	context: z.string().optional().describe("Broad context or domain"),
	goal: z.string().optional().describe("Specific goal or objective"),
	requirements: z
		.array(z.string())
		.optional()
		.describe("Detailed requirements"),
	promptText: z.string().optional().describe("Prompt text to evaluate"),
	taskDescription: z
		.string()
		.optional()
		.describe("Task description for level selection"),
	techniques: z
		.array(
			z.enum([
				"zero-shot",
				"few-shot",
				"chain-of-thought",
				"self-consistency",
				"in-context-learning",
				"generate-knowledge",
				"prompt-chaining",
				"tree-of-thoughts",
				"meta-prompting",
				"rag",
				"react",
				"art",
			]),
		)
		.optional(),
	includeReferences: z.boolean().optional().default(true),
	includeMetadata: z.boolean().optional().default(true),
});

export type PromptEngineeringInput = z.infer<
	typeof PromptEngineeringInputSchema
>;
