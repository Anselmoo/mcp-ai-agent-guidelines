/**
 * Simplified observability infrastructure with Pino logging
 * Provides structured logging without complex tracing features
 */

import { randomUUID } from "node:crypto";
import pino from "pino";
import type {
	DistributedTrace,
	LogEntry,
	PerformanceMetric,
	TraceSpan,
} from "../contracts/graph-types.js";

export interface ObservabilityConfig {
	logLevel: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
	enableMetrics: boolean;
	enableTracing: boolean;
}

/**
 * Interface for observability management
 */
export interface IObservabilityManager {
	log(
		level: "debug" | "info" | "warn" | "error",
		message: string,
		context?: Record<string, unknown>,
	): void;
	createSpan(operationName: string, parentSpan?: TraceSpan): TraceSpan;
	finishSpan(span: TraceSpan, tags?: Record<string, unknown>): void;
	recordMetric(metric: PerformanceMetric): void;
	getMetrics(entityId: string): PerformanceMetric[];
	getAllMetrics(): Map<string, PerformanceMetric[]>;
	getHealthMetrics(): {
		totalMetrics: number;
		totalLogs: number;
		totalTraces: number;
		activeSpans: number;
		memoryUsage: NodeJS.MemoryUsage;
		uptime: number;
	};
}

/**
 * Simplified observability orchestrator for monitoring and logging
 */
export class ObservabilityOrchestrator implements IObservabilityManager {
	private logger: pino.Logger;
	private metrics: Map<string, PerformanceMetric[]> = new Map();
	private traces: Map<string, DistributedTrace> = new Map();
	private logEntries: LogEntry[] = [];
	private activeSpanIds: Set<string> = new Set();
	private config: ObservabilityConfig;

	constructor(config: ObservabilityConfig) {
		this.config = config;
		// MCP servers use stdin/stdout as the protocol transport, so ALL logging
		// must go to stderr (fd 2) to avoid corrupting the MCP message stream.
		const loggerOptions = {
			level: config.logLevel || "info",
		};

		this.logger =
			process.env.NODE_ENV === "test"
				? pino(loggerOptions)
				: pino({
						...loggerOptions,
						transport: {
							target: "pino-pretty",
							options: {
								colorize: true,
								translateTime: "SYS:standard",
								destination: 2,
							},
						},
					});
	}

	/**
	 * Log a message with structured context
	 */
	log(
		level: "debug" | "info" | "warn" | "error",
		message: string,
		context?: Record<string, unknown>,
	): void {
		this.logEntries.push({
			level,
			message,
			timestamp: Date.now(),
			context: context ? { ...context } : undefined,
			traceId:
				typeof context?.traceId === "string" ? context.traceId : undefined,
			spanId: typeof context?.spanId === "string" ? context.spanId : undefined,
		});
		if (this.logEntries.length > 1000) {
			this.logEntries.splice(0, this.logEntries.length - 1000);
		}
		this.logger[level](context || {}, message);
	}

	/**
	 * Create a new span for distributed tracing
	 */
	createSpan(operationName: string, parentSpan?: TraceSpan): TraceSpan {
		const span: TraceSpan = {
			traceId: parentSpan?.traceId || this.generateId(),
			spanId: this.generateId(),
			parentSpanId: parentSpan?.spanId,
			operationName,
			startTime: Date.now(),
			tags: {},
			logs: [],
		};

		this.activeSpanIds.add(span.spanId);
		this.logger.debug({ span }, `Starting span: ${operationName}`);
		return span;
	}

	/**
	 * Finish a span and record its completion
	 */
	finishSpan(span: TraceSpan, tags?: Record<string, unknown>): void {
		span.endTime = Date.now();
		span.duration = span.endTime - span.startTime;
		this.activeSpanIds.delete(span.spanId);

		if (tags) {
			span.tags = { ...span.tags, ...tags };
		}

		this.logger.debug(
			{
				span,
				duration: span.duration,
			},
			`Finished span: ${span.operationName}`,
		);

		if (this.config.enableTracing) {
			this.addSpanToTrace(span);
		}
	}

	/**
	 * Record a performance metric
	 */
	recordMetric(metric: PerformanceMetric): void {
		if (!this.config.enableMetrics) return;

		const entityMetrics = this.metrics.get(metric.entityId) || [];
		entityMetrics.push(metric);

		// Keep only last 1000 metrics per entity
		if (entityMetrics.length > 1000) {
			entityMetrics.splice(0, entityMetrics.length - 1000);
		}

		this.metrics.set(metric.entityId, entityMetrics);

		this.logger.info(
			{
				entityId: metric.entityId,
				metricName: metric.metricName,
				value: metric.value,
				unit: metric.unit,
			},
			"Metric recorded",
		);
	}

	/**
	 * Get metrics for a specific entity
	 */
	getMetrics(entityId: string): PerformanceMetric[] {
		return [...(this.metrics.get(entityId) || [])];
	}

	/**
	 * Get all recorded metrics
	 */
	getAllMetrics(): Map<string, PerformanceMetric[]> {
		return new Map(
			Array.from(this.metrics.entries(), ([entityId, metrics]) => [
				entityId,
				[...metrics],
			]),
		);
	}

	/**
	 * Create a child logger with additional context
	 */
	createChildLogger(context: Record<string, unknown>): pino.Logger {
		return this.logger.child(context);
	}

	/**
	 * Get logger instance
	 */
	getLogger(): pino.Logger {
		return this.logger;
	}

	/**
	 * Monitor function execution with automatic span creation
	 */
	async monitorExecution<T>(
		operationName: string,
		operation: () => Promise<T>,
		parentSpan?: TraceSpan,
	): Promise<T> {
		const span = this.createSpan(operationName, parentSpan);
		const startTime = Date.now();

		try {
			const result = await operation();

			// Record success metrics
			this.recordMetric({
				entityId: operationName,
				metricName: "execution_time",
				name: "execution_time",
				value: Date.now() - startTime,
				timestamp: Date.now(),
				unit: "milliseconds",
				tags: { status: "success" },
			});

			this.finishSpan(span, { success: true });
			return result;
		} catch (error) {
			// Record error metrics
			this.recordMetric({
				entityId: operationName,
				metricName: "execution_time",
				name: "execution_time",
				value: Date.now() - startTime,
				timestamp: Date.now(),
				unit: "milliseconds",
				tags: { status: "error" },
			});

			const errorMessage =
				error instanceof Error ? error.message : "Unknown error";
			this.finishSpan(span, {
				success: false,
				error: errorMessage,
			});

			throw error;
		}
	}

	/**
	 * Get observability health metrics
	 */
	getHealthMetrics(): {
		totalMetrics: number;
		totalLogs: number;
		totalTraces: number;
		activeSpans: number;
		memoryUsage: NodeJS.MemoryUsage;
		uptime: number;
	} {
		const totalMetrics = Array.from(this.metrics.values()).reduce(
			(sum, metrics) => sum + metrics.length,
			0,
		);

		return {
			totalMetrics,
			totalLogs: this.logEntries.length,
			totalTraces: this.traces.size,
			activeSpans: this.activeSpanIds.size,
			memoryUsage: process.memoryUsage(),
			uptime: process.uptime(),
		};
	}

	private addSpanToTrace(span: TraceSpan): void {
		let trace = this.traces.get(span.traceId);

		if (!trace) {
			trace = {
				traceId: span.traceId,
				spans: [],
				startTime: span.startTime,
				rootSpan: span,
			};
			this.traces.set(span.traceId, trace);
		}

		trace.spans.push(span);

		if (span.endTime) {
			trace.endTime = Math.max(trace.endTime || 0, span.endTime);
			trace.totalDuration = (trace.endTime || Date.now()) - trace.startTime;
		}
	}

	private generateId(): string {
		return randomUUID();
	}
}

/**
 * Factory for creating observability orchestrators
 */
export class ObservabilityOrchestratorFactory {
	static create(config: ObservabilityConfig): ObservabilityOrchestrator {
		return new ObservabilityOrchestrator(config);
	}
}

/**
 * Factory alias for cleaner API
 */
export class ObservabilityManagerFactory {
	static create(config: ObservabilityConfig): ObservabilityOrchestrator {
		return ObservabilityOrchestratorFactory.create(config);
	}
}

export function createOperationalLogger(
	logLevel: ObservabilityConfig["logLevel"] = "info",
): ObservabilityOrchestrator {
	return ObservabilityOrchestratorFactory.create({
		logLevel,
		enableMetrics: false,
		enableTracing: false,
	});
}

// Single canonical export - no conflicting aliases
export { ObservabilityOrchestrator as ObservabilityManager };
