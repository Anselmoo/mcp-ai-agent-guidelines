/**
 * Project Scanner - Real Project Directory Scanner
 *
 * Scans project directories to extract structure, dependencies, frameworks, and configuration.
 * Used by project-onboarding to generate accurate, project-specific documentation.
 */

import { promises as fs } from "node:fs";
import * as path from "node:path";
import { ErrorCode } from "../shared/error-codes.js";
import { McpToolError } from "../shared/errors.js";
import { logger } from "../shared/logger.js";

/**
 * Project type classification
 */
export type ProjectType =
	| "typescript"
	| "javascript"
	| "python"
	| "go"
	| "rust"
	| "java"
	| "cpp"
	| "c"
	| "csharp"
	| "php"
	| "ruby"
	| "scala"
	| "kotlin"
	| "swift"
	| "objectivec"
	| "r"
	| "julia"
	| "haskell"
	| "lua"
	| "elixir"
	| "polyglot"
	| "unknown";

/**
 * Dependency information
 */
export interface Dependency {
	name: string;
	version: string;
	isDevDependency: boolean;
}

/**
 * Framework detection result
 */
export interface Framework {
	name: string;
	version?: string;
	confidence: "high" | "medium" | "low";
}

/**
 * Configuration file information
 */
export interface ConfigFile {
	name: string;
	path: string;
	type:
		| "json"
		| "yaml"
		| "yml"
		| "toml"
		| "xml"
		| "ini"
		| "properties"
		| "hcl"
		| "env"
		| "conf"
		| "cfg"
		| "other";
}

/**
 * Directory tree node
 */
export interface DirectoryNode {
	name: string;
	type: "file" | "directory";
	children?: DirectoryNode[];
}

/**
 * Scan options
 */
export interface ScanOptions {
	maxDepth?: number;
	includeNodeModules?: boolean;
	includeDotFiles?: boolean;
}

/**
 * Complete project structure
 */
export interface ProjectStructure {
	name: string;
	type: ProjectType;
	rootPath: string;
	entryPoints: string[];
	dependencies: Dependency[];
	devDependencies: Dependency[];
	scripts: Record<string, string>;
	frameworks: Framework[];
	configFiles: ConfigFile[];
	directoryStructure: DirectoryNode;
}

/**
 * ProjectScanner class - scans real project directories
 */
export class ProjectScanner {
	private readonly defaultOptions: ScanOptions = {
		maxDepth: 5,
		includeNodeModules: false,
		includeDotFiles: false,
	};

	/**
	 * Scan a project directory and extract structure
	 */
	async scan(
		projectPath: string,
		options?: ScanOptions,
	): Promise<ProjectStructure> {
		const opts = { ...this.defaultOptions, ...options };

		// Validate path exists
		await this.validatePath(projectPath);

		// Scan directory structure
		const directoryStructure = await this.scanDirectory(
			projectPath,
			0,
			opts,
			path.basename(projectPath),
		);

		// Find config files
		const configFiles = await this.findConfigFiles(projectPath);

		// Parse config files
		const packageJson = await this.parsePackageJson(projectPath);
		const tsconfigJson = await this.parseTsconfig(projectPath);

		// Detect project type and frameworks
		const type = this.detectProjectType(configFiles, packageJson);
		const frameworks = this.detectFrameworks(packageJson, configFiles);

		// Find entry points
		const entryPoints = await this.findEntryPoints(
			packageJson,
			tsconfigJson,
			configFiles,
			projectPath,
		);

		return {
			name:
				(packageJson?.name as string | undefined) ?? path.basename(projectPath),
			type,
			rootPath: projectPath,
			entryPoints,
			dependencies: this.extractDependencies(packageJson, false),
			devDependencies: this.extractDependencies(packageJson, true),
			scripts:
				(packageJson?.scripts as Record<string, string> | undefined) ?? {},
			frameworks,
			configFiles,
			directoryStructure,
		};
	}

	/**
	 * Validate that the path exists and is a directory
	 */
	private async validatePath(projectPath: string): Promise<void> {
		try {
			const stats = await fs.stat(projectPath);
			if (!stats.isDirectory()) {
				throw new McpToolError(
					ErrorCode.VALIDATION_FAILED,
					`Path is not a directory: ${projectPath}`,
					{ path: projectPath },
				);
			}
		} catch (error) {
			if (error instanceof McpToolError) {
				throw error;
			}
			throw new McpToolError(
				ErrorCode.FILE_NOT_FOUND,
				`Path does not exist: ${projectPath}`,
				{ path: projectPath, error: String(error) },
			);
		}
	}

	/**
	 * Recursively scan directory structure with depth limiting
	 */
	private async scanDirectory(
		dirPath: string,
		depth: number,
		options: ScanOptions,
		nodeName: string,
	): Promise<DirectoryNode> {
		const node: DirectoryNode = {
			name: nodeName,
			type: "directory",
			children: [],
		};

		// Stop if max depth reached
		if (depth >= (options.maxDepth ?? this.defaultOptions.maxDepth!)) {
			return node;
		}

		try {
			const entries = await fs.readdir(dirPath, { withFileTypes: true });

			for (const entry of entries) {
				// Skip node_modules unless explicitly included
				if (!options.includeNodeModules && entry.name === "node_modules") {
					continue;
				}

				// Skip dot files unless explicitly included
				if (!options.includeDotFiles && entry.name.startsWith(".")) {
					continue;
				}

				const fullPath = path.join(dirPath, entry.name);

				if (entry.isDirectory()) {
					const childNode = await this.scanDirectory(
						fullPath,
						depth + 1,
						options,
						entry.name,
					);
					node.children?.push(childNode);
				} else if (entry.isFile()) {
					node.children?.push({
						name: entry.name,
						type: "file",
					});
				}
			}
		} catch (error) {
			// Log error but don't fail the scan
			// This allows scanning to continue even if some directories are inaccessible
			logger.debug("Directory scan error", {
				path: dirPath,
				depth,
				error: error instanceof Error ? error.message : String(error),
			});
		}

		return node;
	}

	/**
	 * Find all configuration files in the project root
	 */
	private async findConfigFiles(projectPath: string): Promise<ConfigFile[]> {
		const configFiles: ConfigFile[] = [];
		const configPatterns = [
			{ pattern: "package.json", type: "json" as const },
			{ pattern: "tsconfig.json", type: "json" as const },
			{ pattern: "jsconfig.json", type: "json" as const },
			{ pattern: "babel.config.js", type: "other" as const },
			{ pattern: ".babelrc", type: "json" as const },
			{ pattern: "webpack.config.js", type: "other" as const },
			{ pattern: "vite.config.ts", type: "other" as const },
			{ pattern: "vitest.config.ts", type: "other" as const },
			{ pattern: "jest.config.js", type: "other" as const },
			{ pattern: ".eslintrc", type: "json" as const },
			{ pattern: ".prettierrc", type: "json" as const },
			{ pattern: "biome.json", type: "json" as const },
			{ pattern: "Cargo.toml", type: "toml" as const },
			{ pattern: "go.mod", type: "other" as const },
			{ pattern: "requirements.txt", type: "other" as const },
			{ pattern: "pyproject.toml", type: "toml" as const },
			{ pattern: "setup.py", type: "other" as const },
			{ pattern: "Gemfile", type: "other" as const },
			{ pattern: "pom.xml", type: "xml" as const },
			{ pattern: "build.gradle", type: "other" as const },
			{ pattern: ".gitignore", type: "other" as const },
			{ pattern: ".env", type: "env" as const },
			{ pattern: "docker-compose.yml", type: "yaml" as const },
			{ pattern: "Dockerfile", type: "other" as const },
		];

		for (const { pattern, type } of configPatterns) {
			const filePath = path.join(projectPath, pattern);
			try {
				await fs.access(filePath);
				configFiles.push({
					name: pattern,
					path: filePath,
					type,
				});
			} catch {
				// File doesn't exist, skip
			}
		}

		return configFiles;
	}

	/**
	 * Parse package.json if it exists
	 */
	private async parsePackageJson(
		projectPath: string,
	): Promise<Record<string, unknown> | null> {
		try {
			const content = await fs.readFile(
				path.join(projectPath, "package.json"),
				"utf-8",
			);
			return JSON.parse(content) as Record<string, unknown>;
		} catch {
			return null;
		}
	}

	/**
	 * Parse tsconfig.json if it exists
	 */
	private async parseTsconfig(
		projectPath: string,
	): Promise<Record<string, unknown> | null> {
		try {
			const content = await fs.readFile(
				path.join(projectPath, "tsconfig.json"),
				"utf-8",
			);
			// Remove comments from JSON (TypeScript config allows comments)
			const cleanContent = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, "");
			return JSON.parse(cleanContent) as Record<string, unknown>;
		} catch {
			return null;
		}
	}

	/**
	 * Detect project type based on config files and package.json
	 */
	private detectProjectType(
		configFiles: ConfigFile[],
		packageJson: Record<string, unknown> | null,
	): ProjectType {
		const fileNames = configFiles.map((f) => f.name);

		// Check for polyglot FIRST (multiple language indicators)
		const languageCount = [
			fileNames.includes("package.json") || fileNames.includes("tsconfig.json"),
			fileNames.includes("requirements.txt") ||
				fileNames.includes("pyproject.toml") ||
				fileNames.includes("setup.py"),
			fileNames.includes("Cargo.toml"),
			fileNames.includes("go.mod"),
			fileNames.includes("pom.xml") || fileNames.includes("build.gradle"),
			fileNames.includes("Gemfile"),
		].filter(Boolean).length;

		if (languageCount > 1) {
			return "polyglot";
		}

		// Check for TypeScript
		if (fileNames.includes("tsconfig.json")) {
			return "typescript";
		}

		// Check for JavaScript
		if (fileNames.includes("package.json")) {
			return "javascript";
		}

		// Check for Python
		if (
			fileNames.includes("requirements.txt") ||
			fileNames.includes("pyproject.toml") ||
			fileNames.includes("setup.py")
		) {
			return "python";
		}

		// Check for Rust
		if (fileNames.includes("Cargo.toml")) {
			return "rust";
		}

		// Check for Go
		if (fileNames.includes("go.mod")) {
			return "go";
		}

		// Check for Java
		if (fileNames.includes("pom.xml") || fileNames.includes("build.gradle")) {
			return "java";
		}

		// Check for Ruby
		if (fileNames.includes("Gemfile")) {
			return "ruby";
		}

		return "unknown";
	}

	/**
	 * Detect frameworks from package.json and config files
	 */
	private detectFrameworks(
		packageJson: Record<string, unknown> | null,
		configFiles: ConfigFile[],
	): Framework[] {
		const frameworks: Framework[] = [];

		if (!packageJson) {
			return frameworks;
		}

		const dependencies = {
			...(packageJson.dependencies as Record<string, string> | undefined),
			...(packageJson.devDependencies as Record<string, string> | undefined),
		};

		// React
		if (dependencies?.react) {
			frameworks.push({
				name: "React",
				version: dependencies.react,
				confidence: "high",
			});
		}

		// Next.js
		if (dependencies?.next) {
			frameworks.push({
				name: "Next.js",
				version: dependencies.next,
				confidence: "high",
			});
		}

		// Vue
		if (dependencies?.vue) {
			frameworks.push({
				name: "Vue",
				version: dependencies.vue,
				confidence: "high",
			});
		}

		// Nuxt
		if (dependencies?.nuxt) {
			frameworks.push({
				name: "Nuxt",
				version: dependencies.nuxt,
				confidence: "high",
			});
		}

		// Angular
		if (dependencies?.["@angular/core"]) {
			frameworks.push({
				name: "Angular",
				version: dependencies["@angular/core"],
				confidence: "high",
			});
		}

		// Svelte
		if (dependencies?.svelte) {
			frameworks.push({
				name: "Svelte",
				version: dependencies.svelte,
				confidence: "high",
			});
		}

		// Express
		if (dependencies?.express) {
			frameworks.push({
				name: "Express",
				version: dependencies.express,
				confidence: "high",
			});
		}

		// Fastify
		if (dependencies?.fastify) {
			frameworks.push({
				name: "Fastify",
				version: dependencies.fastify,
				confidence: "high",
			});
		}

		// NestJS
		if (dependencies?.["@nestjs/core"]) {
			frameworks.push({
				name: "NestJS",
				version: dependencies["@nestjs/core"],
				confidence: "high",
			});
		}

		// Vite
		if (
			dependencies?.vite ||
			configFiles.some((f) => f.name === "vite.config.ts")
		) {
			frameworks.push({
				name: "Vite",
				version: dependencies?.vite,
				confidence: "high",
			});
		}

		// Vitest
		if (
			dependencies?.vitest ||
			configFiles.some((f) => f.name === "vitest.config.ts")
		) {
			frameworks.push({
				name: "Vitest",
				version: dependencies?.vitest,
				confidence: "high",
			});
		}

		// Jest
		if (
			dependencies?.jest ||
			configFiles.some((f) => f.name === "jest.config.js")
		) {
			frameworks.push({
				name: "Jest",
				version: dependencies?.jest,
				confidence: "high",
			});
		}

		return frameworks;
	}

	/**
	 * Extract dependencies from package.json
	 */
	private extractDependencies(
		packageJson: Record<string, unknown> | null,
		isDevDependency: boolean,
	): Dependency[] {
		if (!packageJson) {
			return [];
		}

		const deps = isDevDependency
			? (packageJson.devDependencies as Record<string, string> | undefined)
			: (packageJson.dependencies as Record<string, string> | undefined);

		if (!deps) {
			return [];
		}

		return Object.entries(deps).map(([name, version]) => ({
			name,
			version,
			isDevDependency,
		}));
	}

	/**
	 * Find entry points based on package.json, tsconfig.json, and common patterns
	 */
	private async findEntryPoints(
		packageJson: Record<string, unknown> | null,
		tsconfigJson: Record<string, unknown> | null,
		configFiles: ConfigFile[],
		projectPath: string,
	): Promise<string[]> {
		const entryPoints: string[] = [];

		// Check package.json main field
		if (packageJson?.main && typeof packageJson.main === "string") {
			entryPoints.push(packageJson.main);
		}

		// Check package.json module field
		if (packageJson?.module && typeof packageJson.module === "string") {
			entryPoints.push(packageJson.module);
		}

		// Check package.json bin field
		if (packageJson?.bin) {
			if (typeof packageJson.bin === "string") {
				entryPoints.push(packageJson.bin);
			} else if (typeof packageJson.bin === "object") {
				entryPoints.push(
					...Object.values(packageJson.bin as Record<string, string>),
				);
			}
		}

		// Check tsconfig.json for entry points
		if (tsconfigJson?.compilerOptions) {
			const compilerOptions = tsconfigJson.compilerOptions as Record<
				string,
				unknown
			>;
			if (
				compilerOptions.outDir &&
				typeof compilerOptions.outDir === "string"
			) {
				// Add common entry patterns in output directory
				const outDir = compilerOptions.outDir;
				entryPoints.push(`${outDir}/index.js`);
			}
		}

		// Add common entry point patterns if nothing found yet
		if (entryPoints.length === 0) {
			const commonPatterns = [
				"src/index.ts",
				"src/index.js",
				"src/main.ts",
				"src/main.js",
				"src/app.ts",
				"src/app.js",
				"index.ts",
				"index.js",
				"main.ts",
				"main.js",
			];

			// Check which patterns actually exist
			for (const pattern of commonPatterns) {
				const fullPath = path.join(projectPath, pattern);
				try {
					await fs.access(fullPath);
					entryPoints.push(pattern);
					break; // Only add the first match
				} catch {
					// File doesn't exist, continue
				}
			}
		}

		return entryPoints;
	}
}

/**
 * Singleton instance for easy import
 */
export const projectScanner = new ProjectScanner();
