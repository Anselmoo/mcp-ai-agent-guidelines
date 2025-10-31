/**
 * Tests for Semantic Analyzer Services
 */

import { describe, expect, it } from "vitest";
import {
	analyzeStructure,
	detectLanguage,
	detectPatterns,
	extractDependencies,
	extractSymbols,
	LanguageRegistry,
	languageRegistry,
	PatternRegistry,
	patternRegistry,
} from "../../src/tools/semantic-analyzer/services/index.js";

describe("Language Detection Service", () => {
	it("should detect TypeScript/JavaScript", () => {
		const code = "const x = () => console.log('hello');";
		expect(detectLanguage(code)).toBe("TypeScript/JavaScript");
	});

	it("should detect Python", () => {
		const code = "def hello():\n    print('hello')";
		expect(detectLanguage(code)).toBe("Python");
	});

	it("should detect Java", () => {
		const code = "public class Main { }";
		expect(detectLanguage(code)).toBe("Java");
	});

	it("should detect Rust", () => {
		const code = "fn main() -> i32 { return 0; }";
		expect(detectLanguage(code)).toBe("Rust");
	});

	it("should detect Go", () => {
		const code = "package main\nfunc main() {}";
		expect(detectLanguage(code)).toBe("Go");
	});

	it("should detect Ruby", () => {
		const code = "def hello\n  puts 'hello'\nend";
		expect(detectLanguage(code)).toBe("Ruby");
	});

	it("should detect PHP", () => {
		const code = "<?php echo 'hello'; ?>";
		expect(detectLanguage(code)).toBe("PHP");
	});

	it("should detect C++", () => {
		const code = "#include <iostream>\nstd::cout << 'hello';";
		expect(detectLanguage(code)).toBe("C++");
	});

	it("should detect C#", () => {
		const code = "using System;\nnamespace MyApp { }";
		expect(detectLanguage(code)).toBe("C#");
	});

	it("should return Unknown for unrecognized code", () => {
		const code = "some random text";
		expect(detectLanguage(code)).toBe("Unknown");
	});

	it("should provide singleton instance", () => {
		const instance1 = LanguageRegistry.getInstance();
		const instance2 = LanguageRegistry.getInstance();
		expect(instance1).toBe(instance2);
	});

	it("should list registered languages", () => {
		const languages = languageRegistry.getRegisteredLanguages();
		expect(languages).toContain("TypeScript/JavaScript");
		expect(languages).toContain("Python");
		expect(languages).toContain("Java");
		expect(languages.length).toBeGreaterThanOrEqual(9);
	});

	it("should allow custom language registration", () => {
		const customRegistry = LanguageRegistry.getInstance();
		customRegistry.register({
			name: "TestLang",
			extensions: [".test"],
			detect: (code) => code.includes("TEST_KEYWORD"),
			extractSymbols: () => [],
			extractDependencies: () => [],
		});

		const code = "TEST_KEYWORD program";
		expect(detectLanguage(code)).toBe("TestLang");
	});
});

describe("Symbol Extraction Service", () => {
	it("should extract TypeScript symbols", () => {
		const code = `
class MyClass {}
function myFunc() {}
interface MyInterface {}
type MyType = string;
`;
		const symbols = extractSymbols(code, "TypeScript/JavaScript");
		expect(symbols).toHaveLength(4);
		expect(
			symbols.some((s) => s.name === "MyClass" && s.type === "class"),
		).toBe(true);
		expect(
			symbols.some((s) => s.name === "myFunc" && s.type === "function"),
		).toBe(true);
		expect(
			symbols.some((s) => s.name === "MyInterface" && s.type === "interface"),
		).toBe(true);
		expect(symbols.some((s) => s.name === "MyType" && s.type === "type")).toBe(
			true,
		);
	});

	it("should extract Python symbols", () => {
		const code = `
class MyClass:
    pass

def my_function():
    pass
`;
		const symbols = extractSymbols(code, "Python");
		expect(symbols).toHaveLength(2);
		expect(
			symbols.some((s) => s.name === "MyClass" && s.type === "class"),
		).toBe(true);
		expect(
			symbols.some((s) => s.name === "my_function" && s.type === "function"),
		).toBe(true);
	});

	it("should extract Java symbols", () => {
		const code = `
public class MyClass {
    public void myMethod() {}
}
`;
		const symbols = extractSymbols(code, "Java");
		expect(symbols.length).toBeGreaterThanOrEqual(1);
		expect(
			symbols.some((s) => s.name === "MyClass" && s.type === "class"),
		).toBe(true);
	});

	it("should include line numbers", () => {
		const code = "class Test {}\nfunction test() {}";
		const symbols = extractSymbols(code, "TypeScript/JavaScript");
		const classSymbol = symbols.find((s) => s.name === "Test");
		expect(classSymbol?.line).toBe(1);
	});
});

describe("Dependency Extraction Service", () => {
	it("should extract TypeScript ES6 imports", () => {
		const code = `
import { a, b } from 'module1';
import * as mod from 'module2';
import defaultExport from 'module3';
`;
		const deps = extractDependencies(code, "TypeScript/JavaScript");
		expect(deps).toHaveLength(3);
		expect(deps.some((d) => d.module === "module1")).toBe(true);
		expect(deps.some((d) => d.module === "module2")).toBe(true);
		expect(deps.some((d) => d.module === "module3")).toBe(true);
	});

	it("should extract Python imports", () => {
		const code = `
import os
from typing import List, Dict
`;
		const deps = extractDependencies(code, "Python");
		expect(deps).toHaveLength(2);
		expect(deps.some((d) => d.module === "os")).toBe(true);
		expect(deps.some((d) => d.module === "typing")).toBe(true);
	});

	it("should extract Java imports", () => {
		const code = `
import java.util.ArrayList;
import static java.lang.Math.PI;
`;
		const deps = extractDependencies(code, "Java");
		expect(deps).toHaveLength(2);
		expect(deps.some((d) => d.module.includes("ArrayList"))).toBe(true);
	});

	it("should extract Go imports", () => {
		const code = `
import "fmt"
`;
		const deps = extractDependencies(code, "Go");
		expect(deps).toHaveLength(1);
		expect(deps[0].module).toBe("fmt");
	});

	it("should extract Rust dependencies", () => {
		const code = `
use std::collections::HashMap;
`;
		const deps = extractDependencies(code, "Rust");
		expect(deps).toHaveLength(1);
		expect(deps[0].module).toContain("HashMap");
	});
});

describe("Pattern Detection Service", () => {
	it("should detect Async/Await pattern", () => {
		const code = "async function test() { await fetch(); }";
		const patterns = detectPatterns(code, "TypeScript/JavaScript");
		expect(patterns.some((p) => p.pattern === "Async/Await")).toBe(true);
	});

	it("should detect Error Handling pattern", () => {
		const code = "try { doSomething(); } catch (e) { handleError(e); }";
		const patterns = detectPatterns(code, "TypeScript/JavaScript");
		expect(patterns.some((p) => p.pattern === "Error Handling")).toBe(true);
	});

	it("should detect Dependency Injection pattern", () => {
		const code = "class Service { constructor(dep: Dependency) {} }";
		const patterns = detectPatterns(code, "TypeScript/JavaScript");
		expect(patterns.some((p) => p.pattern === "Dependency Injection")).toBe(
			true,
		);
	});

	it("should detect Factory Pattern", () => {
		const code = "class Factory { createObject() {} }";
		const patterns = detectPatterns(code, "TypeScript/JavaScript");
		expect(patterns.some((p) => p.pattern === "Factory Pattern")).toBe(true);
	});

	it("should detect Singleton Pattern", () => {
		const code =
			"class Singleton { private static instance; static getInstance() {} }";
		const patterns = detectPatterns(code, "TypeScript/JavaScript");
		expect(patterns.some((p) => p.pattern === "Singleton Pattern")).toBe(true);
	});

	it("should detect Observer Pattern", () => {
		const code = "addEventListener('click', handler);";
		const patterns = detectPatterns(code, "TypeScript/JavaScript");
		expect(patterns.some((p) => p.pattern === "Observer Pattern")).toBe(true);
	});

	it("should detect Decorator Pattern", () => {
		const code = "@Component\nclass MyComponent {}";
		const patterns = detectPatterns(code, "TypeScript/JavaScript");
		expect(patterns.some((p) => p.pattern === "Decorator Pattern")).toBe(true);
	});

	it("should detect Strategy Pattern", () => {
		const code = "interface PaymentStrategy {} class CreditCardStrategy {}";
		const patterns = detectPatterns(code, "TypeScript/JavaScript");
		expect(patterns.some((p) => p.pattern === "Strategy Pattern")).toBe(true);
	});

	it("should detect Builder Pattern", () => {
		const code = "class UserBuilder { withName() {} build() {} }";
		const patterns = detectPatterns(code, "TypeScript/JavaScript");
		expect(patterns.some((p) => p.pattern === "Builder Pattern")).toBe(true);
	});

	it("should detect Adapter Pattern", () => {
		const code = "class DataAdapter implements IAdapter {}";
		const patterns = detectPatterns(code, "TypeScript/JavaScript");
		expect(patterns.some((p) => p.pattern === "Adapter Pattern")).toBe(true);
	});

	it("should detect Promise Pattern", () => {
		const code = "new Promise((resolve) => resolve(1)).then(x => x);";
		const patterns = detectPatterns(code, "TypeScript/JavaScript");
		expect(patterns.some((p) => p.pattern === "Promise Pattern")).toBe(true);
	});

	it("should provide singleton instance", () => {
		const instance1 = PatternRegistry.getInstance();
		const instance2 = PatternRegistry.getInstance();
		expect(instance1).toBe(instance2);
	});

	it("should list registered patterns", () => {
		const patterns = patternRegistry.getRegisteredPatterns();
		expect(patterns).toContain("Async/Await");
		expect(patterns).toContain("Singleton Pattern");
		expect(patterns).toContain("Observer Pattern");
		expect(patterns.length).toBeGreaterThanOrEqual(11);
	});

	it("should allow custom pattern registration", () => {
		patternRegistry.register({
			name: "Test Pattern",
			description: "A test pattern",
			detect: (code) => {
				if (code.includes("TEST_PATTERN")) {
					return {
						pattern: "Test Pattern",
						description: "A test pattern",
						locations: ["found"],
					};
				}
				return null;
			},
		});

		const code = "TEST_PATTERN implementation";
		const patterns = detectPatterns(code, "TypeScript/JavaScript");
		expect(patterns.some((p) => p.pattern === "Test Pattern")).toBe(true);
	});
});

describe("Structure Analysis Service", () => {
	it("should analyze code structure", () => {
		const code = `
class MyClass {}
function func1() {}
function func2() {}
interface IFace {}
`;
		const structure = analyzeStructure(code, "TypeScript/JavaScript");
		expect(structure.some((s) => s.type === "Classes")).toBe(true);
		expect(structure.some((s) => s.type === "Functions")).toBe(true);
		expect(structure.some((s) => s.type === "Interfaces")).toBe(true);
	});

	it("should include element counts", () => {
		const code = "class A {}\nclass B {}\nfunction f1() {}\nfunction f2() {}";
		const structure = analyzeStructure(code, "TypeScript/JavaScript");
		const classes = structure.find((s) => s.type === "Classes");
		expect(classes?.description).toContain("2");
		expect(classes?.elements).toHaveLength(2);
	});

	it("should list element names", () => {
		const code = "class Test {}\nfunction myFunc() {}";
		const structure = analyzeStructure(code, "TypeScript/JavaScript");
		const classes = structure.find((s) => s.type === "Classes");
		expect(classes?.elements).toContain("Test");
	});
});
