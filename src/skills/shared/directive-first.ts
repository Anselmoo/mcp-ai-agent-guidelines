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
}

/** Output contract for rubric-analysis tools — findings + next actions. */
export const ANALYSIS_OUTPUT_CONTRACT =
	"findings per criterion that cite the actual files, values, or evidence in this project, then a tailored next-action workflow";

/** Output contract for build/plan tools — a tailored deliverable + next steps. */
export const BUILD_OUTPUT_CONTRACT =
	"a concrete, tailored deliverable for this request — the specific changes, steps, tests, or artifacts to produce, grounded in the actual files and code, followed by an ordered next-action sequence";

/**
 * Per-tool transform profiles. Presence is the allow-list; absence means
 * "pass through untouched". Analysis tools produce findings against a rubric;
 * build tools produce concrete deliverables. Routers/orientation/orchestration
 * tools are intentionally absent (their deliverable is a decision/config, not
 * a rubric analysis or concrete build).
 */
export const TRANSFORM_PROFILES: Readonly<Record<string, TransformProfile>> = {
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
