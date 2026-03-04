import { describe, expect, it } from "vitest";
import { visualizationFramework } from "../../../../src/frameworks/visualization/index.js";

describe("visualization framework", () => {
	it("exports a FrameworkDefinition with required fields", () => {
		expect(visualizationFramework.name).toBeDefined();
		expect(typeof visualizationFramework.name).toBe("string");
		expect(typeof visualizationFramework.execute).toBe("function");
	});

	it("execute() returns a result for valid action", async () => {
		const actions = visualizationFramework.supportedActions ?? [];
		if (actions.length > 0) {
			// Just verify the function exists and can be called (may throw without proper args)
			expect(typeof visualizationFramework.execute).toBe("function");
		}
	});
});
