/**
 * Integration: Mode-Aware Tool Filtering (P3-004)
 */

import { describe, expect, it } from "vitest";
import { getFeatureFlags } from "../../../src/config/feature-flags.js";

describe("Mode-Aware Tool Filtering", () => {
	describe("feature flag configuration", () => {
		it("should have enableModeAwareToolFiltering flag", () => {
			const flags = getFeatureFlags();

			expect(flags).toHaveProperty("enableModeAwareToolFiltering");
			expect(typeof flags.enableModeAwareToolFiltering).toBe("boolean");
		});

		it("should default to false when env var not set", () => {
			delete process.env.MCP_ENABLE_MODE_FILTERING;

			const flags = getFeatureFlags();

			expect(flags.enableModeAwareToolFiltering).toBe(false);
		});

		it("should enable when env var is 'true'", () => {
			process.env.MCP_ENABLE_MODE_FILTERING = "true";

			const flags = getFeatureFlags();

			expect(flags.enableModeAwareToolFiltering).toBe(true);

			delete process.env.MCP_ENABLE_MODE_FILTERING;
		});
	});
});
