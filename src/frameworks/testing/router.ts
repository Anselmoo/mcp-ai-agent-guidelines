/**
 * Testing Framework — action router (T-043).
 */

import { iterativeCoverageEnhancer } from "../../tools/iterative-coverage-enhancer.js";
import type { TestingInput } from "./types.js";

export async function routeTestingAction(
	input: TestingInput,
): Promise<unknown> {
	switch (input.action) {
		case "suggest":
		case "enhance":
		case "coverage":
			return iterativeCoverageEnhancer({
				projectPath: input.projectPath,
				language: input.language,
				framework: input.framework,
				currentCoverage: input.currentCoverage,
				targetCoverage: input.targetCoverage,
				analyzeCoverageGaps: true,
				generateTestSuggestions: true,
				detectDeadCode: input.action === "enhance",
				includeCodeExamples: input.includeCodeExamples,
				includeReferences: input.includeReferences,
			});

		case "workflow":
			return iterativeCoverageEnhancer({
				projectPath: input.projectPath,
				language: input.language,
				framework: input.framework,
				currentCoverage: input.currentCoverage,
				targetCoverage: input.targetCoverage,
				analyzeCoverageGaps: true,
				generateCIActions: true,
				adaptThresholds: true,
				includeReferences: input.includeReferences,
			});

		default:
			throw new Error(
				`Unknown testing action: ${(input as TestingInput).action}`,
			);
	}
}
