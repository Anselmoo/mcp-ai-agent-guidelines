/**
 * Prompt Optimization Framework (T-045).
 * Consolidates: memory-context-optimizer, hierarchy-level-selector, prompting-hierarchy-evaluator.
 */

import { z } from "zod";
import { memoryContextOptimizer } from "../../tools/memory-context-optimizer.js";
import { hierarchyLevelSelector } from "../../tools/prompt/hierarchy-level-selector.js";
import { promptingHierarchyEvaluator } from "../../tools/prompt/prompting-hierarchy-evaluator.js";
import type { FrameworkDefinition } from "../types.js";

const PromptOptimizationInputSchema = z.object({
	action: z
		.enum(["optimize", "select-level", "evaluate"])
		.describe("Prompt optimization action"),
	contextContent: z.string().optional().describe("Context content to optimize"),
	maxTokens: z
		.number()
		.optional()
		.default(8000)
		.describe("Maximum token budget"),
	cacheStrategy: z
		.enum(["aggressive", "conservative", "balanced"])
		.optional()
		.default("balanced"),
	taskDescription: z
		.string()
		.optional()
		.describe("Task description for level selection"),
	agentCapability: z
		.enum(["novice", "intermediate", "advanced", "expert"])
		.optional(),
	promptText: z.string().optional().describe("Prompt text to evaluate"),
	includeReferences: z.boolean().optional().default(true),
});

export const promptOptimizationFramework: FrameworkDefinition = {
	name: "prompt-optimization",
	description:
		"Prompt optimization: context/token optimization, hierarchy level selection, prompt quality evaluation.",
	version: "1.0.0",
	actions: ["optimize", "select-level", "evaluate"],
	schema: PromptOptimizationInputSchema,

	async execute(input: unknown) {
		const validated = PromptOptimizationInputSchema.parse(input);

		switch (validated.action) {
			case "optimize":
				return memoryContextOptimizer({
					contextContent: validated.contextContent ?? "",
					maxTokens: validated.maxTokens,
					cacheStrategy: validated.cacheStrategy,
					includeReferences: validated.includeReferences,
				});

			case "select-level":
				return hierarchyLevelSelector({
					taskDescription: validated.taskDescription,
					agentCapability: validated.agentCapability,
					includeReferences: validated.includeReferences,
				});

			case "evaluate":
				return promptingHierarchyEvaluator({
					promptText: validated.promptText ?? "",
					includeRecommendations: true,
					includeReferences: validated.includeReferences,
				});

			default:
				throw new Error(
					`Unknown prompt-optimization action: ${validated.action}`,
				);
		}
	},
};
