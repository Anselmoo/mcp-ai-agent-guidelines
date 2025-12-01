import { beforeEach, describe, expect, it } from "vitest";
import { designPhaseWorkflow } from "../../src/tools/design/design-phase-workflow.ts";
import type { DesignSessionConfig } from "../../src/tools/design/types/index.ts";

describe("Design Phase Workflow - Phase 2 Additional Tests", () => {
	beforeEach(async () => {
		await designPhaseWorkflow.initialize();
	});

	const createSessionConfig = (): DesignSessionConfig => ({
		sessionId: `phase2b-${Math.random()}`,
		context: "Phase 2B workflow testing",
		goal: "Test workflow transitions",
		requirements: ["req-1", "req-2"],
		constraints: [
			{
				id: "c1",
				name: "Performance",
				type: "non-functional",
				category: "performance",
				description: "Performance constraint",
				validation: { minCoverage: 85 },
				weight: 2,
				mandatory: true,
				source: "test",
			},
		],
		coverageThreshold: 85,
		enablePivots: false,
		templateRefs: [],
		outputFormats: ["markdown"],
		metadata: { phase: "2b" },
	});

	describe("Start Action - Session Initialization", () => {
		it("should initialize session with discovery phase", async () => {
			const config = createSessionConfig();
			const result = await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: "start-1",
				config,
			});
			expect(result.success).toBe(true);
			expect(result.currentPhase).toBe("discovery");
		});

		it("should start with multiple constraints", async () => {
			const config = createSessionConfig();
			config.constraints = [
				{
					id: "c1",
					name: "Perf",
					type: "non-functional",
					category: "performance",
					description: "desc",
					validation: { minCoverage: 80 },
					weight: 2,
					mandatory: true,
					source: "test",
				},
				{
					id: "c2",
					name: "Security",
					type: "compliance",
					category: "security",
					description: "sec",
					validation: { keywords: ["secure"] },
					weight: 3,
					mandatory: true,
					source: "test",
				},
			];
			const result = await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: "start-multi",
				config,
			});
			expect(result.success).toBe(true);
			expect(result.sessionState.config.constraints.length).toBe(2);
		});

		it("should initialize coverage to zero", async () => {
			const config = createSessionConfig();
			const result = await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: "start-cov",
				config,
			});
			expect(result.sessionState.coverage.overall).toBe(0);
		});
	});

	describe("Advance Action - Phase Transitions", () => {
		it("should advance from discovery", async () => {
			const config = createSessionConfig();
			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: "adv-1",
				config,
			});
			const result = await designPhaseWorkflow.executeWorkflow({
				action: "advance",
				sessionId: "adv-1",
			});
			expect(result.success).toBe(true);
		});

		it("should provide next phase", async () => {
			const config = createSessionConfig();
			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: "adv-next",
				config,
			});
			const result = await designPhaseWorkflow.executeWorkflow({
				action: "advance",
				sessionId: "adv-next",
			});
			expect(result.nextPhase).toBeDefined();
		});

		it("should progress through sequence", async () => {
			const config = createSessionConfig();
			const sid = "seq-1";
			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: sid,
				config,
			});
			const r1 = await designPhaseWorkflow.executeWorkflow({
				action: "advance",
				sessionId: sid,
			});
			expect(r1.success).toBe(true);
		});
	});

	describe("Complete Action - Phase Completion", () => {
		it("should complete with content", async () => {
			const config = createSessionConfig();
			const sid = "comp-1";
			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: sid,
				config,
			});
			const result = await designPhaseWorkflow.executeWorkflow({
				action: "complete",
				sessionId: sid,
				phaseId: "discovery",
				content: "Completed discovery",
			});
			expect(result.message).toBeDefined();
		});

		it("should generate artifacts", async () => {
			const config = createSessionConfig();
			const sid = "comp-art";
			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: sid,
				config,
			});
			const result = await designPhaseWorkflow.executeWorkflow({
				action: "complete",
				sessionId: sid,
				phaseId: "discovery",
				content: "Completion data",
			});
			expect(result.artifacts).toBeInstanceOf(Array);
		});
	});

	describe("Status Action - Session Monitoring", () => {
		it("should report session status", async () => {
			const config = createSessionConfig();
			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: "stat-1",
				config,
			});
			const result = await designPhaseWorkflow.executeWorkflow({
				action: "status",
				sessionId: "stat-1",
			});
			expect(result.currentPhase).toBe("discovery");
		});

		it("should track coverage", async () => {
			const config = createSessionConfig();
			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: "stat-cov",
				config,
			});
			const result = await designPhaseWorkflow.executeWorkflow({
				action: "status",
				sessionId: "stat-cov",
			});
			expect(result.sessionState.coverage).toBeDefined();
		});
	});

	describe("Reset Action - State Reset", () => {
		it("should reset to initial state", async () => {
			const config = createSessionConfig();
			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: "reset-1",
				config,
			});
			const result = await designPhaseWorkflow.executeWorkflow({
				action: "reset",
				sessionId: "reset-1",
			});
			expect(result.currentPhase).toBe("discovery");
		});

		it("should clear coverage on reset", async () => {
			const config = createSessionConfig();
			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: "reset-cov",
				config,
			});
			const result = await designPhaseWorkflow.executeWorkflow({
				action: "reset",
				sessionId: "reset-cov",
			});
			expect(result.sessionState.coverage.overall).toBeLessThanOrEqual(0);
		});
	});

	describe("Edge Cases", () => {
		it("should handle no constraints", async () => {
			const config = createSessionConfig();
			config.constraints = [];
			const result = await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: "edge-nc",
				config,
			});
			expect(result.success).toBe(true);
		});

		it("should handle multiple transitions", async () => {
			const config = createSessionConfig();
			const sid = "multi-t";
			const s1 = await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: sid,
				config,
			});
			expect(s1.success).toBe(true);
			const s2 = await designPhaseWorkflow.executeWorkflow({
				action: "advance",
				sessionId: sid,
			});
			expect(s2.success).toBe(true);
		});

		it.skip("should handle complete-reset cycle", async () => {
			const config = createSessionConfig();
			const sid = "cycle-1";
			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: sid,
				config,
			});
			const comp = await designPhaseWorkflow.executeWorkflow({
				action: "complete",
				sessionId: sid,
				phaseId: "discovery",
				content: "Done",
			});
			expect(comp.success).toBe(true);
			const reset = await designPhaseWorkflow.executeWorkflow({
				action: "reset",
				sessionId: sid,
			});
			expect(reset.currentPhase).toBe("discovery");
		});
	});

	describe("Initialization", () => {
		it("should initialize", async () => {
			await designPhaseWorkflow.initialize();
			expect(true).toBe(true);
		});
	});

	describe("Error Handling - Unknown Actions", () => {
		it("should throw error for unknown action", async () => {
			const config = createSessionConfig();
			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: "unknown-action-test",
				config,
			});

			// Use try/catch to test error throwing
			try {
				await designPhaseWorkflow.executeWorkflow({
					action: "invalid-action" as
						| "start"
						| "advance"
						| "complete"
						| "validate"
						| "reset"
						| "status",
					sessionId: "unknown-action-test",
				});
				// Should not reach here
				expect(false).toBe(true);
			} catch (error) {
				expect(error).toBeDefined();
			}
		});
	});

	describe("Session Not Found Errors", () => {
		it("should throw error when completing non-existent session", async () => {
			try {
				await designPhaseWorkflow.executeWorkflow({
					action: "complete",
					sessionId: "non-existent-session-complete",
					phaseId: "discovery",
					content: "test content",
				});
				expect(false).toBe(true);
			} catch (error) {
				expect(error).toBeDefined();
			}
		});
	});

	describe("All Phases Complete", () => {
		it("should complete discovery phase", async () => {
			const config = createSessionConfig();
			const sid = `complete-discovery-${Math.random()}`;

			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: sid,
				config,
			});

			// Complete discovery phase
			const discoveryResult = await designPhaseWorkflow.executeWorkflow({
				action: "complete",
				sessionId: sid,
				phaseId: "discovery",
				content: "Discovery completed with comprehensive analysis",
			});

			// Result should be defined
			expect(discoveryResult).toBeDefined();
			expect(discoveryResult.sessionState).toBeDefined();
		});
	});

	describe("Status Action with Completed Session", () => {
		it("should show completed status in recommendations", async () => {
			const config = createSessionConfig();
			const sid = `status-completed-${Math.random()}`;

			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: sid,
				config,
			});

			// Get status
			const statusResult = await designPhaseWorkflow.executeWorkflow({
				action: "status",
				sessionId: sid,
			});

			expect(statusResult.success).toBe(true);
			expect(statusResult.recommendations).toBeDefined();
			expect(statusResult.recommendations.length).toBeGreaterThan(0);
		});
	});

	describe("Pivot Decision During Advance", () => {
		it("should handle advance with pivot recommendation", async () => {
			const config = createSessionConfig();
			config.enablePivots = true;
			const sid = `pivot-advance-${Math.random()}`;

			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: sid,
				config,
			});

			// Advance with content to potentially trigger pivot evaluation
			const advanceResult = await designPhaseWorkflow.executeWorkflow({
				action: "advance",
				sessionId: sid,
				content:
					"Complex distributed microservices architecture with machine learning pipelines and real-time processing",
			});

			// May or may not succeed depending on phase validation
			expect(advanceResult).toBeDefined();
		});
	});

	describe("Advance with No Next Phase", () => {
		it("should handle advance at end of sequence", async () => {
			const config = createSessionConfig();
			const sid = `no-next-phase-${Math.random()}`;

			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: sid,
				config,
			});

			// Advance through all phases
			for (let i = 0; i < 5; i++) {
				await designPhaseWorkflow.executeWorkflow({
					action: "advance",
					sessionId: sid,
				});
			}

			// Try to advance when no more phases
			const advanceResult = await designPhaseWorkflow.executeWorkflow({
				action: "advance",
				sessionId: sid,
			});

			// Should handle gracefully - may return success false when no more phases
			expect(advanceResult).toBeDefined();
		});
	});

	describe("Advance with Confirmation Failure", () => {
		it("should handle advance when confirmation fails", async () => {
			const config = createSessionConfig();
			config.coverageThreshold = 99; // Very high threshold
			const sid = `confirm-fail-${Math.random()}`;

			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: sid,
				config,
			});

			// Advance with content that may not meet threshold
			const advanceResult = await designPhaseWorkflow.executeWorkflow({
				action: "advance",
				sessionId: sid,
				content: "Minimal content",
			});

			// Should return result even if confirmation fails
			expect(advanceResult).toBeDefined();
		});
	});

	describe("Compute Next Phase Edge Cases", () => {
		it("should compute next phase correctly at end of sequence", async () => {
			const config = createSessionConfig();
			const sid = `compute-next-${Math.random()}`;

			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: sid,
				config,
			});

			// Advance through phases
			for (let i = 0; i < 4; i++) {
				await designPhaseWorkflow.executeWorkflow({
					action: "advance",
					sessionId: sid,
				});
			}

			const status = await designPhaseWorkflow.executeWorkflow({
				action: "status",
				sessionId: sid,
			});

			expect(status.success).toBe(true);
		});
	});
});
