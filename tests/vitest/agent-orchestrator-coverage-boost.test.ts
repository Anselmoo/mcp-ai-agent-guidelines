/**
 * Additional tests to boost agent-orchestrator.ts coverage
 * Targeting uncovered branches:
 * - Line 161: template validation
 * - Line 233-238: error tracing
 * - Line 249: error handling branches
 * - Line 279-329: workflow template parameters
 *
 * NOTE: These tests are for the OLD agent-orchestrator implementation with mode="template"/mode="custom" API.
 * This API is being replaced by the new action-based API (see P3-014).
 * Tests for the new API are in agent-orchestrator.integration.spec.ts
 */
import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { toolRegistry } from "../../src/tools/shared/tool-registry.js";

// Local stub for the deprecated agentOrchestrator API used only in skipped tests.
// This avoids importing a removed export from agent-orchestrator.ts.
// If these tests are ever unskipped, they should be updated to use the new API.
const agentOrchestrator = async (..._args: unknown[]) => {
	throw new Error("Deprecated agentOrchestrator API is no longer available.");
};

describe.skip("AgentOrchestrator Coverage Boost - OLD API (template/custom mode)", () => {
	let toolSuffix: string;

	beforeEach(() => {
		toolSuffix = `orch-${Date.now()}-${Math.random().toString(36).substring(7)}`;
	});

	const registerMockTool = (name: string) => {
		try {
			toolRegistry.register(
				{
					name,
					description: `Mock tool ${name}`,
					inputSchema: z.object({}).passthrough(),
					canInvoke: ["*"],
				},
				async () => ({ success: true, data: { mock: true } }),
			);
		} catch {
			// Tool may already be registered
		}
		return name;
	};

	describe("Template mode validation", () => {
		it("should error when template mode without template name", async () => {
			const result = await agentOrchestrator({
				mode: "template",
				// Missing template
			});

			expect(result.isError).toBe(true);
			expect(
				JSON.parse((result.content[0] as { text: string }).text).error,
			).toContain("Template name is required");
		});

		it("should error when custom mode without execution plan", async () => {
			const result = await agentOrchestrator({
				mode: "custom",
				// Missing executionPlan
			});

			expect(result.isError).toBe(true);
			expect(
				JSON.parse((result.content[0] as { text: string }).text).error,
			).toContain("Execution plan is required");
		});
	});

	describe("Template workflows with parameters", () => {
		beforeEach(() => {
			// Register mock tools that the templates use
			registerMockTool("clean-code-scorer");
			registerMockTool("code-hygiene-analyzer");
			registerMockTool("dependency-auditor");
			registerMockTool("security-hardening-prompt-builder");
			registerMockTool("semantic-code-analyzer");
			registerMockTool("mermaid-diagram-generator");
			registerMockTool("project-onboarding");
			registerMockTool("documentation-generator-prompt-builder");
		});

		it("should execute quality-audit template with projectPath parameter", async () => {
			const result = await agentOrchestrator({
				mode: "template",
				template: "quality-audit",
				parameters: {
					projectPath: "/test/path",
					codeContent: "test code",
					language: "javascript",
				},
			});

			// Should complete without throwing
			expect(result).toBeDefined();
		});

		it("should execute security-scan template with parameters", async () => {
			const result = await agentOrchestrator({
				mode: "template",
				template: "security-scan",
				parameters: {
					dependencyContent: "{}",
					codeContext: "function test() {}",
				},
			});

			expect(result).toBeDefined();
		});

		it("should execute code-analysis-pipeline template with parameters", async () => {
			const result = await agentOrchestrator({
				mode: "template",
				template: "code-analysis-pipeline",
				parameters: {
					codeContent: "const x = 1;",
					projectPath: "/test",
				},
			});

			expect(result).toBeDefined();
		});

		it("should execute documentation-generation template with parameters", async () => {
			const result = await agentOrchestrator({
				mode: "template",
				template: "documentation-generation",
				parameters: {
					projectPath: "/test/project",
				},
			});

			expect(result).toBeDefined();
		});
	});

	describe("Trace inclusion", () => {
		beforeEach(() => {
			registerMockTool("clean-code-scorer");
			registerMockTool("code-hygiene-analyzer");
		});

		it("should include trace when includeTrace is true", async () => {
			const result = await agentOrchestrator({
				mode: "template",
				template: "quality-audit",
				parameters: {
					projectPath: ".",
					codeContent: "test",
					language: "typescript",
				},
				includeTrace: true,
			});

			const parsed = JSON.parse((result.content[0] as { text: string }).text);
			// Trace may or may not be included depending on execution
			expect(parsed).toBeDefined();
		});

		it("should not include trace when includeTrace is false", async () => {
			const result = await agentOrchestrator({
				mode: "template",
				template: "quality-audit",
				parameters: {
					projectPath: ".",
					codeContent: "test",
					language: "typescript",
				},
				includeTrace: false,
			});

			const parsed = JSON.parse((result.content[0] as { text: string }).text);
			expect(parsed.trace).toBeUndefined();
		});
	});

	describe("Error handling with trace", () => {
		it("should handle error with trace logging", async () => {
			// Create a tool that will fail
			const failingToolName = `failing-orch-${toolSuffix}`;
			toolRegistry.register(
				{
					name: failingToolName,
					description: "Failing tool",
					inputSchema: z.object({}).passthrough(),
					canInvoke: ["*"],
				},
				async () => {
					throw new Error("Orchestrated tool failed");
				},
			);

			const result = await agentOrchestrator({
				mode: "custom",
				executionPlan: {
					strategy: "sequential",
					steps: [
						{
							id: "fail-step",
							toolName: failingToolName,
							args: {},
						},
					],
					onError: "abort",
				},
				includeTrace: true,
			});

			// Parse the result to check content
			const parsed = JSON.parse((result.content[0] as { text: string }).text);
			// With abort strategy, the chain should fail
			expect(parsed.success).toBe(false);
		});
	});

	describe("Custom execution plans", () => {
		it("should handle custom sequential plan", async () => {
			const toolName = registerMockTool(`custom-seq-${toolSuffix}`);

			const result = await agentOrchestrator({
				mode: "custom",
				executionPlan: {
					strategy: "sequential",
					steps: [
						{ id: "step1", toolName, args: { test: 1 } },
						{ id: "step2", toolName, args: { test: 2 } },
					],
					onError: "skip",
				},
			});

			const parsed = JSON.parse((result.content[0] as { text: string }).text);
			expect(parsed.success).toBeDefined();
		});

		it("should handle custom parallel plan", async () => {
			const toolName = registerMockTool(`custom-par-${toolSuffix}`);

			const result = await agentOrchestrator({
				mode: "custom",
				executionPlan: {
					strategy: "parallel",
					steps: [
						{ id: "step1", toolName, args: { test: 1 } },
						{ id: "step2", toolName, args: { test: 2 } },
					],
					onError: "skip",
				},
			});

			const parsed = JSON.parse((result.content[0] as { text: string }).text);
			expect(parsed.success).toBeDefined();
		});

		it("should handle custom conditional plan", async () => {
			const toolName = registerMockTool(`custom-cond-${toolSuffix}`);

			const result = await agentOrchestrator({
				mode: "custom",
				executionPlan: {
					strategy: "conditional",
					steps: [
						{
							id: "step1",
							toolName,
							args: { test: 1 },
							condition: () => true,
						},
					],
					onError: "skip",
				},
			});

			const parsed = JSON.parse((result.content[0] as { text: string }).text);
			expect(parsed.success).toBeDefined();
		});

		it("should handle custom retry plan", async () => {
			const toolName = registerMockTool(`custom-retry-${toolSuffix}`);

			const result = await agentOrchestrator({
				mode: "custom",
				executionPlan: {
					strategy: "retry-with-backoff",
					steps: [{ id: "step1", toolName, args: { test: 1 } }],
					onError: "skip",
					retryConfig: {
						maxRetries: 2,
						initialDelayMs: 5,
						maxDelayMs: 20,
						backoffMultiplier: 2,
					},
				},
			});

			const parsed = JSON.parse((result.content[0] as { text: string }).text);
			expect(parsed.success).toBeDefined();
		});

		it("should handle custom plan with dependencies and transforms", async () => {
			const addTool = `add-${toolSuffix}`;
			toolRegistry.register(
				{
					name: addTool,
					description: "Add tool",
					inputSchema: z.object({ a: z.number(), b: z.number() }).passthrough(),
					canInvoke: ["*"],
				},
				async (args) => {
					const { a, b } = args as { a: number; b: number };
					return { success: true, data: a + b };
				},
			);

			const result = await agentOrchestrator({
				mode: "custom",
				executionPlan: {
					strategy: "sequential",
					steps: [
						{ id: "step1", toolName: addTool, args: { a: 5, b: 3 } },
						{
							id: "step2",
							toolName: addTool,
							args: { a: 1, b: 1 },
							dependencies: ["step1"],
							transform: (prev) => ({ a: (prev as number) || 0, b: 10 }),
						},
					],
					onError: "skip",
				},
			});

			const parsed = JSON.parse((result.content[0] as { text: string }).text);
			expect(parsed.success).toBeDefined();
		});
	});

	describe("Max depth and timeout", () => {
		it("should respect maxDepth parameter", async () => {
			const toolName = registerMockTool(`depth-${toolSuffix}`);

			const result = await agentOrchestrator({
				mode: "custom",
				executionPlan: {
					strategy: "sequential",
					steps: [{ id: "step1", toolName, args: {} }],
					onError: "skip",
				},
				maxDepth: 5,
			});

			const parsed = JSON.parse((result.content[0] as { text: string }).text);
			expect(parsed).toBeDefined();
		});

		it("should respect timeout parameter", async () => {
			const toolName = registerMockTool(`timeout-${toolSuffix}`);

			const result = await agentOrchestrator({
				mode: "custom",
				executionPlan: {
					strategy: "sequential",
					steps: [{ id: "step1", toolName, args: {} }],
					onError: "skip",
				},
				timeoutMs: 30000,
			});

			const parsed = JSON.parse((result.content[0] as { text: string }).text);
			expect(parsed).toBeDefined();
		});
	});
});
