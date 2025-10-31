/**
 * Services Module - Barrel Export
 *
 * Exports all semantic analyzer services
 */

export {
	extractDependencies,
	extractGoDependencies,
	extractJavaDependencies,
	extractPythonDependencies,
	extractRustDependencies,
	extractTypeScriptDependencies,
} from "./dependency-extraction.js";
export {
	detectLanguage,
	LanguageRegistry,
	languageRegistry,
} from "./language-detection.js";
export {
	detectPatterns,
	PatternRegistry,
	patternRegistry,
} from "./pattern-detection.js";
export { analyzeStructure } from "./structure-analysis.js";
export {
	extractJavaSymbols,
	extractPythonSymbols,
	extractSymbols,
	extractTypeScriptSymbols,
} from "./symbol-extraction.js";
