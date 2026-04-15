import { describe, expect, it } from "vitest";
import { ObservabilityOrchestrator } from "../../infrastructure/observability.js";

describe("observability", () => {
	it("records metrics and tracing spans when enabled", () => {
		const manager = new ObservabilityOrchestrator({
			logLevel: "info",
			enableMetrics: true,
			enableTracing: true,
		});
		const span = manager.createSpan("execute");

		const recordedMetric = {
			entityId: "execute",
			metricName: "latency",
			name: "latency",
			value: 42,
			unit: "ms",
			timestamp: Date.now(),
		};
		manager.recordMetric(recordedMetric);
		manager.finishSpan(span, { success: true });

		expect(manager.getMetrics("execute")).toHaveLength(1);
		expect(manager.getMetrics("execute")[0]).toEqual(recordedMetric);
		expect(manager.getAllMetrics().get("execute")).toEqual([recordedMetric]);
		expect(manager.getHealthMetrics()).toEqual(
			expect.objectContaining({
				totalMetrics: 1,
				totalTraces: 1,
				activeSpans: 0,
				totalLogs: 0,
			}),
		);
	});

	it("reports active spans and protects metric snapshots from external mutation", () => {
		const manager = new ObservabilityOrchestrator({
			logLevel: "info",
			enableMetrics: true,
			enableTracing: true,
		});
		const span = manager.createSpan("active");

		manager.recordMetric({
			entityId: "active",
			metricName: "latency",
			name: "latency",
			value: 10,
			unit: "ms",
			timestamp: Date.now(),
		});
		const metrics = manager.getMetrics("active");
		metrics.push({
			entityId: "active",
			metricName: "extra",
			name: "extra",
			value: 11,
			unit: "ms",
			timestamp: Date.now(),
		});

		expect(manager.getHealthMetrics()).toEqual(
			expect.objectContaining({
				activeSpans: 1,
				totalMetrics: 1,
			}),
		);
		expect(manager.getMetrics("active")).toHaveLength(1);

		manager.log("info", "tracked");
		manager.finishSpan(span);
		expect(manager.getHealthMetrics()).toEqual(
			expect.objectContaining({
				activeSpans: 0,
				totalLogs: 1,
			}),
		);
	});
});
