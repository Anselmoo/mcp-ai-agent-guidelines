/**
 * Multi-language Dependency Auditor Module
 *
 * Exports parsers, types, and utilities for auditing dependencies
 * across multiple programming languages and package ecosystems.
 */

// Export parsers and utilities
export {
	CppVcpkgParser,
	detectParser,
	GoModParser,
	getAllParsers,
	getParserForFileType,
	JavaScriptParser,
	JsParser,
	LuaRockspecParser,
	PyProjectParser,
	PyRequirementsParser,
	PythonPyprojectParser,
	PythonRequirementsParser,
	RubyGemfileParser,
	RustCargoParser,
} from "./parsers.js";
// Export types
export type {
	AnalysisOptions,
	AnalysisResult,
	DependencyParser,
	DependencyType,
	DeprecatedPackageInfo,
	EcosystemType,
	Issue,
	IssueSeverity,
	IssueType,
	MultiFileAuditResult,
	PackageFileType,
	PackageInfo,
	ParseResult,
	ReferenceLink,
} from "./types.js";
