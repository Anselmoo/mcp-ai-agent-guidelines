import { describe, expect, it } from "vitest";

// Import all exports from the bridge index to ensure they're covered
import {
	// Semantic Analyzer Bridge exports
	enhancePromptWithSemantics,
	// Project Onboarding Bridge exports
	enhanceToolWithProjectContext,
	extractProjectContext,
	extractSemanticInsights,
	generateContextualPrompt,
	generateHygieneRecommendations,
	generateModeGuidance,
	generateProjectSpecificHygieneRules,
	generateSecurityAnalysisPrompt,
	generateStrategyWithProjectContext,
	integrateWithStrategyFrameworks,
	suggestRefactorings,
} from "../../../src/tools/bridge/index.js";

describe("Bridge Index Exports Coverage", () => {
	describe("Project Onboarding Bridge Exports", () => {
		it("should export extractProjectContext", () => {
			expect(extractProjectContext).toBeDefined();
			expect(typeof extractProjectContext).toBe("function");
		});

		it("should export generateContextualPrompt", () => {
			expect(generateContextualPrompt).toBeDefined();
			expect(typeof generateContextualPrompt).toBe("function");
		});

		it("should export enhanceToolWithProjectContext", () => {
			expect(enhanceToolWithProjectContext).toBeDefined();
			expect(typeof enhanceToolWithProjectContext).toBe("function");
		});

		it("should export generateModeGuidance", () => {
			expect(generateModeGuidance).toBeDefined();
			expect(typeof generateModeGuidance).toBe("function");
		});

		it("should export generateProjectSpecificHygieneRules", () => {
			expect(generateProjectSpecificHygieneRules).toBeDefined();
			expect(typeof generateProjectSpecificHygieneRules).toBe("function");
		});

		it("should export generateStrategyWithProjectContext", () => {
			expect(generateStrategyWithProjectContext).toBeDefined();
			expect(typeof generateStrategyWithProjectContext).toBe("function");
		});
	});

	describe("Semantic Analyzer Bridge Exports", () => {
		it("should export enhancePromptWithSemantics", () => {
			expect(enhancePromptWithSemantics).toBeDefined();
			expect(typeof enhancePromptWithSemantics).toBe("function");
		});

		it("should export extractSemanticInsights", () => {
			expect(extractSemanticInsights).toBeDefined();
			expect(typeof extractSemanticInsights).toBe("function");
		});

		it("should export generateHygieneRecommendations", () => {
			expect(generateHygieneRecommendations).toBeDefined();
			expect(typeof generateHygieneRecommendations).toBe("function");
		});

		it("should export generateSecurityAnalysisPrompt", () => {
			expect(generateSecurityAnalysisPrompt).toBeDefined();
			expect(typeof generateSecurityAnalysisPrompt).toBe("function");
		});

		it("should export integrateWithStrategyFrameworks", () => {
			expect(integrateWithStrategyFrameworks).toBeDefined();
			expect(typeof integrateWithStrategyFrameworks).toBe("function");
		});

		it("should export suggestRefactorings", () => {
			expect(suggestRefactorings).toBeDefined();
			expect(typeof suggestRefactorings).toBe("function");
		});
	});

	describe("Functional Testing of Exported Functions", () => {
		const sampleProjectMarkdown = `
| Name | TestProject |
| Type | library |

**Key Directories:**
- \`src/\`
- \`tests/\`

**Entry Points:**
- \`src/index.ts\`
		`;

		const sampleSemanticAnalysis = `
### 🏗️ Code Structure

- **Classes**: UserService, AuthController
- **Functions**: validateUser, authenticateToken

### 📦 Dependencies

- **express**: Web framework
- **jsonwebtoken**: JWT handling

### 🔤 Symbols Identified

- UserService
- AuthController
- validateUser
- authenticateToken
		`;

		it("should work with project onboarding functions", () => {
			const context = extractProjectContext(sampleProjectMarkdown);
			expect(context.name).toBe("TestProject");
			expect(context.type).toBe("library");

			const prompt = generateContextualPrompt(context, "Implement new feature");
			expect(prompt).toContain("Implement new feature");
			expect(prompt).toContain("TestProject");
		});

		it("should work with semantic analyzer functions", () => {
			const insights = extractSemanticInsights(sampleSemanticAnalysis);
			expect(insights.dependencies).toContain("express");
			expect(insights.dependencies).toContain("jsonwebtoken");

			const enhanced = enhancePromptWithSemantics(
				sampleSemanticAnalysis,
				"Base prompt",
			);
			expect(enhanced).toContain("Base prompt");
			expect(enhanced).toContain("Code Context from Semantic Analysis");
		});
	});
});
