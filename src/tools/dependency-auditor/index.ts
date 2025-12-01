/**
 * Multi-language Dependency Auditor Module
 *
 * Exports parsers, types, and utilities for auditing dependencies
 * across multiple programming languages and package ecosystems.
 */

// Export parsers and utilities from modular parser files
export {
	BaseParser,
	CppVcpkgParser,
	DotNetCsprojParser,
	detectParser,
	GoModParser,
	getAllParsers,
	getParserForFileType,
	JavaScriptParser,
	JsParser,
	LuaRockspecParser,
	PATTERNS,
	PyProjectParser,
	PyRequirementsParser,
	PythonPyprojectParser,
	PythonRequirementsParser,
	RubyGemfileParser,
	RustCargoParser,
	TsConfigParser,
	TypeScriptConfigParser,
	UvLockParser,
	YarnLockParser,
} from "./parsers/index.js";

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
