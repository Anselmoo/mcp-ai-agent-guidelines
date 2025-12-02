/**
 * UV Lock Parser (uv.lock)
 *
 * Parses uv.lock files which are TOML-formatted lock files used by the uv Python package manager.
 * The format includes package entries with exact versions, sources, and dependency information.
 */

import type {
	AnalysisOptions,
	DeprecatedPackageInfo,
	EcosystemType,
	Issue,
	PackageFileType,
	PackageInfo,
	ParseResult,
} from "../types.js";
import { BaseParser } from "./base.js";

export class UvLockParser extends BaseParser {
	private static deprecatedPackages: Record<string, DeprecatedPackageInfo> = {
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
	};

	parse(content: string): ParseResult {
		const packages: PackageInfo[] = [];
		const errors: string[] = [];

		try {
			// Parse TOML-like format for [[package]] entries
			const packageBlocks = content.split("[[package]]").slice(1);

			for (const block of packageBlocks) {
				const parsed = this.parsePackageBlock(block);
				if (parsed) {
					packages.push(parsed);
				}
			}
		} catch (error) {
			errors.push(
				`Error parsing uv.lock: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}

		return {
			packages,
			ecosystem: "python",
			fileType: "uv.lock",
			errors: errors.length > 0 ? errors : undefined,
		};
	}

	private parsePackageBlock(block: string): PackageInfo | null {
		const nameMatch = block.match(/^name\s*=\s*["']([^"']+)["']/m);
		const versionMatch = block.match(/^version\s*=\s*["']([^"']+)["']/m);

		if (!nameMatch) return null;

		const name = nameMatch[1];
		const version = versionMatch ? versionMatch[1] : "*";

		// Check for source information
		const sourceMatch = block.match(
			/^source\s*=\s*\{\s*registry\s*=\s*["']([^"']+)["']/m,
		);
		const source = sourceMatch ? "registry" : undefined;

		// Check for dependencies
		const extras: string[] = [];
		const depsMatch = block.match(/^dependencies\s*=\s*\[([\s\S]*?)\]/m);
		if (depsMatch) {
			const depMatches = depsMatch[1].matchAll(
				/\{\s*name\s*=\s*["']([^"']+)["']/g,
			);
			for (const match of depMatches) {
				extras.push(match[1]);
			}
		}

		return {
			name: name.toLowerCase(),
			version,
			type: "dependencies",
			ecosystem: "python",
			source,
			extras: extras.length > 0 ? extras : undefined,
		};
	}

	canParse(content: string): boolean {
		// uv.lock files are TOML with [[package]] blocks and version/revision headers
		const hasVersionHeader =
			content.includes("version = ") && content.includes("revision = ");
		const hasPackageBlocks = content.includes("[[package]]");
		const hasRequiresPython = content.includes("requires-python");

		return (
			(hasVersionHeader && hasPackageBlocks) ||
			(hasPackageBlocks && hasRequiresPython)
		);
	}

	getEcosystem(): EcosystemType {
		return "python";
	}

	getFileTypes(): PackageFileType[] {
		return ["uv.lock"];
	}

	protected analyzePackage(
		pkg: PackageInfo,
		options: AnalysisOptions,
		issues: Issue[],
	): void {
		// uv.lock files have pinned versions, so check for deprecated packages
		if (options.checkDeprecated) {
			const deprecated = UvLockParser.deprecatedPackages[pkg.name];
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

		if (options.checkVulnerabilities) {
			this.checkKnownVulnerabilities(pkg, issues);
		}

		// Check for pre-1.0 versions
		if (options.checkOutdated && pkg.version.match(/^0\./)) {
			this.addIssue(
				issues,
				pkg,
				"Pre-1.0 Version",
				"info",
				"Package is pre-1.0, which may indicate instability",
				"Check if a stable 1.x+ version is available",
			);
		}
	}

	private checkKnownVulnerabilities(pkg: PackageInfo, issues: Issue[]): void {
		// Django vulnerabilities
		if (
			pkg.name === "django" &&
			(pkg.version.match(/^[12]\./) || pkg.version.match(/^3\.[0-1]/))
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

		// Requests vulnerabilities
		if (pkg.name === "requests" && pkg.version.match(/^2\.[0-2][0-7]/)) {
			this.addIssue(
				issues,
				pkg,
				"Known Vulnerabilities",
				"moderate",
				"Older requests versions have known vulnerabilities",
				"Update to requests>=2.28.0",
			);
		}

		// Pillow vulnerabilities
		if (pkg.name === "pillow" && pkg.version.match(/^[0-8]\./)) {
			this.addIssue(
				issues,
				pkg,
				"Known Vulnerabilities",
				"high",
				"Older Pillow versions have multiple security vulnerabilities",
				"Update to Pillow>=10.0.0",
			);
		}

		// urllib3 vulnerabilities
		if (pkg.name === "urllib3" && pkg.version.match(/^1\.(2[0-5]|[01])/)) {
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
		recommendations.push("Run 'uv lock --upgrade' to update locked packages");
		recommendations.push(
			"Run 'uv pip audit' or 'pip-audit' for vulnerability scanning",
		);
		recommendations.push("Use 'uv sync' to install exact locked versions");
		recommendations.push(
			"Commit uv.lock to version control for reproducible builds",
		);
	}
}
