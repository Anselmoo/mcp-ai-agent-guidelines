import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
	createDefaultOrchestrationConfig,
	getAvailableModelsForTier,
	getDomainRouting,
	getDomainTier,
	getFanOut,
	getHumanInLoopProfiles,
	getProfileForSkill,
	ORCHESTRATION_CONFIG_RELATIVE_PATH,
	parseOrchestrationConfigValue,
	resetConfigCache,
	resolveCapability,
	resolveCapabilityToIds,
	resolveForSkill,
	resolveOrchestrationConfigPath,
	resolveProfile,
} from "../../config/orchestration-config.js";
import { renderOrchestrationToml } from "../../config/orchestration-config-service.js";
import { BUILTIN_ORCHESTRATION_DEFAULTS_SOURCE } from "../../config/orchestration-defaults.js";
import { ObservabilityOrchestrator } from "../../infrastructure/observability.js";

describe("orchestration-config: capability-driven resolver", () => {
	afterEach(() => {
		resetConfigCache();
	});

	// ── Physical layer ──────────────────────────────────────────────────────

	it("resolves capability tag to available model aliases", () => {
		const aliases = resolveCapability("fast_draft");
		expect(Array.isArray(aliases)).toBe(true);
		expect(aliases.length).toBeGreaterThan(0);
	});

	it("resolveCapabilityToIds returns physical model IDs not aliases", () => {
		const ids = resolveCapabilityToIds("cost_sensitive");
		expect(ids.every((id) => !id.startsWith("model_"))).toBe(true);
	});

	it("resolves the workspace orchestration path from the shared relative path", () => {
		expect(resolveOrchestrationConfigPath("/tmp/test-workspace")).toBe(
			resolve("/tmp/test-workspace", ORCHESTRATION_CONFIG_RELATIVE_PATH),
		);
	});

	it("keeps the committed workspace config aligned with the builtin cheap secondary lane", async () => {
		const { loadOrchestrationConfig } = await import(
			"../../config/orchestration-config.js"
		);
		resetConfigCache();
		const config = loadOrchestrationConfig(resolveOrchestrationConfigPath());

		expect(config.models.cheap_secondary).toMatchObject({
			id: "gpt-5-4-mini",
			provider: "openai",
			available: true,
			context_window: 400000,
		});
		expect(config.capabilities.fast_draft).toContain("cheap_secondary");
		expect(config.capabilities.cost_sensitive).toContain("cheap_secondary");
	});

	it("available models are returned from capability resolution", () => {
		const aliases = resolveCapability("deep_reasoning");
		expect(aliases).toEqual(["strong_primary", "strong_secondary"]);
	});

	it("does not warn when a capability has available configured models", () => {
		const logSpy = vi
			.spyOn(ObservabilityOrchestrator.prototype, "log")
			.mockImplementation(() => {});

		expect(resolveCapability("deep_reasoning")).toEqual([
			"strong_primary",
			"strong_secondary",
		]);
		expect(logSpy).not.toHaveBeenCalled();

		logSpy.mockRestore();
	});

	// ── Profile resolver ────────────────────────────────────────────────────

	it("resolves research profile (large_context) to an available model", () => {
		const modelId = resolveProfile("research");
		expect(typeof modelId).toBe("string");
		expect(modelId.length).toBeGreaterThan(0);
	});

	it("resolves implement profile via intersection of requires", () => {
		const modelId = resolveProfile("implement");
		expect(modelId).toBe("gpt-4-1");
	});

	it("resolves governance via available strong models", () => {
		expect(resolveProfile("governance")).toBe("gpt-5-4");
	});

	it("resolves physics_analysis via available strong models", () => {
		expect(resolveProfile("physics_analysis")).toBe("gpt-5-4");
	});

	it("unknown profile falls back to default profile", () => {
		const modelId = resolveProfile("nonexistent_profile_xyz");
		expect(typeof modelId).toBe("string");
		expect(modelId.length).toBeGreaterThan(0);
	});

	it("falls back to cost_sensitive in non-strict mode when requires are unsatisfied", async () => {
		const logSpy = vi
			.spyOn(ObservabilityOrchestrator.prototype, "log")
			.mockImplementation(() => {});
		const workspaceRoot = mkdtempSync(`${tmpdir()}/orch-nonstrict-`);
		const configPath = resolve(
			workspaceRoot,
			ORCHESTRATION_CONFIG_RELATIVE_PATH,
		);
		const config = createDefaultOrchestrationConfig();
		config.environment.strict_mode = false;
		config.models.free_primary = {
			id: "gpt-5.1-mini",
			provider: "openai",
			available: true,
			context_window: 128_000,
		};
		// Mark strong models as unavailable so deep_reasoning yields empty candidates
		config.models.strong_primary = {
			id: "sonnet-4.6",
			provider: "anthropic",
			available: false,
			context_window: 200_000,
		};
		config.models.strong_secondary = {
			id: "gpt-5.4",
			provider: "openai",
			available: false,
			context_window: 128_000,
		};
		config.profiles.loose_profile = {
			requires: ["deep_reasoning"],
			fallback: [],
			fan_out: 1,
		};

		try {
			mkdirSync(resolve(workspaceRoot, ".mcp-ai-agent-guidelines/config"), {
				recursive: true,
			});
			writeFileSync(configPath, renderOrchestrationToml(config), "utf8");
			const { loadOrchestrationConfig } = await import(
				"../../config/orchestration-config.js"
			);
			resetConfigCache();
			loadOrchestrationConfig(configPath);

			expect(resolveProfile("loose_profile")).toBe("gpt-5.1-mini");
			expect(logSpy).toHaveBeenCalledWith(
				"warn",
				"Profile requirements unavailable; falling back to cost_sensitive",
				expect.objectContaining({
					profileName: "loose_profile",
				}),
			);
		} finally {
			resetConfigCache();
			rmSync(workspaceRoot, { recursive: true, force: true });
			logSpy.mockRestore();
		}
	});

	it("uses the last-resort configured model when a fallback alias is missing", async () => {
		const workspaceRoot = mkdtempSync(`${tmpdir()}/orch-missing-alias-`);
		const configPath = resolve(
			workspaceRoot,
			ORCHESTRATION_CONFIG_RELATIVE_PATH,
		);
		const config = createDefaultOrchestrationConfig();
		config.environment.strict_mode = false;
		config.models.free_primary = {
			id: "gpt-5.1-mini",
			provider: "openai",
			available: true,
			context_window: 128_000,
		};
		config.profiles.missing_alias_profile = {
			requires: ["does_not_exist"],
			fallback: ["fast_draft"],
			fan_out: 1,
		};
		config.capabilities.fast_draft = ["missing_alias"];

		try {
			mkdirSync(resolve(workspaceRoot, ".mcp-ai-agent-guidelines/config"), {
				recursive: true,
			});
			writeFileSync(configPath, renderOrchestrationToml(config), "utf8");
			const { loadOrchestrationConfig } = await import(
				"../../config/orchestration-config.js"
			);
			resetConfigCache();
			loadOrchestrationConfig(configPath);

			expect(resolveProfile("missing_alias_profile")).toBe("gpt-5.1-mini");
		} finally {
			resetConfigCache();
			rmSync(workspaceRoot, { recursive: true, force: true });
		}
	});

	// ── Skill routing ───────────────────────────────────────────────────────

	it("getProfileForSkill maps qm-* to physics_analysis", () => {
		expect(getProfileForSkill("qm-entanglement-mapper")).toBe(
			"physics_analysis",
		);
	});

	it("getProfileForSkill maps gov-* to governance", () => {
		expect(getProfileForSkill("gov-policy-validation")).toBe("governance");
	});

	it("getProfileForSkill maps doc-* to documentation", () => {
		expect(getProfileForSkill("doc-generator")).toBe("documentation");
	});

	it("getProfileForSkill maps gr-* to physics_analysis", () => {
		expect(getProfileForSkill("gr-geodesic-refactor")).toBe("physics_analysis");
	});

	it("getProfileForSkill returns default for unknown prefix", () => {
		expect(getProfileForSkill("unknown-skill-xyz")).toBe("default");
	});

	it("resolveForSkill uses current routing profiles for specialized domains", () => {
		// Only test skills that should succeed
		const skills = [
			"doc-generator",
			"synth-research",
			"arch-system",
			"eval-design",
			"debug-assistant",
			"unknown-prefix-skill",
		];
		for (const skill of skills) {
			const id = resolveForSkill(skill);
			expect(typeof id).toBe("string");
			expect(id.length).toBeGreaterThan(0);
		}
		expect(resolveForSkill("qm-entanglement-mapper")).toBe("gpt-5-4");
		expect(resolveForSkill("gov-policy-validation")).toBe("gpt-5-4");
	});

	// ── Domain routing metadata ─────────────────────────────────────────────

	it("getDomainRouting returns require_human_in_loop for gov-*", () => {
		const routing = getDomainRouting("gov-policy-validation");
		expect(routing).not.toBeNull();
		expect(routing?.require_human_in_loop).toBe(true);
	});

	it("getDomainRouting returns enforce_schema for qm-*", () => {
		const routing = getDomainRouting("qm-entanglement-mapper");
		expect(routing?.enforce_schema).toBe(true);
	});

	it("getDomainRouting returns null for unknown prefix", () => {
		expect(getDomainRouting("unknown-xyz")).toBeNull();
	});

	// ── Fan-out ─────────────────────────────────────────────────────────────

	it("research profile has fan_out=3", () => {
		expect(getFanOut("research")).toBe(3);
	});

	it("bootstrap profile has fan_out=1", () => {
		expect(getFanOut("bootstrap")).toBe(1);
	});

	it("unknown profile fan_out defaults to 1", () => {
		expect(getFanOut("does_not_exist")).toBe(1);
	});

	// ── Human-in-loop ───────────────────────────────────────────────────────

	it("getHumanInLoopProfiles returns governance", () => {
		const profiles = getHumanInLoopProfiles();
		expect(profiles).toContain("governance");
	});

	it("exposes legacy tier compatibility shims", () => {
		expect(getDomainTier("gov-policy-validation")).toBe("governance");
		expect(getAvailableModelsForTier("cost_sensitive")).toContain("gpt-4.1");
	});

	// ── Fallback / error paths ──────────────────────────────────────────────

	it("resetConfigCache forces re-read on next call", () => {
		const first = resolveProfile("research");
		resetConfigCache();
		const second = resolveProfile("research");
		expect(second).toBe(first); // same result, but reloaded
	});

	it("loadOrchestrationConfig with bad path fails fast in strict mode", async () => {
		const { loadOrchestrationConfig } = await import(
			"../../config/orchestration-config.js"
		);
		resetConfigCache();
		expect(() => loadOrchestrationConfig("/nonexistent/path.toml")).toThrow(
			new RegExp(BUILTIN_ORCHESTRATION_DEFAULTS_SOURCE),
		);
		resetConfigCache();
	});

	it("rejects schema-invalid orchestration config values before they reach typed code", () => {
		const invalid = {
			...createDefaultOrchestrationConfig(),
			models: {
				model_a: {
					...createDefaultOrchestrationConfig().models.model_a,
					provider: "azure",
				},
			},
		};

		expect(() => parseOrchestrationConfigValue(invalid)).toThrowError(
			/anthropic|openai/i,
		);
	});

	it("rejects syntactically valid but schema-invalid orchestration documents", async () => {
		const { loadOrchestrationConfig } = await import(
			"../../config/orchestration-config.js"
		);
		const workspaceRoot = mkdtempSync(`${tmpdir()}/orch-invalid-`);
		const configPath = resolve(
			workspaceRoot,
			ORCHESTRATION_CONFIG_RELATIVE_PATH,
		);

		try {
			mkdirSync(resolve(workspaceRoot, ".mcp-ai-agent-guidelines/config"), {
				recursive: true,
			});
			writeFileSync(
				configPath,
				[
					"[environment]",
					"strict_mode = true",
					"default_max_context = 128000",
					"enable_cost_tracking = true",
					"",
					"[models.model_a]",
					'id = "gpt-5.1-mini"',
					'provider = "azure"',
					"available = true",
					"context_window = 128000",
					"",
					"[capabilities]",
					'cost_sensitive = ["model_a"]',
					"",
					"[profiles.default]",
					"requires = []",
					'fallback = ["cost_sensitive"]',
					"fan_out = 1",
					"",
					"[routing.domains]",
					"",
					"[orchestration.patterns]",
					"",
					"[resilience]",
					"rate_limit_backoff_ms = 100",
					"auto_escalate_on_consecutive_failures = 2",
					"max_escalation_depth = 2",
					"",
					"[cache]",
					"default_ttl_seconds = 60",
					"",
					"[cache.profile_overrides]",
				].join("\n"),
				"utf8",
			);

			resetConfigCache();
			expect(() => loadOrchestrationConfig(configPath)).toThrowError(
				/anthropic|openai/i,
			);
		} finally {
			resetConfigCache();
			rmSync(workspaceRoot, { recursive: true, force: true });
		}
	});
});
