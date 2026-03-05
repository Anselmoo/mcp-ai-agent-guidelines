import { describe, expect, it } from "vitest";
import { PromptEngineeringInputSchema } from "../../../../src/frameworks/prompt-engineering/types.js";

describe("PromptEngineeringInputSchema", () => {
	it("validates a build action", () => {
		const parsed = PromptEngineeringInputSchema.parse({ action: "build" });
		expect(parsed.action).toBe("build");
	});

	it("rejects invalid action", () => {
		expect(() =>
			PromptEngineeringInputSchema.parse({ action: "invalid" }),
		).toThrow();
	});
});
