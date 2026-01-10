/**
 * Integration tests for the refactored agent-orchestrator tool
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { agentOrchestrator } from "../../../src/agents/orchestrator.js";
import { agentRegistry } from "../../../src/agents/registry.js";
import type { AgentDefinition } from "../../../src/agents/types.js";
import {
	type AgentOrchestratorAction,
	agentOrchestratorTool,
} from "../../../src/tools/agent-orchestrator.js";
import { ErrorCode } from "../../../src/tools/shared/error-codes.js";
import { McpToolError } from "../../../src/tools/shared/errors.js";

describe("Agent Orchestrator Tool - Integration", () => {
	beforeEach(() => {
		// Clear the registry before each test
		agentRegistry.clear();
	});

	describe("list-agents action", () => {
		it("should list all registered agents", async () => {
			// Register test agents
			const agent1: AgentDefinition = {
				name: "test-agent-1",
				description: "Test agent 1",
				capabilities: ["capability1", "capability2"],
				inputSchema: {},
				toolName: "test-tool-1",
			};

			const agent2: AgentDefinition = {
				name: "test-agent-2",
				description: "Test agent 2",
				capabilities: ["capability3"],
				inputSchema: {},
				toolName: "test-tool-2",
			};

			agentRegistry.registerAgent(agent1);
			agentRegistry.registerAgent(agent2);

			const result = await agentOrchestratorTool({
				action: "list-agents",
			});

			expect(result.content).toBeDefined();
			expect(result.content[0].type).toBe("text");
			const content = result.content[0].text;
			expect(content).toContain("test-agent-1");
			expect(content).toContain("Test agent 1");
			expect(content).toContain("capability1, capability2");
			expect(content).toContain("test-agent-2");
			expect(content).toContain("capability3");
		});

		it("should return empty list when no agents registered", async () => {
			const result = await agentOrchestratorTool({
				action: "list-agents",
			});

			expect(result.content).toBeDefined();
			expect(result.content[0].type).toBe("text");
			const content = result.content[0].text;
			expect(content).toContain("Available Agents");
		});
	});

	describe("list-workflows action", () => {
		it("should list all available workflows", async () => {
			const result = await agentOrchestratorTool({
				action: "list-workflows",
			});

			expect(result.content).toBeDefined();
			expect(result.content[0].type).toBe("text");
			const content = result.content[0].text;
			expect(content).toContain("Available Workflows");
			// Should contain the default workflows
			expect(content).toContain("code-review-chain");
			expect(content).toContain("design-to-spec");
		});
	});

	describe("handoff action", () => {
		it("should throw ZodError when targetAgent is missing", async () => {
			// Zod validation throws ZodError for missing required fields
			await expect(
				agentOrchestratorTool({
					action: "handoff",
					context: { data: "test" },
				}),
			).rejects.toThrow(ZodError);

			try {
				await agentOrchestratorTool({
					action: "handoff",
					context: { data: "test" },
				});
			} catch (error) {
				expect(error).toBeInstanceOf(ZodError);
				expect((error as ZodError).issues[0].path).toContain("targetAgent");
				expect((error as ZodError).issues[0].message).toContain("Required");
			}
		});

		it("should return error response when agent not found", async () => {
			const result = await agentOrchestratorTool({
				action: "handoff",
				targetAgent: "non-existent-agent",
				context: { data: "test" },
			});

			expect(result.isError).toBe(true);
			expect(result.content[0].text).toContain("Handoff failed");
			expect(result.content[0].text).toContain("not found");
		});

		it("should execute handoff to registered agent with tool executor", async () => {
			// Register test agent
			const testAgent: AgentDefinition = {
				name: "test-agent",
				description: "Test agent",
				capabilities: ["test"],
				inputSchema: {},
				toolName: "test-tool",
			};

			agentRegistry.registerAgent(testAgent);

			// Set up tool executor
			const mockToolExecutor = vi.fn().mockResolvedValue({
				result: "test output",
			});
			agentOrchestrator.setToolExecutor(mockToolExecutor);

			const result = await agentOrchestratorTool({
				action: "handoff",
				targetAgent: "test-agent",
				context: { input: "test data" },
				reason: "testing",
			});

			expect(result.content).toBeDefined();
			expect(result.content[0].type).toBe("text");
			const content = result.content[0].text;
			expect(content).toContain("Handoff Completed");
			expect(content).toContain("test-agent");
			expect(content).toContain("Execution Time");
			expect(mockToolExecutor).toHaveBeenCalledWith("test-tool", {
				input: "test data",
			});
		});
	});

	describe("workflow action", () => {
		it("should throw ZodError when workflowName is missing", async () => {
			// Zod validation throws ZodError for missing required fields
			await expect(
				agentOrchestratorTool({
					action: "workflow",
					workflowInput: { data: "test" },
				}),
			).rejects.toThrow(ZodError);

			try {
				await agentOrchestratorTool({
					action: "workflow",
					workflowInput: { data: "test" },
				});
			} catch (error) {
				expect(error).toBeInstanceOf(ZodError);
				expect((error as ZodError).issues[0].path).toContain("workflowName");
				expect((error as ZodError).issues[0].message).toContain("Required");
			}
		});

		it("should throw error when workflow not found", async () => {
			await expect(
				agentOrchestratorTool({
					action: "workflow",
					workflowName: "non-existent-workflow",
					workflowInput: { data: "test" },
				}),
			).rejects.toThrow(McpToolError);

			try {
				await agentOrchestratorTool({
					action: "workflow",
					workflowName: "non-existent-workflow",
					workflowInput: { data: "test" },
				});
			} catch (error) {
				expect(error).toBeInstanceOf(McpToolError);
				expect((error as McpToolError).code).toBe(ErrorCode.RESOURCE_NOT_FOUND);
				expect((error as McpToolError).message).toContain("Workflow not found");
			}
		});

		it("should execute existing workflow", async () => {
			// Register agents for the workflow
			const agent1: AgentDefinition = {
				name: "code-scorer",
				description: "Code quality scorer",
				capabilities: ["code-quality"],
				inputSchema: {},
				toolName: "clean-code-scorer",
			};

			agentRegistry.registerAgent(agent1);

			// Set up tool executor
			const mockToolExecutor = vi.fn().mockResolvedValue({
				score: 85,
			});
			agentOrchestrator.setToolExecutor(mockToolExecutor);

			const result = await agentOrchestratorTool({
				action: "workflow",
				workflowName: "code-review-chain",
				workflowInput: { code: "test code" },
			});

			expect(result.content).toBeDefined();
			expect(result.content[0].type).toBe("text");
			const content = result.content[0].text;
			expect(content).toContain("Workflow");
			expect(content).toContain("code-review-chain");
		});
	});

	describe("error handling", () => {
		it("should throw ZodError for unknown action", async () => {
			// Zod discriminated union validation throws ZodError for invalid action
			await expect(
				agentOrchestratorTool({
					action: "unknown-action" as AgentOrchestratorAction,
				}),
			).rejects.toThrow(ZodError);

			try {
				await agentOrchestratorTool({
					action: "unknown-action" as AgentOrchestratorAction,
				});
			} catch (error) {
				expect(error).toBeInstanceOf(ZodError);
				expect((error as ZodError).issues[0].code).toBe(
					"invalid_union_discriminator",
				);
			}
		});
	});
});
