import type { ModelClass } from "../contracts/generated.js";
import type {
	RecommendationItem,
	SkillArtifact,
	WorkflowExecutionResult,
} from "../contracts/runtime.js";
import type { MethodologyReport } from "../skills/shared/methodology-gate.js";
import {
	getGroundingScopeLabel,
	sortRecommendationsByGrounding,
} from "../skills/shared/recommendations.js";
import { glyphRegistry } from "../visualization/glyph-registry.js";

/** Maps ModelClass to a status emoji prefix for recommendation headers. */
function modelClassEmoji(cls: ModelClass): string {
	switch (cls) {
		case "free":
			return glyphRegistry.statusEmoji.success.symbol; // ✅
		case "cheap":
			return glyphRegistry.statusEmoji.info.symbol; // ℹ️
		case "strong":
			return glyphRegistry.statusEmoji.hot.symbol; // 🔥
		case "reviewer":
			return glyphRegistry.statusEmoji.robot.symbol; // 🤖
	}
}

/** Maps workflow step kind to a DevEmoji prefix. */
function stepKindEmoji(kind: string): string {
	const map: Record<string, string> = {
		implement: glyphRegistry.devEmoji.feat.symbol,
		verify: glyphRegistry.devEmoji.test.symbol,
		review: glyphRegistry.devEmoji.ci.symbol,
		refactor: glyphRegistry.devEmoji.refactor.symbol,
		analyze: glyphRegistry.devEmoji.perf.symbol,
		document: glyphRegistry.devEmoji.docs.symbol,
		finalize: glyphRegistry.devEmoji.chore.symbol,
		research: glyphRegistry.devEmoji.feat.symbol,
		debug: glyphRegistry.devEmoji.fix.symbol,
		plan: glyphRegistry.devEmoji.chore.symbol,
		govern: glyphRegistry.devEmoji.security.symbol,
		orchestrate: glyphRegistry.devEmoji.merge.symbol,
	};
	return map[kind] ?? glyphRegistry.devEmoji.chore.symbol;
}

function formatRecommendation(
	recommendation: RecommendationItem,
	index: number,
): string {
	const groundingLabel = getGroundingScopeLabel(recommendation.groundingScope);
	const header = `${modelClassEmoji(recommendation.modelClass)} ${index + 1}. **${recommendation.title}** (${recommendation.modelClass}${groundingLabel ? ` / ${groundingLabel}` : ""}) — ${recommendation.detail}`;
	const detailLines = [
		recommendation.problem ? `   - Problem: ${recommendation.problem}` : null,
		recommendation.suggestedAction
			? `   - Action: ${recommendation.suggestedAction}`
			: null,
		recommendation.evidenceAnchors && recommendation.evidenceAnchors.length > 0
			? `   - Evidence: ${recommendation.evidenceAnchors
					.map((anchor) => `\`${anchor}\``)
					.join(", ")}`
			: null,
		recommendation.sourceRefs && recommendation.sourceRefs.length > 0
			? `   - Sources: ${recommendation.sourceRefs
					.map((sourceRef) => `\`${sourceRef}\``)
					.join(", ")}`
			: null,
	].filter((line): line is string => line !== null);
	return [header, ...detailLines].join("\n");
}

function formatArtifact(artifact: SkillArtifact, index: number): string {
	switch (artifact.kind) {
		case "worked-example":
			return `${index + 1}. **Worked example: ${artifact.title}**${artifact.description ? ` — ${artifact.description}` : ""}`;
		case "output-template":
			return `${index + 1}. **Output template: ${artifact.title}**${artifact.fields?.length ? ` — Fields: ${artifact.fields.map((field) => `\`${field}\``).join(", ")}` : ""}`;
		case "eval-criteria":
			return `${index + 1}. **Evaluation criteria: ${artifact.title}** — ${artifact.criteria.join("; ")}`;
		case "comparison-matrix":
			return `${index + 1}. **Comparison matrix: ${artifact.title}** — ${artifact.headers.join(" | ")} (${artifact.rows.length} row${artifact.rows.length === 1 ? "" : "s"})`;
		case "tool-chain":
			return `${index + 1}. **Tool chain: ${artifact.title}** — ${artifact.steps
				.map((step) =>
					step.description
						? `\`${step.tool}\` (${step.description})`
						: `\`${step.tool}\``,
				)
				.join(" → ")}`;
	}
}

export interface WorkflowEnvelopePayload {
	displayName: string;
	instructionId: string;
	model: { id: string; label: string };
	steps: Array<{ kind: string; label: string; summary: string }>;
	recommendations: RecommendationItem[];
	artifacts: SkillArtifact[];
	/** "sampled" = LLM-grounded analysis; "directive" = template fallback (no sampling client). */
	situationMode?: "sampled" | "directive";
	methodology?: MethodologyReport;
}

/**
 * Builds the structured envelope payload for a workflow result.
 * Extracts only `id` and `label` from `result.model` — other fields
 * (modelClass, costTier, etc.) are intentionally omitted from the payload.
 * This is a sibling to `formatWorkflowResult`; both coexist.
 *
 * Deviation note: `result.instructionId` holds the spec's internal `id`
 * (e.g. `"research"`) which differs from the public tool name
 * (`"evidence-research"`).  Pass `toolName` to override so the envelope
 * exposes the stable public name callers already know.
 */
export function buildWorkflowEnvelopePayload(
	result: WorkflowExecutionResult,
	toolName?: string,
): WorkflowEnvelopePayload {
	return {
		displayName: result.displayName,
		instructionId: toolName ?? result.instructionId,
		model: { id: result.model.id, label: result.model.label },
		steps: result.steps.map((s) => ({
			kind: s.kind,
			label: s.label,
			summary: s.summary,
		})),
		recommendations: result.recommendations,
		artifacts: [
			...(result.artifacts ?? []),
			...result.steps.flatMap((s) => s.skillResult?.artifacts ?? []),
		],
		...(result.situationMode ? { situationMode: result.situationMode } : {}),
	};
}

export function formatWorkflowResult(
	result: WorkflowExecutionResult,
	toolName?: string,
): string {
	const recommendationLines = result.recommendations.length
		? sortRecommendationsByGrounding(result.recommendations)
				.map(formatRecommendation)
				.join("\n")
		: "1. **No recommendations** (free) — The workflow completed without generated recommendations.";

	const stepLines = result.steps
		.map(
			(step) =>
				`${stepKindEmoji(step.kind)} **${step.label}** [${step.kind}] — ${step.summary}`,
		)
		.join("\n");
	// Merge top-level promoted artifacts first, then step-level artifacts.
	// Top-level `result.artifacts` represent workflow-consolidated outputs;
	// step-level artifacts provide per-skill detail. Both are rendered so
	// consumers can navigate from the summary down to individual skill output.
	const artifactLines = [
		...(result.artifacts ?? []),
		...result.steps.flatMap((step) => step.skillResult?.artifacts ?? []),
	]
		.map(formatArtifact)
		.join("\n");

	return [
		`# ${result.displayName}`,
		"",
		`**Instruction:** \`${toolName ?? result.instructionId}\``,
		`**Assigned model:** ${result.model.label}`,
		...(result.request ? [`**Request:** ${result.request}`] : []),
		"",
		"## Executed workflow",
		stepLines || "- No workflow steps executed.",
		"",
		"## Produced artifacts",
		artifactLines ||
			"1. **No artifacts** — No structured artifacts were emitted by workflow steps.",
		"",
		"## Recommendations",
		recommendationLines,
	].join("\n");
}
