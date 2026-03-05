import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../src/tools/clean-code-scorer.js", () => ({
	cleanCodeScorer: vi
		.fn()
		.mockResolvedValue({ content: [{ type: "text", text: "ok" }] }),
}));
vi.mock("../../../../src/tools/code-hygiene-analyzer.js", () => ({
	codeHygieneAnalyzer: vi
		.fn()
		.mockResolvedValue({ content: [{ type: "text", text: "ok" }] }),
}));
vi.mock("../../../../src/tools/iterative-coverage-enhancer.js", () => ({
	iterativeCoverageEnhancer: vi
		.fn()
		.mockResolvedValue({ content: [{ type: "text", text: "ok" }] }),
}));
vi.mock("../../../../src/tools/semantic-code-analyzer.js", () => ({
	semanticCodeAnalyzer: vi
		.fn()
		.mockResolvedValue({ content: [{ type: "text", text: "ok" }] }),
}));

import { routeCodeQualityAction } from "../../../../src/frameworks/code-quality/router.js";

describe("routeCodeQualityAction", () => {
	it("handles 'score' action", async () => {
		const result = await routeCodeQualityAction({ action: "score" });
		expect(result).toBeDefined();
	});

	it("handles 'hygiene' action", async () => {
		const result = await routeCodeQualityAction({
			action: "hygiene",
			codeContent: "x",
		});
		expect(result).toBeDefined();
	});

	it("throws for unknown action", async () => {
		await expect(
			routeCodeQualityAction({ action: "unknown" as any }),
		).rejects.toThrow();
	});
});
