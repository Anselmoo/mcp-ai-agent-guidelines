import { describe, expect, it } from "vitest";
import { memoryContextOptimizer } from "../../src/tools/memory-context-optimizer";

describe("memory-context-optimizer additional edge cases", () => {
	it("handles different cache strategy branches", async () => {
		const strategies = ["aggressive", "balanced", "conservative"];
		for (const strategy of strategies) {
			const res = await memoryContextOptimizer({
				contextContent: "Test content for " + strategy,
				cacheStrategy: strategy as any,
			});
			const text = res.content[0]?.type === "text" ? res.content[0].text : "";
			expect(text).toMatch(/Memory Context Optimization/);
		}
	});

	it("handles metadata flag variations", async () => {
		const res = await memoryContextOptimizer({
			contextContent: "Test content",
			cacheStrategy: "balanced",
			includeMetadata: false,
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).not.toMatch(/### Metadata/);
	});

	it("handles references flag variations", async () => {
		const res = await memoryContextOptimizer({
			contextContent: "Test content",
			cacheStrategy: "balanced",
			includeReferences: false,
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).not.toMatch(/## References/);
	});
});
