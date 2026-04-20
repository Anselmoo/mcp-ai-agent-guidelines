import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderOrchestrationToml } from "../../config/orchestration-config-service.js";
import { createBuiltinOrchestrationDefaults } from "../../config/orchestration-defaults.js";

describe("orchestration-config: phase 3 resolver coverage", () => {
	let workspaceRoot = "";

	const writeWorkspaceConfig = (
		config: ReturnType<typeof createBuiltinOrchestrationDefaults>,
	) => {
		workspaceRoot = mkdtempSync(join(tmpdir(), "orch-phase3-"));
		const configPath = resolve(
			workspaceRoot,
			".mcp-ai-agent-guidelines/config/orchestration.toml",
		);
		mkdirSync(resolve(workspaceRoot, ".mcp-ai-agent-guidelines/config"), {
			recursive: true,
		});
		writeFileSync(configPath, renderOrchestrationToml(config), "utf8");
		return configPath;
	};

	afterEach(() => {
		vi.restoreAllMocks();
		vi.resetModules();
		vi.doUnmock("../../config/orchestration-defaults.js");
		if (workspaceRoot !== "") {
			rmSync(workspaceRoot, { recursive: true, force: true });
			workspaceRoot = "";
		}
	});

	it("prefers the only candidate in the preferred capability set", async () => {
		const config = createBuiltinOrchestrationDefaults();
		config.environment.strict_mode = false;
		config.models.first_candidate = {
			id: "first-candidate-id",
			provider: "openai",
			available: true,
			context_window: 128_000,
		};
		config.models.preferred_candidate = {
			id: "preferred-candidate-id",
			provider: "openai",
			available: true,
			context_window: 128_000,
		};
		config.capabilities.multi_candidate = [
			"first_candidate",
			"preferred_candidate",
		];
		config.capabilities.preferred_only = ["preferred_candidate"];
		config.profiles.preferred_model = {
			requires: ["multi_candidate"],
			prefer: "preferred_only",
			fallback: [],
			fan_out: 1,
		};
		const configPath = writeWorkspaceConfig(config);
		const { loadOrchestrationConfig, resetConfigCache, resolveProfile } =
			await import("../../config/orchestration-config.js");

		try {
			resetConfigCache();
			loadOrchestrationConfig(configPath);

			expect(resolveProfile("preferred_model")).toBe("preferred-candidate-id");
		} finally {
			resetConfigCache();
		}
	});

	it("throws the terminal no-available-model error when workspace and builtin defaults are exhausted", async () => {
		const workspaceConfig = createBuiltinOrchestrationDefaults();
		workspaceConfig.environment.strict_mode = false;
		for (const model of Object.values(workspaceConfig.models)) {
			model.available = false;
		}
		workspaceConfig.capabilities.cost_sensitive = [];
		workspaceConfig.profiles.no_models_anywhere = {
			requires: ["missing_capability"],
			fallback: [],
			fan_out: 1,
		};
		const configPath = writeWorkspaceConfig(workspaceConfig);

		vi.doMock("../../config/orchestration-defaults.js", async () => {
			const actual = await vi.importActual<
				typeof import("../../config/orchestration-defaults.js")
			>("../../config/orchestration-defaults.js");
			const unavailableDefaults = actual.createBuiltinOrchestrationDefaults();
			unavailableDefaults.environment.strict_mode = false;
			unavailableDefaults.capabilities.cost_sensitive = [];
			for (const model of Object.values(unavailableDefaults.models)) {
				model.available = false;
			}
			return {
				...actual,
				createBuiltinBootstrapOrchestrationConfig: () =>
					structuredClone(unavailableDefaults),
				createBuiltinOrchestrationDefaults: () =>
					structuredClone(unavailableDefaults),
			};
		});

		const { loadOrchestrationConfig, resetConfigCache, resolveProfile } =
			await import("../../config/orchestration-config.js");

		try {
			resetConfigCache();
			loadOrchestrationConfig(configPath);

			expect(() => resolveProfile("no_models_anywhere")).toThrow(
				"[orchestration] No available model is configured in the workspace or builtin defaults.",
			);
		} finally {
			resetConfigCache();
		}
	});

	it("falls back to the builtin cost_sensitive model id when the workspace list is empty", async () => {
		const workspaceConfig = createBuiltinOrchestrationDefaults();
		workspaceConfig.environment.strict_mode = false;
		workspaceConfig.capabilities.cost_sensitive = [];
		workspaceConfig.models.workspace_available = {
			id: "workspace-available-id",
			provider: "openai",
			available: true,
			context_window: 128_000,
		};
		workspaceConfig.profiles.builtin_cost_sensitive = {
			requires: ["missing_capability"],
			fallback: [],
			fan_out: 1,
		};
		const configPath = writeWorkspaceConfig(workspaceConfig);

		vi.doMock("../../config/orchestration-defaults.js", async () => {
			const actual = await vi.importActual<
				typeof import("../../config/orchestration-defaults.js")
			>("../../config/orchestration-defaults.js");
			const builtinDefaults = actual.createBuiltinOrchestrationDefaults();
			builtinDefaults.environment.strict_mode = false;
			builtinDefaults.models.builtin_cost_sensitive = {
				id: "builtin-cost-sensitive-id",
				provider: "other",
				available: true,
				context_window: 128_000,
			};
			builtinDefaults.capabilities.cost_sensitive = ["builtin_cost_sensitive"];
			return {
				...actual,
				createBuiltinOrchestrationDefaults: () =>
					structuredClone(builtinDefaults),
			};
		});

		const { loadOrchestrationConfig, resetConfigCache, resolveProfile } =
			await import("../../config/orchestration-config.js");

		try {
			resetConfigCache();
			loadOrchestrationConfig(configPath);

			expect(resolveProfile("builtin_cost_sensitive")).toBe(
				"builtin-cost-sensitive-id",
			);
		} finally {
			resetConfigCache();
		}
	});

	it("falls back to the first builtin available model id when builtin cost_sensitive is empty", async () => {
		const workspaceConfig = createBuiltinOrchestrationDefaults();
		workspaceConfig.environment.strict_mode = false;
		workspaceConfig.capabilities.cost_sensitive = [];
		workspaceConfig.models.workspace_only = {
			id: "workspace-unavailable-id",
			provider: "openai",
			available: false,
			context_window: 128_000,
		};
		workspaceConfig.profiles.builtin_available = {
			requires: ["missing_capability"],
			fallback: [],
			fan_out: 1,
		};
		const configPath = writeWorkspaceConfig(workspaceConfig);

		vi.doMock("../../config/orchestration-defaults.js", async () => {
			const actual = await vi.importActual<
				typeof import("../../config/orchestration-defaults.js")
			>("../../config/orchestration-defaults.js");
			const builtinDefaults = actual.createBuiltinOrchestrationDefaults();
			builtinDefaults.environment.strict_mode = false;
			builtinDefaults.capabilities.cost_sensitive = [];
			builtinDefaults.models.builtin_available = {
				id: "builtin-available-id",
				provider: "other",
				available: true,
				context_window: 128_000,
			};
			return {
				...actual,
				createBuiltinOrchestrationDefaults: () =>
					structuredClone(builtinDefaults),
			};
		});

		const { loadOrchestrationConfig, resetConfigCache, resolveProfile } =
			await import("../../config/orchestration-config.js");

		try {
			resetConfigCache();
			loadOrchestrationConfig(configPath);

			expect(resolveProfile("builtin_available")).toBe("builtin-available-id");
		} finally {
			resetConfigCache();
		}
	});

	it("logs advisory fallback details when a non-ENOENT load failure uses builtin defaults", async () => {
		const configPath = writeWorkspaceConfig(
			createBuiltinOrchestrationDefaults(),
		);
		writeFileSync(configPath, "models = [", "utf8");
		const logSpy = vi
			.spyOn(
				(await import("../../infrastructure/observability.js"))
					.ObservabilityOrchestrator.prototype,
				"log",
			)
			.mockImplementation(() => {});

		vi.doMock("../../config/orchestration-defaults.js", async () => {
			const actual = await vi.importActual<
				typeof import("../../config/orchestration-defaults.js")
			>("../../config/orchestration-defaults.js");
			const advisoryDefaults = actual.createBuiltinOrchestrationDefaults();
			advisoryDefaults.environment.strict_mode = false;
			advisoryDefaults.models.advisory_fallback = {
				id: "builtin-advisory-id",
				provider: "other",
				available: true,
				context_window: 128_000,
			};
			return {
				...actual,
				createBuiltinOrchestrationDefaults: () =>
					structuredClone(advisoryDefaults),
			};
		});

		const { loadOrchestrationConfig, resetConfigCache } = await import(
			"../../config/orchestration-config.js"
		);

		try {
			resetConfigCache();
			const config = loadOrchestrationConfig(configPath);

			expect(config.environment.strict_mode).toBe(false);
			expect(config.models.advisory_fallback?.id).toBe("builtin-advisory-id");
			expect(logSpy).toHaveBeenCalledWith(
				"warn",
				"Falling back to builtin orchestration defaults",
				expect.objectContaining({
					configPath,
					fallbackSource: "src/config/orchestration-defaults.ts",
					error: expect.any(String),
				}),
			);
		} finally {
			resetConfigCache();
			logSpy.mockRestore();
		}
	});
});
