import { z } from "zod";
import type {
	BasePromptRequest,
	GeneratorOptions,
	GeneratorResult,
	PromptGenerator,
	PromptSection,
	PromptTechnique,
} from "../types.js";

export const DomainNeutralRequestSchema = z.object({
	title: z.string().min(1, "Title is required"),
	summary: z.string().min(1, "Summary is required"),
	objectives: z.array(z.string()).optional().default([]),
	workflow: z.array(z.string()).optional().default([]),
	inputs: z.string().optional(),
	outputs: z.string().optional(),
	constraints: z.string().optional(),
	style: z.enum(["markdown", "xml"]).optional(),
	techniques: z.array(z.string()).optional(),
	includeMetadata: z.boolean().optional(),
	includeReferences: z.boolean().optional(),
	includeTechniqueHints: z.boolean().optional(),
	provider: z.string().optional(),
});

export type DomainNeutralRequest = z.infer<typeof DomainNeutralRequestSchema> &
	BasePromptRequest;

const DOMAIN_NEUTRAL_TECHNIQUES: PromptTechnique[] = [
	"zero-shot",
	"chain-of-thought",
];

export class DomainNeutralGenerator
	implements PromptGenerator<DomainNeutralRequest>
{
	readonly domain = "domain-neutral" as const;
	readonly version = "1.0.0";
	readonly description =
		"Build domain-agnostic prompts from objectives, workflows, and capabilities";
	readonly requestSchema =
		DomainNeutralRequestSchema as z.ZodSchema<DomainNeutralRequest>;

	generate(
		request: DomainNeutralRequest,
		options?: Partial<GeneratorOptions>,
	): GeneratorResult {
		const techniques = options?.techniques ?? this.recommendTechniques(request);
		const sections: PromptSection[] = [
			{
				id: "summary",
				title: "Overview",
				content: request.summary,
				required: true,
				order: 1,
			},
		];

		if (request.objectives?.length) {
			sections.push({
				id: "objectives",
				title: "Objectives",
				content: request.objectives.map((o) => `- ${o}`).join("\n"),
				required: false,
				order: 2,
			});
		}

		if (request.workflow?.length) {
			sections.push({
				id: "workflow",
				title: "Workflow",
				content: request.workflow
					.map((step, i) => `${i + 1}. ${step}`)
					.join("\n"),
				required: false,
				order: 3,
			});
		}

		if (request.inputs) {
			sections.push({
				id: "inputs",
				title: "Inputs",
				content: request.inputs,
				required: false,
				order: 4,
			});
		}

		if (request.outputs) {
			sections.push({
				id: "outputs",
				title: "Outputs",
				content: request.outputs,
				required: false,
				order: 5,
			});
		}

		if (request.constraints) {
			sections.push({
				id: "constraints",
				title: "Constraints",
				content: request.constraints,
				required: false,
				order: 6,
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

	recommendTechniques(_request: DomainNeutralRequest): PromptTechnique[] {
		return DOMAIN_NEUTRAL_TECHNIQUES;
	}
}
