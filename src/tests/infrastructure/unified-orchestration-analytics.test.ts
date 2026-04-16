import { describe, expect, it, vi } from "vitest";
import type { PerformanceMetric } from "../../contracts/graph-types.js";
import {
	analyzePerformanceTrends,
	calculateRoutingEfficiency,
	detectSystemAnomalies,
	extractExecutionPath,
	performExecutionAnalysis,
} from "../../infrastructure/unified-orchestration-analytics.js";

describe("unified-orchestration-analytics", () => {
	it("extracts execution paths from arrays, step records, and object keys", () => {
		expect(
			extractExecutionPath({
				data: [{ id: "step-a" }, { name: "step-b" }, "step-c", 42],
			}),
		).toEqual(["step-a", "step-b", "step-c"]);

		expect(
			extractExecutionPath({
				data: {
					steps: [{ id: "prepare" }, "execute", { name: "finalize" }],
				},
			}),
		).toEqual(["prepare", "execute", "finalize"]);

		expect(
			extractExecutionPath({
				data: { alpha: { ok: true }, beta: { ok: true } },
			}),
		).toEqual(["alpha", "beta"]);
	});

	it("analyzes execution metrics and calculates routing efficiency", () => {
		const analyzer = {
			analyze: vi.fn().mockReturnValue({
				mean: 150,
				median: 150,
				standardDeviation: 50,
				min: 100,
				max: 200,
				percentiles: {},
				sampleSize: 2,
			}),
			analyzeTrend: vi.fn(),
			detectAnomalies: vi.fn().mockReturnValueOnce([]),
		};
		const metrics: PerformanceMetric[] = [
			{
				entityId: "wf-1",
				metricName: "workflow_total_duration",
				name: "workflow_total_duration",
				value: 100,
				unit: "ms",
				timestamp: 1,
			},
			{
				entityId: "wf-2",
				metricName: "workflow_total_duration",
				name: "workflow_total_duration",
				value: 200,
				unit: "ms",
				timestamp: 2,
			},
			{
				entityId: "wf-2",
				metricName: "workflow_error_count",
				name: "workflow_error_count",
				value: 1,
				unit: "count",
				timestamp: 3,
			},
		];

		expect(performExecutionAnalysis(analyzer, metrics)).toEqual(
			expect.objectContaining({
				success: true,
				anomaliesDetected: 0,
				statistical: expect.objectContaining({ mean: 150 }),
			}),
		);
		expect(calculateRoutingEfficiency(metrics)).toBe(0.5);
	});

	it("aggregates trends and anomalies by metric name", () => {
		const analyzer = {
			analyze: vi.fn(),
			analyzeTrend: vi.fn().mockReturnValue({
				direction: "increasing",
				slope: 0.5,
				confidence: 0.8,
			}),
			detectAnomalies: vi
				.fn()
				.mockReturnValueOnce([
					{
						timestamp: 3,
						value: 20,
						expectedValue: 12,
						deviation: 8,
						severity: "medium",
						type: "spike",
					},
				])
				.mockReturnValueOnce([]),
		};
		const metrics: PerformanceMetric[] = [
			{
				entityId: "wf-1",
				metricName: "workflow_total_duration",
				name: "workflow_total_duration",
				value: 10,
				unit: "ms",
				timestamp: 1,
			},
			{
				entityId: "wf-1",
				metricName: "workflow_total_duration",
				name: "workflow_total_duration",
				value: 20,
				unit: "ms",
				timestamp: 3,
			},
			{
				entityId: "wf-1",
				metricName: "workflow_error_count",
				name: "workflow_error_count",
				value: 0,
				unit: "count",
				timestamp: 2,
			},
			{
				entityId: "wf-1",
				metricName: "workflow_error_count",
				name: "workflow_error_count",
				value: 1,
				unit: "count",
				timestamp: 4,
			},
		];

		expect(analyzePerformanceTrends(analyzer, metrics)).toEqual({
			workflow_error_count: {
				direction: "increasing",
				slope: 0.5,
				confidence: 0.8,
			},
			workflow_total_duration: {
				direction: "increasing",
				slope: 0.5,
				confidence: 0.8,
			},
		});
		expect(detectSystemAnomalies(analyzer, metrics)).toEqual([
			{
				timestamp: new Date(3),
				type: "workflow_total_duration_anomaly",
				severity: "medium",
				description:
					"Unusual workflow_total_duration value: 20 (expected ~12.00)",
			},
		]);
	});
});
