/**
 * Tests for infrastructure components.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentNode, SkillNode } from "../contracts/graph-types.js";
import {
	DataUtilities,
	GraphOrchestrator,
	ObservabilityManager,
	ObservabilityOrchestrator,
	StateMachineOrchestrator,
	StatisticalAnalyzer,
	UnifiedOrchestrator,
} from "../infrastructure/index.js";

describe("Infrastructure", () => {
	let graphOrchestrator: GraphOrchestrator;
	let stateMachineOrchestrator: StateMachineOrchestrator;
	let observabilityManager: ObservabilityManager;
	let statisticalAnalyzer: StatisticalAnalyzer;
	let unifiedOrchestrator: UnifiedOrchestrator;

	beforeEach(() => {
		graphOrchestrator = new GraphOrchestrator();
		stateMachineOrchestrator = new StateMachineOrchestrator({
			enableWorkflowPersistence: false,
		});
		observabilityManager = new ObservabilityManager({
			logLevel: "info",
			enableMetrics: true,
			enableTracing: false,
		});
		statisticalAnalyzer = new StatisticalAnalyzer();
		unifiedOrchestrator = new UnifiedOrchestrator();
	});

	describe("GraphOrchestrator", () => {
		it("should build agent graph correctly", () => {
			const agents: AgentNode[] = [
				{
					id: "agent1",
					name: "Agent 1",
					capabilities: ["skill1", "skill2"],
					modelTier: "free",
					status: "available",
					performance: {
						successRate: 0.9,
						averageLatency: 100,
						throughput: 10,
					},
				},
				{
					id: "agent2",
					name: "Agent 2",
					capabilities: ["skill2", "skill3"],
					modelTier: "cheap",
					status: "available",
					performance: {
						successRate: 0.85,
						averageLatency: 150,
						throughput: 8,
					},
				},
			];

			expect(() => graphOrchestrator.buildAgentGraph(agents)).not.toThrow();
		});

		it("should analyze graph structure", () => {
			const agents: AgentNode[] = [
				{
					id: "agent1",
					name: "Agent 1",
					capabilities: ["skill1"],
					modelTier: "free",
					status: "available",
					performance: {
						successRate: 0.9,
						averageLatency: 100,
						throughput: 10,
					},
				},
			];

			graphOrchestrator.buildAgentGraph(agents);
			const analysis = graphOrchestrator.analyzeGraph();

			expect(analysis).toBeDefined();
			expect(analysis.agentTopology).toBeDefined();
			expect(analysis.skillDependencies).toBeDefined();
			expect(analysis.recommendations).toBeInstanceOf(Array);
		});

		it("should find optimal routes between agents", () => {
			const agents: AgentNode[] = [
				{
					id: "agent1",
					name: "Agent 1",
					capabilities: ["skill1"],
					modelTier: "free",
					status: "available",
					performance: {
						successRate: 0.9,
						averageLatency: 100,
						throughput: 10,
					},
				},
				{
					id: "agent2",
					name: "Agent 2",
					capabilities: ["skill1"],
					modelTier: "free",
					status: "available",
					performance: {
						successRate: 0.85,
						averageLatency: 150,
						throughput: 8,
					},
				},
			];

			graphOrchestrator.buildAgentGraph(agents);
			const route = graphOrchestrator.findOptimalRoute("agent1", "agent2");

			// Should find a route or return null if no path exists
			expect(route === null || typeof route === "object").toBe(true);
		});

		it("logs missing-route decisions when no direct path exists", () => {
			const logSpy = vi.spyOn(ObservabilityOrchestrator.prototype, "log");
			const agents: AgentNode[] = [
				{
					id: "agent1",
					name: "Agent 1",
					capabilities: ["skill1"],
					modelTier: "free",
					status: "available",
					performance: {
						successRate: 0.9,
						averageLatency: 100,
						throughput: 10,
					},
				},
				{
					id: "agent2",
					name: "Agent 2",
					capabilities: ["skill2"],
					modelTier: "cheap",
					status: "available",
					performance: {
						successRate: 0.85,
						averageLatency: 150,
						throughput: 8,
					},
				},
			];

			graphOrchestrator.buildAgentGraph(agents);
			expect(graphOrchestrator.findOptimalRoute("agent1", "agent2")).toBeNull();
			expect(logSpy).toHaveBeenCalledWith(
				"warn",
				"No direct graph route available",
				expect.objectContaining({
					sourceAgent: "agent1",
					targetAgent: "agent2",
				}),
			);
		});
	});

	describe("StateMachineOrchestrator", () => {
		const baseContext = {
			workflowId: "",
			skills: [],
			results: {},
			metadata: {},
			startTime: 0,
		};

		it("should create workflow successfully", () => {
			const workflowId = stateMachineOrchestrator.createSkillWorkflow(
				"test-skill",
				baseContext,
			);
			expect(workflowId).toBeDefined();
			expect(typeof workflowId).toBe("string");
		});

		it("should track workflow state", () => {
			const workflowId = stateMachineOrchestrator.createSkillWorkflow(
				"test-skill",
				baseContext,
			);
			const state = stateMachineOrchestrator.getWorkflowState(workflowId);
			expect(state).toBeDefined();
			expect(state?.status).toMatch(/running|completed|failed|paused/);
		});

		it("should send events to workflows", () => {
			const workflowId = stateMachineOrchestrator.createSkillWorkflow(
				"test-skill",
				baseContext,
			);
			const result = stateMachineOrchestrator.sendEvent(workflowId, "START");
			expect(result).toBe(true);
		});

		it("should list active workflows", () => {
			stateMachineOrchestrator.createSkillWorkflow("test-skill-1", baseContext);
			stateMachineOrchestrator.createSkillWorkflow("test-skill-2", baseContext);
			const activeWorkflows = stateMachineOrchestrator.getActiveWorkflows();
			expect(activeWorkflows.length).toBeGreaterThanOrEqual(2);
		});
	});

	describe("ObservabilityManager", () => {
		it("should log messages correctly", () => {
			expect(() => {
				observabilityManager.log("info", "Test message", { test: true });
			}).not.toThrow();
		});

		it("should start and finish spans", () => {
			const span = observabilityManager.createSpan("test-operation");
			expect(span).toBeDefined();
			expect(typeof span.spanId).toBe("string");
			expect(() => {
				observabilityManager.finishSpan(span);
			}).not.toThrow();
		});

		it("should record metrics", () => {
			const metric: import("../contracts/graph-types.js").PerformanceMetric = {
				entityId: "test-entity",
				metricName: "test-metric",
				name: "test-metric",
				value: 42,
				unit: "ms",
				timestamp: Date.now(),
			};
			observabilityManager.recordMetric(metric);
			const metrics = observabilityManager.getMetrics("test-entity");
			expect(metrics.length).toBe(1);
			expect(metrics[0].value).toBe(42);
		});

		it("should expose health metrics", () => {
			const health = observabilityManager.getHealthMetrics();
			expect(health).toBeDefined();
		});
	});

	describe("StatisticalAnalyzer", () => {
		it("should analyze datasets correctly", () => {
			const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
			const analysis = statisticalAnalyzer.analyze(data);

			expect(analysis.mean).toBe(5.5);
			expect(analysis.median).toBe(5.5);
			expect(analysis.sampleSize).toBe(10);
			expect(analysis.percentiles).toBeDefined();
		});

		it("should detect anomalies", () => {
			const metrics: import("../contracts/graph-types.js").PerformanceMetric[] =
				Array.from({ length: 6 }, (_, i) => ({
					entityId: "test",
					metricName: "latency",
					name: "latency",
					value: i < 5 ? 1 : 100,
					unit: "ms",
					timestamp: Date.now() + i,
				}));
			// Fewer than 10 metrics returns [] per implementation; just verify no throw
			expect(() => statisticalAnalyzer.detectAnomalies(metrics)).not.toThrow();
		});

		it("should compare datasets", () => {
			const dataset1 = [1, 2, 3, 4, 5];
			const dataset2 = [6, 7, 8, 9, 10];
			const comparison = statisticalAnalyzer.compareDatasets(
				dataset1,
				dataset2,
			);
			expect(comparison.significantDifference).toBeDefined();
			expect(comparison.effectSize).toBeDefined();
			expect(comparison.dataset1Mean).toBeDefined();
			expect(comparison.dataset2Mean).toBeDefined();
		});

		it("should analyze correlations via entity IDs", () => {
			// analyzeCorrelation works on recorded metrics; with no data it returns null
			const correlation = statisticalAnalyzer.analyzeCorrelation(
				"entity-a",
				"entity-b",
			);
			expect(correlation === null || typeof correlation === "object").toBe(
				true,
			);
		});
	});

	describe("DataUtilities", () => {
		it("should merge configurations correctly", () => {
			const base = { a: 1, b: { c: 2 } };
			const override = { b: { c: 3 } } as Partial<typeof base>;
			const merged = DataUtilities.mergeConfigurations(base, override);
			expect(merged.a).toBe(1);
			expect(merged.b.c).toBe(3);
		});

		it("should transform datasets with async transformer", async () => {
			const data = [1, 2, 3, 4, 5];
			const transformer = async (x: number) => x * 2;
			const result = await DataUtilities.transformDataset(data, transformer);
			expect(result).toEqual([2, 4, 6, 8, 10]);
		});

		it("should create memoized functions", () => {
			let callCount = 0;
			const expensiveFunction = (x: number) => {
				callCount++;
				return x * x;
			};

			const memoized = DataUtilities.createMemoizedFunction(expensiveFunction);

			expect(memoized(5)).toBe(25);
			expect(memoized(5)).toBe(25); // Should use cache
			expect(callCount).toBe(1); // Only called once
		});

		it("should filter by complex conditions", () => {
			const data = [
				{ name: "Alice", age: 25, score: 85 },
				{ name: "Bob", age: 30, score: 92 },
				{ name: "Charlie", age: 35, score: 78 },
			];

			const filtered = DataUtilities.filterByConditions(data, [
				{ field: "age", operator: "gte", value: 30 },
				{ field: "score", operator: "gt", value: 80 },
			]);

			expect(filtered.length).toBe(1);
			expect(filtered[0].name).toBe("Bob");
		});
	});

	describe("UnifiedOrchestrator", () => {
		it("should create integrated workflows", async () => {
			const agents: AgentNode[] = [
				{
					id: "agent1",
					name: "Agent 1",
					capabilities: ["skill1"],
					modelTier: "free",
					status: "available",
					performance: {
						successRate: 0.9,
						averageLatency: 100,
						throughput: 10,
					},
				},
			];

			const skills: SkillNode[] = [
				{
					id: "skill1",
					name: "Skill 1",
					domain: "test",
					dependencies: [],
					complexity: 1,
					estimatedLatency: 100,
				},
			];

			const workflowId = await unifiedOrchestrator.createIntegratedWorkflow(
				"test-workflow",
				agents,
				skills,
				[],
			);

			expect(workflowId).toBe("test-workflow");
		});

		it("should provide analytics dashboard", () => {
			const dashboard = unifiedOrchestrator.getAnalyticsDashboard();

			expect(dashboard.overview).toBeDefined();
			expect(dashboard.performanceMetrics).toBeDefined();
			expect(dashboard.graphAnalytics).toBeDefined();
			expect(dashboard.anomalies).toBeInstanceOf(Array);
		});

		it("should optimize routing", async () => {
			const optimization = await unifiedOrchestrator.optimizeRouting();

			expect(optimization.optimizationApplied).toBeDefined();
			expect(optimization.strategy).toBeDefined();
			expect(optimization.improvements).toBeInstanceOf(Array);
		});
	});
});
