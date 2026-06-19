import type { RecommendationItem } from "../../contracts/runtime.js";
import type { SkillExecutionContext } from "../runtime/contracts.js";
import {
	type AnalysisDirectiveSpec,
	buildAnalysisDirective,
} from "./analysis-directive.js";

export type AnalyzeOrDirectiveSpec = Omit<AnalysisDirectiveSpec, "modelClass">;

const MAX_TOKENS = 700;

/**
 * Produce the lead analysis recommendation for a skill. When the client offers
 * MCP sampling (`context.runtime.sampler`), ask the model to analyze the real
 * project against the rubric and return its findings. Otherwise — or on any
 * sampling error / empty response — fall back to the universal return-a-prompt
 * directive, which works on every client.
 */
export async function analyzeOrDirective(
	context: SkillExecutionContext,
	spec: AnalyzeOrDirectiveSpec,
): Promise<{
	recommendation: RecommendationItem;
	mode: "sampled" | "directive";
}> {
	const modelClass = context.model.modelClass;
	const directive = buildAnalysisDirective({ ...spec, modelClass });
	const sampler = context.runtime.sampler;
	if (!sampler) {
		return { recommendation: directive, mode: "directive" };
	}
	try {
		const { text } = await sampler({
			system: `You analyze a project's ${spec.domain} against a rubric. Be specific and cite evidence from the project; never return generic advice.`,
			prompt: directive.detail,
			maxTokens: MAX_TOKENS,
			modelClass,
		});
		if (text.trim().length === 0) {
			return { recommendation: directive, mode: "directive" };
		}
		return {
			recommendation: {
				title: `Analysis of your ${spec.domain}`,
				detail: text.trim(),
				modelClass,
				groundingScope: "context",
			},
			mode: "sampled",
		};
	} catch {
		return { recommendation: directive, mode: "directive" };
	}
}
