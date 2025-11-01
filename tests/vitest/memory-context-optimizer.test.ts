import { describe, expect, it } from "vitest";
import { memoryContextOptimizer } from "../../src/tools/utility/memory-context-optimizer.js";

const sample = `You are a helpful assistant.
System: Follow the rules.
Instructions: Be concise.

function doStuff(x) { return x + 1 }

# README
- Section One
Tool: fetchRepo
`;

describe("memory-context-optimizer", () => {
	it("produces optimization report with segments and mermaid pie", async () => {
		const res = await memoryContextOptimizer({
			contextContent: sample,
			cacheStrategy: "balanced",
			includeReferences: false,
			language: "typescript",
		});
		const text = res.content[0].text;
		expect(text).toMatch(/Memory Context Optimization Report/);
		expect(text).toMatch(/Cache Segments/);
		expect(text).toMatch(/```mermaid\npie showData/);
	});

	it("truncates when exceeding maxTokens and supports python usage fence", async () => {
		const res = await memoryContextOptimizer({
			contextContent: sample.repeat(100),
			maxTokens: 10,
			cacheStrategy: "conservative",
			language: "python",
		});
		const text = res.content[0].text;
		expect(text).toMatch(/Optimized Content/);
		expect(text).toMatch(/```python/);
	});
});
