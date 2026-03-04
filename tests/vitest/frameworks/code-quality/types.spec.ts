import { describe, expect, it } from "vitest";
import { CodeQualityInputSchema } from "../../../../src/frameworks/code-quality/types.js";

describe("CodeQualityInputSchema", () => {
	it("validates a score action", () => {
		const parsed = CodeQualityInputSchema.parse({ action: "score" });
		expect(parsed.action).toBe("score");
	});

	it("rejects invalid action", () => {
		expect(() => CodeQualityInputSchema.parse({ action: "invalid" })).toThrow();
	});
});
