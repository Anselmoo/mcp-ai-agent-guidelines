import { mkdtempSync } from "node:fs";
import { readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	ensureSessionStateGitignore,
	resolveSessionPathWithinStateDir,
	resolveSessionStateDir,
	runExclusiveSessionOperation,
	SESSION_STATE_DIR_ENV_VAR,
	writeTextFileAtomic,
} from "../../runtime/session-store-utils.js";

const ORIGINAL_STATE_DIR = process.env[SESSION_STATE_DIR_ENV_VAR];

function restoreStateDirEnvVar(): void {
	if (ORIGINAL_STATE_DIR === undefined) {
		delete process.env[SESSION_STATE_DIR_ENV_VAR];
		return;
	}

	process.env[SESSION_STATE_DIR_ENV_VAR] = ORIGINAL_STATE_DIR;
}

afterEach(() => {
	restoreStateDirEnvVar();
});

describe("runtime/session-store-utils", () => {
	it("prefers the explicit state dir over the environment variable", () => {
		process.env[SESSION_STATE_DIR_ENV_VAR] = "env-state-dir";

		expect(resolveSessionStateDir("explicit-state-dir")).toBe(
			resolve("explicit-state-dir"),
		);
	});

	it("rejects empty and traversal-containing state directories", () => {
		expect(() => resolveSessionStateDir("   ")).toThrow(
			/session state directory cannot be empty/i,
		);
		expect(() => resolveSessionStateDir("undefined")).toThrow(
			/literal string 'undefined'/i,
		);
		expect(() => resolveSessionStateDir("null")).toThrow(
			/literal string 'null'/i,
		);
		expect(() => resolveSessionStateDir("../escape")).toThrow(
			/session state directory cannot contain '\.\.'/i,
		);
	});

	it("confines resolved session paths to the configured state directory", () => {
		const rootDir = mkdtempSync(join(tmpdir(), "session-store-utils-"));

		expect(resolveSessionPathWithinStateDir("session-1.json", rootDir)).toBe(
			join(resolve(rootDir), "session-1.json"),
		);
		expect(() =>
			resolveSessionPathWithinStateDir("../escape.json", rootDir),
		).toThrow(/path traversal outside the session state directory/i);
	});

	it("writes files atomically and creates parent directories", async () => {
		const rootDir = mkdtempSync(join(tmpdir(), "session-store-utils-"));
		const targetPath = join(rootDir, "nested", "session.json");

		try {
			await writeTextFileAtomic(targetPath, "first");
			await writeTextFileAtomic(targetPath, "second");

			await expect(readFile(targetPath, "utf8")).resolves.toBe("second");
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it("creates a runtime-state gitignore when missing", async () => {
		const rootDir = mkdtempSync(join(tmpdir(), "session-store-utils-"));

		try {
			await ensureSessionStateGitignore(rootDir);

			await expect(readFile(join(rootDir, ".gitignore"), "utf8")).resolves.toBe(
				[
					"# MCP runtime state",
					"# Keep this root visible so onboarding/docs and durable memory artifacts can be committed later.",
					"# Ignore ephemeral execution state and caches, including legacy flat session files.",
					"cache/",
					"sessions/",
					"session-*.json",
					"session-*.json.*",
					"config/*.key",
					"",
				].join("\n"),
			);
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it("appends a managed runtime-state block when custom gitignore rules are incomplete", async () => {
		const rootDir = mkdtempSync(join(tmpdir(), "session-store-utils-"));
		const gitignorePath = join(rootDir, ".gitignore");

		try {
			await rm(gitignorePath, { force: true });
			await writeTextFileAtomic(gitignorePath, "custom/\n");
			await ensureSessionStateGitignore(rootDir);

			await expect(readFile(gitignorePath, "utf8")).resolves.toContain(
				"# BEGIN MCP AI AGENT GUIDELINES STATE",
			);
			await expect(readFile(gitignorePath, "utf8")).resolves.toContain(
				"config/*.key",
			);
			await expect(readFile(gitignorePath, "utf8")).resolves.toContain(
				"custom/",
			);
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it("serializes session operations and releases locks after failures", async () => {
		const locks = new Map<string, Promise<void>>();
		const events: string[] = [];

		await Promise.allSettled([
			runExclusiveSessionOperation(locks, "session-1", async () => {
				events.push("first-start");
				await new Promise((resolvePromise) => setTimeout(resolvePromise, 20));
				events.push("first-end");
				throw new Error("boom");
			}),
			runExclusiveSessionOperation(locks, "session-1", async () => {
				events.push("second-start");
				events.push("second-end");
				return "ok";
			}),
		]);

		expect(events).toEqual([
			"first-start",
			"first-end",
			"second-start",
			"second-end",
		]);
		expect(locks.size).toBe(0);
	});
});
