/**
 * Tests for Language Detection Service
 */
import { describe, expect, it } from "vitest";
import {
	detectLanguage,
	LanguageRegistry,
	languageRegistry,
} from "../../../src/tools/semantic-analyzer/services/language-detection.js";

describe("Language Detection Service", () => {
	describe("LanguageRegistry", () => {
		it("returns singleton instance", () => {
			const instance1 = LanguageRegistry.getInstance();
			const instance2 = LanguageRegistry.getInstance();
			expect(instance1).toBe(instance2);
		});

		it("has default languages registered", () => {
			const languages = languageRegistry.getRegisteredLanguages();
			expect(languages).toContain("TypeScript/JavaScript");
			expect(languages).toContain("Python");
			expect(languages).toContain("Java");
			expect(languages).toContain("Rust");
			expect(languages).toContain("Go");
			expect(languages).toContain("Ruby");
			expect(languages).toContain("PHP");
			expect(languages).toContain("C++");
			expect(languages).toContain("C#");
		});

		it("can get analyzer by language name", () => {
			const analyzer = languageRegistry.getAnalyzer("Python");
			expect(analyzer).toBeDefined();
			expect(analyzer?.name).toBe("Python");
			expect(analyzer?.extensions).toContain(".py");
		});

		it("returns undefined for unknown language", () => {
			const analyzer = languageRegistry.getAnalyzer("Unknown-Language");
			expect(analyzer).toBeUndefined();
		});

		it("can register custom analyzer", () => {
			languageRegistry.register({
				name: "TestLang",
				extensions: [".test"],
				detect: (code: string) => code.includes("TEST_LANG"),
				extractSymbols: () => [],
				extractDependencies: () => [],
			});
			const analyzer = languageRegistry.getAnalyzer("TestLang");
			expect(analyzer).toBeDefined();
			expect(analyzer?.name).toBe("TestLang");
		});
	});

	describe("detectLanguage", () => {
		it("detects TypeScript/JavaScript code", () => {
			const code = `
import { something } from 'module';
const myFunc = () => { return true; };
function hello() { console.log('hi'); }
`;
			expect(detectLanguage(code)).toBe("TypeScript/JavaScript");
		});

		it("detects Python code", () => {
			const code = `
def hello_world():
    print("Hello, World!")

class MyClass:
    def __init__(self):
        pass
`;
			expect(detectLanguage(code)).toBe("Python");
		});

		it("detects Java code", () => {
			const code = `
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`;
			expect(detectLanguage(code)).toBe("Java");
		});

		it("detects Java with private class", () => {
			const code = `
private class InnerClass {
    void doSomething() {}
}
`;
			expect(detectLanguage(code)).toBe("Java");
		});

		it("detects Rust code", () => {
			const code = `
fn main() -> i32 {
    println!("Hello, World!");
    return 0;
}
`;
			expect(detectLanguage(code)).toBe("Rust");
		});

		it("detects Go code", () => {
			const code = `
package main

func main() {
    fmt.Println("Hello, World!")
}
`;
			expect(detectLanguage(code)).toBe("Go");
		});

		it("detects Ruby code", () => {
			const code = `
def hello
    puts "Hello, World!"
end

class MyClass
    def initialize
    end
end
`;
			expect(detectLanguage(code)).toBe("Ruby");
		});

		it("detects PHP code", () => {
			const code = `<?php
echo "Hello, World!";
?>`;
			expect(detectLanguage(code)).toBe("PHP");
		});

		it("detects C++ code", () => {
			const code = `
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
    return 0;
}
`;
			expect(detectLanguage(code)).toBe("C++");
		});

		it("detects C# code", () => {
			// Use simple C# code that won't be detected as Python
			const code = `using System;
namespace HelloWorld { }`;
			expect(detectLanguage(code)).toBe("C#");
		});

		it("returns Unknown for unrecognized code", () => {
			const code = `
This is just plain text
with no programming language syntax.
`;
			expect(detectLanguage(code)).toBe("Unknown");
		});
	});

	describe("Language analyzer methods", () => {
		it("extractSymbols returns empty array for TypeScript/JavaScript", () => {
			const analyzer = languageRegistry.getAnalyzer("TypeScript/JavaScript");
			expect(analyzer?.extractSymbols("const x = 1;")).toEqual([]);
		});

		it("extractDependencies returns empty array for TypeScript/JavaScript", () => {
			const analyzer = languageRegistry.getAnalyzer("TypeScript/JavaScript");
			expect(analyzer?.extractDependencies("import x from 'y';")).toEqual([]);
		});

		it("extractSymbols returns empty array for Python", () => {
			const analyzer = languageRegistry.getAnalyzer("Python");
			expect(analyzer?.extractSymbols("def foo(): pass")).toEqual([]);
		});

		it("extractDependencies returns empty array for Python", () => {
			const analyzer = languageRegistry.getAnalyzer("Python");
			expect(analyzer?.extractDependencies("import os")).toEqual([]);
		});

		it("extractSymbols returns empty array for Java", () => {
			const analyzer = languageRegistry.getAnalyzer("Java");
			expect(analyzer?.extractSymbols("public class Foo {}")).toEqual([]);
		});

		it("extractDependencies returns empty array for Java", () => {
			const analyzer = languageRegistry.getAnalyzer("Java");
			expect(analyzer?.extractDependencies("import java.util.*;")).toEqual([]);
		});

		it("extractSymbols returns empty array for Rust", () => {
			const analyzer = languageRegistry.getAnalyzer("Rust");
			expect(analyzer?.extractSymbols("fn main() {}")).toEqual([]);
		});

		it("extractDependencies returns empty array for Rust", () => {
			const analyzer = languageRegistry.getAnalyzer("Rust");
			expect(analyzer?.extractDependencies("use std::io;")).toEqual([]);
		});

		it("extractSymbols returns empty array for Go", () => {
			const analyzer = languageRegistry.getAnalyzer("Go");
			expect(analyzer?.extractSymbols("func main() {}")).toEqual([]);
		});

		it("extractDependencies returns empty array for Go", () => {
			const analyzer = languageRegistry.getAnalyzer("Go");
			expect(analyzer?.extractDependencies('import "fmt"')).toEqual([]);
		});

		it("extractSymbols returns empty array for Ruby", () => {
			const analyzer = languageRegistry.getAnalyzer("Ruby");
			expect(analyzer?.extractSymbols("def foo; end")).toEqual([]);
		});

		it("extractDependencies returns empty array for Ruby", () => {
			const analyzer = languageRegistry.getAnalyzer("Ruby");
			expect(analyzer?.extractDependencies("require 'json'")).toEqual([]);
		});

		it("extractSymbols returns empty array for PHP", () => {
			const analyzer = languageRegistry.getAnalyzer("PHP");
			expect(analyzer?.extractSymbols("<?php function foo() {} ?>")).toEqual(
				[],
			);
		});

		it("extractDependencies returns empty array for PHP", () => {
			const analyzer = languageRegistry.getAnalyzer("PHP");
			expect(
				analyzer?.extractDependencies("<?php require 'file.php'; ?>"),
			).toEqual([]);
		});

		it("extractSymbols returns empty array for C++", () => {
			const analyzer = languageRegistry.getAnalyzer("C++");
			expect(analyzer?.extractSymbols("#include <iostream>")).toEqual([]);
		});

		it("extractDependencies returns empty array for C++", () => {
			const analyzer = languageRegistry.getAnalyzer("C++");
			expect(analyzer?.extractDependencies("#include <vector>")).toEqual([]);
		});

		it("extractSymbols returns empty array for C#", () => {
			const analyzer = languageRegistry.getAnalyzer("C#");
			expect(analyzer?.extractSymbols("namespace Test {}")).toEqual([]);
		});

		it("extractDependencies returns empty array for C#", () => {
			const analyzer = languageRegistry.getAnalyzer("C#");
			expect(analyzer?.extractDependencies("using System;")).toEqual([]);
		});
	});
});
