import { describe, expect, it } from "vitest";
import { DocumentationInputSchema } from "../../../../src/frameworks/documentation/types.js";

describe("DocumentationInputSchema", () => {
	it("validates generate action", () => {
		const parsed = DocumentationInputSchema.parse({ action: "generate" });
		expect(parsed.action).toBe("generate");
	});
});
