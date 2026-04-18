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
});
