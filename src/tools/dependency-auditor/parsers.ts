/**
 * Multi-language dependency parsers
 */

import type {
	AnalysisOptions,
	AnalysisResult,
	DependencyParser,
	DependencyType,
	DeprecatedPackageInfo,
	EcosystemType,
	Issue,
	IssueSeverity,
	PackageFileType,
	PackageInfo,
	ParseResult,
} from "./types.js";

/**
 * Base analyzer with common issue detection logic
 */
abstract class BaseParser implements DependencyParser {
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

	protected checkVersionPattern(version: string): {
		isWildcard: boolean;
		isPreRelease: boolean;
		isExactPin: boolean;
		isRangeVersion: boolean;
	} {
		return {
			isWildcard:
				version === "*" ||
				version === "latest" ||
				version === "any" ||
				version === "",
			isPreRelease: /^[~^]?0\.[0-9]+\.[0-9]+/.test(version),
			isExactPin: /^[0-9]+\.[0-9]+\.[0-9]+$/.test(version),
			isRangeVersion:
				version.includes(">=") ||
				version.includes("<=") ||
				version.includes("||"),
		};
	}
}

// ============================================================================
// JavaScript/TypeScript Parser (package.json)
// ============================================================================

export class JavaScriptParser extends BaseParser {
	private static deprecatedPackages: Record<string, DeprecatedPackageInfo> = {
		request: {
			reason: "Deprecated since 2020",
			alternative: "Use axios, node-fetch, or native fetch",
		},
		"node-uuid": {
			reason: "Renamed to uuid",
			alternative: "Use uuid package",
		},
		colors: {
			reason: "Security concerns and maintenance issues",
			alternative: "Use chalk or picocolors",
		},
		faker: {
			reason: "Original package deprecated",
			alternative: "Use @faker-js/faker",
		},
		tslint: {
			reason: "Deprecated in favor of ESLint",
			alternative: "Use @typescript-eslint/eslint-plugin",
		},
	};

	private static esmAlternatives: Record<string, string> = {
		"node-fetch": "Use native fetch (Node.js 18+) or undici",
		"cross-fetch": "Use native fetch (Node.js 18+)",
		"isomorphic-fetch": "Use native fetch (Node.js 18+)",
		"es6-promise": "Use native Promises",
		"babel-polyfill": "Use targeted polyfills or core-js",
		"@babel/polyfill": "Use targeted polyfills or core-js",
	};

	private static largeBundlePackages: Record<string, string> = {
		moment: "~300KB - Consider date-fns (~25KB) or dayjs (~2KB)",
		lodash: "~70KB - Consider lodash-es with tree-shaking",
		"core-js": "~100KB - Use only needed polyfills",
		jquery: "~90KB - Consider vanilla JS or smaller alternatives",
	};

	parse(content: string): ParseResult {
		const packages: PackageInfo[] = [];
		const errors: string[] = [];
		let projectName: string | undefined;
		let projectVersion: string | undefined;

		try {
			const packageJson = JSON.parse(content);
			projectName = packageJson.name;
			projectVersion = packageJson.version;

			const depTypes: Array<{
				key: string;
				type: DependencyType;
			}> = [
				{ key: "dependencies", type: "dependencies" },
				{ key: "devDependencies", type: "devDependencies" },
				{ key: "peerDependencies", type: "peerDependencies" },
				{ key: "optionalDependencies", type: "optionalDependencies" },
			];

			for (const { key, type } of depTypes) {
				const deps = packageJson[key];
				if (deps && typeof deps === "object") {
					for (const [name, version] of Object.entries(deps)) {
						packages.push({
							name,
							version: String(version),
							type,
							ecosystem: "javascript",
						});
					}
				}
			}
		} catch (error) {
			errors.push(
				`Invalid package.json: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}

		return {
			packages,
			projectName,
			projectVersion,
			ecosystem: "javascript",
			fileType: "package.json",
			errors: errors.length > 0 ? errors : undefined,
		};
	}

	canParse(content: string): boolean {
		try {
			const parsed = JSON.parse(content);
			return (
				typeof parsed === "object" &&
				(parsed.dependencies !== undefined ||
					parsed.devDependencies !== undefined ||
					parsed.peerDependencies !== undefined ||
					parsed.name !== undefined)
			);
		} catch {
			return false;
		}
	}

	getEcosystem(): EcosystemType {
		return "javascript";
	}

	getFileTypes(): PackageFileType[] {
		return ["package.json"];
	}

	protected analyzePackage(
		pkg: PackageInfo,
		options: AnalysisOptions,
		issues: Issue[],
	): void {
		const pattern = this.checkVersionPattern(pkg.version);

		// Check outdated patterns
		if (options.checkOutdated) {
			if (pattern.isWildcard) {
				this.addIssue(
					issues,
					pkg,
					"Unpinned Version",
					"moderate",
					`Using wildcard version (${pkg.version}) which can lead to unexpected updates`,
					"Pin to a specific version or use caret (^) or tilde (~) ranges",
				);
			}

			if (pattern.isPreRelease) {
				this.addIssue(
					issues,
					pkg,
					"Pre-1.0 Version",
					"info",
					"Package is pre-1.0, which may indicate instability or breaking changes",
					"Check if a stable 1.x+ version is available",
				);
			}

			if (pattern.isExactPin) {
				this.addIssue(
					issues,
					pkg,
					"Exact Version Pin",
					"low",
					"Exact version pinning prevents automatic security updates",
					"Consider using caret (^) ranges to allow patch updates",
				);
			}
		}

		// Check deprecated packages
		if (options.checkDeprecated) {
			const deprecated = JavaScriptParser.deprecatedPackages[pkg.name];
			if (deprecated) {
				this.addIssue(
					issues,
					pkg,
					"Deprecated Package",
					"high",
					deprecated.reason,
					deprecated.alternative,
				);
			}
		}

		// Check vulnerabilities
		if (options.checkVulnerabilities) {
			this.checkKnownVulnerabilities(pkg, issues);
		}

		// Check ESM alternatives
		if (options.suggestAlternatives) {
			const alt = JavaScriptParser.esmAlternatives[pkg.name];
			if (alt) {
				this.addIssue(
					issues,
					pkg,
					"ESM Alternative Available",
					"info",
					"Modern ESM-compatible alternative available",
					alt,
				);
			}
		}

		// Check bundle size
		if (options.analyzeBundleSize && pkg.type === "dependencies") {
			const bundleInfo = JavaScriptParser.largeBundlePackages[pkg.name];
			if (bundleInfo) {
				this.addIssue(
					issues,
					pkg,
					"Bundle Size Concern",
					"low",
					`Large bundle size: ${bundleInfo}`,
					"Consider tree-shaking or smaller alternatives",
				);
			}
		}
	}

	private checkKnownVulnerabilities(pkg: PackageInfo, issues: Issue[]): void {
		// lodash vulnerabilities (below 4.17.21)
		if (pkg.name === "lodash") {
			if (
				pkg.version.match(/^[~^]?[0-3]\./) ||
				pkg.version.match(/^[~^]?4\.(0|1[0-6]|17\.(0|1[0-9]|20))($|[^\d])/)
			) {
				this.addIssue(
					issues,
					pkg,
					"Known Vulnerabilities",
					"moderate",
					"Lodash versions below 4.17.21 have known security vulnerabilities",
					"Update to lodash@^4.17.21 or use lodash-es",
				);
			}
		}

		// moment.js deprecation
		if (pkg.name === "moment") {
			this.addIssue(
				issues,
				pkg,
				"Deprecated & Bundle Size",
				"moderate",
				"Moment.js is in maintenance mode and has large bundle size",
				"Consider migrating to date-fns, dayjs, or Temporal API",
			);
		}

		// axios vulnerabilities (below 1.6.0)
		if (pkg.name === "axios") {
			if (
				pkg.version.match(/^[~^]?0\./) ||
				pkg.version.match(/^[~^]?1\.[0-5]($|\.)/)
			) {
				this.addIssue(
					issues,
					pkg,
					"Known Vulnerabilities",
					"high",
					"Axios versions below 1.6.0 have known security vulnerabilities",
					"Update to axios@^1.6.0 or later",
				);
			}
		}
	}

	protected addEcosystemRecommendations(recommendations: string[]): void {
		recommendations.push("Run 'npm audit' for detailed vulnerability analysis");
		recommendations.push("Run 'npm outdated' to check for latest versions");
		recommendations.push(
			"Consider using 'npm audit fix' for automated security updates",
		);
		recommendations.push("Review package.json regularly for updates");
		recommendations.push(
			"Use Dependabot or Renovate for automated dependency updates",
		);
	}
}

// ============================================================================
// Python Parser (requirements.txt)
// ============================================================================

export class PythonRequirementsParser extends BaseParser {
	private static deprecatedPackages: Record<string, DeprecatedPackageInfo> = {
		fabric: {
			reason: "Fabric 1.x is deprecated",
			alternative: "Use fabric>=2.0 or invoke",
		},
		pycrypto: {
			reason: "No longer maintained, security vulnerabilities",
			alternative: "Use pycryptodome",
		},
		nose: {
			reason: "No longer maintained",
			alternative: "Use pytest",
		},
		mock: {
			reason: "Integrated into Python 3.3+ standard library",
			alternative: "Use unittest.mock",
		},
		distribute: {
			reason: "Merged into setuptools",
			alternative: "Use setuptools",
		},
		"pylint-django": {
			reason: "Consider newer alternatives",
			alternative: "Use django-stubs with mypy",
		},
		urllib3: {
			reason: "Versions < 1.26.5 have security vulnerabilities",
			alternative: "Update to urllib3>=1.26.5",
		},
	};

	parse(content: string): ParseResult {
		const packages: PackageInfo[] = [];
		const errors: string[] = [];
		const lines = content.split("\n");

		for (const rawLine of lines) {
			const line = rawLine.trim();

			// Skip comments and empty lines
			if (!line || line.startsWith("#") || line.startsWith("-")) {
				continue;
			}

			// Skip editable installs and URL-based installs
			if (
				line.startsWith("-e") ||
				line.includes("://") ||
				line.startsWith("git+")
			) {
				continue;
			}

			// Parse package specification
			const parsed = this.parseRequirementLine(line);
			if (parsed) {
				packages.push(parsed);
			}
		}

		return {
			packages,
			ecosystem: "python",
			fileType: "requirements.txt",
			errors: errors.length > 0 ? errors : undefined,
		};
	}

	private parseRequirementLine(line: string): PackageInfo | null {
		// Handle extras: package[extra1,extra2]
		const extrasMatch = line.match(/^([a-zA-Z0-9_-]+)\[([^\]]+)\]/);
		let packageName: string;
		let extras: string[] | undefined;
		let remaining: string;

		if (extrasMatch) {
			packageName = extrasMatch[1];
			extras = extrasMatch[2].split(",").map((e) => e.trim());
			remaining = line.slice(extrasMatch[0].length);
		} else {
			const nameMatch = line.match(/^([a-zA-Z0-9_-]+)/);
			if (!nameMatch) return null;
			packageName = nameMatch[1];
			remaining = line.slice(nameMatch[0].length);
		}

		// Extract version constraint
		const versionMatch = remaining.match(
			/([<>=!~]+\s*[\d.*]+(?:\s*,\s*[<>=!~]+\s*[\d.*]+)*)/,
		);
		const version = versionMatch ? versionMatch[1].trim() : "*";

		return {
			name: packageName.toLowerCase(),
			version,
			type: "dependencies",
			ecosystem: "python",
			extras,
		};
	}

	canParse(content: string): boolean {
		const lines = content.split("\n");
		let validLines = 0;
		let totalNonEmptyLines = 0;

		for (const rawLine of lines) {
			const line = rawLine.trim();
			if (!line || line.startsWith("#")) continue;
			totalNonEmptyLines++;

			// Check if it looks like a requirements.txt line
			if (
				/^[a-zA-Z0-9_-]+(\[[^\]]+\])?\s*([<>=!~]+|$)/.test(line) ||
				line.startsWith("-r") ||
				line.startsWith("-e") ||
				line.startsWith("-c")
			) {
				validLines++;
			}
		}

		return totalNonEmptyLines > 0 && validLines / totalNonEmptyLines >= 0.5;
	}

	getEcosystem(): EcosystemType {
		return "python";
	}

	getFileTypes(): PackageFileType[] {
		return ["requirements.txt"];
	}

	protected analyzePackage(
		pkg: PackageInfo,
		options: AnalysisOptions,
		issues: Issue[],
	): void {
		const pattern = this.checkVersionPattern(pkg.version);

		// Check outdated patterns
		if (options.checkOutdated) {
			if (pattern.isWildcard || pkg.version === "*") {
				this.addIssue(
					issues,
					pkg,
					"Unpinned Version",
					"moderate",
					"No version constraint specified, which can lead to incompatible updates",
					"Pin to a specific version or use >= constraints",
				);
			}

			// Check for overly broad version ranges
			if (pkg.version.match(/>=\s*0\./) && !pkg.version.includes(",")) {
				this.addIssue(
					issues,
					pkg,
					"Version Constraint Issue",
					"info",
					"Very broad version constraint may allow incompatible versions",
					"Consider adding an upper bound (e.g., >=1.0,<2.0)",
				);
			}
		}

		// Check deprecated packages
		if (options.checkDeprecated) {
			const deprecated = PythonRequirementsParser.deprecatedPackages[pkg.name];
			if (deprecated) {
				this.addIssue(
					issues,
					pkg,
					"Deprecated Package",
					"high",
					deprecated.reason,
					deprecated.alternative,
				);
			}
		}

		// Check vulnerabilities
		if (options.checkVulnerabilities) {
			this.checkKnownVulnerabilities(pkg, issues);
		}
	}

	private checkKnownVulnerabilities(pkg: PackageInfo, issues: Issue[]): void {
		// Django - multiple CVEs for older versions
		if (pkg.name === "django") {
			if (
				pkg.version.match(/^[<>=~]*\s*[12]\./) ||
				pkg.version.match(/^[<>=~]*\s*3\.[0-1]/)
			) {
				this.addIssue(
					issues,
					pkg,
					"Known Vulnerabilities",
					"high",
					"Older Django versions have known security vulnerabilities",
					"Update to Django>=4.2 (LTS) or latest stable version",
				);
			}
		}

		// Requests - older versions have vulnerabilities
		if (pkg.name === "requests") {
			if (pkg.version.match(/^[<>=~]*\s*2\.[0-2][0-7]/)) {
				this.addIssue(
					issues,
					pkg,
					"Known Vulnerabilities",
					"moderate",
					"Older requests versions have known vulnerabilities",
					"Update to requests>=2.28.0",
				);
			}
		}

		// Pillow - multiple CVEs
		if (pkg.name === "pillow") {
			if (pkg.version.match(/^[<>=~]*\s*[0-8]\./)) {
				this.addIssue(
					issues,
					pkg,
					"Known Vulnerabilities",
					"high",
					"Older Pillow versions have multiple security vulnerabilities",
					"Update to Pillow>=10.0.0",
				);
			}
		}

		// urllib3 vulnerabilities
		if (pkg.name === "urllib3") {
			if (pkg.version.match(/^[<>=~]*\s*1\.(2[0-5]|[01])/)) {
				this.addIssue(
					issues,
					pkg,
					"Known Vulnerabilities",
					"moderate",
					"urllib3 < 1.26.5 has security vulnerabilities",
					"Update to urllib3>=1.26.5",
				);
			}
		}
	}

	protected addEcosystemRecommendations(recommendations: string[]): void {
		recommendations.push(
			"Run 'pip-audit' or 'safety check' for vulnerability scanning",
		);
		recommendations.push("Run 'pip list --outdated' to check for updates");
		recommendations.push("Consider using pip-compile for reproducible builds");
		recommendations.push(
			"Pin exact versions in production with pip freeze > requirements.txt",
		);
		recommendations.push("Use virtual environments for project isolation");
	}
}

// ============================================================================
// Python Parser (pyproject.toml)
// ============================================================================

export class PythonPyprojectParser extends BaseParser {
	private requirementsParser = new PythonRequirementsParser();

	parse(content: string): ParseResult {
		const packages: PackageInfo[] = [];
		const errors: string[] = [];
		let projectName: string | undefined;
		let projectVersion: string | undefined;

		try {
			// Parse [project] section
			const projectMatch = content.match(/\[project\]([\s\S]*?)(?=\n\[|$)/);
			if (projectMatch) {
				const nameMatch = projectMatch[1].match(/name\s*=\s*["']([^"']+)["']/);
				const versionMatch = projectMatch[1].match(
					/version\s*=\s*["']([^"']+)["']/,
				);
				if (nameMatch) projectName = nameMatch[1];
				if (versionMatch) projectVersion = versionMatch[1];

				// Parse dependencies array
				const depsMatch = projectMatch[1].match(
					/dependencies\s*=\s*\[([\s\S]*?)\]/,
				);
				if (depsMatch) {
					this.parseDependencyArray(depsMatch[1], "dependencies", packages);
				}

				// Parse optional-dependencies
				const optDepsMatch = content.match(
					/\[project\.optional-dependencies\]([\s\S]*?)(?=\n\[|$)/,
				);
				if (optDepsMatch) {
					this.parseOptionalDependencies(optDepsMatch[1], packages);
				}
			}

			// Parse [tool.poetry.dependencies] for Poetry projects
			const poetryDepsMatch = content.match(
				/\[tool\.poetry\.dependencies\]([\s\S]*?)(?=\n\[|$)/,
			);
			if (poetryDepsMatch) {
				this.parsePoetryDependencies(
					poetryDepsMatch[1],
					"dependencies",
					packages,
				);
			}

			// Parse [tool.poetry.dev-dependencies] or [tool.poetry.group.dev.dependencies]
			const poetryDevDepsMatch =
				content.match(
					/\[tool\.poetry\.dev-dependencies\]([\s\S]*?)(?=\n\[|$)/,
				) ||
				content.match(
					/\[tool\.poetry\.group\.dev\.dependencies\]([\s\S]*?)(?=\n\[|$)/,
				);
			if (poetryDevDepsMatch) {
				this.parsePoetryDependencies(
					poetryDevDepsMatch[1],
					"devDependencies",
					packages,
				);
			}

			// Parse project name/version from poetry
			if (!projectName) {
				const poetryProjectMatch = content.match(
					/\[tool\.poetry\]([\s\S]*?)(?=\n\[|$)/,
				);
				if (poetryProjectMatch) {
					const nameMatch = poetryProjectMatch[1].match(
						/name\s*=\s*["']([^"']+)["']/,
					);
					const versionMatch = poetryProjectMatch[1].match(
						/version\s*=\s*["']([^"']+)["']/,
					);
					if (nameMatch) projectName = nameMatch[1];
					if (versionMatch) projectVersion = versionMatch[1];
				}
			}
		} catch (error) {
			errors.push(
				`Error parsing pyproject.toml: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}

		return {
			packages,
			projectName,
			projectVersion,
			ecosystem: "python",
			fileType: "pyproject.toml",
			errors: errors.length > 0 ? errors : undefined,
		};
	}

	private parseDependencyArray(
		content: string,
		type: DependencyType,
		packages: PackageInfo[],
	): void {
		// Match quoted strings in array
		const matches = content.matchAll(/["']([^"']+)["']/g);
		for (const match of matches) {
			const parsed = this.parsePep508Dependency(match[1]);
			if (parsed) {
				packages.push({ ...parsed, type });
			}
		}
	}

	private parseOptionalDependencies(
		content: string,
		packages: PackageInfo[],
	): void {
		// Match group = [...] patterns
		const groupMatches = content.matchAll(/(\w+)\s*=\s*\[([\s\S]*?)\]/g);
		for (const match of groupMatches) {
			const groupName = match[1];
			const deps = match[2].matchAll(/["']([^"']+)["']/g);
			for (const dep of deps) {
				const parsed = this.parsePep508Dependency(dep[1]);
				if (parsed) {
					packages.push({
						...parsed,
						type: "optionalDependencies",
						extras: [groupName],
					});
				}
			}
		}
	}

	private parsePoetryDependencies(
		content: string,
		type: DependencyType,
		packages: PackageInfo[],
	): void {
		// Match package = "version" or package = { version = "x", ... }
		const lines = content.split("\n");
		for (const line of lines) {
			const simpleMatch = line.match(
				/^([a-zA-Z0-9_-]+)\s*=\s*["']([^"']+)["']/,
			);
			if (simpleMatch && simpleMatch[1] !== "python") {
				packages.push({
					name: simpleMatch[1].toLowerCase(),
					version: simpleMatch[2],
					type,
					ecosystem: "python",
				});
				continue;
			}

			const complexMatch = line.match(
				/^([a-zA-Z0-9_-]+)\s*=\s*\{[^}]*version\s*=\s*["']([^"']+)["']/,
			);
			if (complexMatch && complexMatch[1] !== "python") {
				packages.push({
					name: complexMatch[1].toLowerCase(),
					version: complexMatch[2],
					type,
					ecosystem: "python",
				});
			}
		}
	}

	private parsePep508Dependency(spec: string): PackageInfo | null {
		// Parse PEP 508 dependency specification
		const match = spec.match(
			/^([a-zA-Z0-9_-]+)(\[[^\]]+\])?\s*([<>=!~][^;]*)?/,
		);
		if (!match) return null;

		const name = match[1].toLowerCase();
		const extras = match[2]
			? match[2]
					.slice(1, -1)
					.split(",")
					.map((e) => e.trim())
			: undefined;
		const version = match[3]?.trim() || "*";

		return {
			name,
			version,
			type: "dependencies",
			ecosystem: "python",
			extras,
		};
	}

	canParse(content: string): boolean {
		return (
			content.includes("[project]") ||
			content.includes("[tool.poetry") ||
			content.includes("[build-system]")
		);
	}

	getEcosystem(): EcosystemType {
		return "python";
	}

	getFileTypes(): PackageFileType[] {
		return ["pyproject.toml"];
	}

	protected analyzePackage(
		pkg: PackageInfo,
		options: AnalysisOptions,
		issues: Issue[],
	): void {
		// Delegate to requirements parser for common Python analysis
		this.requirementsParser["analyzePackage"](pkg, options, issues);
	}

	protected addEcosystemRecommendations(recommendations: string[]): void {
		recommendations.push(
			"Run 'pip-audit' or 'safety check' for vulnerability scanning",
		);
		recommendations.push(
			"Use 'poetry update' or 'pip-compile' to update dependencies",
		);
		recommendations.push("Consider using dependabot for automated updates");
		recommendations.push(
			"Use lock files (poetry.lock, requirements.txt) for reproducible builds",
		);
	}
}

// ============================================================================
// Go Parser (go.mod)
// ============================================================================

export class GoModParser extends BaseParser {
	private static deprecatedPackages: Record<string, DeprecatedPackageInfo> = {
		"github.com/pkg/errors": {
			reason: "Standard library errors package improved in Go 1.13+",
			alternative: "Use standard errors package with fmt.Errorf and %w",
		},
		"github.com/golang/protobuf": {
			reason: "Deprecated in favor of google.golang.org/protobuf",
			alternative: "Use google.golang.org/protobuf",
		},
		"gopkg.in/yaml.v2": {
			reason: "V3 is available with better performance",
			alternative: "Consider gopkg.in/yaml.v3",
		},
		"github.com/gorilla/mux": {
			reason: "Archived by maintainers",
			alternative: "Consider chi, gin, or net/http with Go 1.22+ routing",
		},
	};

	parse(content: string): ParseResult {
		const packages: PackageInfo[] = [];
		const errors: string[] = [];
		let projectName: string | undefined;
		let projectVersion: string | undefined;

		const lines = content.split("\n");
		let inRequireBlock = false;

		for (const rawLine of lines) {
			const line = rawLine.trim();

			// Parse module name
			const moduleMatch = line.match(/^module\s+(.+)$/);
			if (moduleMatch) {
				projectName = moduleMatch[1].trim();
				continue;
			}

			// Parse go version
			const goVersionMatch = line.match(/^go\s+([\d.]+)$/);
			if (goVersionMatch) {
				projectVersion = `go${goVersionMatch[1]}`;
				continue;
			}

			// Handle require block
			if (line === "require (") {
				inRequireBlock = true;
				continue;
			}
			if (line === ")" && inRequireBlock) {
				inRequireBlock = false;
				continue;
			}

			// Parse single require or require block line
			const requireMatch =
				line.match(/^require\s+(\S+)\s+(v[\d.]+[-\w.]*)/) ||
				(inRequireBlock && line.match(/^(\S+)\s+(v[\d.]+[-\w.]*)/));

			if (requireMatch) {
				const name = requireMatch[1];
				const version = requireMatch[2];
				const isIndirect = line.includes("// indirect");

				packages.push({
					name,
					version,
					type: isIndirect ? "optionalDependencies" : "dependencies",
					ecosystem: "go",
				});
			}
		}

		return {
			packages,
			projectName,
			projectVersion,
			ecosystem: "go",
			fileType: "go.mod",
			errors: errors.length > 0 ? errors : undefined,
		};
	}

	canParse(content: string): boolean {
		return (
			content.includes("module ") &&
			(content.includes("require ") || content.includes("go "))
		);
	}

	getEcosystem(): EcosystemType {
		return "go";
	}

	getFileTypes(): PackageFileType[] {
		return ["go.mod"];
	}

	protected analyzePackage(
		pkg: PackageInfo,
		options: AnalysisOptions,
		issues: Issue[],
	): void {
		// Check deprecated packages
		if (options.checkDeprecated) {
			const deprecated = GoModParser.deprecatedPackages[pkg.name];
			if (deprecated) {
				this.addIssue(
					issues,
					pkg,
					"Deprecated Package",
					"high",
					deprecated.reason,
					deprecated.alternative,
				);
			}
		}

		// Check for pseudo-versions (potentially unstable)
		if (options.checkOutdated) {
			if (
				pkg.version.includes("-0.") ||
				pkg.version.includes("+incompatible")
			) {
				this.addIssue(
					issues,
					pkg,
					"Version Constraint Issue",
					"info",
					"Using pseudo-version or +incompatible, may indicate dependency issues",
					"Consider updating to a stable tagged version",
				);
			}

			// Check for pre-1.0 versions
			if (pkg.version.match(/^v0\./)) {
				this.addIssue(
					issues,
					pkg,
					"Pre-1.0 Version",
					"info",
					"Package is pre-1.0, API may not be stable",
					"Check if a stable v1.x+ version is available",
				);
			}
		}

		// Check vulnerabilities
		if (options.checkVulnerabilities) {
			this.checkKnownVulnerabilities(pkg, issues);
		}
	}

	private checkKnownVulnerabilities(pkg: PackageInfo, issues: Issue[]): void {
		// golang.org/x/crypto vulnerabilities
		if (pkg.name === "golang.org/x/crypto") {
			if (pkg.version.match(/v0\.(0|1[0-6])\./)) {
				this.addIssue(
					issues,
					pkg,
					"Known Vulnerabilities",
					"high",
					"Older golang.org/x/crypto versions have security vulnerabilities",
					"Update to latest version",
				);
			}
		}

		// golang.org/x/net vulnerabilities
		if (pkg.name === "golang.org/x/net") {
			if (pkg.version.match(/v0\.(0|1[0-7])\./)) {
				this.addIssue(
					issues,
					pkg,
					"Known Vulnerabilities",
					"moderate",
					"Older golang.org/x/net versions may have vulnerabilities",
					"Update to latest version",
				);
			}
		}
	}

	protected addEcosystemRecommendations(recommendations: string[]): void {
		recommendations.push("Run 'go mod tidy' to clean up unused dependencies");
		recommendations.push("Run 'govulncheck' for Go vulnerability scanning");
		recommendations.push(
			"Use 'go list -m -u all' to check for available updates",
		);
		recommendations.push(
			"Consider using dependabot for automated Go module updates",
		);
	}
}

// ============================================================================
// Rust Parser (Cargo.toml)
// ============================================================================

export class RustCargoParser extends BaseParser {
	private static deprecatedPackages: Record<string, DeprecatedPackageInfo> = {
		failure: {
			reason: "Deprecated in favor of thiserror and anyhow",
			alternative: "Use thiserror for library errors, anyhow for applications",
		},
		error_chain: {
			reason: "Deprecated in favor of thiserror and anyhow",
			alternative: "Use thiserror for library errors, anyhow for applications",
		},
		"quick-error": {
			reason: "Less maintained than alternatives",
			alternative: "Consider thiserror or anyhow",
		},
		"rustc-serialize": {
			reason: "Deprecated in favor of serde",
			alternative: "Use serde with serde_json or serde_derive",
		},
		time: {
			reason: "Time 0.1.x is deprecated",
			alternative: "Use time 0.3+ or chrono",
		},
	};

	parse(content: string): ParseResult {
		const packages: PackageInfo[] = [];
		const errors: string[] = [];
		let projectName: string | undefined;
		let projectVersion: string | undefined;

		try {
			// Parse [package] section
			const packageMatch = content.match(/\[package\]([\s\S]*?)(?=\n\[|$)/);
			if (packageMatch) {
				const nameMatch = packageMatch[1].match(/name\s*=\s*["']([^"']+)["']/);
				const versionMatch = packageMatch[1].match(
					/version\s*=\s*["']([^"']+)["']/,
				);
				if (nameMatch) projectName = nameMatch[1];
				if (versionMatch) projectVersion = versionMatch[1];
			}

			// Parse [dependencies]
			const depsMatch = content.match(/\[dependencies\]([\s\S]*?)(?=\n\[|$)/);
			if (depsMatch) {
				this.parseDependencySection(depsMatch[1], "dependencies", packages);
			}

			// Parse [dev-dependencies]
			const devDepsMatch = content.match(
				/\[dev-dependencies\]([\s\S]*?)(?=\n\[|$)/,
			);
			if (devDepsMatch) {
				this.parseDependencySection(
					devDepsMatch[1],
					"devDependencies",
					packages,
				);
			}

			// Parse [build-dependencies]
			const buildDepsMatch = content.match(
				/\[build-dependencies\]([\s\S]*?)(?=\n\[|$)/,
			);
			if (buildDepsMatch) {
				this.parseDependencySection(
					buildDepsMatch[1],
					"buildDependencies",
					packages,
				);
			}
		} catch (error) {
			errors.push(
				`Error parsing Cargo.toml: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}

		return {
			packages,
			projectName,
			projectVersion,
			ecosystem: "rust",
			fileType: "Cargo.toml",
			errors: errors.length > 0 ? errors : undefined,
		};
	}

	private parseDependencySection(
		content: string,
		type: DependencyType,
		packages: PackageInfo[],
	): void {
		const lines = content.split("\n");

		for (const line of lines) {
			// Skip empty lines and comments
			if (!line.trim() || line.trim().startsWith("#")) continue;

			// Simple format: package = "version"
			const simpleMatch = line.match(
				/^([a-zA-Z0-9_-]+)\s*=\s*["']([^"']+)["']/,
			);
			if (simpleMatch) {
				packages.push({
					name: simpleMatch[1],
					version: simpleMatch[2],
					type,
					ecosystem: "rust",
				});
				continue;
			}

			// Complex format: package = { version = "x", ... }
			const complexMatch = line.match(
				/^([a-zA-Z0-9_-]+)\s*=\s*\{[^}]*version\s*=\s*["']([^"']+)["']/,
			);
			if (complexMatch) {
				const featuresMatch = line.match(/features\s*=\s*\[([^\]]+)\]/);
				const extras = featuresMatch
					? featuresMatch[1]
							.split(",")
							.map((f) => f.trim().replace(/["']/g, ""))
					: undefined;

				packages.push({
					name: complexMatch[1],
					version: complexMatch[2],
					type,
					ecosystem: "rust",
					extras,
				});
			}
		}
	}

	canParse(content: string): boolean {
		return (
			content.includes("[package]") ||
			content.includes("[dependencies]") ||
			content.includes("[workspace]")
		);
	}

	getEcosystem(): EcosystemType {
		return "rust";
	}

	getFileTypes(): PackageFileType[] {
		return ["Cargo.toml"];
	}

	protected analyzePackage(
		pkg: PackageInfo,
		options: AnalysisOptions,
		issues: Issue[],
	): void {
		// Check deprecated packages
		if (options.checkDeprecated) {
			const deprecated = RustCargoParser.deprecatedPackages[pkg.name];
			if (deprecated) {
				this.addIssue(
					issues,
					pkg,
					"Deprecated Package",
					"high",
					deprecated.reason,
					deprecated.alternative,
				);
			}
		}

		// Check version patterns
		if (options.checkOutdated) {
			// Check for wildcard versions
			if (pkg.version === "*") {
				this.addIssue(
					issues,
					pkg,
					"Unpinned Version",
					"moderate",
					"Wildcard version can lead to incompatible updates",
					"Pin to a specific version or use semver range",
				);
			}

			// Check for pre-1.0 versions
			if (pkg.version.match(/^0\./)) {
				this.addIssue(
					issues,
					pkg,
					"Pre-1.0 Version",
					"info",
					"Package is pre-1.0, breaking changes may occur in minor versions",
					"Check if a stable 1.x+ version is available",
				);
			}
		}

		// Check vulnerabilities
		if (options.checkVulnerabilities) {
			this.checkKnownVulnerabilities(pkg, issues);
		}
	}

	private checkKnownVulnerabilities(pkg: PackageInfo, issues: Issue[]): void {
		// regex crate had ReDoS vulnerabilities in older versions
		if (pkg.name === "regex") {
			if (pkg.version.match(/^[01]\.[0-7]\./)) {
				this.addIssue(
					issues,
					pkg,
					"Known Vulnerabilities",
					"moderate",
					"Older regex versions may have ReDoS vulnerabilities",
					"Update to regex >= 1.8.0",
				);
			}
		}

		// chrono had RUSTSEC advisories
		if (pkg.name === "chrono") {
			if (pkg.version.match(/^0\.[0-3]\./)) {
				this.addIssue(
					issues,
					pkg,
					"Known Vulnerabilities",
					"moderate",
					"Older chrono versions have known vulnerabilities",
					"Update to chrono >= 0.4.20",
				);
			}
		}
	}

	protected addEcosystemRecommendations(recommendations: string[]): void {
		recommendations.push(
			"Run 'cargo audit' for security vulnerability scanning",
		);
		recommendations.push("Run 'cargo update' to update dependencies");
		recommendations.push("Use 'cargo outdated' to check for available updates");
		recommendations.push("Consider using dependabot for automated updates");
	}
}

// ============================================================================
// Ruby Parser (Gemfile)
// ============================================================================

export class RubyGemfileParser extends BaseParser {
	private static deprecatedPackages: Record<string, DeprecatedPackageInfo> = {
		"coffee-rails": {
			reason: "CoffeeScript usage is declining",
			alternative: "Consider using ES6+ JavaScript or TypeScript",
		},
		therubyracer: {
			reason: "No longer maintained",
			alternative: "Use mini_racer or execjs with Node.js",
		},
		"sass-rails": {
			reason: "sassc-rails is preferred for better performance",
			alternative: "Use sassc-rails or dartsass-rails",
		},
		sprockets: {
			reason: "Consider modern alternatives for new projects",
			alternative: "Consider jsbundling-rails or importmap-rails",
		},
	};

	parse(content: string): ParseResult {
		const packages: PackageInfo[] = [];
		const errors: string[] = [];
		let currentGroup: string | undefined;

		const lines = content.split("\n");

		for (const rawLine of lines) {
			const line = rawLine.trim();

			// Skip comments and empty lines
			if (!line || line.startsWith("#")) continue;

			// Handle group blocks
			const groupMatch = line.match(/^group\s+:(\w+)/);
			if (groupMatch) {
				currentGroup = groupMatch[1];
				continue;
			}

			if (line === "end") {
				currentGroup = undefined;
				continue;
			}

			// Parse gem declarations
			const gemMatch = line.match(
				/^gem\s+['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/,
			);
			if (gemMatch) {
				const name = gemMatch[1];
				const version = gemMatch[2] || "*";
				const type: DependencyType =
					currentGroup === "development" || currentGroup === "test"
						? "devDependencies"
						: "dependencies";

				packages.push({
					name,
					version,
					type,
					ecosystem: "ruby",
					extras: currentGroup ? [currentGroup] : undefined,
				});
			}
		}

		return {
			packages,
			ecosystem: "ruby",
			fileType: "Gemfile",
			errors: errors.length > 0 ? errors : undefined,
		};
	}

	canParse(content: string): boolean {
		return (
			content.includes("source ") &&
			(content.includes("gem ") || content.includes("ruby "))
		);
	}

	getEcosystem(): EcosystemType {
		return "ruby";
	}

	getFileTypes(): PackageFileType[] {
		return ["Gemfile"];
	}

	protected analyzePackage(
		pkg: PackageInfo,
		options: AnalysisOptions,
		issues: Issue[],
	): void {
		// Check deprecated packages
		if (options.checkDeprecated) {
			const deprecated = RubyGemfileParser.deprecatedPackages[pkg.name];
			if (deprecated) {
				this.addIssue(
					issues,
					pkg,
					"Deprecated Package",
					"high",
					deprecated.reason,
					deprecated.alternative,
				);
			}
		}

		// Check version patterns
		if (options.checkOutdated) {
			if (pkg.version === "*" || !pkg.version) {
				this.addIssue(
					issues,
					pkg,
					"Unpinned Version",
					"moderate",
					"No version constraint specified",
					"Pin to a specific version or use ~> operator",
				);
			}
		}

		// Check vulnerabilities
		if (options.checkVulnerabilities) {
			this.checkKnownVulnerabilities(pkg, issues);
		}
	}

	private checkKnownVulnerabilities(pkg: PackageInfo, issues: Issue[]): void {
		// Rails vulnerabilities
		if (pkg.name === "rails") {
			if (pkg.version.match(/^[<>=~]*\s*[0-5]\./)) {
				this.addIssue(
					issues,
					pkg,
					"Known Vulnerabilities",
					"high",
					"Older Rails versions have known security vulnerabilities",
					"Update to Rails 7.0+ or latest LTS version",
				);
			}
		}

		// nokogiri vulnerabilities
		if (pkg.name === "nokogiri") {
			if (pkg.version.match(/^[<>=~]*\s*1\.[0-9]\./)) {
				this.addIssue(
					issues,
					pkg,
					"Known Vulnerabilities",
					"moderate",
					"Older nokogiri versions have known vulnerabilities",
					"Update to nokogiri >= 1.13.0",
				);
			}
		}
	}

	protected addEcosystemRecommendations(recommendations: string[]): void {
		recommendations.push(
			"Run 'bundle audit' for security vulnerability scanning",
		);
		recommendations.push("Run 'bundle outdated' to check for updates");
		recommendations.push("Use Gemfile.lock for reproducible builds");
		recommendations.push("Consider using dependabot for automated updates");
	}
}

// ============================================================================
// C++ Parser (vcpkg.json)
// ============================================================================

export class CppVcpkgParser extends BaseParser {
	parse(content: string): ParseResult {
		const packages: PackageInfo[] = [];
		const errors: string[] = [];
		let projectName: string | undefined;
		let projectVersion: string | undefined;

		try {
			const manifest = JSON.parse(content);
			projectName = manifest.name;
			projectVersion = manifest.version || manifest["version-string"];

			// Parse dependencies
			const deps = manifest.dependencies || [];
			for (const dep of deps) {
				if (typeof dep === "string") {
					packages.push({
						name: dep,
						version: "*",
						type: "dependencies",
						ecosystem: "cpp",
					});
				} else if (typeof dep === "object") {
					const features = dep.features || [];
					packages.push({
						name: dep.name,
						version: dep["version>="] || dep.version || "*",
						type: "dependencies",
						ecosystem: "cpp",
						extras: features.length > 0 ? features : undefined,
					});
				}
			}

			// Parse dev-dependencies
			const devDeps = manifest["dev-dependencies"] || [];
			for (const dep of devDeps) {
				if (typeof dep === "string") {
					packages.push({
						name: dep,
						version: "*",
						type: "devDependencies",
						ecosystem: "cpp",
					});
				} else if (typeof dep === "object") {
					packages.push({
						name: dep.name,
						version: dep["version>="] || dep.version || "*",
						type: "devDependencies",
						ecosystem: "cpp",
					});
				}
			}
		} catch (error) {
			errors.push(
				`Error parsing vcpkg.json: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}

		return {
			packages,
			projectName,
			projectVersion,
			ecosystem: "cpp",
			fileType: "vcpkg.json",
			errors: errors.length > 0 ? errors : undefined,
		};
	}

	canParse(content: string): boolean {
		try {
			const parsed = JSON.parse(content);
			return (
				typeof parsed === "object" &&
				(parsed.dependencies !== undefined || parsed.name !== undefined) &&
				!parsed.devDependencies?.typescript // Exclude package.json
			);
		} catch {
			return false;
		}
	}

	getEcosystem(): EcosystemType {
		return "cpp";
	}

	getFileTypes(): PackageFileType[] {
		return ["vcpkg.json"];
	}

	protected analyzePackage(
		pkg: PackageInfo,
		options: AnalysisOptions,
		issues: Issue[],
	): void {
		// Check version patterns
		if (options.checkOutdated) {
			if (pkg.version === "*" || !pkg.version) {
				this.addIssue(
					issues,
					pkg,
					"Unpinned Version",
					"moderate",
					"No version constraint specified",
					"Pin to a specific version using version>= or baseline",
				);
			}
		}

		// Check for known issues
		if (options.checkVulnerabilities) {
			this.checkKnownVulnerabilities(pkg, issues);
		}
	}

	private checkKnownVulnerabilities(pkg: PackageInfo, issues: Issue[]): void {
		// OpenSSL vulnerabilities
		if (pkg.name === "openssl") {
			// Version parsing for C++ is complex; general advice
			this.addIssue(
				issues,
				pkg,
				"Security Risk",
				"info",
				"OpenSSL requires careful version management for security",
				"Ensure you're using the latest patched version",
			);
		}

		// libcurl vulnerabilities
		if (pkg.name === "curl" || pkg.name === "libcurl") {
			this.addIssue(
				issues,
				pkg,
				"Security Risk",
				"info",
				"curl/libcurl requires regular updates for security",
				"Ensure you're using the latest patched version",
			);
		}
	}

	protected addEcosystemRecommendations(recommendations: string[]): void {
		recommendations.push("Use vcpkg baseline for reproducible builds");
		recommendations.push("Run 'vcpkg upgrade' to check for available updates");
		recommendations.push(
			"Consider using version constraints with version>= for security",
		);
		recommendations.push("Enable vcpkg binary caching for faster builds");
	}
}

// ============================================================================
// Lua Parser (rockspec)
// ============================================================================

export class LuaRockspecParser extends BaseParser {
	parse(content: string): ParseResult {
		const packages: PackageInfo[] = [];
		const errors: string[] = [];
		let projectName: string | undefined;
		let projectVersion: string | undefined;

		try {
			// Parse package name and version
			const packageMatch = content.match(/package\s*=\s*["']([^"']+)["']/);
			const versionMatch = content.match(/version\s*=\s*["']([^"']+)["']/);
			if (packageMatch) projectName = packageMatch[1];
			if (versionMatch) projectVersion = versionMatch[1];

			// Parse dependencies block
			const depsMatch = content.match(/dependencies\s*=\s*\{([\s\S]*?)\}/);
			if (depsMatch) {
				const depsContent = depsMatch[1];
				const depMatches = depsContent.matchAll(
					/["']([^"']+)["']\s*(?:,|\}|$)/g,
				);
				for (const match of depMatches) {
					const parsed = this.parseDependency(match[1]);
					if (parsed) {
						packages.push(parsed);
					}
				}
			}
		} catch (error) {
			errors.push(
				`Error parsing rockspec: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}

		return {
			packages,
			projectName,
			projectVersion,
			ecosystem: "lua",
			fileType: "rockspec",
			errors: errors.length > 0 ? errors : undefined,
		};
	}

	private parseDependency(spec: string): PackageInfo | null {
		// Parse "package >= version" or just "package"
		const match = spec.match(/^([a-zA-Z0-9_-]+)\s*(.*)$/);
		if (!match) return null;

		return {
			name: match[1],
			version: match[2]?.trim() || "*",
			type: "dependencies",
			ecosystem: "lua",
		};
	}

	canParse(content: string): boolean {
		return (
			content.includes("rockspec_format") ||
			content.includes("package =") ||
			(content.includes("dependencies") && content.includes("source ="))
		);
	}

	getEcosystem(): EcosystemType {
		return "lua";
	}

	getFileTypes(): PackageFileType[] {
		return ["rockspec"];
	}

	protected analyzePackage(
		pkg: PackageInfo,
		options: AnalysisOptions,
		issues: Issue[],
	): void {
		// Check version patterns
		if (options.checkOutdated) {
			if (pkg.version === "*" || !pkg.version) {
				this.addIssue(
					issues,
					pkg,
					"Unpinned Version",
					"moderate",
					"No version constraint specified",
					"Pin to a specific version using >= or == operators",
				);
			}
		}
	}

	protected addEcosystemRecommendations(recommendations: string[]): void {
		recommendations.push("Run 'luarocks list --outdated' to check for updates");
		recommendations.push("Use specific version constraints for production");
		recommendations.push("Consider using luarocks-admin for private rocks");
	}
}

// ============================================================================
// Parser Registry and Factory
// ============================================================================

const parsers: DependencyParser[] = [
	new JavaScriptParser(),
	new PythonRequirementsParser(),
	new PythonPyprojectParser(),
	new GoModParser(),
	new RustCargoParser(),
	new RubyGemfileParser(),
	new CppVcpkgParser(),
	new LuaRockspecParser(),
];

/**
 * Detect the file type and return the appropriate parser
 */
export function detectParser(content: string): DependencyParser | null {
	for (const parser of parsers) {
		if (parser.canParse(content)) {
			return parser;
		}
	}
	return null;
}

/**
 * Get parser for a specific file type
 */
export function getParserForFileType(
	fileType: PackageFileType,
): DependencyParser | null {
	for (const parser of parsers) {
		if (parser.getFileTypes().includes(fileType)) {
			return parser;
		}
	}
	return null;
}

/**
 * Get all available parsers
 */
export function getAllParsers(): DependencyParser[] {
	return [...parsers];
}

// Re-export with aliases for convenient access
export {
	JavaScriptParser as JsParser,
	PythonRequirementsParser as PyRequirementsParser,
	PythonPyprojectParser as PyProjectParser,
};
