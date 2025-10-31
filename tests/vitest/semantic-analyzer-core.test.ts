/**
 * Tests for Semantic Analyzer Core and Formatters
 */

import { describe, expect, it } from "vitest";
import {
	analyzeCode,
	analyzeCodeAuto,
	buildDependenciesSection,
	buildPatternsSection,
	buildStructureSection,
	buildSymbolsSection,
	generateInsights,
	generateRecommendations,
} from "../../src/tools/semantic-analyzer/index.js";

describe("Analyzer Core", () => {
	const sampleCode = `
import { z } from 'zod';

export class UserService {
  constructor(private repo: Repository) {}

  async getUser(id: string): Promise<User> {
    try {
      return await this.repo.findById(id);
    } catch (error) {
      throw new Error('User not found');
    }
  }
}

export interface User {
  id: string;
  name: string;
}

export function createUser(data: any): User {
  return { id: data.id, name: data.name };
}
`;

	it("should analyze all aspects when type is 'all'", () => {
		const result = analyzeCode(sampleCode, "TypeScript/JavaScript", "all");
		expect(result.symbols).toBeDefined();
		expect(result.structure).toBeDefined();
		expect(result.dependencies).toBeDefined();
		expect(result.patterns).toBeDefined();
	});

	it("should analyze only symbols when type is 'symbols'", () => {
		const result = analyzeCode(sampleCode, "TypeScript/JavaScript", "symbols");
		expect(result.symbols).toBeDefined();
		expect(result.structure).toBeUndefined();
		expect(result.dependencies).toBeUndefined();
		expect(result.patterns).toBeUndefined();
	});

	it("should analyze only structure when type is 'structure'", () => {
		const result = analyzeCode(
			sampleCode,
			"TypeScript/JavaScript",
			"structure",
		);
		expect(result.symbols).toBeUndefined();
		expect(result.structure).toBeDefined();
		expect(result.dependencies).toBeUndefined();
		expect(result.patterns).toBeUndefined();
	});

	it("should analyze only dependencies when type is 'dependencies'", () => {
		const result = analyzeCode(
			sampleCode,
			"TypeScript/JavaScript",
			"dependencies",
		);
		expect(result.symbols).toBeUndefined();
		expect(result.structure).toBeUndefined();
		expect(result.dependencies).toBeDefined();
		expect(result.patterns).toBeUndefined();
	});

	it("should analyze only patterns when type is 'patterns'", () => {
		const result = analyzeCode(sampleCode, "TypeScript/JavaScript", "patterns");
		expect(result.symbols).toBeUndefined();
		expect(result.structure).toBeUndefined();
		expect(result.dependencies).toBeUndefined();
		expect(result.patterns).toBeDefined();
	});

	it("should auto-detect language and analyze", () => {
		const result = analyzeCodeAuto(sampleCode, "all");
		expect(result.language).toBe("TypeScript/JavaScript");
		expect(result.symbols).toBeDefined();
		expect(result.patterns).toBeDefined();
	});

	it("should default to 'all' analysis type in auto mode", () => {
		const result = analyzeCodeAuto(sampleCode);
		expect(result.symbols).toBeDefined();
		expect(result.structure).toBeDefined();
		expect(result.dependencies).toBeDefined();
		expect(result.patterns).toBeDefined();
	});

	it("should detect multiple patterns", () => {
		const result = analyzeCode(sampleCode, "TypeScript/JavaScript", "patterns");
		const patternNames = result.patterns?.map((p) => p.pattern) || [];
		expect(patternNames).toContain("Async/Await");
		expect(patternNames).toContain("Error Handling");
		expect(patternNames).toContain("Dependency Injection");
	});

	it("should extract multiple symbol types", () => {
		const result = analyzeCode(sampleCode, "TypeScript/JavaScript", "symbols");
		const symbolTypes = new Set(result.symbols?.map((s) => s.type) || []);
		expect(symbolTypes.has("class")).toBe(true);
		expect(symbolTypes.has("interface")).toBe(true);
		expect(symbolTypes.has("function")).toBe(true);
	});
});

describe("Formatters", () => {
	describe("buildSymbolsSection", () => {
		it("should format symbols into sections", () => {
			const symbols = [
				{ name: "MyClass", type: "class" as const, line: 1 },
				{ name: "myFunc", type: "function" as const, line: 5 },
				{ name: "MyInterface", type: "interface" as const, line: 10 },
			];

			const output = buildSymbolsSection(symbols);
			expect(output).toContain("Symbols Identified");
			expect(output).toContain("MyClass");
			expect(output).toContain("myFunc");
			expect(output).toContain("MyInterface");
			expect(output).toContain("line 1");
		});

		it("should group symbols by type", () => {
			const symbols = [
				{ name: "Class1", type: "class" as const },
				{ name: "Class2", type: "class" as const },
				{ name: "func1", type: "function" as const },
			];

			const output = buildSymbolsSection(symbols);
			expect(output).toContain("Classs** (2)");
			expect(output).toContain("Functions** (1)");
		});

		it("should return empty string for empty symbols", () => {
			expect(buildSymbolsSection([])).toBe("");
		});
	});

	describe("buildStructureSection", () => {
		it("should format structure information", () => {
			const structure = [
				{
					type: "Classes",
					description: "2 class(es) defined",
					elements: ["Class1", "Class2"],
				},
				{
					type: "Functions",
					description: "3 function(s) defined",
					elements: ["func1", "func2", "func3"],
				},
			];

			const output = buildStructureSection(structure);
			expect(output).toContain("Code Structure");
			expect(output).toContain("Classes");
			expect(output).toContain("2 class(es) defined");
			expect(output).toContain("Class1");
			expect(output).toContain("func1");
		});

		it("should return empty string for empty structure", () => {
			expect(buildStructureSection([])).toBe("");
		});
	});

	describe("buildDependenciesSection", () => {
		it("should format dependencies", () => {
			const dependencies = [
				{ type: "import" as const, module: "zod", items: ["z"] },
				{ type: "import" as const, module: "express" },
			];

			const output = buildDependenciesSection(dependencies);
			expect(output).toContain("Dependencies");
			expect(output).toContain("zod");
			expect(output).toContain("z");
			expect(output).toContain("express");
		});

		it("should return empty string for empty dependencies", () => {
			expect(buildDependenciesSection([])).toBe("");
		});
	});

	describe("buildPatternsSection", () => {
		it("should format pattern information", () => {
			const patterns = [
				{
					pattern: "Singleton Pattern",
					description: "Single instance pattern",
					locations: ["getInstance", "private constructor"],
				},
			];

			const output = buildPatternsSection(patterns);
			expect(output).toContain("Design Patterns");
			expect(output).toContain("Singleton Pattern");
			expect(output).toContain("getInstance");
		});

		it("should return empty string for empty patterns", () => {
			expect(buildPatternsSection([])).toBe("");
		});
	});

	describe("generateInsights", () => {
		it("should generate insights about programming style", () => {
			const analysis = {
				symbols: [
					{ name: "f1", type: "function" as const },
					{ name: "f2", type: "function" as const },
					{ name: "f3", type: "function" as const },
					{ name: "f4", type: "function" as const },
					{ name: "C1", type: "class" as const },
				],
			};

			const insights = generateInsights(analysis, "TypeScript/JavaScript");
			expect(insights).toContain("Functional programming style");
		});

		it("should generate insights about OOP style", () => {
			const analysis = {
				symbols: [
					{ name: "C1", type: "class" as const },
					{ name: "C2", type: "class" as const },
					{ name: "f1", type: "function" as const },
				],
			};

			const insights = generateInsights(analysis, "TypeScript/JavaScript");
			expect(insights).toContain("Object-oriented design");
		});

		it("should mention dependencies", () => {
			const analysis = {
				dependencies: [
					{ type: "import" as const, module: "mod1" },
					{ type: "import" as const, module: "mod2" },
				],
			};

			const insights = generateInsights(analysis, "TypeScript/JavaScript");
			expect(insights).toContain("2 external dependencies");
		});

		it("should mention design patterns", () => {
			const analysis = {
				patterns: [
					{
						pattern: "Singleton Pattern",
						description: "test",
						locations: [],
					},
					{ pattern: "Factory Pattern", description: "test", locations: [] },
				],
			};

			const insights = generateInsights(analysis, "TypeScript/JavaScript");
			expect(insights).toContain("2 design pattern");
			expect(insights).toContain("Singleton Pattern");
			expect(insights).toContain("Factory Pattern");
		});

		it("should provide default insight for basic code", () => {
			const analysis = {};
			const insights = generateInsights(analysis, "Python");
			expect(insights).toContain("Python code with basic structure");
		});
	});

	describe("generateRecommendations", () => {
		it("should recommend interfaces for TypeScript classes without them", () => {
			const analysis = {
				symbols: [
					{ name: "MyClass", type: "class" as const },
					{ name: "func", type: "function" as const },
				],
			};

			const recs = generateRecommendations(analysis, "TypeScript/JavaScript");
			expect(recs).toContain("interfaces");
		});

		it("should recommend error handling when missing", () => {
			const analysis = {
				patterns: [],
			};

			const recs = generateRecommendations(analysis, "TypeScript/JavaScript");
			expect(recs).toContain("error handling");
		});

		it("should recommend async error handling", () => {
			const analysis = {
				patterns: [
					{ pattern: "Async/Await", description: "test", locations: [] },
				],
			};

			const recs = generateRecommendations(analysis, "TypeScript/JavaScript");
			expect(recs).toContain("async operations");
		});

		it("should recommend dependency review for many dependencies", () => {
			const analysis = {
				dependencies: Array.from({ length: 15 }, (_, i) => ({
					type: "import" as const,
					module: `mod${i}`,
				})),
			};

			const recs = generateRecommendations(analysis, "TypeScript/JavaScript");
			expect(recs).toContain("dependencies");
		});

		it("should provide positive feedback for well-organized code", () => {
			const analysis = {
				symbols: [
					{ name: "IUser", type: "interface" as const },
					{ name: "User", type: "class" as const },
				],
				patterns: [
					{ pattern: "Error Handling", description: "test", locations: [] },
				],
			};

			const recs = generateRecommendations(analysis, "TypeScript/JavaScript");
			expect(recs).toContain("well-organized");
		});
	});
});

describe("Integration Tests", () => {
	it("should handle complete analysis workflow", () => {
		const code = `
import { Controller } from 'framework';

@Component
export class UserController {
  private static instance: UserController;

  static getInstance(): UserController {
    if (!this.instance) {
      this.instance = new UserController();
    }
    return this.instance;
  }

  async fetchUser(id: string): Promise<User> {
    try {
      return await this.api.get(id);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
`;

		const result = analyzeCodeAuto(code, "all");

		// Should detect language
		expect(result.language).toBe("TypeScript/JavaScript");

		// Should find symbols
		expect(result.symbols?.some((s) => s.name === "UserController")).toBe(true);

		// Should detect multiple patterns
		const patternNames = result.patterns?.map((p) => p.pattern) || [];
		expect(patternNames).toContain("Singleton Pattern");
		expect(patternNames).toContain("Async/Await");
		expect(patternNames).toContain("Error Handling");
		expect(patternNames).toContain("Decorator Pattern");

		// Should find dependencies
		expect(result.dependencies?.some((d) => d.module === "framework")).toBe(
			true,
		);

		// Should analyze structure
		expect(result.structure?.some((s) => s.type === "Classes")).toBe(true);
	});

	it("should produce formatted output", () => {
		const code = "class Test { createObject() {} }";
		const result = analyzeCodeAuto(code, "all");

		const symbolsSection = buildSymbolsSection(result.symbols || []);
		const structureSection = buildStructureSection(result.structure || []);
		const patternsSection = buildPatternsSection(result.patterns || []);
		const insights = generateInsights(result, result.language);
		const recommendations = generateRecommendations(result, result.language);

		expect(symbolsSection).toContain("Test");
		expect(structureSection).toContain("Classes");
		expect(patternsSection).toContain("Factory Pattern");
		expect(insights).toBeTruthy();
		expect(recommendations).toBeTruthy();
	});
});
