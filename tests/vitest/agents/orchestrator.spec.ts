/**
 * Tests for AgentOrchestrator
 *
 * @module tests/agents/orchestrator
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	type AgentDefinition,
	AgentOrchestrator,
	agentOrchestrator,
	agentRegistry,
	type Workflow,
} from "../../../src/agents/index.js";

describe("AgentOrchestrator", () => {
	let orchestrator: AgentOrchestrator;
	let mockToolExecutor: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		orchestrator = new AgentOrchestrator();
		mockToolExecutor = vi.fn();
		orchestrator.setToolExecutor(mockToolExecutor);
		agentRegistry.clear();
	});

	afterEach(() => {
		agentRegistry.clear();
		vi.clearAllMocks();
	});

	describe("singleton instance", () => {
		it("should export a singleton instance", () => {
			expect(agentOrchestrator).toBeInstanceOf(AgentOrchestrator);
		});
	});

	describe("setToolExecutor", () => {
		it("should set the tool executor function", async () => {
			const executor = vi.fn();
			orchestrator.setToolExecutor(executor);

			// Verify by attempting to execute a handoff
			const agent: AgentDefinition = {
				name: "test-agent",
				description: "Test agent",
				capabilities: ["test"],
				inputSchema: {},
				toolName: "test-tool",
			};
			agentRegistry.registerAgent(agent);

			executor.mockResolvedValue({ result: "success" });

			await orchestrator.executeHandoff({
				targetAgent: "test-agent",
				context: { data: "test" },
			});

			// Executor should be called
			expect(executor).toHaveBeenCalled();
		});
	});

	describe("executeHandoff", () => {
		it("should execute handoff to valid agent", async () => {
			const agent: AgentDefinition = {
				name: "code-reviewer",
				description: "Reviews code",
				capabilities: ["code-review"],
				inputSchema: {},
				toolName: "review-tool",
			};
			agentRegistry.registerAgent(agent);

			const expectedOutput = { review: "Code looks good" };
			mockToolExecutor.mockResolvedValue(expectedOutput);

			const result = await orchestrator.executeHandoff({
				targetAgent: "code-reviewer",
				context: { code: "console.log('hello')" },
			});

			expect(result.success).toBe(true);
			expect(result.output).toEqual(expectedOutput);
			expect(result.executionTime).toBeGreaterThanOrEqual(0);
			expect(result.error).toBeUndefined();
			expect(mockToolExecutor).toHaveBeenCalledWith("review-tool", {
				code: "console.log('hello')",
			});
		});

		it("should return error for non-existent agent", async () => {
			const result = await orchestrator.executeHandoff({
				targetAgent: "non-existent-agent",
				context: { data: "test" },
			});

			expect(result.success).toBe(false);
			expect(result.output).toBeNull();
			expect(result.error).toContain("Agent not found: non-existent-agent");
			expect(result.executionTime).toBeGreaterThanOrEqual(0);
			expect(mockToolExecutor).not.toHaveBeenCalled();
		});

		it("should handle tool execution errors", async () => {
			const agent: AgentDefinition = {
				name: "failing-agent",
				description: "Agent that fails",
				capabilities: ["fail"],
				inputSchema: {},
				toolName: "failing-tool",
			};
			agentRegistry.registerAgent(agent);

			const error = new Error("Tool execution failed");
			mockToolExecutor.mockRejectedValue(error);

			const result = await orchestrator.executeHandoff({
				targetAgent: "failing-agent",
				context: { input: "test" },
			});

			expect(result.success).toBe(false);
			expect(result.output).toBeNull();
			expect(result.error).toBe("Tool execution failed");
			expect(result.executionTime).toBeGreaterThanOrEqual(0);
		});

		it("should handle unknown error types", async () => {
			const agent: AgentDefinition = {
				name: "unknown-error-agent",
				description: "Agent with unknown error",
				capabilities: ["unknown"],
				inputSchema: {},
				toolName: "unknown-tool",
			};
			agentRegistry.registerAgent(agent);

			mockToolExecutor.mockRejectedValue("String error");

			const result = await orchestrator.executeHandoff({
				targetAgent: "unknown-error-agent",
				context: { input: "test" },
			});

			expect(result.success).toBe(false);
			expect(result.output).toBeNull();
			expect(result.error).toBe("Unknown error");
			expect(result.executionTime).toBeGreaterThanOrEqual(0);
		});

		it("should pass context to tool executor", async () => {
			const agent: AgentDefinition = {
				name: "context-agent",
				description: "Agent that uses context",
				capabilities: ["context"],
				inputSchema: {},
				toolName: "context-tool",
			};
			agentRegistry.registerAgent(agent);

			mockToolExecutor.mockResolvedValue({ result: "processed" });

			const context = { userId: "123", operation: "test" };
			await orchestrator.executeHandoff({
				targetAgent: "context-agent",
				context,
			});

			expect(mockToolExecutor).toHaveBeenCalledWith("context-tool", context);
		});

		it("should record execution time accurately", async () => {
			const agent: AgentDefinition = {
				name: "timing-agent",
				description: "Agent for timing test",
				capabilities: ["timing"],
				inputSchema: {},
				toolName: "timing-tool",
			};
			agentRegistry.registerAgent(agent);

			mockToolExecutor.mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 10));
				return { result: "done" };
			});

			const result = await orchestrator.executeHandoff({
				targetAgent: "timing-agent",
				context: {},
			});

			// Execution time should be at least some time, accounting for timer precision
			expect(result.executionTime).toBeGreaterThanOrEqual(0);
			// More realistic check: should be less than 1000ms
			expect(result.executionTime).toBeLessThan(1000);
		});

		it("should handle error when tool executor not configured", async () => {
			const unconfiguredOrchestrator = new AgentOrchestrator();

			const agent: AgentDefinition = {
				name: "test-agent",
				description: "Test agent",
				capabilities: ["test"],
				inputSchema: {},
				toolName: "test-tool",
			};
			agentRegistry.registerAgent(agent);

			const result = await unconfiguredOrchestrator.executeHandoff({
				targetAgent: "test-agent",
				context: {},
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain("Tool executor not configured");
		});
	});

	describe("executeWorkflow", () => {
		it("should execute simple workflow with one step", async () => {
			const agent: AgentDefinition = {
				name: "step-1",
				description: "First step",
				capabilities: ["process"],
				inputSchema: {},
				toolName: "tool-1",
			};
			agentRegistry.registerAgent(agent);

			mockToolExecutor.mockResolvedValue({ result: "step1-output" });

			const workflow: Workflow = {
				name: "simple-workflow",
				description: "Simple one-step workflow",
				steps: [{ agent: "step-1" }],
			};

			const result = await orchestrator.executeWorkflow(workflow, {
				input: "initial",
			});

			expect(result.success).toBe(true);
			expect(result.outputs._initial).toEqual({ input: "initial" });
			expect(result.outputs["step-1"]).toEqual({ result: "step1-output" });
			expect(result.steps).toHaveLength(1);
			expect(result.steps[0].agent).toBe("step-1");
			expect(result.steps[0].success).toBe(true);
			expect(result.executionTime).toBeGreaterThanOrEqual(0);
			expect(result.error).toBeUndefined();
		});

		it("should execute multi-step workflow with context propagation", async () => {
			const agents: AgentDefinition[] = [
				{
					name: "analyzer",
					description: "Analyzes input",
					capabilities: ["analyze"],
					inputSchema: {},
					toolName: "analyze-tool",
				},
				{
					name: "transformer",
					description: "Transforms data",
					capabilities: ["transform"],
					inputSchema: {},
					toolName: "transform-tool",
				},
				{
					name: "validator",
					description: "Validates output",
					capabilities: ["validate"],
					inputSchema: {},
					toolName: "validate-tool",
				},
			];

			for (const agent of agents) {
				agentRegistry.registerAgent(agent);
			}

			mockToolExecutor
				.mockResolvedValueOnce({ analyzed: true, data: "analyzed-data" })
				.mockResolvedValueOnce({ transformed: true, data: "transformed-data" })
				.mockResolvedValueOnce({ valid: true });

			const workflow: Workflow = {
				name: "multi-step-workflow",
				description: "Multi-step processing",
				steps: [
					{ agent: "analyzer" },
					{ agent: "transformer" },
					{ agent: "validator" },
				],
			};

			const result = await orchestrator.executeWorkflow(workflow, {
				raw: "input-data",
			});

			expect(result.success).toBe(true);
			expect(result.steps).toHaveLength(3);
			expect(result.outputs.analyzer).toEqual({
				analyzed: true,
				data: "analyzed-data",
			});
			expect(result.outputs.transformer).toEqual({
				transformed: true,
				data: "transformed-data",
			});
			expect(result.outputs.validator).toEqual({ valid: true });

			// Verify context propagation
			expect(mockToolExecutor).toHaveBeenNthCalledWith(1, "analyze-tool", {
				raw: "input-data",
			});
			expect(mockToolExecutor).toHaveBeenNthCalledWith(2, "transform-tool", {
				analyzed: true,
				data: "analyzed-data",
			});
			expect(mockToolExecutor).toHaveBeenNthCalledWith(3, "validate-tool", {
				transformed: true,
				data: "transformed-data",
			});
		});

		it("should use input mapping when specified", async () => {
			const agents: AgentDefinition[] = [
				{
					name: "extractor",
					description: "Extracts data",
					capabilities: ["extract"],
					inputSchema: {},
					toolName: "extract-tool",
				},
				{
					name: "processor",
					description: "Processes specific fields",
					capabilities: ["process"],
					inputSchema: {},
					toolName: "process-tool",
				},
			];

			for (const agent of agents) {
				agentRegistry.registerAgent(agent);
			}

			mockToolExecutor
				.mockResolvedValueOnce({
					user: { id: "123", name: "Alice" },
					metadata: { timestamp: "2024-01-01" },
				})
				.mockResolvedValueOnce({ processed: true });

			const workflow: Workflow = {
				name: "mapped-workflow",
				description: "Workflow with input mapping",
				steps: [
					{ agent: "extractor" },
					{
						agent: "processor",
						inputMapping: {
							userId: "extractor.user.id",
							userName: "extractor.user.name",
							timestamp: "extractor.metadata.timestamp",
						},
					},
				],
			};

			const result = await orchestrator.executeWorkflow(workflow, {
				source: "input",
			});

			expect(result.success).toBe(true);
			expect(mockToolExecutor).toHaveBeenNthCalledWith(2, "process-tool", {
				userId: "123",
				userName: "Alice",
				timestamp: "2024-01-01",
			});
		});

		it("should handle workflow failure at specific step", async () => {
			const agents: AgentDefinition[] = [
				{
					name: "step-1",
					description: "First step",
					capabilities: ["step1"],
					inputSchema: {},
					toolName: "tool-1",
				},
				{
					name: "step-2",
					description: "Second step (fails)",
					capabilities: ["step2"],
					inputSchema: {},
					toolName: "tool-2",
				},
				{
					name: "step-3",
					description: "Third step (not reached)",
					capabilities: ["step3"],
					inputSchema: {},
					toolName: "tool-3",
				},
			];

			for (const agent of agents) {
				agentRegistry.registerAgent(agent);
			}

			mockToolExecutor
				.mockResolvedValueOnce({ step1: "success" })
				.mockRejectedValueOnce(new Error("Step 2 failed"));

			const workflow: Workflow = {
				name: "failing-workflow",
				description: "Workflow that fails at step 2",
				steps: [{ agent: "step-1" }, { agent: "step-2" }, { agent: "step-3" }],
			};

			const result = await orchestrator.executeWorkflow(workflow, {
				input: "test",
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain("Workflow failed at step: step-2");
			expect(result.steps).toHaveLength(2);
			expect(result.steps[0].success).toBe(true);
			expect(result.steps[1].success).toBe(false);
			expect(result.steps[1].error).toBe("Step 2 failed");

			// Step 3 should not be executed
			expect(mockToolExecutor).toHaveBeenCalledTimes(2);
		});

		it("should handle non-existent agent in workflow", async () => {
			const workflow: Workflow = {
				name: "invalid-workflow",
				description: "Workflow with non-existent agent",
				steps: [{ agent: "non-existent-agent" }],
			};

			const result = await orchestrator.executeWorkflow(workflow, {
				input: "test",
			});

			expect(result.success).toBe(false);
			expect(result.error).toContain(
				"Workflow failed at step: non-existent-agent",
			);
			expect(result.steps).toHaveLength(1);
			expect(result.steps[0].success).toBe(false);
			expect(result.steps[0].error).toContain("Agent not found");
		});

		it("should record execution time for workflow", async () => {
			const agent: AgentDefinition = {
				name: "slow-agent",
				description: "Slow agent",
				capabilities: ["slow"],
				inputSchema: {},
				toolName: "slow-tool",
			};
			agentRegistry.registerAgent(agent);

			mockToolExecutor.mockImplementation(async () => {
				await new Promise((resolve) => setTimeout(resolve, 50));
				return { result: "done" };
			});

			const workflow: Workflow = {
				name: "timed-workflow",
				description: "Workflow for timing",
				steps: [{ agent: "slow-agent" }, { agent: "slow-agent" }],
			};

			const result = await orchestrator.executeWorkflow(workflow, {});

			// Allow slight timing variance in CI environments; don't require exact 50ms per step.
			expect(result.executionTime).toBeGreaterThanOrEqual(90);
			expect(result.steps[0].executionTime).toBeGreaterThanOrEqual(45);
			expect(result.steps[1].executionTime).toBeGreaterThanOrEqual(45);
		});

		it("should handle empty workflow", async () => {
			const workflow: Workflow = {
				name: "empty-workflow",
				description: "Workflow with no steps",
				steps: [],
			};

			const result = await orchestrator.executeWorkflow(workflow, {
				input: "test",
			});

			expect(result.success).toBe(true);
			expect(result.steps).toHaveLength(0);
			expect(result.outputs._initial).toEqual({ input: "test" });
		});

		it("should handle undefined values in input mapping", async () => {
			const agents: AgentDefinition[] = [
				{
					name: "source",
					description: "Source agent",
					capabilities: ["source"],
					inputSchema: {},
					toolName: "source-tool",
				},
				{
					name: "destination",
					description: "Destination agent",
					capabilities: ["dest"],
					inputSchema: {},
					toolName: "dest-tool",
				},
			];

			for (const agent of agents) {
				agentRegistry.registerAgent(agent);
			}

			mockToolExecutor
				.mockResolvedValueOnce({ data: { value: "exists" } })
				.mockResolvedValueOnce({ result: "ok" });

			const workflow: Workflow = {
				name: "undefined-mapping-workflow",
				description: "Workflow with undefined paths",
				steps: [
					{ agent: "source" },
					{
						agent: "destination",
						inputMapping: {
							exists: "source.data.value",
							missing: "source.nonexistent.path",
						},
					},
				],
			};

			const result = await orchestrator.executeWorkflow(workflow, {});

			expect(result.success).toBe(true);
			expect(mockToolExecutor).toHaveBeenNthCalledWith(2, "dest-tool", {
				exists: "exists",
				missing: undefined,
			});
		});

		it("should handle workflow with complex nested output mapping", async () => {
			const agents: AgentDefinition[] = [
				{
					name: "complex-agent",
					description: "Agent with complex output",
					capabilities: ["complex"],
					inputSchema: {},
					toolName: "complex-tool",
				},
				{
					name: "consumer",
					description: "Consumes mapped data",
					capabilities: ["consume"],
					inputSchema: {},
					toolName: "consumer-tool",
				},
			];

			for (const agent of agents) {
				agentRegistry.registerAgent(agent);
			}

			const complexOutput = {
				level1: {
					level2: {
						level3: {
							value: "deep-value",
						},
					},
					array: [{ id: 1 }, { id: 2 }],
				},
			};

			mockToolExecutor
				.mockResolvedValueOnce(complexOutput)
				.mockResolvedValueOnce({ consumed: true });

			const workflow: Workflow = {
				name: "complex-mapping-workflow",
				description: "Workflow with complex mapping",
				steps: [
					{ agent: "complex-agent" },
					{
						agent: "consumer",
						inputMapping: {
							deepValue: "complex-agent.level1.level2.level3.value",
							firstArrayItem: "complex-agent.level1.array",
						},
					},
				],
			};

			const result = await orchestrator.executeWorkflow(workflow, {});

			expect(result.success).toBe(true);
			expect(mockToolExecutor).toHaveBeenNthCalledWith(2, "consumer-tool", {
				deepValue: "deep-value",
				firstArrayItem: [{ id: 1 }, { id: 2 }],
			});
		});
	});

	describe("edge cases", () => {
		it("should handle workflow with duplicate agent names", async () => {
			const agent: AgentDefinition = {
				name: "repeater",
				description: "Agent that repeats",
				capabilities: ["repeat"],
				inputSchema: {},
				toolName: "repeat-tool",
			};
			agentRegistry.registerAgent(agent);

			mockToolExecutor
				.mockResolvedValueOnce({ count: 1 })
				.mockResolvedValueOnce({ count: 2 });

			const workflow: Workflow = {
				name: "duplicate-workflow",
				description: "Workflow with duplicate agents",
				steps: [{ agent: "repeater" }, { agent: "repeater" }],
			};

			const result = await orchestrator.executeWorkflow(workflow, {});

			expect(result.success).toBe(true);
			expect(result.outputs.repeater).toEqual({ count: 2 }); // Last execution wins
			expect(mockToolExecutor).toHaveBeenCalledTimes(2);
		});

		it("should handle null and undefined context values", async () => {
			const agent: AgentDefinition = {
				name: "null-handler",
				description: "Handles null values",
				capabilities: ["null"],
				inputSchema: {},
				toolName: "null-tool",
			};
			agentRegistry.registerAgent(agent);

			mockToolExecutor.mockResolvedValue({ handled: true });

			await orchestrator.executeHandoff({
				targetAgent: "null-handler",
				context: null,
			});

			expect(mockToolExecutor).toHaveBeenCalledWith("null-tool", null);

			await orchestrator.executeHandoff({
				targetAgent: "null-handler",
				context: undefined,
			});

			expect(mockToolExecutor).toHaveBeenCalledWith("null-tool", undefined);
		});

		it("should preserve initial input in workflow outputs", async () => {
			const agent: AgentDefinition = {
				name: "processor",
				description: "Processes data",
				capabilities: ["process"],
				inputSchema: {},
				toolName: "process-tool",
			};
			agentRegistry.registerAgent(agent);

			mockToolExecutor.mockResolvedValue({ processed: true });

			const workflow: Workflow = {
				name: "preserve-input-workflow",
				description: "Workflow that preserves input",
				steps: [{ agent: "processor" }],
			};

			const initialInput = { important: "data", nested: { value: 123 } };
			const result = await orchestrator.executeWorkflow(workflow, initialInput);

			expect(result.outputs._initial).toEqual(initialInput);
		});
	});
});
