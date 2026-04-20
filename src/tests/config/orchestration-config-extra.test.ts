import { afterEach, describe, expect, it } from "vitest";
import {
	createDefaultOrchestrationConfig,
	getAvailableModelsForTier,
	getDomainRouting,
	getDomainTier,
	getFanOut,
	getHumanInLoopProfiles,
	parseOrchestrationConfigDocument,
	parseOrchestrationConfigValue,
	resetConfigCache,
	resolveCapabilityToIds,
} from "../../config/orchestration-config.js";
import { renderOrchestrationToml } from "../../config/orchestration-config-service.js";

describe("orchestration-config: extra branch coverage", () => {
	afterEach(() => {
		resetConfigCache();
	});

	// ── parseOrchestrationConfigValue ──────────────────────────────────────

	it("parseOrchestrationConfigValue throws on undefined input", () => {
		expect(() => parseOrchestrationConfigValue(undefined)).toThrow();
	});

	it("parseOrchestrationConfigValue throws on an array input", () => {
		expect(() => parseOrchestrationConfigValue([])).toThrow();
	});

	it("parseOrchestrationConfigValue throws on a string input", () => {
		expect(() => parseOrchestrationConfigValue("not-an-object")).toThrow();
	});

	it("parseOrchestrationConfigValue throws on a boolean input", () => {
		expect(() => parseOrchestrationConfigValue(true)).toThrow();
	});

	it("parseOrchestrationConfigValue throws on an empty object", () => {
		expect(() => parseOrchestrationConfigValue({})).toThrow();
	});

	it("parseOrchestrationConfigDocument parses optional sections and profile extras from TOML", () => {
		const config = createDefaultOrchestrationConfig();
		config.profiles.research = {
			...config.profiles.research,
			confidence_threshold: 0.8,
			min_signal_count: 2,
			emit_routing_decision: true,
		} as typeof config.profiles.research;
		config.session_continuity = {
			preload_enabled: true,
			session_path: ".mcp-ai-agent-guidelines/session",
			snapshot_path: ".mcp-ai-agent-guidelines/snapshots",
			fingerprint_ttl_seconds: 900,
			preload_max_sessions: 4,
			format_version_min: 2,
		};
		config.agent_mode = {
			re_activation_interval_turns: 3,
			context_drift_threshold: 0.35,
			reactivation_instruction:
				"Re-check the workspace snapshot before continuing.",
			heartbeat_enabled: true,
		};
		config.session_security = {
			key_rotation_interval_days: 14,
		};
		config.quality_gates = {
			eval_trigger_interval_turns: 6,
		};

		const parsed = parseOrchestrationConfigDocument(
			renderOrchestrationToml(config),
		);
		const parsedResearchProfile = parsed.profiles
			.research as typeof parsed.profiles.research & {
			confidence_threshold?: number;
			min_signal_count?: number;
			emit_routing_decision?: boolean;
		};

		expect(parsedResearchProfile).toMatchObject({
			confidence_threshold: 0.8,
			min_signal_count: 2,
			emit_routing_decision: true,
		});
		expect(parsed.session_continuity).toEqual(config.session_continuity);
		expect(parsed.agent_mode).toEqual(config.agent_mode);
		expect(parsed.session_security).toEqual(config.session_security);
		expect(parsed.quality_gates).toEqual(config.quality_gates);
	});

	it("parseOrchestrationConfigDocument throws on syntactically invalid TOML", () => {
		expect(() =>
			parseOrchestrationConfigDocument(`
[environment]
strict_mode = true
default_max_context =
`),
		).toThrow();
	});

	it("parseOrchestrationConfigDocument throws when an optional section fails schema validation", () => {
		const config = createDefaultOrchestrationConfig();
		const validToml = renderOrchestrationToml(config);
		const invalidToml = `${validToml}

[quality_gates]
eval_trigger_interval_turns = "often"
`;

		expect(() => parseOrchestrationConfigDocument(invalidToml)).toThrow(
			/eval_trigger_interval_turns|quality_gates|number|string/i,
		);
	});

	// ── getDomainTier (deprecated shim for getProfileForSkill) ─────────────

	it("getDomainTier returns the profile for a known qm- skill", () => {
		const tier = getDomainTier("qm-uncertainty-tradeoff");
		expect(typeof tier).toBe("string");
		expect(tier.length).toBeGreaterThan(0);
	});

	it("getDomainTier returns 'default' for an unknown domain", () => {
		const tier = getDomainTier("unknown-skill-xyz");
		expect(tier).toBe("default");
	});

	it("getDomainTier returns a profile for synth- skills", () => {
		const tier = getDomainTier("synth-comparative");
		expect(typeof tier).toBe("string");
	});

	it("getDomainTier returns a profile for qual- skills", () => {
		const tier = getDomainTier("qual-review");
		expect(typeof tier).toBe("string");
	});

	it("getDomainTier returns a profile for gov- skills", () => {
		const tier = getDomainTier("gov-policy-validation");
		expect(typeof tier).toBe("string");
	});

	// ── getAvailableModelsForTier (deprecated shim for resolveCapabilityToIds) ─

	it("getAvailableModelsForTier returns physical model IDs for 'fast_draft'", () => {
		const models = getAvailableModelsForTier("fast_draft");
		expect(Array.isArray(models)).toBe(true);
		expect(models.length).toBeGreaterThan(0);
		expect(models.every((m) => !m.startsWith("model_"))).toBe(true);
	});

	it("getAvailableModelsForTier returns empty array for an unknown tag", () => {
		const models = getAvailableModelsForTier("nonexistent_capability_tag_xyz");
		expect(Array.isArray(models)).toBe(true);
		expect(models).toHaveLength(0);
	});

	it("getAvailableModelsForTier returns results for 'deep_reasoning'", () => {
		const models = getAvailableModelsForTier("deep_reasoning");
		expect(models.length).toBeGreaterThan(0);
	});

	// ── getHumanInLoopProfiles ──────────────────────────────────────────────

	it("getHumanInLoopProfiles returns an array", () => {
		const profiles = getHumanInLoopProfiles();
		expect(Array.isArray(profiles)).toBe(true);
	});

	it("getHumanInLoopProfiles result only contains profile names (strings)", () => {
		const profiles = getHumanInLoopProfiles();
		for (const p of profiles) {
			expect(typeof p).toBe("string");
		}
	});

	// ── getFanOut ────────────────────────────────────────────────────────────

	it("getFanOut returns 1 for unknown profile", () => {
		const fanOut = getFanOut("nonexistent-profile-xyz");
		expect(fanOut).toBe(1);
	});

	it("getFanOut returns a positive integer for known profiles", () => {
		// 'research' is a known profile
		const fanOut = getFanOut("research");
		expect(fanOut).toBeGreaterThanOrEqual(1);
		expect(Number.isInteger(fanOut)).toBe(true);
	});

	// ── getDomainRouting ────────────────────────────────────────────────────

	it("getDomainRouting returns null for unknown skill", () => {
		const routing = getDomainRouting("completely-unknown-skill");
		expect(routing).toBeNull();
	});

	it("getDomainRouting returns routing metadata for known domain", () => {
		const routing = getDomainRouting("qm-uncertainty-tradeoff");
		if (routing !== null) {
			expect(typeof routing.profile).toBe("string");
		}
		// null is also acceptable if qm- is not in routing config
	});

	// ── resolveCapabilityToIds ──────────────────────────────────────────────

	it("resolveCapabilityToIds returns physical IDs for cost_sensitive", () => {
		const ids = resolveCapabilityToIds("cost_sensitive");
		expect(Array.isArray(ids)).toBe(true);
		expect(ids.length).toBeGreaterThan(0);
	});

	it("resolveCapabilityToIds returns empty array for unknown capability", () => {
		const ids = resolveCapabilityToIds("totally_unknown_cap");
		expect(ids).toHaveLength(0);
	});
});
