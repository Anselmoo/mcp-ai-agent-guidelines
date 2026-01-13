import { promises as fs } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type ConfigFile,
	type Framework,
	ProjectScanner,
	type ProjectStructure,
	projectScanner,
} from "../../../src/tools/bridge/project-scanner.js";
import { ErrorCode } from "../../../src/tools/shared/error-codes.js";
import { McpToolError } from "../../../src/tools/shared/errors.js";

// Mock fs module
vi.mock("node:fs", () => ({
	promises: {
		stat: vi.fn(),
		readdir: vi.fn(),
		readFile: vi.fn(),
		access: vi.fn(),
	},
}));

describe("ProjectScanner", () => {
	let scanner: ProjectScanner;

	beforeEach(() => {
		scanner = new ProjectScanner();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("singleton instance", () => {
		it("should export a singleton instance", () => {
			expect(projectScanner).toBeInstanceOf(ProjectScanner);
		});
	});

	describe("validatePath", () => {
		it("should validate a valid directory path", async () => {
			vi.mocked(fs.stat).mockResolvedValue({
				isDirectory: () => true,
			} as never);

			// Access private method for testing via type assertion
			await (scanner as never).validatePath("/valid/path");

			expect(fs.stat).toHaveBeenCalledWith("/valid/path");
		});

		it("should throw VALIDATION_FAILED for non-directory path", async () => {
			vi.mocked(fs.stat).mockResolvedValue({
				isDirectory: () => false,
			} as never);

			await expect(
				(scanner as never).validatePath("/file.txt"),
			).rejects.toThrow(McpToolError);

			try {
				await (scanner as never).validatePath("/file.txt");
			} catch (error) {
				expect(error).toBeInstanceOf(McpToolError);
				expect((error as McpToolError).code).toBe(ErrorCode.VALIDATION_FAILED);
			}
		});

		it("should throw FILE_NOT_FOUND for non-existent path", async () => {
			vi.mocked(fs.stat).mockRejectedValue(new Error("ENOENT"));

			await expect(
				(scanner as never).validatePath("/nonexistent"),
			).rejects.toThrow(McpToolError);

			try {
				await (scanner as never).validatePath("/nonexistent");
			} catch (error) {
				expect(error).toBeInstanceOf(McpToolError);
				expect((error as McpToolError).code).toBe(ErrorCode.FILE_NOT_FOUND);
			}
		});
	});

	describe("scanDirectory", () => {
		it("should scan directory and return structure", async () => {
			vi.mocked(fs.readdir).mockResolvedValue([
				{ name: "src", isDirectory: () => true, isFile: () => false },
				{ name: "index.ts", isDirectory: () => false, isFile: () => true },
			] as never);

			const result = await (scanner as never).scanDirectory(
				"/project",
				0,
				{ maxDepth: 5, includeNodeModules: false, includeDotFiles: false },
				"project",
			);

			expect(result.name).toBe("project");
			expect(result.type).toBe("directory");
			expect(result.children).toHaveLength(2);
			expect(result.children?.[0].name).toBe("src");
			expect(result.children?.[1].name).toBe("index.ts");
		});

		it("should respect maxDepth limit", async () => {
			vi.mocked(fs.readdir).mockResolvedValue([
				{ name: "nested", isDirectory: () => true, isFile: () => false },
			] as never);

			const result = await (scanner as never).scanDirectory(
				"/project",
				5,
				{ maxDepth: 5, includeNodeModules: false, includeDotFiles: false },
				"project",
			);

			expect(result.children).toEqual([]);
		});

		it("should skip node_modules by default", async () => {
			vi.mocked(fs.readdir).mockResolvedValue([
				{ name: "node_modules", isDirectory: () => true, isFile: () => false },
				{ name: "src", isDirectory: () => true, isFile: () => false },
			] as never);

			const result = await (scanner as never).scanDirectory(
				"/project",
				0,
				{ maxDepth: 5, includeNodeModules: false, includeDotFiles: false },
				"project",
			);

			expect(result.children).toHaveLength(1);
			expect(result.children?.[0].name).toBe("src");
		});

		it("should include node_modules when option is true", async () => {
			vi.mocked(fs.readdir).mockResolvedValue([
				{ name: "node_modules", isDirectory: () => true, isFile: () => false },
				{ name: "src", isDirectory: () => true, isFile: () => false },
			] as never);

			const result = await (scanner as never).scanDirectory(
				"/project",
				0,
				{ maxDepth: 5, includeNodeModules: true, includeDotFiles: false },
				"project",
			);

			expect(result.children).toHaveLength(2);
		});

		it("should skip dot files by default", async () => {
			vi.mocked(fs.readdir).mockResolvedValue([
				{ name: ".git", isDirectory: () => true, isFile: () => false },
				{ name: "src", isDirectory: () => true, isFile: () => false },
			] as never);

			const result = await (scanner as never).scanDirectory(
				"/project",
				0,
				{ maxDepth: 5, includeNodeModules: false, includeDotFiles: false },
				"project",
			);

			expect(result.children).toHaveLength(1);
			expect(result.children?.[0].name).toBe("src");
		});

		it("should include dot files when option is true", async () => {
			vi.mocked(fs.readdir).mockResolvedValue([
				{ name: ".git", isDirectory: () => true, isFile: () => false },
				{ name: "src", isDirectory: () => true, isFile: () => false },
			] as never);

			const result = await (scanner as never).scanDirectory(
				"/project",
				0,
				{ maxDepth: 5, includeNodeModules: false, includeDotFiles: true },
				"project",
			);

			expect(result.children).toHaveLength(2);
		});

		it("should handle readdir errors gracefully", async () => {
			vi.mocked(fs.readdir).mockRejectedValue(new Error("Permission denied"));

			const result = await (scanner as never).scanDirectory(
				"/project",
				0,
				{ maxDepth: 5, includeNodeModules: false, includeDotFiles: false },
				"project",
			);

			expect(result.children).toEqual([]);
		});
	});

	describe("findConfigFiles", () => {
		it("should find existing config files", async () => {
			vi.mocked(fs.access).mockImplementation(async (filePath) => {
				const pathStr = String(filePath);
				if (
					pathStr.includes("package.json") ||
					pathStr.includes("tsconfig.json")
				) {
					return;
				}
				throw new Error("ENOENT");
			});

			const result = await (scanner as never).findConfigFiles("/project");

			expect(result).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "package.json", type: "json" }),
					expect.objectContaining({ name: "tsconfig.json", type: "json" }),
				]),
			);
		});

		it("should return empty array if no config files exist", async () => {
			vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));

			const result = await (scanner as never).findConfigFiles("/project");

			expect(result).toEqual([]);
		});
	});

	describe("parsePackageJson", () => {
		it("should parse valid package.json", async () => {
			const packageContent = JSON.stringify({
				name: "test-project",
				version: "1.0.0",
				dependencies: { react: "^18.0.0" },
			});

			vi.mocked(fs.readFile).mockResolvedValue(packageContent);

			const result = await (scanner as never).parsePackageJson("/project");

			expect(result).toEqual({
				name: "test-project",
				version: "1.0.0",
				dependencies: { react: "^18.0.0" },
			});
		});

		it("should return null for non-existent package.json", async () => {
			vi.mocked(fs.readFile).mockRejectedValue(new Error("ENOENT"));

			const result = await (scanner as never).parsePackageJson("/project");

			expect(result).toBeNull();
		});

		it("should return null for invalid JSON", async () => {
			vi.mocked(fs.readFile).mockResolvedValue("invalid json");

			const result = await (scanner as never).parsePackageJson("/project");

			expect(result).toBeNull();
		});
	});

	describe("parseTsconfig", () => {
		it("should parse valid tsconfig.json", async () => {
			const tsconfigContent = JSON.stringify({
				compilerOptions: {
					target: "ES2020",
					outDir: "./dist",
				},
			});

			vi.mocked(fs.readFile).mockResolvedValue(tsconfigContent);

			const result = await (scanner as never).parseTsconfig("/project");

			expect(result).toEqual({
				compilerOptions: {
					target: "ES2020",
					outDir: "./dist",
				},
			});
		});

		it("should handle tsconfig with comments", async () => {
			const tsconfigContent = `{
				// This is a comment
				"compilerOptions": {
					/* Block comment */
					"target": "ES2020"
				}
			}`;

			vi.mocked(fs.readFile).mockResolvedValue(tsconfigContent);

			const result = await (scanner as never).parseTsconfig("/project");

			expect(result).toEqual({
				compilerOptions: {
					target: "ES2020",
				},
			});
		});

		it("should return null for non-existent tsconfig.json", async () => {
			vi.mocked(fs.readFile).mockRejectedValue(new Error("ENOENT"));

			const result = await (scanner as never).parseTsconfig("/project");

			expect(result).toBeNull();
		});
	});

	describe("detectProjectType", () => {
		it("should detect TypeScript project", () => {
			const configFiles: ConfigFile[] = [
				{ name: "tsconfig.json", path: "/project/tsconfig.json", type: "json" },
			];

			const result = (scanner as never).detectProjectType(configFiles);

			expect(result).toBe("typescript");
		});

		it("should detect JavaScript project", () => {
			const configFiles: ConfigFile[] = [
				{ name: "package.json", path: "/project/package.json", type: "json" },
			];

			const result = (scanner as never).detectProjectType(configFiles);

			expect(result).toBe("javascript");
		});

		it("should detect Python project", () => {
			const configFiles: ConfigFile[] = [
				{
					name: "requirements.txt",
					path: "/project/requirements.txt",
					type: "other",
				},
			];

			const result = (scanner as never).detectProjectType(configFiles);

			expect(result).toBe("python");
		});

		it("should detect Rust project", () => {
			const configFiles: ConfigFile[] = [
				{ name: "Cargo.toml", path: "/project/Cargo.toml", type: "toml" },
			];

			const result = (scanner as never).detectProjectType(configFiles);

			expect(result).toBe("rust");
		});

		it("should detect Go project", () => {
			const configFiles: ConfigFile[] = [
				{ name: "go.mod", path: "/project/go.mod", type: "other" },
			];

			const result = (scanner as never).detectProjectType(configFiles);

			expect(result).toBe("go");
		});

		it("should detect Java project", () => {
			const configFiles: ConfigFile[] = [
				{ name: "pom.xml", path: "/project/pom.xml", type: "xml" },
			];

			const result = (scanner as never).detectProjectType(configFiles);

			expect(result).toBe("java");
		});

		it("should detect polyglot project", () => {
			const configFiles: ConfigFile[] = [
				{ name: "package.json", path: "/project/package.json", type: "json" },
				{
					name: "requirements.txt",
					path: "/project/requirements.txt",
					type: "other",
				},
			];

			const result = (scanner as never).detectProjectType(configFiles);

			expect(result).toBe("polyglot");
		});

		it("should return unknown for unrecognized project", () => {
			const configFiles: ConfigFile[] = [];

			const result = (scanner as never).detectProjectType(configFiles);

			expect(result).toBe("unknown");
		});
	});

	describe("detectFrameworks", () => {
		it("should detect React", () => {
			const packageJson = {
				dependencies: { react: "^18.0.0" },
			};

			const result = (scanner as never).detectFrameworks(packageJson, []);

			expect(result).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "React", confidence: "high" }),
				]),
			);
		});

		it("should detect Next.js", () => {
			const packageJson = {
				dependencies: { next: "^14.0.0", react: "^18.0.0" },
			};

			const result: Framework[] = (scanner as never).detectFrameworks(
				packageJson,
				[],
			);

			expect(result).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "Next.js", confidence: "high" }),
					expect.objectContaining({ name: "React", confidence: "high" }),
				]),
			);
		});

		it("should detect Vue", () => {
			const packageJson = {
				dependencies: { vue: "^3.0.0" },
			};

			const result = (scanner as never).detectFrameworks(packageJson, []);

			expect(result).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "Vue", confidence: "high" }),
				]),
			);
		});

		it("should detect Angular", () => {
			const packageJson = {
				dependencies: { "@angular/core": "^17.0.0" },
			};

			const result = (scanner as never).detectFrameworks(packageJson, []);

			expect(result).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "Angular", confidence: "high" }),
				]),
			);
		});

		it("should detect Express", () => {
			const packageJson = {
				dependencies: { express: "^4.18.0" },
			};

			const result = (scanner as never).detectFrameworks(packageJson, []);

			expect(result).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "Express", confidence: "high" }),
				]),
			);
		});

		it("should detect Vite from dependencies", () => {
			const packageJson = {
				devDependencies: { vite: "^5.0.0" },
			};

			const result = (scanner as never).detectFrameworks(packageJson, []);

			expect(result).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "Vite", confidence: "high" }),
				]),
			);
		});

		it("should detect Vite from config file", () => {
			const packageJson = {};
			const configFiles: ConfigFile[] = [
				{
					name: "vite.config.ts",
					path: "/project/vite.config.ts",
					type: "other",
				},
			];

			const result = (scanner as never).detectFrameworks(
				packageJson,
				configFiles,
			);

			expect(result).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "Vite", confidence: "high" }),
				]),
			);
		});

		it("should detect Vitest", () => {
			const packageJson = {
				devDependencies: { vitest: "^1.0.0" },
			};
			const configFiles: ConfigFile[] = [
				{
					name: "vitest.config.ts",
					path: "/project/vitest.config.ts",
					type: "other",
				},
			];

			const result = (scanner as never).detectFrameworks(
				packageJson,
				configFiles,
			);

			expect(result).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ name: "Vitest", confidence: "high" }),
				]),
			);
		});

		it("should return empty array for null package.json", () => {
			const result = (scanner as never).detectFrameworks(null, []);

			expect(result).toEqual([]);
		});
	});

	describe("extractDependencies", () => {
		it("should extract regular dependencies", () => {
			const packageJson = {
				dependencies: {
					react: "^18.0.0",
					"react-dom": "^18.0.0",
				},
			};

			const result = (scanner as never).extractDependencies(packageJson, false);

			expect(result).toHaveLength(2);
			expect(result).toEqual(
				expect.arrayContaining([
					{ name: "react", version: "^18.0.0", isDevDependency: false },
					{ name: "react-dom", version: "^18.0.0", isDevDependency: false },
				]),
			);
		});

		it("should extract dev dependencies", () => {
			const packageJson = {
				devDependencies: {
					typescript: "^5.0.0",
					vitest: "^1.0.0",
				},
			};

			const result = (scanner as never).extractDependencies(packageJson, true);

			expect(result).toHaveLength(2);
			expect(result).toEqual(
				expect.arrayContaining([
					{ name: "typescript", version: "^5.0.0", isDevDependency: true },
					{ name: "vitest", version: "^1.0.0", isDevDependency: true },
				]),
			);
		});

		it("should return empty array for null package.json", () => {
			const result = (scanner as never).extractDependencies(null, false);

			expect(result).toEqual([]);
		});

		it("should return empty array if dependencies field is missing", () => {
			const packageJson = { name: "test" };

			const result = (scanner as never).extractDependencies(packageJson, false);

			expect(result).toEqual([]);
		});
	});

	describe("findEntryPoints", () => {
		it("should find entry point from package.json main field", async () => {
			const packageJson = { main: "dist/index.js" };

			const result = await (scanner as never).findEntryPoints(
				packageJson,
				null,
				[],
				"/project",
			);

			expect(result).toContain("dist/index.js");
		});

		it("should find entry point from package.json module field", async () => {
			const packageJson = { module: "dist/index.mjs" };

			const result = await (scanner as never).findEntryPoints(
				packageJson,
				null,
				[],
				"/project",
			);

			expect(result).toContain("dist/index.mjs");
		});

		it("should find entry point from package.json bin field (string)", async () => {
			const packageJson = { bin: "./cli.js" };

			const result = await (scanner as never).findEntryPoints(
				packageJson,
				null,
				[],
				"/project",
			);

			expect(result).toContain("./cli.js");
		});

		it("should find entry points from package.json bin field (object)", async () => {
			const packageJson = {
				bin: {
					cli: "./bin/cli.js",
					server: "./bin/server.js",
				},
			};

			const result = await (scanner as never).findEntryPoints(
				packageJson,
				null,
				[],
				"/project",
			);

			expect(result).toContain("./bin/cli.js");
			expect(result).toContain("./bin/server.js");
		});

		it("should use common patterns if no specific entry points found", async () => {
			// Mock fs.access to simulate file existence check
			vi.mocked(fs.access).mockImplementation(async (filePath) => {
				const pathStr = String(filePath);
				// Only src/index.ts exists
				if (pathStr.includes("src/index.ts")) {
					return;
				}
				throw new Error("ENOENT");
			});

			const result = await (scanner as never).findEntryPoints(
				null,
				null,
				"/project",
			);

			expect(result).toContain("src/index.ts");
			expect(result.length).toBe(1);
		});

		it("should return empty array if no entry points exist", async () => {
			// Mock fs.access to reject all files
			vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));

			const result = await (scanner as never).findEntryPoints(
				null,
				null,
				"/project",
			);

			expect(result).toEqual([]);
		});
	});

	describe("scan integration", () => {
		it("should perform full project scan", async () => {
			// Mock file system
			vi.mocked(fs.stat).mockResolvedValue({
				isDirectory: () => true,
			} as never);

			vi.mocked(fs.readdir).mockResolvedValue([
				{ name: "src", isDirectory: () => true, isFile: () => false },
				{ name: "package.json", isDirectory: () => false, isFile: () => true },
			] as never);

			vi.mocked(fs.access).mockImplementation(async (filePath) => {
				const pathStr = String(filePath);
				if (pathStr.includes("package.json")) {
					return;
				}
				throw new Error("ENOENT");
			});

			const packageContent = JSON.stringify({
				name: "test-project",
				version: "1.0.0",
				main: "dist/index.js",
				dependencies: { react: "^18.0.0", express: "^4.18.0" },
				devDependencies: { typescript: "^5.0.0" },
				scripts: {
					build: "tsc",
					test: "vitest",
				},
			});

			vi.mocked(fs.readFile).mockResolvedValue(packageContent);

			const result: ProjectStructure = await scanner.scan("/test/project");

			expect(result.name).toBe("test-project");
			expect(result.type).toBe("javascript");
			expect(result.rootPath).toBe("/test/project");
			expect(result.dependencies).toHaveLength(2);
			expect(result.devDependencies).toHaveLength(1);
			expect(result.scripts).toHaveProperty("build");
			expect(result.frameworks.length).toBeGreaterThan(0);
			expect(result.entryPoints).toContain("dist/index.js");
			expect(result.directoryStructure.type).toBe("directory");
		});

		it("should handle minimal project without package.json", async () => {
			vi.mocked(fs.stat).mockResolvedValue({
				isDirectory: () => true,
			} as never);

			vi.mocked(fs.readdir).mockResolvedValue([
				{ name: "src", isDirectory: () => true, isFile: () => false },
			] as never);

			vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));
			vi.mocked(fs.readFile).mockRejectedValue(new Error("ENOENT"));

			const result = await scanner.scan("/test/project");

			expect(result.name).toBe("project");
			expect(result.type).toBe("unknown");
			expect(result.dependencies).toEqual([]);
			expect(result.devDependencies).toEqual([]);
			expect(result.scripts).toEqual({});
		});

		it("should respect scan options", async () => {
			vi.mocked(fs.stat).mockResolvedValue({
				isDirectory: () => true,
			} as never);

			vi.mocked(fs.readdir).mockResolvedValue([
				{ name: ".git", isDirectory: () => true, isFile: () => false },
				{ name: "node_modules", isDirectory: () => true, isFile: () => false },
				{ name: "src", isDirectory: () => true, isFile: () => false },
			] as never);

			vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));
			vi.mocked(fs.readFile).mockRejectedValue(new Error("ENOENT"));

			const result = await scanner.scan("/test/project", {
				maxDepth: 2,
				includeNodeModules: true,
				includeDotFiles: true,
			});

			expect(result.directoryStructure.children).toHaveLength(3);
		});
	});
});
