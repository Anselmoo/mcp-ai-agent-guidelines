import { beforeEach, describe, expect, it } from "vitest";
import { confirmationModule } from "../../src/tools/design/confirmation-module.ts";
import type { DesignSessionState } from "../../src/tools/design/types/index.ts";

describe("Confirmation Module - Phase 2", () => {
	beforeEach(async () => {
		await confirmationModule.initialize();
	});

	const createSession = (): DesignSessionState => ({
		config: {
			sessionId: `phase2-${Math.random()}`,
			context: "Phase 2 confirmation testing",
			goal: "Test confirmation flows",
			requirements: ["req-1"],
			constraints: [
				{
					id: "c1",
					name: "Test",
					type: "non-functional",
					category: "performance",
					description: "Test",
					validation: { minCoverage: 80 },
					weight: 1,
					mandatory: true,
					source: "test",
				},
			],
			coverageThreshold: 85,
			enablePivots: false,
			templateRefs: [],
			outputFormats: ["markdown"],
			metadata: { phase: "2" },
		},
		currentPhase: "design",
		phases: {
			discovery: {
				id: "discovery",
				name: "Discovery",
				description: "Discovery",
				status: "completed",
				inputs: [],
				outputs: [],
				criteria: [],
				coverage: 100,
				artifacts: [],
				dependencies: [],
			},
			design: {
				id: "design",
				name: "Design",
				description: "Design",
				status: "in-progress",
				inputs: [],
				outputs: [],
				criteria: [],
				coverage: 75,
				artifacts: [],
				dependencies: ["discovery"],
			},
		},
		coverage: {
			overall: 75,
			phases: { discovery: 100, design: 75 },
			constraints: { c1: 80 },
			assumptions: [],
			documentation: [],
			testCoverage: 75,
		},
		artifacts: [],
		history: [],
		status: "active",
	});

	describe("Public API - confirmPhase", () => {
		it("should confirm design phase", async () => {
			const session = createSession();
			const result = await confirmationModule.confirmPhase(
				session,
				"design",
				"Test content",
			);
			expect(result).toBeDefined();
		});

		it("should confirm discovery phase", async () => {
			const session = createSession();
			const result = await confirmationModule.confirmPhase(
				session,
				"discovery",
				"Content",
			);
			expect(result).toBeDefined();
		});

		it("should handle non-existent phase", async () => {
			const session = createSession();
			const result = await confirmationModule.confirmPhase(
				session,
				"non-existent",
				"content",
			);
			expect(result.passed).toBe(false);
		});

		it("should confirm with empty content", async () => {
			const session = createSession();
			const result = await confirmationModule.confirmPhase(
				session,
				"design",
				"",
			);
			expect(result).toBeDefined();
		});
	});

	describe("Confirmation validation", () => {
		it("should validate phase status before confirmation", async () => {
			const session = createSession();
			const result = await confirmationModule.confirmPhase(
				session,
				"design",
				"Test",
			);
			expect(result).toHaveProperty("passed");
			expect(result).toHaveProperty("phase");
		});

		it("should handle multiple confirmations", async () => {
			const session = createSession();
			const result1 = await confirmationModule.confirmPhase(
				session,
				"design",
				"First",
			);
			const result2 = await confirmationModule.confirmPhase(
				session,
				"design",
				"Second",
			);
			expect(result1).toBeDefined();
			expect(result2).toBeDefined();
		});
	});
});
