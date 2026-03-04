import { z } from "zod";
import type {
	BasePromptRequest,
	GeneratorOptions,
	GeneratorResult,
	PromptGenerator,
	PromptSection,
	PromptTechnique,
} from "../types.js";

export const CodeAnalysisRequestSchema = z.object({
	codebase: z.string().min(1, "Codebase path or description is required"),
	language: z.string().optional(),
	focusArea: z
		.enum(["security", "performance", "maintainability", "general"])
		.optional()
		.default("general"),
	style: z.enum(["markdown", "xml"]).optional(),
	techniques: z.array(z.string()).optional(),
	includeMetadata: z.boolean().optional(),
	includeReferences: z.boolean().optional(),
	includeTechniqueHints: z.boolean().optional(),
	provider: z.string().optional(),
});

export type CodeAnalysisRequest = z.infer<typeof CodeAnalysisRequestSchema> &
	BasePromptRequest;

const CODE_ANALYSIS_TECHNIQUES: PromptTechnique[] = [
	"chain-of-thought",
	"react",
	"self-consistency",
];

export class CodeAnalysisGenerator
	implements PromptGenerator<CodeAnalysisRequest>
{
	readonly domain = "code-analysis" as const;
	readonly version = "1.0.0";
	readonly description =
		"Generates code review prompts for security, performance, and maintainability";
	readonly requestSchema =
		CodeAnalysisRequestSchema as z.ZodSchema<CodeAnalysisRequest>;

	generate(
		request: CodeAnalysisRequest,
		options?: Partial<GeneratorOptions>,
	): GeneratorResult {
		const techniques = options?.techniques ?? this.recommendTechniques(request);

		const focusDescription: Record<string, string> = {
			security:
				"Identify security vulnerabilities, injection risks, and authentication issues.",
			performance:
				"Identify performance bottlenecks, N+1 queries, and memory leaks.",
			maintainability:
				"Evaluate code structure, naming, complexity, and documentation.",
			general:
				"Perform a comprehensive code review covering quality, security, and performance.",
		};

		const sections: PromptSection[] = [
			{
				id: "codebase",
				title: "Codebase",
				content: request.codebase,
				required: true,
				order: 1,
			},
			{
				id: "focus-area",
				title: "Analysis Focus",
				content:
					focusDescription[request.focusArea] ?? focusDescription.general,
				required: true,
				order: 2,
			},
		];

		if (request.language) {
			sections.push({
				id: "language",
				title: "Programming Language",
				content: request.language,
				required: false,
				order: 3,
			});
		}

		return {
			sections,
			metadata: {
				domain: this.domain,
				generatedAt: new Date(),
				techniques,
				tokenEstimate: sections.reduce((n, s) => n + s.content.length / 4, 0),
			},
		};
	}

	recommendTechniques(_request: CodeAnalysisRequest): PromptTechnique[] {
		return CODE_ANALYSIS_TECHNIQUES;
	}
}
