/**
 * Domain tooling and observability infrastructure entry point.
 */

import { ObservabilityManagerFactory } from "./observability.js";
import { StatisticalAnalyzerFactory } from "./statistical-analysis.js";
import {
	GraphOrchestratorFactory,
	UnifiedOrchestratorFactory,
} from "./unified-orchestration.js";

// Re-export types
export type {
	AgentNode,
	GraphAnalysis,
	LogEntry,
	OrchestrationGraph,
	PathOptimization,
	PerformanceMetric,
	RouteEdge,
	SkillNode,
	StateMachineContext,
	StateTransition,
	StatisticalAnalysis,
	TrendAnalysis,
	WorkflowState,
} from "../contracts/graph-types.js";
export * from "./data-utilities.js";
export * from "./graph-orchestration.js";
export * from "./observability.js";
export * from "./state-machine-orchestration.js";
export * from "./statistical-analysis.js";
// Selective exports from unified-orchestration to avoid conflicts
export {
	GraphOrchestrator,
	GraphOrchestratorFactory,
	UnifiedOrchestrator,
	UnifiedOrchestratorFactory,
} from "./unified-orchestration.js";

// Default configurations
export const DEFAULT_UNIFIED_CONFIG = {
	observability: {
		logLevel: "info" as const,
		enableMetrics: true,
		enableTracing: true,
	},
	graphOrchestration: {
		optimizationStrategy: "aco" as const,
		pruningThreshold: 0.1,
	},
	stateMachine: {
		enableWorkflowPersistence: true,
		defaultTimeout: 30000,
	},
	analytics: {
		metricsRetentionDays: 30,
		anomalyDetectionSensitivity: 1.5,
	},
};

// Utility functions for easy integration
export const createUnifiedOrchestrator = (config = DEFAULT_UNIFIED_CONFIG) => {
	return UnifiedOrchestratorFactory.create(config);
};

export const createGraphOrchestrator = (
	strategy: "aco" | "physarum" | "hebbian" = "aco",
) => {
	return GraphOrchestratorFactory.create({ optimizationStrategy: strategy });
};

export const createObservabilityManager = (
	logLevel: "debug" | "info" | "warn" | "error" = "info",
) => {
	return ObservabilityManagerFactory.create({
		logLevel,
		enableMetrics: true,
		enableTracing: true,
	});
};

export const createStatisticalAnalyzer = () => {
	return StatisticalAnalyzerFactory.create();
};
