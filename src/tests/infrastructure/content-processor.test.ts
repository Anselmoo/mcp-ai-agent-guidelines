import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
	discoverSkillFiles,
	fromYamlString,
	parseAllSkillDocuments,
	parseSkillDocument,
	toYamlString,
} from "../../infrastructure/content-processor.js";

describe("content-processor", () => {
	it("discovers and parses existing skill documents from the repository", async () => {
		const files = await discoverSkillFiles();
		const firstFile = files[0];

		expect(files.length).toBeGreaterThan(0);
		expect(firstFile).toContain("src/skills/skill-specs.ts#");
		if (firstFile) {
			const parsed = await parseSkillDocument(firstFile);
			expect(parsed.skillId).toBeTruthy();
			expect(typeof parsed.body).toBe("string");
			expect(parsed.frontmatter).toBeTypeOf("object");
			expect(parsed.filePath).toContain("src/skills/skill-specs.ts#");
			expect(parsed).toEqual(
				expect.objectContaining({
					sourceType: "registry",
					sourcePath: "src/skills/skill-specs.ts",
					isVirtual: true,
				}),
			);
		}
	});

	it("round-trips YAML helpers and ignores blank YAML strings", () => {
		const yaml = toYamlString({ skill: "debug-root-cause", tags: ["debug"] });

		expect(fromYamlString<{ skill: string }>(yaml)).toMatchObject({
			skill: "debug-root-cause",
		});
		expect(fromYamlString("   ")).toBeUndefined();
	});

	it("rejects path traversal outside the provided workspace root", async () => {
		const workspaceRoot = mkdtempSync(join(tmpdir(), "content-processor-"));
		try {
			await expect(
				discoverSkillFiles("../outside", workspaceRoot),
			).rejects.toThrow(/Path traversal outside the workspace is not allowed/);
			await expect(
				parseSkillDocument("../outside/SKILL.md", workspaceRoot),
			).rejects.toThrow(/Path traversal outside the workspace is not allowed/);
		} finally {
			rmSync(workspaceRoot, { recursive: true, force: true });
		}
	});

	it("rejects absolute paths and keeps parsed file paths relative", async () => {
		const workspaceRoot = mkdtempSync(join(tmpdir(), "content-processor-"));
		const skillDirectory = join(
			workspaceRoot,
			".github",
			"skills",
			"sample-skill",
		);
		const skillPath = join(skillDirectory, "SKILL.md");
		try {
			mkdirSync(skillDirectory, { recursive: true });
			writeFileSync(skillPath, "---\nname: Sample\n---\nBody");

			const parsed = await parseSkillDocument(
				".github/skills/sample-skill/SKILL.md",
				workspaceRoot,
			);
			expect(parsed.filePath).toBe(".github/skills/sample-skill/SKILL.md");
			expect(parsed).toEqual(
				expect.objectContaining({
					sourceType: "file",
					sourcePath: ".github/skills/sample-skill/SKILL.md",
					isVirtual: false,
					lastModifiedMs: expect.any(Number),
				}),
			);

			await expect(
				parseSkillDocument(skillPath, workspaceRoot),
			).rejects.toThrow(/Absolute paths are not allowed/);
		} finally {
			rmSync(workspaceRoot, { recursive: true, force: true });
		}
	});

	it("parses all discovered skill documents from a custom workspace", async () => {
		const workspaceRoot = mkdtempSync(join(tmpdir(), "content-processor-"));
		const firstSkillDir = join(
			workspaceRoot,
			".github",
			"skills",
			"first-skill",
		);
		const secondSkillDir = join(
			workspaceRoot,
			".github",
			"skills",
			"second-skill",
		);
		try {
			mkdirSync(firstSkillDir, { recursive: true });
			mkdirSync(secondSkillDir, { recursive: true });
			writeFileSync(
				join(firstSkillDir, "SKILL.md"),
				"---\nname: First\ntriggers:\n  - one\n---\nFirst body\n",
			);
			writeFileSync(
				join(secondSkillDir, "SKILL.md"),
				"---\nname: Second\n---\nSecond body\n",
			);

			const parsed = await parseAllSkillDocuments(
				".github/skills",
				workspaceRoot,
			);

			expect(parsed).toHaveLength(2);
			expect(parsed.map((document) => document.skillId).sort()).toEqual([
				"first-skill",
				"second-skill",
			]);
			expect(parsed.map((document) => document.filePath).sort()).toEqual([
				".github/skills/first-skill/SKILL.md",
				".github/skills/second-skill/SKILL.md",
			]);
		} finally {
			rmSync(workspaceRoot, { recursive: true, force: true });
		}
	});
});
