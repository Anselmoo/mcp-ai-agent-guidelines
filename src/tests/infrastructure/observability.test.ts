import { afterEach, describe, expect, it, vi } from "vitest";
import type { TraceSpan } from "../../contracts/graph-types.js";
import {
	createOperationalLogger,
	ObservabilityManagerFactory,
	ObservabilityOrchestrator,
	ObservabilityOrchestratorFactory,
} from "../../infrastructure/observability.js";

interface ObservabilityInternals {
	logEntries: Array<{ message: string }>;
	traces: Map<
		string,
		{
			spans: TraceSpan[];
			endTime?: number;
			totalDuration?: number;
		}
	>;
}

function createMetric(entityId: string, value: number, timestamp = Date.now()) {
	return {
		entityId,
		metricName: "execution_time",
		name: "execution_time",
		value,
		unit: "milliseconds",
		timestamp,
	};
}

function getInternals(
	manager: ObservabilityOrchestrator,
): ObservabilityInternals {
	return manager as unknown as ObservabilityInternals;
}

describe("observability", () => {
	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it("records metrics and tracing spans when enabled", () => {
		const manager = new ObservabilityOrchestrator({
			logLevel: "info",
			enableMetrics: true,
			enableTracing: true,
		});
		const span = manager.createSpan("execute");
		const recordedMetric = createMetric("execute", 42);

		manager.recordMetric(recordedMetric);
		manager.finishSpan(span, { success: true });

		expect(manager.getMetrics("execute")).toEqual([recordedMetric]);
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

	it("trims logs and metrics to the last 1000 entries", () => {
		const manager = new ObservabilityOrchestrator({
			logLevel: "info",
			enableMetrics: true,
			enableTracing: false,
		});

		for (let index = 0; index < 1002; index += 1) {
			manager.log("info", `message-${index}`);
			manager.recordMetric(createMetric("entity", index, index));
		}

		const metrics = manager.getMetrics("entity");
		const { logEntries } = getInternals(manager);

		expect(metrics).toHaveLength(1000);
		expect(metrics[0]?.value).toBe(2);
		expect(metrics.at(-1)?.value).toBe(1001);
		expect(logEntries).toHaveLength(1000);
		expect(logEntries[0]?.message).toBe("message-2");
		expect(logEntries.at(-1)?.message).toBe("message-1001");
		expect(manager.getHealthMetrics()).toEqual(
			expect.objectContaining({
				totalMetrics: 1000,
				totalLogs: 1000,
			}),
		);
	});

	it("does nothing when metrics are disabled", () => {
		const manager = new ObservabilityOrchestrator({
			logLevel: "info",
			enableMetrics: false,
			enableTracing: true,
		});
		const infoSpy = vi.spyOn(manager.getLogger(), "info");

		manager.recordMetric(createMetric("disabled", 99));

		expect(infoSpy).not.toHaveBeenCalled();
		expect(manager.getMetrics("disabled")).toEqual([]);
		expect(manager.getAllMetrics().size).toBe(0);
		expect(manager.getHealthMetrics()).toEqual(
			expect.objectContaining({
				totalMetrics: 0,
			}),
		);
	});

	it("creates child loggers from the shared logger instance", () => {
		const manager = new ObservabilityOrchestrator({
			logLevel: "debug",
			enableMetrics: true,
			enableTracing: true,
		});
		const logger = manager.getLogger();
		const childSpy = vi.spyOn(logger, "child");

		const childLogger = manager.createChildLogger({ requestId: "req-123" });

		expect(manager.getLogger()).toBe(logger);
		expect(childSpy).toHaveBeenCalledWith({ requestId: "req-123" });
		expect(childLogger).not.toBe(logger);
		expect(typeof childLogger.info).toBe("function");
	});

	it("finishes spans with tags and stores trace data when tracing is enabled", () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));

		const manager = new ObservabilityOrchestrator({
			logLevel: "debug",
			enableMetrics: true,
			enableTracing: true,
		});
		const span = manager.createSpan("tagged-operation");

		vi.setSystemTime(new Date("2024-01-01T00:00:05.000Z"));
		manager.finishSpan(span, { success: true, retries: 1 });

		const trace = getInternals(manager).traces.get(span.traceId);

		expect(span.tags).toEqual({ success: true, retries: 1 });
		expect(span.duration).toBe(5000);
		expect(trace?.spans).toContain(span);
		expect(trace?.endTime).toBe(span.endTime);
		expect(trace?.totalDuration).toBe(5000);
		expect(manager.getHealthMetrics()).toEqual(
			expect.objectContaining({
				totalTraces: 1,
				activeSpans: 0,
			}),
		);
	});

	it("finishes spans without tags and skips trace storage when tracing is disabled", () => {
		const manager = new ObservabilityOrchestrator({
			logLevel: "debug",
			enableMetrics: true,
			enableTracing: false,
		});
		const span = manager.createSpan("untagged-operation");

		manager.finishSpan(span);

		expect(span.tags).toEqual({});
		expect(getInternals(manager).traces.size).toBe(0);
		expect(manager.getHealthMetrics()).toEqual(
			expect.objectContaining({
				totalTraces: 0,
				activeSpans: 0,
			}),
		);
	});

	it("monitorExecution records success metrics, closes spans, and returns the result", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));

		const manager = new ObservabilityOrchestrator({
			logLevel: "debug",
			enableMetrics: true,
			enableTracing: true,
		});
		const recordMetricSpy = vi.spyOn(manager, "recordMetric");
		const finishSpanSpy = vi.spyOn(manager, "finishSpan");

		const result = await manager.monitorExecution(
			"successful-operation",
			async () => {
				vi.setSystemTime(new Date("2024-01-01T00:00:00.050Z"));
				return "done";
			},
		);

		expect(result).toBe("done");
		expect(recordMetricSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				entityId: "successful-operation",
				value: 50,
				tags: { status: "success" },
			}),
		);
		expect(finishSpanSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				operationName: "successful-operation",
			}),
			{ success: true },
		);
		expect(manager.getMetrics("successful-operation")).toHaveLength(1);
		expect(manager.getHealthMetrics()).toEqual(
			expect.objectContaining({
				totalMetrics: 1,
				totalTraces: 1,
				activeSpans: 0,
			}),
		);
	});

	it("monitorExecution records error metrics, closes spans, and rethrows failures", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));

		const manager = new ObservabilityOrchestrator({
			logLevel: "debug",
			enableMetrics: true,
			enableTracing: true,
		});
		const expectedError = new Error("boom");
		const recordMetricSpy = vi.spyOn(manager, "recordMetric");
		const finishSpanSpy = vi.spyOn(manager, "finishSpan");

		await expect(
			manager.monitorExecution("failing-operation", async () => {
				vi.setSystemTime(new Date("2024-01-01T00:00:00.075Z"));
				throw expectedError;
			}),
		).rejects.toThrow("boom");

		expect(recordMetricSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				entityId: "failing-operation",
				value: 75,
				tags: { status: "error" },
			}),
		);
		expect(finishSpanSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				operationName: "failing-operation",
			}),
			{ success: false, error: "boom" },
		);
		expect(manager.getMetrics("failing-operation")).toHaveLength(1);
		expect(manager.getHealthMetrics()).toEqual(
			expect.objectContaining({
				totalMetrics: 1,
				totalTraces: 1,
				activeSpans: 0,
			}),
		);
	});

	it("creates orchestrators through both factories and operational logger helper", () => {
		const config = {
			logLevel: "warn" as const,
			enableMetrics: true,
			enableTracing: true,
		};

		expect(ObservabilityOrchestratorFactory.create(config)).toBeInstanceOf(
			ObservabilityOrchestrator,
		);
		expect(ObservabilityManagerFactory.create(config)).toBeInstanceOf(
			ObservabilityOrchestrator,
		);

		const operationalLogger = createOperationalLogger("error");
		operationalLogger.recordMetric(createMetric("operational", 1));

		expect(operationalLogger).toBeInstanceOf(ObservabilityOrchestrator);
		expect(operationalLogger.getMetrics("operational")).toEqual([]);
		expect(operationalLogger.getHealthMetrics()).toEqual(
			expect.objectContaining({
				totalMetrics: 0,
				totalTraces: 0,
			}),
		);
	});
});
