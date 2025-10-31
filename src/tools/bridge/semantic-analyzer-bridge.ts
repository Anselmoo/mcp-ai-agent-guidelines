/**
 * Bridge Connector for Semantic Code Analyzer
 *
 * Provides integration points between semantic code analyzer and other tools
 * Enables semantic analysis to enhance prompts, strategies, and other tools
 *
 * ## Extensibility Examples
 *
 * ### Adding a Custom Language
 * ```typescript
 * import { languageRegistry } from '../semantic-analyzer';
 *
 * languageRegistry.register({
 *   name: 'Kotlin',
 *   extensions: ['.kt'],
 *   detect: (code) => code.includes('fun ') && code.includes('package'),
 *   extractSymbols: (code) => { ... },
 *   extractDependencies: (code) => { ... }
 * });
 * ```
 *
 * ### Adding a Custom Pattern
 * ```typescript
 * import { patternRegistry } from '../semantic-analyzer';
 *
 * patternRegistry.register({
 *   name: 'Repository Pattern',
 *   description: 'Data access layer pattern',
 *   detect: (code, language) => {
 *     if (code.match(/class\s+\w+Repository/i)) {
 *       return {
 *         pattern: 'Repository Pattern',
 *         description: 'Repository pattern for data access abstraction',
 *         locations: ['Repository class detected']
 *       };
 *     }
 *     return null;
 *   }
 * });
 * ```
 */

/**
 * Integration helpers for semantic code analyzer with other tools
 */

/**
 * Enhance hierarchical prompts with semantic insights
 */
export function enhancePromptWithSemantics(
	semanticAnalysis: string,
	promptContext: string,
): string {
	// Extract key insights from semantic analysis
	const insights = extractSemanticInsights(semanticAnalysis);

	// Enhance prompt context with code structure information
	return `${promptContext}

## Code Context from Semantic Analysis
${insights.structure}

## Identified Patterns
${insights.patterns.join(", ")}

## Dependencies
${insights.dependencies.join(", ")}`;
}

/**
 * Generate code hygiene recommendations based on semantic analysis
 */
export function generateHygieneRecommendations(
	semanticAnalysis: string,
): string[] {
	const recommendations: string[] = [];

	if (semanticAnalysis.includes("Error Handling") === false) {
		recommendations.push("Add comprehensive error handling (try-catch blocks)");
	}

	if (semanticAnalysis.includes("Dependency Injection")) {
		recommendations.push("Good use of dependency injection pattern");
	} else {
		recommendations.push(
			"Consider using dependency injection for better testability",
		);
	}

	if (semanticAnalysis.includes("Async/Await")) {
		recommendations.push(
			"Review async/await usage for potential race conditions",
		);
	}

	return recommendations;
}

/**
 * Extract semantic insights from analysis text
 */
export function extractSemanticInsights(analysisText: string): {
	structure: string;
	patterns: string[];
	dependencies: string[];
	symbols: string[];
} {
	const insights = {
		structure: "",
		patterns: [] as string[],
		dependencies: [] as string[],
		symbols: [] as string[],
	};

	// Extract structure section
	const structureMatch = analysisText.match(/### 🏗️ Code Structure\n\n([^#]+)/);
	if (structureMatch) {
		insights.structure = structureMatch[1].trim();
	}

	// Extract patterns
	if (analysisText.includes("Async/Await"))
		insights.patterns.push("Async/Await");
	if (analysisText.includes("Error Handling"))
		insights.patterns.push("Error Handling");
	if (analysisText.includes("Dependency Injection"))
		insights.patterns.push("Dependency Injection");
	if (analysisText.includes("Factory Pattern"))
		insights.patterns.push("Factory Pattern");

	// Extract dependencies
	const depsMatch = analysisText.match(/### 📦 Dependencies\n\n([^#]+)/);
	if (depsMatch) {
		const depLines = depsMatch[1]
			.split("\n")
			.filter((line) => line.includes("**"));
		insights.dependencies = depLines
			.map((line) => {
				const match = line.match(/\*\*([^*]+)\*\*/);
				return match ? match[1] : "";
			})
			.filter(Boolean);
	}

	// Extract symbols
	const symbolsMatch = analysisText.match(
		/### 🔤 Symbols Identified\n\n([^#]+)/,
	);
	if (symbolsMatch) {
		const symbolLines = symbolsMatch[1]
			.split("\n")
			.filter((line) => line.includes("-"));
		insights.symbols = symbolLines
			.map((line) => line.replace(/^-\s*/, "").trim())
			.filter(Boolean);
	}

	return insights;
}

/**
 * Create refactoring suggestions based on semantic analysis
 */
export function suggestRefactorings(semanticAnalysis: string): {
	priority: "high" | "medium" | "low";
	suggestion: string;
	reason: string;
}[] {
	const suggestions: {
		priority: "high" | "medium" | "low";
		suggestion: string;
		reason: string;
	}[] = [];

	// Check for error handling
	if (!semanticAnalysis.includes("Error Handling")) {
		suggestions.push({
			priority: "high",
			suggestion: "Add comprehensive error handling",
			reason: "No error handling patterns detected in the code",
		});
	}

	// Check for complexity
	if (semanticAnalysis.match(/Functions.*\((\d+)\)/)?.[1]) {
		const funcCount = Number.parseInt(
			semanticAnalysis.match(/Functions.*\((\d+)\)/)?.[1] || "0",
			10,
		);
		if (funcCount > 10) {
			suggestions.push({
				priority: "medium",
				suggestion: "Consider breaking down into smaller modules",
				reason: `High number of functions (${funcCount}) indicates potential for modularization`,
			});
		}
	}

	// Check for patterns
	if (!semanticAnalysis.includes("Dependency Injection")) {
		suggestions.push({
			priority: "low",
			suggestion: "Consider dependency injection pattern",
			reason: "Could improve testability and modularity",
		});
	}

	return suggestions;
}

/**
 * Generate security analysis prompt based on semantic insights
 */
export function generateSecurityAnalysisPrompt(
	semanticAnalysis: string,
): string {
	const insights = extractSemanticInsights(semanticAnalysis);

	return `# Security Analysis Request

## Code Structure
${insights.structure}

## Areas to Analyze
1. Input validation for all entry points
2. Dependency security (check ${insights.dependencies.join(", ")})
3. Error handling and information disclosure
4. Authentication and authorization patterns
${insights.patterns.includes("Async/Await") ? "5. Race condition analysis for async operations" : ""}

## Focus Areas
- Review ${insights.symbols.length} identified symbols for security issues
- Analyze ${insights.dependencies.length} dependencies for known vulnerabilities
- Check for common security anti-patterns`;
}

/**
 * Integration point for strategy frameworks
 */
export function integrateWithStrategyFrameworks(
	semanticAnalysis: string,
	_projectContext: string,
): {
	technicalDebt: string[];
	architectureInsights: string[];
	recommendations: string[];
} {
	const insights = extractSemanticInsights(semanticAnalysis);

	return {
		technicalDebt: [
			insights.patterns.includes("Error Handling")
				? ""
				: "Missing error handling",
			insights.patterns.includes("Dependency Injection")
				? ""
				: "Tight coupling detected",
		].filter(Boolean),
		architectureInsights: [
			`Code structure: ${insights.structure}`,
			`Patterns in use: ${insights.patterns.join(", ")}`,
			`External dependencies: ${insights.dependencies.length}`,
		],
		recommendations: generateHygieneRecommendations(
			`### Analysis\n${semanticAnalysis}`,
		),
	};
}
