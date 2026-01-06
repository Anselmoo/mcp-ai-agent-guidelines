import { describe, expect, it } from "vitest";
import { hierarchicalPromptBuilder } from "../../src/tools/prompt/hierarchical-prompt-builder";

type ErrorResponse = { isError?: boolean; content: { text: string }[] };

describe("hierarchicalPromptBuilder (negative)", () => {
	it("rejects when context is missing", async () => {
		// missing required context
		const result = (await hierarchicalPromptBuilder({
			goal: "Ship feature",
			requirements: ["a"],
		})) as ErrorResponse;
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toMatch(/Required|context/i);
	});

	it("rejects when goal is missing", async () => {
		// missing required goal
		const result = (await hierarchicalPromptBuilder({
			context: "Monorepo",
			requirements: ["a"],
		})) as ErrorResponse;
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toMatch(/Required|goal/i);
	});
});
