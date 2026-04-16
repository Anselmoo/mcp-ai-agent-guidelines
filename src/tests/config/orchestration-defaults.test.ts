import { describe, expect, it } from "vitest";
import {
	BUILTIN_ORCHESTRATION_DEFAULTS_SOURCE,
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
});
