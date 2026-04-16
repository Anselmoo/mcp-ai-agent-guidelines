import type {
	ExecutionAnalysis,
	PerformanceMetric,
	PerformanceTrendMap,
} from "../contracts/graph-types.js";
import { DataUtilities } from "./data-utilities.js";

type StatisticalAnalyzerLike = {
	analyze: (data: number[]) => {
		mean: number;
		median: number;
		standardDeviation: number;
		min: number;
		max: number;
		percentiles: Record<string, number>;
		sampleSize: number;
	};
	analyzeTrend: (timeSeries: Array<{ timestamp: number; value: number }>) => {
		direction: "increasing" | "decreasing" | "stable";
		slope: number;
		confidence: number;
	};
	detectAnomalies: (
		metrics: PerformanceMetric[],
		sensitivity?: number,
	) => Array<{
		timestamp: number;
		value: number;
		expectedValue: number;
		deviation: number;
		severity: "low" | "medium" | "high";
		type: "spike" | "dip";
	}>;
};

export interface UnifiedSystemAnomaly {
	timestamp: Date;
	type: string;
	severity: "low" | "medium" | "high";
	description: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return value !== null && typeof value === "object";
}

function getStringField(
	record: Record<string, unknown>,
	key: string,
): string | null {
	return typeof record[key] === "string" ? record[key] : null;
}

function getExecutionEntryId(entry: unknown): string | null {
	if (typeof entry === "string") {
		return entry;
	}
	if (!isRecord(entry)) {
		return null;
	}

	return getStringField(entry, "id") ?? getStringField(entry, "name");
}

export function performExecutionAnalysis(
	statisticalAnalyzer: StatisticalAnalyzerLike,
	metrics: PerformanceMetric[],
): ExecutionAnalysis {
	const durations = metrics
		.filter((metric) => metric.name.includes("duration"))
		.map((metric) => metric.value);

	if (durations.length === 0) {
		return { success: false, analysis: "No duration metrics available" };
	}

	const analysis = statisticalAnalyzer.analyze(durations);
	const durationsAsMetrics = durations.map((duration, index) => ({
		entityId: "execution",
		metricName: "duration",
		name: "execution_duration",
		value: duration,
		unit: "ms",
		timestamp: Date.now() - (durations.length - index) * 1000,
	}));
	const anomalies = statisticalAnalyzer.detectAnomalies(durationsAsMetrics);

	return {
		success: anomalies.length === 0,
		statistical: analysis,
		anomaliesDetected: anomalies.length,
	};
}

export function extractExecutionPath(results: { data: unknown }): string[] {
	const data = results.data;
	if (Array.isArray(data)) {
		return data
			.map((entry) => getExecutionEntryId(entry))
			.filter((entry): entry is string => entry !== null);
	}
	if (isRecord(data)) {
		if (Array.isArray(data.steps)) {
			return data.steps
				.map((step) => getExecutionEntryId(step) ?? step)
				.filter((step): step is string => typeof step === "string");
		}
		return Object.keys(data).slice(0, 8);
	}
	return [];
}

export function analyzePerformanceTrends(
	statisticalAnalyzer: StatisticalAnalyzerLike,
	metrics: PerformanceMetric[],
): PerformanceTrendMap {
	const groupedMetrics = DataUtilities.groupByMultipleCriteria(metrics, [
		"name",
	]);
	const trends: PerformanceTrendMap = {};

	for (const [metricName, metricData] of Object.entries(groupedMetrics)) {
		if (metricData.length > 1) {
			const timeSeries = metricData.map((metric) => ({
				timestamp: metric.timestamp,
				value: metric.value,
			}));

			try {
				trends[metricName] = statisticalAnalyzer.analyzeTrend(timeSeries);
			} catch (_error) {
				// Skip metrics with insufficient or invalid trend data.
			}
		}
	}

	return trends;
}

export function calculateRoutingEfficiency(
	metrics: PerformanceMetric[],
): number {
	const completedWorkflowCount = metrics.filter(
		(metric) => metric.name === "workflow_total_duration",
	).length;
	if (completedWorkflowCount === 0) {
		return 0;
	}

	const errorCount = metrics
		.filter((metric) => metric.name === "workflow_error_count")
		.reduce((sum, metric) => sum + metric.value, 0);
	return Math.max(
		0,
		(completedWorkflowCount - errorCount) / completedWorkflowCount,
	);
}

export function detectSystemAnomalies(
	statisticalAnalyzer: StatisticalAnalyzerLike,
	metrics: PerformanceMetric[],
): UnifiedSystemAnomaly[] {
	const anomalies: UnifiedSystemAnomaly[] = [];
	const groupedMetrics = DataUtilities.groupByMultipleCriteria(metrics, [
		"name",
	]);

	for (const [metricName, metricData] of Object.entries(groupedMetrics)) {
		const metricsForAnomalies: PerformanceMetric[] = metricData.map(
			(metric) => ({
				entityId: metric.entityId,
				metricName: metric.name,
				name: metric.name,
				value: metric.value,
				unit: metric.unit,
				timestamp: metric.timestamp,
			}),
		);
		const anomalyResults =
			statisticalAnalyzer.detectAnomalies(metricsForAnomalies);

		for (const anomaly of anomalyResults) {
			anomalies.push({
				timestamp: new Date(anomaly.timestamp),
				type: `${metricName}_anomaly`,
				severity: anomaly.severity,
				description: `Unusual ${metricName} value: ${anomaly.value} (expected ~${anomaly.expectedValue.toFixed(2)})`,
			});
		}
	}

	return anomalies.sort(
		(a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
	);
}
