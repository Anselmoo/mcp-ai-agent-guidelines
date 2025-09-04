import { describe, expect, it } from "vitest";
import { memoryContextOptimizer } from "../../src/tools/memory-context-optimizer";

describe("memory-context-optimizer (limits and segments)", () => {
	it("truncates when maxTokens is smaller than content", async () => {
		const long = "System: A ".repeat(1000);
		const res = await memoryContextOptimizer({
			contextContent: long,
			maxTokens: 50,
			cacheStrategy: "balanced",
			includeReferences: false,
			includeMetadata: false,
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Optimized Length/);
		// check that reduction percentage appears (bullet or table row)
		expect(text).toMatch(
			/\*\*Reduction\*\*:\s*\d+%|\|\s*Reduction\s*\|\s*\d+%\s*\|/,
		);
	});

	it("reports cache segments for aggressive strategy", async () => {
		const content = [
			"### System\nFollow rules strictly.",
			"### Tools\n- Tool: test\n- Function: run",
			"### Docs\nSome static reference",
		].join("\n\n");
		const res = await memoryContextOptimizer({
			contextContent: content,
			cacheStrategy: "aggressive",
			includeReferences: false,
			includeMetadata: false,
		});
		const text = res.content[0]?.type === "text" ? res.content[0].text : "";
		expect(text).toMatch(/Cache Segments/);
		// aggressive path may include tool definitions or static resources
		expect(text).toMatch(/Tool Definitions|Static Resources/);
	});
});
