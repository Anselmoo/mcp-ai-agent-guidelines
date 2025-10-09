import { describe, expect, it } from "vitest";
import { promptChainingBuilder } from "../../src/tools/prompt/prompt-chaining-builder";

describe("prompt-chaining-builder", () => {
	it("generates a basic sequential chain with dependencies", async () => {
		const res = await promptChainingBuilder({
			chainName: "Code Analysis Chain",
			description: "Multi-step code analysis workflow",
			steps: [
				{
					name: "Initial Scan",
					prompt: "Scan the codebase for issues",
					outputKey: "issues",
				},
				{
					name: "Prioritize",
					prompt: "Prioritize the issues based on severity",
					dependencies: ["issues"],
					outputKey: "priorities",
				},
				{
					name: "Generate Report",
					prompt: "Create a comprehensive report",
					dependencies: ["priorities"],
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/# 🔗 Prompt Chain: Code Analysis Chain/);
		expect(text).toMatch(/Multi-step code analysis workflow/);
		expect(text).toMatch(/## Chain Steps/);
		expect(text).toMatch(/### Step 1: Initial Scan/);
		expect(text).toMatch(/### Step 2: Prioritize/);
		expect(text).toMatch(/### Step 3: Generate Report/);
		expect(text).toMatch(/\*\*Dependencies\*\*: issues/);
		expect(text).toMatch(/\*\*Output Key\*\*: `issues`/);
		expect(text).toMatch(/## Chain Visualization/);
		expect(text).toMatch(/```mermaid/);
	});

	it("includes context and global variables", async () => {
		const res = await promptChainingBuilder({
			chainName: "Test Chain",
			context: "Security audit context",
			globalVariables: {
				threshold: "high",
				format: "JSON",
			},
			steps: [
				{
					name: "Step 1",
					prompt: "Do something",
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/## Context/);
		expect(text).toMatch(/Security audit context/);
		expect(text).toMatch(/## Global Variables/);
		expect(text).toMatch(/\*\*threshold\*\*: high/);
		expect(text).toMatch(/\*\*format\*\*: JSON/);
	});

	it("validates dependencies and throws on invalid dependency", async () => {
		await expect(
			promptChainingBuilder({
				chainName: "Invalid Chain",
				steps: [
					{
						name: "Step 1",
						prompt: "First step",
					},
					{
						name: "Step 2",
						prompt: "Second step",
						dependencies: ["nonexistent"],
					},
				],
			}),
		).rejects.toThrow(/invalid dependency/);
	});

	it("supports error handling strategies", async () => {
		const res = await promptChainingBuilder({
			chainName: "Error Handling Chain",
			steps: [
				{
					name: "Critical Step",
					prompt: "Must succeed",
					errorHandling: "abort",
				},
				{
					name: "Optional Step",
					prompt: "Can be skipped",
					errorHandling: "skip",
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/\*\*Error Handling\*\*: abort/);
		expect(text).toMatch(/\*\*Error Handling\*\*: skip/);
	});

	it("includes execution instructions", async () => {
		const res = await promptChainingBuilder({
			chainName: "Simple Chain",
			steps: [
				{
					name: "Step 1",
					prompt: "Do task",
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/## Execution Instructions/);
		expect(text).toMatch(/Execute steps in the order shown/);
		expect(text).toMatch(/Pass outputs from completed steps/);
		expect(text).toMatch(
			/Handle errors according to each step's error handling/,
		);
	});

	it("supports parallel execution strategy", async () => {
		const res = await promptChainingBuilder({
			chainName: "Parallel Chain",
			executionStrategy: "parallel-where-possible",
			steps: [
				{
					name: "Step 1",
					prompt: "Independent task",
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/parallel where dependencies allow/);
	});
});
