import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	emitSkillHooks,
	SKILL_HOOK_CLIENTS,
} from "../../cli/skill-hook-emitter.js";
import { INSTRUCTION_SPECS } from "../../instructions/instruction-specs.js";

const PUBLIC_INSTRUCTION_COUNT = INSTRUCTION_SPECS.filter(
	(spec) => spec.public,
).length;

describe("skill-hook-emitter", () => {
	let cwd: string;
	let home: string;

	beforeEach(() => {
		cwd = mkdtempSync(join(tmpdir(), "skill-hook-cwd-"));
		home = mkdtempSync(join(tmpdir(), "skill-hook-home-"));
	});

	afterEach(() => {
		rmSync(cwd, { recursive: true, force: true });
		rmSync(home, { recursive: true, force: true });
	});

	it("writes one SKILL.md per public instruction × client locally", async () => {
		const written = await emitSkillHooks({ cwd, home, quiet: true });
		expect(written).toBe(PUBLIC_INSTRUCTION_COUNT * SKILL_HOOK_CLIENTS.length);

		const copilotEntries = readdirSync(join(cwd, ".github", "skills"));
		expect(copilotEntries.length).toBe(PUBLIC_INSTRUCTION_COUNT);

		const claudeEntries = readdirSync(join(cwd, ".claude", "skills"));
		expect(claudeEntries.length).toBe(PUBLIC_INSTRUCTION_COUNT);

		const codexEntries = readdirSync(join(cwd, ".agents", "skills"));
		expect(codexEntries.length).toBe(PUBLIC_INSTRUCTION_COUNT);
	});

	it("renders the SKILL.md frontmatter from the instruction spec", async () => {
		const firstPublic = INSTRUCTION_SPECS.find((spec) => spec.public);
		if (!firstPublic) {
			throw new Error("Expected at least one public instruction spec.");
		}

		await emitSkillHooks({ cwd, home, quiet: true, clients: ["claude"] });
		const content = readFileSync(
			join(cwd, ".claude", "skills", firstPublic.toolName, "SKILL.md"),
			"utf8",
		);

		expect(content).toContain(`name: "${firstPublic.toolName}"`);
		expect(content).toContain("description: |");
		expect(content).toContain(`<!-- Source: ${firstPublic.sourcePath} -->`);
		expect(content).toContain("--client claude");
	});

	it("targets the home directory when global=true", async () => {
		await emitSkillHooks({
			global: true,
			cwd,
			home,
			quiet: true,
			clients: ["copilot"],
		});

		const localExists = (() => {
			try {
				return readdirSync(join(cwd, ".github", "skills")).length;
			} catch {
				return 0;
			}
		})();
		expect(localExists).toBe(0);

		const globalEntries = readdirSync(join(home, ".copilot", "skills"));
		expect(globalEntries.length).toBe(PUBLIC_INSTRUCTION_COUNT);
	});

	it("prints a per-client summary when quiet=false (local)", async () => {
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		await emitSkillHooks({ cwd, home, quiet: false, clients: ["copilot"] });

		const allLogs = logSpy.mock.calls.flat().join("\n");
		expect(allLogs).toContain("[copilot]");
		expect(allLogs).toContain("Skill hooks →");
		expect(allLogs).toContain(".github/skills/");
		expect(allLogs).toContain(`(${PUBLIC_INSTRUCTION_COUNT} files)`);
	});

	it("prints a ~/ destLabel when quiet=false with global=true", async () => {
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		await emitSkillHooks({
			global: true,
			cwd,
			home,
			quiet: false,
			clients: ["claude"],
		});

		const allLogs = logSpy.mock.calls.flat().join("\n");
		expect(allLogs).toContain("[claude]");
		expect(allLogs).toContain("~/.claude/skills/");
	});
});
