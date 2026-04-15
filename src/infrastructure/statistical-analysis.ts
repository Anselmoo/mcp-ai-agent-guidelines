/**
 * Statistical analysis and performance metrics for agent orchestration
 * Simplified implementation using basic statistical functions
 */

import type {
	AnomalyDetectionResult,
	PerformanceMetric,
	StatisticalAnalysis,
	TrendAnalysis,
} from "../contracts/graph-types.js";
import {
	analyzeCorrelationMetrics,
	analyzeNumericData,
	analyzeTrendTimeSeries,
	calculatePerformanceScoreFromMetrics,
	compareNumericDatasets,
	detectAnomaliesInMetrics,
} from "./statistical-analysis-helpers.js";

/**
 * Interface for extensible statistical analysis methods
 */
export interface IStatisticalAnalyzer {
	analyze(data: number[]): StatisticalAnalysis;
	analyzeTrends(entityId: string, timeWindowMs?: number): TrendAnalysis | null;
	detectAnomalies(
		metrics: PerformanceMetric[],
		sensitivity?: number,
	): AnomalyDetectionResult[];
	compareDatasets(
		dataset1: number[],
		dataset2: number[],
	): {
		dataset1Mean: number;
		dataset2Mean: number;
		significantDifference: boolean;
		effectSize: number;
	};
	analyzeCorrelation(
		entityId1: string,
		entityId2: string,
		timeWindowMs?: number,
	): {
		correlation: number;
		strength: "strong" | "moderate" | "weak" | "none";
		direction: "positive" | "negative";
	} | null;
}

/**
 * Statistical analyzer for workflow and agent performance
 */
export class StatisticalAnalyzer implements IStatisticalAnalyzer {
	private metrics: Map<string, PerformanceMetric[]> = new Map();

	/**
	 * Record a performance metric for analysis
	 */
	recordMetric(entityId: string, metric: PerformanceMetric): void {
		if (!this.metrics.has(entityId)) {
			this.metrics.set(entityId, []);
		}

		const entityMetrics = this.metrics.get(entityId)!;
		entityMetrics.push(metric);

		// Keep only recent metrics (last 1000 entries)
		if (entityMetrics.length > 1000) {
			entityMetrics.splice(0, entityMetrics.length - 1000);
		}
	}

	/**
	 * Analyze numerical data and return comprehensive statistics
	 */
	analyze(data: number[]): StatisticalAnalysis {
		return analyzeNumericData(data);
	}

	/**
	 * Analyze performance trends over time
	 */
	analyzeTrends(
		entityId: string,
		timeWindowMs: number = 86400000,
	): TrendAnalysis | null {
		const entityMetrics = this.metrics.get(entityId);
		if (!entityMetrics || entityMetrics.length < 2) return null;

		const cutoffTime = Date.now() - timeWindowMs;
		const recentMetrics = entityMetrics.filter(
			(m) => m.timestamp >= cutoffTime,
		);

		if (recentMetrics.length < 2) return null;

		const values = recentMetrics.map((m) => m.value);
		const statistics = analyzeNumericData(values);
		const trend = analyzeTrendTimeSeries(
			recentMetrics.map((metric) => ({
				timestamp: metric.timestamp,
				value: metric.value,
			})),
		);

		return {
			entityId,
			timeWindow: timeWindowMs,
			sampleCount: recentMetrics.length,
			mean: statistics.mean,
			standardDeviation: statistics.standardDeviation,
			min: statistics.min,
			max: statistics.max,
			trend,
			anomalies: detectAnomaliesInMetrics(recentMetrics),
		};
	}

	/**
	 * Detect performance anomalies using statistical methods
	 */
	detectAnomalies(
		metrics: PerformanceMetric[],
		sensitivity: number = 2.0,
	): AnomalyDetectionResult[] {
		return detectAnomaliesInMetrics(metrics, sensitivity);
	}

	/**
	 * Analyze single trend for time series data
	 */
	analyzeTrend(timeSeries: Array<{ timestamp: number; value: number }>): {
		direction: "increasing" | "decreasing" | "stable";
		slope: number;
		confidence: number;
	} {
		return analyzeTrendTimeSeries(timeSeries);
	}

	/**
	 * Compare two datasets statistically
	 */
	compareDatasets(
		dataset1: number[],
		dataset2: number[],
	): {
		dataset1Mean: number;
		dataset2Mean: number;
		significantDifference: boolean;
		effectSize: number;
	} {
		return compareNumericDatasets(dataset1, dataset2);
	}

	/**
	 * Compare performance between two entities
	 */
	comparePerformance(
		entityId1: string,
		entityId2: string,
		timeWindowMs: number = 86400000,
	): {
		entity1: string;
		entity2: string;
		entity1Mean: number;
		entity2Mean: number;
		significantDifference: boolean;
		pValue?: number;
		recommendation: string;
	} | null {
		const metrics1 = this.getRecentMetrics(entityId1, timeWindowMs);
		const metrics2 = this.getRecentMetrics(entityId2, timeWindowMs);

		if (metrics1.length < 5 || metrics2.length < 5) return null;

		const values1 = metrics1.map((m) => m.value);
		const values2 = metrics2.map((m) => m.value);

		const mean1 = analyzeNumericData(values1).mean;
		const mean2 = analyzeNumericData(values2).mean;

		// Simplified t-test approximation
		const diff = Math.abs(mean1 - mean2);
		const pooledStdDev = Math.sqrt(
			(analyzeNumericData(values1).standardDeviation ** 2 +
				analyzeNumericData(values2).standardDeviation ** 2) /
				2,
		);
		const effectSize = diff / pooledStdDev;

		const significantDifference = effectSize > 0.8; // Cohen's d > 0.8 = large effect

		let recommendation: string;
		if (!significantDifference) {
			recommendation = "No significant performance difference detected";
		} else if (mean1 > mean2) {
			recommendation = `${entityId1} performs ${(((mean1 - mean2) / mean2) * 100).toFixed(1)}% better than ${entityId2}`;
		} else {
			recommendation = `${entityId2} performs ${(((mean2 - mean1) / mean1) * 100).toFixed(1)}% better than ${entityId1}`;
		}

		return {
			entity1: entityId1,
			entity2: entityId2,
			entity1Mean: mean1,
			entity2Mean: mean2,
			significantDifference,
			recommendation,
		};
	}

	/**
	 * Calculate performance score for ranking agents or skills
	 */
	calculatePerformanceScore(
		entityId: string,
		timeWindowMs: number = 86400000,
	): {
		score: number;
		rank: "excellent" | "good" | "average" | "poor";
		metrics: {
			reliability: number;
			efficiency: number;
			consistency: number;
		};
	} | null {
		const metrics = this.getRecentMetrics(entityId, timeWindowMs);
		return calculatePerformanceScoreFromMetrics(metrics);
	}

	/**
	 * Analyze correlation between different metrics
	 */
	analyzeCorrelation(
		entityId1: string,
		entityId2: string,
		timeWindowMs: number = 86400000,
	): {
		correlation: number;
		strength: "strong" | "moderate" | "weak" | "none";
		direction: "positive" | "negative";
	} | null {
		const metrics1 = this.getRecentMetrics(entityId1, timeWindowMs);
		const metrics2 = this.getRecentMetrics(entityId2, timeWindowMs);

		return analyzeCorrelationMetrics(metrics1, metrics2);
	}

	/**
	 * Get summary statistics for all tracked entities
	 */
	getGlobalStatistics(): {
		totalEntities: number;
		totalMetrics: number;
		averageMetricsPerEntity: number;
		topPerformers: Array<{ entityId: string; score: number }>;
		bottomPerformers: Array<{ entityId: string; score: number }>;
	} {
		const entities = Array.from(this.metrics.keys());
		const totalMetrics = Array.from(this.metrics.values()).reduce(
			(sum, metrics) => sum + metrics.length,
			0,
		);

		const performers: Array<{ entityId: string; score: number }> = [];

		for (const entityId of entities) {
			const scoreResult = this.calculatePerformanceScore(entityId);
			if (scoreResult) {
				performers.push({ entityId, score: scoreResult.score });
			}
		}

		performers.sort((a, b) => b.score - a.score);

		return {
			totalEntities: entities.length,
			totalMetrics,
			averageMetricsPerEntity: totalMetrics / Math.max(entities.length, 1),
			topPerformers: performers.slice(0, 5),
			bottomPerformers: performers.slice(-5).reverse(),
		};
	}

	private getRecentMetrics(
		entityId: string,
		timeWindowMs: number,
	): PerformanceMetric[] {
		const entityMetrics = this.metrics.get(entityId);
		if (!entityMetrics) return [];

		const cutoffTime = Date.now() - timeWindowMs;
		return entityMetrics.filter((m) => m.timestamp >= cutoffTime);
	}
}

/**
 * Factory for creating statistical analyzers
 */
export class StatisticalAnalyzerFactory {
	static create(): StatisticalAnalyzer {
		return new StatisticalAnalyzer();
	}
}
