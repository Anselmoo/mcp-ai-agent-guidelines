/**
 * Feature extractor for the analogy-think clarify step.
 *
 * HEURISTIC_EXTRACTOR is a deterministic, keyword-based feature detector
 * that requires no LLM calls. It serves as the baseline fallback for
 * feature extraction and is guaranteed to complete synchronously.
 *
 * Companion spec: docs/superpowers/specs/2026-06-17-analogy-think-and-methodology-gate-design.md
 */

import type { ProblemFeature } from "./types.js";

export interface ClarifyResult {
	problemSummary: string;
	features: ProblemFeature[];
}

export type FeatureExtractor = (
	request: string,
	context?: string,
) => Promise<ClarifyResult>;

/**
 * Pattern table: feature → regex patterns
 * Each feature maps to 1–2 regex patterns (case-insensitive).
 * If any pattern matches, the feature is included in the result.
 */
const FEATURE_PATTERNS: Record<ProblemFeature, RegExp[]> = {
	"has-time-evolution": [
		/over\s+time|evolves?|interval|timestep|temporal|duration|period|cycle|when.*slow/i,
		/dynamics?|transient|response|trajectory|progresses?/i,
	],
	"has-feedback-loop": [
		/feedback|retry|control\s+loop|PID|closed-loop|regulation/i,
		/responds?\s+to|reacts?\s+to|adjusts?\s+based|overshoots?/i,
	],
	"has-noise": [
		/noise|random|uncertainty|stochastic|jitter|fluctuate|variability/i,
		/error|noise|perturbation|disturbance/i,
	],
	"has-conserved-quantity": [
		/conserved|conservation|invariant|constant|preserved|sum\s+remains|total\s+stays/i,
		/balance|equilibrium|symmetry|invariance/i,
	],
	"has-overshoot-or-oscillation": [
		/overshoot|oscillate|oscillation|ring|ringing|undershoot|cycle/i,
		/bounce|vibrate|vibration|swing|back-and-forth/i,
	],
	"has-discrete-state-only": [
		/FSM|state\s+machine|finite\s+state|discrete\s+state|state\s+transition/i,
		/states?\s+transition|switch\s+between|only\s+.*\s+states?/i,
	],
	"has-network-topology": [
		/network|topology|graph|node|edge|mesh|interconnect|link|connection/i,
		/distributed|peer-to-peer|P2P|hub-and-spoke|star\s+topology/i,
	],
	"has-threshold-or-phase-change": [
		/threshold|phase\s+change|transition|critical\s+point|tipping\s+point|bifurcation/i,
		/suddenly|abrupt|switches?|crossing|breaking\s+point/i,
	],
	"has-equilibrium-state": [
		/equilibrium|steady-state|steady\s+state|balance|stability|resting\s+state/i,
		/asymptotic|converges?|stabilizes?|reaches?\s+equilibrium/i,
	],
	"has-resource-flow": [
		/flow|queue|buffer|backpressure|rate|throughput|bandwidth|capacity/i,
		/stream|channel|pipeline|reservoir|drain|accumulate/i,
	],
	"has-multiple-coupled-parts": [
		/coupled|coupling|interaction|interconnect|depend\s+on\s+each\s+other|mutual/i,
		/multiple.*parts?|parts?.*interact|system.*components?|subsystems?/i,
	],
	"has-stochastic-component": [
		/stochastic|probabilistic|random|chance|likelihood|Monte\s+Carlo|Markov|Bayesian/i,
		/probabilistic|distribution|variance|sampling|randomness/i,
	],
};

/**
 * HEURISTIC_EXTRACTOR: Pure keyword-based feature detector.
 *
 * Process:
 * 1. Combine request and context (if provided) into a single text.
 * 2. Truncate to 240 chars (hard limit) for problemSummary.
 * 3. Scan each feature's pattern table; if any pattern matches, include the feature.
 * 4. Return result as Promise (even though logic is synchronous, to match async interface).
 *
 * @param request - The problem description or user input.
 * @param context - Optional additional context.
 * @returns Promise<ClarifyResult> with detected features and truncated problem summary.
 */
export const HEURISTIC_EXTRACTOR: FeatureExtractor = async (
	request: string,
	context?: string,
): Promise<ClarifyResult> => {
	const fullText = context ? `${request} ${context}` : request;
	const problemSummary = fullText.substring(0, 240);

	const features: ProblemFeature[] = [];

	for (const [feature, patterns] of Object.entries(FEATURE_PATTERNS)) {
		for (const pattern of patterns) {
			if (pattern.test(fullText)) {
				features.push(feature as ProblemFeature);
				break; // Feature matched; move to next feature
			}
		}
	}

	return {
		problemSummary,
		features,
	};
};
