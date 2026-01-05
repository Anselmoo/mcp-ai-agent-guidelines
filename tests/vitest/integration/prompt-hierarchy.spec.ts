/**
 * Integration: Unified prompt-hierarchy tool (P1-018)
 *
 * Tests the unified prompt-hierarchy tool that consolidates
 * build, select, evaluate, chain, flow, and quick modes.
 */
import { describe, expect, it } from "vitest";
import { promptHierarchy } from "../../../src/tools/prompt/prompt-hierarchy.js";

const TARGET_LEVELS = [
	"independent",
	"indirect",
	"direct",
	"modeling",
	"scaffolding",
	"full-physical",
];

const UNIFIED_MODES = [
	"build",
	"evaluate",
	"select-level",
	"chain",
	"flow",
	"quick",
] as const;

describe("prompt-hierarchy integration", () => {
	it("returns structured output for unified modes", async () => {
		for (const mode of UNIFIED_MODES) {
			// PR #807 Review Fix: Be explicit about which modes require which parameters
			const baseArgs: Record<string, unknown> = { mode };

			// Set required fields based on mode
			switch (mode) {
				case "build":
					baseArgs.context = "Refactor authentication module";
					baseArgs.goal = "Adopt JWT tokens";
					break;
				case "evaluate":
					baseArgs.promptText = "Assess prompt quality";
					break;
				case "select-level":
					baseArgs.taskDescription = "Validate mode handling";
					break;
				case "chain":
					baseArgs.chainName = "Test Chain";
					baseArgs.steps = [{ name: "Step 1", prompt: "Do something" }];
					break;
				case "flow":
					baseArgs.flowName = "Test Flow";
					baseArgs.nodes = [
						{
							id: "node1",
							type: "prompt",
							name: "Start",
							config: { prompt: "Begin" },
						},
					];
					break;
				case "quick":
					baseArgs.category = "testing";
					break;
			}

			const result = await promptHierarchy(baseArgs);

			expect(result.mode).toBe(mode);
			expect(result.prompt?.length ?? 0).toBeGreaterThan(0);
			expect(result.metadata).toBeDefined();
			expect(result.metadata?.mode).toBe(mode);
			expect(result.content).toBeInstanceOf(Array);
		}
	});

	it("handles build mode end-to-end", async () => {
		const result = await promptHierarchy({
			mode: "build",
			context: "Refactor authentication module",
			goal: "Adopt JWT tokens",
			requirements: ["maintain backward compatibility"],
			outputFormat: "markdown",
			audience: "backend engineers",
		});

		expect(result.content).toBeInstanceOf(Array);
		const text = result.content[0]?.text ?? "";
		expect(text).toContain("Refactor authentication module");
		expect(text).toContain("Adopt JWT tokens");
	});

	it("handles select mode end-to-end", async () => {
		const result = await promptHierarchy({
			mode: "select",
			taskDescription: "Implement payment processing",
			agentCapability: "intermediate",
			taskComplexity: "complex",
			autonomyPreference: "medium",
		});

		expect(result.content).toBeInstanceOf(Array);
		const text = result.content[0]?.text ?? "";
		expect(text).toMatch(/Hierarchy Level Recommendation/i);
		expect(text.length).toBeGreaterThan(0);
	});

	it("supports evaluation across all hierarchy levels", async () => {
		for (const level of TARGET_LEVELS) {
			const result = await promptHierarchy({
				mode: "evaluate",
				promptText: "Evaluate prompt quality",
				targetLevel: level,
				includeRecommendations: true,
			});

			expect(result.content).toBeInstanceOf(Array);
			const content = result.content[0];
			expect(content?.type).toBe("text");
			const normalizedText = (content?.text ?? "")
				.toLowerCase()
				.replace(/[^a-z]/g, "");
			expect(normalizedText).toContain(level.replace(/-/g, ""));
		}
	});

	it("chain mode delegates to prompt-chaining-builder", async () => {
		const result = await promptHierarchy({
			mode: "chain",
			chainName: "Test Chain",
			steps: [
				{ name: "First Step", prompt: "Do something" },
				{
					name: "Second Step",
					prompt: "Do more",
					dependencies: ["First Step"],
				},
			],
		});

		expect(result.mode).toBe("chain");
		expect(result.content).toBeInstanceOf(Array);
		const text = result.content[0]?.text ?? "";
		expect(text).toContain("Prompt Chain");
	});

	it("flow mode delegates to prompt-flow-builder", async () => {
		const result = await promptHierarchy({
			mode: "flow",
			flowName: "Test Flow",
			nodes: [
				{
					id: "start",
					type: "prompt",
					name: "Begin",
					config: { prompt: "Start the workflow" },
				},
				{ id: "end", type: "merge", name: "Finish", config: {} },
			],
			edges: [{ from: "start", to: "end" }],
		});

		expect(result.mode).toBe("flow");
		expect(result.content).toBeInstanceOf(Array);
		const text = result.content[0]?.text ?? "";
		expect(text).toContain("Prompt Flow");
	});

	it("quick mode delegates to quick-developer-prompts-builder", async () => {
		const result = await promptHierarchy({
			mode: "quick",
			category: "testing",
		});

		expect(result.mode).toBe("quick");
		expect(result.content).toBeInstanceOf(Array);
		const text = result.content[0]?.text ?? "";
		expect(text).toContain("Quick");
	});
});
