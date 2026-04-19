import { describe, expect, it } from "vitest";
import {
	BUILTIN_ORCHESTRATION_DEFAULTS_SOURCE,
	createBuiltinBootstrapOrchestrationConfig,
	createBuiltinOrchestrationDefaults,
} from "../../config/orchestration-defaults.js";

describe("orchestration defaults", () => {
	it("declares the extracted builtin fallback source file", () => {
		expect(BUILTIN_ORCHESTRATION_DEFAULTS_SOURCE).toBe(
			"src/config/orchestration-defaults.ts",
		);
	});

	it("returns isolated fallback config copies", () => {
		const first = createBuiltinOrchestrationDefaults();
		const second = createBuiltinOrchestrationDefaults();

		first.environment.default_max_context = 99999;
		expect(second.environment.default_max_context).toBe(128_000);
	});

	it("includes the supported cheap secondary lane in builtin defaults", () => {
		const config = createBuiltinOrchestrationDefaults();

		expect(config.capabilities.fast_draft).toContain("cheap_secondary");
		expect(config.capabilities.cost_sensitive).toContain("cheap_secondary");
	});

	it("keeps capability aliases aligned with declared builtin model aliases", () => {
		const config = createBuiltinOrchestrationDefaults();
		const ROLE_NAMES = new Set([
			"free_primary",
			"free_secondary",
			"cheap_primary",
			"cheap_secondary",
			"strong_primary",
			"strong_secondary",
			"reviewer_primary",
		]);

		for (const [capability, aliases] of Object.entries(config.capabilities)) {
			expect(aliases.length).toBeGreaterThan(0);
			for (const alias of aliases) {
				expect(
					ROLE_NAMES.has(alias),
					`${capability} references unknown role alias ${alias}`,
				).toBe(true);
			}
		}
	});

	it("exposes advisory bootstrap defaults with semantic role models", () => {
		const config = createBuiltinBootstrapOrchestrationConfig();

		expect(config.environment.strict_mode).toBe(false);
		expect(config.models.free_primary).toMatchObject({
			id: "free_primary",
			provider: "other",
			available: true,
		});
		expect(config.models.strong_primary).toMatchObject({
			id: "strong_primary",
			provider: "other",
			available: true,
		});
	});
});
