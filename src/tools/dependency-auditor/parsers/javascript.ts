/**
 * JavaScript/TypeScript Parser (package.json)
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
import { BaseParser } from "./base.js";

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
		const trimmed = content.trim();
		if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
			return false;
		}
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

		if (options.checkVulnerabilities) {
			this.checkKnownVulnerabilities(pkg, issues);
		}

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

	private checkVersionPattern(version: string): {
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

// Alias for backward compatibility
export const JsParser = JavaScriptParser;
