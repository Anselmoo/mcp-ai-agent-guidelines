import * as stats from "simple-statistics";
import { STATISTICAL_ANALYSIS_THRESHOLDS } from "../config/runtime-defaults.js";
import type {
	AnomalyDetectionResult,
	PerformanceMetric,
	StatisticalAnalysis,
} from "../contracts/graph-types.js";

export type TrendDirection = "increasing" | "decreasing" | "stable";
export type CorrelationStrength = "strong" | "moderate" | "weak" | "none";

export interface TimeSeriesPoint {
	timestamp: number;
	value: number;
}

export interface TrendSummary {
	direction: TrendDirection;
	slope: number;
	confidence: number;
}

export interface PerformanceScoreSummary {
	score: number;
	rank: "excellent" | "good" | "average" | "poor";
	metrics: {
		reliability: number;
		efficiency: number;
		consistency: number;
	};
}

export interface CorrelationSummary {
	correlation: number;
	strength: CorrelationStrength;
	direction: "positive" | "negative";
}

export function analyzeNumericData(data: number[]): StatisticalAnalysis {
	if (data.length === 0) {
		throw new Error("Cannot analyze empty dataset");
	}

	const mean = stats.mean(data);
	const median = stats.median(data);
	const standardDeviation = stats.standardDeviation(data);
	const min = stats.min(data);
	const max = stats.max(data);

	return {
		mean,
		median,
		standardDeviation,
		min,
		max,
		percentiles: {
			"25th": stats.quantile(data, 0.25),
			"50th": median,
			"75th": stats.quantile(data, 0.75),
			"90th": stats.quantile(data, 0.9),
			"95th": stats.quantile(data, 0.95),
			"99th": stats.quantile(data, 0.99),
		},
		sampleSize: data.length,
	};
}

export function calculateTrend(times: number[], values: number[]): number {
	if (times.length !== values.length || times.length < 2) {
		return 0;
	}

	const n = times.length;
	const sumX = times.reduce((sum, x) => sum + x, 0);
	const sumY = values.reduce((sum, y) => sum + y, 0);
	const sumXY = times.reduce((sum, x, index) => sum + x * values[index], 0);
	const sumX2 = times.reduce((sum, x) => sum + x * x, 0);

	const denominator = n * sumX2 - sumX * sumX;
	if (denominator === 0) {
		return 0;
	}

	return (n * sumXY - sumX * sumY) / denominator;
}

export function classifyTrendDirection(slope: number): TrendDirection {
	return slope > STATISTICAL_ANALYSIS_THRESHOLDS.trendStableSlope
		? "increasing"
		: slope < -STATISTICAL_ANALYSIS_THRESHOLDS.trendStableSlope
			? "decreasing"
			: "stable";
}

export function analyzeTrendTimeSeries(
	timeSeries: TimeSeriesPoint[],
): TrendSummary {
	if (timeSeries.length < 2) {
		return { direction: "stable", slope: 0, confidence: 0 };
	}

	const slope = calculateTrend(
		timeSeries.map((point) => point.timestamp),
		timeSeries.map((point) => point.value),
	);

	return {
		direction: classifyTrendDirection(slope),
		slope,
		confidence: STATISTICAL_ANALYSIS_THRESHOLDS.trendConfidence,
	};
}

export function detectAnomaliesInMetrics(
	metrics: PerformanceMetric[],
	sensitivity: number = STATISTICAL_ANALYSIS_THRESHOLDS.anomalyDefaultSensitivity,
): AnomalyDetectionResult[] {
	if (metrics.length < STATISTICAL_ANALYSIS_THRESHOLDS.anomalyMinSampleSize) {
		return [];
	}

	const values = metrics.map((metric) => metric.value);
	const mean = stats.mean(values);
	const stdDev = stats.standardDeviation(values);
	const anomalies: AnomalyDetectionResult[] = [];

	for (const metric of metrics) {
		const zScore = Math.abs((metric.value - mean) / stdDev);
		if (zScore > sensitivity) {
			anomalies.push({
				timestamp: metric.timestamp,
				value: metric.value,
				expectedValue: mean,
				deviation: metric.value - mean,
				severity:
					zScore > STATISTICAL_ANALYSIS_THRESHOLDS.anomalyHighZScore
						? "high"
						: zScore > STATISTICAL_ANALYSIS_THRESHOLDS.anomalyMediumZScore
							? "medium"
							: "low",
				type: metric.value > mean ? "spike" : "dip",
			});
		}
	}

	return anomalies;
}

export function compareNumericDatasets(
	dataset1: number[],
	dataset2: number[],
): {
	dataset1Mean: number;
	dataset2Mean: number;
	significantDifference: boolean;
	effectSize: number;
} {
	if (dataset1.length === 0 || dataset2.length === 0) {
		throw new Error("Cannot compare empty datasets");
	}

	const mean1 = stats.mean(dataset1);
	const mean2 = stats.mean(dataset2);
	const pooledStdDev = Math.sqrt(
		((dataset1.length - 1) * stats.variance(dataset1) +
			(dataset2.length - 1) * stats.variance(dataset2)) /
			(dataset1.length + dataset2.length - 2),
	);
	const effectSize = Math.abs(mean1 - mean2) / pooledStdDev;

	return {
		dataset1Mean: mean1,
		dataset2Mean: mean2,
		significantDifference:
			effectSize > STATISTICAL_ANALYSIS_THRESHOLDS.effectSizeSignificant,
		effectSize,
	};
}

export function calculatePerformanceScoreFromMetrics(
	metrics: PerformanceMetric[],
): PerformanceScoreSummary | null {
	if (
		metrics.length < STATISTICAL_ANALYSIS_THRESHOLDS.performanceMinSampleSize
	) {
		return null;
	}

	const values = metrics.map((metric) => metric.value);
	const mean = stats.mean(values);
	const stdDev = stats.standardDeviation(values);

	const reliability = Math.min(
		1,
		mean / STATISTICAL_ANALYSIS_THRESHOLDS.reliabilityScaleMax,
	);
	const efficiency = Math.max(
		0,
		Math.min(
			1,
			(STATISTICAL_ANALYSIS_THRESHOLDS.efficiencyCeiling - mean) /
				STATISTICAL_ANALYSIS_THRESHOLDS.efficiencyCeiling,
		),
	);
	const consistency = Math.max(0, 1 - stdDev / mean);
	const score =
		(reliability * STATISTICAL_ANALYSIS_THRESHOLDS.reliabilityWeight +
			efficiency * STATISTICAL_ANALYSIS_THRESHOLDS.efficiencyWeight +
			consistency * STATISTICAL_ANALYSIS_THRESHOLDS.consistencyWeight) *
		100;

	let rank: "excellent" | "good" | "average" | "poor";
	if (score >= STATISTICAL_ANALYSIS_THRESHOLDS.excellentScore) {
		rank = "excellent";
	} else if (score >= STATISTICAL_ANALYSIS_THRESHOLDS.goodScore) {
		rank = "good";
	} else if (score >= STATISTICAL_ANALYSIS_THRESHOLDS.averageScore) {
		rank = "average";
	} else {
		rank = "poor";
	}

	return {
		score,
		rank,
		metrics: {
			reliability,
			efficiency,
			consistency,
		},
	};
}

export function alignMetricsByTime(
	metrics1: PerformanceMetric[],
	metrics2: PerformanceMetric[],
): Array<{ timestamp: number; value1: number; value2: number }> {
	const aligned: Array<{ timestamp: number; value1: number; value2: number }> =
		[];

	for (const metric of metrics1) {
		const closest = metrics2.find(
			(otherMetric) =>
				Math.abs(otherMetric.timestamp - metric.timestamp) <
				STATISTICAL_ANALYSIS_THRESHOLDS.alignmentWindowMs,
		);
		if (closest) {
			aligned.push({
				timestamp: metric.timestamp,
				value1: metric.value,
				value2: closest.value,
			});
		}
	}

	return aligned;
}

export function calculatePearsonCorrelation(x: number[], y: number[]): number {
	if (x.length !== y.length || x.length === 0) {
		return 0;
	}

	const n = x.length;
	const sumX = x.reduce((sum, value) => sum + value, 0);
	const sumY = y.reduce((sum, value) => sum + value, 0);
	const sumXY = x.reduce((sum, value, index) => sum + value * y[index], 0);
	const sumX2 = x.reduce((sum, value) => sum + value * value, 0);
	const sumY2 = y.reduce((sum, value) => sum + value * value, 0);

	const numerator = n * sumXY - sumX * sumY;
	const denominator = Math.sqrt(
		(n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
	);

	return denominator === 0 ? 0 : numerator / denominator;
}

export function analyzeCorrelationMetrics(
	metrics1: PerformanceMetric[],
	metrics2: PerformanceMetric[],
): CorrelationSummary | null {
	if (
		metrics1.length <
			STATISTICAL_ANALYSIS_THRESHOLDS.correlationMinSampleSize ||
		metrics2.length < STATISTICAL_ANALYSIS_THRESHOLDS.correlationMinSampleSize
	) {
		return null;
	}

	const alignedMetrics = alignMetricsByTime(metrics1, metrics2);
	if (
		alignedMetrics.length <
		STATISTICAL_ANALYSIS_THRESHOLDS.correlationAlignedMinSize
	) {
		return null;
	}

	const correlation = calculatePearsonCorrelation(
		alignedMetrics.map((metric) => metric.value1),
		alignedMetrics.map((metric) => metric.value2),
	);
	const absCorr = Math.abs(correlation);

	let strength: CorrelationStrength;
	if (absCorr >= STATISTICAL_ANALYSIS_THRESHOLDS.correlationStrong) {
		strength = "strong";
	} else if (absCorr >= STATISTICAL_ANALYSIS_THRESHOLDS.correlationModerate) {
		strength = "moderate";
	} else if (absCorr >= STATISTICAL_ANALYSIS_THRESHOLDS.correlationWeak) {
		strength = "weak";
	} else {
		strength = "none";
	}

	return {
		correlation,
		strength,
		direction: correlation >= 0 ? "positive" : "negative",
	};
}
