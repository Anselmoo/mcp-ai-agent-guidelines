/**
 * Tests for WorkflowCapabilityHandler
 *
 * @module tests/strategies/cross-cutting/workflow-handler
 */

import { describe, expect, it } from "vitest";
import type { CapabilityContext } from "../../../../src/strategies/cross-cutting/types.js";
import { WorkflowCapabilityHandler } from "../../../../src/strategies/cross-cutting/workflow-handler.js";
import { CrossCuttingCapability } from "../../../../src/strategies/output-strategy.js";

describe("WorkflowCapabilityHandler", () => {
	describe("constructor and properties", () => {
		it("should have WORKFLOW capability", () => {
			const handler = new WorkflowCapabilityHandler();
			expect(handler.capability).toBe(CrossCuttingCapability.WORKFLOW);
		});

		it("should have readonly capability property", () => {
			const handler = new WorkflowCapabilityHandler();
			expect(handler.capability).toBe(CrossCuttingCapability.WORKFLOW);
		});
	});

	describe("supports() method", () => {
		it("should support SessionState", () => {
			const handler = new WorkflowCapabilityHandler();
			expect(handler.supports("SessionState")).toBe(true);
		});

		it("should support PromptResult", () => {
			const handler = new WorkflowCapabilityHandler();
			expect(handler.supports("PromptResult")).toBe(true);
		});

		it("should support ScoringResult", () => {
			const handler = new WorkflowCapabilityHandler();
			expect(handler.supports("ScoringResult")).toBe(true);
		});

		it("should not support unsupported types", () => {
			const handler = new WorkflowCapabilityHandler();
			expect(handler.supports("UnknownType")).toBe(false);
			expect(handler.supports("AnalysisResult")).toBe(false);
			expect(handler.supports("")).toBe(false);
		});
	});

	describe("generate() - CI workflow", () => {
		it("should generate default CI workflow", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: {},
			};

			const artifact = handler.generate(context);

			expect(artifact).not.toBeNull();
			expect(artifact?.type).toBe(CrossCuttingCapability.WORKFLOW);
			expect(artifact?.name).toBe(".github/workflows/ci.yml");
			expect(artifact?.content).toContain("name: CI");
			expect(artifact?.content).toContain("on:");
			expect(artifact?.content).toContain("push:");
			expect(artifact?.content).toContain("pull_request:");
			expect(artifact?.content).toContain("branches: [main]");
			expect(artifact?.content).toContain("runs-on: ubuntu-latest");
			expect(artifact?.content).toContain("actions/checkout@v4");
			expect(artifact?.content).toContain("actions/setup-node@v4");
			expect(artifact?.content).toContain("node-version: 22");
			expect(artifact?.content).toContain("npm ci");
			expect(artifact?.content).toContain("npm run quality");
			expect(artifact?.content).toContain("npm run test:all");
		});

		it("should use custom node version from metadata", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: {},
				metadata: { nodeVersion: "18" },
			};

			const artifact = handler.generate(context);

			expect(artifact?.content).toContain("node-version: 18");
		});

		it("should use custom branches from metadata", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: {},
				metadata: { branches: ["main", "develop"] },
			};

			const artifact = handler.generate(context);

			expect(artifact?.content).toContain("branches: [main, develop]");
		});
	});

	describe("generate() - Deploy workflow", () => {
		it("should generate deploy workflow with deployment indicator", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: { deployment: true },
			};

			const artifact = handler.generate(context);

			expect(artifact?.name).toBe(".github/workflows/deploy.yml");
			expect(artifact?.content).toContain("name: Deploy");
			expect(artifact?.content).toContain("workflow_dispatch:");
			expect(artifact?.content).toContain("environment: production");
			expect(artifact?.content).toContain("npm run build");
			expect(artifact?.content).toContain("npm run deploy");
			expect(artifact?.content).toContain("DEPLOY_TOKEN");
		});

		it("should detect deploy from metadata workflowType", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: {},
				metadata: { workflowType: "deploy" },
			};

			const artifact = handler.generate(context);

			expect(artifact?.name).toBe(".github/workflows/deploy.yml");
			expect(artifact?.content).toContain("name: Deploy");
		});

		it("should use custom environment from metadata", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: { deployment: true },
				metadata: { environment: "staging" },
			};

			const artifact = handler.generate(context);

			expect(artifact?.content).toContain("environment: staging");
		});

		it("should detect deploy from 'deploy' field", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: { deploy: "production" },
			};

			const artifact = handler.generate(context);

			expect(artifact?.name).toBe(".github/workflows/deploy.yml");
		});

		it("should detect deploy from 'environment' field", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: { environment: "staging" },
			};

			const artifact = handler.generate(context);

			expect(artifact?.name).toBe(".github/workflows/deploy.yml");
		});
	});

	describe("generate() - Test workflow", () => {
		it("should generate test workflow with coverage indicator", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: { coverage: 90 },
			};

			const artifact = handler.generate(context);

			expect(artifact?.name).toBe(".github/workflows/test.yml");
			expect(artifact?.content).toContain("name: Test");
			expect(artifact?.content).toContain("npm run test:vitest");
			expect(artifact?.content).toContain("npm run check:coverage-threshold");
			expect(artifact?.content).toContain("threshold=90");
			expect(artifact?.content).toContain("codecov/codecov-action@v4");
			expect(artifact?.content).toContain("./coverage/lcov.info");
		});

		it("should detect test from metadata workflowType", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: {},
				metadata: { workflowType: "test" },
			};

			const artifact = handler.generate(context);

			expect(artifact?.name).toBe(".github/workflows/test.yml");
		});

		it("should use custom coverage threshold from metadata", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: { coverage: 80 },
				metadata: { coverageThreshold: "85" },
			};

			const artifact = handler.generate(context);

			expect(artifact?.content).toContain("threshold=85");
		});

		it("should detect test from 'tests' field", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: { tests: true },
			};

			const artifact = handler.generate(context);

			expect(artifact?.name).toBe(".github/workflows/test.yml");
		});

		it("should detect test from 'testing' field", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: { testing: "enabled" },
			};

			const artifact = handler.generate(context);

			expect(artifact?.name).toBe(".github/workflows/test.yml");
		});
	});

	describe("generate() - Release workflow", () => {
		it("should generate release workflow with release indicator", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: { release: "1.0.0" },
			};

			const artifact = handler.generate(context);

			expect(artifact?.name).toBe(".github/workflows/release.yml");
			expect(artifact?.content).toContain("name: Release");
			expect(artifact?.content).toContain("tags:");
			expect(artifact?.content).toContain("- 'v*'");
			expect(artifact?.content).toContain("permissions:");
			expect(artifact?.content).toContain("contents: write");
			expect(artifact?.content).toContain("packages: write");
			expect(artifact?.content).toContain("npm publish");
			expect(artifact?.content).toContain("NPM_TOKEN");
			expect(artifact?.content).toContain("actions/create-release@v1");
		});

		it("should detect release from metadata workflowType", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: {},
				metadata: { workflowType: "release" },
			};

			const artifact = handler.generate(context);

			expect(artifact?.name).toBe(".github/workflows/release.yml");
		});

		it("should detect release from 'version' field", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: { version: "2.0.0" },
			};

			const artifact = handler.generate(context);

			expect(artifact?.name).toBe(".github/workflows/release.yml");
		});

		it("should detect release from 'tag' field", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: { tag: "v1.0.0" },
			};

			const artifact = handler.generate(context);

			expect(artifact?.name).toBe(".github/workflows/release.yml");
		});
	});

	describe("workflow type detection priority", () => {
		it("should prioritize metadata workflowType over result fields", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: { deployment: true, coverage: 90 },
				metadata: { workflowType: "ci" },
			};

			const artifact = handler.generate(context);

			expect(artifact?.name).toBe(".github/workflows/ci.yml");
		});

		it("should prioritize deployment over release", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: { deployment: true, release: "1.0.0" },
			};

			const artifact = handler.generate(context);

			expect(artifact?.name).toBe(".github/workflows/deploy.yml");
		});

		it("should prioritize release over test", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: { release: "1.0.0", coverage: 90 },
			};

			const artifact = handler.generate(context);

			expect(artifact?.name).toBe(".github/workflows/release.yml");
		});

		it("should fallback to CI for unknown workflowType", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: {},
				metadata: { workflowType: "unknown" },
			};

			const artifact = handler.generate(context);

			expect(artifact?.name).toBe(".github/workflows/ci.yml");
		});
	});

	describe("edge cases", () => {
		it("should handle null domainResult", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: null,
			};

			const artifact = handler.generate(context);

			expect(artifact).not.toBeNull();
			expect(artifact?.name).toBe(".github/workflows/ci.yml");
		});

		it("should handle undefined domainResult", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: undefined,
			};

			const artifact = handler.generate(context);

			expect(artifact).not.toBeNull();
			expect(artifact?.name).toBe(".github/workflows/ci.yml");
		});

		it("should handle empty metadata", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: {},
				metadata: {},
			};

			const artifact = handler.generate(context);

			expect(artifact?.content).toContain("node-version: 22");
			expect(artifact?.content).toContain("branches: [main]");
		});

		it("should handle array with single branch", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: {},
				metadata: { branches: ["develop"] },
			};

			const artifact = handler.generate(context);

			expect(artifact?.content).toContain("branches: [develop]");
		});

		it("should generate valid YAML structure", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: {},
			};

			const artifact = handler.generate(context);

			// Check basic YAML structure
			expect(artifact?.content).toMatch(/^name: \w+/);
			expect(artifact?.content).toContain("on:");
			expect(artifact?.content).toContain("jobs:");
			expect(artifact?.content).toContain("steps:");
			expect(artifact?.content).toContain("- uses:");
			expect(artifact?.content).toContain("- run:");
		});
	});

	describe("artifact structure", () => {
		it("should return correct artifact type", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: {},
			};

			const artifact = handler.generate(context);

			expect(artifact?.type).toBe(CrossCuttingCapability.WORKFLOW);
		});

		it("should return artifact with correct path structure", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: {},
			};

			const artifact = handler.generate(context);

			expect(artifact?.name).toMatch(/^\.github\/workflows\/\w+\.yml$/);
		});

		it("should return artifact with non-empty content", () => {
			const handler = new WorkflowCapabilityHandler();
			const context: CapabilityContext = {
				domainResult: {},
			};

			const artifact = handler.generate(context);

			expect(artifact?.content).toBeTruthy();
			expect(artifact?.content.length).toBeGreaterThan(0);
		});
	});
});
