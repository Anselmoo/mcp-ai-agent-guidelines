/**
 * Integration tests for Design Assistant with Gateway Feature Flag
 *
 * Tests the conditional gateway usage based on feature flags.
 *
 * @module tests/design-assistant-gateway-integration
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { designAssistant } from "../../src/tools/design/design-assistant.js";

describe("Design Assistant - Gateway Integration", () => {
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

	describe("Feature flag disabled (legacy behavior)", () => {
		it("should use legacy formatting when flag is off", async () => {
			const sessionId = `test-session-${Date.now()}`;

			const result = await designAssistant.processRequest({
				action: "start-session",
				sessionId,
				config: {
					sessionId,
					context: "Test context",
					goal: "Test goal",
					requirements: ["Requirement 1"],
					constraints: [],
					coverageThreshold: 85,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
			});

			// Legacy behavior - should return standard response
			expect(result).toHaveProperty("success");
			expect(result).toHaveProperty("sessionId", sessionId);
			expect(result).toHaveProperty("status");

			// Should NOT have gateway-specific metadata
			if ("data" in result && result.data) {
				expect(result.data).not.toHaveProperty("gatewayEnabled");
			}
		});

		it("should ignore outputFormat when flag is off", async () => {
			const sessionId = `test-session-${Date.now()}`;

			const result = await designAssistant.processRequest({
				action: "start-session",
				sessionId,
				config: {
					sessionId,
					context: "Test context",
					goal: "Test goal",
					requirements: ["Requirement 1"],
					constraints: [],
					coverageThreshold: 85,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
				outputFormat: "adr", // Should be ignored when flag is off
			});

			expect(result).toHaveProperty("success");
			// Should NOT use gateway even though outputFormat is specified
			if ("data" in result && result.data) {
				expect(result.data).not.toHaveProperty("gatewayEnabled");
			}
		});
	});

	describe("Feature flag enabled (gateway behavior)", () => {
		it("should attempt gateway when flag is on and outputFormat is specified (fallback on unsupported domain)", async () => {
			// Enable gateway flag
			process.env.MCP_USE_POLYGLOT_GATEWAY = "true";

			const sessionId = `test-session-${Date.now()}`;

			const result = await designAssistant.processRequest({
				action: "start-session",
				sessionId,
				config: {
					sessionId,
					context: "Test context",
					goal: "Test goal",
					requirements: ["Requirement 1"],
					constraints: [],
					coverageThreshold: 85,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
				outputFormat: "chat",
			});

			// Gateway will attempt to render but fall back gracefully
			// since DesignAssistantResponse rendering is not fully implemented yet
			expect(result).toHaveProperty("success");
			expect(result).toHaveProperty("sessionId", sessionId);

			// Verify fallback occurred - should NOT have gateway-specific metadata
			if ("data" in result && result.data) {
				expect(result.data).not.toHaveProperty("gatewayEnabled");
			}

			// Verify status is from legacy path, not gateway
			if ("status" in result) {
				expect(result.status).not.toBe("gateway-rendered");
			}
		});

		it("should fallback to legacy when outputFormat is not specified", async () => {
			// Enable gateway flag
			process.env.MCP_USE_POLYGLOT_GATEWAY = "true";

			const sessionId = `test-session-${Date.now()}`;

			const result = await designAssistant.processRequest({
				action: "start-session",
				sessionId,
				config: {
					sessionId,
					context: "Test context",
					goal: "Test goal",
					requirements: ["Requirement 1"],
					constraints: [],
					coverageThreshold: 85,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
				// No outputFormat specified - should use legacy
			});

			expect(result).toHaveProperty("success");

			// Should NOT use gateway when outputFormat is not specified
			if ("data" in result && result.data) {
				expect(result.data).not.toHaveProperty("gatewayEnabled");
			}
		});

		it("should gracefully handle different output formats", async () => {
			// Enable gateway flag
			process.env.MCP_USE_POLYGLOT_GATEWAY = "true";

			const sessionId = `test-session-${Date.now()}`;
			const formats = ["chat", "adr", "rfc", "sdd"] as const;

			for (const format of formats) {
				const result = await designAssistant.processRequest({
					action: "start-session",
					sessionId: `${sessionId}-${format}`,
					config: {
						sessionId: `${sessionId}-${format}`,
						context: "Test context",
						goal: "Test goal",
						requirements: ["Requirement 1"],
						constraints: [],
						coverageThreshold: 85,
						enablePivots: true,
						templateRefs: [],
						outputFormats: ["markdown"],
						metadata: {},
					},
					outputFormat: format,
				});

				// Should not crash with different formats
				expect(result).toHaveProperty("success");
			}
		});

		it("should accept cross-cutting parameters when specified", async () => {
			// Enable gateway and cross-cutting flags
			process.env.MCP_USE_POLYGLOT_GATEWAY = "true";
			process.env.MCP_ENABLE_CROSS_CUTTING = "true";

			const sessionId = `test-session-${Date.now()}`;

			const result = await designAssistant.processRequest({
				action: "start-session",
				sessionId,
				config: {
					sessionId,
					context: "Test context",
					goal: "Test goal",
					requirements: ["Requirement 1"],
					constraints: [],
					coverageThreshold: 85,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
				outputFormat: "chat",
				crossCutting: ["workflow", "diagram"],
			});

			// Should not crash with cross-cutting capabilities
			expect(result).toHaveProperty("success");
		});
	});

	describe("Error handling and fallback", () => {
		it("should handle gateway errors gracefully", async () => {
			// Enable gateway flag
			process.env.MCP_USE_POLYGLOT_GATEWAY = "true";

			const sessionId = `test-session-${Date.now()}`;

			// Even with invalid data, should not crash
			const result = await designAssistant.processRequest({
				action: "start-session",
				sessionId,
				config: {
					sessionId,
					context: "Test context",
					goal: "Test goal",
					requirements: ["Requirement 1"],
					constraints: [],
					coverageThreshold: 85,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
				outputFormat: "chat",
			});

			// Should still return a valid response
			expect(result).toHaveProperty("success");
			expect(result).toHaveProperty("sessionId");
		});
	});

	describe("Parameter validation", () => {
		it("should accept outputFormat parameter", async () => {
			const sessionId = `test-session-${Date.now()}`;

			// Should not throw with outputFormat parameter
			const result = await designAssistant.processRequest({
				action: "start-session",
				sessionId,
				config: {
					sessionId,
					context: "Test context",
					goal: "Test goal",
					requirements: ["Requirement 1"],
					constraints: [],
					coverageThreshold: 85,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
				outputFormat: "chat",
			});

			expect(result).toHaveProperty("success");
		});

		it("should accept crossCutting parameter", async () => {
			const sessionId = `test-session-${Date.now()}`;

			// Should not throw with crossCutting parameter
			const result = await designAssistant.processRequest({
				action: "start-session",
				sessionId,
				config: {
					sessionId,
					context: "Test context",
					goal: "Test goal",
					requirements: ["Requirement 1"],
					constraints: [],
					coverageThreshold: 85,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
				crossCutting: ["workflow", "diagram"],
			});

			expect(result).toHaveProperty("success");
		});

		it("should accept both outputFormat and crossCutting parameters", async () => {
			const sessionId = `test-session-${Date.now()}`;

			// Should not throw with both parameters
			const result = await designAssistant.processRequest({
				action: "start-session",
				sessionId,
				config: {
					sessionId,
					context: "Test context",
					goal: "Test goal",
					requirements: ["Requirement 1"],
					constraints: [],
					coverageThreshold: 85,
					enablePivots: true,
					templateRefs: [],
					outputFormats: ["markdown"],
					metadata: {},
				},
				outputFormat: "adr",
				crossCutting: ["workflow", "config"],
			});

			expect(result).toHaveProperty("success");
		});
	});
});
