/**
 * Generic skill dispatch: routes calls by skill-name prefix to the
 * appropriate execution tier (physics, governance, advanced/bio-inspired,
 * or core).
 *
 * Prefix → tier mapping (from copilot-instructions.md):
 *   qm-  / gr-  → physics
 *   gov-        → governance
 *   adv-        → advanced / bio-inspired
 *   *           → core
 */

import type { SkillManifestEntry } from "../contracts/generated.js";
import type {
	InstructionInput,
	SkillExecutionResult,
} from "../contracts/runtime.js";

// ---------------------------------------------------------------------------
// Tier classification
// ---------------------------------------------------------------------------

export type SkillTier = "physics" | "governance" | "advanced" | "core";

/**
 * Derive the execution tier from a skill name.
 */
export function tierForSkill(skillName: string): SkillTier {
	if (skillName.startsWith("qm-") || skillName.startsWith("gr-")) {
		return "physics";
	}
	if (skillName.startsWith("gov-")) {
		return "governance";
	}
	if (
		skillName.startsWith("adv-") ||
		skillName.startsWith("resil-") ||
		skillName.startsWith("adapt-") ||
		skillName.startsWith("strat-") ||
		skillName.startsWith("orch-")
	) {
		return "advanced";
	}
	return "core";
}

// ---------------------------------------------------------------------------
// Context membrane — domain-scoped input filtering (A9)
// ---------------------------------------------------------------------------

/**
 * Keys from `InstructionInput` that each skill tier is allowed to read.
 * - `gov-*`: strip `context` to prevent unintentional PII propagation into
 *   policy-validation handlers that should only reason about the explicit
 *   request and options.
 * - `qm-*` / `gr-*` (physics): strip `options` to close the side-channel
 *   through which callers could influence deterministic physics metaphor
 *   computations with runtime tuning parameters.
 * - Everything else: full passthrough.
 */
const TIER_ALLOWED_KEYS: Readonly<
	Record<SkillTier, ReadonlyArray<keyof InstructionInput>>
> = {
	governance: [
		"request",
		"options",
		"constraints",
		"successCriteria",
		"deliverable",
	],
	physics: [
		"request",
		"context",
		"constraints",
		"successCriteria",
		"deliverable",
		"physicsAnalysisJustification",
	],
	advanced: [
		"request",
		"context",
		"options",
		"constraints",
		"successCriteria",
		"deliverable",
	],
	core: [
		"request",
		"context",
		"options",
		"constraints",
		"successCriteria",
		"deliverable",
	],
};

/**
 * Return a copy of `input` containing only the fields permitted for `tier`.
 * Unknown index-signature keys are always stripped — the membrane enforces the
 * canonical input surface regardless of what extra properties were injected.
 */
export function applyContextMembrane(
	tier: SkillTier,
	input: InstructionInput,
): InstructionInput {
	const allowed = TIER_ALLOWED_KEYS[tier];
	const filtered = {} as InstructionInput;
	for (const key of allowed) {
		if (key in input) {
			(filtered as Record<string, unknown>)[key] = input[key];
		}
	}
	return filtered;
}

// ---------------------------------------------------------------------------
// Dispatch result
// ---------------------------------------------------------------------------

export interface SkillDispatchResult {
	tier: SkillTier;
	skillId: string;
	result: SkillExecutionResult;
}

// ---------------------------------------------------------------------------
// Handler type
// ---------------------------------------------------------------------------

/**
 * A handler function that executes a single skill given its manifest entry and
 * the caller's input.
 */
export type SkillHandlerFn = (
	manifest: SkillManifestEntry,
	input: InstructionInput,
) => Promise<SkillExecutionResult>;

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/**
 * `SkillHandler` is a lightweight registry that maps skill tiers to their
 * concrete executor functions.  At runtime the MCP server registers one handler
 * per tier; `dispatch` then selects the correct one by inspecting the skill
 * name prefix.
 */
export class SkillHandler {
	private handlers = new Map<SkillTier, SkillHandlerFn>();
	/**
	 * Hebbian co-activation weights: `skillId → cumulative quality signal`.
	 * Incremented by `depositHebbianSignal()` on each successful dispatch.
	 * Use `hebbianDecay()` at session boundaries to apply evaporation.
	 */
	private readonly hebbianWeights = new Map<string, number>();

	/**
	 * Register an executor for a tier.  Re-registering overwrites the previous
	 * handler, which is intentional for testing overrides.
	 */
	register(tier: SkillTier, fn: SkillHandlerFn): this {
		this.handlers.set(tier, fn);
		return this;
	}

	/**
	 * Dispatch a skill call to the appropriate tier handler.
	 *
	 * @throws Error if no handler has been registered for the resolved tier.
	 */
	async dispatch(
		manifest: SkillManifestEntry,
		input: InstructionInput,
	): Promise<SkillDispatchResult> {
		const tier = tierForSkill(manifest.id);
		const handler = this.handlers.get(tier);

		if (!handler) {
			throw new Error(
				`No handler registered for skill tier "${tier}" (skill: "${manifest.id}"). ` +
					"Register a handler via SkillHandler.register() before dispatching.",
			);
		}

		// Physics-tier justification gate (A3): callers must supply a justification
		// string of at least 20 characters in `input.options.justification` before
		// invoking qm-* or gr-* skills.  This is intentionally checked pre-membrane
		// because the membrane strips `options` from physics-tier inputs.
		if (tier === "physics") {
			const justification = input.physicsAnalysisJustification;
			if (
				typeof justification !== "string" ||
				justification.trim().length < 20
			) {
				throw new Error(
					`Physics-tier skill "${manifest.id}" requires a justification. ` +
						"Supply input.physicsAnalysisJustification (string, ≥ 20 characters) " +
						"explaining why physics-metaphor analysis is appropriate for this task.",
				);
			}
		}

		// Apply domain-scoped context membrane before passing input to the handler.
		const filteredInput = applyContextMembrane(tier, input);

		let result: SkillExecutionResult;
		try {
			result = await handler(manifest, filteredInput);
		} catch (error) {
			// Re-throw with skill + tier context so callers know which skill failed.
			// Do NOT deposit a Hebbian signal — failed executions should not be reinforced.
			const message = error instanceof Error ? error.message : String(error);
			throw new Error(
				`Skill "${manifest.id}" (tier: "${tier}") execution failed: ${message}`,
			);
		}

		// Deposit a Hebbian co-activation signal for this skill (weight += 1.0).
		this.depositHebbianSignal(manifest.id, 1.0);

		return { tier, skillId: manifest.id, result };
	}

	/**
	 * Returns `true` when a handler is registered for the given tier.
	 */
	hasHandler(tier: SkillTier): boolean {
		return this.handlers.has(tier);
	}

	/**
	 * Return the set of tiers that currently have registered handlers.
	 */
	registeredTiers(): SkillTier[] {
		return [...this.handlers.keys()];
	}

	// ---------------------------------------------------------------------------
	// Hebbian weight API (A6)
	// ---------------------------------------------------------------------------

	/**
	 * Deposit a quality signal for a skill.
	 * Call after a successful dispatch to reinforce the skill's activation weight.
	 *
	 * @param skillId  - The skill identifier (e.g. `"core-quality-review"`).
	 * @param signal   - Quality signal in the range `(0, 1]`; defaults to `1.0`.
	 */
	depositHebbianSignal(skillId: string, signal = 1.0): void {
		const current = this.hebbianWeights.get(skillId) ?? 0;
		this.hebbianWeights.set(skillId, current + signal);
	}

	/**
	 * Return the accumulated Hebbian weight for a skill.
	 * Callers can use this to break ties in routing decisions — prefer the skill
	 * with the higher weight when two candidates are otherwise equivalent.
	 */
	getHebbianWeight(skillId: string): number {
		return this.hebbianWeights.get(skillId) ?? 0;
	}

	/**
	 * Apply evaporation to all Hebbian weights (multiply each by `factor`).
	 * Call at session-end or on a fixed cycle to prevent runaway reinforcement.
	 *
	 * @param factor - Evaporation factor in `(0, 1)`. Defaults to `0.9`.
	 */
	hebbianDecay(factor = 0.9): void {
		for (const [skillId, weight] of this.hebbianWeights) {
			this.hebbianWeights.set(skillId, weight * factor);
		}
	}

	/**
	 * Return a snapshot of all non-zero Hebbian weights, sorted descending.
	 * Useful for observability / session persistence.
	 */
	hebbianSnapshot(): ReadonlyArray<{ skillId: string; weight: number }> {
		return [...this.hebbianWeights.entries()]
			.filter(([, w]) => w > 0)
			.sort(([, a], [, b]) => b - a)
			.map(([skillId, weight]) => ({ skillId, weight }));
	}
}
