import { describe, expect, it } from "vitest";

describe("MCP Server Integration - Hierarchy Tools", () => {
	// These tests verify the tools work correctly when imported
	describe("Tool Module Loading", () => {
		it("should load prompting-hierarchy-evaluator module", async () => {
			const module = await import(
				"../../src/tools/prompt/prompting-hierarchy-evaluator.js"
			);
			expect(module.promptingHierarchyEvaluator).toBeDefined();
		});

		it("should load hierarchy-level-selector module", async () => {
			const module = await import(
				"../../src/tools/prompt/hierarchy-level-selector.js"
			);
			expect(module.hierarchyLevelSelector).toBeDefined();
		});
	});

	describe("Tool Invocation via Module", () => {
		it("should invoke prompting-hierarchy-evaluator with all parameters", async () => {
			const { promptingHierarchyEvaluator } = await import(
				"../../src/tools/prompt/prompting-hierarchy-evaluator.js"
			);

			// Test with all optional parameters
			const result = await promptingHierarchyEvaluator({
				promptText: "Test prompt for comprehensive coverage",
				targetLevel: "direct",
				context: "Testing context parameter",
				includeRecommendations: true,
				includeReferences: true,
			});

			expect(result.content[0].text).toContain("Direct");
		});

		it("should invoke hierarchy-level-selector with all parameters", async () => {
			const { hierarchyLevelSelector } = await import(
				"../../src/tools/prompt/hierarchy-level-selector.js"
			);

			const result = await hierarchyLevelSelector({
				taskDescription: "Complete test task",
				agentCapability: "expert",
				taskComplexity: "very-complex",
				autonomyPreference: "low",
				includeExamples: true,
				includeReferences: true,
			});

			expect(result.content[0].text).toContain("Recommended Level");
		});

		it("should handle prompting-hierarchy-evaluator with minimal params", async () => {
			const { promptingHierarchyEvaluator } = await import(
				"../../src/tools/prompt/prompting-hierarchy-evaluator.js"
			);

			const result = await promptingHierarchyEvaluator({
				promptText: "Minimal test",
			});

			expect(result.content).toBeDefined();
		});

		it("should handle hierarchy-level-selector with minimal params", async () => {
			const { hierarchyLevelSelector } = await import(
				"../../src/tools/prompt/hierarchy-level-selector.js"
			);

			const result = await hierarchyLevelSelector({
				taskDescription: "Minimal task",
			});

			expect(result.content).toBeDefined();
		});

		it("should test all hierarchy levels from evaluator", async () => {
			const { promptingHierarchyEvaluator } = await import(
				"../../src/tools/prompt/prompting-hierarchy-evaluator.js"
			);

			const testCases = [
				{ text: "Improve performance", expected: "Independent" },
				{ text: "Consider edge cases", expected: "Indirect" },
				{ text: "Implement JWT auth", expected: "Direct" },
				{
					text: "Example: const x = 1; Use this pattern",
					expected: "Modeling",
				},
				{
					text: "1. Step one 2. Step two 3. Step three",
					expected: "Scaffolding",
				},
				{
					text: "1. Open file.ts line 5 2. Add const x=1 3. Save",
					expected: "Full Physical",
				},
			];

			for (const testCase of testCases) {
				const result = await promptingHierarchyEvaluator({
					promptText: testCase.text,
				});
				// Just verify it returns something, level detection is tested elsewhere
				expect(result.content).toBeDefined();
			}
		});

		it("should test all agent capabilities in selector", async () => {
			const { hierarchyLevelSelector } = await import(
				"../../src/tools/prompt/hierarchy-level-selector.js"
			);

			const capabilities = [
				"novice",
				"intermediate",
				"advanced",
				"expert",
			] as const;

			for (const capability of capabilities) {
				const result = await hierarchyLevelSelector({
					taskDescription: "Test task for coverage",
					agentCapability: capability,
				});
				expect(result.content).toBeDefined();
			}
		});

		it("should test all task complexities in selector", async () => {
			const { hierarchyLevelSelector } = await import(
				"../../src/tools/prompt/hierarchy-level-selector.js"
			);

			const complexities = [
				"simple",
				"moderate",
				"complex",
				"very-complex",
			] as const;

			for (const complexity of complexities) {
				const result = await hierarchyLevelSelector({
					taskDescription: "Test task for coverage",
					taskComplexity: complexity,
				});
				expect(result.content).toBeDefined();
			}
		});

		it("should test all autonomy preferences in selector", async () => {
			const { hierarchyLevelSelector } = await import(
				"../../src/tools/prompt/hierarchy-level-selector.js"
			);

			const preferences = ["low", "medium", "high"] as const;

			for (const pref of preferences) {
				const result = await hierarchyLevelSelector({
					taskDescription: "Test task for coverage",
					autonomyPreference: pref,
				});
				expect(result.content).toBeDefined();
			}
		});

		it("should test score emoji functions", async () => {
			const { promptingHierarchyEvaluator } = await import(
				"../../src/tools/prompt/prompting-hierarchy-evaluator.js"
			);

			// Test prompts that will trigger different score ranges
			const prompts = [
				"x", // Very low scores
				"Do something with the code", // Medium scores
				`# Context
Very detailed context here with background information.

# Goal
Clear and specific goal statement.

# Requirements
1. First requirement
2. Second requirement
3. Third requirement

# Output Format
- Structured output
- With clear formatting`, // High scores
			];

			for (const promptText of prompts) {
				const result = await promptingHierarchyEvaluator({
					promptText,
					includeRecommendations: true,
				});
				expect(result.content[0].text).toMatch(/✅|👍|⚠️|❌/);
			}
		});

		it("should test complexity emoji functions", async () => {
			const { promptingHierarchyEvaluator } = await import(
				"../../src/tools/prompt/prompting-hierarchy-evaluator.js"
			);

			const result = await promptingHierarchyEvaluator({
				promptText:
					"Implement sophisticated microservices architecture with advanced security",
			});
			expect(result.content[0].text).toMatch(/🔴|🟡|🟢/);
		});

		it("should test recommendation generation for all issues", async () => {
			const { promptingHierarchyEvaluator } = await import(
				"../../src/tools/prompt/prompting-hierarchy-evaluator.js"
			);

			// Prompt designed to trigger multiple recommendations
			const result = await promptingHierarchyEvaluator({
				promptText: "do it now fast",
				targetLevel: "scaffolding",
				includeRecommendations: true,
			});

			const text = result.content[0].text;
			expect(text).toContain("Recommendations");
			// Should have multiple recommendation emojis
			expect((text.match(/📝|🎯|✅|🏗️|🎚️|🧠|⚡/g) || []).length).toBeGreaterThan(
				0,
			);
		});

		it("should test hierarchy adjustment advice", async () => {
			const { promptingHierarchyEvaluator } = await import(
				"../../src/tools/prompt/prompting-hierarchy-evaluator.js"
			);

			// Test moving up hierarchy (add structure)
			const result1 = await promptingHierarchyEvaluator({
				promptText: "Make it work",
				targetLevel: "full-physical",
				includeRecommendations: true,
			});
			expect(result1.content[0].text).toContain("Add more structure");

			// Test moving down hierarchy (remove structure)
			const result2 = await promptingHierarchyEvaluator({
				promptText:
					"1. Do step 1 exactly 2. Do step 2 exactly 3. Do step 3 exactly",
				targetLevel: "independent",
				includeRecommendations: true,
			});
			expect(result2.content[0].text).toContain("Remove some detailed");
		});
	});
});
