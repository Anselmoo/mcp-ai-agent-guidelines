import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../src/tools/prompt/hierarchical-prompt-builder.js", () => ({
	hierarchicalPromptBuilder: vi
		.fn()
		.mockResolvedValue({ content: [{ type: "text", text: "ok" }] }),
}));
vi.mock("../../../../src/tools/prompt/prompt-hierarchy.js", () => ({
	promptHierarchy: vi
		.fn()
		.mockResolvedValue({ content: [{ type: "text", text: "ok" }] }),
}));
vi.mock("../../../../src/tools/prompt/hierarchy-level-selector.js", () => ({
	hierarchyLevelSelector: vi
		.fn()
		.mockResolvedValue({ content: [{ type: "text", text: "ok" }] }),
}));
vi.mock("../../../../src/tools/prompt/prompt-chaining-builder.js", () => ({
	promptChainingBuilder: vi
		.fn()
		.mockResolvedValue({ content: [{ type: "text", text: "ok" }] }),
}));
vi.mock("../../../../src/tools/prompt/prompt-flow-builder.js", () => ({
	promptFlowBuilder: vi
		.fn()
		.mockResolvedValue({ content: [{ type: "text", text: "ok" }] }),
}));

import { routePromptEngineeringAction } from "../../../../src/frameworks/prompt-engineering/router.js";

describe("routePromptEngineeringAction", () => {
	it("handles 'build' action", async () => {
		const result = await routePromptEngineeringAction({
			action: "build",
			context: "ctx",
			goal: "g",
		});
		expect(result).toBeDefined();
	});

	it("handles 'evaluate' action", async () => {
		const result = await routePromptEngineeringAction({
			action: "evaluate",
			promptText: "test",
		});
		expect(result).toBeDefined();
	});

	it("handles 'select-level' action", async () => {
		const result = await routePromptEngineeringAction({
			action: "select-level",
			taskDescription: "task",
		});
		expect(result).toBeDefined();
	});

	it("throws for unknown action", async () => {
		await expect(
			routePromptEngineeringAction({ action: "unknown" as any }),
		).rejects.toThrow();
	});
});
