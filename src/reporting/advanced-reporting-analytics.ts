import type { PerformanceMetric, SkillNode } from "../contracts/graph-types.js";

export type ReportingTrendDirection =
	| "increasing"
	| "decreasing"
	| "stable"
	| "insufficient-data";

export interface PerformanceOverviewMetrics {
	totalMetrics: number;
	avgLatency: number;
	errorRate: number;
	timeRange: {
		start: number | null;
		end: number | null;
	};
}

export interface PerformanceTrendSummary {
	latencyTrend: ReportingTrendDirection;
	errorTrend: ReportingTrendDirection;
	throughputTrend: ReportingTrendDirection;
}

export interface PerformanceAnomalySummary {
	type: string;
	count: number;
	severity: "low" | "medium" | "high";
	description: string;
}

export interface PerformanceMetricsAnalysis {
	overview: PerformanceOverviewMetrics;
	skillAnalytics: Array<{
		skillId: string;
		avgLatency: number;
		errorRate: number;
		executionCount: number;
	}>;
	trends: PerformanceTrendSummary;
	anomalies: PerformanceAnomalySummary[];
}

export function groupMetricsByEntity(
	metrics: PerformanceMetric[],
): Record<string, PerformanceMetric[]> {
	const groups: Record<string, PerformanceMetric[]> = {};
	for (const metric of metrics) {
		if (!groups[metric.entityId]) {
			groups[metric.entityId] = [];
		}
		groups[metric.entityId].push(metric);
	}
	return groups;
}

export function calculateAverageLatency(metrics: PerformanceMetric[]): number {
	if (metrics.length === 0) {
		return 0;
	}

	const total = metrics.reduce((sum, metric) => sum + metric.value, 0);
	return total / metrics.length;
}

export function calculateErrorRate(metrics: PerformanceMetric[]): number {
	if (metrics.length === 0) {
		return 0;
	}

	const errorCount = metrics.filter((metric) =>
		metric.name.includes("error"),
	).length;
	return errorCount / metrics.length;
}

export function calculateSuccessRate(metrics: PerformanceMetric[]): number {
	return 1 - calculateErrorRate(metrics);
}

export function calculateOverviewMetrics(
	metrics: PerformanceMetric[],
): PerformanceOverviewMetrics {
	const timestamps = metrics.map((metric) => metric.timestamp);

	return {
		totalMetrics: metrics.length,
		avgLatency: calculateAverageLatency(
			metrics.filter((metric) => metric.name.includes("latency")),
		),
		errorRate: calculateErrorRate(metrics),
		timeRange: {
			start: timestamps.length > 0 ? Math.min(...timestamps) : null,
			end: timestamps.length > 0 ? Math.max(...timestamps) : null,
		},
	};
}

export function calculateThroughput(metrics: PerformanceMetric[]): number {
	if (metrics.length === 0) {
		return 0;
	}

	const timeSpan =
		Math.max(...metrics.map((metric) => metric.timestamp)) -
		Math.min(...metrics.map((metric) => metric.timestamp));
	return timeSpan > 0 ? metrics.length / (timeSpan / 1000) : metrics.length;
}

export function compareTrend(
	previous: number,
	current: number,
	invertGoodDirection = false,
): ReportingTrendDirection {
	if (!Number.isFinite(previous) || !Number.isFinite(current)) {
		return "insufficient-data";
	}

	if (previous === 0 && current === 0) {
		return "stable";
	}

	const delta = current - previous;
	const baseline = Math.max(Math.abs(previous), 1);
	if (Math.abs(delta) / baseline < 0.05) {
		return "stable";
	}

	if (invertGoodDirection) {
		return delta < 0 ? "decreasing" : "increasing";
	}

	return delta > 0 ? "increasing" : "decreasing";
}

export function calculatePerformanceTrends(
	rawMetrics: PerformanceMetric[],
): PerformanceTrendSummary {
	const metrics = rawMetrics.filter((metric) => Number.isFinite(metric.value));
	if (metrics.length < 2) {
		return {
			latencyTrend: "insufficient-data",
			errorTrend: "insufficient-data",
			throughputTrend: "insufficient-data",
		};
	}

	const midpoint = Math.max(1, Math.floor(metrics.length / 2));
	const firstHalf = metrics.slice(0, midpoint);
	const secondHalf = metrics.slice(midpoint);
	const latencyFirst = calculateAverageLatency(
		firstHalf.filter((metric) => metric.name.includes("latency")),
	);
	const latencySecond = calculateAverageLatency(
		secondHalf.filter((metric) => metric.name.includes("latency")),
	);
	const errorFirst = calculateErrorRate(firstHalf);
	const errorSecond = calculateErrorRate(secondHalf);
	const throughputFirst = calculateThroughput(firstHalf);
	const throughputSecond = calculateThroughput(secondHalf);

	return {
		latencyTrend: compareTrend(latencyFirst, latencySecond, true),
		errorTrend: compareTrend(errorFirst, errorSecond, true),
		throughputTrend: compareTrend(throughputFirst, throughputSecond),
	};
}

export function detectPerformanceAnomalies(
	metrics: PerformanceMetric[],
): PerformanceAnomalySummary[] {
	const anomalies: PerformanceAnomalySummary[] = [];

	const avgLatency = calculateAverageLatency(
		metrics.filter((metric) => metric.name.includes("latency")),
	);
	const highLatencyMetrics = metrics.filter(
		(metric) => metric.value > avgLatency * 2,
	);

	if (highLatencyMetrics.length > 0) {
		anomalies.push({
			type: "high_latency",
			count: highLatencyMetrics.length,
			severity: "medium",
			description: `${highLatencyMetrics.length} metrics showed latency 2x above average`,
		});
	}

	return anomalies;
}

export function calculateUtilizationTrend(
	metrics: PerformanceMetric[],
): Array<{ timestamp: Date; value: number }> {
	const timeBuckets: Record<string, number> = {};

	for (const metric of metrics) {
		const hour = new Date(metric.timestamp).toISOString().slice(0, 13);
		timeBuckets[hour] = (timeBuckets[hour] || 0) + 1;
	}

	return Object.entries(timeBuckets).map(([timestamp, count]) => ({
		timestamp: new Date(timestamp),
		value: count,
	}));
}

export function generateSkillRecommendations(
	metrics: PerformanceMetric[],
): string[] {
	const recommendations: string[] = [];

	const errorRate = calculateErrorRate(metrics);
	if (errorRate > 0.1) {
		recommendations.push(
			`High error rate (${(errorRate * 100).toFixed(1)}%) - consider reviewing implementation`,
		);
	}

	if (metrics.length < 5) {
		recommendations.push(
			"Low utilization - consider promoting this skill or removing if unused",
		);
	}

	const avgLatency = calculateAverageLatency(metrics);
	if (avgLatency > 1000) {
		recommendations.push(
			"High latency detected - consider performance optimization",
		);
	}

	return recommendations;
}

export function analyzePerformanceMetrics(
	metrics: PerformanceMetric[],
): PerformanceMetricsAnalysis {
	const groupedBySkill = groupMetricsByEntity(metrics);
	const overview = calculateOverviewMetrics(metrics);
	const skillAnalytics = Object.entries(groupedBySkill).map(
		([skillId, skillMetrics]) => ({
			skillId,
			avgLatency: calculateAverageLatency(skillMetrics),
			errorRate: calculateErrorRate(skillMetrics),
			executionCount: skillMetrics.length,
		}),
	);

	return {
		overview,
		skillAnalytics,
		trends: calculatePerformanceTrends(metrics),
		anomalies: detectPerformanceAnomalies(metrics),
	};
}

export function analyzeSkillPerformance(
	skill: SkillNode,
	metrics: PerformanceMetric[],
): {
	skillId: string;
	executionCount: number;
	averageLatency: number;
	successRate: number;
	errorTypes: Record<string, number>;
	utilizationTrend: Array<{ timestamp: Date; value: number }>;
	dependencies: string[];
	recommendations: string[];
} {
	const latencyMetrics = metrics.filter(
		(metric) =>
			metric.name.includes("latency") || metric.name.includes("duration"),
	);
	const errorMetrics = metrics.filter((metric) =>
		metric.name.includes("error"),
	);
	const errorTypes: Record<string, number> = {};

	for (const metric of errorMetrics) {
		const errorType =
			typeof metric.metadata?.errorType === "string"
				? metric.metadata.errorType
				: "unknown";
		errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
	}

	return {
		skillId: skill.id,
		executionCount: metrics.length,
		averageLatency: calculateAverageLatency(latencyMetrics),
		successRate: calculateSuccessRate(metrics),
		errorTypes,
		utilizationTrend: calculateUtilizationTrend(metrics),
		dependencies: skill.dependencies || [],
		recommendations: generateSkillRecommendations(metrics),
	};
}

export function calculateAverageWorkflowDuration(
	metrics: PerformanceMetric[],
): number {
	const workflowMetrics = metrics.filter(
		(metric) =>
			metric.name.includes("workflow") && metric.name.includes("duration"),
	);
	return calculateAverageLatency(workflowMetrics);
}
