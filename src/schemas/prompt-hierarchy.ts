import { z } from "zod";

export const promptHierarchySchema = z.object({
	mode: z.enum(["build", "select", "evaluate"]),
	context: z.string().optional(),
	goal: z.string().optional(),
	requirements: z.array(z.string()).optional(),
	taskDescription: z.string().optional(),
	taskComplexity: z.enum(["simple", "moderate", "complex"]).optional(),
	agentCapability: z.enum(["novice", "intermediate", "advanced"]).optional(),
	promptToEvaluate: z.string().optional(),
	evaluationCriteria: z.array(z.string()).optional(),
});

export type PromptHierarchySchema = z.infer<typeof promptHierarchySchema>;
