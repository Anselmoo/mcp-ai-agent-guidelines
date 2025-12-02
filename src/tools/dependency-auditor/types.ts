/**
 * Common types for multi-language dependency auditing
 */

/**
 * Supported package file types for dependency auditing
 */
export type PackageFileType =
	| "package.json"
	| "requirements.txt"
	| "pyproject.toml"
	| "pipfile"
	| "go.mod"
	| "Cargo.toml"
	| "Gemfile"
	| "vcpkg.json"
	| "conanfile.txt"
	| "rockspec"
	| "csproj"
	| "uv.lock"
	| "yarn.lock"
	| "tsconfig.json"
	| "auto";

/**
 * Supported programming language ecosystems
 */
export type EcosystemType =
	| "javascript"
	| "typescript"
	| "python"
	| "go"
	| "rust"
	| "ruby"
	| "cpp"
	| "lua"
	| "dotnet";

/**
 * Dependency type classification
 */
export type DependencyType =
	| "dependencies"
	| "devDependencies"
	| "peerDependencies"
	| "optionalDependencies"
	| "buildDependencies";

/**
 * Issue severity levels
 */
export type IssueSeverity = "critical" | "high" | "moderate" | "low" | "info";

/**
 * Issue type classification
 */
export type IssueType =
	| "Unpinned Version"
	| "Pre-1.0 Version"
	| "Exact Version Pin"
	| "Deprecated Package"
	| "Known Vulnerabilities"
	| "Deprecated & Bundle Size"
	| "ESM Alternative Available"
	| "Bundle Size Concern"
	| "Outdated Pattern"
	| "Security Risk"
	| "Version Constraint Issue"
	| "Maintenance Concern";

/**
 * Package information common to all ecosystems
 */
export interface PackageInfo {
	name: string;
	version: string;
	type: DependencyType;
	ecosystem: EcosystemType;
	extras?: string[]; // For Python extras, Ruby groups, etc.
	source?: string; // git, registry, local path, etc.
}

/**
 * Issue detected during dependency analysis
 */
export interface Issue {
	package: string;
	version: string;
	type: IssueType | string;
	severity: IssueSeverity;
	description: string;
	recommendation?: string;
	ecosystem: EcosystemType;
	cveIds?: string[];
	references?: string[];
}

/**
 * Result from a parser
 */
export interface ParseResult {
	packages: PackageInfo[];
	projectName?: string;
	projectVersion?: string;
	ecosystem: EcosystemType;
	fileType: PackageFileType;
	errors?: string[];
}

/**
 * Result from analyzing dependencies
 */
export interface AnalysisResult {
	packages: PackageInfo[];
	issues: Issue[];
	recommendations: string[];
	ecosystem: EcosystemType;
	fileType: PackageFileType;
	projectName?: string;
	projectVersion?: string;
}

/**
 * Combined result for multi-file audits
 */
export interface MultiFileAuditResult {
	results: AnalysisResult[];
	totalPackages: number;
	totalIssues: number;
	summary: {
		critical: number;
		high: number;
		moderate: number;
		low: number;
		info: number;
	};
}

/**
 * Parser interface that all language parsers must implement
 */
export interface DependencyParser {
	/**
	 * Parse the file content and extract package information
	 */
	parse(content: string): ParseResult;

	/**
	 * Analyze parsed packages for issues
	 */
	analyze(parseResult: ParseResult, options: AnalysisOptions): AnalysisResult;

	/**
	 * Check if this parser can handle the given content
	 */
	canParse(content: string): boolean;

	/**
	 * Get the ecosystem type this parser handles
	 */
	getEcosystem(): EcosystemType;

	/**
	 * Get the file types this parser handles
	 */
	getFileTypes(): PackageFileType[];
}

/**
 * Options for dependency analysis
 */
export interface AnalysisOptions {
	checkOutdated: boolean;
	checkDeprecated: boolean;
	checkVulnerabilities: boolean;
	suggestAlternatives: boolean;
	analyzeBundleSize: boolean;
}

/**
 * Known deprecated packages per ecosystem
 */
export interface DeprecatedPackageInfo {
	reason: string;
	alternative: string;
}

/**
 * Reference link for further reading
 */
export interface ReferenceLink {
	title: string;
	url: string;
	description?: string;
}
