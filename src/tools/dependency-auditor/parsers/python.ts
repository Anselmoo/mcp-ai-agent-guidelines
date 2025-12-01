/**
 * Python Parsers (requirements.txt, pyproject.toml)
 */

import type {
	AnalysisOptions,
	DependencyType,
	DeprecatedPackageInfo,
	EcosystemType,
	Issue,
	PackageFileType,
	PackageInfo,
	ParseResult,
} from "../types.js";
import { BaseParser, PATTERNS } from "./base.js";

export class PythonRequirementsParser extends BaseParser {
	protected static deprecatedPackages: Record<string, DeprecatedPackageInfo> = {
		fabric: {
			reason: "Fabric 1.x is deprecated",
			alternative: "Use fabric>=2.0 or invoke",
		},
		pycrypto: {
			reason: "No longer maintained, security vulnerabilities",
			alternative: "Use pycryptodome",
		},
		nose: { reason: "No longer maintained", alternative: "Use pytest" },
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

		for (const rawLine of content.split("\n")) {
			const line = rawLine.trim();
			if (!line || line.startsWith("#") || line.startsWith("-")) continue;
			if (
				line.startsWith("-e") ||
				line.includes("://") ||
				line.startsWith("git+")
			)
				continue;

			const parsed = this.parseRequirementLine(line);
			if (parsed) packages.push(parsed);
		}

		return {
			packages,
			ecosystem: "python",
			fileType: "requirements.txt",
			errors: errors.length > 0 ? errors : undefined,
		};
	}

	protected parseRequirementLine(line: string): PackageInfo | null {
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
		if (
			content.includes("[package]") ||
			content.includes("[dependencies]") ||
			content.includes("[project]") ||
			content.includes("module ") ||
			(content.includes("source ") && content.includes("gem "))
		)
			return false;

		let validLines = 0,
			totalNonEmptyLines = 0,
			hasVersionConstraint = false;
		for (const rawLine of content.split("\n")) {
			const line = rawLine.trim();
			if (!line || line.startsWith("#")) continue;
			totalNonEmptyLines++;

			if (
				PATTERNS.PACKAGE_WITH_VERSION.test(line) ||
				line.startsWith("-r") ||
				line.startsWith("-e") ||
				line.startsWith("-c") ||
				line.startsWith("--")
			) {
				validLines++;
				if (/[<>=!~]+/.test(line)) hasVersionConstraint = true;
			} else if (PATTERNS.BARE_PACKAGE.test(line)) {
				validLines++;
			}
		}

		return (
			totalNonEmptyLines > 0 &&
			validLines / totalNonEmptyLines >= 0.5 &&
			(hasVersionConstraint || validLines === totalNonEmptyLines)
		);
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
		if (options.checkOutdated) {
			if (pkg.version === "*" || pkg.version === "") {
				this.addIssue(
					issues,
					pkg,
					"Unpinned Version",
					"moderate",
					"No version constraint specified",
					"Pin to a specific version or use >= constraints",
				);
			}
			if (pkg.version.match(/>=\s*0\./) && !pkg.version.includes(",")) {
				this.addIssue(
					issues,
					pkg,
					"Version Constraint Issue",
					"info",
					"Very broad version constraint",
					"Consider adding an upper bound (e.g., >=1.0,<2.0)",
				);
			}
		}

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

		if (options.checkVulnerabilities)
			this.checkKnownVulnerabilities(pkg, issues);
	}

	protected checkKnownVulnerabilities(pkg: PackageInfo, issues: Issue[]): void {
		if (
			pkg.name === "django" &&
			(pkg.version.match(/^[<>=~]*\s*[12]\./) ||
				pkg.version.match(/^[<>=~]*\s*3\.[0-1]/))
		) {
			this.addIssue(
				issues,
				pkg,
				"Known Vulnerabilities",
				"high",
				"Older Django versions have known security vulnerabilities",
				"Update to Django>=4.2 (LTS)",
			);
		}
		if (
			pkg.name === "requests" &&
			pkg.version.match(/^[<>=~]*\s*2\.[0-2][0-7]/)
		) {
			this.addIssue(
				issues,
				pkg,
				"Known Vulnerabilities",
				"moderate",
				"Older requests versions have known vulnerabilities",
				"Update to requests>=2.28.0",
			);
		}
		if (pkg.name === "pillow" && pkg.version.match(/^[<>=~]*\s*[0-8]\./)) {
			this.addIssue(
				issues,
				pkg,
				"Known Vulnerabilities",
				"high",
				"Older Pillow versions have multiple security vulnerabilities",
				"Update to Pillow>=10.0.0",
			);
		}
		if (
			pkg.name === "urllib3" &&
			pkg.version.match(/^[<>=~]*\s*1\.(2[0-5]|[01])/)
		) {
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

	protected addEcosystemRecommendations(recommendations: string[]): void {
		recommendations.push(
			"Run 'pip-audit' or 'safety check' for vulnerability scanning",
		);
		recommendations.push("Run 'pip list --outdated' to check for updates");
		recommendations.push("Consider using pip-compile for reproducible builds");
	}
}

export class PythonPyprojectParser extends PythonRequirementsParser {
	parse(content: string): ParseResult {
		const packages: PackageInfo[] = [];
		const errors: string[] = [];
		let projectName: string | undefined;
		let projectVersion: string | undefined;

		try {
			const projectMatch = content.match(/\[project\]([\s\S]*?)(?=\n\[|$)/);
			if (projectMatch) {
				const nameMatch = projectMatch[1].match(/name\s*=\s*["']([^"']+)["']/);
				const versionMatch = projectMatch[1].match(
					/version\s*=\s*["']([^"']+)["']/,
				);
				if (nameMatch) projectName = nameMatch[1];
				if (versionMatch) projectVersion = versionMatch[1];

				const depsMatch = projectMatch[1].match(
					/dependencies\s*=\s*\[([\s\S]*?)\]/,
				);
				if (depsMatch)
					this.parseDependencyArray(depsMatch[1], "dependencies", packages);

				const optDepsMatch = content.match(
					/\[project\.optional-dependencies\]([\s\S]*?)(?=\n\[|$)/,
				);
				if (optDepsMatch)
					this.parseOptionalDependencies(optDepsMatch[1], packages);
			}

			const poetryDepsMatch = content.match(
				/\[tool\.poetry\.dependencies\]([\s\S]*?)(?=\n\[|$)/,
			);
			if (poetryDepsMatch)
				this.parsePoetryDependencies(
					poetryDepsMatch[1],
					"dependencies",
					packages,
				);

			const poetryDevDepsMatch =
				content.match(
					/\[tool\.poetry\.dev-dependencies\]([\s\S]*?)(?=\n\[|$)/,
				) ||
				content.match(
					/\[tool\.poetry\.group\.dev\.dependencies\]([\s\S]*?)(?=\n\[|$)/,
				);
			if (poetryDevDepsMatch)
				this.parsePoetryDependencies(
					poetryDevDepsMatch[1],
					"devDependencies",
					packages,
				);

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
		for (const match of content.matchAll(/["']([^"']+)["']/g)) {
			const parsed = this.parsePep508Dependency(match[1]);
			if (parsed) packages.push({ ...parsed, type });
		}
	}

	private parseOptionalDependencies(
		content: string,
		packages: PackageInfo[],
	): void {
		for (const match of content.matchAll(/(\w+)\s*=\s*\[([\s\S]*?)\]/g)) {
			const groupName = match[1];
			for (const dep of match[2].matchAll(/["']([^"']+)["']/g)) {
				const parsed = this.parsePep508Dependency(dep[1]);
				if (parsed)
					packages.push({
						...parsed,
						type: "optionalDependencies",
						extras: [groupName],
					});
			}
		}
	}

	private parsePoetryDependencies(
		content: string,
		type: DependencyType,
		packages: PackageInfo[],
	): void {
		for (const line of content.split("\n")) {
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
		const match = spec.match(
			/^([a-zA-Z0-9_-]+)(\[[^\]]+\])?\s*([<>=!~][^;]*)?/,
		);
		if (!match) return null;
		const extras = match[2]
			? match[2]
					.slice(1, -1)
					.split(",")
					.map((e) => e.trim())
			: undefined;
		return {
			name: match[1].toLowerCase(),
			version: match[3]?.trim() || "*",
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

	getFileTypes(): PackageFileType[] {
		return ["pyproject.toml"];
	}

	protected override addEcosystemRecommendations(
		recommendations: string[],
	): void {
		recommendations.push(
			"Run 'pip-audit' or 'safety check' for vulnerability scanning",
		);
		recommendations.push(
			"Use 'poetry update' or 'pip-compile' to update dependencies",
		);
		recommendations.push("Consider using dependabot for automated updates");
	}
}

// Aliases for backward compatibility
export const PyRequirementsParser = PythonRequirementsParser;
export const PyProjectParser = PythonPyprojectParser;
