import { describe, expect, it } from "vitest";
import type {
	PerformanceMetric,
	SkillNode,
} from "../../contracts/graph-types.js";
import {
	analyzePerformanceMetrics,
	analyzeSkillPerformance,
	calculateAverageWorkflowDuration,
	calculateErrorRate,
	calculateThroughput,
} from "../../reporting/advanced-reporting-analytics.js";

function createMetric(
	overrides: Partial<PerformanceMetric> = {},
): PerformanceMetric {
	return {
		entityId: "skill-a",
		metricName: "latency",
		name: "latency",
		value: 100,
		unit: "ms",
		timestamp: Date.parse("2025-01-01T10:00:00.000Z"),
		...overrides,
	};
}

describe("reporting/advanced-reporting-analytics", () => {
	it("summarizes overview, skill analytics, trends, and anomalies", () => {
		const metrics: PerformanceMetric[] = [
			createMetric({
				entityId: "skill-a",
				name: "latency",
				value: 100,
				timestamp: Date.parse("2025-01-01T10:00:00.000Z"),
			}),
			createMetric({
				entityId: "skill-a",
				name: "latency",
				value: 110,
				timestamp: Date.parse("2025-01-01T10:01:00.000Z"),
			}),
			createMetric({
				entityId: "skill-b",
				name: "latency",
				value: 400,
				timestamp: Date.parse("2025-01-01T10:10:00.000Z"),
			}),
			createMetric({
				entityId: "skill-b",
				name: "error_timeout",
				metricName: "error",
				value: 500,
				timestamp: Date.parse("2025-01-01T10:11:00.000Z"),
			}),
		];

		const analysis = analyzePerformanceMetrics(metrics);

		expect(analysis.overview.totalMetrics).toBe(4);
		expect(analysis.overview.avgLatency).toBeCloseTo((100 + 110 + 400) / 3);
		expect(analysis.overview.errorRate).toBe(0.25);
		expect(analysis.skillAnalytics).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					skillId: "skill-a",
					executionCount: 2,
				}),
				expect.objectContaining({
					skillId: "skill-b",
					executionCount: 2,
				}),
			]),
		);
		expect(analysis.trends.latencyTrend).toBe("increasing");
		expect(analysis.anomalies).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					type: "high_latency",
					severity: "medium",
				}),
			]),
		);
	});

	it("builds per-skill analytics with grouped error types and recommendations", () => {
		const skill: SkillNode = {
			id: "skill-a",
			name: "skill-a",
			domain: "debug",
			dependencies: ["skill-b"],
			complexity: 2,
			estimatedLatency: 150,
		};
		const metrics: PerformanceMetric[] = [
			createMetric({
				name: "duration",
				metricName: "duration",
				value: 1500,
			}),
			createMetric({
				name: "error_runtime",
				metricName: "error",
				value: 1500,
				metadata: { errorType: "runtime" },
				timestamp: Date.parse("2025-01-01T10:15:00.000Z"),
			}),
			createMetric({
				name: "error_runtime",
				metricName: "error",
				value: 1500,
				metadata: { errorType: "runtime" },
				timestamp: Date.parse("2025-01-01T10:16:00.000Z"),
			}),
			createMetric({
				name: "error_unknown",
				metricName: "error",
				value: 1500,
				timestamp: Date.parse("2025-01-01T11:00:00.000Z"),
			}),
		];

		const analytics = analyzeSkillPerformance(skill, metrics);

		expect(analytics.skillId).toBe("skill-a");
		expect(analytics.executionCount).toBe(4);
		expect(analytics.averageLatency).toBe(1500);
		expect(analytics.successRate).toBe(0.25);
		expect(analytics.errorTypes).toEqual({ runtime: 2, unknown: 1 });
		expect(analytics.dependencies).toEqual(["skill-b"]);
		expect(analytics.utilizationTrend).toHaveLength(2);
		expect(analytics.recommendations).toEqual(
			expect.arrayContaining([
				expect.stringContaining("High error rate"),
				expect.stringContaining("Low utilization"),
				expect.stringContaining("High latency"),
			]),
		);
	});

	it("computes workflow duration, throughput, and error rate from raw metrics", () => {
		const metrics: PerformanceMetric[] = [
			createMetric({
				name: "workflow_duration",
				metricName: "workflow_duration",
				value: 200,
				timestamp: Date.parse("2025-01-01T10:00:00.000Z"),
			}),
			createMetric({
				name: "workflow_duration",
				metricName: "workflow_duration",
				value: 400,
				timestamp: Date.parse("2025-01-01T10:00:02.000Z"),
			}),
			createMetric({
				name: "workflow_error",
				metricName: "error",
				value: 1,
				timestamp: Date.parse("2025-01-01T10:00:04.000Z"),
			}),
		];

		expect(calculateAverageWorkflowDuration(metrics)).toBe(300);
		expect(calculateErrorRate(metrics)).toBeCloseTo(1 / 3);
		expect(calculateThroughput(metrics)).toBeCloseTo(0.75);
	});
});
