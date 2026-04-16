import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SessionBootstrap } from "../../runtime/session-bootstrap.js";
import { SkillHandler } from "../../tools/skill-handler.js";

const makeTmpDir = () => join(tmpdir(), `session-bootstrap-test-${Date.now()}`);

describe("SessionBootstrap — warmUp", () => {
	let tmpDir: string;

	beforeEach(async () => {
		tmpDir = makeTmpDir();
		await mkdir(tmpDir, { recursive: true });
	});

	afterEach(async () => {
		await rm(tmpDir, { recursive: true, force: true });
	});

	it("is a no-op when no session files exist", async () => {
		const bootstrap = new SessionBootstrap(tmpDir);
		const handler = new SkillHandler();
		await bootstrap.warmUp(handler);
		expect(handler.getHebbianWeight("any-skill")).toBe(0);
	});

	it("restores weights from a single prior session", async () => {
		const snapshot = {
			savedAt: new Date().toISOString(),
			weights: [{ skillId: "core-quality-review", weight: 2.0 }],
		};
		await writeFile(
			join(tmpDir, "session-2024-01-01.json"),
			JSON.stringify(snapshot),
		);

		const bootstrap = new SessionBootstrap(tmpDir);
		const handler = new SkillHandler();
		await bootstrap.warmUp(handler);

		// Expected: 2.0 * 0.5 (replay weight[0]) * 0.9 (evaporation) = 0.9
		expect(handler.getHebbianWeight("core-quality-review")).toBeCloseTo(0.9);
	});

	it("applies decaying weights across multiple sessions", async () => {
		const sessions = [
			{
				savedAt: "2024-01-02T00:00:00.000Z",
				weights: [{ skillId: "adv-aco-router", weight: 1.0 }],
			},
			{
				savedAt: "2024-01-01T00:00:00.000Z",
				weights: [{ skillId: "adv-aco-router", weight: 1.0 }],
			},
		];
		for (const s of sessions) {
			await writeFile(
				join(tmpDir, `session-${s.savedAt.replace(/[:.]/g, "-")}.json`),
				JSON.stringify(s),
			);
		}

		const bootstrap = new SessionBootstrap(tmpDir);
		const handler = new SkillHandler();
		await bootstrap.warmUp(handler);

		// Most-recent: 1.0 * 0.5 * 0.9 = 0.45
		// Second:      1.0 * 0.25 * 0.9 = 0.225
		// Total ≈ 0.675
		const w = handler.getHebbianWeight("adv-aco-router");
		expect(w).toBeGreaterThan(0.6);
		expect(w).toBeLessThan(0.8);
	});

	it("ignores corrupt session files", async () => {
		await writeFile(join(tmpDir, "session-bad.json"), "not-json{{");

		const bootstrap = new SessionBootstrap(tmpDir);
		const handler = new SkillHandler();
		await expect(bootstrap.warmUp(handler)).resolves.not.toThrow();
		expect(handler.getHebbianWeight("anything")).toBe(0);
	});
});

describe("SessionBootstrap — persist", () => {
	let tmpDir: string;

	beforeEach(async () => {
		tmpDir = makeTmpDir();
	});

	afterEach(async () => {
		await rm(tmpDir, { recursive: true, force: true });
	});

	it("creates a session file with current Hebbian weights", async () => {
		const bootstrap = new SessionBootstrap(tmpDir);
		const handler = new SkillHandler();
		handler.depositHebbianSignal("core-quality-review", 3.0);

		await bootstrap.persist(handler);

		const { readdir, readFile } = await import("node:fs/promises");
		const files = await readdir(tmpDir);
		expect(files.some((f) => f.startsWith("session-"))).toBe(true);

		const content = JSON.parse(
			await readFile(join(tmpDir, files[0]), "utf8"),
		) as { savedAt: string; weights: { skillId: string; weight: number }[] };
		expect(content.weights[0].skillId).toBe("core-quality-review");
		expect(content.weights[0].weight).toBeCloseTo(3.0);
	});

	it("does not throw when the file system fails", async () => {
		// Point to a path that cannot be created (a file masquerading as a dir).
		const fakeDir = join(tmpDir, "not-a-dir");
		await mkdir(tmpDir, { recursive: true });
		await writeFile(fakeDir, "I am a file");

		const bootstrap = new SessionBootstrap(fakeDir);
		const handler = new SkillHandler();
		await expect(bootstrap.persist(handler)).resolves.not.toThrow();
	});
});
