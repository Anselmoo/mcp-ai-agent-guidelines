import { describe, expect, it } from "vitest";
import { hierarchyLevelSelector } from "../../src/tools/prompt/hierarchy-level-selector.js";
import { promptingHierarchyEvaluator } from "../../src/tools/prompt/prompting-hierarchy-evaluator.js";

describe("Prompting Hierarchy - Additional Coverage", () => {
	describe("prompting-hierarchy-evaluator - edge cases", () => {
		it("should handle prompts with indirect cues", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText:
					"Consider the performance implications when implementing this feature. Think about edge cases in user input.",
				includeRecommendations: false,
				includeReferences: false,
			});

			expect(result).toBeDefined();
			const text = result.content[0].text;
			expect(text).toContain("Indirect");
		});

		it("should detect full-physical level with detailed steps", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText: `1. Open file src/auth.ts at line 42
2. Replace 'const token = generateToken()' with 'const token = jwt.sign({userId}, SECRET_KEY)'
3. Add import statement: import jwt from 'jsonwebtoken'
4. Save the file and run npm test
5. Verify all 15 tests pass
6. Commit changes with message "Fix token generation"`,
				includeRecommendations: true,
				includeReferences: false,
			});

			const text = result.content[0].text;
			expect(text).toContain("Full Physical");
			expect(text).toContain("Recommendations");
		});

		it("should provide recommendations for low-scoring prompts", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText: "Do it",
				includeRecommendations: true,
				includeReferences: false,
			});

			const text = result.content[0].text;
			expect(text).toContain("Recommendations");
			expect(text).toMatch(/Improve|Increase|Enhance|Add/);
		});

		it("should detect hierarchy level mismatch", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText: "Make it better",
				targetLevel: "full-physical",
				includeRecommendations: true,
			});

			const text = result.content[0].text;
			expect(text).toContain("Adjust hierarchy level");
		});

		it("should include references when requested", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText: "Implement user authentication",
				includeReferences: true,
			});

			const text = result.content[0].text;
			expect(text).toContain("References");
			expect(text).toContain("https://");
		});

		it("should handle prompts with only examples (modeling)", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText: `Here's an example of proper error handling:
\`\`\`typescript
try {
  const result = await api.call();
} catch (error) {
  logger.error(error);
}
\`\`\`
Apply this pattern to all endpoints.`,
				includeRecommendations: false,
			});

			const text = result.content[0].text;
			expect(text).toContain("Modeling");
		});

		it("should calculate completeness based on context and goals", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText: `# Context
The authentication system needs improvement.

# Goal
Enhance security with JWT tokens.

# Requirements
- Must support token refresh
- Should include rate limiting

# Constraints
- Cannot break existing API`,
				includeRecommendations: false,
			});

			const text = result.content[0].text;
			expect(text).toMatch(/Completeness[:\s|]+\d+\/100/);
		});

		it("should evaluate structure with headings and bullets", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText: `# Authentication Enhancement

## Requirements
- JWT token support
- OAuth integration
- Session management

## Steps
1. Research options
2. Implement solution
3. Test thoroughly`,
				includeRecommendations: false,
			});

			const text = result.content[0].text;
			expect(text).toMatch(/Structure[:\s|]+\d+\/100/);
		});

		it("should assess cognitive complexity", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText:
					"Implement a sophisticated microservices architecture with distributed transaction management, event-driven communication using message queues, comprehensive observability framework, and advanced security mechanisms including OAuth2, API gateway integration, and container orchestration.",
				includeRecommendations: false,
			});

			const text = result.content[0].text;
			expect(text).toMatch(/Cognitive Complexity[:\s|]+\d+\/100/);
		});

		it("should provide all hierarchy levels in reference section", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText: "Test prompt",
				includeRecommendations: false,
			});

			const text = result.content[0].text;
			expect(text).toContain("Hierarchy Level Reference");
			expect(text).toContain("Independent");
			expect(text).toContain("Indirect");
			expect(text).toContain("Direct");
			expect(text).toContain("Modeling");
			expect(text).toContain("Scaffolding");
			expect(text).toContain("Full Physical");
		});

		it("should include disclaimer", async () => {
			const result = await promptingHierarchyEvaluator({
				promptText: "Test prompt",
				includeRecommendations: false,
			});

			const text = result.content[0].text;
			expect(text).toContain("Disclaimer");
			expect(text).toContain("Human review");
		});
	});

	describe("hierarchy-level-selector - edge cases", () => {
		it("should recommend independent level for expert agents", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription:
					"Explore innovative solutions for improving system scalability",
				agentCapability: "expert",
				taskComplexity: "simple",
				autonomyPreference: "high",
				includeExamples: false,
				includeReferences: false,
			});

			const text = result.content[0].text;
			expect(text).toMatch(/Independent|Indirect/);
		});

		it("should recommend scaffolding for novice with complex task", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription:
					"Implement distributed system with microservices architecture",
				agentCapability: "novice",
				taskComplexity: "very-complex",
				autonomyPreference: "low",
				includeExamples: true,
			});

			const text = result.content[0].text;
			expect(text).toMatch(/Scaffolding|Full Physical/);
			expect(text).toContain("Example Prompts");
		});

		it("should recommend modeling for intermediate agent", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription: "Add validation to user input forms",
				agentCapability: "intermediate",
				taskComplexity: "moderate",
				autonomyPreference: "medium",
			});

			const text = result.content[0].text;
			expect(text).toMatch(/Direct|Modeling/);
		});

		it("should detect high-risk tasks and recommend higher support", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription:
					"Deploy payment processing to production with database migration",
				agentCapability: "intermediate",
				taskComplexity: "complex",
			});

			const text = result.content[0].text;
			expect(text).toMatch(/Scaffolding|Full Physical/);
		});

		it("should detect open-ended tasks and recommend lower support", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription: "Research and discover new optimization techniques",
				agentCapability: "advanced",
				taskComplexity: "moderate",
				autonomyPreference: "high",
			});

			const text = result.content[0].text;
			expect(text).toMatch(/Independent|Indirect|Direct/);
		});

		it("should include references when requested", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription: "Test task",
				includeReferences: true,
			});

			const text = result.content[0].text;
			expect(text).toContain("References");
			expect(text).toContain("https://");
		});

		it("should show all levels in ranking table", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription: "Implement feature",
			});

			const text = result.content[0].text;
			expect(text).toContain("All Level Scores");
			expect(text).toContain("🥇");
			expect(text).toContain("Independent");
			expect(text).toContain("Scaffolding");
		});

		it("should provide usage guidance for each level type", async () => {
			const levels = [
				"independent",
				"indirect",
				"direct",
				"modeling",
				"scaffolding",
				"full-physical",
			];

			for (const level of levels) {
				const taskMapping = {
					independent: "Explore and innovate on the system",
					indirect: "Consider improving the codebase",
					direct: "Add user authentication",
					modeling: "Follow this pattern for API endpoints",
					scaffolding: "Build authentication: 1. Research 2. Implement",
					"full-physical": "Step 1: Open auth.ts. Step 2: Add line 'const x=1'",
				};

				const result = await hierarchyLevelSelector({
					taskDescription: taskMapping[level as keyof typeof taskMapping],
					agentCapability:
						level === "independent"
							? "expert"
							: level === "full-physical"
								? "novice"
								: "intermediate",
					taskComplexity:
						level === "independent"
							? "simple"
							: level === "full-physical"
								? "very-complex"
								: "moderate",
				});

				const text = result.content[0].text;
				expect(text).toContain("How to Use");
			}
		});

		it("should show alternative considerations", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription: "Fix bug in authentication",
			});

			const text = result.content[0].text;
			expect(text).toContain("Alternative Considerations");
		});

		it("should handle advanced agent capability", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription: "Optimize database queries",
				agentCapability: "advanced",
				taskComplexity: "complex",
			});

			const text = result.content[0].text;
			expect(text).toBeDefined();
		});

		it("should handle well-defined tasks", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription: "Implement user registration endpoint",
			});

			const text = result.content[0].text;
			expect(text).toMatch(/Direct|Modeling/);
		});

		it("should handle tasks requiring precision", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription:
					"The exact implementation must follow the specification precisely",
			});

			const text = result.content[0].text;
			expect(text).toMatch(/Full Physical|Scaffolding/);
		});

		it("should include note about adjusting based on performance", async () => {
			const result = await hierarchyLevelSelector({
				taskDescription: "Test task",
			});

			const text = result.content[0].text;
			expect(text).toContain("Note");
			expect(text).toMatch(/adjust|performance|capability/i);
		});
	});
});
