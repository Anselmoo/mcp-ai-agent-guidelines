/**
 * Semantic Analyzer - Main Module
 *
 * Provides modular, extensible semantic code analysis
 */

// Export main analyzer
export { analyzeCode, analyzeCodeAuto } from "./analyzer.js";
// Export formatters
export {
	buildDependenciesSection,
	buildPatternsSection,
	buildStructureSection,
	buildSymbolsSection,
	generateInsights,
	generateRecommendations,
} from "./formatters.js";

// Export services for advanced usage
export {
	analyzeStructure,
	detectLanguage,
	detectPatterns,
	extractDependencies,
	extractGoDependencies,
	extractJavaDependencies,
	extractJavaSymbols,
	extractPythonDependencies,
	extractPythonSymbols,
	extractRustDependencies,
	extractSymbols,
	extractTypeScriptDependencies,
	extractTypeScriptSymbols,
	LanguageRegistry,
	languageRegistry,
	PatternRegistry,
	patternRegistry,
} from "./services/index.js";
// Export types
export type {
	AnalysisResult,
	AnalysisType,
	DependencyInfo,
	LanguageAnalyzer,
	PatternDetector,
	PatternInfo,
	SemanticAnalyzerConfig,
	StructureInfo,
	SymbolInfo,
} from "./types/index.js";
