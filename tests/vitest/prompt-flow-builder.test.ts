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
		await expect(
			promptFlowBuilder({
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
			}),
		).rejects.toThrow(/non-existent node/);
	});

	it("validates required config for node types", async () => {
		await expect(
			promptFlowBuilder({
				flowName: "Invalid Condition Flow",
				nodes: [
					{
						id: "cond",
						type: "condition",
						name: "Condition",
						config: {}, // missing expression
					},
				],
			}),
		).rejects.toThrow(/must have an expression/);
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

		// Should reject loop without either
		await expect(
			promptFlowBuilder({
				flowName: "Invalid Loop",
				nodes: [
					{
						id: "loop3",
						type: "loop",
						name: "Loop",
						config: {},
					},
				],
			}),
		).rejects.toThrow(/must have either condition or iterations/);
	});
});
