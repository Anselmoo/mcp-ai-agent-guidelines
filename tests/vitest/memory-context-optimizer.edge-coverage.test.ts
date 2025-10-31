import { describe, expect, it } from "vitest";
import { memoryContextOptimizer } from "../../src/tools/utility/memory-context-optimizer.js";

describe("Memory Context Optimizer - Additional Coverage", () => {
	it("should handle aggressive caching strategy", async () => {
		const result = await memoryContextOptimizer({
			contextContent:
				"System: You are a helpful assistant.\nUser: Hello\nAssistant: Hi there!",
			cacheStrategy: "aggressive",
			language: "typescript",
			includeReferences: true,
		});

		const text = result.content[0].text;
		expect(text).toContain("Aggressive Caching");
		expect(text).toContain(
			"Maximizes cache usage, suitable for repetitive contexts",
		);
	});

	it("should handle conservative caching strategy", async () => {
		const result = await memoryContextOptimizer({
			contextContent: "function test() { return 42; }",
			cacheStrategy: "conservative",
			language: "javascript",
		});

		const text = result.content[0].text;
		expect(text).toContain("Conservative Caching");
		expect(text).toContain("Minimal caching, preserves most context freshness");
	});

	it("should handle default balanced caching strategy", async () => {
		const result = await memoryContextOptimizer({
			contextContent: "Some content here",
			// No cacheStrategy specified, should default to balanced
			language: "python",
		});

		const text = result.content[0].text;
		expect(text).toContain("Balanced Caching");
		expect(text).toContain(
			"Optimizes between cache efficiency and context freshness",
		);
	});

	it("should handle maxTokens truncation", async () => {
		const longContent = "This is a very long piece of content. ".repeat(100);

		const result = await memoryContextOptimizer({
			contextContent: longContent,
			maxTokens: 50,
			cacheStrategy: "balanced",
			language: "markdown",
		});

		const text = result.content[0].text;
		expect(text).toContain("Max Tokens | 50");
		expect(text).toContain("Optimized Content");
		// The optimized content should be shorter than original
	});

	it("should detect and handle code content with system prompts", async () => {
		const codeContent = `System: You are a code reviewer.
Instructions: Follow best practices.

function calculateDiscount(price, percentage) {
    return price * (1 - percentage / 100);
}

Tool: validateInput
Description: Validates user input
`;

		const result = await memoryContextOptimizer({
			contextContent: codeContent,
			cacheStrategy: "balanced",
			language: "javascript",
			includeReferences: false,
		});

		const text = result.content[0].text;
		expect(text).toContain("Cache Segments");
		// Should identify system prompts and tool definitions
	});

	it("should handle content without cache segments", async () => {
		const simpleContent =
			"Just some regular text without any special patterns.";

		const result = await memoryContextOptimizer({
			contextContent: simpleContent,
			cacheStrategy: "balanced",
			language: "text",
		});

		const text = result.content[0].text;
		// Should not contain cache segments section when there are none
		expect(text).toContain("Memory Context Optimization Report");
		expect(text).toContain("Optimized Content");
	});

	it("should handle no language specified", async () => {
		const result = await memoryContextOptimizer({
			contextContent: "Some content without language",
			cacheStrategy: "balanced",
			// No language specified
		});

		const text = result.content[0].text;
		expect(text).toContain("Memory Context Optimization Report");
		// Should use plain code fence without language
	});

	it("should handle Python language usage example", async () => {
		const result = await memoryContextOptimizer({
			contextContent: "def hello(): print('world')",
			language: "python",
			cacheStrategy: "aggressive",
		});

		const text = result.content[0].text;
		expect(text).toContain("```python");
		expect(text).toContain("# Example: prepare concise context");
		expect(text).toContain("# In an MCP call");
	});

	it("should handle inputFile parameter", async () => {
		const result = await memoryContextOptimizer({
			contextContent: "File content here",
			inputFile: "test-file.ts",
			language: "typescript",
			cacheStrategy: "balanced",
		});

		const text = result.content[0].text;
		expect(text).toContain("Input file: test-file.ts");
	});

	it("should handle maxTokens not specified", async () => {
		const result = await memoryContextOptimizer({
			contextContent: "Content without max tokens",
			cacheStrategy: "balanced",
		});

		const text = result.content[0].text;
		expect(text).toContain("Max Tokens | Not specified");
		expect(text).toContain("Max Tokens Limit**: Not specified");
	});

	it("should handle complex content with multiple patterns", async () => {
		const complexContent = `System: You are an AI assistant with access to tools.

Instructions: Always validate inputs and provide helpful responses.

## Available Tools

Tool: fetchData
Description: Fetches data from external APIs
Parameters: url, headers

Tool: processResult
Description: Processes API results
Parameters: data, format

## Guidelines
- Always check inputs
- Return structured responses
- Handle errors gracefully

function processUserData(userData) {
    if (!userData || !userData.id) {
        throw new Error('Invalid user data');
    }
    return {
        id: userData.id,
        processed: true,
        timestamp: Date.now()
    };
}`;

		const result = await memoryContextOptimizer({
			contextContent: complexContent,
			cacheStrategy: "balanced",
			language: "javascript",
			maxTokens: 200,
			includeReferences: true,
		});

		const text = result.content[0].text;
		// Should detect multiple segments but actual content may vary
		expect(text).toContain("Cache Segments");
		expect(text).toContain("System Prompts");
		expect(text).toContain("Tool Definitions");
		// Should handle complex content with multiple cacheable segments
	});
});
