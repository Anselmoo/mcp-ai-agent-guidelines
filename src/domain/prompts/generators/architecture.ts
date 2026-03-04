import { z } from "zod";
import type {
	BasePromptRequest,
	GeneratorOptions,
	GeneratorResult,
	PromptGenerator,
	PromptSection,
	PromptTechnique,
} from "../types.js";

export const ArchitectureRequestSchema = z.object({
	systemRequirements: z.string().min(1, "System requirements are required"),
	technologyStack: z.string().optional(),
	scale: z.enum(["small", "medium", "large"]).optional().default("medium"),
	style: z.enum(["markdown", "xml"]).optional(),
	techniques: z.array(z.string()).optional(),
	includeMetadata: z.boolean().optional(),
	includeReferences: z.boolean().optional(),
	includeTechniqueHints: z.boolean().optional(),
	provider: z.string().optional(),
});

export type ArchitectureRequest = z.infer<typeof ArchitectureRequestSchema> &
	BasePromptRequest;

const ARCHITECTURE_TECHNIQUES: PromptTechnique[] = [
	"chain-of-thought",
	"tree-of-thoughts",
	"generate-knowledge",
];

export class ArchitectureGenerator
	implements PromptGenerator<ArchitectureRequest>
{
	readonly domain = "architecture" as const;
	readonly version = "1.0.0";
	readonly description =
		"Generates system architecture design prompts with technology recommendations";
	readonly requestSchema =
		ArchitectureRequestSchema as z.ZodSchema<ArchitectureRequest>;

	generate(
		request: ArchitectureRequest,
		options?: Partial<GeneratorOptions>,
	): GeneratorResult {
		const techniques = options?.techniques ?? this.recommendTechniques(request);

		const sections: PromptSection[] = [
			{
				id: "system-requirements",
				title: "System Requirements",
				content: request.systemRequirements,
				required: true,
				order: 1,
			},
			{
				id: "scale",
				title: "System Scale",
				content: `Target scale: **${request.scale}**.`,
				required: false,
				order: 2,
			},
		];

		if (request.technologyStack) {
			sections.push({
				id: "tech-stack",
				title: "Technology Stack",
				content: request.technologyStack,
				required: false,
				order: 3,
			});
		}

		sections.push({
			id: "design-task",
			title: "Architecture Design Task",
			content:
				"Design a comprehensive architecture solution addressing the requirements above. Include component diagrams, data flows, and key architectural decisions.",
			required: true,
			order: 10,
		});

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

	recommendTechniques(_request: ArchitectureRequest): PromptTechnique[] {
		return ARCHITECTURE_TECHNIQUES;
	}
}
