import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	BUILTIN_ORCHESTRATION_DEFAULTS_SOURCE,
	createBuiltinBootstrapOrchestrationConfig,
} from "../../config/orchestration-defaults.js";

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

	it("surfaces load context and setup guidance when bootstrap write fails", async () => {
		workspaceRoot = mkdtempSync(join(tmpdir(), "orch-bootstrap-failure-"));
		const configPath = resolve(
			workspaceRoot,
			".mcp-ai-agent-guidelines/config/orchestration.toml",
		);
		const missingConfigError = Object.assign(
			new Error(`ENOENT: no such file or directory, open '${configPath}'`),
			{ code: "ENOENT" },
		);
		const bootstrapWriteError = new Error(
			"EACCES: permission denied, open bootstrap file",
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
					throw bootstrapWriteError;
				}),
			};
		});

		const {
			loadOrchestrationConfig,
			ORCHESTRATION_CONFIG_RELATIVE_PATH,
			resetConfigCache,
		} = await import("../../config/orchestration-config.js");

		resetConfigCache();

		let thrown: unknown;
		try {
			loadOrchestrationConfig();
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(Error);
		expect((thrown as Error).message).toContain(
			`[orchestration] Failed to load primary config at ${configPath}: ${missingConfigError.message}`,
		);
		expect((thrown as Error).message).toContain(
			`Failed to bootstrap a new workspace config from ${BUILTIN_ORCHESTRATION_DEFAULTS_SOURCE}: ${bootstrapWriteError.message}`,
		);
		expect((thrown as Error).message).toContain(
			`Run \`mcp-cli onboard init\` or create ${ORCHESTRATION_CONFIG_RELATIVE_PATH} manually.`,
		);
	});

	it("surfaces load context and setup guidance when bootstrap directory creation fails", async () => {
		workspaceRoot = mkdtempSync(join(tmpdir(), "orch-bootstrap-mkdir-"));
		const configPath = resolve(
			workspaceRoot,
			".mcp-ai-agent-guidelines/config/orchestration.toml",
		);
		const missingConfigError = Object.assign(
			new Error(`ENOENT: no such file or directory, open '${configPath}'`),
			{ code: "ENOENT" },
		);
		const bootstrapMkdirError = new Error(
			"EACCES: permission denied, mkdir config directory",
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
					throw bootstrapMkdirError;
				}),
				writeFileSync: vi.fn(),
			};
		});

		const {
			loadOrchestrationConfig,
			ORCHESTRATION_CONFIG_RELATIVE_PATH,
			resetConfigCache,
		} = await import("../../config/orchestration-config.js");

		resetConfigCache();

		let thrown: unknown;
		try {
			loadOrchestrationConfig();
		} catch (error) {
			thrown = error;
		}

		expect(thrown).toBeInstanceOf(Error);
		expect((thrown as Error).message).toContain(
			`[orchestration] Failed to load primary config at ${configPath}: ${missingConfigError.message}`,
		);
		expect((thrown as Error).message).toContain(
			`Failed to bootstrap a new workspace config from ${BUILTIN_ORCHESTRATION_DEFAULTS_SOURCE}: ${bootstrapMkdirError.message}`,
		);
		expect((thrown as Error).message).toContain(
			`Run \`mcp-cli onboard init\` or create ${ORCHESTRATION_CONFIG_RELATIVE_PATH} manually.`,
		);
	});

	it("keeps advisory bootstrap defaults in sync with failure-path expectations", () => {
		const config = createBuiltinBootstrapOrchestrationConfig();

		expect(config.environment.strict_mode).toBe(false);
		expect(config.models.free_primary?.id).toBe("free_primary");
	});
});
