import { z } from "zod";
import type {
	BasePromptRequest,
	GeneratorOptions,
	GeneratorResult,
	PromptGenerator,
	PromptSection,
	PromptTechnique,
} from "../types.js";

export const SecurityRequestSchema = z.object({
	codeContext: z.string().min(1, "Code context is required"),
	language: z.string().optional(),
	framework: z.string().optional(),
	securityFocus: z
		.enum([
			"vulnerability-analysis",
			"security-hardening",
			"compliance-check",
			"threat-modeling",
			"penetration-testing",
		])
		.optional()
		.default("vulnerability-analysis"),
	complianceStandards: z.array(z.string()).optional().default([]),
	riskTolerance: z.enum(["low", "medium", "high"]).optional().default("medium"),
	style: z.enum(["markdown", "xml"]).optional(),
	techniques: z.array(z.string()).optional(),
	includeMetadata: z.boolean().optional(),
	includeReferences: z.boolean().optional(),
	includeTechniqueHints: z.boolean().optional(),
	provider: z.string().optional(),
});

export type SecurityRequest = z.infer<typeof SecurityRequestSchema> &
	BasePromptRequest;

const SECURITY_TECHNIQUES: PromptTechnique[] = [
	"chain-of-thought",
	"react",
	"zero-shot",
];

export class SecurityGenerator implements PromptGenerator<SecurityRequest> {
	readonly domain = "security" as const;
	readonly version = "1.0.0";
	readonly description =
		"Generates OWASP-aligned security assessment prompts with threat modeling";
	readonly requestSchema =
		SecurityRequestSchema as z.ZodSchema<SecurityRequest>;

	generate(
		request: SecurityRequest,
		options?: Partial<GeneratorOptions>,
	): GeneratorResult {
		const techniques = options?.techniques ?? this.recommendTechniques(request);

		const sections: PromptSection[] = [
			{
				id: "code-context",
				title: "Code Context",
				content: request.codeContext,
				required: true,
				order: 1,
			},
			{
				id: "security-focus",
				title: "Security Analysis Focus",
				content: `Perform a **${request.securityFocus}** analysis${request.language ? ` on ${request.language} code` : ""}${request.framework ? ` using ${request.framework}` : ""}.`,
				required: true,
				order: 2,
			},
		];

		if (request.complianceStandards?.length) {
			sections.push({
				id: "compliance",
				title: "Compliance Standards",
				content: `Evaluate against: ${request.complianceStandards.join(", ")}.`,
				required: false,
				order: 3,
			});
		}

		sections.push({
			id: "risk-tolerance",
			title: "Risk Tolerance",
			content: `Risk tolerance level: **${request.riskTolerance}**.`,
			required: false,
			order: 4,
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

	recommendTechniques(_request: SecurityRequest): PromptTechnique[] {
		return SECURITY_TECHNIQUES;
	}
}
