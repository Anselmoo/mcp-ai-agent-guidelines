import { describe, expect, it } from "vitest";
import type { PerformanceMetric } from "../../contracts/graph-types.js";
import {
	analyzeCorrelationMetrics,
	analyzeNumericData,
	analyzeTrendTimeSeries,
	calculatePerformanceScoreFromMetrics,
	calculateTrend,
	compareNumericDatasets,
	detectAnomaliesInMetrics,
} from "../../infrastructure/statistical-analysis-helpers.js";

function makeMetric(value: number, timestamp = Date.now()): PerformanceMetric {
	return {
		entityId: "e",
		metricName: "m",
		name: "m",
		value,
		unit: "ms",
		timestamp,
	};
}

function makeMetrics(values: number[], baseTs = 1000): PerformanceMetric[] {
	return values.map((v, i) => makeMetric(v, baseTs + i));
}

describe("statistical-analysis-helpers-extra", () => {
	// -------------------------------------------------------------------------
	// analyzeNumericData – empty array (line 40)
	// -------------------------------------------------------------------------
	it("analyzeNumericData throws for an empty dataset", () => {
		expect(() => analyzeNumericData([])).toThrow(
			"Cannot analyze empty dataset",
		);
	});

	it("analyzeNumericData succeeds for a single-element array", () => {
		const result = analyzeNumericData([7]);
		expect(result.mean).toBe(7);
		expect(result.min).toBe(7);
		expect(result.max).toBe(7);
	});

	// -------------------------------------------------------------------------
	// calculateTrend – length mismatch (line 69)
	// -------------------------------------------------------------------------
	it("calculateTrend returns 0 when times and values lengths differ", () => {
		expect(calculateTrend([1, 2, 3], [10, 20])).toBe(0);
	});

	it("calculateTrend returns 0 when fewer than 2 time points", () => {
		expect(calculateTrend([1], [10])).toBe(0);
		expect(calculateTrend([], [])).toBe(0);
	});

	// -------------------------------------------------------------------------
	// calculateTrend – denominator === 0 (line 80)
	// -------------------------------------------------------------------------
	it("calculateTrend returns 0 when all timestamps are identical (denominator = 0)", () => {
		// n * sumX2 - sumX * sumX = n*x^2*n - (x*n)^2 = n^2*x^2 - n^2*x^2 = 0
		expect(calculateTrend([5, 5, 5], [10, 20, 30])).toBe(0);
	});

	// -------------------------------------------------------------------------
	// analyzeTrendTimeSeries – fewer than 2 points (line 136)
	// -------------------------------------------------------------------------
	it("analyzeTrendTimeSeries returns stable/0/0 for a single-point series", () => {
		const result = analyzeTrendTimeSeries([{ timestamp: 1, value: 10 }]);
		expect(result).toEqual({ direction: "stable", slope: 0, confidence: 0 });
	});

	it("analyzeTrendTimeSeries returns stable/0/0 for an empty series", () => {
		const result = analyzeTrendTimeSeries([]);
		expect(result).toEqual({ direction: "stable", slope: 0, confidence: 0 });
	});

	// -------------------------------------------------------------------------
	// analyzeTrendTimeSeries – slope exactly 0 → "stable" (line 138)
	// -------------------------------------------------------------------------
	it("analyzeTrendTimeSeries classifies flat series as stable", () => {
		const result = analyzeTrendTimeSeries([
			{ timestamp: 1, value: 10 },
			{ timestamp: 2, value: 10 },
			{ timestamp: 3, value: 10 },
		]);
		expect(result.direction).toBe("stable");
		expect(result.slope).toBe(0);
	});

	// -------------------------------------------------------------------------
	// detectAnomaliesInMetrics – "medium" severity (line 213)
	// -------------------------------------------------------------------------
	it("detectAnomaliesInMetrics classifies z-score between 2.5 and 3 as medium severity", () => {
		// Dataset: 9 values at ~10, one moderate outlier that yields z ~2.8
		// [8, 9, 10, 10, 10, 10, 11, 12, 13, 40] → z(40) ≈ 2.81 (sample stdDev)
		const metrics = makeMetrics([8, 9, 10, 10, 10, 10, 11, 12, 13, 40]);
		const anomalies = detectAnomaliesInMetrics(metrics);

		const mediumAnomalies = anomalies.filter((a) => a.severity === "medium");
		expect(mediumAnomalies.length).toBeGreaterThanOrEqual(1);
		expect(mediumAnomalies[0]?.type).toBe("spike"); // 40 > mean
	});

	// -------------------------------------------------------------------------
	// detectAnomaliesInMetrics – "dip" type (line 217)
	// -------------------------------------------------------------------------
	it("detectAnomaliesInMetrics classifies value below mean as dip", () => {
		// [2, 10, 10, 10, 10, 10, 10, 10, 10, 10] → z(2) ≈ 2.85, type = dip
		const metrics = makeMetrics([2, 10, 10, 10, 10, 10, 10, 10, 10, 10]);
		const anomalies = detectAnomaliesInMetrics(metrics);

		const dips = anomalies.filter((a) => a.type === "dip");
		expect(dips.length).toBeGreaterThanOrEqual(1);
	});

	it("detectAnomaliesInMetrics returns empty array for fewer than minimum sample size", () => {
		// anomalyMinSampleSize = 10; pass only 5
		const metrics = makeMetrics([1, 2, 3, 4, 5]);
		expect(detectAnomaliesInMetrics(metrics)).toEqual([]);
	});

	// -------------------------------------------------------------------------
	// compareNumericDatasets – empty array (line 247)
	// -------------------------------------------------------------------------
	it("compareNumericDatasets throws when dataset1 is empty", () => {
		expect(() => compareNumericDatasets([], [1, 2, 3])).toThrow(
			"Cannot compare empty datasets",
		);
	});

	it("compareNumericDatasets throws when dataset2 is empty", () => {
		expect(() => compareNumericDatasets([1, 2, 3], [])).toThrow(
			"Cannot compare empty datasets",
		);
	});

	// -------------------------------------------------------------------------
	// calculatePerformanceScoreFromMetrics – fewer than min sample size (line 292)
	// -------------------------------------------------------------------------
	it("calculatePerformanceScoreFromMetrics returns null when fewer than 5 metrics", () => {
		// performanceMinSampleSize = 5
		expect(
			calculatePerformanceScoreFromMetrics(makeMetrics([10, 20, 30, 40])),
		).toBeNull();
		expect(calculatePerformanceScoreFromMetrics([])).toBeNull();
	});

	// -------------------------------------------------------------------------
	// calculatePerformanceScoreFromMetrics – "good" rank (score 70–84)  (line 306)
	// -------------------------------------------------------------------------
	it("calculatePerformanceScoreFromMetrics returns 'good' rank for appropriate metrics", () => {
		// mean≈100, stdDev≈3.16 → score ≈ 79.4 → "good"
		const metrics = makeMetrics([95, 100, 100, 100, 105]);
		const result = calculatePerformanceScoreFromMetrics(metrics);
		expect(result).not.toBeNull();
		expect(result?.rank).toBe("good");
	});

	// -------------------------------------------------------------------------
	// calculatePerformanceScoreFromMetrics – "average" rank (score 50–69)  (line 308)
	// -------------------------------------------------------------------------
	it("calculatePerformanceScoreFromMetrics returns 'average' rank for moderate spread", () => {
		// mean=50, stdDev≈14.14 → score ≈ 64.3 → "average"
		const metrics = makeMetrics([30, 40, 50, 60, 70]);
		const result = calculatePerformanceScoreFromMetrics(metrics);
		expect(result).not.toBeNull();
		expect(result?.rank).toBe("average");
	});

	// -------------------------------------------------------------------------
	// calculatePerformanceScoreFromMetrics – "poor" rank (score < 50)  (line 310)
	// -------------------------------------------------------------------------
	it("calculatePerformanceScoreFromMetrics returns 'poor' rank for high variance", () => {
		// mean≈20.8, high stdDev → consistency≈0 → score ≈ 44.2 → "poor"
		const metrics = makeMetrics([1, 1, 1, 1, 100]);
		const result = calculatePerformanceScoreFromMetrics(metrics);
		expect(result).not.toBeNull();
		expect(result?.rank).toBe("poor");
	});

	// -------------------------------------------------------------------------
	// analyzeCorrelationMetrics – empty/tiny metrics → null (line 319)
	// -------------------------------------------------------------------------
	it("analyzeCorrelationMetrics returns null when metrics1 has fewer than minimum", () => {
		// correlationMinSampleSize = 10
		const small = makeMetrics([1, 2, 3]);
		const large = makeMetrics(Array.from({ length: 15 }, (_, i) => i + 1));
		expect(analyzeCorrelationMetrics(small, large)).toBeNull();
	});

	it("analyzeCorrelationMetrics returns null when metrics2 has fewer than minimum", () => {
		const large = makeMetrics(Array.from({ length: 15 }, (_, i) => i + 1));
		const small = makeMetrics([1, 2, 3]);
		expect(analyzeCorrelationMetrics(large, small)).toBeNull();
	});

	it("analyzeCorrelationMetrics returns null for both empty arrays", () => {
		expect(analyzeCorrelationMetrics([], [])).toBeNull();
	});

	// -------------------------------------------------------------------------
	// analyzeCorrelationMetrics – aligned minimum not met → null
	// -------------------------------------------------------------------------
	it("analyzeCorrelationMetrics returns null when aligned points < minimum", () => {
		// Use very different timestamps so none align (window = 60000 ms)
		const m1 = Array.from({ length: 10 }, (_, i) =>
			makeMetric(i + 1, i * 1_000_000),
		);
		const m2 = Array.from({ length: 10 }, (_, i) =>
			makeMetric(i + 1, i * 1_000_000 + 500_000),
		);
		// 500k ms gap > 60k ms window → no alignment
		expect(analyzeCorrelationMetrics(m1, m2)).toBeNull();
	});

	// -------------------------------------------------------------------------
	// analyzeCorrelationMetrics – full positive correlation
	// -------------------------------------------------------------------------
	it("analyzeCorrelationMetrics returns strong positive correlation for aligned identical series", () => {
		// Use 120_000 ms spacing so each m1[i] only aligns with its matching m2[i]
		// (alignmentWindowMs = 60_000, so gap of 120_000 > window → no cross-match).
		const spacing = 120_000;
		const m1 = Array.from({ length: 15 }, (_, i) =>
			makeMetric((i + 1) * 10, i * spacing),
		);
		const m2 = Array.from({ length: 15 }, (_, i) =>
			makeMetric((i + 1) * 10, i * spacing),
		);
		const result = analyzeCorrelationMetrics(m1, m2);
		expect(result).not.toBeNull();
		expect(result?.strength).toBe("strong");
		expect(result?.direction).toBe("positive");
	});
});
