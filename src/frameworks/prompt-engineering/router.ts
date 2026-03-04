/**
 * Prompt Engineering Framework — action router.
 * Delegates to existing prompt tool implementations.
 */

import { hierarchicalPromptBuilder } from "../../tools/prompt/hierarchical-prompt-builder.js";
import { hierarchyLevelSelector } from "../../tools/prompt/hierarchy-level-selector.js";
import { promptChainingBuilder } from "../../tools/prompt/prompt-chaining-builder.js";
import { promptFlowBuilder } from "../../tools/prompt/prompt-flow-builder.js";
import { promptHierarchy } from "../../tools/prompt/prompt-hierarchy.js";
import type { PromptEngineeringInput } from "./types.js";

export async function routePromptEngineeringAction(
	input: PromptEngineeringInput,
): Promise<unknown> {
	switch (input.action) {
		case "build":
			return hierarchicalPromptBuilder({
				context: input.context,
				goal: input.goal,
				requirements: input.requirements,
				techniques: input.techniques,
				includeReferences: input.includeReferences,
				includeMetadata: input.includeMetadata,
			});

		case "evaluate":
			return promptHierarchy({
				mode: "evaluate",
				promptText: input.promptText,
				context: input.context,
			});

		case "select-level":
			return hierarchyLevelSelector({
				taskDescription: input.taskDescription,
			});

		case "chain":
			return promptChainingBuilder({
				chainName: input.goal ?? "prompt-chain",
				steps: [],
				context: input.context,
			});

		case "flow":
			return promptFlowBuilder({
				flowName: input.goal ?? "prompt-flow",
				nodes: [],
				entryPoint: "start",
			});

		default:
			throw new Error(
				`Unknown prompt-engineering action: ${(input as PromptEngineeringInput).action}`,
			);
	}
}
