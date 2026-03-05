/**
 * Design & Architecture Framework — action router (T-041).
 */

import { designAssistant } from "../../tools/design/design-assistant.js";
import { architectureDesignPromptBuilder } from "../../tools/prompt/architecture-design-prompt-builder.js";
import { enterpriseArchitectPromptBuilder } from "../../tools/prompt/enterprise-architect-prompt-builder.js";
import { l9DistinguishedEngineerPromptBuilder } from "../../tools/prompt/l9-distinguished-engineer-prompt-builder.js";
import type { DesignArchitectureInput } from "./types.js";

export async function routeDesignArchitectureAction(
	input: DesignArchitectureInput,
): Promise<unknown> {
	switch (input.action) {
		case "architecture":
			return architectureDesignPromptBuilder({
				systemRequirements: input.systemRequirements ?? "",
				technologyStack: input.technologyStack,
				scale: input.scale,
				includeReferences: input.includeReferences,
				includeMetadata: input.includeMetadata,
			});

		case "l9-engineering":
			return l9DistinguishedEngineerPromptBuilder({
				projectName: input.projectName ?? "Unnamed Project",
				technicalChallenge: input.technicalChallenge ?? "",
				includeReferences: input.includeReferences,
				includeMetadata: input.includeMetadata,
			});

		case "enterprise-architect":
			return enterpriseArchitectPromptBuilder({
				initiativeName: input.projectName ?? "Unnamed Initiative",
				problemStatement:
					input.technicalChallenge ?? input.currentLandscape ?? "",
				includeReferences: input.includeReferences,
				includeMetadata: input.includeMetadata,
			});

		case "design-session": {
			const result = await designAssistant.processRequest({
				action: "start-session",
				sessionId: input.sessionId ?? `session-${Date.now()}`,
				// biome-ignore lint/suspicious/noExplicitAny: config accepts partial shape via z.any()
				config: {
					goal: input.technicalChallenge ?? "",
					context: input.currentLandscape ?? "",
					requirements: [],
				} as any,
			});
			return {
				content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
			};
		}

		default:
			throw new Error(
				`Unknown design-architecture action: ${(input as DesignArchitectureInput).action}`,
			);
	}
}
