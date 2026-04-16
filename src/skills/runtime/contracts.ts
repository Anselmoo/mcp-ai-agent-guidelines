import type { SkillManifestEntry } from "../../contracts/generated.js";
import type {
	InstructionInput,
	ModelProfile,
	SkillExecutionResult,
	SkillExecutionRuntime,
} from "../../contracts/runtime.js";

/**
 * The full context available to a SkillHandler at execution time.
 * Passed as the second argument to SkillHandler.execute().
 */
export interface SkillExecutionContext {
	skillId: string;
	manifest: SkillManifestEntry;
	input: InstructionInput;
	model: ModelProfile;
	runtime: SkillExecutionRuntime;
}

/**
 * Contract for a real capability handler for one skill.
 *
 * A SkillHandler replaces the manifest-echo fallback (metadataSkillHandler)
 * for the skill(s) it is registered to handle.
 *
 * IMPLEMENTATION CONTRACT
 * ────────────────────────
 * 1.  Derive output from context.input — not from context.manifest text fields.
 *     Use extractRequestSignals(context.input) from shared/recommendations.ts.
 *
 * 2.  Be deterministic: no model API calls, no file I/O.  The host LLM uses
 *     the structured recommendations to do its own reasoning.
 *
 * 3.  Return an "insufficient signal" item (do not throw) when input.request
 *     is too short to generate specific findings:
 *
 *       if (signals.keywords.length === 0 && !signals.hasContext) {
 *         return { skillId: ..., summary: '...insufficient signal...',
 *                  recommendations: [{ title: 'Provide more detail', ... }] };
 *       }
 *
 * 4.  Populate all fields of SkillExecutionResult using context:
 *       skillId:      context.skillId
 *       displayName:  context.manifest.displayName
 *       model:        context.model
 *       relatedSkills: context.manifest.relatedSkills
 *
 * REGISTRATION
 * ────────────
 * Register in src/skills/runtime/default-skill-resolver.ts:
 *   defaultSkillResolver.register('<skillId>', myHandler);
 *
 * FILE CONVENTION
 * ────────────────
 * One file per skill: src/skills/handlers/<skillId>.ts
 * Export a named const: export const <camelCaseSkillId>Handler: SkillHandler = { ... };
 */
export interface SkillHandler {
	execute: (
		input: InstructionInput,
		context: SkillExecutionContext,
	) => Promise<SkillExecutionResult>;
}

/**
 * Resolves a SkillHandler for a given skill manifest.
 * The default implementation is DefaultSkillResolver in default-skill-resolver.ts.
 */
export interface SkillResolver {
	resolve: (manifest: SkillManifestEntry) => SkillHandler;
}
