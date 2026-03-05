/**
 * Documentation Framework — shared types.
 */
import { z } from "zod";

export const DocumentationActionEnum = z.enum([
	"generate",
	"onboard",
	"update",
]);

export type DocumentationAction = z.infer<typeof DocumentationActionEnum>;

export const DocumentationInputSchema = z.object({
	action: DocumentationActionEnum.describe("Documentation action"),
	contentType: z
		.string()
		.optional()
		.describe("Type of documentation to generate"),
	targetAudience: z.string().optional().describe("Intended audience"),
	existingContent: z
		.string()
		.optional()
		.describe("Existing content to build upon"),
	projectPath: z.string().optional().describe("Path to project root"),
	projectName: z.string().optional().describe("Project name"),
	analysisDepth: z
		.enum(["quick", "standard", "deep"])
		.optional()
		.default("standard"),
	includeReferences: z.boolean().optional().default(true),
	includeMetadata: z.boolean().optional().default(true),
});

export type DocumentationInput = z.infer<typeof DocumentationInputSchema>;
