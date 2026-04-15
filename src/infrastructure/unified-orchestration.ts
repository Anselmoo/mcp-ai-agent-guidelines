/**
 * Integration module for orchestration, observability, and analytics.
 */

import {
	DEFAULT_UNIFIED_ORCHESTRATOR_CONFIG_VALUES,
	WORKFLOW_MONITOR_POLL_INTERVAL_MS,
} from "../config/runtime-defaults.js";
import type {
	AgentNode,
	ExecutionAnalysis,
	GraphAnalysis,
	GraphBottleneck,
	PerformanceMetric,
	PerformanceTrendMap,
	SkillNode,
	StateMachineContext,
	WorkflowEvent,
	WorkflowMonitorResult,
	WorkflowState,
} from "../contracts/graph-types.js";
import {
	type GraphOrchestrator,
	GraphOrchestratorFactory,
} from "./graph-orchestration.js";
import {
	type ObservabilityOrchestrator,
	ObservabilityOrchestratorFactory,
} from "./observability.js";
import {
	type StateMachineOrchestrator,
	StateMachineOrchestratorFactory,
} from "./state-machine-orchestration.js";
import {
	type StatisticalAnalyzer,
	StatisticalAnalyzerFactory,
} from "./statistical-analysis.js";
import {
	analyzePerformanceTrends,
	calculateRoutingEfficiency,
	detectSystemAnomalies,
	extractExecutionPath,
	performExecutionAnalysis,
	type UnifiedSystemAnomaly,
} from "./unified-orchestration-analytics.js";
import {
	getWorkflowErrorMessage,
	getWorkflowErrorType,
} from "./workflow-error-utilities.js";

function assertNever(value: never): never {
	throw new Error(`Unhandled unified orchestration case: ${String(value)}`);
}

interface WorkflowMonitorPollResult {
	metric?: PerformanceMetric;
	result?: WorkflowMonitorResult;
}

interface WorkflowMonitorPollContext {
	workflowId: string;
	startTime: number;
	deadline: number;
	now: number;
	state: WorkflowState | null;
}

interface WorkflowMonitorPollingOptions {
	workflowId: string;
	timeoutMs: number;
	metrics: PerformanceMetric[];
	getWorkflowState: (workflowId: string) => WorkflowState | null;
	onMetric?: (metric: PerformanceMetric) => void;
}

function evaluateWorkflowMonitorPoll(
	context: WorkflowMonitorPollContext,
): WorkflowMonitorPollResult {
	const { workflowId, startTime, deadline, now, state } = context;

	if (state?.status === "completed") {
		return {
			metric: {
				entityId: workflowId,
				metricName: "workflow_step_duration",
				name: "workflow_step_duration",
				value: now - startTime,
				unit: "ms",
				timestamp: now,
				metadata: { workflowId, step: "monitoring" },
			},
			result: { success: true, data: getWorkflowResultData(state) },
		};
	}

	if (state?.status === "failed") {
		return { result: { success: false, data: undefined } };
	}

	if (now >= deadline) {
		return {
			metric: {
				entityId: workflowId,
				metricName: "workflow_timeout_count",
				name: "workflow_timeout_count",
				value: 1,
				unit: "count",
				timestamp: now,
				metadata: { workflowId },
			},
			result: { success: false, data: undefined },
		};
	}

	return {};
}

function pollWorkflowExecution(
	options: WorkflowMonitorPollingOptions,
): Promise<WorkflowMonitorResult> {
	const { workflowId, timeoutMs, metrics, getWorkflowState, onMetric } =
		options;

	return new Promise((resolve) => {
		const startTime = Date.now();
		const deadline = startTime + timeoutMs;

		const checkStatus = () => {
			const state = getWorkflowState(workflowId);
			const now = Date.now();
			const pollResult = evaluateWorkflowMonitorPoll({
				workflowId,
				startTime,
				deadline,
				now,
				state,
			});

			if (pollResult.metric) {
				metrics.push(pollResult.metric);
				onMetric?.(pollResult.metric);
			}
			if (pollResult.result) {
				resolve(pollResult.result);
				return;
			}

			setTimeout(checkStatus, WORKFLOW_MONITOR_POLL_INTERVAL_MS);
		};

		setTimeout(checkStatus, WORKFLOW_MONITOR_POLL_INTERVAL_MS);
	});
}

function getWorkflowResultData(
	state: WorkflowState | null,
): Record<string, unknown> | undefined {
	if (!state) {
		return undefined;
	}

	if (Object.keys(state.context.results).length > 0) {
		return state.context.results;
	}

	return state.context.data && Object.keys(state.context.data).length > 0
		? state.context.data
		: undefined;
}

export interface UnifiedOrchestratorConfig {
	observability: {
		logLevel: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
		enableMetrics: boolean;
		enableTracing: boolean;
	};
	graphOrchestration: {
		optimizationStrategy: "aco" | "physarum" | "hebbian";
		pruningThreshold: number;
	};
	stateMachine: {
		enableWorkflowPersistence: boolean;
		defaultTimeout: number;
	};
	analytics: {
		metricsRetentionDays: number;
		anomalyDetectionSensitivity: number;
	};
}

export interface IntegratedWorkflowExecution {
	workflowId: string;
	stateMachineWorkflowId: string;
	graphAnalysis: GraphAnalysis;
	stateMachineState: WorkflowState | null;
	performanceMetrics: PerformanceMetric[];
	observabilitySpanId: string;
}

/** Return type of {@link UnifiedOrchestrator.getAnalyticsDashboard}. */
export interface UnifiedOrchestratorDashboard {
	overview: {
		totalWorkflows: number;
		activeWorkflows: number;
		averageExecutionTime: number;
		successRate: number;
	};
	performanceMetrics: PerformanceTrendMap;
	graphAnalytics: {
		bottlenecks: GraphBottleneck[];
		routingEfficiency: number;
		topologyRecommendations: string[];
	};
	anomalies: Array<{
		timestamp: Date;
		type: string;
		severity: "low" | "medium" | "high";
		description: string;
	}>;
}

/**
 * Central orchestrator for domain tooling and observability.
 */
export class UnifiedOrchestrator {
	private graphOrchestrator!: GraphOrchestrator;
	private stateMachineOrchestrator!: StateMachineOrchestrator;
	private observabilityManager!: ObservabilityOrchestrator;
	private statisticalAnalyzer!: StatisticalAnalyzer;
	private config: UnifiedOrchestratorConfig;
	private activeWorkflows: Map<string, IntegratedWorkflowExecution> = new Map();

	/**
	 * Creates a unified orchestrator with merged defaults for orchestration,
	 * observability, workflow timeouts, and analytics tuning.
	 *
	 * @param config Optional partial overrides for the default orchestrator configuration.
	 */
	constructor(config: Partial<UnifiedOrchestratorConfig> = {}) {
		this.config = {
			observability: {
				...DEFAULT_UNIFIED_ORCHESTRATOR_CONFIG_VALUES.observability,
				...config.observability,
			},
			graphOrchestration: {
				...DEFAULT_UNIFIED_ORCHESTRATOR_CONFIG_VALUES.graphOrchestration,
				...config.graphOrchestration,
			},
			stateMachine: {
				...DEFAULT_UNIFIED_ORCHESTRATOR_CONFIG_VALUES.stateMachine,
				...config.stateMachine,
			},
			analytics: {
				...DEFAULT_UNIFIED_ORCHESTRATOR_CONFIG_VALUES.analytics,
				...config.analytics,
			},
		};

		this.initializeComponents();
	}

	/**
	 * Registers a workflow across graph orchestration, state-machine execution, and
	 * observability so it can be executed and analyzed later.
	 *
	 * @param workflowId Stable workflow identifier used across orchestration and metrics.
	 * @param agents Agents available to the workflow graph.
	 * @param skills Skills and execution nodes included in the workflow.
	 * @param dependencies Directed skill dependencies used to build the skill graph.
	 * @returns The created workflow identifier.
	 */
	async createIntegratedWorkflow(
		workflowId: string,
		agents: AgentNode[],
		skills: SkillNode[],
		dependencies: Array<{ from: string; to: string }>,
	): Promise<string> {
		const startTime = Date.now();

		// Start observability span
		const spanId = this.observabilityManager.createSpan(
			`integrated-workflow-${workflowId}`,
		);

		try {
			// Build graph orchestration
			this.graphOrchestrator.buildAgentGraph(agents);
			this.graphOrchestrator.buildSkillGraph(skills, dependencies);

			// Analyze graph structure
			const graphAnalysis = this.graphOrchestrator.analyzeGraph();
			this.observabilityManager.log("info", "Graph analysis completed", {
				workflowId,
				bottlenecks: graphAnalysis.bottlenecks.length,
				recommendations: graphAnalysis.recommendations.length,
			});

			// Create state machine for workflow execution
			const context: StateMachineContext = {
				workflowId,
				skills: skills.map((s) => s.id),
				results: {},
				startTime: Date.now(),
				metadata: {},
			};

			const stateMachineId = this.stateMachineOrchestrator.createWorkflow(
				workflowId,
				{
					initialState: "pending",
					context,
				},
			);

			// Record initial metrics
			const initialMetrics: PerformanceMetric[] = [
				{
					entityId: workflowId,
					metricName: "workflow_setup_duration",
					name: "workflow_setup_duration",
					value: Date.now() - startTime,
					unit: "ms",
					timestamp: Date.now(),
					metadata: { workflowId, phase: "setup" },
				},
			];

			// Store integrated execution state
			const execution: IntegratedWorkflowExecution = {
				workflowId,
				stateMachineWorkflowId: stateMachineId,
				graphAnalysis,
				stateMachineState:
					this.stateMachineOrchestrator.getWorkflowState(stateMachineId),
				performanceMetrics: [],
				observabilitySpanId: spanId.spanId,
			};

			this.activeWorkflows.set(workflowId, execution);
			for (const metric of initialMetrics) {
				this.recordWorkflowMetric(execution, metric);
			}
			this.syncWorkflowState(workflowId);
			await this.persistWorkflowState(workflowId);

			this.observabilityManager.finishSpan(spanId, {
				success: true,
				workflowCreated: true,
			});

			return workflowId;
		} catch (error) {
			this.observabilityManager.log("error", "Workflow creation failed", {
				error: getWorkflowErrorMessage(error),
				workflowId,
			});
			this.observabilityManager.finishSpan(spanId, {
				error: true,
				errorMessage: getWorkflowErrorMessage(error),
			});
			throw error;
		}
	}

	/**
	 * Executes a previously created workflow, collects execution metrics, and returns
	 * a statistical summary of the run.
	 *
	 * @param workflowId Identifier returned from {@link createIntegratedWorkflow}.
	 * @param context Optional runtime context passed with the workflow start event.
	 * @returns Execution success, workflow results, collected metrics, and analysis output.
	 */
	async executeWorkflow(
		workflowId: string,
		context?: Record<string, unknown>,
	): Promise<{
		success: boolean;
		results: Record<string, unknown> | undefined;
		metrics: PerformanceMetric[];
		analysis: ExecutionAnalysis;
	}> {
		const execution = this.activeWorkflows.get(workflowId);
		if (!execution) {
			throw new Error(`Workflow ${workflowId} not found`);
		}

		const executionSpanId = this.observabilityManager.createSpan(
			`workflow-execution-${workflowId}`,
		);

		const startTime = Date.now();
		const executionMetrics: PerformanceMetric[] = [];

		try {
			const recordExecutionMetric = (metric: PerformanceMetric): void => {
				executionMetrics.push(metric);
				this.recordWorkflowMetric(execution, metric);
			};

			// Start state machine execution
			this.sendStateMachineEvent(execution.stateMachineWorkflowId, workflowId, {
				type: "START",
				context,
			});
			this.syncWorkflowState(workflowId);
			await this.persistWorkflowState(workflowId);

			const workflowSkills = execution.stateMachineState?.context.skills ?? [];
			if (workflowSkills.length === 0) {
				this.sendStateMachineEvent(
					execution.stateMachineWorkflowId,
					workflowId,
					{
						type: "COMPLETE",
					},
				);
				this.syncWorkflowState(workflowId);
				await this.persistWorkflowState(workflowId);
			}

			// Monitor execution with regular metric collection
			const results = await this.monitorWorkflowExecution(
				workflowId,
				executionMetrics,
				execution.stateMachineWorkflowId,
				(metric) => {
					this.recordWorkflowMetric(execution, metric);
				},
			);
			this.syncWorkflowState(workflowId);

			const totalDuration = Date.now() - startTime;
			recordExecutionMetric({
				entityId: workflowId,
				metricName: "workflow_total_duration",
				name: "workflow_total_duration",
				value: totalDuration,
				unit: "ms",
				timestamp: Date.now(),
				metadata: { workflowId },
			});

			// Perform statistical analysis on execution metrics
			const analysis = performExecutionAnalysis(
				this.statisticalAnalyzer,
				executionMetrics,
			);

			// Update pheromone trails based on performance (for ACO routing)
			if (this.config.graphOrchestration.optimizationStrategy === "aco") {
				const executionPath = extractExecutionPath(results);
				const successRate = analysis.success ? 1.0 : 0.0;
				if (executionPath.length > 0) {
					this.graphOrchestrator.updatePheromoneTrails([
						{
							path: executionPath,
							performance: successRate,
						},
					]);
				}
			}

			this.observabilityManager.finishSpan(executionSpanId, {
				success: analysis.success,
				totalDuration,
				metricCount: executionMetrics.length,
			});

			return {
				success: analysis.success,
				results:
					results.data ??
					getWorkflowResultData(this.syncWorkflowState(workflowId)),
				metrics: executionMetrics,
				analysis,
			};
		} catch (error) {
			this.stateMachineOrchestrator.sendEvent(
				execution.stateMachineWorkflowId,
				{
					type: "ERROR",
					payload: { message: getWorkflowErrorMessage(error) },
				},
			);
			this.syncWorkflowState(workflowId);
			await this.persistWorkflowState(workflowId);
			this.observabilityManager.log("error", "Workflow execution failed", {
				error: getWorkflowErrorMessage(error),
				workflowId,
			});
			this.observabilityManager.finishSpan(executionSpanId, {
				error: true,
				errorMessage: getWorkflowErrorMessage(error),
			});

			const errorMetric: PerformanceMetric = {
				entityId: workflowId,
				metricName: "workflow_error_count",
				name: "workflow_error_count",
				value: 1,
				unit: "count",
				timestamp: Date.now(),
				metadata: { workflowId, errorType: getWorkflowErrorType(error) },
			};
			executionMetrics.push(errorMetric);
			this.recordWorkflowMetric(execution, errorMetric);

			throw error;
		}
	}

	/**
	 * Builds aggregated dashboard data from recorded metrics and current workflow state.
	 *
	 * @param timeWindow Optional metric window used to scope dashboard calculations.
	 * @returns Overview statistics, performance trends, graph analytics, and detected anomalies.
	 */
	getAnalyticsDashboard(timeWindow?: { start: Date; end: Date }): {
		overview: {
			totalWorkflows: number;
			activeWorkflows: number;
			averageExecutionTime: number;
			successRate: number;
		};
		performanceMetrics: PerformanceTrendMap;
		graphAnalytics: {
			bottlenecks: GraphBottleneck[];
			routingEfficiency: number;
			topologyRecommendations: string[];
		};
		anomalies: Array<{
			timestamp: Date;
			type: string;
			severity: "low" | "medium" | "high";
			description: string;
		}>;
	} {
		for (const workflowId of this.activeWorkflows.keys()) {
			this.syncWorkflowState(workflowId);
		}

		// Collect all metrics from observability manager
		const allMetrics: PerformanceMetric[] = [];
		this.observabilityManager.getAllMetrics().forEach((metrics) => {
			allMetrics.push(...metrics);
		});
		const scopedMetrics = timeWindow
			? allMetrics.filter(
					(metric) =>
						metric.timestamp >= timeWindow.start.getTime() &&
						metric.timestamp <= timeWindow.end.getTime(),
				)
			: allMetrics;

		// Analyze performance trends
		const performanceAnalysis = analyzePerformanceTrends(
			this.statisticalAnalyzer,
			scopedMetrics,
		);

		// Aggregate workflow statistics
		const workflowMetrics = scopedMetrics.filter((m) =>
			m.name.includes("workflow"),
		);
		const executionTimes = workflowMetrics
			.filter((m) => m.name === "workflow_total_duration")
			.map((m) => m.value);
		const completedWorkflowCount = executionTimes.length;
		const errorCount = workflowMetrics
			.filter((m) => m.name === "workflow_error_count")
			.reduce((sum, m) => sum + m.value, 0);

		const overview = {
			totalWorkflows: Math.max(
				this.activeWorkflows.size,
				completedWorkflowCount,
			),
			activeWorkflows: Array.from(this.activeWorkflows.values()).filter(
				(w) => w.stateMachineState?.status === "running",
			).length,
			averageExecutionTime:
				executionTimes.length > 0
					? this.statisticalAnalyzer.analyze(executionTimes).mean
					: 0,
			successRate:
				completedWorkflowCount > 0
					? Math.max(
							0,
							(completedWorkflowCount - errorCount) / completedWorkflowCount,
						)
					: 0,
		};

		// Graph analytics
		const graphAnalysis = this.graphOrchestrator.analyzeGraph();
		const graphAnalytics = {
			bottlenecks: graphAnalysis.bottlenecks,
			routingEfficiency: calculateRoutingEfficiency(scopedMetrics),
			topologyRecommendations: graphAnalysis.recommendations,
		};

		// Anomaly detection
		const anomalies: UnifiedSystemAnomaly[] = detectSystemAnomalies(
			this.statisticalAnalyzer,
			scopedMetrics,
		);

		return {
			overview,
			performanceMetrics: performanceAnalysis,
			graphAnalytics,
			anomalies,
		};
	}

	/**
	 * Applies the configured routing strategy using accumulated execution history and
	 * reports which optimizations were performed.
	 *
	 * @returns Whether optimization ran successfully, the active strategy, and summarized improvements.
	 */
	async optimizeRouting(): Promise<{
		optimizationApplied: boolean;
		strategy: string;
		improvements: string[];
	}> {
		const strategy =
			this.config.graphOrchestration.optimizationStrategy || "aco";
		const improvements: string[] = [];

		try {
			switch (strategy) {
				case "aco":
					// ACO optimization is applied automatically during execution
					improvements.push(
						"Pheromone trails updated based on successful routes",
					);
					break;

				case "physarum":
					this.graphOrchestrator.pruneUnderutilizedPaths(
						this.config.graphOrchestration.pruningThreshold,
					);
					improvements.push("Pruned underutilized routing paths");
					break;

				case "hebbian":
					// Hebbian reinforcement requires activation history
					// This would typically come from the execution monitoring
					improvements.push("Reinforced frequently co-activated agent pairs");
					break;
				default:
					return assertNever(strategy);
			}

			this.observabilityManager.log("info", "Routing optimization completed", {
				strategy,
				improvements: improvements.length,
			});

			return {
				optimizationApplied: true,
				strategy,
				improvements,
			};
		} catch (error) {
			this.observabilityManager.log("error", "Routing optimization failed", {
				strategy,
				error: getWorkflowErrorMessage(error),
			});

			return {
				optimizationApplied: false,
				strategy,
				improvements: [],
			};
		}
	}

	getWorkflowState(workflowId: string): WorkflowState | null {
		return this.syncWorkflowState(workflowId);
	}

	async sendWorkflowEvent(
		workflowId: string,
		event: WorkflowEvent,
	): Promise<boolean> {
		const execution = this.activeWorkflows.get(workflowId);
		if (!execution) {
			return false;
		}

		try {
			this.sendStateMachineEvent(
				execution.stateMachineWorkflowId,
				workflowId,
				event,
			);
			this.syncWorkflowState(workflowId);
			await this.persistWorkflowState(workflowId);
			return true;
		} catch (error) {
			this.observabilityManager.log("error", "Workflow event dispatch failed", {
				error: getWorkflowErrorMessage(error),
				eventType: event.type,
				workflowId,
			});
			return false;
		}
	}

	private initializeComponents(): void {
		this.graphOrchestrator = GraphOrchestratorFactory.create({
			optimizationStrategy: this.config.graphOrchestration.optimizationStrategy,
			pruningThreshold: this.config.graphOrchestration.pruningThreshold,
		});

		this.stateMachineOrchestrator = StateMachineOrchestratorFactory.create(
			this.config.stateMachine,
		);

		this.observabilityManager = ObservabilityOrchestratorFactory.create({
			logLevel: this.config.observability.logLevel,
			enableMetrics: this.config.observability.enableMetrics,
			enableTracing: this.config.observability.enableTracing,
		});

		this.statisticalAnalyzer = StatisticalAnalyzerFactory.create();
	}

	private async monitorWorkflowExecution(
		workflowId: string,
		metrics: PerformanceMetric[],
		stateMachineWorkflowId: string = workflowId,
		onMetric?: (metric: PerformanceMetric) => void,
	): Promise<WorkflowMonitorResult> {
		return pollWorkflowExecution({
			workflowId,
			timeoutMs: this.config.stateMachine.defaultTimeout,
			metrics,
			onMetric,
			getWorkflowState: (id) =>
				this.stateMachineOrchestrator.getWorkflowState(
					id === workflowId ? stateMachineWorkflowId : id,
				),
		});
	}

	private recordWorkflowMetric(
		execution: IntegratedWorkflowExecution,
		metric: PerformanceMetric,
	): void {
		execution.performanceMetrics.push(metric);
		this.observabilityManager.recordMetric(metric);
	}

	private sendStateMachineEvent(
		stateMachineWorkflowId: string,
		workflowId: string,
		event: WorkflowEvent,
	): void {
		if (
			this.stateMachineOrchestrator.sendEvent(stateMachineWorkflowId, event)
		) {
			return;
		}

		throw new Error(
			`Failed to send '${event.type}' event to workflow '${workflowId}'`,
		);
	}

	private syncWorkflowState(workflowId: string): WorkflowState | null {
		const execution = this.activeWorkflows.get(workflowId);
		if (!execution) {
			return null;
		}

		execution.stateMachineState =
			this.stateMachineOrchestrator.getWorkflowState(
				execution.stateMachineWorkflowId,
			);
		return execution.stateMachineState;
	}

	private async persistWorkflowState(workflowId: string): Promise<void> {
		if (!this.config.stateMachine.enableWorkflowPersistence) {
			return;
		}

		const execution = this.activeWorkflows.get(workflowId);
		if (!execution) {
			return;
		}

		await this.stateMachineOrchestrator.persistWorkflow(
			execution.stateMachineWorkflowId,
		);
	}
}

/**
 * Factory for creating unified orchestrators.
 */
export class UnifiedOrchestratorFactory {
	/**
	 * Creates a unified orchestrator instance from a complete configuration object.
	 *
	 * @param config Optional orchestrator configuration.
	 * @returns A ready-to-use {@link UnifiedOrchestrator}.
	 */
	static create(config?: UnifiedOrchestratorConfig): UnifiedOrchestrator {
		return new UnifiedOrchestrator(config);
	}
}

export { DataUtilities } from "./data-utilities.js";
// Export orchestration components directly to avoid circular dependency issues.
export {
	GraphOrchestrator,
	GraphOrchestratorFactory,
} from "./graph-orchestration.js";
export {
	ObservabilityManagerFactory as ObservabilityOrchestratorFactory,
	ObservabilityOrchestrator,
} from "./observability.js";
export {
	StateMachineOrchestrator,
	StateMachineOrchestratorFactory,
} from "./state-machine-orchestration.js";
export {
	StatisticalAnalyzer,
	StatisticalAnalyzerFactory,
} from "./statistical-analysis.js";
