/**
 * Prompt Engineering Framework — unified entry point.
 *
 * Consolidates all prompt building tools (T-039):
 * - hierarchical-prompt-builder
 * - prompt-hierarchy
 * - hierarchy-level-selector
 * - prompt-chaining-builder
 * - prompt-flow-builder
 */

import type { FrameworkDefinition } from "../types.js";
import { routePromptEngineeringAction } from "./router.js";
import { PromptEngineeringInputSchema } from "./types.js";

export const promptEngineeringFramework: FrameworkDefinition = {
	name: "prompt-engineering",
	description:
		"Unified prompt engineering: build, evaluate, select hierarchy levels, create chains and flows.",
	version: "1.0.0",
	actions: ["build", "evaluate", "select-level", "chain", "flow"],
	schema: PromptEngineeringInputSchema,

	async execute(input: unknown) {
		const validated = PromptEngineeringInputSchema.parse(input);
		return routePromptEngineeringAction(validated);
	},
};

export {
	type PromptEngineeringInput,
	PromptEngineeringInputSchema,
} from "./types.js";
