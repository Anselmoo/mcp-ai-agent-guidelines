import { describe, expect, it } from "vitest";
import { DesignArchitectureInputSchema } from "../../../../src/frameworks/design-architecture/types.js";

describe("DesignArchitectureInputSchema", () => {
	it("validates architecture action", () => {
		const parsed = DesignArchitectureInputSchema.parse({
			action: "architecture",
		});
		expect(parsed.action).toBe("architecture");
	});
});
