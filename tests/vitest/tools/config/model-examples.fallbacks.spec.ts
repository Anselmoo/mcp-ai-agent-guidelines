import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../src/tools/config/model-selectors", () => ({
	getBudgetModel: vi.fn(),
	getLargeContextModel: vi.fn(),
	getBalancedModel: vi.fn(),
	getAdvancedReasoningModel: vi.fn(),
}));

import {
	generatePythonExample,
	generateTypeScriptExample,
} from "../../../../src/tools/config/model-examples";
import {
	getAdvancedReasoningModel,
	getBalancedModel,
	getBudgetModel,
	getLargeContextModel,
} from "../../../../src/tools/config/model-selectors";

describe("model-examples fallback coverage", () => {
	const mockBudgetModel = vi.mocked(getBudgetModel);
	const mockLargeContextModel = vi.mocked(getLargeContextModel);
	const mockBalancedModel = vi.mocked(getBalancedModel);
	const mockAdvancedReasoningModel = vi.mocked(getAdvancedReasoningModel);

	beforeEach(() => {
		vi.clearAllMocks();
		mockBudgetModel.mockReturnValue(undefined);
		mockLargeContextModel.mockReturnValue(undefined);
		mockBalancedModel.mockReturnValue(undefined);
		mockAdvancedReasoningModel.mockReturnValue(undefined);
	});

	it("uses fallback placeholders when selectors return undefined", () => {
		const pythonExample = generatePythonExample();
		const tsExample = generateTypeScriptExample();

		expect(pythonExample).toContain("budget-model");
		expect(pythonExample).toContain("large-context-model");
		expect(pythonExample).toContain("balanced-model");
		expect(pythonExample).toContain("budget/fast");
		expect(pythonExample).toContain("large context");

		expect(tsExample).toContain("provider: 'google'");
		expect(tsExample).toContain("provider: 'anthropic'");
		expect(tsExample).toContain("provider: 'openai'");
		expect(tsExample).toContain("advanced-model");
	});

	it("uses selector data when model metadata exists", () => {
		mockBudgetModel.mockReturnValue({
			name: "gpt-5-mini",
			provider: "OPENAI",
			strengths: ["low-latency"],
		} as NonNullable<ReturnType<typeof getBudgetModel>>);
		mockLargeContextModel.mockReturnValue({
			name: "gemini-2.5-pro",
			provider: "GOOGLE",
			strengths: ["long-context"],
			contextTokens: 1200000,
		} as NonNullable<ReturnType<typeof getLargeContextModel>>);
		mockBalancedModel.mockReturnValue({
			name: "claude-sonnet-4.6",
			provider: "ANTHROPIC",
			strengths: ["balanced"],
		} as NonNullable<ReturnType<typeof getBalancedModel>>);
		mockAdvancedReasoningModel.mockReturnValue({
			name: "o3-pro",
			provider: "OPENAI",
			strengths: ["reasoning"],
		} as NonNullable<ReturnType<typeof getAdvancedReasoningModel>>);

		const pythonExample = generatePythonExample();
		const tsExample = generateTypeScriptExample();

		expect(pythonExample).toContain("gpt-5-mini");
		expect(pythonExample).toContain("gemini-2.5-pro");
		expect(pythonExample).toContain("claude-sonnet-4.6");
		expect(pythonExample).toContain("1.2M context");
		expect(pythonExample).toContain("low-latency");

		expect(tsExample).toContain("provider: 'google'");
		expect(tsExample).toContain("provider: 'openai'");
		expect(tsExample).toContain("provider: 'anthropic'");
		expect(tsExample).toContain("model: 'o3-pro'");
	});
});
