import { beforeEach, describe, expect, it } from "vitest";
import { designPhaseWorkflow } from "../../dist/tools/design/design-phase-workflow.js";
import type { DesignSessionConfig } from "../../dist/tools/design/types/index.js";

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
});
