import { z } from "zod";
import type {
	AnalysisType,
	DependencyInfo,
	PatternInfo,
	StructureInfo,
	SymbolInfo,
} from "./semantic-analyzer/index.js";
import {
	analyzeCode,
	buildDependenciesSection,
	buildPatternsSection,
	buildStructureSection,
	buildSymbolsSection,
	detectLanguage,
	generateInsights,
	generateRecommendations,
} from "./semantic-analyzer/index.js";
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

export async function semanticCodeAnalyzer(args: unknown) {
	const input = SemanticCodeAnalyzerSchema.parse(args);

	const language = input.language || detectLanguage(input.codeContent);
	const analysis = analyzeCode(
		input.codeContent,
		language,
		input.analysisType as AnalysisType,
	);

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

function buildSemanticReferences(): string {
	return buildReferencesSection([
		"Language Server Protocol: https://microsoft.github.io/language-server-protocol/",
		"Semantic Code Analysis: https://en.wikipedia.org/wiki/Semantic_analysis_(compilers)",
		"Design Patterns: https://refactoring.guru/design-patterns",
		"Symbol-Based Navigation: https://code.visualstudio.com/docs/editor/editingevolved",
	]);
}

// Re-export types for backward compatibility
export type {
	AnalysisType,
	DependencyInfo,
	PatternInfo,
	StructureInfo,
	SymbolInfo,
};
