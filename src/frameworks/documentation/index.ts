/**
 * Documentation Framework — unified entry point (T-044).
 *
 * Consolidates:
 * - documentation-generator-prompt-builder
 * - project-onboarding
 */

import type { FrameworkDefinition } from "../types.js";
import { routeDocumentationAction } from "./router.js";
import { DocumentationInputSchema } from "./types.js";

export const documentationFramework: FrameworkDefinition = {
	name: "documentation",
	description:
		"Documentation generation: API references, user guides, project onboarding, and README updates.",
	version: "1.0.0",
	actions: ["generate", "onboard", "update"],
	schema: DocumentationInputSchema,

	async execute(input: unknown) {
		const validated = DocumentationInputSchema.parse(input);
		return routeDocumentationAction(validated);
	},
};

export { type DocumentationInput, DocumentationInputSchema } from "./types.js";
