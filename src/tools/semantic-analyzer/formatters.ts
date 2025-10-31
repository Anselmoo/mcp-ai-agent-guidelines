/**
 * Formatting Utilities
 *
 * Format analysis results into readable output
 */

import type {
	AnalysisResult,
	DependencyInfo,
	PatternInfo,
	StructureInfo,
	SymbolInfo,
} from "./types/index.js";

/**
 * Build symbols section
 */
export function buildSymbolsSection(symbols: SymbolInfo[]): string {
	if (symbols.length === 0) return "";

	const grouped = symbols.reduce(
		(acc, symbol) => {
			if (!acc[symbol.type]) acc[symbol.type] = [];
			acc[symbol.type].push(symbol);
			return acc;
		},
		{} as Record<string, SymbolInfo[]>,
	);

	let section = "### 🔤 Symbols Identified\n\n";

	for (const [type, syms] of Object.entries(grouped)) {
		section += `**${type.charAt(0).toUpperCase() + type.slice(1)}s** (${syms.length}):\n`;
		syms.forEach((sym) => {
			section += `- \`${sym.name}\`${sym.line ? ` (line ${sym.line})` : ""}\n`;
		});
		section += "\n";
	}

	return section;
}

/**
 * Build structure section
 */
export function buildStructureSection(structure: StructureInfo[]): string {
	if (structure.length === 0) return "";

	let section = "### 🏗️ Code Structure\n\n";

	structure.forEach((item) => {
		section += `**${item.type}**: ${item.description}\n`;
		item.elements.forEach((el) => {
			section += `- ${el}\n`;
		});
		section += "\n";
	});

	return section;
}

/**
 * Build dependencies section
 */
export function buildDependenciesSection(
	dependencies: DependencyInfo[],
): string {
	if (dependencies.length === 0) return "";

	let section = "### 📦 Dependencies\n\n";

	dependencies.forEach((dep) => {
		section += `- **${dep.module}**`;
		if (dep.items && dep.items.length > 0) {
			section += `: ${dep.items.join(", ")}`;
		}
		section += "\n";
	});

	return `${section}\n`;
}

/**
 * Build patterns section
 */
export function buildPatternsSection(patterns: PatternInfo[]): string {
	if (patterns.length === 0) return "";

	let section = "### 🎨 Design Patterns\n\n";

	patterns.forEach((pattern) => {
		section += `**${pattern.pattern}**: ${pattern.description}\n`;
		pattern.locations.forEach((loc) => {
			section += `- ${loc}\n`;
		});
		section += "\n";
	});

	return section;
}

/**
 * Generate insights from analysis
 */
export function generateInsights(
	analysis: AnalysisResult,
	language: string,
): string {
	const insights: string[] = [];

	if (analysis.symbols) {
		const functionCount = analysis.symbols.filter(
			(s) => s.type === "function",
		).length;
		const classCount = analysis.symbols.filter(
			(s) => s.type === "class",
		).length;

		if (functionCount > classCount * 3) {
			insights.push(
				`- Functional programming style with ${functionCount} functions vs ${classCount} classes`,
			);
		} else if (classCount > 0) {
			insights.push(
				`- Object-oriented design with ${classCount} class(es) and ${functionCount} function(s)`,
			);
		}
	}

	if (analysis.dependencies && analysis.dependencies.length > 0) {
		insights.push(
			`- Utilizes ${analysis.dependencies.length} external dependencies`,
		);
	}

	if (analysis.patterns && analysis.patterns.length > 0) {
		insights.push(
			`- Implements ${analysis.patterns.length} design pattern(s): ${analysis.patterns.map((p) => p.pattern).join(", ")}`,
		);
	}

	if (insights.length === 0) {
		insights.push(`- ${language} code with basic structure`);
	}

	return insights.join("\n");
}

/**
 * Generate recommendations from analysis
 */
export function generateRecommendations(
	analysis: AnalysisResult,
	language: string,
): string {
	const recommendations: string[] = [];

	if (analysis.symbols) {
		const hasInterfaces = analysis.symbols.some((s) => s.type === "interface");
		const hasClasses = analysis.symbols.some((s) => s.type === "class");

		if (hasClasses && !hasInterfaces && language.includes("TypeScript")) {
			recommendations.push(
				"- Consider defining interfaces for better abstraction and testability",
			);
		}
	}

	if (analysis.patterns) {
		const hasErrorHandling = analysis.patterns.some(
			(p) => p.pattern === "Error Handling",
		);
		if (!hasErrorHandling) {
			recommendations.push(
				"- Add error handling (try-catch blocks) for robustness",
			);
		}

		const hasAsync = analysis.patterns.some((p) => p.pattern === "Async/Await");
		if (hasAsync) {
			recommendations.push(
				"- Ensure async operations have proper error handling",
			);
		}
	}

	if (analysis.dependencies && analysis.dependencies.length > 10) {
		recommendations.push(
			"- Review dependencies for potential consolidation or removal",
		);
	}

	if (recommendations.length === 0) {
		recommendations.push(
			"- Code structure appears well-organized; continue following best practices",
		);
	}

	return recommendations.join("\n");
}
