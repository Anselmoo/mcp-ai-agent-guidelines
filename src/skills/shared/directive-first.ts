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

/**
 * The only tools whose deliverable IS a situation analysis against a rubric —
 * the ones the LLM→LLM transform should collapse. Each maps to a clean domain
 * noun: the public `displayName` carries a "Label:" prefix (e.g. "Evaluate:
 * Benchmark and Assess Quality") that reads wrong as an analysis domain.
 *
 * Routers, onboarding, bootstrap, orchestration, and planning tools are
 * intentionally absent — their deliverable is a decision, config, or plan, not
 * a rubric analysis, so collapsing them to "analyze your X" is nonsensical.
 * Presence in this map is the allow-list; absence means "pass through untouched".
 */
export const ANALYSIS_TRANSFORM_DOMAINS: Readonly<Record<string, string>> = {
	"quality-evaluate": "evaluation setup",
	"code-review": "code under review",
	"issue-debug": "bug or incident",
	"system-design": "system design",
	"evidence-research": "research question",
	"policy-govern": "governance and compliance posture",
	"fault-resilience": "fault-tolerance and resilience posture",
};

/**
 * Resolve the clean analysis domain for a tool, or `undefined` when the tool is
 * not in the analysis family and must not be transformed.
 */
export function resolveTransformDomain(toolName: string): string | undefined {
	return ANALYSIS_TRANSFORM_DOMAINS[toolName];
}

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
