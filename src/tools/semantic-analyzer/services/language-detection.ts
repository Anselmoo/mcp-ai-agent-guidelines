/**
 * Language Detection Service
 *
 * Provides extensible language detection using a registry pattern
 */

import type { LanguageAnalyzer } from "../types/index.js";

export class LanguageRegistry {
	private static instance: LanguageRegistry;
	private analyzers: Map<string, LanguageAnalyzer> = new Map();

	private constructor() {
		// Initialize with default language analyzers
		this.registerDefaultLanguages();
	}

	static getInstance(): LanguageRegistry {
		if (!LanguageRegistry.instance) {
			LanguageRegistry.instance = new LanguageRegistry();
		}
		return LanguageRegistry.instance;
	}

	/**
	 * Register a language analyzer
	 */
	register(analyzer: LanguageAnalyzer): void {
		this.analyzers.set(analyzer.name, analyzer);
	}

	/**
	 * Get analyzer by language name
	 */
	getAnalyzer(language: string): LanguageAnalyzer | undefined {
		return this.analyzers.get(language);
	}

	/**
	 * Detect language from code content
	 */
	detectLanguage(code: string): string {
		// Try each analyzer's detect method
		for (const [name, analyzer] of this.analyzers.entries()) {
			if (analyzer.detect(code)) {
				return name;
			}
		}
		return "Unknown";
	}

	/**
	 * Get all registered languages
	 */
	getRegisteredLanguages(): string[] {
		return Array.from(this.analyzers.keys());
	}

	private registerDefaultLanguages(): void {
		// Import and register default language analyzers
		// These will be implemented in separate files
		// For now, keep the detection logic inline for minimal changes

		// Register Java before Python to avoid false detection
		this.register({
			name: "Java",
			extensions: [".java"],
			detect: (code: string) => {
				return code.includes("public class") || code.includes("private class");
			},
			extractSymbols: () => [],
			extractDependencies: () => [],
		});

		this.register({
			name: "TypeScript/JavaScript",
			extensions: [".ts", ".tsx", ".js", ".jsx"],
			detect: (code: string) => {
				return (
					code.includes("function") ||
					code.includes("const") ||
					code.includes("=>") ||
					(code.includes("import") && code.includes("from"))
				);
			},
			extractSymbols: () => [], // Will be implemented in separate module
			extractDependencies: () => [], // Will be implemented in separate module
		});

		this.register({
			name: "Python",
			extensions: [".py"],
			detect: (code: string) => {
				return (
					(code.includes("def ") || code.includes("class ")) &&
					!code.includes("end") && // Distinguish from Ruby
					!code.includes("public class") && // Distinguish from Java
					!code.includes("private class") // Distinguish from Java
				);
			},
			extractSymbols: () => [],
			extractDependencies: () => [],
		});

		this.register({
			name: "Rust",
			extensions: [".rs"],
			detect: (code: string) => {
				return code.includes("fn ") && code.includes("->");
			},
			extractSymbols: () => [],
			extractDependencies: () => [],
		});

		this.register({
			name: "Go",
			extensions: [".go"],
			detect: (code: string) => {
				return code.includes("func ") && code.includes("package");
			},
			extractSymbols: () => [],
			extractDependencies: () => [],
		});

		this.register({
			name: "Ruby",
			extensions: [".rb"],
			detect: (code: string) => {
				return code.includes("def ") && code.includes("end");
			},
			extractSymbols: () => [],
			extractDependencies: () => [],
		});

		this.register({
			name: "PHP",
			extensions: [".php"],
			detect: (code: string) => {
				return code.includes("<?php");
			},
			extractSymbols: () => [],
			extractDependencies: () => [],
		});

		this.register({
			name: "C++",
			extensions: [".cpp", ".cc", ".cxx", ".h", ".hpp"],
			detect: (code: string) => {
				return (
					code.includes("#include") &&
					(code.includes("::") || code.includes("std::"))
				);
			},
			extractSymbols: () => [],
			extractDependencies: () => [],
		});

		this.register({
			name: "C#",
			extensions: [".cs"],
			detect: (code: string) => {
				return code.includes("namespace") && code.includes("using");
			},
			extractSymbols: () => [],
			extractDependencies: () => [],
		});
	}
}

/**
 * Singleton instance for easy access
 */
export const languageRegistry = LanguageRegistry.getInstance();

/**
 * Detect language from code
 */
export function detectLanguage(code: string): string {
	return languageRegistry.detectLanguage(code);
}
