import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
	DomainNeutralGenerator,
	DomainNeutralRequestSchema,
	PromptRegistry,
	UnifiedPromptBuilder,
} from "../../../domain/prompts/index.js";
import { emitDeprecationWarning } from "../../shared/deprecation.js";

const registry = PromptRegistry.getInstance();
if (!registry.has("domain-neutral")) {
	registry.register("domain-neutral", () => new DomainNeutralGenerator());
}

const builder = new UnifiedPromptBuilder(registry);

/**
 * Legacy facade for DomainNeutralPromptBuilder.
 * @deprecated Use UnifiedPromptBuilder directly with domain='domain-neutral'
 */
export const DomainNeutralFacadeSchema = DomainNeutralRequestSchema.extend({
	/** @deprecated pass via context directly */
	forcePromptMdStyle: z.boolean().optional(),
	mode: z.string().optional(),
	model: z.string().optional(),
	inputFile: z.string().optional(),
	includeDisclaimer: z.boolean().optional(),
	includeFrontmatter: z.boolean().optional().default(false),
	includeMetadata: z.boolean().optional().default(false),
	includeReferences: z.boolean().optional().default(false),
	includeTechniqueHints: z.boolean().optional().default(false),
	tools: z.array(z.string()).optional(),
});

export type DomainNeutralFacadeInput = z.infer<
	typeof DomainNeutralFacadeSchema
>;

/**
 * @deprecated Use UnifiedPromptBuilder with domain='domain-neutral'
 */
export async function domainNeutralFacade(
	input: unknown,
): Promise<CallToolResult> {
	emitDeprecationWarning({
		tool: "domain-neutral-facade",
		replacement: "UnifiedPromptBuilder with domain='domain-neutral'",
		deprecatedIn: "v0.14.0",
		removedIn: "v0.16.0",
	});

	const parsed = DomainNeutralFacadeSchema.parse(input);

	const context = {
		title: parsed.title,
		summary: parsed.summary,
		objectives: parsed.objectives,
		workflow: parsed.workflow,
		inputs: parsed.inputs,
		outputs: parsed.outputs,
		constraints: parsed.constraints,
	};
	const result = await builder.build({
		domain: "domain-neutral",
		context,
		outputFormat: parsed.style ?? "markdown",
		includeFrontmatter: parsed.includeFrontmatter,
		includeMetadata: parsed.includeMetadata,
		includeReferences: parsed.includeReferences,
		includeTechniqueHints: parsed.includeTechniqueHints,
		title: parsed.title,
	});

	return { content: [{ type: "text", text: result.content }] };
}
