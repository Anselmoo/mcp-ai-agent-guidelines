import { describe, expect, it, vi } from "vitest";
import { UnifiedOrchestrator } from "../../infrastructure/unified-orchestration.js";

type UnifiedOrchestratorInternals = {
	activeWorkflows: Map<
		string,
		{
			workflowId: string;
			stateMachineWorkflowId: string;
			stateMachineState: {
				status: string;
				context: {
					skills: string[];
					results: Record<string, unknown>;
					data?: Record<string, unknown>;
				};
			} | null;
			performanceMetrics: Array<{
				name: string;
				timestamp?: number;
				value?: number;
			}>;
		}
	>;
	graphOrchestrator: {
		updatePheromoneTrails: (
			paths: Array<{ path: string[]; performance: number }>,
		) => void;
		pruneUnderutilizedPaths: (threshold: number) => void;
		analyzeGraph: () => { bottlenecks: []; recommendations: string[] };
	};
	stateMachineOrchestrator: {
		getWorkflowState: (workflowId: string) => unknown;
		persistWorkflow: (workflowId: string) => Promise<void>;
		sendEvent: (workflowId: string, event: { type: string }) => boolean;
	};
	observabilityManager: {
		getAllMetrics: () => Map<
			string,
			Array<{ timestamp: number; name: string; value: number }>
		>;
		log: (
			level: "debug" | "info" | "warn" | "error",
			message: string,
			context?: Record<string, unknown>,
		) => void;
	};
	config: {
		graphOrchestration: {
			optimizationStrategy?: "aco" | "physarum" | "hebbian";
			pruningThreshold: number;
		};
		stateMachine: { enableWorkflowPersistence: boolean };
	};
	monitorWorkflowExecution: (
		workflowId: string,
		metrics: Array<Record<string, unknown>>,
		stateMachineWorkflowId?: string,
		onMetric?: (metric: Record<string, unknown>) => void,
	) => Promise<{ success: boolean; data: Record<string, unknown> | undefined }>;
	syncWorkflowState: (workflowId: string) => {
		status: string;
		context: {
			results: Record<string, unknown>;
			data?: Record<string, unknown>;
			skills: string[];
		};
	} | null;
	persistWorkflowState: (workflowId: string) => Promise<void>;
};

describe("unified-orchestration", () => {
	it("creates integrated workflows and exposes dashboard overview data", async () => {
		const orchestrator = new UnifiedOrchestrator({
			stateMachine: { enableWorkflowPersistence: false, defaultTimeout: 1000 },
		});

		const workflowId = await orchestrator.createIntegratedWorkflow(
			"wf-1",
			[
				{
					id: "agent-1",
					name: "Planner",
					capabilities: ["debug-root-cause"],
					modelTier: "strong",
					status: "available",
					performance: {
						successRate: 0.99,
						averageLatency: 100,
						throughput: 5,
					},
				},
			],
			[
				{
					id: "debug-root-cause",
					name: "Root cause",
					domain: "debug",
					dependencies: [],
					complexity: 1,
					estimatedLatency: 100,
				},
			],
			[],
		);
		const dashboard = orchestrator.getAnalyticsDashboard();

		expect(workflowId).toBe("wf-1");
		expect(dashboard.overview.totalWorkflows).toBeGreaterThan(0);
	});

	it("executes workflows from externally-plumbed state transitions and records metrics for analytics", async () => {
		const orchestrator = new UnifiedOrchestrator({
			stateMachine: { enableWorkflowPersistence: false, defaultTimeout: 1000 },
		});

		await orchestrator.createIntegratedWorkflow(
			"wf-execute",
			[
				{
					id: "agent-1",
					name: "Planner",
					capabilities: ["skill-a"],
					modelTier: "strong",
					status: "available",
					performance: {
						successRate: 0.99,
						averageLatency: 100,
						throughput: 5,
					},
				},
			],
			[
				{
					id: "skill-a",
					name: "Skill A",
					domain: "debug",
					dependencies: [],
					complexity: 1,
					estimatedLatency: 100,
				},
			],
			[],
		);

		const executionPromise = orchestrator.executeWorkflow("wf-execute", {
			requestId: "req-1",
		});
		await orchestrator.sendWorkflowEvent("wf-execute", {
			type: "SKILL_COMPLETE",
			skillId: "skill-a",
			result: { ok: true },
		});
		await orchestrator.sendWorkflowEvent("wf-execute", {
			type: "COMPLETE",
		});

		const result = await executionPromise;
		const dashboard = orchestrator.getAnalyticsDashboard();
		const orchestratorInternals = orchestrator as unknown as {
			activeWorkflows: Map<
				string,
				{
					stateMachineWorkflowId: string;
					stateMachineState: { status: string } | null;
					performanceMetrics: Array<{ name: string }>;
				}
			>;
		};
		const execution = orchestratorInternals.activeWorkflows.get("wf-execute");

		expect(result.success).toBe(true);
		expect(result.results).toEqual({
			"skill-a": { ok: true },
		});
		expect(result.metrics).toEqual(
			expect.arrayContaining([
				expect.objectContaining({ name: "workflow_step_duration" }),
				expect.objectContaining({ name: "workflow_total_duration" }),
			]),
		);
		expect(execution).toEqual(
			expect.objectContaining({
				stateMachineWorkflowId: "wf-execute",
				stateMachineState: expect.objectContaining({ status: "completed" }),
				performanceMetrics: expect.arrayContaining([
					expect.objectContaining({ name: "workflow_setup_duration" }),
					expect.objectContaining({ name: "workflow_total_duration" }),
				]),
			}),
		);
		expect(dashboard.overview.successRate).toBe(1);
		expect(orchestrator.getWorkflowState("wf-execute")).toEqual(
			expect.objectContaining({
				context: expect.objectContaining({
					data: { requestId: "req-1" },
					results: { "skill-a": { ok: true } },
				}),
			}),
		);
	});

	it("auto-completes empty workflows without fabricating skill results", async () => {
		const orchestrator = new UnifiedOrchestrator({
			stateMachine: { enableWorkflowPersistence: false, defaultTimeout: 1000 },
		});

		await orchestrator.createIntegratedWorkflow(
			"wf-empty",
			[
				{
					id: "agent-1",
					name: "Planner",
					capabilities: [],
					modelTier: "strong",
					status: "available",
					performance: {
						successRate: 0.99,
						averageLatency: 100,
						throughput: 5,
					},
				},
			],
			[],
			[],
		);

		await expect(
			orchestrator.executeWorkflow("wf-empty", { origin: "test" }),
		).resolves.toEqual(
			expect.objectContaining({
				success: true,
				results: { origin: "test" },
			}),
		);
		expect(orchestrator.getWorkflowState("wf-empty")).toEqual(
			expect.objectContaining({
				status: "completed",
				context: expect.objectContaining({
					data: { origin: "test" },
					results: {},
				}),
			}),
		);
	});

	it("polls after the initial delay and records monitoring duration on completion", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));

		try {
			const orchestrator = new UnifiedOrchestrator({
				stateMachine: {
					enableWorkflowPersistence: false,
					defaultTimeout: 1000,
				},
			});
			const getWorkflowState = vi
				.fn()
				.mockReturnValueOnce({
					name: "wf-1",
					workflowId: "wf-1",
					currentState: "executing",
					status: "running",
					context: {
						workflowId: "wf-1",
						skills: [],
						results: {},
						startTime: Date.now(),
						metadata: {},
					},
					isRunning: true,
					on: {},
				})
				.mockReturnValueOnce({
					name: "wf-1",
					workflowId: "wf-1",
					currentState: "completed",
					status: "completed",
					context: {
						workflowId: "wf-1",
						skills: [],
						results: {},
						startTime: Date.now(),
						metadata: {},
						data: { step: "done" },
					},
					isRunning: false,
					on: {},
				});
			const orchestratorInternals = orchestrator as unknown as {
				stateMachineOrchestrator: { getWorkflowState: typeof getWorkflowState };
				monitorWorkflowExecution: (
					workflowId: string,
					metrics: Array<Record<string, unknown>>,
				) => Promise<{
					success: boolean;
					data: Record<string, unknown> | undefined;
				}>;
			};
			orchestratorInternals.stateMachineOrchestrator = { getWorkflowState };
			const metrics: Array<Record<string, unknown>> = [];

			const monitoring = orchestratorInternals.monitorWorkflowExecution(
				"wf-1",
				metrics,
			);

			await vi.advanceTimersByTimeAsync(99);
			expect(getWorkflowState).not.toHaveBeenCalled();

			await vi.advanceTimersByTimeAsync(1);
			expect(getWorkflowState).toHaveBeenCalledTimes(1);

			await vi.advanceTimersByTimeAsync(100);
			await expect(monitoring).resolves.toEqual({
				success: true,
				data: { step: "done" },
			});
			expect(metrics).toEqual([
				expect.objectContaining({
					entityId: "wf-1",
					name: "workflow_step_duration",
					value: 200,
					metadata: { workflowId: "wf-1", step: "monitoring" },
				}),
			]);
		} finally {
			vi.useRealTimers();
		}
	});

	it("records a timeout metric when polling exceeds the configured deadline", async () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date("2024-01-01T00:00:00.000Z"));

		try {
			const orchestrator = new UnifiedOrchestrator({
				stateMachine: { enableWorkflowPersistence: false, defaultTimeout: 250 },
			});
			const getWorkflowState = vi.fn().mockReturnValue({
				name: "wf-timeout",
				workflowId: "wf-timeout",
				currentState: "executing",
				status: "running",
				context: {
					workflowId: "wf-timeout",
					skills: [],
					results: {},
					startTime: Date.now(),
					metadata: {},
				},
				isRunning: true,
				on: {},
			});
			const orchestratorInternals = orchestrator as unknown as {
				stateMachineOrchestrator: { getWorkflowState: typeof getWorkflowState };
				monitorWorkflowExecution: (
					workflowId: string,
					metrics: Array<Record<string, unknown>>,
				) => Promise<{
					success: boolean;
					data: Record<string, unknown> | undefined;
				}>;
			};
			orchestratorInternals.stateMachineOrchestrator = { getWorkflowState };
			const metrics: Array<Record<string, unknown>> = [];

			const monitoring = orchestratorInternals.monitorWorkflowExecution(
				"wf-timeout",
				metrics,
			);

			await vi.advanceTimersByTimeAsync(300);
			await expect(monitoring).resolves.toEqual({
				success: false,
				data: undefined,
			});
			expect(getWorkflowState).toHaveBeenCalledTimes(3);
			expect(metrics).toEqual([
				expect.objectContaining({
					entityId: "wf-timeout",
					name: "workflow_timeout_count",
					value: 1,
					metadata: { workflowId: "wf-timeout" },
				}),
			]);
		} finally {
			vi.useRealTimers();
		}
	});

	it("stops polling on failure without recording a timeout metric", async () => {
		vi.useFakeTimers();

		try {
			const orchestrator = new UnifiedOrchestrator({
				stateMachine: { enableWorkflowPersistence: false, defaultTimeout: 250 },
			});
			const getWorkflowState = vi.fn().mockReturnValue({
				name: "wf-failed",
				workflowId: "wf-failed",
				currentState: "failed",
				status: "failed",
				context: {
					workflowId: "wf-failed",
					skills: [],
					results: {},
					startTime: Date.now(),
					metadata: {},
				},
				isRunning: false,
				on: {},
			});
			const orchestratorInternals = orchestrator as unknown as {
				stateMachineOrchestrator: { getWorkflowState: typeof getWorkflowState };
				monitorWorkflowExecution: (
					workflowId: string,
					metrics: Array<Record<string, unknown>>,
				) => Promise<{
					success: boolean;
					data: Record<string, unknown> | undefined;
				}>;
			};
			orchestratorInternals.stateMachineOrchestrator = { getWorkflowState };
			const metrics: Array<Record<string, unknown>> = [];

			const monitoring = orchestratorInternals.monitorWorkflowExecution(
				"wf-failed",
				metrics,
			);

			await vi.advanceTimersByTimeAsync(100);
			await expect(monitoring).resolves.toEqual({
				success: false,
				data: undefined,
			});
			expect(getWorkflowState).toHaveBeenCalledTimes(1);
			expect(metrics).toEqual([]);
		} finally {
			vi.useRealTimers();
		}
	});

	it("records sanitized error metrics when workflow event delivery fails", async () => {
		const orchestrator = new UnifiedOrchestrator({
			stateMachine: { enableWorkflowPersistence: false, defaultTimeout: 1000 },
		});

		await orchestrator.createIntegratedWorkflow(
			"wf-error",
			[
				{
					id: "agent-1",
					name: "Planner",
					capabilities: ["skill-a"],
					modelTier: "strong",
					status: "available",
					performance: {
						successRate: 0.99,
						averageLatency: 100,
						throughput: 5,
					},
				},
			],
			[
				{
					id: "skill-a",
					name: "Skill A",
					domain: "debug",
					dependencies: [],
					complexity: 1,
					estimatedLatency: 100,
				},
			],
			[],
		);

		const orchestratorInternals = orchestrator as unknown as {
			stateMachineOrchestrator: {
				sendEvent: (workflowId: string, event: { type: string }) => boolean;
			};
			observabilityManager: {
				log: (
					level: "debug" | "info" | "warn" | "error",
					message: string,
					context?: Record<string, unknown>,
				) => void;
			};
			activeWorkflows: Map<
				string,
				{
					performanceMetrics: Array<{
						name: string;
						metadata?: Record<string, unknown>;
					}>;
				}
			>;
		};
		const originalSendEvent =
			orchestratorInternals.stateMachineOrchestrator.sendEvent.bind(
				orchestratorInternals.stateMachineOrchestrator,
			);
		orchestratorInternals.stateMachineOrchestrator.sendEvent = vi.fn(
			(workflowId, event) => {
				if (event.type === "START") {
					return false;
				}
				return originalSendEvent(workflowId, event);
			},
		);
		const logSpy = vi.spyOn(orchestratorInternals.observabilityManager, "log");

		await expect(orchestrator.executeWorkflow("wf-error")).rejects.toThrow(
			"Failed to send 'START' event to workflow 'wf-error'",
		);

		expect(logSpy).toHaveBeenCalledWith(
			"error",
			"Workflow execution failed",
			expect.objectContaining({
				error: "Failed to send 'START' event to workflow 'wf-error'",
				workflowId: "wf-error",
			}),
		);
		expect(logSpy.mock.calls[0]?.[2]).not.toHaveProperty("stack");
		expect(
			orchestratorInternals.activeWorkflows.get("wf-error")?.performanceMetrics,
		).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					name: "workflow_error_count",
					metadata: expect.objectContaining({ errorType: "Error" }),
				}),
			]),
		);
	});

	it("returns false or throws for missing workflows depending on the public API", async () => {
		const orchestrator = new UnifiedOrchestrator({
			stateMachine: { enableWorkflowPersistence: false, defaultTimeout: 1000 },
		});

		await expect(
			orchestrator.executeWorkflow("missing-workflow"),
		).rejects.toThrow("Workflow missing-workflow not found");
		expect(orchestrator.getWorkflowState("missing-workflow")).toBeNull();
		await expect(
			orchestrator.sendWorkflowEvent("missing-workflow", { type: "COMPLETE" }),
		).resolves.toBe(false);
	});

	it("falls back to synchronized workflow state when monitored results omit data", async () => {
		const orchestrator = new UnifiedOrchestrator({
			graphOrchestration: {
				optimizationStrategy: "physarum",
				pruningThreshold: 0.2,
			},
			stateMachine: { enableWorkflowPersistence: false, defaultTimeout: 1000 },
		});

		await orchestrator.createIntegratedWorkflow(
			"wf-fallback-results",
			[
				{
					id: "agent-1",
					name: "Planner",
					capabilities: ["skill-a"],
					modelTier: "strong",
					status: "available",
					performance: {
						successRate: 0.99,
						averageLatency: 100,
						throughput: 5,
					},
				},
			],
			[
				{
					id: "skill-a",
					name: "Skill A",
					domain: "debug",
					dependencies: [],
					complexity: 1,
					estimatedLatency: 100,
				},
			],
			[],
		);

		const internals = orchestrator as unknown as UnifiedOrchestratorInternals;
		vi.spyOn(internals, "monitorWorkflowExecution").mockResolvedValue({
			success: true,
			data: undefined,
		});
		vi.spyOn(internals, "syncWorkflowState").mockReturnValue({
			status: "completed",
			context: {
				skills: ["skill-a"],
				results: {},
				data: { recovered: true },
			},
		});
		const updatePheromoneSpy = vi.spyOn(
			internals.graphOrchestrator,
			"updatePheromoneTrails",
		);

		await expect(
			orchestrator.executeWorkflow("wf-fallback-results"),
		).resolves.toEqual(
			expect.objectContaining({
				success: true,
				results: { recovered: true },
			}),
		);
		expect(updatePheromoneSpy).not.toHaveBeenCalled();
	});

	it("returns undefined when synchronized workflow state has neither results nor data", async () => {
		const orchestrator = new UnifiedOrchestrator({
			stateMachine: { enableWorkflowPersistence: false, defaultTimeout: 1000 },
		});

		await orchestrator.createIntegratedWorkflow(
			"wf-empty-fallback",
			[
				{
					id: "agent-1",
					name: "Planner",
					capabilities: ["skill-a"],
					modelTier: "strong",
					status: "available",
					performance: {
						successRate: 0.99,
						averageLatency: 100,
						throughput: 5,
					},
				},
			],
			[
				{
					id: "skill-a",
					name: "Skill A",
					domain: "debug",
					dependencies: [],
					complexity: 1,
					estimatedLatency: 100,
				},
			],
			[],
		);

		const internals = orchestrator as unknown as UnifiedOrchestratorInternals;
		const execution = internals.activeWorkflows.get("wf-empty-fallback");
		expect(execution).toBeDefined();
		if (execution) {
			execution.stateMachineState = null;
		}
		vi.spyOn(internals, "monitorWorkflowExecution").mockResolvedValue({
			success: true,
			data: undefined,
		});
		vi.spyOn(internals, "syncWorkflowState").mockReturnValue({
			status: "completed",
			context: {
				skills: [],
				results: {},
				data: {},
			},
		});

		await expect(
			orchestrator.executeWorkflow("wf-empty-fallback"),
		).resolves.toEqual(
			expect.objectContaining({
				results: undefined,
			}),
		);
	});

	it("scopes dashboard metrics to the requested time window", () => {
		const orchestrator = new UnifiedOrchestrator({
			stateMachine: { enableWorkflowPersistence: false, defaultTimeout: 1000 },
		});
		const internals = orchestrator as unknown as UnifiedOrchestratorInternals;
		vi.spyOn(internals.observabilityManager, "getAllMetrics").mockReturnValue(
			new Map([
				[
					"wf-scope",
					[
						{
							timestamp: 5,
							name: "workflow_total_duration",
							value: 11,
						},
						{
							timestamp: 15,
							name: "workflow_total_duration",
							value: 20,
						},
						{
							timestamp: 25,
							name: "workflow_error_count",
							value: 1,
						},
					],
				],
			]),
		);
		vi.spyOn(internals.graphOrchestrator, "analyzeGraph").mockReturnValue({
			bottlenecks: [],
			recommendations: ["keep scope tight"],
		});

		const dashboard = orchestrator.getAnalyticsDashboard({
			start: new Date(10),
			end: new Date(20),
		});

		expect(dashboard.overview.averageExecutionTime).toBe(20);
		expect(dashboard.overview.successRate).toBe(1);
		expect(dashboard.graphAnalytics.topologyRecommendations).toEqual([
			"keep scope tight",
		]);
	});

	it("optimizes routing for physarum, hebbian, fallback aco, and invalid strategies", async () => {
		const orchestrator = new UnifiedOrchestrator({
			graphOrchestration: {
				optimizationStrategy: "physarum",
				pruningThreshold: 0.42,
			},
			stateMachine: { enableWorkflowPersistence: false, defaultTimeout: 1000 },
		});
		const internals = orchestrator as unknown as UnifiedOrchestratorInternals;
		const pruneSpy = vi.spyOn(
			internals.graphOrchestrator,
			"pruneUnderutilizedPaths",
		);

		await expect(orchestrator.optimizeRouting()).resolves.toEqual({
			optimizationApplied: true,
			strategy: "physarum",
			improvements: ["Pruned underutilized routing paths"],
		});
		expect(pruneSpy).toHaveBeenCalledWith(0.42);

		internals.config.graphOrchestration.optimizationStrategy = "hebbian";
		await expect(orchestrator.optimizeRouting()).resolves.toEqual({
			optimizationApplied: true,
			strategy: "hebbian",
			improvements: ["Reinforced frequently co-activated agent pairs"],
		});

		internals.config.graphOrchestration.optimizationStrategy = undefined;
		await expect(orchestrator.optimizeRouting()).resolves.toEqual({
			optimizationApplied: true,
			strategy: "aco",
			improvements: ["Pheromone trails updated based on successful routes"],
		});

		internals.config.graphOrchestration.optimizationStrategy =
			"invalid" as unknown as "aco";
		await expect(orchestrator.optimizeRouting()).resolves.toEqual({
			optimizationApplied: false,
			strategy: "invalid",
			improvements: [],
		});
	});

	it("persists workflows only when enabled and the workflow exists", async () => {
		const orchestrator = new UnifiedOrchestrator({
			stateMachine: { enableWorkflowPersistence: true, defaultTimeout: 1000 },
		});

		await orchestrator.createIntegratedWorkflow(
			"wf-persist",
			[
				{
					id: "agent-1",
					name: "Planner",
					capabilities: ["skill-a"],
					modelTier: "strong",
					status: "available",
					performance: {
						successRate: 0.99,
						averageLatency: 100,
						throughput: 5,
					},
				},
			],
			[
				{
					id: "skill-a",
					name: "Skill A",
					domain: "debug",
					dependencies: [],
					complexity: 1,
					estimatedLatency: 100,
				},
			],
			[],
		);

		const internals = orchestrator as unknown as UnifiedOrchestratorInternals;
		const persistSpy = vi.spyOn(
			internals.stateMachineOrchestrator,
			"persistWorkflow",
		);

		await internals.persistWorkflowState("wf-persist");
		await internals.persistWorkflowState("wf-missing");

		expect(persistSpy).toHaveBeenCalledWith("wf-persist");
		expect(persistSpy).toHaveBeenCalledTimes(1);
	});
});
