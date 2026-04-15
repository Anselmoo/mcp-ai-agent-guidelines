import { describe, expect, it } from "vitest";
import {
	dispatchOrchestrationToolCall,
	ORCHESTRATION_TOOL_DEFINITIONS,
	ORCHESTRATION_TOOL_VALIDATORS,
} from "../../tools/orchestration-tools.js";

function getFirstTextContent(
	result: Awaited<ReturnType<typeof dispatchOrchestrationToolCall>>,
): string {
	const firstContentItem = result.content[0];

	expect(firstContentItem?.type).toBe("text");
	return firstContentItem?.type === "text" ? firstContentItem.text : "";
}

describe("orchestration-tools", () => {
	it("publishes a single orchestration-config tool definition", () => {
		expect(ORCHESTRATION_TOOL_DEFINITIONS.map((tool) => tool.name)).toEqual([
			"orchestration-config",
		]);
		expect(
			ORCHESTRATION_TOOL_DEFINITIONS.every((tool) =>
				ORCHESTRATION_TOOL_VALIDATORS.has(tool.name),
			),
		).toBe(true);
	});

	it("reads orchestration config and rejects unknown tool names", async () => {
		const readResult = await dispatchOrchestrationToolCall(
			"orchestration-config",
			{ command: "read" },
		);
		const unknownResult = await dispatchOrchestrationToolCall(
			"missing-tool",
			{},
		);
		const readResultText = getFirstTextContent(readResult);
		const unknownResultText = getFirstTextContent(unknownResult);

		expect(readResult.isError).toBe(false);
		expect(JSON.parse(readResultText)).toHaveProperty("config");
		expect(JSON.parse(readResultText)).toHaveProperty(
			"derivedModelAvailability",
		);
		expect(JSON.parse(readResultText)).toHaveProperty("snapshotContext");
		expect(unknownResult.isError).toBe(true);
		expect(unknownResultText).toContain("Unknown orchestration tool");
	});

	it("rejects invalid argument types before dispatching orchestration tools", async () => {
		const result = await dispatchOrchestrationToolCall("orchestration-config", {
			command: "write",
			resetToDefaults: "yes",
		} as Record<string, unknown>);
		const resultText = getFirstTextContent(result);

		expect(result.isError).toBe(true);
		expect(resultText).toContain("Invalid input");
		expect(resultText).toContain("orchestration-config");
	});

	it("rejects unsupported top-level config keys so derived availability stays read-only", async () => {
		const result = await dispatchOrchestrationToolCall("orchestration-config", {
			command: "write",
			patch: {
				modelAvailability: {
					gemini: { available: true },
				},
			},
		} as Record<string, unknown>);
		const resultText = getFirstTextContent(result);

		expect(result.isError).toBe(true);
		expect(resultText).toContain("unsupported top-level keys");
		expect(resultText).toContain("modelAvailability");
	});

	it("rejects type-invalid sub-object fields in a patch before writing to disk", async () => {
		// strict_mode must be boolean; sending a string must fail at write time
		// rather than silently persisting a corrupt file.
		const result = await dispatchOrchestrationToolCall("orchestration-config", {
			command: "write",
			patch: {
				environment: {
					strict_mode: "yes",
					default_max_context: 128_000,
					enable_cost_tracking: false,
				},
			},
		} as Record<string, unknown>);
		const resultText = getFirstTextContent(result);

		expect(result.isError).toBe(true);
		expect(resultText).toMatch(/strict_mode|boolean/i);
	});

	it("rejects type-invalid model provider values in a config replacement before writing to disk", async () => {
		// provider must be "openai" | "anthropic"; an unknown value must be
		// rejected before the merged config ever reaches saveOrchestrationConfig.
		const result = await dispatchOrchestrationToolCall("orchestration-config", {
			command: "write",
			config: {
				models: {
					model_x: {
						id: "some-model",
						provider: "azure",
						available: true,
						context_window: 128_000,
					},
				},
			},
		} as Record<string, unknown>);
		const resultText = getFirstTextContent(result);

		expect(result.isError).toBe(true);
		expect(resultText).toMatch(/anthropic|openai|provider/i);
	});
});
