/**
 * Integration: Mode-Aware Tool Filtering (P3-004)
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getFeatureFlags } from "../../../src/config/feature-flags.js";

describe("Mode-Aware Tool Filtering", () => {
	// Store original env vars
	const originalEnv = { ...process.env };

	beforeEach(() => {
		// Reset environment before each test
		delete process.env.MCP_ENABLE_MODE_FILTERING;
	});

	afterEach(() => {
		// Restore original environment
		process.env = { ...originalEnv };
	});

	describe("feature flag configuration", () => {
		it("should have enableModeAwareToolFiltering flag", () => {
			const flags = getFeatureFlags();

			expect(flags).toHaveProperty("enableModeAwareToolFiltering");
			expect(typeof flags.enableModeAwareToolFiltering).toBe("boolean");
		});

		it("should default to false when env var not set", () => {
			const flags = getFeatureFlags();

			expect(flags.enableModeAwareToolFiltering).toBe(false);
		});

		it("should enable when env var is 'true'", () => {
			process.env.MCP_ENABLE_MODE_FILTERING = "true";

			const flags = getFeatureFlags();

			expect(flags.enableModeAwareToolFiltering).toBe(true);
		});
	});
});
