import { describe, expect, it } from "vitest";
import { promptFlowBuilder } from "../../src/tools/prompt/prompt-flow-builder";

describe("prompt-flow-builder", () => {
	it("generates a basic flow with nodes and edges", async () => {
		const res = await promptFlowBuilder({
			flowName: "Code Review Flow",
			description: "Adaptive code review workflow",
			nodes: [
				{
					id: "analyze",
					type: "prompt",
					name: "Analyze Code",
					config: { prompt: "Review code quality" },
				},
				{
					id: "check",
					type: "condition",
					name: "Check Complexity",
					config: { expression: "complexity > 10" },
				},
				{
					id: "deep",
					type: "prompt",
					name: "Deep Review",
					config: { prompt: "Detailed analysis" },
				},
			],
			edges: [
				{ from: "analyze", to: "check" },
				{ from: "check", to: "deep", condition: "true" },
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/# 🌊 Prompt Flow: Code Review Flow/);
		expect(text).toMatch(/Adaptive code review workflow/);
		expect(text).toMatch(/## Flow Nodes/);
		expect(text).toMatch(/### analyze: Analyze Code/);
		expect(text).toMatch(/\*\*Type\*\*: prompt/);
		expect(text).toMatch(/### check: Check Complexity/);
		expect(text).toMatch(/\*\*Type\*\*: condition/);
		expect(text).toMatch(/## Flow Visualization/);
		expect(text).toMatch(/```mermaid/);
		expect(text).toMatch(/flowchart TD/);
	});

	it("validates node references in edges", async () => {
		const result = (await promptFlowBuilder({
			flowName: "Invalid Flow",
			nodes: [
				{
					id: "node1",
					type: "prompt",
					name: "Node 1",
					config: {},
				},
			],
			edges: [{ from: "node1", to: "nonexistent" }],
		})) as { isError?: boolean; content: { text: string }[] };
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toMatch(/non-existent node/i);
	});

	it("validates required config for node types", async () => {
		const result = (await promptFlowBuilder({
			flowName: "Invalid Condition Flow",
			nodes: [
				{
					id: "cond",
					type: "condition",
					name: "Condition",
					config: {}, // missing expression
				},
			],
		})) as { isError?: boolean; content: { text: string }[] };
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toMatch(/expression/i);
	});

	it("supports different node types with appropriate shapes", async () => {
		const res = await promptFlowBuilder({
			flowName: "Multi-Type Flow",
			nodes: [
				{
					id: "p1",
					type: "prompt",
					name: "Prompt",
					config: { prompt: "test" },
				},
				{
					id: "c1",
					type: "condition",
					name: "Condition",
					config: { expression: "x > 5" },
				},
				{
					id: "l1",
					type: "loop",
					name: "Loop",
					config: { iterations: 3 },
				},
				{
					id: "par1",
					type: "parallel",
					name: "Parallel",
					config: {},
				},
				{
					id: "m1",
					type: "merge",
					name: "Merge",
					config: {},
				},
				{
					id: "t1",
					type: "transform",
					name: "Transform",
					config: {},
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/p1\[/); // Rectangle for prompt
		expect(text).toMatch(/c1\{/); // Diamond for condition
		expect(text).toMatch(/l1\(/); // Rounded for loop
		expect(text).toMatch(/par1\[\//); // Parallelogram for parallel
		expect(text).toMatch(/m1\(\(/); // Circle for merge
		expect(text).toMatch(/t1\[\\/); // Trapezoid for transform
	});

	it("includes flow variables", async () => {
		const res = await promptFlowBuilder({
			flowName: "Variable Flow",
			variables: {
				maxRetries: "3",
				timeout: "5000ms",
			},
			nodes: [
				{
					id: "n1",
					type: "prompt",
					name: "Node",
					config: { prompt: "test" },
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/## Flow Variables/);
		expect(text).toMatch(/\*\*maxRetries\*\*: 3/);
		expect(text).toMatch(/\*\*timeout\*\*: 5000ms/);
	});

	it("includes execution guide by default", async () => {
		const res = await promptFlowBuilder({
			flowName: "Guided Flow",
			nodes: [
				{
					id: "n1",
					type: "prompt",
					name: "Node",
					config: { prompt: "test" },
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/## Execution Guide/);
		expect(text).toMatch(/### How to Execute This Flow/);
		expect(text).toMatch(/### Error Handling/);
		expect(text).toMatch(/### Best Practices/);
	});

	it("can exclude execution guide", async () => {
		const res = await promptFlowBuilder({
			flowName: "Simple Flow",
			includeExecutionGuide: false,
			nodes: [
				{
					id: "n1",
					type: "prompt",
					name: "Node",
					config: { prompt: "test" },
				},
			],
		});

		const text = res.content[0].text;
		expect(text).not.toMatch(/## Execution Guide/);
	});

	it("supports conditional edges with labels", async () => {
		const res = await promptFlowBuilder({
			flowName: "Conditional Flow",
			nodes: [
				{
					id: "start",
					type: "prompt",
					name: "Start",
					config: { prompt: "begin" },
				},
				{
					id: "cond",
					type: "condition",
					name: "Check",
					config: { expression: "x > 0" },
				},
				{
					id: "yes",
					type: "prompt",
					name: "Yes Path",
					config: { prompt: "positive" },
				},
				{
					id: "no",
					type: "prompt",
					name: "No Path",
					config: { prompt: "negative" },
				},
			],
			edges: [
				{ from: "start", to: "cond" },
				{ from: "cond", to: "yes", condition: "true", label: "if positive" },
				{ from: "cond", to: "no", condition: "false", label: "if negative" },
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/To \*\*yes\*\* \(if: true\) \[if positive\]/);
		expect(text).toMatch(/To \*\*no\*\* \(if: false\) \[if negative\]/);
	});

	it("supports entry point specification", async () => {
		const res = await promptFlowBuilder({
			flowName: "Entry Point Flow",
			entryPoint: "custom_start",
			nodes: [
				{
					id: "custom_start",
					type: "prompt",
					name: "Custom Start",
					config: { prompt: "begin here" },
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/Flow begins at node: \*\*custom_start\*\*/);
	});

	it("validates loop node configuration", async () => {
		// Should accept loop with iterations
		const res1 = await promptFlowBuilder({
			flowName: "Loop Flow",
			nodes: [
				{
					id: "loop1",
					type: "loop",
					name: "Loop",
					config: { iterations: 5 },
				},
			],
		});
		expect(res1.content[0].text).toMatch(/Loop/);

		// Should accept loop with condition
		const res2 = await promptFlowBuilder({
			flowName: "Loop Flow 2",
			nodes: [
				{
					id: "loop2",
					type: "loop",
					name: "Loop",
					config: { condition: "x < 10" },
				},
			],
		});
		expect(res2.content[0].text).toMatch(/Loop/);

		// Should return error for loop without either
		const result = (await promptFlowBuilder({
			flowName: "Invalid Loop",
			nodes: [
				{
					id: "loop3",
					type: "loop",
					name: "Loop",
					config: {},
				},
			],
		})) as { isError?: boolean; content: { text: string }[] };
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toMatch(/condition.*iterations/i);
	});

	it("excludes metadata when includeMetadata is false", async () => {
		const res = await promptFlowBuilder({
			flowName: "No Metadata Flow",
			includeMetadata: false,
			nodes: [
				{
					id: "n1",
					type: "prompt",
					name: "Node",
					config: { prompt: "test" },
				},
			],
		});

		const text = res.content[0].text;
		expect(text).not.toMatch(/Source Tool:/);
	});

	it("excludes references when includeReferences is false", async () => {
		const res = await promptFlowBuilder({
			flowName: "No Refs Flow",
			includeReferences: false,
			nodes: [
				{
					id: "n1",
					type: "prompt",
					name: "Node",
					config: { prompt: "test" },
				},
			],
		});

		const text = res.content[0].text;
		expect(text).not.toMatch(/## References/);
	});

	it("supports markdown-only output format", async () => {
		const res = await promptFlowBuilder({
			flowName: "Markdown Flow",
			outputFormat: "markdown",
			nodes: [
				{
					id: "n1",
					type: "prompt",
					name: "Node",
					config: { prompt: "test" },
				},
			],
		});

		const text = res.content[0].text;
		expect(text).not.toMatch(/## Flow Visualization/);
		expect(text).not.toMatch(/```mermaid/);
	});

	it("supports mermaid-only output format", async () => {
		const res = await promptFlowBuilder({
			flowName: "Mermaid Flow",
			outputFormat: "mermaid",
			nodes: [
				{
					id: "n1",
					type: "prompt",
					name: "Node",
					config: { prompt: "test" },
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/## Flow Visualization/);
		expect(text).toMatch(/```mermaid/);
	});

	it("handles nodes with descriptions", async () => {
		const res = await promptFlowBuilder({
			flowName: "Described Flow",
			nodes: [
				{
					id: "n1",
					type: "prompt",
					name: "Analyzer",
					description: "Analyzes code for issues",
					config: { prompt: "analyze" },
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/\*\*Description\*\*: Analyzes code for issues/);
	});

	it("handles nodes without config", async () => {
		const res = await promptFlowBuilder({
			flowName: "No Config Flow",
			nodes: [
				{
					id: "m1",
					type: "merge",
					name: "Merge Point",
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/### m1: Merge Point/);
		expect(text).not.toMatch(/\*\*Configuration\*\*/);
	});

	it("displays outgoing edges for nodes", async () => {
		const res = await promptFlowBuilder({
			flowName: "Edges Flow",
			nodes: [
				{
					id: "start",
					type: "prompt",
					name: "Start",
					config: { prompt: "begin" },
				},
				{
					id: "end",
					type: "prompt",
					name: "End",
					config: { prompt: "finish" },
				},
			],
			edges: [{ from: "start", to: "end", label: "proceed" }],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/\*\*Outgoing Edges\*\*/);
		expect(text).toMatch(/To \*\*end\*\*.*\[proceed\]/);
	});

	it("validates entry point exists", async () => {
		const result = (await promptFlowBuilder({
			flowName: "Bad Entry Flow",
			entryPoint: "nonexistent",
			nodes: [
				{
					id: "n1",
					type: "prompt",
					name: "Node",
					config: { prompt: "test" },
				},
			],
		})) as { isError?: boolean; content: { text: string }[] };
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toMatch(
			/Entry point references non-existent node/i,
		);
	});

	it("validates from edge reference exists", async () => {
		const result = (await promptFlowBuilder({
			flowName: "Bad From Edge",
			nodes: [
				{
					id: "n1",
					type: "prompt",
					name: "Node",
					config: { prompt: "test" },
				},
			],
			edges: [{ from: "nonexistent", to: "n1" }],
		})) as { isError?: boolean; content: { text: string }[] };
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toMatch(
			/Edge references non-existent node/i,
		);
	});

	it("validates prompt node has prompt config", async () => {
		const result = (await promptFlowBuilder({
			flowName: "No Prompt Config",
			nodes: [
				{
					id: "p1",
					type: "prompt",
					name: "Prompt",
					config: {},
				},
			],
		})) as { isError?: boolean; content: { text: string }[] };
		expect(result.isError).toBe(true);
		expect(result.content[0].text).toMatch(/prompt/i);
	});

	it("handles edge with only condition (no label)", async () => {
		const res = await promptFlowBuilder({
			flowName: "Condition Only Edge",
			nodes: [
				{
					id: "c1",
					type: "condition",
					name: "Check",
					config: { expression: "x > 0" },
				},
				{
					id: "p1",
					type: "prompt",
					name: "Action",
					config: { prompt: "do it" },
				},
			],
			edges: [{ from: "c1", to: "p1", condition: "true" }],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/c1 -\./); // dotted line for condition
	});

	it("includes legend for node types", async () => {
		const res = await promptFlowBuilder({
			flowName: "Legend Flow",
			nodes: [
				{
					id: "p1",
					type: "prompt",
					name: "Prompt",
					config: { prompt: "test" },
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/### Legend/);
		expect(text).toMatch(/Rectangle.*Prompt node/);
		expect(text).toMatch(/Diamond.*Condition node/);
	});

	it("styles multiple condition nodes with comma separation", async () => {
		const res = await promptFlowBuilder({
			flowName: "Multi Condition Flow",
			nodes: [
				{
					id: "c1",
					type: "condition",
					name: "Check 1",
					config: { expression: "x > 0" },
				},
				{
					id: "c2",
					type: "condition",
					name: "Check 2",
					config: { expression: "y > 0" },
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/style c1,c2 fill:#ffe6cc/);
	});

	it("generates execution guide with all sections", async () => {
		const res = await promptFlowBuilder({
			flowName: "Complete Guide Flow",
			nodes: [
				{
					id: "p1",
					type: "prompt",
					name: "Step",
					config: { prompt: "test" },
				},
			],
		});

		const text = res.content[0].text;
		expect(text).toMatch(/### How to Execute This Flow/);
		expect(text).toMatch(/Initialize.*flow variables/);
		expect(text).toMatch(/Start.*at the entry point/);
		expect(text).toMatch(/Execute.*each node/);
		expect(text).toMatch(/### Error Handling/);
		expect(text).toMatch(/try-catch blocks/);
		expect(text).toMatch(/### Best Practices/);
		expect(text).toMatch(/Keep prompts modular/);
	});
});
