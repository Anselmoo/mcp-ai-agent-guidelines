/**
 * Tests for ExecutionGraph
 *
 * @module tests/agents/execution-graph
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
	ExecutionGraph,
	executionGraph,
} from "../../../src/agents/execution-graph.js";

describe("ExecutionGraph", () => {
	let graph: ExecutionGraph;

	beforeEach(() => {
		graph = new ExecutionGraph();
		executionGraph.clear();
	});

	describe("singleton instance", () => {
		it("should export a singleton instance", () => {
			expect(executionGraph).toBeDefined();
			expect(typeof executionGraph.recordHandoff).toBe("function");
			expect(typeof executionGraph.getRecords).toBe("function");
			expect(typeof executionGraph.toMermaid).toBe("function");
			expect(typeof executionGraph.toSequenceDiagram).toBe("function");
		});
	});

	describe("recordHandoff", () => {
		it("should record a successful handoff", () => {
			graph.recordHandoff({
				sourceAgent: "agent-a",
				targetAgent: "agent-b",
				executionTime: 100,
				success: true,
			});

			const records = graph.getRecords();
			expect(records).toHaveLength(1);
			expect(records[0].sourceAgent).toBe("agent-a");
			expect(records[0].targetAgent).toBe("agent-b");
			expect(records[0].executionTime).toBe(100);
			expect(records[0].success).toBe(true);
			expect(records[0].id).toMatch(/^hf-\d+-[a-z0-9]{6}$/);
			expect(records[0].timestamp).toBeInstanceOf(Date);
		});

		it("should record a failed handoff with error", () => {
			graph.recordHandoff({
				sourceAgent: "agent-a",
				targetAgent: "agent-b",
				executionTime: 50,
				success: false,
				error: "Agent not found",
			});

			const records = graph.getRecords();
			expect(records).toHaveLength(1);
			expect(records[0].success).toBe(false);
			expect(records[0].error).toBe("Agent not found");
		});

		it("should record handoff from user (no sourceAgent)", () => {
			graph.recordHandoff({
				targetAgent: "agent-a",
				executionTime: 75,
				success: true,
			});

			const records = graph.getRecords();
			expect(records).toHaveLength(1);
			expect(records[0].sourceAgent).toBeUndefined();
			expect(records[0].targetAgent).toBe("agent-a");
		});

		it("should generate unique IDs for each handoff", () => {
			graph.recordHandoff({
				targetAgent: "agent-a",
				executionTime: 10,
				success: true,
			});
			graph.recordHandoff({
				targetAgent: "agent-b",
				executionTime: 20,
				success: true,
			});

			const records = graph.getRecords();
			expect(records).toHaveLength(2);
			expect(records[0].id).not.toBe(records[1].id);
		});

		it("should record multiple handoffs in order", () => {
			const handoffs = [
				{ targetAgent: "agent-a", executionTime: 10, success: true },
				{ targetAgent: "agent-b", executionTime: 20, success: true },
				{ targetAgent: "agent-c", executionTime: 30, success: true },
			];

			for (const handoff of handoffs) {
				graph.recordHandoff(handoff);
			}

			const records = graph.getRecords();
			expect(records).toHaveLength(3);
			expect(records[0].targetAgent).toBe("agent-a");
			expect(records[1].targetAgent).toBe("agent-b");
			expect(records[2].targetAgent).toBe("agent-c");
		});

		it("should trim records when exceeding maxRecords", () => {
			const smallGraph = new ExecutionGraph({ maxRecords: 3 });

			for (let i = 0; i < 5; i++) {
				smallGraph.recordHandoff({
					targetAgent: `agent-${i}`,
					executionTime: 10,
					success: true,
				});
			}

			const records = smallGraph.getRecords();
			expect(records).toHaveLength(3);
			// Should keep the last 3 records
			expect(records[0].targetAgent).toBe("agent-2");
			expect(records[1].targetAgent).toBe("agent-3");
			expect(records[2].targetAgent).toBe("agent-4");
		});
	});

	describe("getRecords", () => {
		it("should return empty array when no records", () => {
			const records = graph.getRecords();
			expect(records).toEqual([]);
		});

		it("should return a copy of records", () => {
			graph.recordHandoff({
				targetAgent: "agent-a",
				executionTime: 10,
				success: true,
			});

			const records1 = graph.getRecords();
			const records2 = graph.getRecords();

			expect(records1).toEqual(records2);
			expect(records1).not.toBe(records2); // Different array instances
		});

		it("should not allow mutation of internal records", () => {
			graph.recordHandoff({
				targetAgent: "agent-a",
				executionTime: 10,
				success: true,
			});

			const records = graph.getRecords();
			records.push({
				id: "fake-id",
				targetAgent: "agent-b",
				executionTime: 20,
				success: true,
				timestamp: new Date(),
			});

			expect(graph.getRecords()).toHaveLength(1);
		});
	});

	describe("toMermaid", () => {
		it("should return empty state message when no records", () => {
			const diagram = graph.toMermaid();
			expect(diagram).toBe("graph LR\n    empty[No handoffs recorded]");
		});

		it("should generate flowchart for single handoff from user", () => {
			graph.recordHandoff({
				targetAgent: "agent-a",
				executionTime: 100,
				success: true,
			});

			const diagram = graph.toMermaid();
			expect(diagram).toContain("graph LR");
			expect(diagram).toContain("user -->|100ms| agent-a");
			expect(diagram).toContain("classDef error fill:#f99");
		});

		it("should generate flowchart for agent-to-agent handoff", () => {
			graph.recordHandoff({
				sourceAgent: "agent-a",
				targetAgent: "agent-b",
				executionTime: 50,
				success: true,
			});

			const diagram = graph.toMermaid();
			expect(diagram).toContain("agent-a -->|50ms| agent-b");
		});

		it("should mark failed handoffs with error class", () => {
			graph.recordHandoff({
				targetAgent: "agent-a",
				executionTime: 25,
				success: false,
				error: "Failed",
			});

			const diagram = graph.toMermaid();
			expect(diagram).toContain("user -->|25ms| agent-a:::error");
		});

		it("should generate flowchart for multiple handoffs", () => {
			graph.recordHandoff({
				targetAgent: "agent-a",
				executionTime: 10,
				success: true,
			});
			graph.recordHandoff({
				sourceAgent: "agent-a",
				targetAgent: "agent-b",
				executionTime: 20,
				success: true,
			});
			graph.recordHandoff({
				sourceAgent: "agent-b",
				targetAgent: "agent-c",
				executionTime: 30,
				success: false,
			});

			const diagram = graph.toMermaid();
			expect(diagram).toContain("user -->|10ms| agent-a");
			expect(diagram).toContain("agent-a -->|20ms| agent-b");
			expect(diagram).toContain("agent-b -->|30ms| agent-c:::error");
		});
	});

	describe("toSequenceDiagram", () => {
		it("should return empty state message when no records", () => {
			const diagram = graph.toSequenceDiagram();
			expect(diagram).toBe(
				"sequenceDiagram\n    note over User: No handoffs recorded",
			);
		});

		it("should generate sequence diagram for single handoff from user", () => {
			graph.recordHandoff({
				targetAgent: "agent-a",
				executionTime: 100,
				success: true,
			});

			const diagram = graph.toSequenceDiagram();
			expect(diagram).toContain("sequenceDiagram");
			expect(diagram).toContain("participant U as User");
			expect(diagram).toContain("participant agent-a");
			expect(diagram).toContain("U->>agent-a: handoff (100ms)");
		});

		it("should generate sequence diagram for agent-to-agent handoff", () => {
			graph.recordHandoff({
				sourceAgent: "agent-a",
				targetAgent: "agent-b",
				executionTime: 50,
				success: true,
			});

			const diagram = graph.toSequenceDiagram();
			expect(diagram).toContain("participant agent-a");
			expect(diagram).toContain("participant agent-b");
			expect(diagram).toContain("agent-a->>agent-b: handoff (50ms)");
		});

		it("should use failed arrow for unsuccessful handoffs", () => {
			graph.recordHandoff({
				targetAgent: "agent-a",
				executionTime: 25,
				success: false,
			});

			const diagram = graph.toSequenceDiagram();
			expect(diagram).toContain("U-xagent-a: handoff (25ms)");
		});

		it("should generate sequence diagram for multiple handoffs", () => {
			graph.recordHandoff({
				targetAgent: "agent-a",
				executionTime: 10,
				success: true,
			});
			graph.recordHandoff({
				sourceAgent: "agent-a",
				targetAgent: "agent-b",
				executionTime: 20,
				success: true,
			});
			graph.recordHandoff({
				sourceAgent: "agent-b",
				targetAgent: "agent-c",
				executionTime: 30,
				success: false,
			});

			const diagram = graph.toSequenceDiagram();
			expect(diagram).toContain("U->>agent-a: handoff (10ms)");
			expect(diagram).toContain("agent-a->>agent-b: handoff (20ms)");
			expect(diagram).toContain("agent-b-xagent-c: handoff (30ms)");
		});

		it("should handle multiple handoffs to same agent", () => {
			graph.recordHandoff({
				targetAgent: "agent-a",
				executionTime: 10,
				success: true,
			});
			graph.recordHandoff({
				targetAgent: "agent-a",
				executionTime: 20,
				success: true,
			});

			const diagram = graph.toSequenceDiagram();
			const participantCount = (diagram.match(/participant agent-a/g) || [])
				.length;
			expect(participantCount).toBe(1); // Should only declare participant once
		});
	});

	describe("clear", () => {
		it("should clear all records", () => {
			graph.recordHandoff({
				targetAgent: "agent-a",
				executionTime: 10,
				success: true,
			});
			graph.recordHandoff({
				targetAgent: "agent-b",
				executionTime: 20,
				success: true,
			});

			expect(graph.getRecords()).toHaveLength(2);

			graph.clear();

			expect(graph.getRecords()).toHaveLength(0);
		});

		it("should allow recording after clear", () => {
			graph.recordHandoff({
				targetAgent: "agent-a",
				executionTime: 10,
				success: true,
			});
			graph.clear();

			graph.recordHandoff({
				targetAgent: "agent-b",
				executionTime: 20,
				success: true,
			});

			const records = graph.getRecords();
			expect(records).toHaveLength(1);
			expect(records[0].targetAgent).toBe("agent-b");
		});
	});

	describe("edge cases", () => {
		it("should handle very long execution times", () => {
			graph.recordHandoff({
				targetAgent: "slow-agent",
				executionTime: 999999,
				success: true,
			});

			const mermaid = graph.toMermaid();
			expect(mermaid).toContain("999999ms");
		});

		it("should handle zero execution time", () => {
			graph.recordHandoff({
				targetAgent: "fast-agent",
				executionTime: 0,
				success: true,
			});

			const mermaid = graph.toMermaid();
			expect(mermaid).toContain("0ms");
		});

		it("should handle agent names with special characters", () => {
			graph.recordHandoff({
				sourceAgent: "agent-with-dashes",
				targetAgent: "agent_with_underscores",
				executionTime: 10,
				success: true,
			});

			const mermaid = graph.toMermaid();
			expect(mermaid).toContain("agent-with-dashes");
			expect(mermaid).toContain("agent_with_underscores");
		});

		it("should handle rapid successive handoffs", () => {
			const startTime = Date.now();

			for (let i = 0; i < 10; i++) {
				graph.recordHandoff({
					targetAgent: `agent-${i}`,
					executionTime: 1,
					success: true,
				});
			}

			const records = graph.getRecords();
			expect(records).toHaveLength(10);

			// All timestamps should be close to each other
			const timestamps = records.map((r) => r.timestamp.getTime());
			const maxDiff = Math.max(...timestamps) - Math.min(...timestamps);
			expect(maxDiff).toBeLessThan(1000); // Within 1 second
		});
	});

	describe("integration scenarios", () => {
		it("should track a complete workflow", () => {
			// Simulate a code review workflow
			graph.recordHandoff({
				targetAgent: "code-analyzer",
				executionTime: 150,
				success: true,
			});
			graph.recordHandoff({
				sourceAgent: "code-analyzer",
				targetAgent: "security-checker",
				executionTime: 200,
				success: true,
			});
			graph.recordHandoff({
				sourceAgent: "security-checker",
				targetAgent: "documentation-generator",
				executionTime: 100,
				success: true,
			});

			const records = graph.getRecords();
			expect(records).toHaveLength(3);

			const mermaid = graph.toMermaid();
			expect(mermaid).toContain("user -->|150ms| code-analyzer");
			expect(mermaid).toContain("code-analyzer -->|200ms| security-checker");
			expect(mermaid).toContain(
				"security-checker -->|100ms| documentation-generator",
			);

			const sequence = graph.toSequenceDiagram();
			expect(sequence).toContain("U->>code-analyzer");
			expect(sequence).toContain("code-analyzer->>security-checker");
			expect(sequence).toContain("security-checker->>documentation-generator");
		});

		it("should track workflow with failures", () => {
			graph.recordHandoff({
				targetAgent: "step-1",
				executionTime: 50,
				success: true,
			});
			graph.recordHandoff({
				sourceAgent: "step-1",
				targetAgent: "step-2",
				executionTime: 75,
				success: false,
				error: "Validation failed",
			});

			const records = graph.getRecords();
			expect(records[1].success).toBe(false);
			expect(records[1].error).toBe("Validation failed");

			const mermaid = graph.toMermaid();
			expect(mermaid).toContain("step-1 -->|75ms| step-2:::error");

			const sequence = graph.toSequenceDiagram();
			expect(sequence).toContain("step-1-xstep-2");
		});
	});
});
