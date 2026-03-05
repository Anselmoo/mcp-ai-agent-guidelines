import { describe, expect, it } from "vitest";
import type { FrameworkDefinition } from "../../../src/frameworks/types.js";

describe("FrameworkDefinition type", () => {
	it("can be satisfied with required fields", () => {
		const fw: FrameworkDefinition = {
			name: "test",
			description: "Test framework",
			version: "1.0.0",
			actions: ["do-thing"],
			schema: {} as any,
			execute: async (_input) => ({ content: [] }),
		};
		expect(fw.name).toBe("test");
		expect(fw.actions).toHaveLength(1);
	});
});
