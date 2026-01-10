/**
 * OLD agent-orchestrator branch tests for template/custom mode API
 * This API is being replaced by the new action-based API (see P3-014).
 * Tests for the new API are in agent-orchestrator.integration.spec.ts
 */
import { describe, expect, it } from "vitest";

// Local stub for the deprecated agentOrchestrator API.
// These tests are skipped, so this function should never be executed.
const agentOrchestrator = async (_options: unknown): Promise<unknown> => {
	throw new Error(
		"agentOrchestrator (OLD API) is no longer available. Use the new action-based API tests instead.",
	);
};

describe.skip("agent-orchestrator - missing parameter branches - OLD API", () => {
	it("returns error response and triggers trace end when template missing and includeTrace=true", async () => {
		const result = await agentOrchestrator({
			mode: "template",
			includeTrace: true,
		});
		expect(result.isError).toBe(true);
		const parsed = JSON.parse(result.content[0].text);
		expect(parsed.error).toContain(
			"Template name is required for template mode",
		);
	});

	it("returns error response and triggers trace end when executionPlan missing and includeTrace=true", async () => {
		const result = await agentOrchestrator({
			mode: "custom",
			includeTrace: true,
		});
		expect(result.isError).toBe(true);
		const parsed = JSON.parse(result.content[0].text);
		expect(parsed.error).toContain(
			"Execution plan is required for custom mode",
		);
	});

	it("rejects when schema validation fails for invalid template value", async () => {
		await expect(
			agentOrchestrator({ mode: "template", template: "invalid-template" }),
		).rejects.toThrow();
	});
});
