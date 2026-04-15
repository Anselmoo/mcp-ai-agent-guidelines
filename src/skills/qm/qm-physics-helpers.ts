/**
 * qm-physics-helpers.ts
 *
 * Shared utilities for the qm-domain capability handlers.
 *
 * Policy constraints (project physics-skill gating):
 *   - QM skills are SUPPLEMENTARY LENSES — they apply quantum-mechanical
 *     analogies to code-quality reasoning as an additional perspective.
 *   - Outputs MUST remain advisory: they explain patterns, flag candidates,
 *     and recommend follow-up actions.  They do NOT perform live computation,
 *     execute graph algorithms, or claim to be exact physics simulations.
 *   - Every QM handler should surface the advisory disclaimer when the
 *     quantum metaphor is the primary framing of the output.
 *
 * All exports are pure functions — no I/O, no model calls, deterministic.
 */

// ---------------------------------------------------------------------------
// Advisory disclaimer
// ---------------------------------------------------------------------------

/**
 * Standard advisory note appended whenever a QM handler's output would
 * otherwise sound like a physics computation rather than an analogy.
 *
 * Must appear in at least one recommendation for every QM skill invocation.
 */
export const QM_ADVISORY_DISCLAIMER =
	"This analysis applies a quantum-mechanical metaphor as a supplementary lens. " +
	"The framework helps surface patterns and prompt structured thinking — it is not " +
	"a physics simulation or a replacement for conventional code-metrics analysis. " +
	"Use the recommendations as advisory input alongside your standard engineering judgement.";

export const QM_STATIC_EVIDENCE_NOTE =
	"Ground any numeric follow-up in existing snapshots, git history, overlap exports, or metric reports. " +
	"The runtime bridge is still in progress, so do not present live workspace recomputation as already available.";

// ---------------------------------------------------------------------------
// Domain signal detectors
// ---------------------------------------------------------------------------

/**
 * True when combined text references code coupling or dependency concerns.
 *
 * Note: uses prefix-style matching (no trailing \b) so "coupling", "dependencies",
 * and "fan-out" all match their respective patterns.
 */
export function hasCouplingSignal(combined: string): boolean {
	return /\b(coupl|depend|tight|tangled|afferent|efferent|fan.in|fan.out|import|circular)/i.test(
		combined,
	);
}

/**
 * True when combined text references cohesion or module responsibility concerns.
 *
 * Note: uses prefix-style matching (no trailing \b) so "cohesion", "responsibilities",
 * "god classes", and "mixed concerns" all match.
 */
export function hasCohesionSignal(combined: string): boolean {
	return /\b(cohes|responsib|single.purpose|srp|god.class|mixed.concern|separation)/i.test(
		combined,
	);
}

/**
 * True when combined text references candidate implementations or design options.
 *
 * Note: uses prefix-style matching (no trailing \b) so "candidates", "implementations",
 * and "alternatives" all match.
 */
export function hasCandidateSignal(combined: string): boolean {
	return /\b(candidate|option|approach|variant|impl|alternative|version|choice|rank|select|best|winner)/i.test(
		combined,
	);
}

/**
 * True when combined text references test reliability or flakiness.
 *
 * Note: uses prefix-style matching (no trailing \b) so "flaky", "intermittently",
 * and "race conditions" all match.
 */
export function hasTestFlakinesSignal(combined: string): boolean {
	return /\b(flak|unreliable|intermittent|timing|race.condition|order.dependent|resource.leak|non.deterministic|test.fail)/i.test(
		combined,
	);
}

/**
 * True when combined text references code review or implementation selection.
 *
 * Note: uses prefix-style matching (no trailing \b) so "selected", "reviewing",
 * "backaction", and "adjacent" all match.
 */
export function hasCodeReviewSignal(combined: string): boolean {
	return /\b(review|select|chosen|chose|pick|decision|commit|merge|adopt|backact|impact|adjacent|neighbour|neighboring)/i.test(
		combined,
	);
}

/**
 * True when combined text references refactoring scope, complexity, or migration effort.
 *
 * Note: uses prefix-style matching (no trailing \b) so "refactoring", "migration",
 * "restructuring", and "modularizing" all match.
 */
export function hasRefactoringSignal(combined: string): boolean {
	return /\b(refactor|migrat|rewrite|restructur|extract|decompose|modulariz|legacy|technical.debt|debt|effort|barrier|viab|attempt)/i.test(
		combined,
	);
}

// ---------------------------------------------------------------------------
// Label helpers
// ---------------------------------------------------------------------------

export const DECOHERENCE_CHANNEL_LABELS = {
	timing: "timing jitter (race conditions, sleep-based assertions)",
	resource: "resource leak (shared mutable state, connection pool exhaustion)",
	ordering: "ordering dependency (test execution order matters)",
	environment:
		"environment instability (CI configuration drift, OS differences)",
	external:
		"external dependency (network calls, third-party APIs, time-of-day)",
} as const;

export type DecoherenceChannel = keyof typeof DECOHERENCE_CHANNEL_LABELS;

export const REFACTORING_RISK_LABELS = {
	low: "low barrier (narrow scope, well-understood code, low coupling)",
	medium:
		"medium barrier (moderate scope, some coupling, partial test coverage)",
	high: "high barrier (broad scope, high coupling, low test coverage, unfamiliar code)",
} as const;

export type RefactoringRisk = keyof typeof REFACTORING_RISK_LABELS;

export const METRIC_PAIR_LABELS = {
	"coupling-cohesion":
		"coupling ↔ cohesion-deficit (Heisenberg conjugate pair)",
	"complexity-coverage":
		"complexity ↔ test-coverage (competing improvement targets)",
	"churn-stability":
		"churn-rate ↔ stability (high churn signals instability risk)",
} as const;

export type MetricPair = keyof typeof METRIC_PAIR_LABELS;

// ---------------------------------------------------------------------------
// Shared advisory rule builder
// ---------------------------------------------------------------------------

/**
 * Given a list of (regex, detail) rule entries and a combined request+context
 * string, returns the detail strings for all matching rules, deduped and
 * ordered by definition sequence.
 */
export function matchAdvisoryRules(
	rules: ReadonlyArray<{ pattern: RegExp; detail: string }>,
	combined: string,
): string[] {
	const seen = new Set<string>();
	const matched: string[] = [];
	for (const { pattern, detail } of rules) {
		if (pattern.test(combined) && !seen.has(detail)) {
			seen.add(detail);
			matched.push(detail);
		}
	}
	return matched;
}
