/**
 * gr-physics-helpers.ts
 *
 * Lightweight numeric helpers for the GR (General Relativity) skill domain.
 *
 * These functions translate GR physics metaphors into concrete scalar scores
 * over software-engineering metrics (coupling, complexity, cohesion, exports).
 *
 * mathjs is used for:
 *   - Self-documenting formula strings in curvatureScore and tidalForce, where
 *     the expression itself serves as inline documentation of the analogue.
 *   - Consistent numeric evaluation that avoids floating-point operator-precedence
 *     surprises in compound expressions.
 *
 * ADVISORY ONLY — all outputs are supplementary engineering guidance.
 * They do not replace static analysis tools or profiling data.
 */

import { evaluate } from "mathjs";

export const GR_STATIC_EVIDENCE_NOTE =
	"Ground follow-up work in existing static-analysis exports, dependency graphs, git snapshots, or API reports. " +
	"The runtime bridge is still in progress, so avoid claiming live workspace recomputation is already available.";

/**
 * Safe wrapper around mathjs.evaluate — returns NaN on any error rather than
 * throwing, so GR-tier formulas never propagate exceptions to callers.
 * ADVISORY ONLY: all outputs are supplementary engineering guidance.
 */
function safeEval(expr: string, scope: Record<string, number>): number {
	try {
		return evaluate(expr, scope) as number;
	} catch {
		return Number.NaN;
	}
}

// ─── Schwarzschild / Event Horizon ──────────────────────────────────────────

/**
 * Schwarzschild radius analogue: r_s = 2 × coupling_mass
 *
 * coupling_mass = afferent_coupling + efferent_coupling (fan-in + fan-out).
 */
export function schwarzschildRadius(couplingMass: number): number {
	return 2 * couplingMass;
}

export type SchwarzschildZone =
	| "inside_horizon"
	| "near_horizon"
	| "orbital"
	| "free_space";

/**
 * Classifies a module's current coupling (r) relative to its Schwarzschild
 * radius (r_s).
 *
 * Zone boundaries:
 *   INSIDE_HORIZON  r ≤ r_s           — changes cascade freely
 *   NEAR_HORIZON    r_s < r ≤ 1.5×r_s — severe development time dilation
 *   ORBITAL         1.5×r_s < r ≤ 3×r_s — elevated risk, monitor
 *   FREE_SPACE      r > 3×r_s          — safe, predictable changes
 */
export function classifySchwarzschildZone(
	r: number,
	r_s: number,
): SchwarzschildZone {
	if (r <= r_s) return "inside_horizon";
	if (r <= 1.5 * r_s) return "near_horizon";
	if (r <= 3 * r_s) return "orbital";
	return "free_space";
}

/**
 * Gravitational time dilation factor at radius r near Schwarzschild radius r_s.
 *
 *   dilation = 1 / sqrt(max(0.001, 1 - r_s/r))
 *
 * Values > 1 indicate development slowdown proportional to coupling pressure.
 * Clamped to avoid division by zero at the horizon.
 */
export function timeDilationFactor(r: number, r_s: number): number {
	const safeR = Math.max(r, r_s + Number.EPSILON);
	const interior = Math.max(0.001, 1 - r_s / safeR);
	return 1 / Math.sqrt(interior);
}

// ─── Spacetime Debt Metric (Ricci Scalar analogue) ──────────────────────────

/**
 * Spacetime curvature score — Ricci scalar analogue.
 *
 *   K = coupling × complexity / (cohesion + ε)
 *
 * High K indicates densely packed technical debt (tight coupling, high
 * complexity, low cohesion).
 */
export function curvatureScore(
	coupling: number,
	complexity: number,
	cohesion: number,
): number {
	return safeEval("coupling * complexity / (cohesion + 1e-6)", {
		coupling,
		complexity,
		cohesion,
	});
}

export type CurvatureClass = "extreme" | "high" | "moderate" | "flat";

export function classifyCurvature(K: number): CurvatureClass {
	if (K > 10) return "extreme";
	if (K > 5) return "high";
	if (K > 2) return "moderate";
	return "flat";
}

// ─── Tidal Force Analyzer ────────────────────────────────────────────────────

/**
 * Tidal force analogue — differential coupling across function groups.
 *
 *   F_tidal ∝ (max_coupling - min_coupling) / (mean_cohesion³ + ε)
 *
 * High F_tidal means the module is being pulled apart by inconsistent coupling
 * across its function groups and is a strong split candidate.
 */
export function tidalForce(
	maxCoupling: number,
	minCoupling: number,
	meanCohesion: number,
): number {
	return safeEval("(maxC - minC) / (pow(cohesion, 3) + 1e-9)", {
		maxC: maxCoupling,
		minC: minCoupling,
		cohesion: meanCohesion,
	});
}

export type TidalClass = "split_required" | "high_tension" | "stable";

export function classifyTidal(F: number): TidalClass {
	if (F > 5) return "split_required";
	if (F > 2) return "high_tension";
	return "stable";
}

// ─── Hawking Entropy Auditor ─────────────────────────────────────────────────

/**
 * Bekenstein-Hawking entropy analogue.
 *
 *   S = public_exports / 4
 *
 * The public API surface is the module's "event horizon"; entropy measures
 * how much information is encoded on that surface relative to internal volume.
 */
export function hawkingEntropy(publicExports: number): number {
	return publicExports / 4;
}

/**
 * Entropy ratio — compares Hawking entropy to internal complexity density.
 *
 *   ratio = S / (internal_lines / 100 + 1)
 *
 * ratio > 2 → too many exports for the module's internal size (over-exposed).
 * ratio < 0.5 → suspiciously under-exposed (possible hidden coupling).
 */
export function entropyRatio(entropy: number, internalLines: number): number {
	return entropy / (internalLines / 100 + 1);
}

export type EntropyClass = "critical" | "elevated" | "healthy";

export function classifyEntropy(ratio: number): EntropyClass {
	if (ratio > 2) return "critical";
	if (ratio > 1) return "elevated";
	return "healthy";
}

// ─── Shared Utilities ────────────────────────────────────────────────────────

/**
 * Format a number to 3 significant figures for advisory display.
 * Avoids scientific notation for values in the engineering-metric range.
 */
export function fmtNum(n: number): string {
	if (!Number.isFinite(n)) return "∞";
	const p = Number(n.toPrecision(3));
	return p.toString();
}

/**
 * Extract up to `limit` leading numeric literals from a text string.
 * Used to detect when a user has embedded metric values in their request.
 */
export function extractNumbers(text: string, limit = 5): number[] {
	return (text.match(/\b\d+(?:\.\d+)?\b/g) ?? [])
		.map(Number)
		.filter((n) => Number.isFinite(n))
		.slice(0, limit);
}
