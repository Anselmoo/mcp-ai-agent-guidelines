import { describe, expect, it } from "vitest";
import type { PerformanceMetric } from "../../contracts/graph-types.js";
import { StatisticalAnalyzer } from "../../infrastructure/statistical-analysis.js";

function createMetric(
	entityId: string,
	value: number,
	timestamp: number,
	metricName: string = "latency",
): PerformanceMetric {
	return {
		entityId,
		metricName,
		name: metricName,
		value,
		unit: "ms",
		timestamp,
	};
}

describe("statistical-analysis", () => {
	it("computes summary statistics and compares datasets", () => {
		const analyzer = new StatisticalAnalyzer();
		const summary = analyzer.analyze([1, 2, 3, 4, 5]);
		const comparison = analyzer.compareDatasets([1, 1, 1], [10, 10, 10]);

		expect(summary.mean).toBe(3);
		expect(summary.percentiles["50th"]).toBe(3);
		expect(comparison.significantDifference).toBe(true);
	});

	it("detects outliers only when enough metrics are present", () => {
		const analyzer = new StatisticalAnalyzer();
		const metrics = Array.from({ length: 10 }, (_, index) => ({
			entityId: "skill",
			metricName: "latency",
			name: "latency",
			value: index === 9 ? 100 : 10,
			unit: "ms",
			timestamp: Date.now() + index,
		}));

		expect(analyzer.detectAnomalies(metrics).length).toBeGreaterThan(0);
	});

	it("tracks recent metrics, trims history, and computes time-windowed trends", () => {
		const analyzer = new StatisticalAnalyzer();
		const baseTime = Date.now();

		for (let index = 0; index < 1002; index += 1) {
			analyzer.recordMetric(
				"agent-a",
				createMetric("agent-a", index * 1000, baseTime - 1000 + index),
			);
		}

		const trend = analyzer.analyzeTrends("agent-a", 5000);

		expect(trend).not.toBeNull();
		expect(trend?.sampleCount).toBe(1000);
		expect(trend?.entityId).toBe("agent-a");
		expect(trend?.trend.confidence).toBe(0.8);
		expect(trend?.max).toBe(1001000);
		expect(trend?.min).toBe(2000);
		expect(trend?.anomalies).toEqual([]);
	});

	it("returns null when trend or comparison inputs are insufficient", () => {
		const analyzer = new StatisticalAnalyzer();
		const baseTime = Date.now();

		analyzer.recordMetric("agent-a", createMetric("agent-a", 10, baseTime));
		analyzer.recordMetric(
			"agent-b",
			createMetric("agent-b", 20, baseTime - 10_000_000),
		);

		expect(analyzer.analyzeTrends("agent-a")).toBeNull();
		expect(analyzer.comparePerformance("agent-a", "agent-b")).toBeNull();
		expect(analyzer.analyzeCorrelation("agent-a", "agent-b")).toBeNull();
	});

	it("compares entity performance and summarizes top and bottom performers", () => {
		const analyzer = new StatisticalAnalyzer();
		const baseTime = Date.now();

		for (let index = 0; index < 5; index += 1) {
			analyzer.recordMetric(
				"fast-agent",
				createMetric("fast-agent", 20 + index, baseTime + index),
			);
			analyzer.recordMetric(
				"slow-agent",
				createMetric("slow-agent", 120 + index * 5, baseTime + index),
			);
		}

		const comparison = analyzer.comparePerformance("fast-agent", "slow-agent");
		const score = analyzer.calculatePerformanceScore("fast-agent");
		const global = analyzer.getGlobalStatistics();

		expect(comparison).not.toBeNull();
		expect(comparison?.significantDifference).toBe(true);
		expect(comparison?.recommendation).toContain("slow-agent performs");
		expect(score?.rank).toMatch(/excellent|good|average|poor/);
		expect(global.totalEntities).toBe(2);
		expect(global.totalMetrics).toBe(10);
		expect(global.averageMetricsPerEntity).toBe(5);
		expect(global.topPerformers[0]?.entityId).toBe("slow-agent");
		expect(global.bottomPerformers[0]?.entityId).toBe("fast-agent");
	});

	it("analyzes direct trends and correlations for aligned metric series", () => {
		const analyzer = new StatisticalAnalyzer();
		const baseTime = Date.now();

		for (let index = 0; index < 10; index += 1) {
			analyzer.recordMetric(
				"queue-depth",
				createMetric("queue-depth", 10 + index, baseTime + index * 61_000),
			);
			analyzer.recordMetric(
				"latency",
				createMetric(
					"latency",
					20 + index * 2,
					baseTime + index * 61_000 + 250,
				),
			);
		}

		const trend = analyzer.analyzeTrend([
			{ timestamp: 1, value: 10 },
			{ timestamp: 2, value: 8 },
			{ timestamp: 3, value: 6 },
		]);
		const correlation = analyzer.analyzeCorrelation(
			"queue-depth",
			"latency",
			10_000,
		);

		expect(trend.direction).toBe("decreasing");
		expect(trend.slope).toBeLessThan(0);
		expect(correlation).not.toBeNull();
		expect(correlation?.direction).toBe("positive");
		expect(correlation?.strength).toMatch(/strong|moderate|weak/);
	});
});
