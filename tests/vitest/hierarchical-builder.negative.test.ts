import { describe, expect, it } from "vitest";
import { hierarchicalPromptBuilder } from "../../src/tools/hierarchical-prompt-builder";

describe("hierarchicalPromptBuilder (negative)", () => {
	it("rejects when context is missing", async () => {
		// missing required context
		await expect(
			hierarchicalPromptBuilder({ goal: "Ship feature", requirements: ["a"] }),
		).rejects.toThrow(/ZodError|Required/i);
	});

	it("rejects when goal is missing", async () => {
		// missing required goal
		await expect(
			hierarchicalPromptBuilder({ context: "Monorepo", requirements: ["a"] }),
		).rejects.toThrow(/ZodError|Required/i);
	});
});
