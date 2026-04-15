import { describe, expect, it } from "vitest";
import type { PerformanceMetric } from "../../contracts/graph-types.js";
import {
	alignMetricsByTime,
	analyzeCorrelationMetrics,
	analyzeNumericData,
	analyzeTrendTimeSeries,
	calculatePerformanceScoreFromMetrics,
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
});
