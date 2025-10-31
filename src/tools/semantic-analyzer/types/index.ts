/**
 * Type Definitions for Semantic Code Analyzer
 */

export interface SymbolInfo {
	name: string;
	type: "function" | "class" | "variable" | "interface" | "type" | "constant";
	line?: number;
	scope?: string;
}

export interface DependencyInfo {
	type: "import" | "require" | "include";
	module: string;
	items?: string[];
}

export interface StructureInfo {
	type: string;
	description: string;
	elements: string[];
}

export interface PatternInfo {
	pattern: string;
	description: string;
	locations: string[];
}

export interface AnalysisResult {
	symbols?: SymbolInfo[];
	structure?: StructureInfo[];
	dependencies?: DependencyInfo[];
	patterns?: PatternInfo[];
}

export type AnalysisType =
	| "symbols"
	| "structure"
	| "dependencies"
	| "patterns"
	| "all";

/**
 * Language analyzer interface for extensibility
 */
export interface LanguageAnalyzer {
	name: string;
	extensions: string[];
	detect: (code: string) => boolean;
	extractSymbols: (code: string) => SymbolInfo[];
	extractDependencies: (code: string) => DependencyInfo[];
}

/**
 * Pattern detector interface for extensibility
 */
export interface PatternDetector {
	name: string;
	description: string;
	detect: (code: string, language: string) => PatternInfo | null;
}

export interface SemanticAnalyzerConfig {
	enabledLanguages?: string[];
	enabledPatterns?: string[];
	customPatterns?: PatternDetector[];
	customLanguages?: LanguageAnalyzer[];
}
