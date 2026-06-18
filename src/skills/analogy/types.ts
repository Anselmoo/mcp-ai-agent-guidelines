/**
 * Catalog types for the analogy-think workflow tool.
 *
 * Companion spec: docs/superpowers/specs/2026-06-17-analogy-think-and-methodology-gate-design.md
 *
 * Honest framing: a MetaphorEntry is a structured suggestion, not a theorem.
 * No QM/GR domains are accepted; the conceptual analysis in
 * docs/superpowers/plans/2026-06-17-track-c-conceptual-analysis.md explains why.
 */

export type PhysicsDomain =
	| "mechanics"
	| "oscillators"
	| "thermodynamics"
	| "stat-mech"
	| "fluids"
	| "em"
	| "general";

export type ProblemFeature =
	| "has-time-evolution"
	| "has-feedback-loop"
	| "has-noise"
	| "has-conserved-quantity"
	| "has-overshoot-or-oscillation"
	| "has-discrete-state-only"
	| "has-network-topology"
	| "has-threshold-or-phase-change"
	| "has-equilibrium-state"
	| "has-resource-flow"
	| "has-multiple-coupled-parts"
	| "has-stochastic-component";

export interface MetaphorEntry {
	id: string;
	name: string;
	domain: PhysicsDomain;
	requiredFeatures: ProblemFeature[];
	excludingFeatures: ProblemFeature[];
	semanticDescription: string;
	mapping: Array<{ physics: string; engineering: string }>;
	predictions?: string[];
	evidenceNeeded?: string[];
	translationBack: string;
	antiPatterns: string[];
	confidence: "high" | "medium" | "low";
}
