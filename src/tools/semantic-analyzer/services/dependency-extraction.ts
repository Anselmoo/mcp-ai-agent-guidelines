/**
 * Dependency Extraction Service
 *
 * Extracts dependencies and imports from code
 */

import type { DependencyInfo } from "../types/index.js";

/**
 * Extract dependencies from TypeScript/JavaScript code
 */
export function extractTypeScriptDependencies(code: string): DependencyInfo[] {
	const dependencies: DependencyInfo[] = [];
	const lines = code.split("\n");

	lines.forEach((line) => {
		// ES6 imports
		const importMatch = line.match(
			/import\s+(?:{([^}]+)}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/,
		);
		if (importMatch) {
			dependencies.push({
				type: "import",
				module: importMatch[2],
				items: importMatch[1]?.split(",").map((s) => s.trim()),
			});
		}

		// CommonJS require
		const requireMatch = line.match(/require\s*\(['"]([^'"]+)['"]\)/);
		if (requireMatch) {
			dependencies.push({
				type: "require",
				module: requireMatch[1],
			});
		}
	});

	return dependencies;
}

/**
 * Extract dependencies from Python code
 */
export function extractPythonDependencies(code: string): DependencyInfo[] {
	const dependencies: DependencyInfo[] = [];
	const lines = code.split("\n");

	lines.forEach((line) => {
		// Python imports
		const importMatch = line.match(/(?:from\s+(\S+)\s+)?import\s+(.+)/);
		if (importMatch) {
			dependencies.push({
				type: "import",
				module: importMatch[1] || importMatch[2].split(",")[0].trim(),
				items: importMatch[2]?.split(",").map((s) => s.trim()),
			});
		}
	});

	return dependencies;
}

/**
 * Extract dependencies from Java code
 */
export function extractJavaDependencies(code: string): DependencyInfo[] {
	const dependencies: DependencyInfo[] = [];
	const lines = code.split("\n");

	lines.forEach((line) => {
		// Java imports
		const importMatch = line.match(/import\s+(?:static\s+)?([^;]+);/);
		if (importMatch) {
			const fullPath = importMatch[1].trim();
			const parts = fullPath.split(".");
			const className = parts[parts.length - 1];

			dependencies.push({
				type: "import",
				module: fullPath,
				items: [className],
			});
		}
	});

	return dependencies;
}

/**
 * Extract dependencies from Go code
 */
export function extractGoDependencies(code: string): DependencyInfo[] {
	const dependencies: DependencyInfo[] = [];
	const lines = code.split("\n");

	lines.forEach((line) => {
		// Go imports
		const importMatch = line.match(/import\s+(?:"([^"]+)"|(\([^)]+\)))/);
		if (importMatch) {
			if (importMatch[1]) {
				// Single import
				dependencies.push({
					type: "import",
					module: importMatch[1],
				});
			}
		}
	});

	return dependencies;
}

/**
 * Extract dependencies from Rust code
 */
export function extractRustDependencies(code: string): DependencyInfo[] {
	const dependencies: DependencyInfo[] = [];
	const lines = code.split("\n");

	lines.forEach((line) => {
		// Rust use statements
		const useMatch = line.match(/use\s+([^;]+);/);
		if (useMatch) {
			const path = useMatch[1].trim();
			dependencies.push({
				type: "import",
				module: path,
			});
		}
	});

	return dependencies;
}

/**
 * Main dependency extraction function that delegates to language-specific extractors
 */
export function extractDependencies(
	code: string,
	language: string,
): DependencyInfo[] {
	const languageLower = language.toLowerCase();

	if (
		languageLower.includes("typescript") ||
		languageLower.includes("javascript")
	) {
		return extractTypeScriptDependencies(code);
	}

	if (languageLower.includes("python")) {
		return extractPythonDependencies(code);
	}

	if (languageLower.includes("java")) {
		return extractJavaDependencies(code);
	}

	if (languageLower.includes("go")) {
		return extractGoDependencies(code);
	}

	if (languageLower.includes("rust")) {
		return extractRustDependencies(code);
	}

	// Default: try TypeScript patterns
	return extractTypeScriptDependencies(code);
}
