import { describe, expect, it } from "vitest";
import {
	enhanceToolWithProjectContext,
	extractProjectContext,
	generateContextualPrompt,
	generateModeGuidance,
	generateProjectSpecificHygieneRules,
	generateStrategyWithProjectContext,
} from "../../../src/tools/bridge/project-onboarding-bridge.js";

describe("Project Onboarding Bridge - Comprehensive Coverage", () => {
	const sampleOnboardingResult = `
| Name | TestProject |
| Type | library |
| Languages | TypeScript/JavaScript, Python |
| Frameworks | React, Express |
| Build System | npm/yarn |
| Test Framework | vitest |

**Key Directories:**
- \`src\`
- \`tests\`
- \`dist\`
- \`node_modules\`
- \`docs\`

**Key Files:**
- \`package.json\`
- \`tsconfig.json\`
- \`README.md\`
- \`vite.config.ts\`

**Entry Points:**
- \`src/index.ts\`
- \`src/main.ts\`
- \`src/cli.ts\`
`;

	describe("extractProjectContext", () => {
		it("should extract all project information from markdown", () => {
			const context = extractProjectContext(sampleOnboardingResult);

			expect(context.name).toBe("TestProject");
			expect(context.type).toBe("library");
			expect(context.languages).toContain("TypeScript/JavaScript");
			expect(context.languages).toContain("Python");
			expect(context.frameworks).toContain("React");
			expect(context.frameworks).toContain("Express");
			expect(context.buildSystem).toBe("npm/yarn");
			expect(context.testFramework).toBe("vitest");
		});

		it("should extract directories correctly", () => {
			const context = extractProjectContext(sampleOnboardingResult);

			expect(context.structure.directories).toContain("src");
			expect(context.structure.directories).toContain("tests");
			expect(context.structure.directories).toContain("dist");
			expect(context.structure.directories).toContain("node_modules");
			expect(context.structure.directories).toContain("docs");
		});

		it("should extract key files correctly", () => {
			const context = extractProjectContext(sampleOnboardingResult);

			expect(context.structure.keyFiles).toContain("package.json");
			expect(context.structure.keyFiles).toContain("tsconfig.json");
			expect(context.structure.keyFiles).toContain("README.md");
			expect(context.structure.keyFiles).toContain("vite.config.ts");
		});

		it("should extract entry points correctly", () => {
			const context = extractProjectContext(sampleOnboardingResult);

			expect(context.structure.entryPoints).toContain("src/index.ts");
			expect(context.structure.entryPoints).toContain("src/main.ts");
			expect(context.structure.entryPoints).toContain("src/cli.ts");
		});

		it("should handle missing name", () => {
			const result = "| Type | application |";
			const context = extractProjectContext(result);

			expect(context.name).toBe("");
		});

		it("should handle missing type", () => {
			const result = "| Name | Test |";
			const context = extractProjectContext(result);

			expect(context.type).toBe("other");
		});

		it("should handle empty directories section", () => {
			const result = `
| Name | Test |
**Key Directories:**
`;
			const context = extractProjectContext(result);

			expect(context.structure.directories).toEqual([]);
		});

		it("should handle empty files section", () => {
			const result = `
| Name | Test |
**Key Files:**
`;
			const context = extractProjectContext(result);

			expect(context.structure.keyFiles).toEqual([]);
		});

		it("should handle empty entry points section", () => {
			const result = `
| Name | Test |
**Entry Points:**
# Next Section
`;
			const context = extractProjectContext(result);

			expect(context.structure.entryPoints).toEqual([]);
		});
	});

	describe("enhanceToolWithProjectContext", () => {
		const projectContext = extractProjectContext(sampleOnboardingResult);

		it("should enhance object with project context", () => {
			const toolInput = {
				codeContent: "const x = 1;",
				language: "typescript",
			};

			const enhanced = enhanceToolWithProjectContext(toolInput, projectContext);

			expect(enhanced).toHaveProperty("projectContext");
			expect((enhanced as any).projectContext.name).toBe("TestProject");
			expect((enhanced as any).projectContext.type).toBe("library");
			expect((enhanced as any).projectContext.languages).toContain(
				"TypeScript/JavaScript",
			);
			expect((enhanced as any).projectContext.buildSystem).toBe("npm/yarn");
		});

		it("should preserve original tool input properties", () => {
			const toolInput = {
				codeContent: "const x = 1;",
				language: "typescript",
			};

			const enhanced = enhanceToolWithProjectContext(toolInput, projectContext);

			expect((enhanced as any).codeContent).toBe("const x = 1;");
			expect((enhanced as any).language).toBe("typescript");
		});

		it("should handle null input", () => {
			const result = enhanceToolWithProjectContext(null, projectContext);
			expect(result).toBeNull();
		});

		it("should handle non-object input", () => {
			const result = enhanceToolWithProjectContext("string", projectContext);
			expect(result).toBe("string");
		});
	});

	describe("generateContextualPrompt", () => {
		const projectContext = extractProjectContext(sampleOnboardingResult);

		it("should generate prompt with project context", () => {
			const prompt = generateContextualPrompt(
				projectContext,
				"Add new feature",
			);

			expect(prompt).toContain("Task: Add new feature");
			expect(prompt).toContain("Project Context");
			expect(prompt).toContain("TestProject");
			expect(prompt).toContain("library");
			expect(prompt).toContain("TypeScript/JavaScript, Python");
			expect(prompt).toContain("npm/yarn");
			expect(prompt).toContain("vitest");
		});

		it("should include entry points in prompt", () => {
			const prompt = generateContextualPrompt(projectContext, "Refactor code");

			expect(prompt).toContain("Entry Points");
			expect(prompt).toContain("src/index.ts");
			expect(prompt).toContain("src/main.ts");
			expect(prompt).toContain("src/cli.ts");
		});

		it("should include key directories in prompt (limited to 5)", () => {
			const prompt = generateContextualPrompt(
				projectContext,
				"Review structure",
			);

			expect(prompt).toContain("Key Directories");
			expect(prompt).toContain("src");
			expect(prompt).toContain("tests");
		});

		it("should include key files in prompt (limited to 5)", () => {
			const prompt = generateContextualPrompt(projectContext, "Update config");

			expect(prompt).toContain("Key Files");
			expect(prompt).toContain("package.json");
			expect(prompt).toContain("tsconfig.json");
		});

		it("should include task requirements section", () => {
			const prompt = generateContextualPrompt(projectContext, "Test task");

			expect(prompt).toContain("Task Requirements");
			expect(prompt).toContain(
				"Consider the project structure and conventions",
			);
		});
	});

	describe("generateProjectSpecificHygieneRules", () => {
		it("should generate TypeScript/JavaScript rules", () => {
			const context = extractProjectContext(sampleOnboardingResult);
			const rules = generateProjectSpecificHygieneRules(context);

			expect(rules).toContain("Check for proper TypeScript type annotations");
			expect(rules).toContain("Ensure ESLint/Biome rules are followed");
		});

		it("should generate Python rules", () => {
			const context = extractProjectContext(sampleOnboardingResult);
			const rules = generateProjectSpecificHygieneRules(context);

			expect(rules).toContain("Verify type hints are present");
			expect(rules).toContain("Check for PEP 8 compliance");
		});

		it("should generate Rust rules", () => {
			const result = `
| Name | RustProject |
| Languages | Rust |
`;
			const context = extractProjectContext(result);
			const rules = generateProjectSpecificHygieneRules(context);

			expect(rules).toContain("Run clippy for Rust-specific lints");
			expect(rules).toContain(
				"Check for proper ownership and borrowing patterns",
			);
		});

		it("should generate npm-specific rules", () => {
			const context = extractProjectContext(sampleOnboardingResult);
			const rules = generateProjectSpecificHygieneRules(context);

			expect(rules).toContain("Verify package.json scripts are documented");
			expect(rules).toContain(
				"Check for security vulnerabilities with npm audit",
			);
		});

		it("should generate test framework rules", () => {
			const context = extractProjectContext(sampleOnboardingResult);
			const rules = generateProjectSpecificHygieneRules(context);

			expect(rules).toContain("Ensure tests follow vitest best practices");
			expect(rules).toContain("Verify test coverage meets project standards");
		});

		it("should handle projects without test framework", () => {
			const result = `
| Name | NoTestProject |
| Languages | TypeScript/JavaScript |
| Build System | npm |
`;
			const context = extractProjectContext(result);
			const rules = generateProjectSpecificHygieneRules(context);

			// Should still have language and build system rules
			expect(rules.length).toBeGreaterThan(0);
			expect(rules).toContain("Check for proper TypeScript type annotations");
		});
	});

	describe("generateStrategyWithProjectContext", () => {
		it("should generate SWOT analysis for library projects", () => {
			const context = extractProjectContext(sampleOnboardingResult);
			const strategy = generateStrategyWithProjectContext(context);

			expect(strategy.swot.strengths).toContain(
				"Reusable component architecture",
			);
		});

		it("should identify multi-language support as strength", () => {
			const context = extractProjectContext(sampleOnboardingResult);
			const strategy = generateStrategyWithProjectContext(context);

			expect(strategy.swot.strengths).toContain(
				"Multi-language support and versatility",
			);
		});

		it("should identify testing weaknesses", () => {
			const result = `
| Name | TestProject |
| Type | application |
| Languages | TypeScript/JavaScript |
| Test Framework | check |
`;
			const context = extractProjectContext(result);
			const strategy = generateStrategyWithProjectContext(context);

			expect(strategy.swot.weaknesses).toContain(
				"Testing infrastructure may need improvement",
			);
		});

		it("should identify npm ecosystem opportunities", () => {
			const context = extractProjectContext(sampleOnboardingResult);
			const strategy = generateStrategyWithProjectContext(context);

			expect(strategy.swot.opportunities).toContain(
				"Leverage npm ecosystem for rapid development",
			);
		});

		it("should identify JavaScript ecosystem threats when JS is in languages", () => {
			const result = `
| Name | JSProject |
| Type | library |
| Languages | JavaScript |
`;
			const context = extractProjectContext(result);
			const strategy = generateStrategyWithProjectContext(context);

			expect(strategy.swot.threats).toContain(
				"Rapid JavaScript ecosystem evolution requires regular updates",
			);
		});

		it("should provide recommendations", () => {
			const context = extractProjectContext(sampleOnboardingResult);
			const strategy = generateStrategyWithProjectContext(context);

			expect(strategy.recommendations.length).toBeGreaterThan(0);
			expect(strategy.recommendations[0]).toContain("library");
			expect(strategy.recommendations[1]).toContain("npm/yarn");
		});

		it("should handle projects without test framework", () => {
			const result = `
| Name | NoTestProject |
| Type | service |
| Languages | Python |
`;
			const context = extractProjectContext(result);
			const strategy = generateStrategyWithProjectContext(context);

			expect(strategy.swot.weaknesses).toContain(
				"Testing infrastructure may need improvement",
			);
		});
	});

	describe("generateModeGuidance", () => {
		const projectContext = extractProjectContext(sampleOnboardingResult);

		it("should generate planning mode guidance", () => {
			const guidance = generateModeGuidance(projectContext, "planning");

			expect(guidance).toContain(
				"Plan changes considering library architecture",
			);
			expect(guidance).toContain("Review project structure");
			expect(guidance).toContain("src");
		});

		it("should generate editing mode guidance", () => {
			const guidance = generateModeGuidance(projectContext, "editing");

			expect(guidance).toContain(
				"Edit files in TypeScript/JavaScript or Python following project conventions",
			);
			expect(guidance).toContain("Entry points:");
		});

		it("should generate refactoring mode guidance", () => {
			const guidance = generateModeGuidance(projectContext, "refactoring");

			expect(guidance).toContain(
				"Maintain library structure during refactoring",
			);
			expect(guidance).toContain(
				"Preserve TypeScript/JavaScript, Python idioms",
			);
		});

		it("should generate debugging mode guidance", () => {
			const guidance = generateModeGuidance(projectContext, "debugging");

			expect(guidance).toContain("Check vitest test outputs");
			expect(guidance).toContain("Use npm/yarn for rebuilding");
		});

		it("should handle unknown mode with empty guidance", () => {
			const guidance = generateModeGuidance(projectContext, "unknown-mode");

			// Unknown modes should return empty string
			expect(guidance).toBe("");
		});

		it("should handle mode with empty directories", () => {
			const result = `
| Name | MinimalProject |
| Type | application |
| Languages | JavaScript |
| Build System | npm |
| Test Framework | jest |

**Key Directories:**

**Key Files:**

**Entry Points:**
`;
			const context = extractProjectContext(result);
			const guidance = generateModeGuidance(context, "planning");

			expect(guidance).toContain(
				"Plan changes considering application architecture",
			);
		});
	});

	describe("Edge Cases and Integration", () => {
		it("should handle minimal onboarding result", () => {
			const minimalResult = "| Name | Minimal |";
			const context = extractProjectContext(minimalResult);

			expect(context.name).toBe("Minimal");
			expect(context.type).toBe("other");
			expect(context.languages).toEqual([]);
			expect(context.frameworks).toEqual([]);
		});

		it("should handle whitespace in extracted values", () => {
			const result = `
| Name |   SpacedName   |
| Type |   service   |
`;
			const context = extractProjectContext(result);

			expect(context.name).toBe("SpacedName");
			expect(context.type).toBe("service");
		});

		it("should handle comma-separated languages with spaces", () => {
			const result = `
| Languages | TypeScript/JavaScript , Python , Rust |
`;
			const context = extractProjectContext(result);

			expect(context.languages).toContain("TypeScript/JavaScript");
			expect(context.languages).toContain("Python");
			expect(context.languages).toContain("Rust");
		});

		it("should handle backticks in directory names", () => {
			const result = `
**Key Directories:**
- \`src/main\`
- tests
- \`build/output\`
`;
			const context = extractProjectContext(result);

			expect(context.structure.directories).toContain("src/main");
			expect(context.structure.directories).toContain("tests");
			expect(context.structure.directories).toContain("build/output");
		});
	});
});
