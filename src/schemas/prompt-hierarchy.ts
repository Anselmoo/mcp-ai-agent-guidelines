import { z } from "zod";

export const promptHierarchySchema = z.object({
	mode: z
		.enum(["build", "select", "evaluate"])
		.describe(
			"Operation mode: 'build' creates prompts, 'select' recommends hierarchy level, 'evaluate' scores prompts",
		),
	context: z
		.string()
		.describe("Broad context or domain for the prompt")
		.optional(),
	goal: z
		.string()
		.describe("Specific goal or objective for the prompt")
		.optional(),
	requirements: z
		.array(z.string())
		.describe("Detailed requirements and constraints")
		.optional(),
	taskDescription: z
		.string()
		.describe("Description of the task the prompt will address")
		.optional(),
	taskComplexity: z
		.enum(["simple", "moderate", "complex"])
		.describe("Complexity of the task")
		.optional(),
	agentCapability: z
		.enum(["novice", "intermediate", "advanced"])
		.describe("Agent's capability level")
		.optional(),
	promptToEvaluate: z
		.string()
		.describe("The prompt text to evaluate")
		.optional(),
	evaluationCriteria: z
		.array(z.string())
		.describe("Specific criteria for evaluating the prompt")
		.optional(),
});

export type PromptHierarchySchema = z.infer<typeof promptHierarchySchema>;
