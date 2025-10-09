import { z } from "zod";
import {
	buildMetadataSection,
	buildReferencesSection,
} from "./shared/prompt-utils.js";

const SemanticCodeAnalyzerSchema = z.object({
	codeContent: z.string().describe("Code content to analyze"),
	language: z
		.string()
		.optional()
		.describe("Programming language (auto-detected if not provided)"),
	analysisType: z
		.enum(["symbols", "structure", "dependencies", "patterns", "all"])
		.default("all")
		.describe("Type of semantic analysis to perform"),
	includeReferences: z
		.boolean()
		.optional()
		.default(false)
		.describe("Include external reference links"),
	includeMetadata: z
		.boolean()
		.optional()
		.default(false)
		.describe("Include metadata section"),
	inputFile: z.string().optional().describe("Optional input file path"),
});

interface SymbolInfo {
	name: string;
	type: "function" | "class" | "variable" | "interface" | "type" | "constant";
	line?: number;
	scope?: string;
}

interface DependencyInfo {
	type: "import" | "require" | "include";
	module: string;
	items?: string[];
}

interface StructureInfo {
	type: string;
	description: string;
	elements: string[];
}

interface PatternInfo {
	pattern: string;
	description: string;
	locations: string[];
}

export async function semanticCodeAnalyzer(args: unknown) {
	const input = SemanticCodeAnalyzerSchema.parse(args);

	const language = input.language || detectLanguage(input.codeContent);
	const analysis = analyzeCode(input.codeContent, language, input.analysisType);

	const metadata = input.includeMetadata
		? buildMetadataSection({
				sourceTool: "mcp_ai-agent-guid_semantic-code-analyzer",
				inputFile: input.inputFile,
			})
		: "";

	const references = input.includeReferences ? buildSemanticReferences() : "";

	return {
		content: [
			{
				type: "text",
				text: `## 🔍 Semantic Code Analysis

${metadata}

### 📊 Analysis Summary
| Aspect | Details |
|---|---|
| Language | ${language} |
| Analysis Type | ${input.analysisType} |
| Lines of Code | ${input.codeContent.split("\n").length} |

${analysis.symbols ? buildSymbolsSection(analysis.symbols) : ""}
${analysis.structure ? buildStructureSection(analysis.structure) : ""}
${analysis.dependencies ? buildDependenciesSection(analysis.dependencies) : ""}
${analysis.patterns ? buildPatternsSection(analysis.patterns) : ""}

### 💡 Key Insights
${generateInsights(analysis, language)}

### 🎯 Recommendations
${generateRecommendations(analysis, language)}
${references}
`,
			},
		],
	};
}

function detectLanguage(code: string): string {
	// Simple language detection based on common patterns
	if (code.includes("import") && code.includes("from")) return "Python";
	if (
		code.includes("function") ||
		code.includes("const") ||
		code.includes("=>")
	)
		return "TypeScript/JavaScript";
	if (code.includes("public class") || code.includes("private class"))
		return "Java";
	if (code.includes("fn ") && code.includes("->")) return "Rust";
	if (code.includes("func ") && code.includes("package")) return "Go";
	if (code.includes("def ") && code.includes("end")) return "Ruby";
	if (code.includes("<?php")) return "PHP";
	return "Unknown";
}

function analyzeCode(
	code: string,
	language: string,
	analysisType: string,
): {
	symbols?: SymbolInfo[];
	structure?: StructureInfo[];
	dependencies?: DependencyInfo[];
	patterns?: PatternInfo[];
} {
	const result: {
		symbols?: SymbolInfo[];
		structure?: StructureInfo[];
		dependencies?: DependencyInfo[];
		patterns?: PatternInfo[];
	} = {};

	if (analysisType === "symbols" || analysisType === "all") {
		result.symbols = extractSymbols(code, language);
	}

	if (analysisType === "structure" || analysisType === "all") {
		result.structure = analyzeStructure(code, language);
	}

	if (analysisType === "dependencies" || analysisType === "all") {
		result.dependencies = extractDependencies(code, language);
	}

	if (analysisType === "patterns" || analysisType === "all") {
		result.patterns = detectPatterns(code, language);
	}

	return result;
}

function extractSymbols(code: string, language: string): SymbolInfo[] {
	const symbols: SymbolInfo[] = [];
	const lines = code.split("\n");

	// TypeScript/JavaScript patterns
	if (language.includes("TypeScript") || language.includes("JavaScript")) {
		lines.forEach((line, idx) => {
			// Functions
			if (
				line.match(/(?:function|const|let|var)\s+(\w+)\s*(?:=\s*)?(?:\(|async)/)
			) {
				const match = line.match(/(?:function|const|let|var)\s+(\w+)/);
				if (match)
					symbols.push({
						name: match[1],
						type: "function",
						line: idx + 1,
					});
			}
			// Classes
			if (line.match(/class\s+(\w+)/)) {
				const match = line.match(/class\s+(\w+)/);
				if (match)
					symbols.push({ name: match[1], type: "class", line: idx + 1 });
			}
			// Interfaces
			if (line.match(/interface\s+(\w+)/)) {
				const match = line.match(/interface\s+(\w+)/);
				if (match)
					symbols.push({
						name: match[1],
						type: "interface",
						line: idx + 1,
					});
			}
			// Types
			if (line.match(/type\s+(\w+)\s*=/)) {
				const match = line.match(/type\s+(\w+)/);
				if (match)
					symbols.push({ name: match[1], type: "type", line: idx + 1 });
			}
		});
	}

	// Python patterns
	if (language === "Python") {
		lines.forEach((line, idx) => {
			// Functions
			if (line.match(/def\s+(\w+)/)) {
				const match = line.match(/def\s+(\w+)/);
				if (match)
					symbols.push({
						name: match[1],
						type: "function",
						line: idx + 1,
					});
			}
			// Classes
			if (line.match(/class\s+(\w+)/)) {
				const match = line.match(/class\s+(\w+)/);
				if (match)
					symbols.push({ name: match[1], type: "class", line: idx + 1 });
			}
		});
	}

	return symbols;
}

function analyzeStructure(code: string, language: string): StructureInfo[] {
	const structure: StructureInfo[] = [];

	const symbols = extractSymbols(code, language);
	const classes = symbols.filter((s) => s.type === "class");
	const functions = symbols.filter((s) => s.type === "function");
	const interfaces = symbols.filter((s) => s.type === "interface");

	if (classes.length > 0) {
		structure.push({
			type: "Classes",
			description: `${classes.length} class(es) defined`,
			elements: classes.map((c) => c.name),
		});
	}

	if (functions.length > 0) {
		structure.push({
			type: "Functions",
			description: `${functions.length} function(s) defined`,
			elements: functions.map((f) => f.name),
		});
	}

	if (interfaces.length > 0) {
		structure.push({
			type: "Interfaces",
			description: `${interfaces.length} interface(s) defined`,
			elements: interfaces.map((i) => i.name),
		});
	}

	return structure;
}

function extractDependencies(code: string, language: string): DependencyInfo[] {
	const dependencies: DependencyInfo[] = [];
	const lines = code.split("\n");

	if (language.includes("TypeScript") || language.includes("JavaScript")) {
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
		});
	}

	if (language === "Python") {
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
	}

	return dependencies;
}

function detectPatterns(code: string, _language: string): PatternInfo[] {
	const patterns: PatternInfo[] = [];

	// Detect async/await pattern
	if (code.includes("async") && code.includes("await")) {
		const asyncFunctions = code.match(/async\s+(?:function|\w+)/g) || [];
		patterns.push({
			pattern: "Async/Await",
			description: "Asynchronous programming pattern detected",
			locations: asyncFunctions.map((f) => f.trim()),
		});
	}

	// Detect error handling
	if (code.includes("try") && code.includes("catch")) {
		patterns.push({
			pattern: "Error Handling",
			description: "Try-catch error handling implemented",
			locations: ["try-catch blocks found"],
		});
	}

	// Detect dependency injection
	if (code.match(/constructor\s*\([^)]*:/)) {
		patterns.push({
			pattern: "Dependency Injection",
			description: "Constructor-based dependency injection",
			locations: ["constructor"],
		});
	}

	// Detect factory pattern
	if (code.match(/create\w+|make\w+|build\w+/i)) {
		const factories = code.match(/(?:create|make|build)\w+/gi) || [];
		patterns.push({
			pattern: "Factory Pattern",
			description: "Factory methods for object creation",
			locations: [...new Set(factories)],
		});
	}

	return patterns;
}

function buildSymbolsSection(symbols: SymbolInfo[]): string {
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

function buildStructureSection(structure: StructureInfo[]): string {
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

function buildDependenciesSection(dependencies: DependencyInfo[]): string {
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

function buildPatternsSection(patterns: PatternInfo[]): string {
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

function generateInsights(
	analysis: {
		symbols?: SymbolInfo[];
		structure?: StructureInfo[];
		dependencies?: DependencyInfo[];
		patterns?: PatternInfo[];
	},
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

function generateRecommendations(
	analysis: {
		symbols?: SymbolInfo[];
		structure?: StructureInfo[];
		dependencies?: DependencyInfo[];
		patterns?: PatternInfo[];
	},
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

function buildSemanticReferences(): string {
	return buildReferencesSection([
		"Language Server Protocol: https://microsoft.github.io/language-server-protocol/",
		"Semantic Code Analysis: https://en.wikipedia.org/wiki/Semantic_analysis_(compilers)",
		"Design Patterns: https://refactoring.guru/design-patterns",
		"Symbol-Based Navigation: https://code.visualstudio.com/docs/editor/editingevolved",
	]);
}
