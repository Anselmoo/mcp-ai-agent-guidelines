import { describe, expect, it } from "vitest";
import { SecurityInputSchema } from "../../../../src/frameworks/security/types.js";

describe("SecurityInputSchema", () => {
	it("validates assess action", () => {
		const parsed = SecurityInputSchema.parse({ action: "assess" });
		expect(parsed.action).toBe("assess");
	});
});
