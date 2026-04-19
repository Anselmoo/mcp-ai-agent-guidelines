import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	createDefaultOrchestrationConfig,
	type OrchestrationConfig,
	parseOrchestrationConfigPatch,
} from "../../config/orchestration-config.js";
import {
	deriveModelAvailabilityConfig,
	getOrchestrationConfigSummary,
	loadOrchestrationConfigForWorkspace,
	mergeOrchestrationConfig,
	renderOrchestrationToml,
	resolveConfigPaths,
	saveOrchestrationConfig,
} from "../../config/orchestration-config-service.js";
import { dispatchOrchestrationToolCall } from "../../tools/orchestration-tools.js";

describe("orchestration-config-service", () => {
	let workspaceRoot = "";
	let cwdSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		workspaceRoot = mkdtempSync(join(tmpdir(), "orch-config-"));
		cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(workspaceRoot);
	});

	afterEach(() => {
		cwdSpy.mockRestore();
		rmSync(workspaceRoot, { recursive: true, force: true });
	});

	it("reports fallback-defaults status when no workspace orchestration file exists", async () => {
		const loaded = await loadOrchestrationConfigForWorkspace(workspaceRoot);
		const summary = await getOrchestrationConfigSummary(workspaceRoot);

		expect(loaded.exists).toBe(false);
		expect(loaded.source).toBe("fallback-defaults");
		expect(loaded.warning).toContain("Using advisory bootstrap defaults");
		expect(loaded.config.environment.strict_mode).toBe(false);
		expect(loaded.config.models.free_primary?.id).toBe("free_primary");
		expect(summary.configSource).toBe("fallback-defaults");
		expect(summary.usingFallbackDefaults).toBe(true);
		expect(summary.warning).toContain("Using advisory bootstrap defaults");
	});

	it("makes the synchronous orchestration resolver honor the workspace primary config", async () => {
		const { loadOrchestrationConfig, resetConfigCache } = await import(
			"../../config/orchestration-config.js"
		);
		const config = createDefaultOrchestrationConfig();
		config.environment.strict_mode = false;

		await saveOrchestrationConfig(config, { workspaceRoot });
		resetConfigCache();

		const loaded = loadOrchestrationConfig();

		expect(loaded.environment.strict_mode).toBe(false);
		resetConfigCache();
	});

	it("saves orchestration.toml without creating a derived compatibility file", async () => {
		const config = createDefaultOrchestrationConfig();
		config.environment.strict_mode = false;
		config.models.model_d = {
			id: "sonnet-4.6",
			provider: "anthropic",
			available: true,
			context_window: 200_000,
		};

		await saveOrchestrationConfig(config, { workspaceRoot });

		const loaded = await loadOrchestrationConfigForWorkspace(workspaceRoot);

		expect(loaded.exists).toBe(true);
		expect(loaded.source).toBe("workspace");
		expect(loaded.config.environment.strict_mode).toBe(false);
		expect(() =>
			readFileSync(join(workspaceRoot, ".mcp-models.toml"), "utf8"),
		).toThrow();
	});

	it("ignores stale legacy model files because orchestration.toml is the only authority", async () => {
		const config = createDefaultOrchestrationConfig();
		config.models.free_primary = {
			id: "gpt-4.1",
			provider: "openai",
			available: true,
			context_window: 128_000,
		};

		await saveOrchestrationConfig(config, { workspaceRoot });
		writeFileSync(
			join(workspaceRoot, ".mcp-models.toml"),
			`advisory = false\n\n[models."gpt-4.1"]\navailable = false\nreason = "stale"\n`,
			"utf8",
		);

		const loaded = await loadOrchestrationConfigForWorkspace(workspaceRoot);
		expect(loaded.config.models.free_primary.available).toBe(true);
	});

	it("falls back with warning when workspace orchestration.toml is unreadable", async () => {
		const config = createDefaultOrchestrationConfig();
		const paths = await saveOrchestrationConfig(config, { workspaceRoot });
		writeFileSync(paths.orchestrationPath, "not valid toml =", "utf8");

		const loaded = await loadOrchestrationConfigForWorkspace(workspaceRoot);

		expect(loaded.exists).toBe(true);
		expect(loaded.source).toBe("fallback-defaults");
		expect(loaded.readError).toBeTruthy();
		expect(loaded.warning).toContain("could not be read");
	});

	it("re-validates merged configs before returning them", () => {
		const config = createDefaultOrchestrationConfig();
		const invalidMergedPatch = parseOrchestrationConfigPatch({
			environment: {
				strict_mode: undefined,
			},
		});

		expect(() => mergeOrchestrationConfig(config, invalidMergedPatch)).toThrow(
			/strict_mode|boolean|required/i,
		);
	});

	it("preserves untouched nested fields when merging partial object patches", () => {
		const config = createDefaultOrchestrationConfig();
		const firstDomain = Object.keys(config.routing.domains)[0];
		expect(firstDomain).toBeDefined();
		const domainKey = firstDomain as string;
		const modelKey = "free_primary";
		config.models[modelKey] = {
			id: "gpt-4.1",
			provider: "openai",
			available: true,
			context_window: 128_000,
		};

		const merged = mergeOrchestrationConfig(
			config,
			parseOrchestrationConfigPatch({
				models: {
					[modelKey]: {
						available: false,
						reason: "disabled for tests",
					},
				},
				routing: {
					domains: {
						[domainKey]: {
							max_retries: 99,
						},
					},
				},
			}),
		);

		expect(merged.models[modelKey].id).toBe(config.models[modelKey].id);
		expect(merged.models[modelKey].provider).toBe(
			config.models[modelKey].provider,
		);
		expect(merged.models[modelKey].available).toBe(false);
		expect(merged.models[modelKey].reason).toBe("disabled for tests");
		expect(merged.routing.domains[domainKey]?.profile).toBe(
			config.routing.domains[domainKey]?.profile,
		);
		expect(merged.routing.domains[domainKey]?.max_retries).toBe(99);
	});

	it("merges capability arrays, cache overrides, and new record entries", () => {
		const config = createDefaultOrchestrationConfig();
		const firstProfileKey = Object.keys(config.profiles)[0];
		expect(firstProfileKey).toBeDefined();
		const profileKey = firstProfileKey as string;

		const merged = mergeOrchestrationConfig(
			config,
			parseOrchestrationConfigPatch({
				capabilities: {
					cost_sensitive: ["custom-cheap"],
				},
				cache: {
					profile_overrides: {
						custom_profile: 45,
					},
				},
				models: {
					model_z: {
						id: "custom-cheap",
						provider: "openai",
						context_window: 64_000,
						available: false,
						reason: "disabled for merge coverage",
					},
				},
				profiles: {
					custom_profile: {
						...config.profiles[profileKey],
						fan_out: 3,
					},
				},
			}),
		);

		expect(merged.capabilities.cost_sensitive).toEqual(["custom-cheap"]);
		expect(merged.cache.profile_overrides).toMatchObject({
			...config.cache.profile_overrides,
			custom_profile: 45,
		});
		expect(merged.models.model_z).toMatchObject({
			id: "custom-cheap",
			available: false,
			reason: "disabled for merge coverage",
		});
		expect(merged.profiles.custom_profile?.fan_out).toBe(3);
	});

	it("exposes non-interactive orchestration read/write helpers for MCP", async () => {
		const writeResult = await dispatchOrchestrationToolCall(
			"orchestration-config",
			{
				command: "write",
				resetToDefaults: true,
				patch: {
					environment: {
						strict_mode: false,
					},
				},
			},
		);
		const readResult = await dispatchOrchestrationToolCall(
			"orchestration-config",
			{ command: "read" },
		);
		const readText =
			readResult.content[0]?.type === "text" ? readResult.content[0].text : "";

		expect(writeResult.isError).toBe(false);
		expect(readResult.isError).toBe(false);
		expect(readText).toContain('"configSource": "workspace"');
		expect(readText).toContain('"strict_mode": false');
		expect(readText).toContain('"derivedModelAvailability"');
	});

	it("resolves workspace config paths deterministically", () => {
		const paths = resolveConfigPaths(workspaceRoot);

		expect(paths.workspaceRoot).toBe(workspaceRoot);
		expect(paths.configDirectory).toBe(
			join(workspaceRoot, ".mcp-ai-agent-guidelines", "config"),
		);
		expect(paths.orchestrationPath).toBe(
			join(
				workspaceRoot,
				".mcp-ai-agent-guidelines",
				"config",
				"orchestration.toml",
			),
		);
	});

	it("derives model availability declarations and classes from the primary config", () => {
		const config = createDefaultOrchestrationConfig();
		config.environment.strict_mode = false;
		config.models.free_primary = {
			id: "gpt-5.1-mini",
			provider: "openai",
			available: true,
			context_window: 128_000,
		};
		config.models.cheap_primary = {
			id: "haiku",
			provider: "anthropic",
			available: false,
			reason: "missing key",
			context_window: 200_000,
		};

		const derived = deriveModelAvailabilityConfig(config);
		const classes = derived.classes;

		expect(derived.advisory).toBe(true);
		expect(derived.models["gpt-5.1-mini"]).toMatchObject({
			available: true,
			reason: "Available",
		});
		expect(derived.models.haiku).toMatchObject({
			available: false,
			reason: "missing key",
		});
		expect(classes).toBeDefined();
		expect(classes?.free).toContain("gpt-5.1-mini");
		expect(classes?.cheap).toContain("haiku");
	});

	it("classifies non-builtin models through capability assignments", () => {
		const config = createDefaultOrchestrationConfig();
		config.models.custom_strong = {
			id: "custom-strong",
			provider: "openai",
			available: true,
			context_window: 64_000,
		};
		config.models.custom_reviewer = {
			id: "custom-reviewer",
			provider: "openai",
			available: true,
			context_window: 64_000,
		};
		config.models.custom_cheap = {
			id: "custom-cheap",
			provider: "openai",
			available: true,
			context_window: 64_000,
		};
		config.capabilities.security_audit = ["custom_strong"];
		config.capabilities.classification = ["custom_reviewer"];
		config.capabilities.cost_sensitive = ["custom_cheap"];

		const derived = deriveModelAvailabilityConfig(config);
		const classes = derived.classes;

		expect(derived.models["custom-strong"]?.modelClass).toBe("strong");
		expect(derived.models["custom-reviewer"]?.modelClass).toBe("reviewer");
		expect(derived.models["custom-cheap"]?.modelClass).toBe("cheap");
		expect(classes).toBeDefined();
		expect(classes?.strong).toContain("custom-strong");
		expect(classes?.reviewer).toContain("custom-reviewer");
		expect(classes?.cheap).toContain("custom-cheap");
	});

	it("renders orchestration TOML with the managed header and config content", () => {
		const config = createDefaultOrchestrationConfig();
		config.environment.strict_mode = false;

		const rendered = renderOrchestrationToml(config);

		expect(rendered).toContain("Primary authority. Edit this file");
		expect(rendered).toContain("strict_mode = false");
		expect(rendered).toContain("[environment]");
	});
});
