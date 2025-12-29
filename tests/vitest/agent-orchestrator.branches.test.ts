import { describe, expect, it } from "vitest";
import { agentOrchestrator } from "../../src/tools/agent-orchestrator.js";

describe("agent-orchestrator - missing parameter branches", () => {
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
