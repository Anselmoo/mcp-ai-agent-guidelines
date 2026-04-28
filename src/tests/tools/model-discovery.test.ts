import { afterEach, describe, expect, it, vi } from "vitest";
import { createDefaultOrchestrationConfig } from "../../config/orchestration-config.js";
import * as orchestrationConfigService from "../../config/orchestration-config-service.js";
import {
	type DiscoveryModelEntry,
	dispatchModelDiscoveryToolCall,
	MODEL_DISCOVERY_TOOL_DEFINITIONS,
	MODEL_DISCOVERY_TOOL_VALIDATORS,
	performModelDiscovery,
} from "../../tools/model-discovery.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeEntry(
	overrides: Partial<DiscoveryModelEntry> & {
		id: string;
		role: DiscoveryModelEntry["role"];
	},
): DiscoveryModelEntry {
	return { provider: "openai", ...overrides };
}

function getFirstText(
	result: Awaited<ReturnType<typeof dispatchModelDiscoveryToolCall>>,
): string {
	const first = result.content[0];
	expect(first?.type).toBe("text");
	return first?.type === "text" ? first.text : "";
}

afterEach(() => {
	vi.restoreAllMocks();
});

// ─── performModelDiscovery (pure logic) ───────────────────────────────────────

describe("performModelDiscovery", () => {
	it("returns empty models and warnings for empty input", () => {
		const result = performModelDiscovery([]);
		expect(result.models).toEqual({});
		expect(result.assignedRoles).toHaveLength(0);
		expect(result.unassignedRoles).toHaveLength(7);
		// Missing recommended roles should generate warnings
		expect(result.warnings.some((w) => w.includes("free_primary"))).toBe(true);
		expect(result.warnings.some((w) => w.includes("strong_primary"))).toBe(
			true,
		);
	});

	it("builds a correct models record keyed by role name", () => {
		const entries: DiscoveryModelEntry[] = [
			makeEntry({ id: "gpt-4.1", role: "free_primary" }),
			makeEntry({
				id: "claude-sonnet-4-5",
				role: "strong_primary",
				provider: "anthropic",
			}),
		];
		const result = performModelDiscovery(entries);
		expect(result.models["free_primary"]?.id).toBe("gpt-4.1");
		expect(result.models["strong_primary"]?.id).toBe("claude-sonnet-4-5");
		expect(result.models["strong_primary"]?.provider).toBe("anthropic");
	});

	it("defaults context_window to 128_000 when omitted", () => {
		const entries = [makeEntry({ id: "my-model", role: "free_primary" })];
		const result = performModelDiscovery(entries);
		expect(result.models["free_primary"]?.context_window).toBe(128_000);
	});

	it("defaults available to true when omitted", () => {
		const entries = [makeEntry({ id: "my-model", role: "free_primary" })];
		const result = performModelDiscovery(entries);
		expect(result.models["free_primary"]?.available).toBe(true);
	});

	it("preserves explicit context_window and available values", () => {
		const entries = [
			makeEntry({
				id: "big-model",
				role: "strong_primary",
				provider: "anthropic",
				context_window: 200_000,
				available: false,
				reason: "Quota exceeded",
			}),
		];
		const result = performModelDiscovery(entries);
		const model = result.models["strong_primary"];
		expect(model?.context_window).toBe(200_000);
		expect(model?.available).toBe(false);
		expect(model?.reason).toBe("Quota exceeded");
	});

	it("skips entries with an unknown role and adds a warning", () => {
		const entries = [
			makeEntry({ id: "gpt-4.1", role: "free_primary" }),
			{
				id: "unknown-model",
				role: "supermodel" as DiscoveryModelEntry["role"],
				provider: "openai" as const,
			},
		];
		const result = performModelDiscovery(entries);
		expect(Object.keys(result.models)).toHaveLength(1);
		expect(result.warnings.some((w) => w.includes("supermodel"))).toBe(true);
	});

	it("skips entries with missing or invalid ids", () => {
		const entries = [
			{ id: "", role: "free_primary", provider: "openai" },
			{
				id: 42 as unknown as string,
				role: "strong_primary",
				provider: "openai",
			},
		] as DiscoveryModelEntry[];
		const result = performModelDiscovery(entries);

		expect(result.models).toEqual({});
		expect(
			result.warnings.filter((warning) =>
				warning.includes("missing or invalid id"),
			),
		).toHaveLength(2);
	});

	it("overwrites a duplicate role with a warning", () => {
		const entries: DiscoveryModelEntry[] = [
			makeEntry({ id: "first-model", role: "cheap_primary" }),
			makeEntry({ id: "second-model", role: "cheap_primary" }),
		];
		const result = performModelDiscovery(entries);
		expect(result.models["cheap_primary"]?.id).toBe("second-model");
		expect(
			result.warnings.some(
				(w) => w.includes("cheap_primary") && w.includes("Overwriting"),
			),
		).toBe(true);
	});

	it("computes assignedRoles and unassignedRoles correctly", () => {
		const entries: DiscoveryModelEntry[] = [
			makeEntry({ id: "m1", role: "free_primary" }),
			makeEntry({ id: "m2", role: "strong_primary", provider: "anthropic" }),
		];
		const result = performModelDiscovery(entries);
		expect(result.assignedRoles).toContain("free_primary");
		expect(result.assignedRoles).toContain("strong_primary");
		expect(result.unassignedRoles).not.toContain("free_primary");
		expect(result.unassignedRoles).not.toContain("strong_primary");
		expect(result.unassignedRoles).toHaveLength(5);
	});

	it("does not warn about free_primary when it is assigned", () => {
		const entries = [
			makeEntry({ id: "gpt-4.1-mini", role: "free_primary" }),
			makeEntry({
				id: "claude-s",
				role: "strong_primary",
				provider: "anthropic",
			}),
		];
		const result = performModelDiscovery(entries);
		const freeWarn = result.warnings.filter(
			(w) => w.includes("free_primary") && w.includes("No model"),
		);
		expect(freeWarn).toHaveLength(0);
	});

	it("defaults provider to other when it is omitted", () => {
		const entries = [
			{
				id: "portable-model",
				role: "free_primary",
				provider: undefined,
			},
		] as unknown as DiscoveryModelEntry[];
		const result = performModelDiscovery(entries);

		expect(result.models["free_primary"]?.provider).toBe("other");
	});

	it("handles all 7 roles assigned with no warnings", () => {
		const entries: DiscoveryModelEntry[] = [
			makeEntry({ id: "m-fp", role: "free_primary" }),
			makeEntry({ id: "m-fs", role: "free_secondary" }),
			makeEntry({ id: "m-cp", role: "cheap_primary" }),
			makeEntry({ id: "m-cs", role: "cheap_secondary" }),
			makeEntry({ id: "m-sp", role: "strong_primary", provider: "anthropic" }),
			makeEntry({
				id: "m-ss",
				role: "strong_secondary",
				provider: "anthropic",
			}),
			makeEntry({ id: "m-rp", role: "reviewer_primary", provider: "google" }),
		];
		const result = performModelDiscovery(entries);
		expect(Object.keys(result.models)).toHaveLength(7);
		expect(result.assignedRoles).toHaveLength(7);
		expect(result.unassignedRoles).toHaveLength(0);
		// No missing-role warnings expected
		const missingWarn = result.warnings.filter((w) => w.startsWith("No model"));
		expect(missingWarn).toHaveLength(0);
	});
});

// ─── Tool definitions ─────────────────────────────────────────────────────────

describe("MODEL_DISCOVERY_TOOL_DEFINITIONS", () => {
	it("exports exactly one tool named model-discover", () => {
		expect(MODEL_DISCOVERY_TOOL_DEFINITIONS).toHaveLength(1);
		expect(MODEL_DISCOVERY_TOOL_DEFINITIONS[0]?.name).toBe("model-discover");
	});

	it("every tool definition has a corresponding validator", () => {
		for (const def of MODEL_DISCOVERY_TOOL_DEFINITIONS) {
			expect(MODEL_DISCOVERY_TOOL_VALIDATORS.has(def.name)).toBe(true);
		}
	});

	it("tool input schema requires a models array", () => {
		const schema = MODEL_DISCOVERY_TOOL_DEFINITIONS[0]?.inputSchema;
		expect(schema?.required).toContain("models");
	});
});

// ─── dispatchModelDiscoveryToolCall (integration) ─────────────────────────────

describe("dispatchModelDiscoveryToolCall", () => {
	it("returns an error for an unknown tool name", async () => {
		const result = await dispatchModelDiscoveryToolCall("no-such-tool", {});
		expect(result.isError).toBe(true);
		expect(getFirstText(result)).toContain("Unknown model discovery tool");
	});

	it("returns an error when required models argument is missing", async () => {
		const result = await dispatchModelDiscoveryToolCall("model-discover", {});
		expect(result.isError).toBe(true);
	});

	it("returns an error when models is not an array", async () => {
		const result = await dispatchModelDiscoveryToolCall("model-discover", {
			models: "not-an-array",
		});
		expect(result.isError).toBe(true);
	});

	it("succeeds and returns a JSON result for valid input", async () => {
		const result = await dispatchModelDiscoveryToolCall("model-discover", {
			models: [
				{ id: "gpt-4.1", role: "free_primary", provider: "openai" },
				{
					id: "claude-sonnet-4-5",
					role: "strong_primary",
					provider: "anthropic",
				},
			],
		});
		const text = getFirstText(result);
		const parsed = JSON.parse(text) as Record<string, unknown>;
		expect(result.isError).toBeFalsy();
		expect(parsed).toHaveProperty("assignedRoles");
		expect(parsed.assignedRoles as string[]).toContain("free_primary");
	});

	it("returns a validation summary when all entries become invalid after validation", async () => {
		const result = await dispatchModelDiscoveryToolCall("model-discover", {
			models: [{ id: "", role: "free_primary", provider: "openai" }],
		});
		const text = getFirstText(result);

		expect(result.isError).toBe(true);
		expect(text).toContain("No valid model entries after validation");
		expect(text).toContain("Skipping entry with missing or invalid id");
	});

	it("returns a success payload without warnings when validation is clean", async () => {
		const loadSpy = vi
			.spyOn(orchestrationConfigService, "loadOrchestrationConfigForWorkspace")
			.mockResolvedValue({
				config: createDefaultOrchestrationConfig(),
				exists: true,
				paths: {
					workspaceRoot: "/workspace",
					configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
					orchestrationPath:
						"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
				},
				source: "workspace",
				warning: undefined,
			});
		const saveSpy = vi
			.spyOn(orchestrationConfigService, "saveOrchestrationConfig")
			.mockResolvedValue({
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			});

		const result = await dispatchModelDiscoveryToolCall("model-discover", {
			models: [
				{ id: "gpt-5-mini", role: "free_primary", provider: "openai" },
				{
					id: "claude-sonnet-4-5",
					role: "strong_primary",
					provider: "anthropic",
				},
			],
		});
		const parsed = JSON.parse(getFirstText(result)) as {
			success: boolean;
			warnings?: string[];
			savedTo: { workspaceRoot: string };
		};

		expect(result.isError).toBeFalsy();
		expect(parsed.success).toBe(true);
		expect(parsed.warnings).toBeUndefined();
		expect(parsed.savedTo.workspaceRoot).toBe("/workspace");
		expect(loadSpy).toHaveBeenCalledWith(undefined);
		expect(saveSpy).toHaveBeenCalledWith(expect.any(Object), {
			workspaceRoot: undefined,
		});
	});

	it("returns warnings and uses the provided workspace root when saving succeeds", async () => {
		const loadSpy = vi
			.spyOn(orchestrationConfigService, "loadOrchestrationConfigForWorkspace")
			.mockResolvedValue({
				config: createDefaultOrchestrationConfig(),
				exists: false,
				paths: {
					workspaceRoot: "/custom/workspace",
					configDirectory: "/custom/workspace/.mcp-ai-agent-guidelines/config",
					orchestrationPath:
						"/custom/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
				},
				source: "fallback-defaults",
				warning: "using defaults",
			});
		const saveSpy = vi
			.spyOn(orchestrationConfigService, "saveOrchestrationConfig")
			.mockResolvedValue({
				workspaceRoot: "/custom/workspace",
				configDirectory: "/custom/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/custom/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			});

		const result = await dispatchModelDiscoveryToolCall("model-discover", {
			models: [
				{ id: "gpt-5-mini", role: "free_primary", provider: "openai" },
				{
					id: "gpt-5-mini-alt",
					role: "free_primary",
					provider: "openai",
				},
				{
					id: "claude-sonnet-4-5",
					role: "strong_primary",
					provider: "anthropic",
				},
			],
			workspace_root: "/custom/workspace",
		});
		const parsed = JSON.parse(getFirstText(result)) as {
			warnings?: string[];
			savedTo: { workspaceRoot: string };
		};

		expect(result.isError).toBeFalsy();
		expect(parsed.warnings).toEqual(
			expect.arrayContaining([
				expect.stringContaining('Role "free_primary" already assigned'),
			]),
		);
		expect(parsed.savedTo.workspaceRoot).toBe("/custom/workspace");
		expect(loadSpy).toHaveBeenCalledWith("/custom/workspace");
		expect(saveSpy).toHaveBeenCalledWith(expect.any(Object), {
			workspaceRoot: "/custom/workspace",
		});
	});

	it("returns an error when saving the merged config fails", async () => {
		vi.spyOn(
			orchestrationConfigService,
			"loadOrchestrationConfigForWorkspace",
		).mockResolvedValue({
			config: createDefaultOrchestrationConfig(),
			exists: true,
			paths: {
				workspaceRoot: "/workspace",
				configDirectory: "/workspace/.mcp-ai-agent-guidelines/config",
				orchestrationPath:
					"/workspace/.mcp-ai-agent-guidelines/config/orchestration.toml",
			},
			source: "workspace",
			warning: undefined,
		});
		vi.spyOn(
			orchestrationConfigService,
			"saveOrchestrationConfig",
		).mockRejectedValue(new Error("disk full"));

		const result = await dispatchModelDiscoveryToolCall("model-discover", {
			models: [
				{ id: "gpt-5-mini", role: "free_primary", provider: "openai" },
				{
					id: "claude-sonnet-4-5",
					role: "strong_primary",
					provider: "anthropic",
				},
			],
		});

		expect(result.isError).toBe(true);
		expect(getFirstText(result)).toContain(
			"Failed to save orchestration config: disk full",
		);
	});
});
