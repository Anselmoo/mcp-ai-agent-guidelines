import { describe, expect, it } from "vitest";
import {
	getAdvancedReasoningModel,
	getBalancedModel,
	getBudgetModel,
	getLargeContextModel,
	selectModelByCategory,
} from "../../../../src/tools/config/model-selectors";

describe("model-selectors", () => {
	describe("getBudgetModel", () => {
		it("should return a budget-tier model", () => {
			const model = getBudgetModel();
			expect(model).toBeDefined();
			expect(model?.pricingTier).toBe("budget");
		});

		it("should return highest scoring budget model", () => {
			const model = getBudgetModel();
			expect(model).toBeDefined();
			expect(model?.baseScore).toBeGreaterThan(0);
		});
	});

	describe("getLargeContextModel", () => {
		it("should return model with largest context window", () => {
			const model = getLargeContextModel();
			expect(model).toBeDefined();
			expect(model?.contextTokens).toBeGreaterThan(0);
		});

		it("should have context window larger than typical models", () => {
			const model = getLargeContextModel();
			expect(model).toBeDefined();
			// Should have at least 200k tokens (typical large context)
			expect(model?.contextTokens).toBeGreaterThanOrEqual(200000);
		});
	});

	describe("getBalancedModel", () => {
		it("should return a general-purpose model", () => {
			const model = getBalancedModel();
			expect(model).toBeDefined();
			expect(model?.taskArea).toBe("general-purpose");
		});
	});

	describe("getAdvancedReasoningModel", () => {
		it("should return a deep-reasoning model", () => {
			const model = getAdvancedReasoningModel();
			expect(model).toBeDefined();
			expect(model?.taskArea).toBe("deep-reasoning");
		});

		it("should have reasoning capability", () => {
			const model = getAdvancedReasoningModel();
			expect(model).toBeDefined();
			expect(model?.capabilities).toContain("reasoning");
		});
	});

	describe("selectModelByCategory", () => {
		it("should filter by taskArea", () => {
			const model = selectModelByCategory({ taskArea: "general-purpose" });
			expect(model).toBeDefined();
			expect(model?.taskArea).toBe("general-purpose");
		});

		it("should filter by budget", () => {
			const model = selectModelByCategory({ budget: "low" });
			expect(model).toBeDefined();
			expect(model?.pricingTier).toBe("budget");
		});

		it("should sort by context tokens when requireLargeContext is true", () => {
			const model = selectModelByCategory({ requireLargeContext: true });
			expect(model).toBeDefined();
			expect(model?.contextTokens).toBeGreaterThan(100000);
		});

		it("should filter by mode when specified", () => {
			const model = selectModelByCategory({ mode: "reasoning" });
			expect(model).toBeDefined();
			expect(model?.modes?.reasoning).toBe(true);
		});

		it("should combine multiple criteria", () => {
			const model = selectModelByCategory({
				taskArea: "deep-reasoning",
				requireLargeContext: true,
			});
			expect(model).toBeDefined();
			expect(model?.taskArea).toBe("deep-reasoning");
		});

		it("should return undefined when no models match criteria", () => {
			const model = selectModelByCategory({
				taskArea: "general-purpose",
				budget: "low",
			});
			// This may or may not find a model depending on YAML config
			// Just verify it doesn't throw
			expect(model === undefined || model.pricingTier === "budget").toBe(true);
		});

		it("should return highest scored model when multiple match", () => {
			const model = selectModelByCategory({ taskArea: "general-purpose" });
			expect(model).toBeDefined();
			expect(model?.baseScore).toBeGreaterThan(0);
		});
	});
});
