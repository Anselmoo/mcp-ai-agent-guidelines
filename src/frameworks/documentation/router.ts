/**
 * Documentation Framework — action router (T-044).
 */

import { projectOnboarding } from "../../tools/project-onboarding.js";
import { documentationGeneratorPromptBuilder } from "../../tools/prompt/documentation-generator-prompt-builder.js";
import type { DocumentationInput } from "./types.js";

export async function routeDocumentationAction(
	input: DocumentationInput,
): Promise<unknown> {
	switch (input.action) {
		case "generate":
			return documentationGeneratorPromptBuilder({
				contentType: input.contentType ?? "API Reference",
				targetAudience: input.targetAudience,
				existingContent: input.existingContent,
				includeReferences: input.includeReferences,
				includeMetadata: input.includeMetadata,
			});

		case "onboard":
			return projectOnboarding({
				projectPath: input.projectPath ?? ".",
				projectName: input.projectName,
				analysisDepth: input.analysisDepth,
				includeReferences: input.includeReferences,
				includeMetadata: input.includeMetadata,
			});

		case "update":
			return documentationGeneratorPromptBuilder({
				contentType: input.contentType ?? "Documentation Update",
				targetAudience: input.targetAudience,
				existingContent: input.existingContent,
				includeReferences: input.includeReferences,
				includeMetadata: input.includeMetadata,
			});

		default:
			throw new Error(
				`Unknown documentation action: ${(input as DocumentationInput).action}`,
			);
	}
}
