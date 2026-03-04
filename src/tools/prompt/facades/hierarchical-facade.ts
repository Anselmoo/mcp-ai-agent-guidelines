import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import {
	HierarchicalGenerator,
	HierarchicalRequestSchema,
	PromptRegistry,
	UnifiedPromptBuilder,
} from "../../../domain/prompts/index.js";
import { emitDeprecationWarning } from "../../shared/deprecation.js";

const registry = PromptRegistry.getInstance();
if (!registry.has("hierarchical")) {
	registry.register("hierarchical", () => new HierarchicalGenerator());
}

const builder = new UnifiedPromptBuilder(registry);

/**
 * Legacy facade for HierarchicalPromptBuilder.
 * @deprecated Use UnifiedPromptBuilder directly with domain='hierarchical'
 */
export const HierarchicalFacadeSchema = HierarchicalRequestSchema.extend({
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

export type HierarchicalFacadeInput = z.infer<typeof HierarchicalFacadeSchema>;

/**
 * @deprecated Use UnifiedPromptBuilder with domain='hierarchical'
 */
export async function hierarchicalFacade(
	input: unknown,
): Promise<CallToolResult> {
	emitDeprecationWarning({
		tool: "hierarchical-facade",
		replacement: "UnifiedPromptBuilder with domain='hierarchical'",
		deprecatedIn: "v0.14.0",
		removedIn: "v0.16.0",
	});

	const parsed = HierarchicalFacadeSchema.parse(input);

	const context = {
		context: parsed.context,
		goal: parsed.goal,
		requirements: parsed.requirements,
		audience: parsed.audience,
	};
	const result = await builder.build({
		domain: "hierarchical",
		context,
		outputFormat: parsed.style ?? "markdown",
		includeFrontmatter: parsed.includeFrontmatter,
		includeMetadata: parsed.includeMetadata,
		includeReferences: parsed.includeReferences,
		includeTechniqueHints: parsed.includeTechniqueHints,
	});

	return { content: [{ type: "text", text: result.content }] };
}
