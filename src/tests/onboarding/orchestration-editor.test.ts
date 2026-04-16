import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OrchestrationConfig } from "../../config/orchestration-config.js";

vi.mock("@inquirer/prompts", () => ({
	confirm: vi.fn(),
	input: vi.fn(),
	select: vi.fn(),
}));

import { confirm, input, select } from "@inquirer/prompts";
import { createDefaultOrchestrationConfig } from "../../config/orchestration-config.js";
import { OrchestrationConfigEditor } from "../../onboarding/orchestration-editor.js";

type EditorAccess = {
	editCapabilities(config: OrchestrationConfig): Promise<void>;
	editPatterns(config: OrchestrationConfig): Promise<void>;
	editProfiles(config: OrchestrationConfig): Promise<void>;
	editResilienceAndCache(config: OrchestrationConfig): Promise<void>;
	editRouting(config: OrchestrationConfig): Promise<void>;
};

function queueInputs(...values: string[]) {
	for (const value of values) {
		vi.mocked(input).mockResolvedValueOnce(value);
	}
}

function queueConfirms(...values: boolean[]) {
	for (const value of values) {
		vi.mocked(confirm).mockResolvedValueOnce(value);
	}
}

function queueSelects(...values: string[]) {
	for (const value of values) {
		vi.mocked(select).mockResolvedValueOnce(value);
	}
}

function firstSortedKey(record: Record<string, unknown>, label: string) {
	const key = Object.keys(record).sort()[0];
	if (!key) {
		throw new Error(
			`Expected at least one ${label} entry in the default config.`,
		);
	}
	return key;
}

function createMinimalConfig() {
	const base = createDefaultOrchestrationConfig();
	base.models.free_primary = {
		id: "gpt-5.1-mini",
		provider: "openai",
		available: true,
		context_window: 128_000,
	};
	const modelAlias = firstSortedKey(base.models, "model");
	const capabilityName = firstSortedKey(base.capabilities, "capability");
	const profileName = firstSortedKey(base.profiles, "profile");
	const routeName = firstSortedKey(base.routing.domains, "route");
	const patternName = firstSortedKey(
		base.orchestration.patterns,
		"orchestration pattern",
	);
	const model = base.models[modelAlias];
	const capabilityAliases = base.capabilities[capabilityName];
	const profile = base.profiles[profileName];
	const route = base.routing.domains[routeName];
	const pattern = base.orchestration.patterns[patternName];

	if (!model || !capabilityAliases || !profile || !route || !pattern) {
		throw new Error(
			"Expected default orchestration config entries to be present.",
		);
	}

	const config = structuredClone(base);
	config.models = { [modelAlias]: structuredClone(model) };
	config.capabilities = {
		[capabilityName]: [...capabilityAliases],
	};
	config.profiles = {
		[profileName]: structuredClone(profile),
	};
	config.routing.domains = {
		[routeName]: structuredClone(route),
	};
	config.orchestration.patterns = {
		[patternName]: structuredClone(pattern),
	};
	config.cache.profile_overrides = {};

	return {
		config,
		modelAlias,
		capabilityName,
		patternName,
		profileName,
		routeName,
	};
}

beforeEach(() => {
	vi.clearAllMocks();
	vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
	vi.restoreAllMocks();
});

describe("orchestration-editor", () => {
	it("returns an editable clone when quick mode exits immediately", async () => {
		const editor = new OrchestrationConfigEditor();
		const original = createDefaultOrchestrationConfig();
		vi.mocked(select).mockResolvedValue("save");

		const edited = await editor.edit(original, { mode: "quick" });

		expect(edited).toEqual(original);
		expect(edited).not.toBe(original);
	});

	it("edits quick-mode environment and models, including retry prompts and added aliases", async () => {
		const editor = new OrchestrationConfigEditor();
		const { config, modelAlias } = createMinimalConfig();

		queueSelects("environment", "models", "anthropic", "openai", "save");
		queueConfirms(true, false, false, true, true, false);
		queueInputs(
			"not-a-number",
			"8192",
			" ",
			"updated-model-id",
			" ",
			"maintenance",
			"bad",
			"12345",
			"",
			"2.5",
			" ",
			"beta",
			"beta-model",
			"4096",
			"1.2",
			"",
		);

		const edited = await editor.edit(config, { mode: "quick" });

		expect(edited.environment.strict_mode).toBe(true);
		expect(edited.environment.enable_cost_tracking).toBe(false);
		expect(edited.environment.default_max_context).toBe(8192);
		expect(edited.models[modelAlias]).toMatchObject({
			id: "updated-model-id",
			provider: "anthropic",
			available: false,
			reason: "maintenance",
			context_window: 12345,
			cost_per_1k_input: undefined,
			cost_per_1k_output: 2.5,
		});
		expect(edited.models.beta).toMatchObject({
			id: "beta-model",
			provider: "openai",
			available: true,
			context_window: 4096,
			cost_per_1k_input: 1.2,
			cost_per_1k_output: undefined,
		});
		expect(config.models[modelAlias]?.id).not.toBe("updated-model-id");
		expect(config.models.beta).toBeUndefined();
	});

	it("edits capabilities, profiles, and routing through the interactive helpers", async () => {
		const editor = new OrchestrationConfigEditor() as unknown as EditorAccess;
		const { config, capabilityName, profileName, routeName } =
			createMinimalConfig();

		queueInputs(
			"alias-a, alias-b",
			" ",
			"zz_custom_capability",
			"gamma, delta",
			"zz_custom_capability",
			"alias-a",
			"oops",
			"3",
			"",
			" ",
			"zz_new_profile",
			"",
			"",
			"1",
			"2",
			" ",
			"custom-*",
			"4",
		);
		queueSelects(
			"zz_custom_capability",
			"__none__",
			"zz_new_profile",
			profileName,
		);
		queueConfirms(
			true,
			false,
			true,
			true,
			true,
			false,
			false,
			false,
			true,
			false,
			true,
			false,
			true,
			false,
		);

		await editor.editCapabilities(config);
		await editor.editProfiles(config);
		await editor.editRouting(config);

		expect(config.capabilities[capabilityName]).toEqual(["alias-a", "alias-b"]);
		expect(config.capabilities.zz_custom_capability).toEqual([
			"gamma",
			"delta",
		]);
		expect(config.profiles[profileName]).toMatchObject({
			requires: ["zz_custom_capability"],
			prefer: "zz_custom_capability",
			fallback: ["alias-a"],
			fan_out: 3,
			max_retries: undefined,
			require_human_in_loop: true,
			enforce_schema: true,
		});
		expect(config.profiles.zz_new_profile).toMatchObject({
			requires: [],
			prefer: undefined,
			fallback: [],
			fan_out: 1,
			max_retries: 2,
			require_human_in_loop: false,
			enforce_schema: false,
		});
		expect(config.routing.domains[routeName]).toMatchObject({
			profile: "zz_new_profile",
			max_retries: undefined,
			require_human_in_loop: true,
			enforce_schema: false,
		});
		expect(config.routing.domains["custom-*"]).toMatchObject({
			profile: profileName,
			max_retries: 4,
			require_human_in_loop: false,
			enforce_schema: true,
		});
	});

	it("edits patterns and resilience/cache settings with optional selections", async () => {
		const editor = new OrchestrationConfigEditor() as unknown as EditorAccess;
		const { config, patternName, profileName } = createMinimalConfig();
		config.profiles.zz_new_profile = {
			requires: [],
			fallback: [],
			fan_out: 1,
		};

		queueInputs(
			" ",
			"Updated description",
			"",
			"2",
			`${profileName}, zz_new_profile`,
			"bad",
			"250",
			"6",
			"4",
			"120",
			"",
			"90",
		);
		queueSelects(
			profileName,
			"__none__",
			"zz_new_profile",
			"__none__",
			"__none__",
			profileName,
			"zz_new_profile",
			"__none__",
		);

		await editor.editPatterns(config);
		await editor.editResilienceAndCache(config);

		expect(config.orchestration.patterns[patternName]).toMatchObject({
			description: "Updated description",
			draft_profile: profileName,
			synthesis_profile: undefined,
			plan_profile: "zz_new_profile",
			review_profile: undefined,
			fan_out: undefined,
			vote_count: 2,
			cascade_chain: [profileName, "zz_new_profile"],
		});
		expect(config.resilience).toMatchObject({
			rate_limit_backoff_ms: 250,
			auto_escalate_on_consecutive_failures: 6,
			max_escalation_depth: 4,
		});
		expect(config.cache).toMatchObject({
			default_ttl_seconds: 120,
			profile_overrides: {
				zz_new_profile: 90,
			},
		});
	});
});
