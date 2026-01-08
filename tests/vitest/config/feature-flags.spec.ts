/**
 * Tests for Feature Flags Configuration
 *
 * @module tests/config/feature-flags
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
	type FeatureFlags,
	getFeatureFlagSummary,
	getFeatureFlags,
	hasAnyFlagsEnabled,
} from "../../../src/config/feature-flags.js";

describe("Feature Flags", () => {
	// Store original env vars
	const originalEnv = { ...process.env };

	beforeEach(() => {
		// Reset environment before each test
		delete process.env.MCP_USE_POLYGLOT_GATEWAY;
		delete process.env.MCP_ENABLE_SPECKIT;
		delete process.env.MCP_ENABLE_ENTERPRISE;
		delete process.env.MCP_ENABLE_CROSS_CUTTING;
	});

	afterEach(() => {
		// Restore original environment
		process.env = { ...originalEnv };
	});

	describe("getFeatureFlags()", () => {
		it("should return all flags disabled by default", () => {
			const flags = getFeatureFlags();

			expect(flags.usePolyglotGateway).toBe(false);
			expect(flags.enableSpecKitOutput).toBe(false);
			expect(flags.enableEnterpriseOutput).toBe(false);
			expect(flags.enableCrossCuttingCapabilities).toBe(false);
		});

		it("should enable usePolyglotGateway when env var is true", () => {
			process.env.MCP_USE_POLYGLOT_GATEWAY = "true";

			const flags = getFeatureFlags();

			expect(flags.usePolyglotGateway).toBe(true);
			expect(flags.enableSpecKitOutput).toBe(false);
			expect(flags.enableEnterpriseOutput).toBe(false);
			expect(flags.enableCrossCuttingCapabilities).toBe(false);
		});

		it("should enable enableSpecKitOutput when env var is true", () => {
			process.env.MCP_ENABLE_SPECKIT = "true";

			const flags = getFeatureFlags();

			expect(flags.usePolyglotGateway).toBe(false);
			expect(flags.enableSpecKitOutput).toBe(true);
			expect(flags.enableEnterpriseOutput).toBe(false);
			expect(flags.enableCrossCuttingCapabilities).toBe(false);
		});

		it("should enable enableEnterpriseOutput when env var is true", () => {
			process.env.MCP_ENABLE_ENTERPRISE = "true";

			const flags = getFeatureFlags();

			expect(flags.usePolyglotGateway).toBe(false);
			expect(flags.enableSpecKitOutput).toBe(false);
			expect(flags.enableEnterpriseOutput).toBe(true);
			expect(flags.enableCrossCuttingCapabilities).toBe(false);
		});

		it("should enable enableCrossCuttingCapabilities when env var is true", () => {
			process.env.MCP_ENABLE_CROSS_CUTTING = "true";

			const flags = getFeatureFlags();

			expect(flags.usePolyglotGateway).toBe(false);
			expect(flags.enableSpecKitOutput).toBe(false);
			expect(flags.enableEnterpriseOutput).toBe(false);
			expect(flags.enableCrossCuttingCapabilities).toBe(true);
		});

		it("should enable multiple flags when multiple env vars are true", () => {
			process.env.MCP_USE_POLYGLOT_GATEWAY = "true";
			process.env.MCP_ENABLE_SPECKIT = "true";
			process.env.MCP_ENABLE_CROSS_CUTTING = "true";

			const flags = getFeatureFlags();

			expect(flags.usePolyglotGateway).toBe(true);
			expect(flags.enableSpecKitOutput).toBe(true);
			expect(flags.enableEnterpriseOutput).toBe(false);
			expect(flags.enableCrossCuttingCapabilities).toBe(true);
		});

		it("should not enable flags when env vars are not 'true'", () => {
			process.env.MCP_USE_POLYGLOT_GATEWAY = "false";
			process.env.MCP_ENABLE_SPECKIT = "1";
			process.env.MCP_ENABLE_ENTERPRISE = "yes";
			process.env.MCP_ENABLE_CROSS_CUTTING = "True";

			const flags = getFeatureFlags();

			// Only exact string "true" should enable flags
			expect(flags.usePolyglotGateway).toBe(false);
			expect(flags.enableSpecKitOutput).toBe(false);
			expect(flags.enableEnterpriseOutput).toBe(false);
			expect(flags.enableCrossCuttingCapabilities).toBe(false);
		});

		it("should enable all flags when all env vars are true", () => {
			process.env.MCP_USE_POLYGLOT_GATEWAY = "true";
			process.env.MCP_ENABLE_SPECKIT = "true";
			process.env.MCP_ENABLE_ENTERPRISE = "true";
			process.env.MCP_ENABLE_CROSS_CUTTING = "true";

			const flags = getFeatureFlags();

			expect(flags.usePolyglotGateway).toBe(true);
			expect(flags.enableSpecKitOutput).toBe(true);
			expect(flags.enableEnterpriseOutput).toBe(true);
			expect(flags.enableCrossCuttingCapabilities).toBe(true);
		});
	});

	describe("hasAnyFlagsEnabled()", () => {
		it("should return false when all flags are disabled", () => {
			expect(hasAnyFlagsEnabled()).toBe(false);
		});

		it("should return true when usePolyglotGateway is enabled", () => {
			process.env.MCP_USE_POLYGLOT_GATEWAY = "true";
			expect(hasAnyFlagsEnabled()).toBe(true);
		});

		it("should return true when enableSpecKitOutput is enabled", () => {
			process.env.MCP_ENABLE_SPECKIT = "true";
			expect(hasAnyFlagsEnabled()).toBe(true);
		});

		it("should return true when enableEnterpriseOutput is enabled", () => {
			process.env.MCP_ENABLE_ENTERPRISE = "true";
			expect(hasAnyFlagsEnabled()).toBe(true);
		});

		it("should return true when enableCrossCuttingCapabilities is enabled", () => {
			process.env.MCP_ENABLE_CROSS_CUTTING = "true";
			expect(hasAnyFlagsEnabled()).toBe(true);
		});

		it("should return true when any combination of flags is enabled", () => {
			process.env.MCP_USE_POLYGLOT_GATEWAY = "true";
			process.env.MCP_ENABLE_ENTERPRISE = "true";
			expect(hasAnyFlagsEnabled()).toBe(true);
		});
	});

	describe("getFeatureFlagSummary()", () => {
		it("should return summary with all flags false by default", () => {
			const summary = getFeatureFlagSummary();

			expect(summary).toEqual({
				usePolyglotGateway: false,
				enableSpecKitOutput: false,
				enableEnterpriseOutput: false,
				enableCrossCuttingCapabilities: false,
			});
		});

		it("should return summary with enabled flags", () => {
			process.env.MCP_USE_POLYGLOT_GATEWAY = "true";
			process.env.MCP_ENABLE_SPECKIT = "true";

			const summary = getFeatureFlagSummary();

			expect(summary).toEqual({
				usePolyglotGateway: true,
				enableSpecKitOutput: true,
				enableEnterpriseOutput: false,
				enableCrossCuttingCapabilities: false,
			});
		});

		it("should return summary with all flags enabled", () => {
			process.env.MCP_USE_POLYGLOT_GATEWAY = "true";
			process.env.MCP_ENABLE_SPECKIT = "true";
			process.env.MCP_ENABLE_ENTERPRISE = "true";
			process.env.MCP_ENABLE_CROSS_CUTTING = "true";

			const summary = getFeatureFlagSummary();

			expect(summary).toEqual({
				usePolyglotGateway: true,
				enableSpecKitOutput: true,
				enableEnterpriseOutput: true,
				enableCrossCuttingCapabilities: true,
			});
		});

		it("should have correct property names in summary", () => {
			const summary = getFeatureFlagSummary();

			expect(Object.keys(summary)).toEqual([
				"usePolyglotGateway",
				"enableSpecKitOutput",
				"enableEnterpriseOutput",
				"enableCrossCuttingCapabilities",
			]);
		});
	});

	describe("type safety", () => {
		it("should have correct TypeScript types", () => {
			const flags: FeatureFlags = getFeatureFlags();

			// Type assertions to verify structure
			const _usePolyglot: boolean = flags.usePolyglotGateway;
			const _specKit: boolean = flags.enableSpecKitOutput;
			const _enterprise: boolean = flags.enableEnterpriseOutput;
			const _crossCutting: boolean = flags.enableCrossCuttingCapabilities;

			// Suppress unused variable warnings
			expect(_usePolyglot).toBeDefined();
			expect(_specKit).toBeDefined();
			expect(_enterprise).toBeDefined();
			expect(_crossCutting).toBeDefined();
		});
	});
});
