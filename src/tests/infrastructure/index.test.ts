import { describe, expect, it } from "vitest";
import {
	createGraphOrchestrator,
	createObservabilityManager,
	createStatisticalAnalyzer,
	createUnifiedOrchestrator,
	DEFAULT_UNIFIED_CONFIG,
	GraphOrchestrator,
	GraphOrchestratorFactory,
	ObservabilityOrchestrator,
	StatisticalAnalyzer,
	UnifiedOrchestrator,
	UnifiedOrchestratorFactory,
} from "../../infrastructure/index.js";

describe("infrastructure/index — DEFAULT_UNIFIED_CONFIG", () => {
	it("has observability.logLevel = 'info'", () => {
		expect(DEFAULT_UNIFIED_CONFIG.observability.logLevel).toBe("info");
	});

	it("has observability.enableMetrics = true", () => {
		expect(DEFAULT_UNIFIED_CONFIG.observability.enableMetrics).toBe(true);
	});

	it("has graphOrchestration.optimizationStrategy = 'aco'", () => {
		expect(DEFAULT_UNIFIED_CONFIG.graphOrchestration.optimizationStrategy).toBe(
			"aco",
		);
	});

	it("has graphOrchestration.pruningThreshold = 0.1", () => {
		expect(DEFAULT_UNIFIED_CONFIG.graphOrchestration.pruningThreshold).toBe(
			0.1,
		);
	});

	it("has stateMachine.defaultTimeout = 30000", () => {
		expect(DEFAULT_UNIFIED_CONFIG.stateMachine.defaultTimeout).toBe(30000);
	});

	it("has stateMachine.enableWorkflowPersistence = true", () => {
		expect(DEFAULT_UNIFIED_CONFIG.stateMachine.enableWorkflowPersistence).toBe(
			true,
		);
	});

	it("has analytics.metricsRetentionDays = 30", () => {
		expect(DEFAULT_UNIFIED_CONFIG.analytics.metricsRetentionDays).toBe(30);
	});

	it("has analytics.anomalyDetectionSensitivity = 1.5", () => {
		expect(DEFAULT_UNIFIED_CONFIG.analytics.anomalyDetectionSensitivity).toBe(
			1.5,
		);
	});
});

describe("infrastructure/index — re-exports", () => {
	it("exports GraphOrchestrator class", () => {
		expect(typeof GraphOrchestrator).toBe("function");
	});

	it("exports GraphOrchestratorFactory", () => {
		expect(typeof GraphOrchestratorFactory).toBe("function");
	});

	it("exports UnifiedOrchestrator class", () => {
		expect(typeof UnifiedOrchestrator).toBe("function");
	});

	it("exports UnifiedOrchestratorFactory", () => {
		expect(typeof UnifiedOrchestratorFactory).toBe("function");
	});

	it("creates a unified orchestrator from the default config", () => {
		const orchestrator = createUnifiedOrchestrator();
		expect(orchestrator).toBeInstanceOf(UnifiedOrchestrator);
	});

	it("creates a graph orchestrator for a requested strategy", () => {
		const orchestrator = createGraphOrchestrator("physarum");
		expect(orchestrator).toBeInstanceOf(GraphOrchestrator);
	});

	it("creates an observability manager for the requested log level", () => {
		const observability = createObservabilityManager("warn");
		expect(observability).toBeInstanceOf(ObservabilityOrchestrator);
	});

	it("creates a statistical analyzer", () => {
		const analyzer = createStatisticalAnalyzer();
		expect(analyzer).toBeInstanceOf(StatisticalAnalyzer);
	});
});
