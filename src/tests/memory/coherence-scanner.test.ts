import { beforeEach, describe, expect, it, vi } from "vitest";
import { CodebaseScanner } from "../../memory/coherence-scanner.js";

const globMock = vi.hoisted(() => vi.fn());

vi.mock("fast-glob", () => ({
	default: {
		glob: globMock,
	},
}));

describe("CodebaseScanner", () => {
	beforeEach(() => {
		globMock.mockReset();
		globMock.mockImplementation(
			async (
				pattern: string | string[],
				options?: { gitignore?: boolean; ignore?: string[] },
			) => {
				if (
					Array.isArray(pattern) &&
					pattern.includes("src/skills/skill-specs.ts")
				) {
					expect(options?.gitignore).toBe(true);
					expect(options?.ignore).toContain("**/claude/**");
					return ["src/skills/skill-specs.ts"];
				}
				if (
					Array.isArray(pattern) &&
					pattern.includes("src/instructions/instruction-specs.ts")
				) {
					return ["src/instructions/instruction-specs.ts"];
				}
				if (Array.isArray(pattern)) {
					return ["src/a.ts", "pkg/mod.rs", "scripts/tool.py"];
				}
				return [];
			},
		);
	});

	it("scans authoritative paths and honors the default ignore policy", async () => {
		const scanner = new CodebaseScanner();
		const fp = await scanner.scan();

		expect(fp.skillIds).toContain("arch-system");
		expect(fp.skillIds).toContain("adapt-annealing");
		expect(fp.instructionNames).toContain("bootstrap");
		expect(fp.instructionNames).toContain("implement");
		expect(fp.codePaths).toEqual(["pkg/mod.rs", "scripts/tool.py", "src/a.ts"]);
		expect(fp.srcPaths).toEqual(fp.codePaths);
		expect(typeof fp.capturedAt).toBe("string");
	});

	it("supports configurable discovery patterns and ignore settings", async () => {
		globMock.mockImplementationOnce(
			async (
				pattern: string | string[],
				options?: { gitignore?: boolean; ignore?: string[] },
			) => {
				expect(pattern).toEqual(["**/SKILL.md"]);
				expect(options?.gitignore).toBe(false);
				expect(options?.ignore).toContain("**/vendor/**");
				return [".github/skills/alpha/SKILL.md", "claude/beta/SKILL.md"];
			},
		);

		const scanner = new CodebaseScanner({
			skillPatterns: ["**/SKILL.md"],
			ignorePatterns: ["**/vendor/**"],
			respectGitignore: false,
		});
		const fp = await scanner.scan();

		expect(fp.skillIds).toEqual([".github/skills/alpha", "claude/beta"]);
	});
});
