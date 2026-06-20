import type { RecommendationItem, Sampler } from "../../contracts/runtime.js";
import {
	type AnalysisDirectiveSpec,
	buildAnalysisDirective,
} from "./analysis-directive.js";

type ModelClass = RecommendationItem["modelClass"];

export type AnalyzeOrDirectiveSpec = Omit<AnalysisDirectiveSpec, "modelClass">;

/**
 * The minimal context `analyzeOrDirective` needs. Both a `SkillExecutionContext`
 * (`{ model, runtime }`) and an instruction-level caller can satisfy this, so the
 * LLM→LLM transform works at the skill *or* the workflow boundary.
 */
export interface AnalyzeDeps {
	modelClass: ModelClass;
	sampler?: Sampler;
}

const MAX_TOKENS = 1000;

/**
 * Produce the situation-specific lead. When the client offers MCP sampling, ask
 * the model to analyze the real project against the rubric and plan next actions,
 * returning its findings + a tailored workflow. Otherwise — or on any sampling
 * error / empty response — fall back to the universal return-a-prompt directive,
 * which carries the same two-part ask and works on every client.
 */
export async function analyzeOrDirective(
	deps: AnalyzeDeps,
	spec: AnalyzeOrDirectiveSpec,
): Promise<{
	recommendation: RecommendationItem;
	mode: "sampled" | "directive";
}> {
	const { modelClass, sampler } = deps;
	const directive = buildAnalysisDirective({ ...spec, modelClass });
	if (!sampler) {
		return { recommendation: directive, mode: "directive" };
	}
	try {
		const { text } = await sampler({
			system: `You analyze a project's ${spec.domain} against a rubric, then plan the next actions. Be specific and cite evidence from the project; never return generic advice or restate the criteria.`,
			prompt: directive.detail,
			maxTokens: MAX_TOKENS,
			modelClass,
		});
		if (text.trim().length === 0) {
			return { recommendation: directive, mode: "directive" };
		}
		return {
			recommendation: {
				title: `Analysis of your ${spec.domain} + next actions`,
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
