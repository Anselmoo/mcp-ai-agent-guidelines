import { describe, expect, it } from "vitest";
import { TestingInputSchema } from "../../../../src/frameworks/testing/types.js";

describe("TestingInputSchema", () => {
	it("validates suggest action", () => {
		const parsed = TestingInputSchema.parse({ action: "suggest" });
		expect(parsed.action).toBe("suggest");
	});
});
