import type {
	InstructionInput,
	SkillExecutionResult,
} from "../../contracts/runtime.js";
import {
	buildContextReferenceArtifact,
	buildToolChainArtifact,
} from "../shared/handler-helpers.js";
import {
	buildSkillRecommendations,
	summarizeRecommendationGrounding,
} from "../shared/recommendations.js";
import type { SkillExecutionContext, SkillHandler } from "./contracts.js";

// ---------------------------------------------------------------------------
// metadataSkillHandler — manifest-echo fallback
//
// This is the LAST-RESORT fallback used by DefaultSkillResolver when no real
// SkillHandler has been registered for a skill.  It calls buildSkillRecommendations()
// which reads static manifest fields (purpose, usageSteps, recommendationHints)
// and returns them verbatim — completely ignoring the runtime InstructionInput.
//
// THIS IS THE BEHAVIOUR BEING REPLACED BY THE CAPABILITY PROGRAM (ADR-001).
//
// A skill "graduates" from this fallback when a real SkillHandler is registered
// for it via defaultSkillResolver.register() in:
//   src/skills/runtime/default-skill-resolver.ts
//
// Real handlers must call extractRequestSignals(input) from:
//   src/skills/shared/recommendations.ts
// and derive their output from the signals rather than from manifest text.
// ---------------------------------------------------------------------------

export async function executeMetadataBackedSkill(
	_input: InstructionInput,
	context: SkillExecutionContext,
): Promise<SkillExecutionResult> {
	const recommendations = buildSkillRecommendations(
		context.manifest,
		context.input,
	);
	const groundingSummary =
		summarizeRecommendationGrounding(recommendations) ?? undefined;
	const artifacts = [
		buildToolChainArtifact(
			`${context.manifest.displayName} usage steps`,
			context.manifest.usageSteps.map((step) => ({ tool: step })),
			"Manifest usage steps surfaced as a concrete fallback operating sequence.",
		),
		buildContextReferenceArtifact(context.input),
	].filter(
		(artifact): artifact is NonNullable<typeof artifact> =>
			artifact !== undefined,
	);

	return {
		skillId: context.skillId,
		displayName: context.manifest.displayName,
		model: context.model,
		summary: groundingSummary
			? `${context.manifest.displayName} generated ${recommendations.length} recommendation(s). ${groundingSummary}.`
			: `${context.manifest.displayName} generated ${recommendations.length} recommendation(s).`,
		recommendations,
		relatedSkills: context.manifest.relatedSkills,
		executionMode: "fallback",
		groundingSummary,
		artifacts,
	};
}

export const metadataSkillHandler: SkillHandler = {
	execute: executeMetadataBackedSkill,
};
