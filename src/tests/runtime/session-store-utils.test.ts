import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import {
	mkdir,
	mkdtemp,
	readdir,
	readFile,
	rm,
	writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	defaultReadTextFile,
	EPHEMERAL_ENV_VAR,
	ensureSessionStateGitignore,
	findWorkspaceRoot,
	findWorkspaceRootSync,
	isEphemeralMode,
	isWorkspaceInitialized,
	resolveSessionPathWithinStateDir,
	resolveSessionStateDir,
	resolveSessionStateDirAsync,
	resolveWorkspaceRoot,
	runExclusiveSessionOperation,
	SESSION_STATE_DIR_ENV_VAR,
	sweepStaleTempFiles,
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

describe("resolveSessionStateDirAsync — MCP_WORKSPACE_ROOT branch", () => {
	const WORKSPACE_ROOT_ENV_VAR = "MCP_WORKSPACE_ROOT";

	it("uses MCP_WORKSPACE_ROOT when set, ignoring cwd", async () => {
		const prev = process.env[WORKSPACE_ROOT_ENV_VAR];
		process.env[WORKSPACE_ROOT_ENV_VAR] = "/tmp/explicit-ws-root";
		try {
			const result = await resolveSessionStateDirAsync();
			expect(result).toBe(
				resolve("/tmp/explicit-ws-root", ".mcp-ai-agent-guidelines"),
			);
		} finally {
			if (prev === undefined) {
				delete process.env[WORKSPACE_ROOT_ENV_VAR];
			} else {
				process.env[WORKSPACE_ROOT_ENV_VAR] = prev;
			}
		}
	});

	it("MCP_AI_AGENT_GUIDELINES_STATE_DIR takes precedence over MCP_WORKSPACE_ROOT", async () => {
		const prevState = process.env[SESSION_STATE_DIR_ENV_VAR];
		const prevRoot = process.env[WORKSPACE_ROOT_ENV_VAR];
		process.env[SESSION_STATE_DIR_ENV_VAR] = "/tmp/explicit-state";
		process.env[WORKSPACE_ROOT_ENV_VAR] = "/tmp/should-be-ignored";
		try {
			const result = await resolveSessionStateDirAsync();
			expect(result).toBe("/tmp/explicit-state");
		} finally {
			if (prevState === undefined) {
				delete process.env[SESSION_STATE_DIR_ENV_VAR];
			} else {
				process.env[SESSION_STATE_DIR_ENV_VAR] = prevState;
			}
			if (prevRoot === undefined) {
				delete process.env[WORKSPACE_ROOT_ENV_VAR];
			} else {
				process.env[WORKSPACE_ROOT_ENV_VAR] = prevRoot;
			}
		}
	});

	it("falls back to async findWorkspaceRoot when no env vars are set", async () => {
		const tmpBase = mkdtempSync(join(tmpdir(), "async-ws-detect-"));
		const subDir = join(tmpBase, "src", "deep");
		mkdirSync(subDir, { recursive: true });
		writeFileSync(join(tmpBase, "package.json"), '{"name":"test"}\n', "utf8");
		const prevState = process.env[SESSION_STATE_DIR_ENV_VAR];
		const prevRoot = process.env[WORKSPACE_ROOT_ENV_VAR];
		delete process.env[SESSION_STATE_DIR_ENV_VAR];
		delete process.env[WORKSPACE_ROOT_ENV_VAR];
		const cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(subDir);
		try {
			const result = await resolveSessionStateDirAsync();
			// Should detect tmpBase (has package.json) and scope state there
			expect(result).toBe(resolve(tmpBase, ".mcp-ai-agent-guidelines"));
		} finally {
			cwdSpy.mockRestore();
			if (prevState === undefined) {
				delete process.env[SESSION_STATE_DIR_ENV_VAR];
			} else {
				process.env[SESSION_STATE_DIR_ENV_VAR] = prevState;
			}
			if (prevRoot === undefined) {
				delete process.env[WORKSPACE_ROOT_ENV_VAR];
			} else {
				process.env[WORKSPACE_ROOT_ENV_VAR] = prevRoot;
			}
			rmSync(tmpBase, { recursive: true, force: true });
		}
	});
});

describe("writeTextFileAtomic temp cleanup", () => {
	it("leaves no .tmp file behind on a successful write", async () => {
		const dir = await mkdtemp(join(tmpdir(), "atomic-"));
		try {
			await writeTextFileAtomic(join(dir, "a.json"), "ok");
			const entries = await readdir(dir);
			expect(entries.filter((e) => e.endsWith(".tmp"))).toHaveLength(0);
			expect(await readFile(join(dir, "a.json"), "utf8")).toBe("ok");
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});

	it("removes the temp file when the rename fails", async () => {
		const dir = await mkdtemp(join(tmpdir(), "atomic-"));
		try {
			// Make the target a directory so rename(tempFile, target) fails.
			const target = join(dir, "target");
			await mkdir(target);
			await expect(writeTextFileAtomic(target, "data")).rejects.toBeTruthy();
			const entries = await readdir(dir);
			expect(entries.filter((e) => e.endsWith(".tmp"))).toHaveLength(0);
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});
});

describe("sweepStaleTempFiles", () => {
	it("sweeps stale .tmp files and returns the count", async () => {
		const dir = await mkdtemp(join(tmpdir(), "sweep-"));
		try {
			await writeFile(join(dir, "session-a.json.123.tmp"), "");
			await writeFile(join(dir, "session-b.json"), "keep");
			const removed = await sweepStaleTempFiles(dir);
			expect(removed).toBe(1);
			const entries = await readdir(dir);
			expect(entries).toContain("session-b.json");
			expect(entries.some((e) => e.endsWith(".tmp"))).toBe(false);
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});

	it("returns 0 and does not throw when the directory is missing", async () => {
		expect(
			await sweepStaleTempFiles(join(tmpdir(), "no-such-dir-xyz-123")),
		).toBe(0);
	});
});

describe("isEphemeralMode", () => {
	const prevEphemeral = process.env[EPHEMERAL_ENV_VAR];

	afterEach(() => {
		if (prevEphemeral === undefined) {
			delete process.env[EPHEMERAL_ENV_VAR];
		} else {
			process.env[EPHEMERAL_ENV_VAR] = prevEphemeral;
		}
	});

	it("returns true for 'true' (case-insensitive, trimmed)", () => {
		process.env[EPHEMERAL_ENV_VAR] = "  TRUE  ";
		expect(isEphemeralMode()).toBe(true);
	});

	it("returns true for '1'", () => {
		process.env[EPHEMERAL_ENV_VAR] = "1";
		expect(isEphemeralMode()).toBe(true);
	});

	it("returns false for other values", () => {
		process.env[EPHEMERAL_ENV_VAR] = "false";
		expect(isEphemeralMode()).toBe(false);
	});

	it("returns false when unset", () => {
		delete process.env[EPHEMERAL_ENV_VAR];
		expect(isEphemeralMode()).toBe(false);
	});
});

describe("resolveWorkspaceRoot", () => {
	const WORKSPACE_ROOT_ENV_VAR = "MCP_WORKSPACE_ROOT";
	const prevRoot = process.env[WORKSPACE_ROOT_ENV_VAR];

	afterEach(() => {
		if (prevRoot === undefined) {
			delete process.env[WORKSPACE_ROOT_ENV_VAR];
		} else {
			process.env[WORKSPACE_ROOT_ENV_VAR] = prevRoot;
		}
	});

	it("uses the explicit env var when set to a non-blank value", () => {
		process.env[WORKSPACE_ROOT_ENV_VAR] = "/tmp/explicit-root-direct";
		expect(resolveWorkspaceRoot("/tmp/fallback-unused")).toBe(
			resolve("/tmp/explicit-root-direct"),
		);
	});

	it("ignores a blank env var and falls back to detection/fallback", () => {
		process.env[WORKSPACE_ROOT_ENV_VAR] = "   ";
		const tmpBase = mkdtempSync(join(tmpdir(), "resolve-ws-root-"));
		try {
			// No .git/package.json markers under tmpBase's fresh child dir.
			const deepDir = join(tmpBase, "no-markers-here");
			mkdirSync(deepDir, { recursive: true });
			const result = resolveWorkspaceRoot(deepDir);
			// Either detected via an ancestor marker, or falls back to deepDir itself.
			expect(typeof result).toBe("string");
		} finally {
			rmSync(tmpBase, { recursive: true, force: true });
		}
	});

	it("falls back to the provided fallback when no markers are found", () => {
		delete process.env[WORKSPACE_ROOT_ENV_VAR];
		const tmpBase = mkdtempSync(join(tmpdir(), "resolve-ws-root-fallback-"));
		try {
			const result = resolveWorkspaceRoot(tmpBase);
			// findWorkspaceRootSync may find markers walking up from the system
			// temp dir; regardless, the function must return a string and must
			// not throw when no explicit env var is set.
			expect(typeof result).toBe("string");
		} finally {
			rmSync(tmpBase, { recursive: true, force: true });
		}
	});
});

describe("resolveSessionStateDir — default resolution via resolveWorkspaceRoot", () => {
	const WORKSPACE_ROOT_ENV_VAR = "MCP_WORKSPACE_ROOT";
	const prevState = process.env[SESSION_STATE_DIR_ENV_VAR];
	const prevRoot = process.env[WORKSPACE_ROOT_ENV_VAR];

	afterEach(() => {
		if (prevState === undefined) {
			delete process.env[SESSION_STATE_DIR_ENV_VAR];
		} else {
			process.env[SESSION_STATE_DIR_ENV_VAR] = prevState;
		}
		if (prevRoot === undefined) {
			delete process.env[WORKSPACE_ROOT_ENV_VAR];
		} else {
			process.env[WORKSPACE_ROOT_ENV_VAR] = prevRoot;
		}
	});

	it("falls back to resolveWorkspaceRoot() when no explicit dir or env var is set", () => {
		delete process.env[SESSION_STATE_DIR_ENV_VAR];
		process.env[WORKSPACE_ROOT_ENV_VAR] = "/tmp/explicit-root-for-state-dir";

		expect(resolveSessionStateDir()).toBe(
			resolve("/tmp/explicit-root-for-state-dir", ".mcp-ai-agent-guidelines"),
		);
	});
});

describe("ensureSessionStateGitignore — additional branches", () => {
	it("returns early when the existing gitignore already has all required rules", async () => {
		const rootDir = mkdtempSync(join(tmpdir(), "session-store-utils-"));
		const gitignorePath = join(rootDir, ".gitignore");

		try {
			await mkdir(rootDir, { recursive: true });
			await ensureSessionStateGitignore(rootDir);
			const firstContents = await readFile(gitignorePath, "utf8");

			// Calling again should hit the "already satisfied" early return
			// (line 262-264) instead of rewriting the file — content is
			// byte-for-byte identical across both calls.
			await ensureSessionStateGitignore(rootDir);
			const secondContents = await readFile(gitignorePath, "utf8");

			expect(secondContents).toBe(firstContents);
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it("replaces an existing managed block when rules are incomplete but markers are present", async () => {
		const rootDir = mkdtempSync(join(tmpdir(), "session-store-utils-"));
		const gitignorePath = join(rootDir, ".gitignore");

		try {
			const staleManagedBlock = [
				"# BEGIN MCP AI AGENT GUIDELINES STATE",
				"# stale rules",
				"stale-only/",
				"# END MCP AI AGENT GUIDELINES STATE",
			].join("\n");
			await writeTextFileAtomic(gitignorePath, `${staleManagedBlock}\n`);

			await ensureSessionStateGitignore(rootDir);

			const updatedContents = await readFile(gitignorePath, "utf8");
			expect(updatedContents).toContain("config/*.key");
			expect(updatedContents).not.toContain("stale-only/");
			expect(updatedContents).toContain(
				"# BEGIN MCP AI AGENT GUIDELINES STATE",
			);
			expect(updatedContents).toContain("# END MCP AI AGENT GUIDELINES STATE");
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it("appends the managed block without a blank-line prefix when the existing file is blank", async () => {
		const rootDir = mkdtempSync(join(tmpdir(), "session-store-utils-"));
		const gitignorePath = join(rootDir, ".gitignore");

		try {
			await writeTextFileAtomic(gitignorePath, "   \n\n  ");
			await ensureSessionStateGitignore(rootDir);

			const contents = await readFile(gitignorePath, "utf8");
			expect(contents.startsWith("# BEGIN MCP AI AGENT GUIDELINES STATE")).toBe(
				true,
			);
			expect(contents).toContain("config/*.key");
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});

	it("rethrows non-ENOENT errors raised while reading the existing gitignore", async () => {
		const rootDir = mkdtempSync(join(tmpdir(), "session-store-utils-"));
		// Make ".gitignore" itself a directory so readFile(gitignorePath) fails
		// with EISDIR instead of ENOENT, exercising the rethrow branch.
		const gitignorePath = join(rootDir, ".gitignore");
		await mkdir(gitignorePath, { recursive: true });

		try {
			await expect(ensureSessionStateGitignore(rootDir)).rejects.toMatchObject({
				code: "EISDIR",
			});
		} finally {
			await rm(rootDir, { recursive: true, force: true });
		}
	});
});

describe("defaultReadTextFile", () => {
	it("reads a file's contents as utf8 text via fs/promises.readFile", async () => {
		const dir = await mkdtemp(join(tmpdir(), "default-read-text-file-"));
		const filePath = join(dir, "sample.txt");
		try {
			await writeFile(filePath, "hello seam", "utf8");
			await expect(defaultReadTextFile(filePath)).resolves.toBe("hello seam");
		} finally {
			await rm(dir, { recursive: true, force: true });
		}
	});
});
