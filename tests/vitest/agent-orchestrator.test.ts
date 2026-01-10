/**
 * OLD agent-orchestrator tests for template/custom mode API
 * This API is being replaced by the new action-based API (see P3-014).
 * Tests for the new API are in agent-orchestrator.integration.spec.ts
 */
import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";
import { toolRegistry } from "../../src/tools/shared/tool-registry.js";

// Local stub for the deprecated agentOrchestrator API.
// These tests are skipped, so this function should never be executed.
const agentOrchestrator = async (_options: unknown): Promise<unknown> => {
	throw new Error(
		"agentOrchestrator (OLD API) is no longer available. Use the new action-based API tests instead.",
	);
};

describe.skip("Agent Orchestrator - OLD API (template/custom mode)", () => {
	let toolSuffix: string;
	let testToolName: string;

	beforeEach(() => {
		toolSuffix = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
		testToolName = `orchestrator-test-tool-${toolSuffix}`;

		// Register a test tool
		try {
			toolRegistry.register(
				{
					name: testToolName,
					description: "Test tool for orchestrator",
					inputSchema: z.object({ value: z.number().optional() }),
					canInvoke: [testToolName],
				},
				async (args) => {
					const { value } = args as { value?: number };
					return { success: true, data: { result: (value || 0) * 2 } };
				},
			);
		} catch {
			// Tool may already be registered
		}
	});

	describe("Custom mode execution", () => {
		it("should execute custom workflow", async () => {
			const result = await agentOrchestrator({
				mode: "custom",
				executionPlan: {
					strategy: "sequential",
					steps: [
						{
							id: "step1",
							toolName: testToolName,
							args: { value: 5 },
						},
					],
					onError: "skip",
				},
				includeTrace: true,
			});

			expect(result).toBeDefined();
			expect(result.content).toBeDefined();
			expect(result.content[0].type).toBe("text");
		});

		it("should handle parallel strategy", async () => {
			const result = await agentOrchestrator({
				mode: "custom",
				executionPlan: {
					strategy: "parallel",
					steps: [
						{
							id: "step1",
							toolName: testToolName,
							args: { value: 1 },
						},
						{
							id: "step2",
							toolName: testToolName,
							args: { value: 2 },
						},
					],
					onError: "skip",
				},
				includeTrace: false,
			});

			expect(result).toBeDefined();
			const parsed = JSON.parse(result.content[0].text);
			expect(parsed.steps).toBeDefined();
		});

		it("should include visualization when requested", async () => {
			const result = await agentOrchestrator({
				mode: "custom",
				executionPlan: {
					strategy: "sequential",
					steps: [
						{
							id: "step1",
							toolName: testToolName,
							args: { value: 3 },
						},
					],
					onError: "skip",
				},
				includeVisualization: true,
				includeTrace: true,
			});

			const parsed = JSON.parse(result.content[0].text);
			expect(parsed.visualization).toBeDefined();
			expect(parsed.visualization).toContain("mermaid");
		});
	});

	describe("Template mode execution", () => {
		it("should require template name in template mode", async () => {
			const result = await agentOrchestrator({
				mode: "template",
				includeTrace: false,
			});

			expect(result.isError).toBe(true);
			const parsed = JSON.parse(result.content[0].text);
			expect(parsed.error).toContain("Template name is required");
		});
	});

	describe("Error handling", () => {
		it("should require execution plan in custom mode", async () => {
			const result = await agentOrchestrator({
				mode: "custom",
				includeTrace: false,
			});

			expect(result.isError).toBe(true);
			const parsed = JSON.parse(result.content[0].text);
			expect(parsed.error).toContain("Execution plan is required");
		});

		it("should handle config options", async () => {
			const result = await agentOrchestrator({
				mode: "custom",
				executionPlan: {
					strategy: "sequential",
					steps: [
						{
							id: "step1",
							toolName: testToolName,
							args: { value: 1 },
						},
					],
					onError: "skip",
				},
				config: {
					maxDepth: 5,
					timeoutMs: 5000,
					correlationId: "test-correlation-123",
				},
				includeTrace: true,
			});

			const parsed = JSON.parse(result.content[0].text);
			expect(parsed.summary.correlationId).toBe("test-correlation-123");
		});

		it("should handle parameters passed to steps", async () => {
			const result = await agentOrchestrator({
				mode: "custom",
				executionPlan: {
					strategy: "sequential",
					steps: [
						{
							id: "step1",
							toolName: testToolName,
							args: {},
						},
					],
					onError: "skip",
				},
				parameters: {
					value: 10,
				},
				includeTrace: false,
			});

			const parsed = JSON.parse(result.content[0].text);
			expect(parsed.success).toBeDefined();
		});
	});

	describe("Workflow templates", () => {
		it("should have quality-audit template", async () => {
			// Just test that it doesn't throw with template mode
			const result = await agentOrchestrator({
				mode: "template",
				template: "quality-audit",
				parameters: {
					projectPath: ".",
					codeContent: "const x = 1;",
					language: "typescript",
				},
				includeTrace: false,
			});

			// Template may fail due to missing tools, but structure should be correct
			expect(result.content).toBeDefined();
		});

		it("should have security-scan template", async () => {
			const result = await agentOrchestrator({
				mode: "template",
				template: "security-scan",
				parameters: {
					dependencyContent: "{}",
					codeContext: "function test() {}",
				},
				includeTrace: false,
			});

			expect(result.content).toBeDefined();
		});

		it("should have code-analysis-pipeline template", async () => {
			const result = await agentOrchestrator({
				mode: "template",
				template: "code-analysis-pipeline",
				parameters: {
					codeContent: "const x = 1;",
					projectPath: ".",
					description: "Test analysis",
				},
				includeTrace: false,
			});

			expect(result.content).toBeDefined();
		});

		it("should have documentation-generation template", async () => {
			const result = await agentOrchestrator({
				mode: "template",
				template: "documentation-generation",
				parameters: {
					projectPath: ".",
					contentType: "API",
				},
				includeTrace: false,
			});

			expect(result.content).toBeDefined();
		});
	});

	describe("Execution strategies", () => {
		it("should handle conditional strategy", async () => {
			const result = await agentOrchestrator({
				mode: "custom",
				executionPlan: {
					strategy: "conditional",
					steps: [
						{
							id: "step1",
							toolName: testToolName,
							args: { value: 1 },
						},
					],
					onError: "skip",
				},
				includeTrace: false,
			});

			expect(result.content).toBeDefined();
		});

		it("should handle retry-with-backoff strategy", async () => {
			const result = await agentOrchestrator({
				mode: "custom",
				executionPlan: {
					strategy: "retry-with-backoff",
					steps: [
						{
							id: "step1",
							toolName: testToolName,
							args: { value: 1 },
						},
					],
					onError: "skip",
				},
				includeTrace: false,
			});

			expect(result.content).toBeDefined();
		});

		it("should handle parallel-with-join strategy", async () => {
			const result = await agentOrchestrator({
				mode: "custom",
				executionPlan: {
					strategy: "parallel-with-join",
					steps: [
						{
							id: "step1",
							toolName: testToolName,
							args: { value: 1 },
						},
						{
							id: "step2",
							toolName: testToolName,
							args: { value: 2 },
						},
					],
					onError: "skip",
				},
				includeTrace: false,
			});

			expect(result.content).toBeDefined();
		});
	});
});
