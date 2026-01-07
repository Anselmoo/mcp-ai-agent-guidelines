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

	it("validates dependencies and returns error on invalid dependency", async () => {
		const result = (await promptChainingBuilder({
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
		})) as { isError?: boolean; content: { text: string }[] };
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toMatch(/invalid dependency/i);
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

	it("excludes metadata when includeMetadata is false", async () => {
		const res = await promptChainingBuilder({
			chainName: "No Metadata Chain",
			includeMetadata: false,
			steps: [
				{
					name: "Step 1",
					prompt: "Do something",
				},
			],
		});

		const text = res.content[0].text;
		expect(text).not.toMatch(/Source Tool:/);
		expect(text).not.toMatch(/mcp_ai-agent-guid/);
	});

	it("excludes references when includeReferences is false", async () => {
		const res = await promptChainingBuilder({
			chainName: "No Refs Chain",
			includeReferences: false,
			steps: [
				{
					name: "Step 1",
					prompt: "Do something",
				},
			],
		});

		const text = res.content[0].text;
		expect(text).not.toMatch(/## Further Reading/);
		expect(text).not.toMatch(/promptingguide.ai/);
	});

	it("excludes visualization when includeVisualization is false", async () => {
		const res = await promptChainingBuilder({
			chainName: "No Viz Chain",
			includeVisualization: false,
			steps: [
				{
					name: "Step 1",
					prompt: "Do something",
				},
			],
		});

		const text = res.content[0].text;
		expect(text).not.toMatch(/## Chain Visualization/);
		expect(text).not.toMatch(/```mermaid/);
	});

	it("handles complex dependency chains with multiple dependencies", async () => {
		const res = await promptChainingBuilder({
			chainName: "Complex Chain",
			steps: [
				{
					name: "Step A",
					prompt: "First independent step",
					outputKey: "resultA",
				},
				{
					name: "Step B",
					prompt: "Second independent step",
					outputKey: "resultB",
				},
				{
					name: "Step C",
					prompt: "Depends on both A and B",
					dependencies: ["resultA", "resultB"],
					outputKey: "resultC",
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/\*\*Dependencies\*\*: resultA, resultB/);
		expect(text).toMatch(/Step1 -->\|output\| Step3/);
		expect(text).toMatch(/Step2 -->\|output\| Step3/);
	});

	it("handles steps with descriptions", async () => {
		const res = await promptChainingBuilder({
			chainName: "Described Chain",
			steps: [
				{
					name: "Analyze",
					description: "Performs initial code analysis",
					prompt: "Analyze the code",
					outputKey: "analysis",
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/\*\*Description\*\*: Performs initial code analysis/);
	});

	it("handles retry error handling", async () => {
		const res = await promptChainingBuilder({
			chainName: "Retry Chain",
			steps: [
				{
					name: "Retryable Step",
					prompt: "May fail, will retry",
					errorHandling: "retry",
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/\*\*Error Handling\*\*: retry/);
	});

	it("generates visualization with output key annotations", async () => {
		const res = await promptChainingBuilder({
			chainName: "Output Keys Chain",
			steps: [
				{
					name: "Step 1",
					prompt: "Generate data",
					outputKey: "data",
				},
				{
					name: "Step 2",
					prompt: "Use data",
					dependencies: ["data"],
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/Step1 -\.->.*"data"/);
		expect(text).toMatch(/style Step1_out/);
	});

	it("handles dependency by step name instead of output key", async () => {
		const res = await promptChainingBuilder({
			chainName: "Name Dependency Chain",
			steps: [
				{
					name: "First Step",
					prompt: "Do first task",
				},
				{
					name: "Second Step",
					prompt: "Do second task",
					dependencies: ["First Step"],
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/\*\*Dependencies\*\*: First Step/);
	});

	it("includes input data flow hints", async () => {
		const res = await promptChainingBuilder({
			chainName: "Data Flow Chain",
			steps: [
				{
					name: "Producer",
					prompt: "Produce data",
					outputKey: "output",
				},
				{
					name: "Consumer",
					prompt: "Consume data",
					dependencies: ["output"],
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(
			/\*\*Input Data\*\*: This step receives outputs from: output/,
		);
	});
});
