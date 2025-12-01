/**
 * Base parser class with common issue detection logic
 */

import type {
	AnalysisOptions,
	AnalysisResult,
	DependencyParser,
	EcosystemType,
	Issue,
	IssueSeverity,
	PackageFileType,
	PackageInfo,
	ParseResult,
} from "../types.js";

/**
 * Common regex patterns used across parsers
 */
export const PATTERNS = {
	// Matches bare package name with optional extras: package[extra] or just package
	BARE_PACKAGE: /^[a-zA-Z0-9_-]+(\[[^\]]+\])?\s*$/,
	// Matches package with version constraint: package>=1.0 or package[extra]==1.2
	PACKAGE_WITH_VERSION: /^[a-zA-Z0-9_-]+(\[[^\]]+\])?\s*[<>=!~]+/,
};

/**
 * Base analyzer with common issue detection logic
 */
export abstract class BaseParser implements DependencyParser {
	abstract parse(content: string): ParseResult;
	abstract canParse(content: string): boolean;
	abstract getEcosystem(): EcosystemType;
	abstract getFileTypes(): PackageFileType[];

	analyze(parseResult: ParseResult, options: AnalysisOptions): AnalysisResult {
		const issues: Issue[] = [];
		const recommendations: string[] = [];

		// Analyze each package for common patterns
		for (const pkg of parseResult.packages) {
			this.analyzePackage(pkg, options, issues);
		}

		// Add ecosystem-specific analysis
		this.analyzeEcosystemSpecific(parseResult, options, issues);

		// Generate recommendations
		this.generateRecommendations(issues, recommendations);

		return {
			packages: parseResult.packages,
			issues,
			recommendations,
			ecosystem: parseResult.ecosystem,
			fileType: parseResult.fileType,
			projectName: parseResult.projectName,
			projectVersion: parseResult.projectVersion,
		};
	}

	protected abstract analyzePackage(
		pkg: PackageInfo,
		options: AnalysisOptions,
		issues: Issue[],
	): void;

	protected analyzeEcosystemSpecific(
		_parseResult: ParseResult,
		_options: AnalysisOptions,
		_issues: Issue[],
	): void {
		// Override in subclasses for ecosystem-specific analysis
	}

	protected generateRecommendations(
		issues: Issue[],
		recommendations: string[],
	): void {
		if (issues.length === 0) {
			recommendations.push(
				"No immediate issues detected in dependency versions",
			);
			recommendations.push("Continue monitoring dependencies regularly");
			return;
		}

		const criticalCount = issues.filter(
			(i) => i.severity === "critical",
		).length;
		const highCount = issues.filter((i) => i.severity === "high").length;
		const moderateCount = issues.filter(
			(i) => i.severity === "moderate",
		).length;

		if (criticalCount > 0) {
			recommendations.push(
				`Address ${criticalCount} critical issue(s) immediately`,
			);
		}
		if (highCount > 0) {
			recommendations.push(
				`Update ${highCount} high-priority package(s) as soon as possible`,
			);
		}
		if (moderateCount > 0) {
			recommendations.push(`Review ${moderateCount} moderate concern(s)`);
		}

		// Add ecosystem-specific recommendations
		this.addEcosystemRecommendations(recommendations);
	}

	protected abstract addEcosystemRecommendations(
		recommendations: string[],
	): void;

	protected addIssue(
		issues: Issue[],
		pkg: PackageInfo,
		type: string,
		severity: IssueSeverity,
		description: string,
		recommendation?: string,
	): void {
		issues.push({
			package: pkg.name,
			version: pkg.version,
			type,
			severity,
			description,
			recommendation,
			ecosystem: pkg.ecosystem,
		});
	}
}
