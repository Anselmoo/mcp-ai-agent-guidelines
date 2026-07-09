import { beforeEach, describe, expect, it, vi } from "vitest";
import { CodebaseScanner } from "../../memory/coherence-scanner.js";

const globMock = vi.hoisted(() => vi.fn());

vi.mock("fast-glob", () => ({
	default: {
		glob: globMock,
	},
}));

describe("CodebaseScanner extra branches", () => {
	beforeEach(() => {
		globMock.mockReset();
	});

	it("uses skillIdSource fallback when skillFiles glob returns empty array", async () => {
		globMock.mockImplementation(async (pattern: string | string[]) => {
			if (
				Array.isArray(pattern) &&
				pattern.includes("src/skills/skill-specs.ts")
			) {
				return [];
			}
			if (
				Array.isArray(pattern) &&
				pattern.includes("src/instructions/instruction-specs.ts")
			) {
				return ["src/instructions/instruction-specs.ts"];
			}
			return [];
		});

		const customSkillIds = ["custom-skill-a", "custom-skill-b"];
		const scanner = new CodebaseScanner({
			skillIdSource: () => customSkillIds,
		});
		const fp = await scanner.scan();

		expect(fp.skillIds).toEqual([...customSkillIds].sort());
	});

	it("uses instructionNameSource fallback when instructionFiles glob returns empty array", async () => {
		globMock.mockImplementation(async (pattern: string | string[]) => {
			if (
				Array.isArray(pattern) &&
				pattern.includes("src/skills/skill-specs.ts")
			) {
				return ["src/skills/skill-specs.ts"];
			}
			if (
				Array.isArray(pattern) &&
				pattern.includes("src/instructions/instruction-specs.ts")
			) {
				return [];
			}
			return [];
		});

		const customInstructions = ["review", "implement", "plan"];
		const scanner = new CodebaseScanner({
			instructionNameSource: () => customInstructions,
		});
		const fp = await scanner.scan();

		expect(fp.instructionNames).toEqual([...customInstructions].sort());
	});

	it("extracts skillIds from directory-based patterns (non-registry file)", async () => {
		globMock.mockImplementation(async (pattern: string | string[]) => {
			if (
				Array.isArray(pattern) &&
				!pattern.includes("src/skills/skill-specs.ts")
			) {
				// custom skill patterns
				return [
					".github/skills/alpha/SKILL.md",
					".github/skills/beta/SKILL.md",
				];
			}
			if (
				Array.isArray(pattern) &&
				pattern.includes("src/instructions/instruction-specs.ts")
			) {
				return ["src/instructions/instruction-specs.ts"];
			}
			return [];
		});

		const scanner = new CodebaseScanner({
			skillPatterns: ["**/.github/skills/**/SKILL.md"],
		});
		const fp = await scanner.scan();

		expect(fp.skillIds).toContain(".github/skills/alpha");
		expect(fp.skillIds).toContain(".github/skills/beta");
	});

	it("extracts instructionNames from non-registry instruction files", async () => {
		globMock.mockImplementation(async (pattern: string | string[]) => {
			if (
				Array.isArray(pattern) &&
				pattern.includes("src/skills/skill-specs.ts")
			) {
				return ["src/skills/skill-specs.ts"];
			}
			if (
				Array.isArray(pattern) &&
				!pattern.includes("src/instructions/instruction-specs.ts")
			) {
				return [
					"instructions/bootstrap.instructions.md",
					"instructions/review.instructions.md",
				];
			}
			return [];
		});

		const scanner = new CodebaseScanner({
			instructionPatterns: ["instructions/*.instructions.md"],
		});
		const fp = await scanner.scan();

		expect(fp.instructionNames).toContain("bootstrap");
		expect(fp.instructionNames).toContain("review");
	});

	it("merges custom ignorePatterns with defaults (uniqueSorted)", async () => {
		const capturedOptions: Array<{
			ignore?: string[];
		}> = [];

		globMock.mockImplementation(
			async (
				_pattern: string | string[],
				options?: { ignore?: string[]; gitignore?: boolean },
			) => {
				capturedOptions.push({ ignore: options?.ignore });
				return [];
			},
		);

		const customIgnore = ["**/vendor/**", "**/tmp/**"];
		const scanner = new CodebaseScanner({
			ignorePatterns: customIgnore,
		});
		await scanner.scan();

		// Check that the first glob call had merged ignore patterns
		const firstCallIgnore = capturedOptions[0]?.ignore ?? [];
		expect(firstCallIgnore).toContain("**/vendor/**");
		expect(firstCallIgnore).toContain("**/tmp/**");
		expect(firstCallIgnore).toContain("**/node_modules/**");
	});

	it("respects respectGitignore: false option", async () => {
		const capturedOptions: Array<{
			gitignore?: boolean;
		}> = [];

		globMock.mockImplementation(
			async (
				_pattern: string | string[],
				options?: { gitignore?: boolean },
			) => {
				capturedOptions.push({ gitignore: options?.gitignore });
				return [];
			},
		);

		const scanner = new CodebaseScanner({
			respectGitignore: false,
		});
		await scanner.scan();

		expect(capturedOptions[0]?.gitignore).toBe(false);
	});

	it("supports custom codeFilePatterns", async () => {
		const capturedPatterns: Array<string | string[]> = [];

		globMock.mockImplementation(async (pattern: string | string[]) => {
			capturedPatterns.push(pattern);
			return [];
		});

		const scanner = new CodebaseScanner({
			codeFilePatterns: ["**/*.md"],
		});
		await scanner.scan();

		const flatPatterns = capturedPatterns.flat();
		expect(flatPatterns).toContain("**/*.md");
	});

	it("handles codeFiles returning empty results", async () => {
		globMock.mockImplementation(async () => []);

		const scanner = new CodebaseScanner();
		const fp = await scanner.scan();

		expect(fp.codePaths).toHaveLength(0);
		expect(fp.srcPaths).toHaveLength(0);
		// fileSummaries should also be empty
		expect(fp.fileSummaries).toHaveLength(0);
	});

	it("uses defaultSkillIds when no skillIdSource and skillFiles empty", async () => {
		globMock.mockImplementation(async (pattern: string | string[]) => {
			if (
				Array.isArray(pattern) &&
				pattern.includes("src/skills/skill-specs.ts")
			) {
				return [];
			}
			return [];
		});

		const scanner = new CodebaseScanner();
		const fp = await scanner.scan();

		// Should fall back to SKILL_SPECS default IDs
		expect(fp.skillIds.length).toBeGreaterThan(0);
	});

	it("uses defaultInstructionNames when no instructionNameSource and instructionFiles empty", async () => {
		globMock.mockImplementation(async () => []);

		const scanner = new CodebaseScanner();
		const fp = await scanner.scan();

		// Should fall back to PUBLIC_INSTRUCTION_SPECS default names
		expect(fp.instructionNames.length).toBeGreaterThan(0);
	});

	it("classifies file paths into generated/docs/ci/test/config categories", async () => {
		globMock.mockImplementation(async (pattern: string | string[]) => {
			if (
				Array.isArray(pattern) &&
				pattern.includes("src/skills/skill-specs.ts")
			) {
				return ["src/skills/skill-specs.ts"];
			}
			if (
				Array.isArray(pattern) &&
				pattern.includes("src/instructions/instruction-specs.ts")
			) {
				return ["src/instructions/instruction-specs.ts"];
			}
			// codeFilePatterns glob — return a mix of non-existent paths that only
			// need to satisfy classifyFileCategory's path-string checks.
			return [
				"dist/generated/output.js",
				"docs/guide.md",
				".github/workflows/ci.yml",
				"src/tests/example.test.ts",
				"config/settings.json",
			];
		});

		const scanner = new CodebaseScanner();
		const fp = await scanner.scan();

		const byPath = new Map(
			(fp.fileSummaries ?? []).map((summary) => [summary.path, summary]),
		);
		expect(byPath.get("dist/generated/output.js")?.category).toBe("generated");
		expect(byPath.get("docs/guide.md")?.category).toBe("docs");
		expect(byPath.get(".github/workflows/ci.yml")?.category).toBe("ci");
		expect(byPath.get("src/tests/example.test.ts")?.category).toBe("test");
		expect(byPath.get("config/settings.json")?.category).toBe("config");
	});

	it("computes symbolKinds counts from real symbol extraction (buildSymbolKindCounts)", async () => {
		globMock.mockImplementation(async (pattern: string | string[]) => {
			if (
				Array.isArray(pattern) &&
				pattern.includes("src/skills/skill-specs.ts")
			) {
				return ["src/skills/skill-specs.ts"];
			}
			if (
				Array.isArray(pattern) &&
				pattern.includes("src/instructions/instruction-specs.ts")
			) {
				return ["src/instructions/instruction-specs.ts"];
			}
			// A real, existing TypeScript file with multiple symbols so
			// buildSymbolKindCounts actually accumulates repeated kinds.
			return ["src/memory/coherence-scanner.ts"];
		});

		const scanner = new CodebaseScanner();
		const fp = await scanner.scan();

		const summary = (fp.fileSummaries ?? []).find(
			(s) => s.path === "src/memory/coherence-scanner.ts",
		);
		expect(summary).toBeDefined();
		expect(summary?.totalSymbols).toBeGreaterThan(0);
		const kindCounts = Object.values(summary?.symbolKinds ?? {});
		expect(kindCounts.some((count) => count > 0)).toBe(true);
	});

	it("rethrows non-ENOENT readFile errors while building file summaries", async () => {
		globMock.mockImplementation(async (pattern: string | string[]) => {
			if (
				Array.isArray(pattern) &&
				pattern.includes("src/skills/skill-specs.ts")
			) {
				return ["src/skills/skill-specs.ts"];
			}
			if (
				Array.isArray(pattern) &&
				pattern.includes("src/instructions/instruction-specs.ts")
			) {
				return ["src/instructions/instruction-specs.ts"];
			}
			// A directory path — readFile rejects with EISDIR, not ENOENT, so
			// the catch handler in buildFileSummaries must rethrow.
			return ["src/memory"];
		});

		const scanner = new CodebaseScanner();

		await expect(scanner.scan()).rejects.toThrow();
	});

	it("uses skillIdSource when all skillFiles are the registry file", async () => {
		globMock.mockImplementation(async (pattern: string | string[]) => {
			if (
				Array.isArray(pattern) &&
				pattern.includes("src/skills/skill-specs.ts")
			) {
				return ["src/skills/skill-specs.ts"];
			}
			if (
				Array.isArray(pattern) &&
				pattern.includes("src/instructions/instruction-specs.ts")
			) {
				return ["src/instructions/instruction-specs.ts"];
			}
			return [];
		});

		const customSkillIds = ["injected-skill-a", "injected-skill-b"];
		const scanner = new CodebaseScanner({
			skillIdSource: () => customSkillIds,
		});
		const fp = await scanner.scan();

		expect(fp.skillIds).toEqual([...customSkillIds].sort());
	});

	it("uses instructionNameSource when all instructionFiles are the registry file", async () => {
		globMock.mockImplementation(async (pattern: string | string[]) => {
			if (
				Array.isArray(pattern) &&
				pattern.includes("src/skills/skill-specs.ts")
			) {
				return ["src/skills/skill-specs.ts"];
			}
			if (
				Array.isArray(pattern) &&
				pattern.includes("src/instructions/instruction-specs.ts")
			) {
				return ["src/instructions/instruction-specs.ts"];
			}
			return [];
		});

		const customInstructions = ["injected-instruction-a"];
		const scanner = new CodebaseScanner({
			instructionNameSource: () => customInstructions,
		});
		const fp = await scanner.scan();

		expect(fp.instructionNames).toEqual([...customInstructions].sort());
	});

	it("uses the injected lsClient for symbol extraction when provided", async () => {
		globMock.mockImplementation(async (pattern: string | string[]) => {
			if (
				Array.isArray(pattern) &&
				pattern.includes("src/skills/skill-specs.ts")
			) {
				return ["src/skills/skill-specs.ts"];
			}
			if (
				Array.isArray(pattern) &&
				pattern.includes("src/instructions/instruction-specs.ts")
			) {
				return ["src/instructions/instruction-specs.ts"];
			}
			// No TS/TSX code files, so the LSP adapter loop is a no-op and
			// saveCache() has nothing modified to flush to disk.
			return [];
		});

		const lsClient = {
			requestDocumentSymbol: vi.fn(async () => null),
		};
		const scanner = new CodebaseScanner({
			lsClient,
			symbolCacheDir: ".mcp-ai-agent-guidelines-test-tmp/does-not-exist",
		});
		const fp = await scanner.scan();

		expect(lsClient.requestDocumentSymbol).not.toHaveBeenCalled();
		expect(fp.symbolMap).toEqual({});
	});
});
