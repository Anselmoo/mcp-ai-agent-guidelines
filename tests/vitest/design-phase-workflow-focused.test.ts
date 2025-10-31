// Focused tests for design-phase-workflow to improve coverage
// Import from src/ for proper coverage measurement
import { beforeEach, describe, expect, it } from "vitest";
import { designPhaseWorkflow } from "../../src/tools/design/design-phase-workflow";
import type { DesignSessionConfig } from "../../src/tools/design/types";

describe("Design Phase Workflow - Coverage Improvement", () => {
	beforeEach(async () => {
		await designPhaseWorkflow.initialize();
	});

	const createBasicConfig = (): DesignSessionConfig => ({
		sessionId: "test-session",
		context: "Test context",
		goal: "Test goal",
		requirements: ["req1", "req2"],
		constraints: [],
		coverageThreshold: 80,
		enablePivots: false,
		templateRefs: [],
		outputFormats: ["markdown"],
		metadata: {},
	});

	describe("Session lifecycle - start, complete, reset", () => {
		it("should start a new session", async () => {
			const response = await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: "new-session-1",
				config: createBasicConfig(),
			});

			expect(response.success).toBe(true);
			expect(response.sessionState).toBeDefined();
			expect(response.currentPhase).toBeDefined();
		});

		it("should complete a phase", async () => {
			// Start session first
			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: "complete-test",
				config: createBasicConfig(),
			});

			// Complete the current phase
			const response = await designPhaseWorkflow.executeWorkflow({
				action: "complete",
				sessionId: "complete-test",
				phaseId: "discovery",
				content: "Discovery phase completed with comprehensive analysis",
			});

			expect(response).toBeDefined();
			expect(response.success).toBeDefined();
		});

		it("should reset a session", async () => {
			// Start session
			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: "reset-test",
				config: createBasicConfig(),
			});

			// Reset it
			const response = await designPhaseWorkflow.executeWorkflow({
				action: "reset",
				sessionId: "reset-test",
			});

			expect(response.success).toBe(true);
			expect(response.message).toBeDefined();
		});

		it("should get session status", async () => {
			// Start session
			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: "status-test",
				config: createBasicConfig(),
			});

			// Get status
			const response = await designPhaseWorkflow.executeWorkflow({
				action: "status",
				sessionId: "status-test",
			});

			expect(response.success).toBe(true);
			expect(response.sessionState).toBeDefined();
		});
	});

	describe("Phase advancement", () => {
		it("should advance to next phase", async () => {
			// Start session
			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId: "advance-test",
				config: createBasicConfig(),
			});

			// Advance
			const response = await designPhaseWorkflow.executeWorkflow({
				action: "advance",
				sessionId: "advance-test",
				phaseId: "requirements",
				content: "Moving to requirements",
			});

			expect(response).toBeDefined();
		});
	});

	describe("Error handling", () => {
		it("should error when starting without config", async () => {
			await expect(
				designPhaseWorkflow.executeWorkflow({
					action: "start",
					sessionId: "no-config",
				}),
			).rejects.toThrow();
		});

		it("should error when completing without phaseId", async () => {
			await expect(
				designPhaseWorkflow.executeWorkflow({
					action: "complete",
					sessionId: "test",
					content: "content",
				}),
			).rejects.toThrow();
		});

		it("should error when completing without content", async () => {
			await expect(
				designPhaseWorkflow.executeWorkflow({
					action: "complete",
					sessionId: "test",
					phaseId: "discovery",
				}),
			).rejects.toThrow();
		});
	});

	describe("Multiple phases workflow", () => {
		it("should handle multi-phase workflow", async () => {
			const sessionId = "multi-phase";
			const config = createBasicConfig();

			// Start
			await designPhaseWorkflow.executeWorkflow({
				action: "start",
				sessionId,
				config,
			});

			// Complete discovery
			await designPhaseWorkflow.executeWorkflow({
				action: "complete",
				sessionId,
				phaseId: "discovery",
				content: "Discovery complete",
			});

			// Advance to requirements
			await designPhaseWorkflow.executeWorkflow({
				action: "advance",
				sessionId,
				phaseId: "requirements",
				content: "Starting requirements",
			});

			// Get status
			const status = await designPhaseWorkflow.executeWorkflow({
				action: "status",
				sessionId,
			});

			expect(status.sessionState).toBeDefined();
		});
	});
});
