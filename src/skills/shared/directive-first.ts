import type {
	Sampler,
	WorkflowExecutionResult,
} from "../../contracts/runtime.js";
import { analyzeOrDirective } from "./analyze-or-directive.js";

/**
 * Every advisory family disclaimer (eval/bench/gov/resil) starts with this
 * sentence, so one prefix filter strips them all out of the rubric seed.
 */
const ADVISORY_PREFIX = "This analysis is advisory only";

export interface SituationTransformDeps {
	/** Public display name of the instruction → the analysis domain. */
	domain: string;
	/** `instruction.chainTo` → candidate next tools that seed the workflow. */
	candidateNextTools: readonly string[];
	/** Optional server-driven sampling (MCP `sampling/createMessage`). */
	sampler?: Sampler;
}

/**
 * Turn a workflow's keyword-matched template recommendations into ONE
 * situation-specific result: the matched templates become the rubric seed a
 * model works the real project against (LLM→LLM), replacing the wall of generic
 * advice. The output carries both halves of the contract — per-criterion
 * findings and a tailored next-action workflow (superseding the static
 * `chainTo`). Artifacts and steps are preserved untouched.
 *
 * Recommendations whose text is an advisory-only disclaimer are dropped from the
 * seed. If nothing usable remains (e.g. an insufficient-signal or fallback
 * result), the result is returned unchanged.
 */
export async function toSituationResult(
	result: WorkflowExecutionResult,
	deps: SituationTransformDeps,
): Promise<WorkflowExecutionResult> {
	const seedCriteria = result.recommendations
		.map((r) => r.detail.trim())
		.filter((d) => d.length > 0 && !d.startsWith(ADVISORY_PREFIX));

	if (seedCriteria.length === 0) {
		return result;
	}

	const { recommendation } = await analyzeOrDirective(
		{ modelClass: result.model.modelClass, sampler: deps.sampler },
		{
			domain: deps.domain,
			criteria: seedCriteria,
			input: { request: result.request?.trim() ?? "" },
			outputContract:
				"findings per criterion that cite the actual files, values, or evidence in this project, then a tailored next-action workflow",
			candidateNextTools: deps.candidateNextTools,
		},
	);

	return { ...result, recommendations: [recommendation] };
}
