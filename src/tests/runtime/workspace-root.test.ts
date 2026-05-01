import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
	DEFAULT_SESSION_STATE_DIR,
	resolveSessionStateDir,
	resolveSessionStateDirAsync,
	resolveWorkspaceRoot,
	WORKSPACE_ROOT_ENV_VAR,
} from "../../runtime/session-store-utils.js";

const ORIGINAL_WORKSPACE_ROOT = process.env[WORKSPACE_ROOT_ENV_VAR];

function restoreWorkspaceRootEnvVar(): void {
	if (ORIGINAL_WORKSPACE_ROOT === undefined) {
		delete process.env[WORKSPACE_ROOT_ENV_VAR];
	} else {
		process.env[WORKSPACE_ROOT_ENV_VAR] = ORIGINAL_WORKSPACE_ROOT;
	}
}

afterEach(() => {
	restoreWorkspaceRootEnvVar();
});

describe("resolveWorkspaceRoot()", () => {
	it("returns the MCP_WORKSPACE_ROOT env var when explicitly set", () => {
		const tmpDir = mkdtempSync(join(tmpdir(), "workspace-root-env-"));
		try {
			process.env[WORKSPACE_ROOT_ENV_VAR] = tmpDir;
			expect(resolveWorkspaceRoot()).toBe(resolve(tmpDir));
		} finally {
			rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	it("trims whitespace from the MCP_WORKSPACE_ROOT env var", () => {
		const tmpDir = mkdtempSync(join(tmpdir(), "workspace-root-trim-"));
		try {
			process.env[WORKSPACE_ROOT_ENV_VAR] = `  ${tmpDir}  `;
			expect(resolveWorkspaceRoot()).toBe(resolve(tmpDir));
		} finally {
			rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	it("ignores an empty MCP_WORKSPACE_ROOT and falls back to detection", () => {
		const tmpDir = mkdtempSync(join(tmpdir(), "workspace-root-empty-"));
		try {
			mkdirSync(join(tmpDir, ".git"));
			process.env[WORKSPACE_ROOT_ENV_VAR] = "   ";
			expect(resolveWorkspaceRoot(tmpDir)).toBe(resolve(tmpDir));
		} finally {
			rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	it("auto-detects workspace root via .git marker when env var is absent", () => {
		const tmpDir = mkdtempSync(join(tmpdir(), "workspace-root-git-"));
		try {
			const innerDir = join(tmpDir, "src", "tools");
			mkdirSync(innerDir, { recursive: true });
			mkdirSync(join(tmpDir, ".git"));

			delete process.env[WORKSPACE_ROOT_ENV_VAR];
			const result = resolveWorkspaceRoot(innerDir);
			expect(result).toBe(tmpDir);
		} finally {
			rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	it("auto-detects workspace root via package.json when no .git present", () => {
		const tmpDir = mkdtempSync(join(tmpdir(), "workspace-root-pkg-"));
		try {
			const innerDir = join(tmpDir, "lib");
			mkdirSync(innerDir, { recursive: true });
			writeFileSync(join(tmpDir, "package.json"), '{"name":"test"}', "utf8");

			delete process.env[WORKSPACE_ROOT_ENV_VAR];
			const result = resolveWorkspaceRoot(innerDir);
			expect(result).toBe(tmpDir);
		} finally {
			rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	it("falls back to the explicit fallback argument when no markers are found", () => {
		const tmpDir = mkdtempSync(join(tmpdir(), "workspace-root-fallback-"));
		try {
			// tmpDir has no .git or package.json, and no ancestors do (it's under /tmp)
			delete process.env[WORKSPACE_ROOT_ENV_VAR];
			const result = resolveWorkspaceRoot(tmpDir);
			expect(result).toBe(tmpDir);
		} finally {
			rmSync(tmpDir, { recursive: true, force: true });
		}
	});
});

describe("resolveSessionStateDirAsync() uses resolveWorkspaceRoot()", () => {
	it("uses MCP_WORKSPACE_ROOT as the base when env var is set and no explicit stateDir", async () => {
		const tmpDir = mkdtempSync(join(tmpdir(), "workspace-root-async-"));
		try {
			process.env[WORKSPACE_ROOT_ENV_VAR] = tmpDir;
			const result = await resolveSessionStateDirAsync();
			expect(result).toBe(resolve(tmpDir, DEFAULT_SESSION_STATE_DIR));
		} finally {
			rmSync(tmpDir, { recursive: true, force: true });
		}
	});

	it("explicit stateDir argument still takes priority over MCP_WORKSPACE_ROOT", async () => {
		const tmpDir = mkdtempSync(join(tmpdir(), "workspace-root-explicit-"));
		try {
			process.env[WORKSPACE_ROOT_ENV_VAR] = tmpDir;
			const explicitDir = join(tmpDir, "custom-state");
			const result = await resolveSessionStateDirAsync(explicitDir);
			expect(result).toBe(resolve(explicitDir));
		} finally {
			rmSync(tmpDir, { recursive: true, force: true });
		}
	});
});

describe("resolveSessionStateDir()", () => {
	it("uses MCP_WORKSPACE_ROOT for sync default resolution when no explicit state dir is set", () => {
		const tmpDir = mkdtempSync(join(tmpdir(), "workspace-root-sync-state-"));
		try {
			process.env[WORKSPACE_ROOT_ENV_VAR] = tmpDir;
			expect(resolveSessionStateDir()).toBe(
				resolve(tmpDir, DEFAULT_SESSION_STATE_DIR),
			);
		} finally {
			rmSync(tmpDir, { recursive: true, force: true });
		}
	});
});
