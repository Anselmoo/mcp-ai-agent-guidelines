import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createBuiltinBootstrapOrchestrationConfig } from "../../config/orchestration-defaults.js";

describe("orchestration-config bootstrap failures", () => {
	let workspaceRoot = "";

	afterEach(() => {
		vi.restoreAllMocks();
		vi.resetModules();
		vi.doUnmock("node:fs");
		if (workspaceRoot !== "") {
			rmSync(workspaceRoot, { recursive: true, force: true });
			workspaceRoot = "";
		}
	});

	it("falls back to in-memory advisory defaults when bootstrap write fails", async () => {
		workspaceRoot = mkdtempSync(join(tmpdir(), "orch-bootstrap-failure-"));
		const configPath = resolve(
			workspaceRoot,
			".mcp-ai-agent-guidelines/config/orchestration.toml",
		);
		const missingConfigError = Object.assign(
			new Error(`ENOENT: no such file or directory, open '${configPath}'`),
			{ code: "ENOENT" },
		);

		vi.spyOn(process, "cwd").mockReturnValue(workspaceRoot);
		vi.doMock("node:fs", async () => {
			const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
			return {
				...actual,
				readFileSync: vi.fn(() => {
					throw missingConfigError;
				}),
				mkdirSync: vi.fn(),
				writeFileSync: vi.fn(() => {
					throw new Error("EACCES: permission denied, open bootstrap file");
				}),
			};
		});

		const { loadOrchestrationConfig, resetConfigCache } = await import(
			"../../config/orchestration-config.js"
		);

		resetConfigCache();

		// Should NOT throw — resilient fallback to in-memory advisory defaults.
		const config = loadOrchestrationConfig();
		expect(config.environment.strict_mode).toBe(false);
	});

	it("falls back to in-memory advisory defaults when bootstrap directory creation fails", async () => {
		workspaceRoot = mkdtempSync(join(tmpdir(), "orch-bootstrap-mkdir-"));
		const configPath = resolve(
			workspaceRoot,
			".mcp-ai-agent-guidelines/config/orchestration.toml",
		);
		const missingConfigError = Object.assign(
			new Error(`ENOENT: no such file or directory, open '${configPath}'`),
			{ code: "ENOENT" },
		);

		vi.spyOn(process, "cwd").mockReturnValue(workspaceRoot);
		vi.doMock("node:fs", async () => {
			const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
			return {
				...actual,
				readFileSync: vi.fn(() => {
					throw missingConfigError;
				}),
				mkdirSync: vi.fn(() => {
					throw new Error("EACCES: permission denied, mkdir config directory");
				}),
				writeFileSync: vi.fn(),
			};
		});

		const { loadOrchestrationConfig, resetConfigCache } = await import(
			"../../config/orchestration-config.js"
		);

		resetConfigCache();

		// Should NOT throw — resilient fallback to in-memory advisory defaults.
		const config = loadOrchestrationConfig();
		expect(config.environment.strict_mode).toBe(false);
	});

	it("keeps advisory bootstrap defaults in sync with failure-path expectations", () => {
		const config = createBuiltinBootstrapOrchestrationConfig();

		expect(config.environment.strict_mode).toBe(false);
		expect(config.models.free_primary?.id).toBe("free_primary");
	});
});
