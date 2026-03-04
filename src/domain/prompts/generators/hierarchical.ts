import { z } from "zod";
import type {
	BasePromptRequest,
	GeneratorOptions,
	GeneratorResult,
	PromptGenerator,
	PromptSection,
	PromptTechnique,
} from "../types.js";

export const HierarchicalRequestSchema = z.object({
	context: z.string().min(1, "Context is required"),
	goal: z.string().min(1, "Goal is required"),
	requirements: z.array(z.string()).optional().default([]),
	audience: z.string().optional(),
	style: z.enum(["markdown", "xml"]).optional(),
	techniques: z.array(z.string()).optional(),
	includeMetadata: z.boolean().optional(),
	includeReferences: z.boolean().optional(),
	includeTechniqueHints: z.boolean().optional(),
	provider: z.string().optional(),
});

export type HierarchicalRequest = z.infer<typeof HierarchicalRequestSchema> &
	BasePromptRequest;

const HIERARCHICAL_TECHNIQUES: PromptTechnique[] = [
	"chain-of-thought",
	"few-shot",
	"scaffolding",
];

export class HierarchicalGenerator
	implements PromptGenerator<HierarchicalRequest>
{
	readonly domain = "hierarchical" as const;
	readonly version = "1.0.0";
	readonly description =
		"Generates hierarchical prompts with independent → modeling → scaffolding levels";
	readonly requestSchema =
		HierarchicalRequestSchema as z.ZodSchema<HierarchicalRequest>;

	generate(
		request: HierarchicalRequest,
		options?: Partial<GeneratorOptions>,
	): GeneratorResult {
		const sections: PromptSection[] = [
			{
				id: "context",
				title: "Context",
				content: request.context,
				required: true,
				order: 1,
			},
			{
				id: "goal",
				title: "Goal",
				content: request.goal,
				required: true,
				order: 2,
			},
		];

		if (request.requirements?.length) {
			sections.push({
				id: "requirements",
				title: "Requirements",
				content: request.requirements.map((r) => `- ${r}`).join("\n"),
				required: false,
				order: 3,
			});
		}

		if (request.audience) {
			sections.push({
				id: "audience",
				title: "Target Audience",
				content: request.audience,
				required: false,
				order: 4,
			});
		}

		const techniques = options?.techniques ?? this.recommendTechniques(request);
		if (options?.includeTechniqueHints && techniques.length > 0) {
			sections.push({
				id: "techniques",
				title: "Prompting Techniques",
				content: `Apply the following techniques: ${techniques.join(", ")}.`,
				required: false,
				order: 10,
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

	recommendTechniques(_request: HierarchicalRequest): PromptTechnique[] {
		return HIERARCHICAL_TECHNIQUES;
	}
}
