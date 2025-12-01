/**
 * C++ Parser (vcpkg.json)
 */

import type {
	AnalysisOptions,
	EcosystemType,
	Issue,
	PackageFileType,
	PackageInfo,
	ParseResult,
} from "../types.js";
import { BaseParser } from "./base.js";

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

			if (manifest.dependencies && Array.isArray(manifest.dependencies)) {
				for (const dep of manifest.dependencies) {
					if (typeof dep === "string") {
						packages.push({
							name: dep,
							version: "*",
							type: "dependencies",
							ecosystem: "cpp",
						});
					} else if (typeof dep === "object" && dep.name) {
						packages.push({
							name: dep.name,
							version: dep["version>="] || dep.version || "*",
							type: "dependencies",
							ecosystem: "cpp",
							extras: dep.features,
						});
					}
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
		const trimmed = content.trim();
		if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return false;
		try {
			const parsed = JSON.parse(content);
			return (
				typeof parsed === "object" &&
				(parsed.dependencies !== undefined || parsed.name !== undefined) &&
				parsed.devDependencies === undefined
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
		if (options.checkOutdated && (pkg.version === "*" || !pkg.version)) {
			this.addIssue(
				issues,
				pkg,
				"Unpinned Version",
				"moderate",
				"No version constraint specified",
				"Pin to a specific version for reproducible builds",
			);
		}
	}

	protected addEcosystemRecommendations(recommendations: string[]): void {
		recommendations.push("Run 'vcpkg upgrade' to check for available updates");
		recommendations.push("Use vcpkg manifest mode for reproducible builds");
		recommendations.push("Consider using version constraints in vcpkg.json");
	}
}
