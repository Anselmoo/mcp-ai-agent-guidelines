/**
 * resil-helpers.ts
 *
 * Shared numeric utilities and domain-signal detectors for the resil skill
 * domain (resil-clone-mutate, resil-homeostatic, resil-membrane,
 * resil-redundant-voter, resil-replay).
 *
 * All exports are pure functions — no I/O, no model calls, deterministic.
 *
 * ADVISORY ONLY — outputs are supplementary engineering guidance.  They do not
 * implement, enforce, or execute any live runtime control mechanism.
 */

// ─── Advisory Disclaimer ────────────────────────────────────────────────────

/**
 * Standard advisory note surfaced whenever a resil handler's output describes
 * a control-loop, mutation, or voting mechanism in enough detail that it could
 * be mistaken for live enforcement.
 */
export const RESIL_ADVISORY_DISCLAIMER =
	"This analysis is advisory only — it provides design guidance and parameter " +
	"recommendations for resilience patterns; it does not execute live mutations, " +
	"enforce runtime policies, or modify production workflow configuration. " +
	"Validate every parameter against your specific infrastructure constraints and " +
	"operational risk tolerance before deployment.";

// ─── Numeric Helpers ─────────────────────────────────────────────────────────

/**
 * Format a number to 3 significant figures for advisory display.
 * Returns "∞" for non-finite values.
 */
export function fmtSig(n: number): string {
	if (!Number.isFinite(n)) return "∞";
	const p = Number(n.toPrecision(3));
	return p.toString();
}

/**
 * Format a number as a percentage string: 0.75 → "75.0%".
 */
export function fmtPct(ratio: number): string {
	return `${(ratio * 100).toFixed(1)}%`;
}

// ─── PID Control Helpers (resil-homeostatic) ─────────────────────────────────

/**
 * Compute proportional error: e = target − measured.
 * Positive e means measured is below target; negative means above.
 */
export function pidError(target: number, measured: number): number {
	return target - measured;
}

/**
 * Compute raw PID output:
 *   u = Kp×e + Ki×integralE + Kd×deltaE
 *
 * Does NOT apply actuator saturation — caller must clamp u to actuation limits.
 */
export function pidOutput(
	kp: number,
	ki: number,
	kd: number,
	e: number,
	integralE: number,
	deltaE: number,
): number {
	return kp * e + ki * integralE + kd * deltaE;
}

/**
 * Anti-windup integral clamp: prevents integral accumulation from saturating
 * past the specified bounds.
 *
 *   integralE_clamped = max(minVal, min(maxVal, integralE))
 */
export function clampIntegral(
	integralE: number,
	minVal: number,
	maxVal: number,
): number {
	return Math.min(maxVal, Math.max(minVal, integralE));
}

/**
 * Advisory label for a computed PID output magnitude relative to the actuator
 * range [0, 1].  Helps the host LLM describe response intensity.
 */
export function pidIntensityLabel(
	u: number,
): "aggressive" | "moderate" | "gentle" {
	const abs = Math.abs(u);
	if (abs > 0.5) return "aggressive";
	if (abs > 0.2) return "moderate";
	return "gentle";
}

// ─── Redundant-Voter Helpers (resil-redundant-voter) ─────────────────────────

/**
 * Minimum votes required for a strict majority with n replicas.
 *
 *   majority = floor(n / 2) + 1
 *
 * For n=3 → 2, n=5 → 3, n=7 → 4.
 */
export function majorityVoteCount(nReplicas: number): number {
	return Math.floor(nReplicas / 2) + 1;
}

/**
 * Byzantine fault tolerance limit for N-modular redundancy (BFT threshold):
 *   f = floor((n − 1) / 3)
 *
 * The system can tolerate at most f faulty replicas while maintaining consensus.
 * Requires n ≥ 3f + 1 replicas.  Returns 0 when n < 4.
 */
export function byzantineFaultLimit(nReplicas: number): number {
	return Math.max(0, Math.floor((nReplicas - 1) / 3));
}

/**
 * Advisory label for a similarity ratio between two replica outputs.
 * threshold default aligns with the skill manifest's recommended 0.85 semantic
 * similarity floor.
 */
export function similarityLabel(
	ratio: number,
	threshold = 0.85,
): "agreement" | "divergence" | "split" {
	if (ratio >= threshold) return "agreement";
	if (ratio >= threshold * 0.7) return "split";
	return "divergence";
}

// ─── Clone-Mutate Helpers (resil-clone-mutate) ───────────────────────────────

/**
 * Advisory label for a rolling quality ratio (quality_measured / quality_target).
 * Drives the mutation trigger recommendation.
 */
export function qualityRatioLabel(
	ratio: number,
): "degraded" | "borderline" | "healthy" {
	if (ratio < 0.7) return "degraded";
	if (ratio < 0.9) return "borderline";
	return "healthy";
}

/**
 * Recommended clone count given the consecutive-failure count.
 * Higher failure counts warrant more exploratory diversity.
 * Returns a value in [3, 12].
 */
export function recommendedCloneCount(consecutiveFailures: number): number {
	if (consecutiveFailures >= 10) return 12;
	if (consecutiveFailures >= 5) return 7;
	if (consecutiveFailures >= 3) return 5;
	return 3;
}

// ─── Replay Helpers (resil-replay) ───────────────────────────────────────────

/**
 * Advisory label for a replay buffer fill ratio (currentSize / bufferCapacity).
 * Used to recommend when consolidation is worth triggering.
 */
export function bufferFillLabel(
	fillRatio: number,
): "sparse" | "adequate" | "full" {
	if (fillRatio < 0.4) return "sparse";
	if (fillRatio < 0.85) return "adequate";
	return "full";
}

/**
 * Recommended success/failure mix ratio for replay consolidation.
 * Returns "success-heavy" when the buffer is success-biased, "balanced", or
 * "failure-heavy" (failure-heavy batches are the most informative for strategy
 * correction but degrade routing confidence if overused).
 */
export function replayMixLabel(
	successFraction: number,
): "success-heavy" | "balanced" | "failure-heavy" {
	if (successFraction > 0.7) return "success-heavy";
	if (successFraction >= 0.4) return "balanced";
	return "failure-heavy";
}

// ─── Domain Signal Detectors ─────────────────────────────────────────────────

/**
 * True when combined text references quality degradation / self-healing /
 * prompt mutation scenarios (resil-clone-mutate).
 */
export function hasCloneMutateSignal(combined: string): boolean {
	// Cluster A — explicit clonal-selection / immune vocabulary
	if (
		/\b(clone|mutate|mutation|clonal|immune.system|self.heal|auto.fix|auto.repair|evolv|tournament|fitness|promote|champion)/i.test(
			combined,
		)
	)
		return true;

	// Cluster B — quality degradation + automated recovery intent
	if (
		/\b(degrad|worsen|used.to.work|broke|regress|drift|quality.drop|declin)/i.test(
			combined,
		) &&
		/\b(fix|recover|restor|heal|adapt|automat|without.manual)/i.test(combined)
	)
		return true;

	// Cluster C — prompt-improvement loop vocabulary
	if (
		/\b(consecutive.fail|fail.threshold|quality.threshold|rolling.quality|prompt.version|prompt.evolv|candidate.prompt)/i.test(
			combined,
		)
	)
		return true;

	return false;
}

/**
 * True when combined text references PID control / homeostasis / setpoint
 * scenarios (resil-homeostatic).
 */
export function hasHomeostaticSignal(combined: string): boolean {
	// Cluster A — PID / control-loop vocabulary
	if (
		/\b(pid|proportional|integral|derivative|control.loop|feedback.control|setpoint|homeosta|windup|kp|ki|kd|actuator)/i.test(
			combined,
		)
	)
		return true;

	// Cluster B — metric stabilisation intent
	if (
		/\b(maintain|self.regulat|auto.scale|stay.within|below.threshold|above.threshold|target.level|slo|sla)/i.test(
			combined,
		) &&
		/\b(quality|latency|cost|budget|throughput|metric|drift)/i.test(combined)
	)
		return true;

	// Cluster C — error / correction / compensation vocabulary
	if (
		/\b(error.signal|correct|compensat|adjust|stabiliz|stabilise|regulate|dampen|overshot|undershot)/i.test(
			combined,
		)
	)
		return true;

	return false;
}

/**
 * True when combined text references membrane / compartment / clearance-zone
 * scenarios (resil-membrane).
 */
export function hasMembraneSignal(combined: string): boolean {
	// Cluster A — explicit membrane / P-systems vocabulary
	if (
		/\b(membrane|clearance|compartment|p.system|nested.zone|entry.rule|exit.rule|evolution.rule|membrane.computing)/i.test(
			combined,
		)
	)
		return true;

	// Cluster B — data-boundary / isolation intent
	if (
		/\b(isolat|boundary|segregat|separat|wall|barrier|data.cross|data.flow.control)/i.test(
			combined,
		) &&
		/\b(stage|agent|workflow|pipeline|zone|region|tenant|clearance)/i.test(
			combined,
		)
	)
		return true;

	// Cluster C — regulatory / compliance data-control vocabulary
	if (
		/\b(hipaa|gdpr|multi.tenant|multi.clearance|pii|phi|sensitive.data|mask|sanitiz|sanitise|redact|block.field|anonymiz)/i.test(
			combined,
		)
	)
		return true;

	return false;
}

/**
 * True when combined text references N-modular redundancy / voting / Byzantine
 * fault tolerance scenarios (resil-redundant-voter).
 */
export function hasRedundantVoterSignal(combined: string): boolean {
	// Cluster A — explicit redundancy / voting vocabulary
	if (
		/\b(redundan|voter|voting|vote|majority|byzantine|n.modular|iss.style|fault.toleran|replica|replicate|run.n.times)/i.test(
			combined,
		)
	)
		return true;

	// Cluster B — hallucination / inconsistency + structural fix intent
	if (
		/\b(hallucin|inconsist|sometimes.wrong|unreliable.output|wrong.answer|bad.output)/i.test(
			combined,
		) &&
		/\b(structural|reliab|fix|prevent|reduc|vote|parallel|multiple.run)/i.test(
			combined,
		)
	)
		return true;

	// Cluster C — similarity / consensus / tiebreak vocabulary
	if (
		/\b(similarity|semantic.match|pairwise|tiebreak|abstain|escalate|centroid|cluster|agreement|quorum)/i.test(
			combined,
		)
	)
		return true;

	return false;
}

/**
 * True when combined text references hippocampal replay / execution trace /
 * routing-strategy learning scenarios (resil-replay).
 */
export function hasReplaySignal(combined: string): boolean {
	// Cluster A — explicit replay / hippocampal vocabulary
	if (
		/\b(replay|hippocampal|execution.trace|trace.buffer|reflection.loop|routing.strategy|meta.learn|consolidat)/i.test(
			combined,
		)
	)
		return true;

	// Cluster B — learning-from-runs / workflow memory intent
	if (
		/\b(learn.from|workflow.memory|past.run|run.history|performance.log|improve.over.time|smarter.over.time)/i.test(
			combined,
		)
	)
		return true;

	// Cluster C — strategy injection / reflection agent vocabulary
	if (
		/\b(inject.strategy|system.prompt.update|strategy.update|fifo|evict|buffer.size|reflection.agent|quality.weighted)/i.test(
			combined,
		)
	)
		return true;

	return false;
}
