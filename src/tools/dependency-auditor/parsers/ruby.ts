/**
 * Ruby Parser (Gemfile)
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

export class RubyGemfileParser extends BaseParser {
	private static deprecatedPackages: Record<string, DeprecatedPackageInfo> = {
		"coffee-rails": {
			reason: "CoffeeScript usage has declined",
			alternative: "Use modern JavaScript/TypeScript",
		},
		"sass-rails": {
			reason: "Consider Dart Sass",
			alternative: "Use sassc-rails or cssbundling-rails",
		},
		therubyracer: {
			reason: "No longer maintained, security issues",
			alternative: "Use mini_racer or execjs",
		},
		protected_attributes: {
			reason: "Deprecated in Rails 4+",
			alternative: "Use strong_parameters",
		},
		"rails-observers": {
			reason: "Extracted from Rails, consider alternatives",
			alternative: "Use ActiveSupport::Notifications or wisper",
		},
	};

	parse(content: string): ParseResult {
		const packages: PackageInfo[] = [];
		const errors: string[] = [];
		let currentGroup: string | undefined;

		try {
			for (const line of content.split("\n")) {
				const trimmed = line.trim();
				if (!trimmed || trimmed.startsWith("#")) continue;

				const groupMatch = trimmed.match(/group\s+:(\w+)/);
				if (groupMatch) {
					currentGroup = groupMatch[1];
					continue;
				}

				if (trimmed === "end") {
					currentGroup = undefined;
					continue;
				}

				const gemMatch = trimmed.match(
					/gem\s+['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/,
				);
				if (gemMatch) {
					const isDevDep =
						currentGroup === "development" || currentGroup === "test";
					packages.push({
						name: gemMatch[1],
						version: gemMatch[2] || "*",
						type: isDevDep ? "devDependencies" : "dependencies",
						ecosystem: "ruby",
					});
				}
			}
		} catch (error) {
			errors.push(
				`Error parsing Gemfile: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
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
			(content.includes("source ") && content.includes("gem ")) ||
			content.includes("gem '") ||
			content.includes('gem "')
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

		if (options.checkOutdated) {
			if (pkg.version === "*" || !pkg.version) {
				this.addIssue(
					issues,
					pkg,
					"Unpinned Version",
					"moderate",
					"No version constraint specified",
					"Pin to a specific version or use ~> constraints",
				);
			}
		}
	}

	protected addEcosystemRecommendations(recommendations: string[]): void {
		recommendations.push(
			"Run 'bundle audit' for security vulnerability scanning",
		);
		recommendations.push(
			"Run 'bundle outdated' to check for available updates",
		);
		recommendations.push("Consider using dependabot for automated updates");
	}
}
