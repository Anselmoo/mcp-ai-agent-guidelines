/**
 * Code Quality Framework — action router.
 * Delegates to existing code quality tool implementations.
 */

import { cleanCodeScorer } from "../../tools/clean-code-scorer.js";
import { codeHygieneAnalyzer } from "../../tools/code-hygiene-analyzer.js";
import { iterativeCoverageEnhancer } from "../../tools/iterative-coverage-enhancer.js";
import { semanticCodeAnalyzer } from "../../tools/semantic-code-analyzer.js";
import type { CodeQualityInput } from "./types.js";

export async function routeCodeQualityAction(
	input: CodeQualityInput,
): Promise<unknown> {
	switch (input.action) {
		case "score":
			return cleanCodeScorer({
				codeContent: input.codeContent,
				projectPath: input.projectPath,
				language: input.language,
				framework: input.framework,
				coverageMetrics: input.coverageMetrics,
				includeReferences: input.includeReferences,
				includeMetadata: input.includeMetadata,
			});

		case "hygiene":
			return codeHygieneAnalyzer({
				codeContent: input.codeContent ?? "",
				language: input.language ?? "typescript",
				framework: input.framework,
				includeReferences: input.includeReferences,
			});

		case "coverage":
			return iterativeCoverageEnhancer({
				projectPath: input.projectPath,
				language: input.language,
				framework: input.framework,
				currentCoverage: input.coverageMetrics,
				analyzeCoverageGaps: true,
				generateTestSuggestions: true,
				includeReferences: input.includeReferences,
			});

		case "semantic":
			return semanticCodeAnalyzer({
				codeContent: input.codeContent ?? "",
				language: input.language,
				analysisType: "all",
				includeReferences: input.includeReferences,
				includeMetadata: input.includeMetadata,
			});

		default:
			throw new Error(
				`Unknown code-quality action: ${(input as CodeQualityInput).action}`,
			);
	}
}
