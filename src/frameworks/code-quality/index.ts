/**
 * Code Quality Framework — unified entry point (T-040).
 *
 * Consolidates:
 * - clean-code-scorer (score)
 * - code-hygiene-analyzer (hygiene)
 * - iterative-coverage-enhancer (coverage)
 * - semantic-code-analyzer (semantic)
 */

import type { FrameworkDefinition } from "../types.js";
import { routeCodeQualityAction } from "./router.js";
import { CodeQualityInputSchema } from "./types.js";

export const codeQualityFramework: FrameworkDefinition = {
	name: "code-quality",
	description:
		"Code quality analysis: quality scoring, hygiene checks, coverage gap detection, and semantic analysis.",
	version: "1.0.0",
	actions: ["score", "hygiene", "coverage", "semantic"],
	schema: CodeQualityInputSchema,

	async execute(input: unknown) {
		const validated = CodeQualityInputSchema.parse(input);
		return routeCodeQualityAction(validated);
	},
};

export { type CodeQualityInput, CodeQualityInputSchema } from "./types.js";
