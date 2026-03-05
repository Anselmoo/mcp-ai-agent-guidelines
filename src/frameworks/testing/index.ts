/**
 * Testing Framework — unified entry point (T-043).
 *
 * Consolidates:
 * - iterative-coverage-enhancer (suggest, enhance, coverage, workflow)
 */

import type { FrameworkDefinition } from "../types.js";
import { routeTestingAction } from "./router.js";
import { TestingInputSchema } from "./types.js";

export const testingFramework: FrameworkDefinition = {
	name: "testing",
	description:
		"Testing & coverage: test suggestion, coverage gap detection, TDD workflow, and CI threshold management.",
	version: "1.0.0",
	actions: ["suggest", "enhance", "coverage", "workflow"],
	schema: TestingInputSchema,

	async execute(input: unknown) {
		const validated = TestingInputSchema.parse(input);
		return routeTestingAction(validated);
	},
};

export { type TestingInput, TestingInputSchema } from "./types.js";
