/**
 * Lua Parser (rockspec)
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

export class LuaRockspecParser extends BaseParser {
	parse(content: string): ParseResult {
		const packages: PackageInfo[] = [];
		const errors: string[] = [];
		let projectName: string | undefined;
		let projectVersion: string | undefined;

		try {
			const packageMatch = content.match(/package\s*=\s*["']([^"']+)["']/);
			const versionMatch = content.match(/version\s*=\s*["']([^"']+)["']/);
			if (packageMatch) projectName = packageMatch[1];
			if (versionMatch) projectVersion = versionMatch[1];

			const depsMatch = content.match(/dependencies\s*=\s*\{([\s\S]*?)\}/);
			if (depsMatch) {
				const depMatches = depsMatch[1].matchAll(/["']([^"']+)["']/g);
				for (const match of depMatches) {
					const parsed = this.parseLuaDependency(match[1]);
					if (parsed) packages.push(parsed);
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

	private parseLuaDependency(spec: string): PackageInfo | null {
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
		if (content.includes("rockspec_format")) return true;
		const hasLuaPackage = /package\s*=\s*["'][^"']+["']/.test(content);
		const hasLuaVersion = /version\s*=\s*["'][\d.]+-\d+["']/.test(content);
		return hasLuaPackage && (hasLuaVersion || content.includes("source = {"));
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
		if (options.checkOutdated && (pkg.version === "*" || !pkg.version)) {
			this.addIssue(
				issues,
				pkg,
				"Unpinned Version",
				"moderate",
				"No version constraint specified",
				"Use specific version constraints for production",
			);
		}
	}

	protected addEcosystemRecommendations(recommendations: string[]): void {
		recommendations.push("Run 'luarocks list --outdated' to check for updates");
		recommendations.push("Use specific version constraints for production");
		recommendations.push("Consider using luarocks-admin for private rocks");
	}
}
