/**
 * Rust Parser (Cargo.toml)
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
			const packageMatch = content.match(/\[package\]([\s\S]*?)(?=\n\[|$)/);
			if (packageMatch) {
				const nameMatch = packageMatch[1].match(/name\s*=\s*["']([^"']+)["']/);
				const versionMatch = packageMatch[1].match(
					/version\s*=\s*["']([^"']+)["']/,
				);
				if (nameMatch) projectName = nameMatch[1];
				if (versionMatch) projectVersion = versionMatch[1];
			}

			const depsMatch = content.match(/\[dependencies\]([\s\S]*?)(?=\n\[|$)/);
			if (depsMatch)
				this.parseDependencySection(depsMatch[1], "dependencies", packages);

			const devDepsMatch = content.match(
				/\[dev-dependencies\]([\s\S]*?)(?=\n\[|$)/,
			);
			if (devDepsMatch)
				this.parseDependencySection(
					devDepsMatch[1],
					"devDependencies",
					packages,
				);

			const buildDepsMatch = content.match(
				/\[build-dependencies\]([\s\S]*?)(?=\n\[|$)/,
			);
			if (buildDepsMatch)
				this.parseDependencySection(
					buildDepsMatch[1],
					"buildDependencies",
					packages,
				);
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
		for (const line of content.split("\n")) {
			if (!line.trim() || line.trim().startsWith("#")) continue;

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

		if (options.checkOutdated) {
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

		if (options.checkVulnerabilities)
			this.checkKnownVulnerabilities(pkg, issues);
	}

	private checkKnownVulnerabilities(pkg: PackageInfo, issues: Issue[]): void {
		if (pkg.name === "regex" && pkg.version.match(/^[01]\.[0-7]\./)) {
			this.addIssue(
				issues,
				pkg,
				"Known Vulnerabilities",
				"moderate",
				"Older regex versions may have ReDoS vulnerabilities",
				"Update to regex >= 1.8.0",
			);
		}
		if (pkg.name === "chrono" && pkg.version.match(/^0\.[0-3]\./)) {
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

	protected addEcosystemRecommendations(recommendations: string[]): void {
		recommendations.push(
			"Run 'cargo audit' for security vulnerability scanning",
		);
		recommendations.push("Run 'cargo outdated' to check for available updates");
		recommendations.push("Consider using cargo-deny for policy enforcement");
		recommendations.push("Use dependabot or renovate for automated updates");
	}
}
