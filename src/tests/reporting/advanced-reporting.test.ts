import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AdvancedReportingEngine } from "../../reporting/advanced-reporting.js";

function extractDetailedData(report: string) {
	const match = report.match(/<pre[^>]*>\s*([\s\S]*?)\s*<\/pre>/u);
	expect(
		match,
		"report should include a serialized detailed data section",
	).not.toBeNull();
	return JSON.parse(match?.[1] ?? "{}") as Record<string, unknown>;
}

describe("reporting/advanced-reporting", () => {
	it("filters performance report data to the provided time window", async () => {
		const outputDirectory = mkdtempSync(join(tmpdir(), "advanced-reporting-"));
		const engine = new AdvancedReportingEngine({
			outputDirectory,
			includeVisualization: true,
		});
		const now = Date.now();

		const reportPath = await engine.generatePerformanceReport(
			[
				{
					entityId: "workflow-a",
					metricName: "latency",
					name: "latency",
					value: 10,
					unit: "ms",
					timestamp: now - 10_000,
				},
				{
					entityId: "workflow-b",
					metricName: "latency",
					name: "latency",
					value: 30,
					unit: "ms",
					timestamp: now,
				},
			],
			{
				start: new Date(now - 1_000),
				end: new Date(now + 1_000),
			},
		);

		const data = extractDetailedData(readFileSync(reportPath, "utf8")) as {
			overview: {
				totalMetrics: number;
				avgLatency: number;
				timeRange: { start: number; end: number };
			};
			skillAnalytics: Array<{ skillId: string; executionCount: number }>;
		};

		expect(data.overview).toMatchObject({
			totalMetrics: 1,
			avgLatency: 30,
			timeRange: {
				start: now,
				end: now,
			},
		});
		expect(data.skillAnalytics).toHaveLength(1);
		expect(data.skillAnalytics[0]).toMatchObject({
			skillId: "workflow-b",
			executionCount: 1,
		});
	});

	it("writes a performance report containing formatted overview data", async () => {
		const outputDirectory = mkdtempSync(join(tmpdir(), "advanced-reporting-"));
		const engine = new AdvancedReportingEngine({
			outputDirectory,
			includeVisualization: true,
		});

		const reportPath = await engine.generatePerformanceReport([
			{
				entityId: "debug-root-cause",
				metricName: "latency",
				name: "latency",
				value: 42,
				unit: "ms",
				timestamp: Date.now(),
			},
		]);

		const report = readFileSync(reportPath, "utf8");
		const data = extractDetailedData(report) as {
			overview: {
				totalMetrics: number;
				avgLatency: number;
				errorRate: number;
				timeRange: { start: number; end: number };
			};
			skillAnalytics: Array<{
				skillId: string;
				avgLatency: number;
				errorRate: number;
				executionCount: number;
			}>;
		};

		expect(existsSync(reportPath)).toBe(true);
		expect(report).toContain("Performance Analysis Report");
		expect(report).toContain("<h2>Visualizations</h2>");
		expect(report).toContain("Metric snapshot");
		expect(report).toContain("Largest metric values");
		expect(data.overview).toMatchObject({
			totalMetrics: 1,
			avgLatency: 42,
			errorRate: 0,
		});
		expect(data.overview.timeRange.start).toBeTypeOf("number");
		expect(data.overview.timeRange.end).toBeTypeOf("number");
		expect(data.skillAnalytics).toContainEqual({
			skillId: "debug-root-cause",
			avgLatency: 42,
			errorRate: 0,
			executionCount: 1,
		});
	});

	it("renders empty performance visualizations with explicit fallback content", async () => {
		const outputDirectory = mkdtempSync(join(tmpdir(), "advanced-reporting-"));
		const engine = new AdvancedReportingEngine({
			outputDirectory,
			includeVisualization: true,
		});

		const reportPath = await engine.generatePerformanceReport([]);
		const report = readFileSync(reportPath, "utf8");
		const data = extractDetailedData(report) as {
			overview: {
				totalMetrics: number;
				avgLatency: number;
				errorRate: number;
				timeRange: { start: null; end: null };
			};
			skillAnalytics: unknown[];
			anomalies: unknown[];
		};

		expect(data.overview).toEqual({
			totalMetrics: 0,
			avgLatency: 0,
			errorRate: 0,
			timeRange: { start: null, end: null },
		});
		expect(data.skillAnalytics).toEqual([]);
		expect(data.anomalies).toEqual([]);
		expect(report).toContain("<li>No metrics available.</li>");
		expect(report).toContain("<li>No anomalies detected.</li>");
	});

	it("renders orchestration reports from supplied graph data without placeholder output", async () => {
		const outputDirectory = mkdtempSync(
			join(tmpdir(), "orchestration-report-"),
		);
		const engine = new AdvancedReportingEngine({
			outputDirectory,
			includeVisualization: true,
		});

		const routes = new Map<string, Map<string, unknown>>([
			[
				"agent-a",
				new Map([
					[
						"agent-b",
						{
							weight: 0.8,
						},
					],
				]),
			],
		]);

		const reportPath = await engine.generateOrchestrationReport(
			{
				routes,
				agents: [
					{
						id: "agent-a",
						name: "Planner",
						capabilities: ["plan"],
						modelTier: "strong",
						status: "available",
						performance: {
							successRate: 0.9,
							averageLatency: 120,
							throughput: 5,
						},
					},
					{
						id: "agent-b",
						name: "Reviewer",
						capabilities: ["review"],
						modelTier: "cheap",
						status: "available",
						performance: {
							successRate: 0.88,
							averageLatency: 180,
							throughput: 4,
						},
					},
				],
				skills: [
					{
						id: "document",
						name: "document",
						domain: "doc",
						dependencies: [],
						complexity: 3,
						estimatedLatency: 100,
					},
				],
				metrics: [
					{
						entityId: "workflow-1",
						metricName: "workflow_duration",
						name: "workflow_duration",
						value: 250,
						unit: "ms",
						timestamp: Date.now(),
					},
				],
			},
			{
				agentTopology: {
					componentCount: 1,
					centralityScores: { "agent-a": 0.75 },
					nodeCount: 2,
					edgeCount: 1,
				},
				skillDependencies: {
					componentCount: 1,
					hasCycles: false,
					cycles: [],
					nodeCount: 1,
					edgeCount: 0,
				},
				bottlenecks: [{ node: "agent-a", score: 0.75, type: "agent" }],
				recommendations: ["Add capacity to the planner lane."],
			},
		);

		const report = readFileSync(reportPath, "utf8");
		const data = extractDetailedData(report) as {
			insights: {
				topology: {
					agentCount: number;
					skillCount: number;
					routeCount: number;
					bottleneckCount: number;
				};
				performance: {
					averageWorkflowDuration: number;
					errorRate: number;
					routingEfficiency: number;
					throughput: number;
				};
				optimization: {
					recommendations: string[];
				};
			};
		};

		expect(report).toContain("Orchestration Flow Report");
		expect(report).toContain("<h2>Visualizations</h2>");
		expect(report).toContain("Topology");
		expect(report).toContain("Routing efficiency");
		expect(data.insights.topology).toMatchObject({
			agentCount: 2,
			skillCount: 1,
			routeCount: 1,
			bottleneckCount: 1,
		});
		expect(data.insights.performance).toMatchObject({
			averageWorkflowDuration: 250,
			errorRate: 0,
			throughput: 1,
		});
		expect(data.insights.performance.routingEfficiency).toBeCloseTo(0.25);
		expect(data.insights.optimization.recommendations).toContain(
			"Add capacity to the planner lane.",
		);
	});

	it("renders model routing reports with utilization and failover analytics", async () => {
		const outputDirectory = mkdtempSync(
			join(tmpdir(), "model-routing-report-"),
		);
		const engine = new AdvancedReportingEngine({
			outputDirectory,
		});

		const reportPath = await engine.generateModelRoutingReport({
			availableModels: ["model-a", "model-b"],
			routingDecisions: [
				{ model: "model-a", reason: "primary", timestamp: new Date() },
				{ model: "model-a", reason: "primary", timestamp: new Date() },
				{ model: "model-b", reason: "fallback", timestamp: new Date() },
			],
			failoverEvents: [
				{
					from: "model-a",
					to: "model-b",
					reason: "error",
					timestamp: new Date(),
				},
			],
		});

		const report = readFileSync(reportPath, "utf8");
		const data = extractDetailedData(report) as {
			availableModels: string[];
			analytics: {
				modelUtilization: Record<string, number>;
				failoverRate: number;
				availabilityScore: number;
				recommendations: string[];
			};
			recentFailovers: Array<{ from: string; to: string; reason: string }>;
		};

		expect(report).toContain("Model Routing Report");
		expect(report).toContain("model-a");
		expect(data.availableModels).toEqual(["model-a", "model-b"]);
		expect(data.analytics.modelUtilization["model-a"]).toBeCloseTo(66.6667, 3);
		expect(data.analytics.modelUtilization["model-b"]).toBeCloseTo(33.3333, 3);
		expect(data.analytics.failoverRate).toBeCloseTo(1 / 3);
		expect(data.analytics.availabilityScore).toBeCloseTo(2 / 3);
		expect(data.analytics.recommendations).toContain(
			"High failover rate detected - consider reviewing model health checks",
		);
		expect(data.recentFailovers).toContainEqual({
			from: "model-a",
			to: "model-b",
			reason: "error",
			timestamp: expect.any(String),
		});
	});
});
