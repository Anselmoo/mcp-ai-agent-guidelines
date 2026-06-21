import type {
	InstructionInput,
	RecommendationItem,
} from "../../contracts/runtime.js";

type ModelClass = RecommendationItem["modelClass"];

/**
 * Specification for an analysis directive — a "return-a-prompt" instruction that
 * tasks the *calling* agent (which already holds the real project in context)
 * with performing project-specific analysis against a rubric, instead of the
 * skill emitting generic, keyword-matched advice the agent already knows.
 */
export interface AnalysisDirectiveSpec {
	/** The thing being analyzed, e.g. "evaluation setup", "incident". */
	domain: string;
	/** Rubric criteria the agent must evaluate the real project against. */
	criteria: readonly string[];
	/** The originating request/context, used to anchor the directive. */
	input: InstructionInput;
	/** The shape of artifact the agent should produce. */
	outputContract: string;
	/** Model class label carried through onto the recommendation. */
	modelClass: ModelClass;
	/**
	 * Candidate tools/skills the agent may chain next. They seed — but do not
	 * dictate — the tailored next-action workflow the directive asks for.
	 */
	candidateNextTools?: readonly string[];
}

/**
 * Build a directive recommendation that turns a static rubric into an actionable
 * analysis task for the calling agent. This is the universal LLM→LLM mechanism:
 * it needs no client capability because the tool's output is itself a prompt the
 * calling model executes against the project it already has open.
 */
export function buildAnalysisDirective(
	spec: AnalysisDirectiveSpec,
): RecommendationItem {
	const { domain, criteria, input, outputContract, modelClass } = spec;

	const criteriaBlock =
		criteria.length > 0
			? criteria.map((c) => `- ${c}`).join("\n")
			: "- Derive the criteria that matter for this case from the request and context.";

	const candidates = spec.candidateNextTools ?? [];
	const workflowLine =
		candidates.length > 0
			? `Then produce a next-action workflow for THIS situation: the concrete, ordered steps to take next. Candidate tools to chain (seed, not a script — tailor the actual sequence to the real problem): ${candidates.join(", ")}.`
			: "Then produce a next-action workflow for THIS situation: the concrete, ordered steps to take next, tailored to the real problem rather than a generic checklist.";

	const detail = [
		`Analysis task — do this yourself against the real ${domain}; you have the project in context, this skill does not.`,
		`Work from the actual request: "${input.request.trim()}".`,
		"For each criterion below, judge how the project actually stands and cite the specific files, values, or evidence that justify the call. Do not restate the criterion as generic advice; if the evidence is missing, say exactly what to inspect.",
		`Criteria for the ${domain}:`,
		criteriaBlock,
		`Produce: ${outputContract}.`,
		workflowLine,
	].join("\n\n");

	return {
		title: `Analyze your ${domain} and plan next actions`,
		detail,
		modelClass,
		groundingScope: "context",
	};
}
