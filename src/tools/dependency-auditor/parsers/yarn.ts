/**
 * Yarn Lock Parser (yarn.lock)
 *
 * Parses yarn.lock files in both v1 and v2 formats.
 * V1 uses a custom format, V2 uses YAML-like syntax.
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

export class YarnLockParser extends BaseParser {
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

	parse(content: string): ParseResult {
		const packages: PackageInfo[] = [];
		const errors: string[] = [];
		const seenPackages = new Set<string>();

		try {
			// Detect version
			const isV1 = content.includes("# yarn lockfile v1");
			const isV2 =
				content.includes("__metadata:") || content.includes("resolution:");

			if (isV1) {
				this.parseV1(content, packages, seenPackages);
			} else if (isV2) {
				this.parseV2(content, packages, seenPackages);
			} else {
				// Try V1 format as default
				this.parseV1(content, packages, seenPackages);
			}
		} catch (error) {
			errors.push(
				`Error parsing yarn.lock: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}

		return {
			packages,
			ecosystem: "javascript",
			fileType: "yarn.lock",
			errors: errors.length > 0 ? errors : undefined,
		};
	}

	private parseV1(
		content: string,
		packages: PackageInfo[],
		seenPackages: Set<string>,
	): void {
		// V1 format: package@version: followed by indented properties
		const blocks = content.split(/\n(?=[^\s#])/);

		for (const block of blocks) {
			if (!block.trim() || block.startsWith("#")) continue;

			// Simplified pattern to avoid ReDoS - match first package name only
			const headerMatch = block.match(/^["']?([^@\s]+)@[^:\s]+/);
			if (!headerMatch) continue;

			// Verify it ends with a colon (package definition)
			const firstLine = block.split("\n")[0];
			if (!firstLine.endsWith(":")) continue;

			const packageName = headerMatch[1];
			const versionMatch = block.match(/^\s*version\s+["']([^"']+)["']/m);
			const version = versionMatch ? versionMatch[1] : "*";

			const packageKey = `${packageName}@${version}`;
			if (seenPackages.has(packageKey)) continue;
			seenPackages.add(packageKey);

			packages.push({
				name: packageName,
				version,
				type: "dependencies",
				ecosystem: "javascript",
			});
		}
	}

	private parseV2(
		content: string,
		packages: PackageInfo[],
		seenPackages: Set<string>,
	): void {
		// V2 format: "package@npm:^version" entries with resolution field
		const lines = content.split("\n");
		let currentPackage: string | null = null;
		let currentVersion: string | null = null;

		for (const line of lines) {
			// Skip metadata and comments
			if (line.startsWith("__metadata:") || line.startsWith("#")) continue;

			// Simplified pattern to avoid ReDoS - match first package name only
			// Must end with : and contain @npm: or just @
			if (line.endsWith(":") && line.includes("@")) {
				const headerMatch = line.match(/^["']?([^@\s]+)@/);
				if (headerMatch) {
					currentPackage = headerMatch[1];
					currentVersion = null;
					continue;
				}
			}

			// Match version field
			if (currentPackage) {
				const versionMatch = line.match(/^\s*version:\s*["']?([^"'\s]+)["']?/);
				if (versionMatch) {
					currentVersion = versionMatch[1];

					const packageKey = `${currentPackage}@${currentVersion}`;
					if (!seenPackages.has(packageKey)) {
						seenPackages.add(packageKey);
						packages.push({
							name: currentPackage,
							version: currentVersion,
							type: "dependencies",
							ecosystem: "javascript",
						});
					}
					currentPackage = null;
					currentVersion = null;
				}
			}
		}
	}

	canParse(content: string): boolean {
		// Check for yarn.lock v1 header
		if (content.includes("# yarn lockfile v1")) return true;

		// Check for yarn.lock v2 markers
		if (content.includes("__metadata:")) return true;

		// Check for common yarn.lock patterns
		const hasVersionField = /^\s*version\s+["'][^"']+["']/m.test(content);
		const hasResolvedField = /^\s*resolved\s+["'][^"']+["']/m.test(content);
		const hasPackagePattern = /^["']?[^@\s]+@[^:]+["']?:/m.test(content);

		return hasPackagePattern && (hasVersionField || hasResolvedField);
	}

	getEcosystem(): EcosystemType {
		return "javascript";
	}

	getFileTypes(): PackageFileType[] {
		return ["yarn.lock"];
	}

	protected analyzePackage(
		pkg: PackageInfo,
		options: AnalysisOptions,
		issues: Issue[],
	): void {
		const pattern = this.checkVersionPattern(pkg.version);

		if (options.checkOutdated) {
			if (pattern.isPreRelease) {
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

		if (options.checkDeprecated) {
			const deprecated = YarnLockParser.deprecatedPackages[pkg.name];
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
	}

	private checkVersionPattern(version: string): {
		isPreRelease: boolean;
	} {
		return {
			isPreRelease: /^0\.[0-9]+\.[0-9]+/.test(version),
		};
	}

	private checkKnownVulnerabilities(pkg: PackageInfo, issues: Issue[]): void {
		// Lodash vulnerabilities
		if (pkg.name === "lodash") {
			if (
				pkg.version.match(/^[0-3]\./) ||
				pkg.version.match(/^4\.(0|1[0-6]|17\.(0|1[0-9]|20))($|[^\d])/)
			) {
				this.addIssue(
					issues,
					pkg,
					"Known Vulnerabilities",
					"moderate",
					"Lodash versions below 4.17.21 have known security vulnerabilities",
					"Update to lodash@4.17.21 or use lodash-es",
				);
			}
		}

		// Moment.js deprecation
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

		// Axios vulnerabilities
		if (pkg.name === "axios") {
			if (pkg.version.match(/^0\./) || pkg.version.match(/^1\.[0-5]($|\.)/)) {
				this.addIssue(
					issues,
					pkg,
					"Known Vulnerabilities",
					"high",
					"Axios versions below 1.6.0 have known security vulnerabilities",
					"Update to axios@1.6.0 or later",
				);
			}
		}
	}

	protected addEcosystemRecommendations(recommendations: string[]): void {
		recommendations.push(
			"Run 'yarn audit' for detailed vulnerability analysis",
		);
		recommendations.push("Run 'yarn outdated' to check for latest versions");
		recommendations.push("Run 'yarn upgrade-interactive' for guided updates");
		recommendations.push(
			"Consider using 'yarn dedupe' to reduce duplicate packages",
		);
	}
}
