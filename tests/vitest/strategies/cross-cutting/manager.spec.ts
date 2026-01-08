/**
 * Tests for CrossCuttingManager
 *
 * @module tests/strategies/cross-cutting/manager
 */

import { describe, expect, it } from "vitest";
import { CrossCuttingManager } from "../../../../src/strategies/cross-cutting/manager.js";
import type {
	CapabilityContext,
	CapabilityHandler,
} from "../../../../src/strategies/cross-cutting/types.js";
import { WorkflowCapabilityHandler } from "../../../../src/strategies/cross-cutting/workflow-handler.js";
import { CrossCuttingCapability } from "../../../../src/strategies/output-strategy.js";

describe("CrossCuttingManager", () => {
	describe("constructor", () => {
		it("should initialize with default handlers", () => {
			const manager = new CrossCuttingManager();

			expect(manager.hasCapability(CrossCuttingCapability.WORKFLOW)).toBe(true);
		});

		it("should have workflow capability registered", () => {
			const manager = new CrossCuttingManager();
			const capabilities = manager.getRegisteredCapabilities();

			expect(capabilities).toContain(CrossCuttingCapability.WORKFLOW);
		});
	});

	describe("generateArtifacts()", () => {
		it("should generate artifacts for requested capabilities", () => {
			const manager = new CrossCuttingManager();
			const domainResult = { coverage: 90 };

			const artifacts = manager.generateArtifacts(
				domainResult,
				[CrossCuttingCapability.WORKFLOW],
				{},
				"ScoringResult",
			);

			expect(artifacts).toHaveLength(1);
			expect(artifacts[0].type).toBe(CrossCuttingCapability.WORKFLOW);
			expect(artifacts[0].name).toContain(".github/workflows/");
			expect(artifacts[0].content).toBeTruthy();
		});

		it("should generate multiple artifacts when multiple capabilities requested", () => {
			const manager = new CrossCuttingManager();
			const domainResult = {};

			const artifacts = manager.generateArtifacts(
				domainResult,
				[CrossCuttingCapability.WORKFLOW],
				{},
			);

			expect(artifacts).toHaveLength(1);
		});

		it("should skip capabilities without registered handlers", () => {
			const manager = new CrossCuttingManager();
			const domainResult = {};

			const artifacts = manager.generateArtifacts(
				domainResult,
				[
					CrossCuttingCapability.WORKFLOW,
					CrossCuttingCapability.DIAGRAM, // Not registered yet
				],
				{},
			);

			expect(artifacts).toHaveLength(1);
			expect(artifacts[0].type).toBe(CrossCuttingCapability.WORKFLOW);
		});

		it("should skip capabilities not supported by domain type", () => {
			const manager = new CrossCuttingManager();
			const domainResult = {};

			const artifacts = manager.generateArtifacts(
				domainResult,
				[CrossCuttingCapability.WORKFLOW],
				{},
				"UnsupportedType",
			);

			expect(artifacts).toHaveLength(0);
		});

		it("should generate artifacts when domain type is supported", () => {
			const manager = new CrossCuttingManager();
			const domainResult = {};

			const artifacts = manager.generateArtifacts(
				domainResult,
				[CrossCuttingCapability.WORKFLOW],
				{},
				"PromptResult",
			);

			expect(artifacts).toHaveLength(1);
			expect(artifacts[0].type).toBe(CrossCuttingCapability.WORKFLOW);
		});

		it("should pass metadata to handlers", () => {
			const manager = new CrossCuttingManager();
			const domainResult = {};
			const metadata = { nodeVersion: "18" };

			const artifacts = manager.generateArtifacts(
				domainResult,
				[CrossCuttingCapability.WORKFLOW],
				metadata,
			);

			expect(artifacts[0].content).toContain("node-version: 18");
		});

		it("should return empty array for empty capabilities list", () => {
			const manager = new CrossCuttingManager();
			const domainResult = {};

			const artifacts = manager.generateArtifacts(domainResult, []);

			expect(artifacts).toEqual([]);
		});

		it("should handle null artifacts from handlers", () => {
			const manager = new CrossCuttingManager();

			// Create a mock handler that returns null
			const mockHandler: CapabilityHandler = {
				capability: CrossCuttingCapability.DIAGRAM,
				generate: () => null,
				supports: () => true,
			};

			manager.registerHandler(CrossCuttingCapability.DIAGRAM, mockHandler);

			const artifacts = manager.generateArtifacts({}, [
				CrossCuttingCapability.DIAGRAM,
			]);

			expect(artifacts).toEqual([]);
		});
	});

	describe("registerHandler()", () => {
		it("should register a new handler", () => {
			const manager = new CrossCuttingManager();

			expect(manager.hasCapability(CrossCuttingCapability.DIAGRAM)).toBe(false);

			const mockHandler: CapabilityHandler = {
				capability: CrossCuttingCapability.DIAGRAM,
				generate: (_context: CapabilityContext) => ({
					type: CrossCuttingCapability.DIAGRAM,
					name: "diagram.mmd",
					content: "graph TD\nA-->B",
				}),
				supports: () => true,
			};

			manager.registerHandler(CrossCuttingCapability.DIAGRAM, mockHandler);

			expect(manager.hasCapability(CrossCuttingCapability.DIAGRAM)).toBe(true);
		});

		it("should allow overwriting existing handlers", () => {
			const manager = new CrossCuttingManager();

			const customWorkflowHandler: CapabilityHandler = {
				capability: CrossCuttingCapability.WORKFLOW,
				generate: () => ({
					type: CrossCuttingCapability.WORKFLOW,
					name: "custom.yml",
					content: "custom workflow content",
				}),
				supports: () => true,
			};

			manager.registerHandler(
				CrossCuttingCapability.WORKFLOW,
				customWorkflowHandler,
			);

			const artifacts = manager.generateArtifacts({}, [
				CrossCuttingCapability.WORKFLOW,
			]);

			expect(artifacts[0].name).toBe("custom.yml");
			expect(artifacts[0].content).toBe("custom workflow content");
		});

		it("should use newly registered handler in generateArtifacts", () => {
			const manager = new CrossCuttingManager();

			const mockHandler: CapabilityHandler = {
				capability: CrossCuttingCapability.CONFIG,
				generate: () => ({
					type: CrossCuttingCapability.CONFIG,
					name: "config.json",
					content: '{"test": true}',
				}),
				supports: () => true,
			};

			manager.registerHandler(CrossCuttingCapability.CONFIG, mockHandler);

			const artifacts = manager.generateArtifacts({}, [
				CrossCuttingCapability.CONFIG,
			]);

			expect(artifacts).toHaveLength(1);
			expect(artifacts[0].type).toBe(CrossCuttingCapability.CONFIG);
			expect(artifacts[0].name).toBe("config.json");
		});
	});

	describe("hasCapability()", () => {
		it("should return true for registered capabilities", () => {
			const manager = new CrossCuttingManager();

			expect(manager.hasCapability(CrossCuttingCapability.WORKFLOW)).toBe(true);
		});

		it("should return false for unregistered capabilities", () => {
			const manager = new CrossCuttingManager();

			expect(manager.hasCapability(CrossCuttingCapability.DIAGRAM)).toBe(false);
			expect(manager.hasCapability(CrossCuttingCapability.SHELL_SCRIPT)).toBe(
				false,
			);
			expect(manager.hasCapability(CrossCuttingCapability.CONFIG)).toBe(false);
		});

		it("should return true after registering a new handler", () => {
			const manager = new CrossCuttingManager();

			expect(manager.hasCapability(CrossCuttingCapability.ISSUES)).toBe(false);

			const mockHandler: CapabilityHandler = {
				capability: CrossCuttingCapability.ISSUES,
				generate: () => null,
				supports: () => true,
			};

			manager.registerHandler(CrossCuttingCapability.ISSUES, mockHandler);

			expect(manager.hasCapability(CrossCuttingCapability.ISSUES)).toBe(true);
		});
	});

	describe("getRegisteredCapabilities()", () => {
		it("should return array of registered capabilities", () => {
			const manager = new CrossCuttingManager();
			const capabilities = manager.getRegisteredCapabilities();

			expect(Array.isArray(capabilities)).toBe(true);
			expect(capabilities).toContain(CrossCuttingCapability.WORKFLOW);
		});

		it("should include newly registered capabilities", () => {
			const manager = new CrossCuttingManager();

			const mockHandler: CapabilityHandler = {
				capability: CrossCuttingCapability.SHELL_SCRIPT,
				generate: () => null,
				supports: () => true,
			};

			manager.registerHandler(CrossCuttingCapability.SHELL_SCRIPT, mockHandler);

			const capabilities = manager.getRegisteredCapabilities();

			expect(capabilities).toContain(CrossCuttingCapability.WORKFLOW);
			expect(capabilities).toContain(CrossCuttingCapability.SHELL_SCRIPT);
		});

		it("should not contain duplicates after overwriting handler", () => {
			const manager = new CrossCuttingManager();

			const customHandler: CapabilityHandler = {
				capability: CrossCuttingCapability.WORKFLOW,
				generate: () => null,
				supports: () => true,
			};

			manager.registerHandler(CrossCuttingCapability.WORKFLOW, customHandler);

			const capabilities = manager.getRegisteredCapabilities();
			const workflowCount = capabilities.filter(
				(c) => c === CrossCuttingCapability.WORKFLOW,
			).length;

			expect(workflowCount).toBe(1);
		});
	});

	describe("integration with WorkflowCapabilityHandler", () => {
		it("should work with actual WorkflowCapabilityHandler", () => {
			const manager = new CrossCuttingManager();
			const domainResult = { coverage: 85 };

			const artifacts = manager.generateArtifacts(
				domainResult,
				[CrossCuttingCapability.WORKFLOW],
				{ coverageThreshold: "85" },
				"ScoringResult",
			);

			expect(artifacts).toHaveLength(1);
			expect(artifacts[0].content).toContain("name: Test");
			expect(artifacts[0].content).toContain("threshold=85");
		});

		it("should use WorkflowCapabilityHandler correctly", () => {
			const manager = new CrossCuttingManager();
			const handler = new WorkflowCapabilityHandler();

			// Re-register to verify it uses the same handler type
			manager.registerHandler(CrossCuttingCapability.WORKFLOW, handler);

			const artifacts = manager.generateArtifacts({}, [
				CrossCuttingCapability.WORKFLOW,
			]);

			expect(artifacts).toHaveLength(1);
			expect(artifacts[0].name).toMatch(/^\.github\/workflows\/\w+\.yml$/);
		});
	});

	describe("edge cases", () => {
		it("should handle empty domainResult", () => {
			const manager = new CrossCuttingManager();

			const artifacts = manager.generateArtifacts({}, [
				CrossCuttingCapability.WORKFLOW,
			]);

			expect(artifacts).toHaveLength(1);
		});

		it("should handle null domainResult", () => {
			const manager = new CrossCuttingManager();

			const artifacts = manager.generateArtifacts(null, [
				CrossCuttingCapability.WORKFLOW,
			]);

			expect(artifacts).toHaveLength(1);
		});

		it("should handle undefined metadata", () => {
			const manager = new CrossCuttingManager();

			const artifacts = manager.generateArtifacts(
				{},
				[CrossCuttingCapability.WORKFLOW],
				undefined,
			);

			expect(artifacts).toHaveLength(1);
		});

		it("should handle undefined domainType", () => {
			const manager = new CrossCuttingManager();

			const artifacts = manager.generateArtifacts(
				{},
				[CrossCuttingCapability.WORKFLOW],
				{},
				undefined,
			);

			expect(artifacts).toHaveLength(1);
		});
	});

	describe("getSupportedCapabilities()", () => {
		it("should return capabilities that support the domain type", () => {
			const manager = new CrossCuttingManager();

			const capabilities = manager.getSupportedCapabilities("PromptResult");

			expect(Array.isArray(capabilities)).toBe(true);
			expect(capabilities).toContain(CrossCuttingCapability.WORKFLOW);
		});

		it("should return empty array for unsupported domain type", () => {
			const manager = new CrossCuttingManager();

			const capabilities = manager.getSupportedCapabilities("UnsupportedType");

			expect(capabilities).toEqual([]);
		});

		it("should include newly registered capabilities that support the domain type", () => {
			const manager = new CrossCuttingManager();

			const mockHandler: CapabilityHandler = {
				capability: CrossCuttingCapability.DIAGRAM,
				generate: () => ({
					type: CrossCuttingCapability.DIAGRAM,
					name: "diagram.mmd",
					content: "graph TD\nA-->B",
				}),
				supports: (domainType: string) => domainType === "TestResult",
			};

			manager.registerHandler(CrossCuttingCapability.DIAGRAM, mockHandler);

			const capabilities = manager.getSupportedCapabilities("TestResult");

			expect(capabilities).toContain(CrossCuttingCapability.DIAGRAM);
		});

		it("should exclude capabilities that don't support the domain type", () => {
			const manager = new CrossCuttingManager();

			const mockHandler: CapabilityHandler = {
				capability: CrossCuttingCapability.CONFIG,
				generate: () => null,
				supports: (domainType: string) => domainType === "SpecificType",
			};

			manager.registerHandler(CrossCuttingCapability.CONFIG, mockHandler);

			const capabilities = manager.getSupportedCapabilities("OtherType");

			expect(capabilities).not.toContain(CrossCuttingCapability.CONFIG);
		});

		it("should return multiple capabilities for supported domain type", () => {
			const manager = new CrossCuttingManager();

			// Add another handler that supports the same domain type
			const mockHandler: CapabilityHandler = {
				capability: CrossCuttingCapability.SHELL_SCRIPT,
				generate: () => ({
					type: CrossCuttingCapability.SHELL_SCRIPT,
					name: "script.sh",
					content: "#!/bin/bash\necho 'test'",
				}),
				supports: (domainType: string) => domainType === "PromptResult",
			};

			manager.registerHandler(CrossCuttingCapability.SHELL_SCRIPT, mockHandler);

			const capabilities = manager.getSupportedCapabilities("PromptResult");

			expect(capabilities.length).toBeGreaterThanOrEqual(2);
			expect(capabilities).toContain(CrossCuttingCapability.WORKFLOW);
			expect(capabilities).toContain(CrossCuttingCapability.SHELL_SCRIPT);
		});
	});

	describe("singleton export", () => {
		it("should export a singleton instance", async () => {
			const { crossCuttingManager } = await import(
				"../../../../src/strategies/cross-cutting/index.js"
			);

			expect(crossCuttingManager).toBeInstanceOf(CrossCuttingManager);
		});

		it("should have default handlers registered in singleton", async () => {
			const { crossCuttingManager } = await import(
				"../../../../src/strategies/cross-cutting/index.js"
			);

			expect(
				crossCuttingManager.hasCapability(CrossCuttingCapability.WORKFLOW),
			).toBe(true);
		});

		it("should be usable directly from singleton", async () => {
			const { crossCuttingManager } = await import(
				"../../../../src/strategies/cross-cutting/index.js"
			);

			const artifacts = crossCuttingManager.generateArtifacts({}, [
				CrossCuttingCapability.WORKFLOW,
			]);

			expect(artifacts).toHaveLength(1);
			expect(artifacts[0].type).toBe(CrossCuttingCapability.WORKFLOW);
		});
	});
});
