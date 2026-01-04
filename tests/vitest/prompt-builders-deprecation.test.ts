import { beforeEach, describe, expect, it, vi } from "vitest";
// Import all 6 prompt builders
import { hierarchicalPromptBuilder } from "../../src/tools/prompt/hierarchical-prompt-builder.js";
import { hierarchyLevelSelector } from "../../src/tools/prompt/hierarchy-level-selector.js";
import { promptChainingBuilder } from "../../src/tools/prompt/prompt-chaining-builder.js";
import { promptFlowBuilder } from "../../src/tools/prompt/prompt-flow-builder.js";
import { promptingHierarchyEvaluator } from "../../src/tools/prompt/prompting-hierarchy-evaluator.js";
import { quickDeveloperPromptsBuilder } from "../../src/tools/prompt/quick-developer-prompts-builder.js";
import { resetDeprecationWarnings } from "../../src/tools/shared/deprecation.js";
import { logger } from "../../src/tools/shared/logger.js";

describe("Prompt Builder Deprecation Warnings", () => {
	beforeEach(() => {
		resetDeprecationWarnings();
		vi.clearAllMocks();
	});

	it("hierarchical-prompt-builder emits deprecation warning", async () => {
		const warnSpy = vi.spyOn(logger, "warn");

		await hierarchicalPromptBuilder({
			context: "Test context",
			goal: "Test goal",
		});

		expect(warnSpy).toHaveBeenCalled();
		const call = warnSpy.mock.calls[0];
		expect(call[0]).toContain("hierarchical-prompt-builder");
		expect(call[0]).toContain("deprecated");
		expect(call[0]).toContain("prompt-hierarchy");
		expect(call[0]).toContain("v0.14.0");
		expect(call[0]).toContain("v0.15.0");
	});

	it("prompting-hierarchy-evaluator emits deprecation warning", async () => {
		const warnSpy = vi.spyOn(logger, "warn");

		await promptingHierarchyEvaluator({
			promptText: "Test prompt",
		});

		expect(warnSpy).toHaveBeenCalled();
		const call = warnSpy.mock.calls[0];
		expect(call[0]).toContain("prompting-hierarchy-evaluator");
		expect(call[0]).toContain("deprecated");
		expect(call[0]).toContain("prompt-hierarchy");
	});

	it("hierarchy-level-selector emits deprecation warning", async () => {
		const warnSpy = vi.spyOn(logger, "warn");

		await hierarchyLevelSelector({
			taskDescription: "Test task",
		});

		expect(warnSpy).toHaveBeenCalled();
		const call = warnSpy.mock.calls[0];
		expect(call[0]).toContain("hierarchy-level-selector");
		expect(call[0]).toContain("deprecated");
		expect(call[0]).toContain("prompt-hierarchy");
	});

	it("prompt-chaining-builder emits deprecation warning", async () => {
		const warnSpy = vi.spyOn(logger, "warn");

		await promptChainingBuilder({
			chainName: "Test chain",
			steps: [
				{
					name: "step1",
					prompt: "Test prompt",
				},
			],
		});

		expect(warnSpy).toHaveBeenCalled();
		const call = warnSpy.mock.calls[0];
		expect(call[0]).toContain("prompt-chaining-builder");
		expect(call[0]).toContain("deprecated");
		expect(call[0]).toContain("prompt-hierarchy");
	});

	it("prompt-flow-builder emits deprecation warning", async () => {
		const warnSpy = vi.spyOn(logger, "warn");

		await promptFlowBuilder({
			flowName: "Test flow",
			nodes: [
				{
					id: "node1",
					type: "prompt",
					name: "Test node",
					config: { prompt: "Test prompt" },
				},
			],
		});

		expect(warnSpy).toHaveBeenCalled();
		const call = warnSpy.mock.calls[0];
		expect(call[0]).toContain("prompt-flow-builder");
		expect(call[0]).toContain("deprecated");
		expect(call[0]).toContain("prompt-hierarchy");
	});

	it("quick-developer-prompts-builder emits deprecation warning", async () => {
		const warnSpy = vi.spyOn(logger, "warn");

		await quickDeveloperPromptsBuilder({
			category: "all",
		});

		expect(warnSpy).toHaveBeenCalled();
		const call = warnSpy.mock.calls[0];
		expect(call[0]).toContain("quick-developer-prompts-builder");
		expect(call[0]).toContain("deprecated");
		expect(call[0]).toContain("prompt-hierarchy");
	});

	it("all tools emit warnings only once per session", async () => {
		const warnSpy = vi.spyOn(logger, "warn");

		// Call each tool twice
		await hierarchicalPromptBuilder({ context: "Test", goal: "Test" });
		await hierarchicalPromptBuilder({ context: "Test2", goal: "Test2" });

		await promptingHierarchyEvaluator({ promptText: "Test" });
		await promptingHierarchyEvaluator({ promptText: "Test2" });

		await hierarchyLevelSelector({ taskDescription: "Test" });
		await hierarchyLevelSelector({ taskDescription: "Test2" });

		await promptChainingBuilder({
			chainName: "Test",
			steps: [{ name: "s1", prompt: "p1" }],
		});
		await promptChainingBuilder({
			chainName: "Test2",
			steps: [{ name: "s2", prompt: "p2" }],
		});

		await promptFlowBuilder({
			flowName: "Test",
			nodes: [
				{
					id: "n1",
					type: "prompt",
					name: "N1",
					config: { prompt: "Test" },
				},
			],
		});
		await promptFlowBuilder({
			flowName: "Test2",
			nodes: [
				{
					id: "n2",
					type: "prompt",
					name: "N2",
					config: { prompt: "Test2" },
				},
			],
		});

		await quickDeveloperPromptsBuilder({ category: "all" });
		await quickDeveloperPromptsBuilder({ category: "testing" });

		// Should have exactly 6 warning calls (one per tool)
		expect(warnSpy).toHaveBeenCalledTimes(6);
	});
});
