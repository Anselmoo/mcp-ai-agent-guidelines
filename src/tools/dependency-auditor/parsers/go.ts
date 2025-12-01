/**
 * Go Parser (go.mod)
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
		"github.com/go-kit/kit": {
			reason: "Consider newer alternatives",
			alternative: "Evaluate go-micro or kratos",
		},
	};

	parse(content: string): ParseResult {
		const packages: PackageInfo[] = [];
		const errors: string[] = [];
		let projectName: string | undefined;
		let projectVersion: string | undefined;

		try {
			const moduleMatch = content.match(/module\s+([^\s\n]+)/);
			if (moduleMatch) projectName = moduleMatch[1];

			const goVersionMatch = content.match(/go\s+([\d.]+)/);
			if (goVersionMatch) projectVersion = `go${goVersionMatch[1]}`;

			const requireBlock = content.match(/require\s*\(([\s\S]*?)\)/);
			if (requireBlock) {
				const lines = requireBlock[1].split("\n");
				for (const line of lines) {
					const match = line.trim().match(/^([^\s]+)\s+(v[\d.]+[^\s]*)/);
					if (match) {
						const isIndirect = line.includes("// indirect");
						packages.push({
							name: match[1],
							version: match[2],
							type: isIndirect ? "optionalDependencies" : "dependencies",
							ecosystem: "go",
						});
					}
				}
			}

			const singleRequires = content.matchAll(
				/require\s+([^\s]+)\s+(v[\d.]+[^\s]*)/g,
			);
			for (const match of singleRequires) {
				if (!packages.some((p) => p.name === match[1])) {
					packages.push({
						name: match[1],
						version: match[2],
						type: "dependencies",
						ecosystem: "go",
					});
				}
			}
		} catch (error) {
			errors.push(
				`Error parsing go.mod: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
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

		if (options.checkVulnerabilities)
			this.checkKnownVulnerabilities(pkg, issues);
	}

	private checkKnownVulnerabilities(pkg: PackageInfo, issues: Issue[]): void {
		if (
			pkg.name === "golang.org/x/crypto" &&
			pkg.version.match(/v0\.(0|1[0-6])\./)
		) {
			this.addIssue(
				issues,
				pkg,
				"Known Vulnerabilities",
				"high",
				"Older golang.org/x/crypto versions have security vulnerabilities",
				"Update to latest version",
			);
		}
		if (
			pkg.name === "golang.org/x/net" &&
			pkg.version.match(/v0\.(0|1[0-7])\./)
		) {
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
