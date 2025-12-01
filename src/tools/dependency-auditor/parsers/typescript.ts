/**
 * TypeScript Parser (tsconfig.json)
 *
 * Parses tsconfig.json files to extract type definition references,
 * project references, and analyze TypeScript configuration for best practices.
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

interface TsConfigCompilerOptions {
	types?: string[];
	typeRoots?: string[];
	lib?: string[];
	target?: string;
	module?: string;
	moduleResolution?: string;
	strict?: boolean;
	noImplicitAny?: boolean;
	skipLibCheck?: boolean;
	esModuleInterop?: boolean;
	allowSyntheticDefaultImports?: boolean;
	declaration?: boolean;
	declarationMap?: boolean;
	sourceMap?: boolean;
	outDir?: string;
	rootDir?: string;
	baseUrl?: string;
	paths?: Record<string, string[]>;
}

interface TsConfigReference {
	path: string;
}

interface TsConfig {
	compilerOptions?: TsConfigCompilerOptions;
	include?: string[];
	exclude?: string[];
	extends?: string;
	references?: TsConfigReference[];
	files?: string[];
}

export class TypeScriptConfigParser extends BaseParser {
	parse(content: string): ParseResult {
		const packages: PackageInfo[] = [];
		const errors: string[] = [];

		try {
			const config: TsConfig = JSON.parse(content);

			// Extract type definitions from compilerOptions.types
			if (config.compilerOptions?.types) {
				for (const typeDef of config.compilerOptions.types) {
					packages.push({
						name: typeDef.startsWith("@types/") ? typeDef : `@types/${typeDef}`,
						version: "*",
						type: "devDependencies",
						ecosystem: "typescript",
					});
				}
			}

			// Extract project references
			if (config.references) {
				for (const ref of config.references) {
					packages.push({
						name: ref.path,
						version: "local",
						type: "dependencies",
						ecosystem: "typescript",
						source: "project-reference",
					});
				}
			}

			// Extract extended configs
			if (config.extends) {
				const extendsName = config.extends;
				packages.push({
					name: extendsName,
					version: "*",
					type: "devDependencies",
					ecosystem: "typescript",
					source: "extends",
				});
			}
		} catch (error) {
			errors.push(
				`Invalid tsconfig.json: ${error instanceof Error ? error.message : "Unknown error"}`,
			);
		}

		return {
			packages,
			ecosystem: "typescript",
			fileType: "tsconfig.json",
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
			// Check for tsconfig-specific fields
			return (
				typeof parsed === "object" &&
				(parsed.compilerOptions !== undefined ||
					parsed.extends !== undefined ||
					parsed.references !== undefined ||
					parsed.include !== undefined ||
					parsed.exclude !== undefined ||
					parsed.files !== undefined)
			);
		} catch {
			return false;
		}
	}

	getEcosystem(): EcosystemType {
		return "typescript";
	}

	getFileTypes(): PackageFileType[] {
		return ["tsconfig.json"];
	}

	protected analyzePackage(
		pkg: PackageInfo,
		options: AnalysisOptions,
		issues: Issue[],
	): void {
		// Skip local project references
		if (pkg.source === "project-reference") return;

		if (options.checkDeprecated) {
			this.checkDeprecatedTypes(pkg, issues);
		}

		if (options.checkOutdated) {
			this.checkOutdatedPatterns(pkg, issues);
		}
	}

	private checkDeprecatedTypes(pkg: PackageInfo, issues: Issue[]): void {
		// Check for deprecated type definitions
		const deprecatedTypes: Record<string, string> = {
			"@types/node-fetch": "Use native fetch in Node.js 18+",
			"@types/express-serve-static-core": "Included in @types/express",
			"@types/glob": "glob@8+ includes TypeScript types",
			"@types/rimraf": "rimraf@4+ includes TypeScript types",
		};

		const deprecated = deprecatedTypes[pkg.name];
		if (deprecated) {
			this.addIssue(
				issues,
				pkg,
				"Deprecated Package",
				"moderate",
				`Type definition may be unnecessary: ${deprecated}`,
				"Remove from types array if not needed",
			);
		}
	}

	private checkOutdatedPatterns(pkg: PackageInfo, issues: Issue[]): void {
		// Check for outdated extends patterns
		if (pkg.source === "extends") {
			const outdatedExtends: Record<string, string> = {
				"@tsconfig/node12": "Node.js 12 is EOL. Use @tsconfig/node18 or later",
				"@tsconfig/node14": "Node.js 14 is EOL. Use @tsconfig/node18 or later",
				"@tsconfig/node16": "Consider upgrading to @tsconfig/node18 or later",
			};

			const outdated = outdatedExtends[pkg.name];
			if (outdated) {
				this.addIssue(
					issues,
					pkg,
					"Outdated Pattern",
					"moderate",
					outdated,
					"Update extends to use a supported Node.js version",
				);
			}
		}
	}

	protected analyzeEcosystemSpecific(
		parseResult: ParseResult,
		options: AnalysisOptions,
		_issues: Issue[],
	): void {
		// For TypeScript, we can also analyze the config itself
		if (options.checkOutdated) {
			// Check for missing strict mode
			const hasStrictTypes = parseResult.packages.some(
				(pkg) =>
					pkg.name === "@types/node" || pkg.name.startsWith("@tsconfig/"),
			);
			if (parseResult.packages.length > 0 && !hasStrictTypes) {
				// This is informational, not a package-level issue
			}
		}
	}

	protected addEcosystemRecommendations(recommendations: string[]): void {
		recommendations.push("Run 'tsc --noEmit' to check for type errors");
		recommendations.push("Consider enabling strict mode in compilerOptions");
		recommendations.push("Use project references for large monorepo projects");
		recommendations.push("Run 'npx depcheck' to find unused type definitions");
	}
}

// Alias for backward compatibility
export const TsConfigParser = TypeScriptConfigParser;
