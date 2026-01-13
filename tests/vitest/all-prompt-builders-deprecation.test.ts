import { beforeEach, describe, expect, it, vi } from "vitest";
import { hierarchicalPromptBuilder } from "../../src/tools/prompt/hierarchical-prompt-builder.js";
import { hierarchyLevelSelector } from "../../src/tools/prompt/hierarchy-level-selector.js";
import { promptChainingBuilder } from "../../src/tools/prompt/prompt-chaining-builder.js";
import { promptFlowBuilder } from "../../src/tools/prompt/prompt-flow-builder.js";
import { promptingHierarchyEvaluator } from "../../src/tools/prompt/prompting-hierarchy-evaluator.js";
import { quickDeveloperPromptsBuilder } from "../../src/tools/prompt/quick-developer-prompts-builder.js";
import { resetDeprecationWarnings } from "../../src/tools/shared/deprecation.js";
import { logger } from "../../src/tools/shared/logger.js";

describe("All prompt builders emit deprecation warnings", () => {
	beforeEach(() => {
		resetDeprecationWarnings();
		vi.clearAllMocks();
	});

	const verifyDeprecationWarning = (
		toolName: string,
		warnSpy: ReturnType<typeof vi.spyOn>,
	) => {
		const deprecationCall = warnSpy.mock.calls.find(
			(call) => typeof call[0] === "string" && call[0].includes(toolName),
		);

		expect(deprecationCall).toBeDefined();
		expect(deprecationCall?.[0]).toContain("deprecated since v0.14.0");
		expect(deprecationCall?.[0]).toContain('Use "prompt-hierarchy" instead');
		expect(deprecationCall?.[0]).toContain("Will be removed in v0.15.0");

		// Verify context
		const context = deprecationCall?.[1];
		expect(context).toHaveProperty("type", "deprecation");
		expect(context).toHaveProperty("tool", toolName);
		expect(context).toHaveProperty("replacement", "prompt-hierarchy");
		expect(context).toHaveProperty("deprecatedIn", "v0.14.0");
		expect(context).toHaveProperty("removedIn", "v0.15.0");
	};

	it("hierarchical-prompt-builder emits deprecation warning", async () => {
		const warnSpy = vi.spyOn(logger, "warn");

		await hierarchicalPromptBuilder({
			context: "Test context",
			goal: "Test goal",
		});

		verifyDeprecationWarning("hierarchical-prompt-builder", warnSpy);
	});

	it("prompting-hierarchy-evaluator emits deprecation warning", async () => {
		const warnSpy = vi.spyOn(logger, "warn");

		await promptingHierarchyEvaluator({
			promptText: "Test prompt",
		});

		verifyDeprecationWarning("prompting-hierarchy-evaluator", warnSpy);
	});

	it("hierarchy-level-selector emits deprecation warning", async () => {
		const warnSpy = vi.spyOn(logger, "warn");

		await hierarchyLevelSelector({
			taskDescription: "Test task",
		});

		verifyDeprecationWarning("hierarchy-level-selector", warnSpy);
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

		verifyDeprecationWarning("prompt-chaining-builder", warnSpy);
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
					config: {
						prompt: "Test prompt",
					},
				},
			],
		});

		verifyDeprecationWarning("prompt-flow-builder", warnSpy);
	});

	it("quick-developer-prompts-builder emits deprecation warning", async () => {
		const warnSpy = vi.spyOn(logger, "warn");

		await quickDeveloperPromptsBuilder({
			category: "all",
		});

		verifyDeprecationWarning("quick-developer-prompts-builder", warnSpy);
	});
});
