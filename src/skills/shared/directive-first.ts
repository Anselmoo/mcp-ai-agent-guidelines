import type {
	Sampler,
	WorkflowExecutionResult,
} from "../../contracts/runtime.js";
import { ADVISORY_PREFIX } from "./advisory.js";
import { analyzeOrDirective } from "./analyze-or-directive.js";

/**
 * Cap on artifacts a transformed (collapsed) analysis result renders. The
 * matched templates are the rubric seed now; the directive supersedes the
 * template wall, so we keep only a small representative sample to stop a single
 * call ballooning to 60–230KB of delegated-skill scaffolding.
 */
export const TRANSFORM_ARTIFACT_CAP = 6;

export interface TransformProfile {
	/** Clean domain noun for the directive ("evaluation setup", not "Evaluate:"). */
	domain: string;
	/** The shape of deliverable the directive asks the model to produce. */
	outputContract: string;
	/**
	 * Tools to seed the next-action workflow with, overriding the instruction's
	 * manifest `chainTo`. Used by routing tools (e.g. meta-routing) whose job is
	 * to name the domain instructions to invoke but whose manifest `chainTo` is
	 * empty.
	 */
	candidateNextTools?: readonly string[];
}

/** Output contract for rubric-analysis tools — findings + next actions. */
export const ANALYSIS_OUTPUT_CONTRACT =
	"findings per criterion that cite the actual files, values, or evidence in this project, then a tailored next-action workflow";

/** Output contract for build/plan tools — a tailored deliverable + next steps. */
export const BUILD_OUTPUT_CONTRACT =
	"a concrete, tailored deliverable for this request — the specific changes, steps, tests, or artifacts to produce, grounded in the actual files and code, followed by an ordered next-action sequence";

/** Output contract for orchestration tools — a tailored coordination plan. */
export const ORCHESTRATION_OUTPUT_CONTRACT =
	"the concrete agent topology, role assignments, and coordination plan for this request — who does what, in what order, and how the results are synthesized, followed by an ordered next-action sequence";

/** Output contract for prompt tools — a tailored prompt deliverable. */
export const PROMPT_OUTPUT_CONTRACT =
	"the concrete, tailored prompt (or prompt changes) for this request — the structure, instructions, examples, and guardrails to use, grounded in the real task and failure modes, followed by an ordered next-action sequence";

/** Output contract for routing tools — a request-anchored, ordered call list. */
export const ROUTING_OUTPUT_CONTRACT =
	"the concrete, ordered domain instruction(s) to invoke for this request — name each tool, give a one-line rationale, and say whether to run them in sequence or in parallel";

/** Output contract for adaptive-routing — a concrete bio-inspired routing policy. */
export const ADAPTIVE_ROUTING_OUTPUT_CONTRACT =
	"the concrete adaptive routing policy for this request — which bio-inspired strategy fits, the signals that reinforce or prune each route, and the convergence criteria to stop tuning, followed by an ordered next-action sequence";

/**
 * Output contract for orientation tools — a request-specific scope brief, NOT a
 * solution. Orientation tools (task-bootstrap, project-onboard) run before
 * implementation; asking them to "solve THIS request" is the B#2 category error,
 * so the contract orients (scope + unknowns + first move) instead of solving.
 */
export const ORIENTATION_OUTPUT_CONTRACT =
	"a request-specific orientation brief — what is in and out of scope, the key ambiguities to resolve first, and the recommended first instruction to invoke — not a finished solution, followed by an ordered next-action sequence";

/**
 * Domain instructions a router classifies a request toward. Intentionally a
 * curated routing-target set, NOT a mirror of `TRANSFORM_PROFILES`: it excludes
 * orchestration and prompt tools (invoked as deliverable producers, not routing
 * destinations) and the router/orientation tools themselves.
 */
const ROUTABLE_DOMAIN_TOOLS: readonly string[] = [
	"feature-implement",
	"issue-debug",
	"system-design",
	"code-review",
	"code-refactor",
	"test-verify",
	"evidence-research",
	"strategy-plan",
	"docs-generate",
	"quality-evaluate",
	"policy-govern",
	"fault-resilience",
];

/**
 * Per-tool transform profiles. Presence is the allow-list; absence means
 * "pass through untouched". Analysis tools produce findings against a rubric;
 * build tools produce concrete deliverables; the router (meta-routing) produces
 * a request-anchored decision naming the instructions to invoke; orchestration
 * (agent-orchestrate) produces a tailored coordination plan; prompt tools
 * (prompt-engineering) produce a tailored prompt artifact; adaptive routing
 * (routing-adapt) produces a bio-inspired routing policy; orientation tools
 * (task-bootstrap, project-onboard) produce a request-specific scope brief.
 * Only the analogy special path is absent — it already gates to a
 * request-anchored metaphor (or "no analogy opens") rather than a template wall.
 */
export const TRANSFORM_PROFILES: Readonly<Record<string, TransformProfile>> = {
	"meta-routing": {
		domain: "request",
		outputContract: ROUTING_OUTPUT_CONTRACT,
		candidateNextTools: ROUTABLE_DOMAIN_TOOLS,
	},
	"routing-adapt": {
		domain: "adaptive routing policy",
		outputContract: ADAPTIVE_ROUTING_OUTPUT_CONTRACT,
	},
	"task-bootstrap": {
		domain: "task scope and unknowns",
		outputContract: ORIENTATION_OUTPUT_CONTRACT,
	},
	"project-onboard": {
		domain: "project scope and entry points",
		outputContract: ORIENTATION_OUTPUT_CONTRACT,
	},
	"agent-orchestrate": {
		domain: "agent orchestration",
		outputContract: ORCHESTRATION_OUTPUT_CONTRACT,
	},
	"quality-evaluate": {
		domain: "evaluation setup",
		outputContract: ANALYSIS_OUTPUT_CONTRACT,
	},
	"code-review": {
		domain: "code under review",
		outputContract: ANALYSIS_OUTPUT_CONTRACT,
	},
	"issue-debug": {
		domain: "bug or incident",
		outputContract: ANALYSIS_OUTPUT_CONTRACT,
	},
	"system-design": {
		domain: "system design",
		outputContract: ANALYSIS_OUTPUT_CONTRACT,
	},
	"evidence-research": {
		domain: "research question",
		outputContract: ANALYSIS_OUTPUT_CONTRACT,
	},
	"policy-govern": {
		domain: "governance and compliance posture",
		outputContract: ANALYSIS_OUTPUT_CONTRACT,
	},
	"fault-resilience": {
		domain: "fault-tolerance and resilience posture",
		outputContract: ANALYSIS_OUTPUT_CONTRACT,
	},
	"feature-implement": {
		domain: "feature to implement",
		outputContract: BUILD_OUTPUT_CONTRACT,
	},
	"code-refactor": {
		domain: "refactor target",
		outputContract: BUILD_OUTPUT_CONTRACT,
	},
	"test-verify": {
		domain: "test and verification gap",
		outputContract: BUILD_OUTPUT_CONTRACT,
	},
	"strategy-plan": {
		domain: "plan or roadmap",
		outputContract: BUILD_OUTPUT_CONTRACT,
	},
	"docs-generate": {
		domain: "documentation to produce",
		outputContract: BUILD_OUTPUT_CONTRACT,
	},
	"enterprise-strategy": {
		domain: "enterprise strategy",
		outputContract: BUILD_OUTPUT_CONTRACT,
	},
	"prompt-engineering": {
		domain: "prompt asset",
		outputContract: PROMPT_OUTPUT_CONTRACT,
	},
};

/** Resolve a tool's transform profile, or `undefined` when it must pass through. */
export function resolveTransformProfile(
	toolName: string,
): TransformProfile | undefined {
	return TRANSFORM_PROFILES[toolName];
}

export interface SituationTransformDeps {
	/** Public display name of the instruction → the analysis domain. */
	domain: string;
	/** The shape of deliverable the directive asks the model to produce. */
	outputContract: string;
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
 * `chainTo`). Steps' labels are preserved, but the merged artifact set is capped
 * at `TRANSFORM_ARTIFACT_CAP` and per-step artifact lists are cleared (the
 * directive supersedes the template wall). Only the short-circuit paths — no
 * usable seed recommendations, or a blank request — return the result
 * referentially unchanged.
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

	// No problem statement to anchor the analysis to → pass through unchanged
	// rather than emit a directive that reads `Work from the actual request: ""`.
	const request = result.request?.trim() ?? "";
	if (request.length === 0) {
		return result;
	}

	const { recommendation } = await analyzeOrDirective(
		{ modelClass: result.model.modelClass, sampler: deps.sampler },
		{
			domain: deps.domain,
			criteria: seedCriteria,
			input: { request },
			outputContract: deps.outputContract,
			candidateNextTools: deps.candidateNextTools,
		},
	);

	const evidenceAnchors = [
		...new Set(result.recommendations.flatMap((r) => r.evidenceAnchors ?? [])),
	];
	const sourceRefs = [
		...new Set(result.recommendations.flatMap((r) => r.sourceRefs ?? [])),
	];

	const mergedArtifacts = [
		...(result.artifacts ?? []),
		...result.steps.flatMap((s) => s.skillResult?.artifacts ?? []),
	].slice(0, TRANSFORM_ARTIFACT_CAP);
	const trimmedSteps = result.steps.map((s) =>
		s.skillResult
			? { ...s, skillResult: { ...s.skillResult, artifacts: [] } }
			: s,
	);

	return {
		...result,
		steps: trimmedSteps,
		artifacts: mergedArtifacts,
		recommendations: [
			{
				...recommendation,
				...(evidenceAnchors.length > 0 ? { evidenceAnchors } : {}),
				...(sourceRefs.length > 0 ? { sourceRefs } : {}),
			},
		],
	};
}
