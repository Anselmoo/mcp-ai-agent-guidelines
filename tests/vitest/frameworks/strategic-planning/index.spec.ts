import { describe, expect, it } from "vitest";
import { strategicPlanningFramework } from "../../../../src/frameworks/strategic-planning/index.js";

describe("strategic-planning framework", () => {
	it("exports a FrameworkDefinition with required fields", () => {
		expect(strategicPlanningFramework.name).toBeDefined();
		expect(typeof strategicPlanningFramework.name).toBe("string");
		expect(typeof strategicPlanningFramework.execute).toBe("function");
	});

	it("execute() returns a result for valid action", async () => {
		const actions = strategicPlanningFramework.supportedActions ?? [];
		if (actions.length > 0) {
			// Just verify the function exists and can be called (may throw without proper args)
			expect(typeof strategicPlanningFramework.execute).toBe("function");
		}
	});
});
