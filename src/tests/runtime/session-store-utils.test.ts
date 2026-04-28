import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	ensureSessionStateGitignore,
	findWorkspaceRoot,
	findWorkspaceRootSync,
	isWorkspaceInitialized,
	resolveSessionPathWithinStateDir,
	resolveSessionStateDir,
	resolveSessionStateDirAsync,
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

describe("findWorkspaceRoot / findWorkspaceRootSync", () => {
	it("findWorkspaceRoot resolves to a directory containing package.json or .git", async () => {
		const result = await findWorkspaceRoot(process.cwd());
		expect(result).not.toBeNull();
		expect(typeof result).toBe("string");
	});

	it("findWorkspaceRoot returns null for a deeply nested temp dir with no markers", async () => {
		const tmpBase = mkdtempSync(join(tmpdir(), "no-workspace-"));
		const deepDir = join(tmpBase, "a", "b", "c", "d");
		await mkdir(deepDir, { recursive: true });
		try {
			const result = await findWorkspaceRoot(deepDir);
			// Should either find something up the chain (system /tmp may have markers)
			// or return null — it must not throw.
			expect(result === null || typeof result === "string").toBe(true);
		} finally {
			await rm(tmpBase, { recursive: true, force: true });
		}
	});

	it("findWorkspaceRootSync returns a string for the current working directory", () => {
		const result = findWorkspaceRootSync(process.cwd());
		expect(result).not.toBeNull();
		expect(typeof result).toBe("string");
	});

	it("findWorkspaceRootSync returns null or string for a temp dir with no markers", () => {
		const tmpBase = mkdtempSync(join(tmpdir(), "no-workspace-sync-"));
		try {
			const deepDir = join(tmpBase, "a", "b");
			mkdirSync(deepDir, { recursive: true });
			const result = findWorkspaceRootSync(deepDir);
			expect(result === null || typeof result === "string").toBe(true);
		} finally {
			try {
				rmSync(tmpBase, { recursive: true, force: true });
			} catch {
				/* ignore */
			}
		}
	});
});

describe("resolveSessionStateDirAsync", () => {
	it("scopes default state dir to the current working directory", async () => {
		const result = await resolveSessionStateDirAsync();
		expect(result).toBe(resolve(process.cwd(), ".mcp-ai-agent-guidelines"));
	});

	it("does not require .git or package.json markers for default resolution", async () => {
		const tmpBase = mkdtempSync(join(tmpdir(), "cwd-scoped-state-"));
		const deepDir = join(tmpBase, "python", "project", "src");
		await mkdir(deepDir, { recursive: true });
		const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(deepDir);

		try {
			const result = await resolveSessionStateDirAsync();
			expect(result).toBe(resolve(deepDir, ".mcp-ai-agent-guidelines"));
		} finally {
			cwdSpy.mockRestore();
			await rm(tmpBase, { recursive: true, force: true });
		}
	});

	it("uses the env var override when set", async () => {
		const prev = process.env[SESSION_STATE_DIR_ENV_VAR];
		process.env[SESSION_STATE_DIR_ENV_VAR] = "/tmp/custom-state-dir";
		try {
			const result = await resolveSessionStateDirAsync();
			expect(result).toBe("/tmp/custom-state-dir");
		} finally {
			if (prev === undefined) {
				delete process.env[SESSION_STATE_DIR_ENV_VAR];
			} else {
				process.env[SESSION_STATE_DIR_ENV_VAR] = prev;
			}
		}
	});
});

describe("findWorkspaceRoot — package.json fallback path", () => {
	it("returns a dir that contains package.json when no .git is present", async () => {
		const tmpBase = mkdtempSync(join(tmpdir(), "ws-pkg-"));
		const subDir = join(tmpBase, "nested", "src");
		mkdirSync(subDir, { recursive: true });
		writeFileSync(join(tmpBase, "package.json"), '{"name":"test"}\n', "utf8");
		try {
			// No .git in tmpBase — should fall through to package.json check.
			const result = await findWorkspaceRoot(subDir);
			expect(result).toBe(resolve(tmpBase));
		} finally {
			rmSync(tmpBase, { recursive: true, force: true });
		}
	});

	it("findWorkspaceRootSync returns dir with package.json when no .git is present", () => {
		const tmpBase = mkdtempSync(join(tmpdir(), "ws-pkg-sync-"));
		const subDir = join(tmpBase, "nested");
		mkdirSync(subDir, { recursive: true });
		writeFileSync(join(tmpBase, "package.json"), '{"name":"test"}\n', "utf8");
		try {
			const result = findWorkspaceRootSync(subDir);
			expect(result).toBe(resolve(tmpBase));
		} finally {
			rmSync(tmpBase, { recursive: true, force: true });
		}
	});
});

describe("isWorkspaceInitialized", () => {
	it("returns false when orchestration.toml is absent", async () => {
		const tmpBase = mkdtempSync(join(tmpdir(), "ws-init-"));
		try {
			const result = await isWorkspaceInitialized(tmpBase);
			expect(result).toBe(false);
		} finally {
			await rm(tmpBase, { recursive: true, force: true });
		}
	});

	it("returns true when orchestration.toml exists", async () => {
		const tmpBase = mkdtempSync(join(tmpdir(), "ws-init-"));
		const configDir = join(tmpBase, "config");
		await mkdir(configDir, { recursive: true });
		await writeFile(join(configDir, "orchestration.toml"), "[model]\n", "utf8");
		try {
			const result = await isWorkspaceInitialized(tmpBase);
			expect(result).toBe(true);
		} finally {
			await rm(tmpBase, { recursive: true, force: true });
		}
	});
});
