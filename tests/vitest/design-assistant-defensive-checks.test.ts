// Regression test for design-assistant defensive array checks
import { beforeAll, describe, expect, it } from "vitest";
import { designAssistant } from "../../src/tools/design/index.ts";

describe("Design Assistant - Defensive Array Checks", () => {
	beforeAll(async () => {
		await designAssistant.initialize();
	});

	it("should handle generate-enforcement-prompts without crashing on edge cases", async () => {
		const response = await designAssistant.processRequest({
			action: "generate-enforcement-prompts",
			sessionId: "defensive-test-1",
		});

		// Verify response structure
		expect(response.success).toBe(true);
		expect(response.sessionId).toBe("defensive-test-1");
		expect(response.status).toBe("prompts-generated");
		expect(response.message).toContain("enforcement prompts");

		// Verify recommendations is always an array
		expect(Array.isArray(response.recommendations)).toBe(true);
		expect(response.recommendations.length).toBeGreaterThanOrEqual(0);

		// Verify data contains prompts array
		expect(response.data?.prompts).toBeDefined();
		expect(Array.isArray(response.data?.prompts)).toBe(true);
	});

	it("should handle generate-artifacts without crashing when recommendations are missing", async () => {
		// First start a session
		await designAssistant.processRequest({
			action: "start-session",
			sessionId: "defensive-test-2",
			config: {
				sessionId: "defensive-test-2",
				context: "Test context",
				goal: "Test goal",
				requirements: ["req1"],
				constraints: [],
				coverageThreshold: 85,
				enablePivots: true,
				templateRefs: [],
				outputFormats: ["markdown"],
				metadata: {},
			},
		});

		// Generate artifacts
		const response = await designAssistant.processRequest({
			action: "generate-artifacts",
			sessionId: "defensive-test-2",
			artifactTypes: ["adr", "specification", "roadmap"],
		});

		// Verify response
		expect(response.success).toBe(true);
		expect(Array.isArray(response.recommendations)).toBe(true);
		expect(Array.isArray(response.artifacts)).toBe(true);
	});

	it("should handle enforce-cross-session-consistency with defensive checks", async () => {
		const response = await designAssistant.processRequest({
			action: "enforce-cross-session-consistency",
			sessionId: "defensive-test-3",
		});

		// Verify response structure
		expect(response.success).toBe(true);
		expect(Array.isArray(response.recommendations)).toBe(true);
		expect(response.data?.consistencyReport).toBeDefined();

		// Verify violations count defaults to 0 if undefined
		expect(typeof response.data?.violationsCount).toBe("number");
		expect(response.data?.violationsCount).toBeGreaterThanOrEqual(0);
	});

	it("should never throw 'Cannot read properties of undefined (reading map)' error", async () => {
		// This test ensures the specific error from the bug report doesn't occur
		const actions = [
			"generate-enforcement-prompts",
			"generate-constraint-documentation",
			"enforce-cross-session-consistency",
		] as const;

		for (const action of actions) {
			const promise = designAssistant.processRequest({
				action,
				sessionId: `defensive-test-action-${action}`,
			});

			await expect(promise).resolves.not.toThrow();
		}
	});

	it("should handle empty or malformed data gracefully", async () => {
		await expect(
			designAssistant.processRequest({
				action: "get-status",
				sessionId: "non-existent-session",
			}),
		).rejects.toThrow("Session not found");
	});
});
