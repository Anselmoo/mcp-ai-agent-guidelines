/**
 * Integration tests for ExecutionGraph with AgentOrchestrator
 *
 * @module tests/agents/execution-graph-integration
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type AgentDefinition,
	AgentOrchestrator,
	agentRegistry,
	executionGraph,
	type Workflow,
} from "../../../src/agents/index.js";

describe("ExecutionGraph Integration with AgentOrchestrator", () => {
	let orchestrator: AgentOrchestrator;
	let mockToolExecutor: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		orchestrator = new AgentOrchestrator();
		mockToolExecutor = vi.fn();
		orchestrator.setToolExecutor(mockToolExecutor);
		agentRegistry.clear();
		executionGraph.clear();
	});

	describe("executeHandoff tracking", () => {
		it("should record successful handoff", async () => {
			const agent: AgentDefinition = {
				name: "test-agent",
				description: "Test agent",
				capabilities: ["test"],
				inputSchema: {},
				toolName: "test-tool",
			};
			agentRegistry.registerAgent(agent);

			mockToolExecutor.mockResolvedValue({ result: "success" });

			await orchestrator.executeHandoff({
				targetAgent: "test-agent",
				context: { data: "test" },
			});

			const records = executionGraph.getRecords();
			expect(records).toHaveLength(1);
			expect(records[0].targetAgent).toBe("test-agent");
			expect(records[0].success).toBe(true);
			expect(records[0].executionTime).toBeGreaterThanOrEqual(0);
			expect(records[0].sourceAgent).toBeUndefined();
		});

		it("should record failed handoff for non-existent agent", async () => {
			await orchestrator.executeHandoff({
				targetAgent: "non-existent",
				context: {},
			});

			const records = executionGraph.getRecords();
			expect(records).toHaveLength(1);
			expect(records[0].targetAgent).toBe("non-existent");
			expect(records[0].success).toBe(false);
			expect(records[0].error).toContain("Agent not found");
		});

		it("should record failed handoff when tool execution fails", async () => {
			const agent: AgentDefinition = {
				name: "failing-agent",
				description: "Fails",
				capabilities: ["fail"],
				inputSchema: {},
				toolName: "fail-tool",
			};
			agentRegistry.registerAgent(agent);

			mockToolExecutor.mockRejectedValue(new Error("Tool failed"));

			await orchestrator.executeHandoff({
				targetAgent: "failing-agent",
				context: {},
			});

			const records = executionGraph.getRecords();
			expect(records).toHaveLength(1);
			expect(records[0].success).toBe(false);
			expect(records[0].error).toBe("Tool failed");
		});

		it("should record handoff with sourceAgent", async () => {
			const agent: AgentDefinition = {
				name: "target-agent",
				description: "Target",
				capabilities: ["test"],
				inputSchema: {},
				toolName: "target-tool",
			};
			agentRegistry.registerAgent(agent);

			mockToolExecutor.mockResolvedValue({ result: "ok" });

			await orchestrator.executeHandoff({
				sourceAgent: "source-agent",
				targetAgent: "target-agent",
				context: {},
			});

			const records = executionGraph.getRecords();
			expect(records).toHaveLength(1);
			expect(records[0].sourceAgent).toBe("source-agent");
			expect(records[0].targetAgent).toBe("target-agent");
		});
	});

	describe("executeWorkflow tracking", () => {
		it("should record all steps in a workflow", async () => {
			const agents: AgentDefinition[] = [
				{
					name: "step-1",
					description: "First",
					capabilities: ["step1"],
					inputSchema: {},
					toolName: "tool-1",
				},
				{
					name: "step-2",
					description: "Second",
					capabilities: ["step2"],
					inputSchema: {},
					toolName: "tool-2",
				},
				{
					name: "step-3",
					description: "Third",
					capabilities: ["step3"],
					inputSchema: {},
					toolName: "tool-3",
				},
			];

			for (const agent of agents) {
				agentRegistry.registerAgent(agent);
			}

			mockToolExecutor
				.mockResolvedValueOnce({ step1: "done" })
				.mockResolvedValueOnce({ step2: "done" })
				.mockResolvedValueOnce({ step3: "done" });

			const workflow: Workflow = {
				name: "test-workflow",
				description: "Test",
				steps: [{ agent: "step-1" }, { agent: "step-2" }, { agent: "step-3" }],
			};

			await orchestrator.executeWorkflow(workflow, { input: "test" });

			const records = executionGraph.getRecords();
			expect(records).toHaveLength(3);

			// First step has no source
			expect(records[0].sourceAgent).toBeUndefined();
			expect(records[0].targetAgent).toBe("step-1");
			expect(records[0].success).toBe(true);

			// Second step has step-1 as source
			expect(records[1].sourceAgent).toBe("step-1");
			expect(records[1].targetAgent).toBe("step-2");
			expect(records[1].success).toBe(true);

			// Third step has step-2 as source
			expect(records[2].sourceAgent).toBe("step-2");
			expect(records[2].targetAgent).toBe("step-3");
			expect(records[2].success).toBe(true);
		});

		it("should record workflow failure correctly", async () => {
			const agents: AgentDefinition[] = [
				{
					name: "step-1",
					description: "First",
					capabilities: ["step1"],
					inputSchema: {},
					toolName: "tool-1",
				},
				{
					name: "step-2",
					description: "Second (fails)",
					capabilities: ["step2"],
					inputSchema: {},
					toolName: "tool-2",
				},
			];

			for (const agent of agents) {
				agentRegistry.registerAgent(agent);
			}

			mockToolExecutor
				.mockResolvedValueOnce({ step1: "done" })
				.mockRejectedValueOnce(new Error("Step 2 failed"));

			const workflow: Workflow = {
				name: "failing-workflow",
				description: "Fails at step 2",
				steps: [{ agent: "step-1" }, { agent: "step-2" }],
			};

			await orchestrator.executeWorkflow(workflow, {});

			const records = executionGraph.getRecords();
			expect(records).toHaveLength(2);
			expect(records[0].success).toBe(true);
			expect(records[1].success).toBe(false);
			expect(records[1].error).toBe("Step 2 failed");
		});
	});

	describe("diagram generation after workflow", () => {
		it("should generate Mermaid flowchart for workflow", async () => {
			const agents: AgentDefinition[] = [
				{
					name: "analyzer",
					description: "Analyzer",
					capabilities: ["analyze"],
					inputSchema: {},
					toolName: "analyze-tool",
				},
				{
					name: "transformer",
					description: "Transformer",
					capabilities: ["transform"],
					inputSchema: {},
					toolName: "transform-tool",
				},
			];

			for (const agent of agents) {
				agentRegistry.registerAgent(agent);
			}

			mockToolExecutor
				.mockResolvedValueOnce({ analyzed: true })
				.mockResolvedValueOnce({ transformed: true });

			const workflow: Workflow = {
				name: "analysis-workflow",
				description: "Analysis and transformation",
				steps: [{ agent: "analyzer" }, { agent: "transformer" }],
			};

			await orchestrator.executeWorkflow(workflow, { data: "input" });

			const mermaid = executionGraph.toMermaid();
			expect(mermaid).toContain("graph LR");
			expect(mermaid).toContain("user -->|");
			expect(mermaid).toContain("| analyzer");
			expect(mermaid).toContain("analyzer -->|");
			expect(mermaid).toContain("| transformer");
		});

		it("should generate sequence diagram for workflow", async () => {
			const agent: AgentDefinition = {
				name: "processor",
				description: "Processor",
				capabilities: ["process"],
				inputSchema: {},
				toolName: "process-tool",
			};
			agentRegistry.registerAgent(agent);

			mockToolExecutor.mockResolvedValue({ processed: true });

			const workflow: Workflow = {
				name: "simple-workflow",
				description: "Simple processing",
				steps: [{ agent: "processor" }],
			};

			await orchestrator.executeWorkflow(workflow, {});

			const sequence = executionGraph.toSequenceDiagram();
			expect(sequence).toContain("sequenceDiagram");
			expect(sequence).toContain("participant U as User");
			expect(sequence).toContain("participant processor");
			expect(sequence).toContain("U->>processor: handoff");
		});

		it("should show errors in diagrams for failed workflows", async () => {
			const agent: AgentDefinition = {
				name: "failing-agent",
				description: "Fails",
				capabilities: ["fail"],
				inputSchema: {},
				toolName: "fail-tool",
			};
			agentRegistry.registerAgent(agent);

			mockToolExecutor.mockRejectedValue(new Error("Failed"));

			await orchestrator.executeHandoff({
				targetAgent: "failing-agent",
				context: {},
			});

			const mermaid = executionGraph.toMermaid();
			expect(mermaid).toContain(":::error");

			const sequence = executionGraph.toSequenceDiagram();
			expect(sequence).toContain("-x"); // Failed arrow
		});
	});

	describe("multiple workflows", () => {
		it("should accumulate records across multiple workflows", async () => {
			const agent: AgentDefinition = {
				name: "worker",
				description: "Worker",
				capabilities: ["work"],
				inputSchema: {},
				toolName: "work-tool",
			};
			agentRegistry.registerAgent(agent);

			mockToolExecutor.mockResolvedValue({ done: true });

			// Execute first workflow
			await orchestrator.executeHandoff({
				targetAgent: "worker",
				context: { task: 1 },
			});

			expect(executionGraph.getRecords()).toHaveLength(1);

			// Execute second workflow
			await orchestrator.executeHandoff({
				targetAgent: "worker",
				context: { task: 2 },
			});

			expect(executionGraph.getRecords()).toHaveLength(2);
		});

		it("should clear records when requested", async () => {
			const agent: AgentDefinition = {
				name: "worker",
				description: "Worker",
				capabilities: ["work"],
				inputSchema: {},
				toolName: "work-tool",
			};
			agentRegistry.registerAgent(agent);

			mockToolExecutor.mockResolvedValue({ done: true });

			await orchestrator.executeHandoff({
				targetAgent: "worker",
				context: {},
			});

			expect(executionGraph.getRecords()).toHaveLength(1);

			executionGraph.clear();

			expect(executionGraph.getRecords()).toHaveLength(0);

			// New handoffs should be recorded after clear
			await orchestrator.executeHandoff({
				targetAgent: "worker",
				context: {},
			});

			expect(executionGraph.getRecords()).toHaveLength(1);
		});
	});
});
