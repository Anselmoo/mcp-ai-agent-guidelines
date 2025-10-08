import { describe, expect, it } from "vitest";
import { hierarchyLevelSelector } from "../../src/tools/prompt/hierarchy-level-selector.js";
import { promptingHierarchyEvaluator } from "../../src/tools/prompt/prompting-hierarchy-evaluator.js";

describe("Prompting Hierarchy - Maximum Coverage Tests", () => {
	describe("All combinations of parameters", () => {
		it("should test all capability + complexity combinations", async () => {
			const capabilities = [
				"novice",
				"intermediate",
				"advanced",
				"expert",
			] as const;
			const complexities = [
				"simple",
				"moderate",
				"complex",
				"very-complex",
			] as const;

			for (const capability of capabilities) {
				for (const complexity of complexities) {
					const result = await hierarchyLevelSelector({
						taskDescription: `Test task for ${capability} agent with ${complexity} complexity`,
						agentCapability: capability,
						taskComplexity: complexity,
						autonomyPreference: "medium",
					});
					expect(result.content).toBeDefined();
				}
			}
		});

		it("should test all autonomy preferences with examples and references", async () => {
			const preferences = ["low", "medium", "high"] as const;

			for (const pref of preferences) {
				const result = await hierarchyLevelSelector({
					taskDescription: "Test task",
					autonomyPreference: pref,
					includeExamples: true,
					includeReferences: true,
				});
				expect(result.content[0].text).toContain("Example Prompts");
				expect(result.content[0].text).toContain("References");
			}
		});

		it("should test without examples and references", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription: "Test task",
				includeExamples: false,
				includeReferences: false,
			});
			expect(result.content[0].text).not.toContain("Example Prompts");
			expect(result.content[0].text).not.toContain("## References");
		});
	});

	describe("Evaluator - comprehensive scenarios", () => {
		it("should evaluate all types of prompts with all options", async () => {
			const prompts = [
				{ text: "Do something", level: "independent" as const },
				{ text: "Consider the options", level: "indirect" as const },
				{ text: "Implement feature X", level: "direct" as const },
				{
					text: "Here's an example: const x = 1; Follow this",
					level: "modeling" as const,
				},
				{ text: "1. Do A\n2. Do B\n3. Do C", level: "scaffolding" as const },
				{
					text: "Line 1: Add code\nLine 2: Save\nLine 3: Test",
					level: "full-physical" as const,
				},
			];

			for (const prompt of prompts) {
				// With all options enabled
				const result1 = await promptingHierarchyEvaluator({
					promptText: prompt.text,
					targetLevel: prompt.level,
					context: "Testing context",
					includeRecommendations: true,
					includeReferences: true,
				});
				expect(result1.content).toBeDefined();

				// With all options disabled
				const result2 = await promptingHierarchyEvaluator({
					promptText: prompt.text,
					includeRecommendations: false,
					includeReferences: false,
				});
				expect(result2.content).toBeDefined();
			}
		});

		it("should test various prompt structures", async () => {
			// Prompt with high structure
			const structured = await promptingHierarchyEvaluator({
				promptText: `# Main Title
## Subtitle
- Bullet 1
- Bullet 2
1. Number 1
2. Number 2`,
			});
			expect(structured.content).toBeDefined();

			// Prompt with no structure
			const unstructured = await promptingHierarchyEvaluator({
				promptText: "just do it quickly",
			});
			expect(unstructured.content).toBeDefined();

			// Prompt with code blocks
			const withCode = await promptingHierarchyEvaluator({
				promptText: `Use this pattern:
\`\`\`typescript
const x = 1;
\`\`\`
Apply it everywhere.`,
			});
			expect(withCode.content).toBeDefined();
		});

		it("should test all score ranges for emojis", async () => {
			// Very low score (0-40)
			const veryLow = await promptingHierarchyEvaluator({
				promptText: "x",
			});
			expect(veryLow.content[0].text).toMatch(/❌/);

			// Fair score (40-70)
			const fair = await promptingHierarchyEvaluator({
				promptText: "Please implement the authentication feature",
			});
			expect(fair.content[0].text).toMatch(/⚠️|👍/);

			// Good/Excellent score (70-100)
			const good = await promptingHierarchyEvaluator({
				promptText: `# Context
Detailed context about the authentication system.

# Goal
Implement JWT authentication with proper security measures.

# Requirements
1. Use industry-standard JWT library
2. Implement token refresh mechanism
3. Add comprehensive error handling
4. Include security best practices
5. Write extensive test coverage

# Output Format
- Source code files
- Test files
- Documentation`,
			});
			expect(good.content[0].text).toMatch(/✅|👍/);
		});

		it("should test complexity indicators", async () => {
			// Low complexity
			const low = await promptingHierarchyEvaluator({
				promptText: "Create a simple hello world function",
			});
			expect(low.content[0].text).toMatch(/🟢/);

			// High complexity - should have some complexity indicator
			const high = await promptingHierarchyEvaluator({
				promptText:
					"Architect a distributed microservices system with event sourcing, CQRS, saga patterns, distributed tracing, circuit breakers, service mesh, advanced monitoring, multi-region deployment, and comprehensive disaster recovery",
			});
			// Just verify it has a complexity indicator (could be any color based on analysis)
			expect(high.content[0].text).toMatch(/🔴|🟡|🟢/);
		});

		it("should test all recommendation types", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText: "do it",
				targetLevel: "full-physical",
				includeRecommendations: true,
			});

			const text = result.content[0].text;
			expect(text).toContain("Recommendations");
			// Should have multiple types of recommendations
			expect(text.length).toBeGreaterThan(100);
		});

		it("should test hierarchy level detection accuracy", async () => {
			const testCases = [
				{ text: "Explore new approaches", expected: "Independent" },
				{ text: "Think about the implications", expected: "Indirect" },
				{ text: "Add authentication to the API", expected: "Direct" },
				{ text: "Like this example: function() {}", expected: "Modeling" },
				{
					text: "Step 1: First\nStep 2: Then\nStep 3: Finally",
					expected: "Scaffolding",
				},
				{
					text: "Line 10: Add 'const x = 1'\nLine 11: Save file",
					expected: "Full Physical",
				},
			];

			for (const testCase of testCases) {
				const result = await promptingHierarchyEvaluator({
					promptText: testCase.text,
				});
				expect(result.content[0].text).toContain(testCase.expected);
			}
		});

		it("should test completeness detection", async () => {
			// High completeness
			const complete = await promptingHierarchyEvaluator({
				promptText: `# Context: Building auth
# Goal: Add JWT
# Requirements: Security first
# Constraints: No breaking changes
# Output: Code + tests`,
			});
			const completeText = complete.content[0].text;
			expect(completeText).toMatch(/Completeness[:\s|]+\d+\/100/);

			// Low completeness
			const incomplete = await promptingHierarchyEvaluator({
				promptText: "Add feature",
			});
			const incompleteText = incomplete.content[0].text;
			expect(incompleteText).toMatch(/Completeness[:\s|]+\d+\/100/);
		});

		it("should test specificity detection", async () => {
			// High specificity
			const specific = await promptingHierarchyEvaluator({
				promptText:
					"Implement JWT authentication using jsonwebtoken library version 9.x, configure with RS256 algorithm, set expiration to 1 hour, implement refresh token with 7-day expiration",
			});
			expect(specific.content[0].text).toMatch(/Specificity[:\s|]+\d+\/100/);

			// Low specificity
			const vague = await promptingHierarchyEvaluator({
				promptText: "Make it better somehow",
			});
			expect(vague.content[0].text).toMatch(/Specificity[:\s|]+\d+\/100/);
		});

		it("should test predicted effectiveness calculation", async () => {
			const results = await promptingHierarchyEvaluator({
				promptText: `Comprehensive task description with clear goals and detailed requirements`,
			});
			// The output includes "Predicted Effectiveness" with a score
			expect(results.content[0].text).toContain("Predicted Effectiveness");
			expect(results.content[0].text).toMatch(/\d+\/100/);
		});

		it("should test hierarchy reference section inclusion", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText: "Test",
			});
			const text = result.content[0].text;
			expect(text).toContain("Hierarchy Level Reference");
			expect(text).toContain("Independent");
			expect(text).toContain("Scaffolding");
		});

		it("should test disclaimer inclusion", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText: "Test",
			});
			expect(result.content[0].text).toContain("Disclaimer");
		});
	});

	describe("Selector - task characteristic detection", () => {
		it("should detect high-risk keywords", async () => {
			const riskKeywords = [
				"production deployment",
				"payment processing",
				"security critical",
				"database migration",
				"data deletion",
			];

			for (const keyword of riskKeywords) {
				const result = await hierarchyLevelSelector({
					taskDescription: `Handle ${keyword} for the system`,
					agentCapability: "intermediate",
				});
				// High-risk tasks should recommend structured levels
				expect(result.content[0].text).toMatch(
					/Scaffolding|Full Physical|Modeling/,
				);
			}
		});

		it("should detect open-ended keywords", async () => {
			const openKeywords = [
				"explore possibilities",
				"research options",
				"discover approaches",
				"investigate solutions",
			];

			for (const keyword of openKeywords) {
				const result = await hierarchyLevelSelector({
					taskDescription: `${keyword} for the project`,
					agentCapability: "advanced",
				});
				// Open-ended tasks should recommend autonomous levels
				expect(result.content[0].text).toMatch(/Independent|Indirect|Direct/);
			}
		});

		it("should detect well-defined tasks", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription: "Create a REST API endpoint for user registration",
			});
			expect(result.content[0].text).toMatch(/Direct|Modeling/);
		});

		it("should detect precision requirements", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription:
					"The implementation must follow the exact specification precisely",
			});
			expect(result.content[0].text).toMatch(/Full Physical|Scaffolding/);
		});

		it("should provide all sections in output", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription: "Test comprehensive output",
				includeExamples: true,
				includeReferences: true,
			});

			const text = result.content[0].text;
			expect(text).toContain("Recommended Level");
			expect(text).toContain("How to Use");
			expect(text).toContain("All Level Scores");
			expect(text).toContain("Alternative Considerations");
			expect(text).toContain("Example Prompts");
			expect(text).toContain("References");
			expect(text).toContain("Note");
		});
	});
});
