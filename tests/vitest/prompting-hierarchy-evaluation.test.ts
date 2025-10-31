import { describe, expect, it } from "vitest";
import { hierarchyLevelSelector } from "../../src/tools/prompt/hierarchy-level-selector.js";
import { promptingHierarchyEvaluator } from "../../src/tools/prompt/prompting-hierarchy-evaluator.js";

describe("Prompting Hierarchy and Numeric Evaluation", () => {
	describe("prompting-hierarchy-evaluator", () => {
		it("should evaluate an independent-level prompt", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText:
					"Improve the system performance and optimize where possible.",
				includeRecommendations: true,
				includeReferences: false,
			});

			expect(result).toBeDefined();
			expect(result.content).toBeInstanceOf(Array);
			expect(result.content[0].type).toBe("text");

			const text = result.content[0].text;
			expect(text).toContain("Independent");
			expect(text).toContain("Overall Score");
			expect(text).toContain("Predicted Effectiveness");
		});

		it("should evaluate a direct instruction prompt", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText:
					"Implement JWT token authentication for the user login endpoint. Add input validation for email and password fields.",
				includeRecommendations: true,
				includeReferences: true,
			});

			expect(result).toBeDefined();
			const text = result.content[0].text;
			expect(text).toContain("Direct");
			expect(text).toContain("Clarity");
			expect(text).toContain("Specificity");
			expect(text).toContain("Further Reading");
		});

		it("should evaluate a scaffolding-level prompt with steps", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText: `Refactor the authentication module:
1. First, analyze the current implementation
2. Then, identify security vulnerabilities
3. Next, implement JWT token support
4. Finally, add comprehensive tests`,
				targetLevel: "scaffolding",
				includeRecommendations: true,
			});

			expect(result).toBeDefined();
			const text = result.content[0].text;
			expect(text).toContain("Scaffolding");
			expect(text).toContain("Component Scores");
		});

		it("should evaluate a modeling-level prompt with examples", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText: `Add error handling following this pattern:
\`\`\`typescript
try {
  const result = await api.call();
  return result;
} catch (error) {
  logger.error(error);
  throw new ApiError(error.message);
}
\`\`\`
Apply this pattern to all API endpoints.`,
				includeRecommendations: false,
			});

			expect(result).toBeDefined();
			const text = result.content[0].text;
			expect(text).toContain("Modeling");
		});

		it("should provide numeric evaluation scores", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText:
					"Create a user registration form with email validation and password strength checking.",
				includeRecommendations: true,
			});

			const text = result.content[0].text;
			// Check that numeric scores are present
			expect(text).toMatch(/\d+\/100/);
			expect(text).toContain("Clarity");
			expect(text).toContain("Specificity");
			expect(text).toContain("Completeness");
			expect(text).toContain("Structure");
			expect(text).toContain("Cognitive Complexity");
		});

		it("should provide recommendations for improvement", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText: "Do something",
				includeRecommendations: true,
			});

			const text = result.content[0].text;
			expect(text).toContain("Recommendations");
			// Should have recommendations for such a vague prompt
			expect(text).toMatch(/Improve|Increase|Enhance|Add/);
		});

		it("should detect mismatch between target and actual hierarchy level", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText: "Optimize the code",
				targetLevel: "scaffolding",
				includeRecommendations: true,
			});

			const text = result.content[0].text;
			expect(text).toContain("Adjust hierarchy level");
		});

		it("should handle full-physical level prompts", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText: `1. Open file src/auth.ts at line 42
2. Replace 'const token = generateToken()' with 'const token = jwt.sign({userId}, SECRET_KEY)'
3. Add import statement: import jwt from 'jsonwebtoken'
4. Save the file
5. Run npm test
6. Verify all 15 tests pass`,
				includeRecommendations: false,
			});

			const text = result.content[0].text;
			expect(text).toContain("Full Physical");
		});
	});

	describe("hierarchy-level-selector", () => {
		it("should recommend independent level for expert agent with simple task", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription:
					"Research and implement the best caching strategy for our API",
				agentCapability: "expert",
				taskComplexity: "simple",
				autonomyPreference: "high",
				includeExamples: true,
				includeReferences: false,
			});

			expect(result).toBeDefined();
			const text = result.content[0].text;
			expect(text).toContain("Recommended Level");
			expect(text).toContain("Independent");
			expect(text).toContain("All Level Scores");
		});

		it("should recommend scaffolding level for novice agent with complex task", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription:
					"Implement a comprehensive authentication system with OAuth, JWT, and session management",
				agentCapability: "novice",
				taskComplexity: "very-complex",
				autonomyPreference: "low",
				includeExamples: true,
			});

			expect(result).toBeDefined();
			const text = result.content[0].text;
			expect(text).toMatch(/Scaffolding|Full Physical/);
			expect(text).toContain("How to Use");
		});

		it("should recommend direct level for intermediate agent with moderate task", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription: "Add input validation to the user registration form",
				agentCapability: "intermediate",
				taskComplexity: "moderate",
				autonomyPreference: "medium",
			});

			expect(result).toBeDefined();
			const text = result.content[0].text;
			expect(text).toMatch(/Direct|Modeling/);
		});

		it("should recommend full-physical for high-risk tasks", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription:
					"Deploy the payment processing module to production with database migration",
				agentCapability: "intermediate",
				taskComplexity: "complex",
				includeExamples: false,
			});

			expect(result).toBeDefined();
			const text = result.content[0].text;
			// High-risk keywords should push toward more structured levels
			expect(text).toMatch(/Scaffolding|Full Physical/);
		});

		it("should include example prompts when requested", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription: "Create a new API endpoint",
				includeExamples: true,
			});

			const text = result.content[0].text;
			expect(text).toContain("Example Prompts");
		});

		it("should show all level scores in ranking", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription: "Refactor the legacy authentication code",
				includeReferences: true,
			});

			const text = result.content[0].text;
			expect(text).toContain("All Level Scores");
			expect(text).toContain("Rank");
			expect(text).toContain("🥇");
		});

		it("should provide alternative considerations", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription: "Optimize database queries",
			});

			const text = result.content[0].text;
			expect(text).toContain("Alternative Considerations");
		});

		it("should adjust recommendations for open-ended tasks", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription:
					"Research and explore new approaches to improve system scalability",
				agentCapability: "advanced",
				taskComplexity: "complex",
				autonomyPreference: "high",
			});

			const text = result.content[0].text;
			// Open-ended tasks should favor independent or indirect levels
			expect(text).toMatch(/Independent|Indirect/);
		});
	});

	describe("Integration: Evaluator and Selector", () => {
		it("should work together - evaluate a prompt and suggest level adjustments", async () => {
			// First, select appropriate level
			const selectorResult = await hierarchyLevelSelector({
				taskDescription: "Fix the authentication bug in the login module",
				agentCapability: "intermediate",
				taskComplexity: "moderate",
			});

			expect(selectorResult).toBeDefined();

			// Then evaluate a prompt for that task
			const evaluatorResult = await promptingHierarchyEvaluator({
				promptText: "Fix the bug",
				includeRecommendations: true,
			});

			expect(evaluatorResult).toBeDefined();
			const evalText = evaluatorResult.content[0].text;

			// The vague prompt should get low scores
			expect(evalText).toMatch(/\d+\/100/);
		});

		it("should demonstrate reinforcement learning-style scoring", async () => {
			// Good prompt should get high effectiveness score
			const goodPrompt = await promptingHierarchyEvaluator({
				promptText: `# Context
The authentication module currently has a bug where tokens expire incorrectly.

# Goal
Fix the token expiration logic to ensure tokens last for the configured duration.

# Requirements
1. Review the current token generation code
2. Fix the expiration calculation
3. Add unit tests for various expiration scenarios
4. Update documentation

# Expected Output
- Fixed token expiration logic
- Minimum 95% test coverage
- Updated API documentation`,
			});

			const goodText = goodPrompt.content[0].text;

			// Extract the predicted effectiveness score
			const effectivenessMatch = goodText.match(
				/Predicted Effectiveness[:\s]+(\d+)\/100/,
			);
			if (effectivenessMatch) {
				const score = Number.parseInt(effectivenessMatch[1], 10);
				expect(score).toBeGreaterThanOrEqual(60); // Should have decent effectiveness
			}
		});
	});
});
