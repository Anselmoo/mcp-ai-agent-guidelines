/**
 * Semantic Analyzer - Main Analysis Module
 *
 * Coordinates all analysis services
 */

import {
	analyzeStructure,
	detectLanguage,
	detectPatterns,
	extractDependencies,
	extractSymbols,
} from "./services/index.js";
import type { AnalysisResult, AnalysisType } from "./types/index.js";

/**
 * Perform comprehensive code analysis
 */
export function analyzeCode(
	code: string,
	language: string,
	analysisType: AnalysisType,
): AnalysisResult {
	const result: AnalysisResult = {};

	if (analysisType === "symbols" || analysisType === "all") {
		result.symbols = extractSymbols(code, language);
	}

	if (analysisType === "structure" || analysisType === "all") {
		result.structure = analyzeStructure(code, language);
	}

	if (analysisType === "dependencies" || analysisType === "all") {
		result.dependencies = extractDependencies(code, language);
	}

	if (analysisType === "patterns" || analysisType === "all") {
		result.patterns = detectPatterns(code, language);
	}

	return result;
}

/**
 * Auto-detect language and analyze code
 */
export function analyzeCodeAuto(
	code: string,
	analysisType: AnalysisType = "all",
): AnalysisResult & { language: string } {
	const language = detectLanguage(code);
	const analysis = analyzeCode(code, language, analysisType);

	return {
		...analysis,
		language,
	};
}
