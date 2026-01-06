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
	buildFurtherReadingSection,
	buildMetadataSection,
} from "./shared/prompt-utils.js";
import { handleToolError } from "./shared/error-handler.js";

const SemanticCodeAnalyzerSchema = z.object({
	codeContent: z
		.string()
		.describe(
			"Code content to analyze. Example: TypeScript class with dependencies, Python module with imports, or any code snippet with symbols and structure",
		),
	language: z
		.string()
		.optional()
		.describe(
			"Programming language (auto-detected if not provided). Examples: 'typescript', 'python', 'javascript', 'go', 'rust'",
		),
	analysisType: z
		.enum(["symbols", "structure", "dependencies", "patterns", "all"])
		.default("all")
		.describe(
			"Type of semantic analysis to perform. Examples: 'symbols' (functions, classes), 'dependencies' (imports, references), 'patterns' (design patterns), 'all' (comprehensive)",
		),
	includeReferences: z
		.boolean()
		.optional()
		.default(false)
		.describe("Include external reference links. Example: true"),
	includeMetadata: z
		.boolean()
		.optional()
		.default(false)
		.describe("Include metadata section. Example: true"),
	inputFile: z
		.string()
		.optional()
		.describe(
			"Optional input file path. Example: 'src/services/UserService.ts'",
		),
});

export async function semanticCodeAnalyzer(args: unknown) {
	try {
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
	} catch (error) {
		return handleToolError(error);
	}
}

function buildSemanticReferences(): string {
	return buildFurtherReadingSection([
		{
			title: "Language Server Protocol",
			url: "https://microsoft.github.io/language-server-protocol/",
			description:
				"Microsoft's protocol for language intelligence in code editors",
		},
		{
			title: "Semantic Analysis in Compilers",
			url: "https://en.wikipedia.org/wiki/Semantic_analysis_(compilers)",
			description:
				"Overview of semantic analysis techniques in code compilation",
		},
		{
			title: "Design Patterns Catalog",
			url: "https://refactoring.guru/design-patterns",
			description: "Comprehensive catalog of software design patterns",
		},
		{
			title: "Symbol-Based Navigation",
			url: "https://code.visualstudio.com/docs/editor/editingevolved",
			description: "Advanced code navigation using symbols in VS Code",
		},
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
