// Comprehensive tests for project-onboarding-bridge and semantic-analyzer-bridge
import { describe, expect, it } from "vitest";
import {
	enhanceToolWithProjectContext,
	extractProjectContext,
	generateContextualPrompt,
	generateModeGuidance,
	generateProjectSpecificHygieneRules,
	generateStrategyWithProjectContext,
} from "../../../src/tools/bridge/project-onboarding-bridge.js";
import {
	enhancePromptWithSemantics,
	extractSemanticInsights,
	generateHygieneRecommendations,
	generateSecurityAnalysisPrompt,
	integrateWithStrategyFrameworks,
	suggestRefactorings,
} from "../../../src/tools/bridge/semantic-analyzer-bridge.js";

describe("Project Onboarding Bridge - Comprehensive Coverage", () => {
	describe("extractProjectContext", () => {
		it("should extract all project metadata fields", () => {
			const markdown = `
| Name | AdvancedProject |
| Type | application |
| Languages | TypeScript/JavaScript, Python, Rust |
| Frameworks | React, Express, FastAPI |
| Build System | npm, cargo |
| Test Framework | vitest |

**Key Directories:**
- \`src/\`
- \`tests/\`
- \`lib/\`
- \`components/\`
- \`utils/\`
- \`api/\`

**Key Files:**
- \`package.json\`
- \`tsconfig.json\`
- \`Cargo.toml\`
- \`pyproject.toml\`

**Entry Points:**
- \`src/index.ts\`
- \`src/main.py\`
			`;

			const context = extractProjectContext(markdown);

			expect(context.name).toBe("AdvancedProject");
			expect(context.type).toBe("application");
			expect(context.languages).toEqual([
				"TypeScript/JavaScript",
				"Python",
				"Rust",
			]);
			expect(context.frameworks).toEqual(["React", "Express", "FastAPI"]);
			expect(context.buildSystem).toBe("npm, cargo");
			expect(context.testFramework).toBe("vitest");
			expect(context.structure.directories).toContain("src/");
			expect(context.structure.keyFiles).toContain("package.json");
			expect(context.structure.entryPoints).toContain("src/index.ts");
		});

		it("should handle missing optional fields gracefully", () => {
			const markdown = `
| Name | MinimalProject |
| Type | library |
			`;

			const context = extractProjectContext(markdown);

			expect(context.name).toBe("MinimalProject");
			expect(context.type).toBe("library");
			expect(context.languages).toEqual([]);
			expect(context.frameworks).toEqual([]);
			expect(context.buildSystem).toBe("");
			expect(context.testFramework).toBe("");
		});
	});

	describe("enhanceToolWithProjectContext", () => {
		it("should enhance object tool input with project context", () => {
			const toolInput = {
				code: "function test() {}",
				options: { strict: true },
			};

			const projectContext = {
				name: "TestProject",
				type: "library",
				languages: ["TypeScript/JavaScript"],
				frameworks: [],
				buildSystem: "npm",
				testFramework: "jest",
				structure: {
					directories: [],
					keyFiles: [],
					entryPoints: [],
				},
			};

			const enhanced = enhanceToolWithProjectContext(toolInput, projectContext);

			expect(enhanced).toHaveProperty("projectContext");
			expect((enhanced as any).projectContext.name).toBe("TestProject");
			expect((enhanced as any).projectContext.type).toBe("library");
		});

		it("should return non-object input unchanged", () => {
			const projectContext = {
				name: "TestProject",
				type: "library",
				languages: [],
				frameworks: [],
				buildSystem: "",
				testFramework: "",
				structure: { directories: [], keyFiles: [], entryPoints: [] },
			};

			expect(enhanceToolWithProjectContext("string", projectContext)).toBe(
				"string",
			);
			expect(enhanceToolWithProjectContext(123, projectContext)).toBe(123);
			expect(enhanceToolWithProjectContext(null, projectContext)).toBe(null);
		});
	});

	describe("generateContextualPrompt", () => {
		it("should generate complete contextual prompt", () => {
			const context = {
				name: "MyApp",
				type: "application",
				languages: ["TypeScript/JavaScript", "Python"],
				frameworks: ["React"],
				buildSystem: "npm",
				testFramework: "vitest",
				structure: {
					directories: [
						"src/",
						"tests/",
						"lib/",
						"api/",
						"components/",
						"utils/",
					],
					keyFiles: ["package.json", "tsconfig.json"],
					entryPoints: ["src/index.ts", "src/main.py"],
				},
			};

			const prompt = generateContextualPrompt(context, "Add new feature");

			expect(prompt).toContain("# Task: Add new feature");
			expect(prompt).toContain("**Name**: MyApp");
			expect(prompt).toContain("**Type**: application");
			expect(prompt).toContain("TypeScript/JavaScript, Python");
			expect(prompt).toContain("src/index.ts");
			expect(prompt).toContain("src/");
		});

		it("should handle empty structure arrays", () => {
			const context = {
				name: "EmptyApp",
				type: "library",
				languages: [],
				frameworks: [],
				buildSystem: "",
				testFramework: "",
				structure: {
					directories: [],
					keyFiles: [],
					entryPoints: [],
				},
			};

			const prompt = generateContextualPrompt(context, "Refactor code");

			expect(prompt).toContain("# Task: Refactor code");
			expect(prompt).toContain("**Name**: EmptyApp");
		});
	});

	describe("generateProjectSpecificHygieneRules", () => {
		it("should generate TypeScript/JavaScript specific rules", () => {
			const context = {
				name: "TSProject",
				type: "library",
				languages: ["TypeScript/JavaScript"],
				frameworks: [],
				buildSystem: "npm",
				testFramework: "vitest",
				structure: { directories: [], keyFiles: [], entryPoints: [] },
			};

			const rules = generateProjectSpecificHygieneRules(context);

			expect(rules).toContain("Check for proper TypeScript type annotations");
			expect(rules).toContain("Ensure ESLint/Biome rules are followed");
			expect(rules).toContain("Verify package.json scripts are documented");
			expect(rules).toContain("Ensure tests follow vitest best practices");
		});

		it("should generate Python specific rules", () => {
			const context = {
				name: "PyProject",
				type: "library",
				languages: ["Python"],
				frameworks: [],
				buildSystem: "pip",
				testFramework: "pytest",
				structure: { directories: [], keyFiles: [], entryPoints: [] },
			};

			const rules = generateProjectSpecificHygieneRules(context);

			expect(rules).toContain("Verify type hints are present");
			expect(rules).toContain("Check for PEP 8 compliance");
			expect(rules).toContain("Ensure tests follow pytest best practices");
		});

		it("should generate Rust specific rules", () => {
			const context = {
				name: "RustProject",
				type: "library",
				languages: ["Rust"],
				frameworks: [],
				buildSystem: "cargo",
				testFramework: "",
				structure: { directories: [], keyFiles: [], entryPoints: [] },
			};

			const rules = generateProjectSpecificHygieneRules(context);

			expect(rules).toContain("Run clippy for Rust-specific lints");
			expect(rules).toContain(
				"Check for proper ownership and borrowing patterns",
			);
		});

		it("should combine rules for multi-language projects", () => {
			const context = {
				name: "MultiLangProject",
				type: "application",
				languages: ["TypeScript/JavaScript", "Python", "Rust"],
				frameworks: [],
				buildSystem: "npm",
				testFramework: "jest",
				structure: { directories: [], keyFiles: [], entryPoints: [] },
			};

			const rules = generateProjectSpecificHygieneRules(context);

			expect(rules.length).toBeGreaterThan(5);
			expect(rules).toContain("Check for proper TypeScript type annotations");
			expect(rules).toContain("Verify type hints are present");
			expect(rules).toContain("Run clippy for Rust-specific lints");
		});
	});

	describe("generateModeGuidance", () => {
		it("should generate guidance for planning mode", () => {
			const context = {
				name: "TestApp",
				type: "application",
				languages: ["TypeScript/JavaScript"],
				frameworks: [],
				buildSystem: "npm",
				testFramework: "",
				structure: {
					directories: ["src/", "tests/"],
					keyFiles: [],
					entryPoints: [],
				},
			};

			const guidance = generateModeGuidance(context, "planning");

			expect(guidance).toBeDefined();
			expect(typeof guidance).toBe("string");
			expect(guidance.length).toBeGreaterThan(0);
			expect(guidance).toContain("Plan changes");
		});

		it("should generate guidance for editing mode", () => {
			const context = {
				name: "TestApp",
				type: "library",
				languages: ["Python"],
				frameworks: [],
				buildSystem: "pip",
				testFramework: "",
				structure: {
					directories: [],
					keyFiles: [],
					entryPoints: ["main.py"],
				},
			};

			const guidance = generateModeGuidance(context, "editing");

			expect(guidance).toBeDefined();
			expect(typeof guidance).toBe("string");
			expect(guidance.length).toBeGreaterThan(0);
			expect(guidance).toContain("Edit files");
		});
	});

	describe("generateStrategyWithProjectContext", () => {
		it("should generate SWOT strategy with project context", () => {
			const context = {
				name: "StrategyApp",
				type: "application",
				languages: ["TypeScript/JavaScript"],
				frameworks: ["React"],
				buildSystem: "npm",
				testFramework: "vitest",
				structure: {
					directories: ["src/", "tests/"],
					keyFiles: ["package.json"],
					entryPoints: ["src/index.ts"],
				},
			};

			const strategy = generateStrategyWithProjectContext(context);

			expect(strategy).toBeDefined();
			expect(typeof strategy).toBe("object");
			expect(strategy).toHaveProperty("swot");
			expect(strategy).toHaveProperty("recommendations");
			expect(strategy.swot).toHaveProperty("strengths");
			expect(strategy.swot).toHaveProperty("weaknesses");
			expect(strategy.swot).toHaveProperty("opportunities");
			expect(strategy.swot).toHaveProperty("threats");
			expect(Array.isArray(strategy.recommendations)).toBe(true);
		});

		it("should identify strengths based on project setup", () => {
			const context = {
				name: "WellSetupApp",
				type: "library",
				languages: ["TypeScript/JavaScript", "Python"],
				frameworks: ["React", "FastAPI"],
				buildSystem: "npm",
				testFramework: "vitest",
				structure: {
					directories: ["src/", "tests/", "docs/"],
					keyFiles: ["package.json", "README.md"],
					entryPoints: ["src/index.ts"],
				},
			};

			const strategy = generateStrategyWithProjectContext(context);

			expect(strategy.swot.strengths.length).toBeGreaterThan(0);
		});
	});
});

describe("Semantic Analyzer Bridge - Comprehensive Coverage", () => {
	const sampleAnalysis = `
### 🏗️ Code Structure

- **Classes**: UserService, AuthController, DataRepository
- **Functions**: validateUser (5), authenticateToken (3), fetchData (10)

### 📦 Dependencies

- **express**: Web framework
- **jsonwebtoken**: JWT handling
- **bcrypt**: Password hashing

### 🔤 Symbols Identified

- UserService
- AuthController
- validateUser
- authenticateToken
	`;

	describe("extractSemanticInsights", () => {
		it("should extract all insight categories", () => {
			const insights = extractSemanticInsights(sampleAnalysis);

			expect(insights.structure).toContain("UserService");
			expect(insights.dependencies).toContain("express");
			expect(insights.dependencies).toContain("jsonwebtoken");
			expect(insights.symbols).toContain("UserService");
			expect(insights.symbols).toContain("AuthController");
		});

		it("should detect patterns in analysis", () => {
			const analysisWithPatterns = `
### 🏗️ Code Structure
- Async/Await patterns
- Error Handling implemented
- Dependency Injection used
- Factory Pattern
			`;

			const insights = extractSemanticInsights(analysisWithPatterns);

			expect(insights.patterns).toContain("Async/Await");
			expect(insights.patterns).toContain("Error Handling");
			expect(insights.patterns).toContain("Dependency Injection");
			expect(insights.patterns).toContain("Factory Pattern");
		});

		it("should handle missing sections gracefully", () => {
			const minimalAnalysis = "Some random text";

			const insights = extractSemanticInsights(minimalAnalysis);

			expect(insights.structure).toBe("");
			expect(insights.patterns).toEqual([]);
			expect(insights.dependencies).toEqual([]);
			expect(insights.symbols).toEqual([]);
		});
	});

	describe("enhancePromptWithSemantics", () => {
		it("should enhance prompt with semantic context", () => {
			const enhanced = enhancePromptWithSemantics(
				sampleAnalysis,
				"Refactor this code",
			);

			expect(enhanced).toContain("Refactor this code");
			expect(enhanced).toContain("Code Context from Semantic Analysis");
			expect(enhanced).toContain("Identified Patterns");
			expect(enhanced).toContain("Dependencies");
		});
	});

	describe("generateHygieneRecommendations", () => {
		it("should recommend error handling when missing", () => {
			const analysisWithoutErrors = "### 🏗️ Code Structure\n- Some code";

			const recs = generateHygieneRecommendations(analysisWithoutErrors);

			expect(recs).toContain(
				"Add comprehensive error handling (try-catch blocks)",
			);
		});

		it("should praise good dependency injection", () => {
			const analysisWithDI = "Dependency Injection pattern used";

			const recs = generateHygieneRecommendations(analysisWithDI);

			expect(recs).toContain("Good use of dependency injection pattern");
		});

		it("should suggest DI when not present", () => {
			const analysisWithoutDI = "Some code without DI";

			const recs = generateHygieneRecommendations(analysisWithoutDI);

			expect(recs).toContain(
				"Consider using dependency injection for better testability",
			);
		});

		it("should warn about async/await usage", () => {
			const analysisWithAsync = "Async/Await patterns used";

			const recs = generateHygieneRecommendations(analysisWithAsync);

			expect(recs).toContain(
				"Review async/await usage for potential race conditions",
			);
		});
	});

	describe("suggestRefactorings", () => {
		it("should suggest error handling when missing", () => {
			const analysisWithoutErrors = "Some code";

			const suggestions = suggestRefactorings(analysisWithoutErrors);

			const errorSuggestion = suggestions.find((s) =>
				s.suggestion.includes("error handling"),
			);
			expect(errorSuggestion).toBeDefined();
			expect(errorSuggestion?.priority).toBe("high");
		});

		it("should suggest modularization for high function count", () => {
			const analysisWithManyFuncs = "Functions (15)";

			const suggestions = suggestRefactorings(analysisWithManyFuncs);

			const modularSuggestion = suggestions.find((s) =>
				s.suggestion.includes("smaller modules"),
			);
			expect(modularSuggestion).toBeDefined();
			expect(modularSuggestion?.priority).toBe("medium");
		});

		it("should suggest DI as low priority", () => {
			const analysisWithoutDI = "Some code without DI";

			const suggestions = suggestRefactorings(analysisWithoutDI);

			const diSuggestion = suggestions.find((s) =>
				s.suggestion.includes("dependency injection"),
			);
			expect(diSuggestion).toBeDefined();
			expect(diSuggestion?.priority).toBe("low");
		});

		it("should not suggest modularization for few functions", () => {
			const analysisWithFewFuncs = "Functions (5)";

			const suggestions = suggestRefactorings(analysisWithFewFuncs);

			const modularSuggestion = suggestions.find((s) =>
				s.suggestion.includes("smaller modules"),
			);
			expect(modularSuggestion).toBeUndefined();
		});
	});

	describe("generateSecurityAnalysisPrompt", () => {
		it("should generate comprehensive security prompt", () => {
			const prompt = generateSecurityAnalysisPrompt(sampleAnalysis);

			expect(prompt).toContain("# Security Analysis Request");
			expect(prompt).toContain("Code Structure");
			expect(prompt).toContain("Areas to Analyze");
			expect(prompt).toContain("Input validation");
			expect(prompt).toContain("Dependency security");
			expect(prompt).toContain("express, jsonwebtoken, bcrypt");
		});

		it("should include async analysis for async patterns", () => {
			const asyncAnalysis = `
### 🏗️ Code Structure
- Async/Await patterns
			`;

			const prompt = generateSecurityAnalysisPrompt(asyncAnalysis);

			expect(prompt).toContain("Race condition analysis for async operations");
		});

		it("should not include async analysis for sync code", () => {
			const syncAnalysis = "### 🏗️ Code Structure\n- Synchronous code";

			const prompt = generateSecurityAnalysisPrompt(syncAnalysis);

			expect(prompt).not.toContain("Race condition");
		});
	});

	describe("integrateWithStrategyFrameworks", () => {
		it("should identify technical debt", () => {
			const analysisWithoutPatterns = "Some basic code";

			const result = integrateWithStrategyFrameworks(
				analysisWithoutPatterns,
				"project context",
			);

			expect(result.technicalDebt).toContain("Missing error handling");
			expect(result.technicalDebt).toContain("Tight coupling detected");
		});

		it("should not report debt for well-structured code", () => {
			const goodAnalysis = "Error Handling present, Dependency Injection used";

			const result = integrateWithStrategyFrameworks(
				goodAnalysis,
				"project context",
			);

			expect(result.technicalDebt).not.toContain("Missing error handling");
			expect(result.technicalDebt).not.toContain("Tight coupling detected");
		});

		it("should provide architecture insights", () => {
			const result = integrateWithStrategyFrameworks(
				sampleAnalysis,
				"project context",
			);

			expect(result.architectureInsights.length).toBeGreaterThan(0);
			expect(
				result.architectureInsights.some((i) => i.includes("Code structure")),
			).toBe(true);
			expect(
				result.architectureInsights.some((i) =>
					i.includes("External dependencies"),
				),
			).toBe(true);
		});

		it("should include recommendations", () => {
			const result = integrateWithStrategyFrameworks(
				sampleAnalysis,
				"project context",
			);

			expect(result.recommendations).toBeInstanceOf(Array);
			expect(result.recommendations.length).toBeGreaterThan(0);
		});
	});
});
