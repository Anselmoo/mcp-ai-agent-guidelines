/**
 * Symbol Extraction Service
 *
 * Extracts symbols (functions, classes, interfaces, etc.) from code
 */

import type { SymbolInfo } from "../types/index.js";

/**
 * Extract symbols from TypeScript/JavaScript code
 */
export function extractTypeScriptSymbols(code: string): SymbolInfo[] {
	const symbols: SymbolInfo[] = [];
	const lines = code.split("\n");

	lines.forEach((line, idx) => {
		// Functions
		if (
			line.match(/(?:function|const|let|var)\s+(\w+)\s*(?:=\s*)?(?:\(|async)/)
		) {
			const match = line.match(/(?:function|const|let|var)\s+(\w+)/);
			if (match) {
				symbols.push({
					name: match[1],
					type: "function",
					line: idx + 1,
				});
			}
		}
		// Classes
		if (line.match(/class\s+(\w+)/)) {
			const match = line.match(/class\s+(\w+)/);
			if (match) {
				symbols.push({ name: match[1], type: "class", line: idx + 1 });
			}
		}
		// Interfaces
		if (line.match(/interface\s+(\w+)/)) {
			const match = line.match(/interface\s+(\w+)/);
			if (match) {
				symbols.push({
					name: match[1],
					type: "interface",
					line: idx + 1,
				});
			}
		}
		// Types
		if (line.match(/type\s+(\w+)\s*=/)) {
			const match = line.match(/type\s+(\w+)/);
			if (match) {
				symbols.push({ name: match[1], type: "type", line: idx + 1 });
			}
		}
	});

	return symbols;
}

/**
 * Extract symbols from Python code
 */
export function extractPythonSymbols(code: string): SymbolInfo[] {
	const symbols: SymbolInfo[] = [];
	const lines = code.split("\n");

	lines.forEach((line, idx) => {
		// Functions
		if (line.match(/def\s+(\w+)/)) {
			const match = line.match(/def\s+(\w+)/);
			if (match) {
				symbols.push({
					name: match[1],
					type: "function",
					line: idx + 1,
				});
			}
		}
		// Classes
		if (line.match(/class\s+(\w+)/)) {
			const match = line.match(/class\s+(\w+)/);
			if (match) {
				symbols.push({ name: match[1], type: "class", line: idx + 1 });
			}
		}
	});

	return symbols;
}

/**
 * Extract symbols from Java code
 */
export function extractJavaSymbols(code: string): SymbolInfo[] {
	const symbols: SymbolInfo[] = [];
	const lines = code.split("\n");

	lines.forEach((line, idx) => {
		// Classes
		if (line.match(/(?:public|private|protected)?\s*class\s+(\w+)/)) {
			const match = line.match(/class\s+(\w+)/);
			if (match) {
				symbols.push({ name: match[1], type: "class", line: idx + 1 });
			}
		}
		// Methods
		if (line.match(/(?:public|private|protected)\s+\w+\s+(\w+)\s*\(/)) {
			const match = line.match(
				/(?:public|private|protected)\s+\w+\s+(\w+)\s*\(/,
			);
			if (match) {
				symbols.push({ name: match[1], type: "function", line: idx + 1 });
			}
		}
		// Interfaces
		if (line.match(/(?:public|private)?\s*interface\s+(\w+)/)) {
			const match = line.match(/interface\s+(\w+)/);
			if (match) {
				symbols.push({ name: match[1], type: "interface", line: idx + 1 });
			}
		}
	});

	return symbols;
}

/**
 * Main symbol extraction function that delegates to language-specific extractors
 */
export function extractSymbols(code: string, language: string): SymbolInfo[] {
	const languageLower = language.toLowerCase();

	if (
		languageLower.includes("typescript") ||
		languageLower.includes("javascript")
	) {
		return extractTypeScriptSymbols(code);
	}

	if (languageLower.includes("python")) {
		return extractPythonSymbols(code);
	}

	if (languageLower.includes("java")) {
		return extractJavaSymbols(code);
	}

	// Default: try TypeScript patterns for unknown languages
	return extractTypeScriptSymbols(code);
}
