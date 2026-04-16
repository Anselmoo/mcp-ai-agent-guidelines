import type { SkillManifestEntry } from "../../contracts/generated.js";
import type { SkillHandler, SkillResolver } from "./contracts.js";
import { metadataSkillHandler } from "./metadata-skill-handler.js";

type SkillHandlerMatcher = string | ((manifest: SkillManifestEntry) => boolean);

interface SkillHandlerRegistration {
	match: SkillHandlerMatcher;
	handler: SkillHandler;
}

function matchesRegistration(
	registration: SkillHandlerRegistration,
	manifest: SkillManifestEntry,
): boolean {
	return typeof registration.match === "string"
		? registration.match === manifest.id
		: registration.match(manifest);
}

/**
 * Resolves a SkillHandler for a given skill manifest by checking a list of
 * registered (match → handler) pairs in insertion order.  Falls back to
 * `metadataSkillHandler` (manifest-echo) when no registration matches.
 *
 * REGISTRATION POINT FOR REAL CAPABILITY HANDLERS
 * ─────────────────────────────────────────────────
 * Domain skill modules bake in their handler via:
 *   export const skillModule = createSkillModule(manifest, handler)
 * and are registered in hidden-skills.ts by their domain path.
 *
 * This resolver is the last-resort fallback for skills that have not yet
 * been migrated to a domain module.  When a domain module is available,
 * its baked-in handler takes precedence (see createSkillModule logic).
 *
 * MIGRATION STATUS
 * ────────────────
 * Complete domains: adapt, arch, bench, debug, doc, eval, flow, gov, gr,
 * lead, orch, prompt, qm, qual, req, resil, strat, synth
 * Complete phases: none
 * Generated-only domains: none
 *
 * Keep these claims truthful.  The domain-completeness gate in
 * substrate-handlers.test.ts verifies that anything listed as complete is fully
 * promoted in hidden-skills.ts, executes through real capability handlers, and
 * meets the stricter parsed-input migration bar from issue #18.
 */
export class DefaultSkillResolver implements SkillResolver {
	private readonly registrations: SkillHandlerRegistration[];

	constructor(
		registrations: SkillHandlerRegistration[] = [],
		private readonly fallbackHandler: SkillHandler = metadataSkillHandler,
	) {
		this.registrations = [...registrations];
	}

	register(match: SkillHandlerMatcher, handler: SkillHandler): void {
		this.registrations.push({ match, handler });
	}

	resolve(manifest: SkillManifestEntry): SkillHandler {
		for (const registration of this.registrations) {
			if (matchesRegistration(registration, manifest)) {
				return registration.handler;
			}
		}

		return this.fallbackHandler;
	}
}

export const defaultSkillResolver = new DefaultSkillResolver();
