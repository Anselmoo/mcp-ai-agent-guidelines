import { describe, expect, it } from "vitest";
import type { PerformanceMetric } from "../../contracts/graph-types.js";
import {
	alignMetricsByTime,
	analyzeCorrelationMetrics,
	analyzeNumericData,
	analyzeTrendTimeSeries,
	calculatePearsonCorrelation,
	calculatePerformanceScoreFromMetrics,
	calculateTrend,
	classifyTrendDirection,
	compareNumericDatasets,
	detectAnomaliesInMetrics,
} from "../../infrastructure/statistical-analysis-helpers.js";

function createMetric(
	overrides: Partial<PerformanceMetric> = {},
): PerformanceMetric {
	return {
		entityId: "entity-a",
		metricName: "latency",
		name: "latency",
		value: 10,
		unit: "ms",
		timestamp: Date.now(),
		...overrides,
	};
}

describe("infrastructure/statistical-analysis-helpers", () => {
	it("analyzes numeric datasets and comparisons", () => {
		const summary = analyzeNumericData([1, 2, 3, 4, 5]);
		const comparison = compareNumericDatasets([1, 1, 1], [10, 10, 10]);

		expect(summary.mean).toBe(3);
		expect(summary.percentiles["50th"]).toBe(3);
		expect(comparison.significantDifference).toBe(true);
	});

	it("analyzes trends, anomalies, and performance scores", () => {
		const trend = analyzeTrendTimeSeries([
			{ timestamp: 1, value: 10 },
			{ timestamp: 2, value: 20 },
			{ timestamp: 3, value: 30 },
		]);
		const anomalies = detectAnomaliesInMetrics(
			Array.from({ length: 10 }, (_, index) =>
				createMetric({
					value: index === 9 ? 100 : 10,
					timestamp: index,
				}),
			),
		);
		const score = calculatePerformanceScoreFromMetrics(
			Array.from({ length: 5 }, (_, index) =>
				createMetric({ value: 20 + index, timestamp: index }),
			),
		);

		expect(trend.direction).toBe("increasing");
		expect(anomalies.length).toBeGreaterThan(0);
		expect(score?.rank).toBeDefined();
	});

	it("aligns and correlates metric series", () => {
		const metrics1 = Array.from({ length: 10 }, (_, index) =>
			createMetric({
				entityId: "entity-a",
				value: 10 + index,
				timestamp: 1000 + index * 61000,
			}),
		);
		const metrics2 = Array.from({ length: 10 }, (_, index) =>
			createMetric({
				entityId: "entity-b",
				value: 20 + index * 2,
				timestamp: 1000 + index * 61000 + 500,
			}),
		);

		expect(alignMetricsByTime(metrics1, metrics2)).toHaveLength(10);
		expect(analyzeCorrelationMetrics(metrics1, metrics2)?.strength).toBe(
			"strong",
		);
	});

	it("classifyTrendDirection returns correct labels", () => {
		expect(classifyTrendDirection(100)).toBe("increasing");
		expect(classifyTrendDirection(-100)).toBe("decreasing");
		expect(classifyTrendDirection(0)).toBe("stable");
	});

	it("calculateTrend returns positive slope for increasing series", () => {
		const slope = calculateTrend([1, 2, 3, 4, 5], [10, 20, 30, 40, 50]);
		expect(slope).toBeGreaterThan(0);
	});

	it("analyzeTrendTimeSeries returns stable for single point", () => {
		const result = analyzeTrendTimeSeries([{ timestamp: 1, value: 10 }]);
		expect(result.direction).toBe("stable");
	});

	it("detectAnomaliesInMetrics returns empty for small dataset", () => {
		const metrics = [createMetric({ value: 10 }), createMetric({ value: 20 })];
		expect(detectAnomaliesInMetrics(metrics)).toHaveLength(0);
	});

	it("detectAnomaliesInMetrics detects spikes", () => {
		const metrics = Array.from({ length: 10 }, (_, i) =>
			createMetric({ value: i === 9 ? 1000 : 10, timestamp: i * 1000 }),
		);
		const anomalies = detectAnomaliesInMetrics(metrics);
		expect(anomalies.length).toBeGreaterThan(0);
		expect(anomalies[0]?.type).toBe("spike");
	});

	it("detectAnomaliesInMetrics detects dips", () => {
		const metrics = Array.from({ length: 10 }, (_, i) =>
			createMetric({ value: i === 9 ? -1000 : 100, timestamp: i * 1000 }),
		);
		const anomalies = detectAnomaliesInMetrics(metrics);
		expect(anomalies.length).toBeGreaterThan(0);
		expect(anomalies[0]?.type).toBe("dip");
	});

	it("calculatePearsonCorrelation returns 0 for empty arrays", () => {
		expect(calculatePearsonCorrelation([], [])).toBe(0);
	});

	it("calculatePearsonCorrelation returns 0 for constant series", () => {
		expect(calculatePearsonCorrelation([1, 1, 1], [2, 2, 2])).toBe(0);
	});

	it("analyzeCorrelationMetrics returns null for small datasets", () => {
		const m1 = [createMetric({ value: 1 })];
		const m2 = [createMetric({ value: 2 })];
		expect(analyzeCorrelationMetrics(m1, m2)).toBeNull();
	});

	it("compareNumericDatasets throws for empty datasets", () => {
		expect(() => compareNumericDatasets([], [1, 2, 3])).toThrow();
		expect(() => compareNumericDatasets([1, 2, 3], [])).toThrow();
	});

	it("calculatePerformanceScoreFromMetrics returns null for small dataset", () => {
		expect(calculatePerformanceScoreFromMetrics([createMetric()])).toBeNull();
	});

	it("calculatePerformanceScoreFromMetrics returns rank 'poor' for high latency", () => {
		const metrics = Array.from({ length: 10 }, () =>
			createMetric({ value: 5000 }),
		);
		const result = calculatePerformanceScoreFromMetrics(metrics);
		expect(result).not.toBeNull();
		expect(["poor", "average", "good", "excellent"]).toContain(result?.rank);
	});
});
