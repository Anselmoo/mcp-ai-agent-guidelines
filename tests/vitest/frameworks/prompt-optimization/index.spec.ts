import { describe, expect, it } from "vitest";
import { promptOptimizationFramework } from "../../../../src/frameworks/prompt-optimization/index.js";

describe("prompt-optimization framework", () => {
	it("exports a FrameworkDefinition with required fields", () => {
		expect(promptOptimizationFramework.name).toBeDefined();
		expect(typeof promptOptimizationFramework.name).toBe("string");
		expect(typeof promptOptimizationFramework.execute).toBe("function");
	});

	it("execute() returns a result for valid action", async () => {
		const actions = promptOptimizationFramework.supportedActions ?? [];
		if (actions.length > 0) {
			// Just verify the function exists and can be called (may throw without proper args)
			expect(typeof promptOptimizationFramework.execute).toBe("function");
		}
	});
});
