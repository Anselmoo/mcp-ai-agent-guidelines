/**
 * Seed metaphor catalog for the analogy-think workflow tool.
 *
 * Twelve entries spanning broad physics. No QM/GR. The matcher gates on
 * structural features; the LLM ranker then orders the survivors. Each entry
 * carries a mapping (physics term ↔ engineering term), the predictions the
 * metaphor implies, the evidence a user must gather to validate, the
 * translation back to plain engineering language, and an anti-patterns
 * list naming where this metaphor must NOT be applied.
 *
 * Spec: docs/superpowers/specs/2026-06-17-analogy-think-and-methodology-gate-design.md
 */

import type { MetaphorEntry } from "./types.js";

export const METAPHOR_CATALOG: ReadonlyArray<MetaphorEntry> = [
	{
		id: "damped-oscillator",
		name: "Damped harmonic oscillator",
		domain: "oscillators",
		requiredFeatures: ["has-time-evolution", "has-feedback-loop"],
		excludingFeatures: ["has-discrete-state-only"],
		semanticDescription:
			"A system that returns to equilibrium after a disturbance, possibly overshooting, governed by a restoring force and a damping term. Applies to feedback loops that can oscillate or overshoot.",
		mapping: [
			{
				physics: "displacement x(t)",
				engineering: "current error / distance to target",
			},
			{ physics: "restoring force -kx", engineering: "correction strength" },
			{
				physics: "damping -c*xdot",
				engineering: "smoothing or rate-limit factor",
			},
			{
				physics: "damping ratio zeta",
				engineering: "ratio of correction to smoothing",
			},
		],
		predictions: [
			"zeta close to 1 (critical damping) gives the fastest stable response without overshoot.",
			"zeta below 1 produces oscillation; the loop rings.",
			"zeta above 1 is sluggish but stable.",
		],
		evidenceNeeded: [
			"time-to-recover after a known disturbance",
			"presence of overshoot",
			"oscillation period if any",
		],
		translationBack:
			"Identify the smoothing factor and the correction strength in your loop. If the loop rings, increase smoothing. If sluggish, reduce smoothing. Target a damping ratio near 1 for fastest stable response.",
		antiPatterns: [
			"Do not apply to one-shot decisions (no feedback).",
			"Do not apply when the response is highly nonlinear far from equilibrium.",
			"Do not use as license to tolerate oscillation as natural.",
		],
		confidence: "high",
	},
	{
		id: "diffusion",
		name: "Diffusion / random walk",
		domain: "stat-mech",
		requiredFeatures: ["has-time-evolution", "has-stochastic-component"],
		excludingFeatures: [],
		semanticDescription:
			"A quantity spreads through space (or a network) by accumulation of independent random steps. Variance grows linearly with time. Applies to information spread, cache fill, error propagation through a graph.",
		mapping: [
			{
				physics: "concentration c(x, t)",
				engineering: "amount of state present at a node at time t",
			},
			{
				physics: "diffusion coefficient D",
				engineering: "per-step spread rate",
			},
			{
				physics: "mean displacement zero, variance ~ 2Dt",
				engineering: "expected position bias zero; spread grows like sqrt(t)",
			},
		],
		predictions: [
			"Spread distance scales as sqrt(t); doubling time quadruples the area covered.",
			"In d dimensions, occupation density falls as 1 / t^(d/2).",
			"On a graph of degree k, time to reach a node at hop distance h scales like h^2 / (k * step_rate).",
		],
		evidenceNeeded: [
			"per-step latency or update rate",
			"network topology (degree, diameter)",
			"observed time to reach a target fraction of nodes",
		],
		translationBack:
			"Estimate the per-step rate and topology. Predict cache-fill time, consensus latency, or rumor-spread duration using the sqrt-of-time scaling — and update the prediction when observed timing diverges.",
		antiPatterns: [
			"Do not apply when transport has explicit directionality (those are flows, not diffusion).",
			"Do not apply when the medium is saturated (diffusion assumes free random steps).",
			"Do not apply when the underlying process is deterministic and bounded.",
		],
		confidence: "high",
	},
	{
		id: "conservation-flow",
		name: "Conservation of a flowing quantity",
		domain: "general",
		requiredFeatures: ["has-resource-flow"],
		excludingFeatures: [],
		semanticDescription:
			"A quantity that enters a bounded region must either leave, accumulate inside, or be consumed by a known sink. Applies whenever a closed accounting can be drawn around a subsystem — throughput, budget, attention, memory.",
		mapping: [
			{
				physics: "mass flux J in/out",
				engineering: "input rate, output rate of the quantity",
			},
			{
				physics: "accumulation dM/dt",
				engineering: "queue growth, buffer occupancy",
			},
			{
				physics: "sink term",
				engineering: "explicit consumption, eviction, expiry",
			},
		],
		predictions: [
			"Steady state requires input rate = output rate + sink rate; any imbalance shows up as accumulation.",
			"If the system is stable, observed accumulation predicts the imbalance magnitude.",
			"A 'leak' is a sink the accounting forgot; if numbers do not close, look for an unnamed sink.",
		],
		evidenceNeeded: [
			"measured input rate and output rate at the boundary",
			"all named sinks with their rates",
			"observed accumulation over a known interval",
		],
		translationBack:
			"Draw the boundary. List every channel crossing it. Sum the rates. If books do not balance, you have either an unmeasured channel or an undisclosed sink — and that gap is the bug.",
		antiPatterns: [
			"Do not use when the system has no well-defined boundary.",
			"Do not use when the quantity is not conserved (e.g. attention, which can be both created and destroyed by events).",
			"Do not conflate flux with stock (rate vs amount) in the report.",
		],
		confidence: "high",
	},
	{
		id: "phase-transition",
		name: "Phase transition",
		domain: "stat-mech",
		requiredFeatures: ["has-threshold-or-phase-change"],
		excludingFeatures: [],
		semanticDescription:
			"A small change in a control parameter near a critical point produces a sudden qualitative change in system behavior. Applies to capacity cliffs, viral thresholds, model-collapse points.",
		mapping: [
			{
				physics: "control parameter (temperature, pressure)",
				engineering: "the knob that triggers the cliff (load, fan-out, churn)",
			},
			{
				physics: "order parameter (magnetisation)",
				engineering: "the measurable that changes qualitatively past the cliff",
			},
			{
				physics: "critical exponent",
				engineering: "how steep the cliff is — slope of the qualitative change",
			},
		],
		translationBack:
			"Find the knob and the measurable. Sweep the knob and plot. If the curve has a knee, you are near a transition; design retreats from the cliff, not policies that linger on it.",
		antiPatterns: [
			"Do not apply to smooth-everywhere systems.",
			"Do not treat a single observed cliff as proof of universality; many shape-similar transitions arise from very different mechanisms.",
		],
		confidence: "medium",
	},
	{
		id: "steady-state-equilibrium",
		name: "Steady-state equilibrium",
		domain: "general",
		requiredFeatures: ["has-time-evolution", "has-equilibrium-state"],
		excludingFeatures: [],
		semanticDescription:
			"A system whose state stops changing on average because inputs balance outputs. The steady-state condition is an equation, not a process; it tells you the long-run shape without simulating the dynamics.",
		mapping: [
			{
				physics: "dX/dt = 0 condition",
				engineering: "balance equation between rates",
			},
			{
				physics: "stable vs unstable equilibrium",
				engineering: "whether small perturbations decay or grow",
			},
		],
		translationBack:
			"Write the rate balance. Solve for the unknown that the steady-state requires. Then check whether small deviations decay (stable) or amplify (unstable) — only stable steady states are useful design targets.",
		antiPatterns: [
			"Do not assume an equilibrium exists; some systems do not relax.",
			"Do not confuse steady state with optimum; equilibrium is the long-run shape, not the best shape.",
		],
		confidence: "medium",
	},
	{
		id: "resonance",
		name: "Resonance",
		domain: "oscillators",
		requiredFeatures: ["has-feedback-loop", "has-overshoot-or-oscillation"],
		excludingFeatures: [],
		semanticDescription:
			"A small periodic driving input produces a disproportionately large response when its frequency matches a characteristic frequency of the system. Applies to amplification by repeated weak triggers — DDoS, retries on a shared queue, viral propagation in feed loops.",
		mapping: [
			{
				physics: "driving frequency omega",
				engineering: "rate of an external periodic trigger",
			},
			{
				physics: "natural frequency omega_0",
				engineering: "system's own characteristic response rate",
			},
			{
				physics: "Q factor (sharpness)",
				engineering:
					"how narrowly the system amplifies and how slowly it decays",
			},
		],
		translationBack:
			"Identify the system's natural rate. If an external trigger lands at that rate, response grows out of proportion. Mitigate by adding damping, jittering the trigger, or shifting the natural rate.",
		antiPatterns: [
			"Do not apply when input is aperiodic and uncorrelated with the system's rate.",
			"Do not treat any large response as resonance; many amplifications are simply nonlinearity.",
		],
		confidence: "medium",
	},
	{
		id: "dimensionless-ratio",
		name: "Dimensionless ratio (Reynolds-like)",
		domain: "fluids",
		requiredFeatures: ["has-multiple-coupled-parts"],
		excludingFeatures: [],
		semanticDescription:
			"When two competing effects determine system behavior, their dimensionless ratio predicts which regime dominates. In fluids, Reynolds number compares inertia to viscosity; the same shape applies wherever two rates or forces compete.",
		mapping: [
			{
				physics: "Re = (inertial term) / (viscous term)",
				engineering:
					"ratio of (rate A) / (rate B) for the two competing effects",
			},
			{
				physics: "transition Re ~ critical value",
				engineering: "ratio where regime changes",
			},
		],
		translationBack:
			"Name the two competing rates. Compute their ratio in the same units. Find the critical value empirically. The ratio is a coordinate; behavior depends on which side of the critical value you are on, not on the individual rates.",
		antiPatterns: [
			"Do not invent a ratio without grounding it in two real measurable rates.",
			"Do not assume the critical value generalises across very different systems.",
		],
		confidence: "medium",
	},
	{
		id: "brownian-noise",
		name: "Brownian noise (bounded stochastic signal)",
		domain: "stat-mech",
		requiredFeatures: ["has-stochastic-component", "has-noise"],
		excludingFeatures: [],
		semanticDescription:
			"A signal composed of small independent random kicks. The mean is zero (or constant), the variance grows linearly in time, and large excursions are rare but expected.",
		mapping: [
			{
				physics: "Brownian motion B(t)",
				engineering: "cumulative noisy signal (e.g. measurement drift)",
			},
			{
				physics: "variance ~ sigma^2 t",
				engineering: "spread of measurement after time t",
			},
		],
		translationBack:
			"Estimate the per-step variance. Predict expected spread after N samples. If observed spread is far from predicted, the kicks are not independent — investigate correlation, drift, or bias.",
		antiPatterns: [
			"Do not apply to signals with obvious trend or seasonality.",
			"Do not assume independence without checking autocorrelation.",
		],
		confidence: "medium",
	},
	{
		id: "hysteresis",
		name: "Hysteresis (path-dependent state)",
		domain: "em",
		requiredFeatures: ["has-threshold-or-phase-change", "has-time-evolution"],
		excludingFeatures: [],
		semanticDescription:
			"The system's current state depends on its history, not just on present input. Two different paths to the same input produce two different states. Applies to user preferences, cached decisions, mode-switching configurations.",
		mapping: [
			{
				physics: "magnetic remanence",
				engineering: "state retained from past inputs",
			},
			{
				physics: "coercivity",
				engineering: "input magnitude required to flip the state",
			},
		],
		translationBack:
			"Identify the state that lags behind the input. Find the threshold required to flip it. Design assuming the state does NOT smoothly track the input — it sticks.",
		antiPatterns: [
			"Do not apply to memoryless systems.",
			"Do not confuse hysteresis with simple delay; hysteresis is path-dependent, delay is time-shifted but path-independent.",
		],
		confidence: "medium",
	},
	{
		id: "wave-propagation",
		name: "Wave propagation through coupled media",
		domain: "mechanics",
		requiredFeatures: ["has-time-evolution", "has-network-topology"],
		excludingFeatures: [],
		semanticDescription:
			"A disturbance at one node spreads through coupled neighbours at a finite speed, carrying information without bulk transport of the medium. Applies to gossip, viral content, distributed-cache invalidation.",
		mapping: [
			{
				physics: "wave speed v",
				engineering: "propagation rate across the topology",
			},
			{
				physics: "wavelength",
				engineering: "characteristic scale over which the signal varies",
			},
			{
				physics: "dispersion",
				engineering:
					"different frequencies propagate at different speeds (bandwidth-dependent latency)",
			},
		],
		translationBack:
			"Estimate the propagation speed on the topology. Predict arrival time at distance d as d / v. If dispersion matters, expect signal shape to change in flight.",
		antiPatterns: [
			"Do not apply when transport is by broadcast rather than nearest-neighbour coupling.",
			"Do not confuse wave propagation with diffusion (linear vs sqrt scaling).",
		],
		confidence: "medium",
	},
	{
		id: "rc-time-constant",
		name: "RC charging (exponential approach to a setpoint)",
		domain: "em",
		requiredFeatures: ["has-time-evolution", "has-feedback-loop"],
		excludingFeatures: ["has-discrete-state-only"],
		semanticDescription:
			"A quantity approaches a target value exponentially with time constant tau = R*C. After one tau, the gap shrinks to 1/e; after 5 tau, the gap is under 1%. Applies to any first-order linear settling: cache warm-up, autoscaler ramp, queue drain.",
		mapping: [
			{
				physics: "RC time constant tau",
				engineering: "characteristic settling time of the loop",
			},
			{
				physics: "voltage V(t) = V_target * (1 - exp(-t/tau))",
				engineering: "fraction of the target reached after time t",
			},
		],
		translationBack:
			"Measure or estimate tau. Predict that after 3 tau the system is 95% to its target. If observed approach is slower, either tau was wrong or the dynamics are not first-order linear.",
		antiPatterns: [
			"Do not apply when the system overshoots (that needs the damped oscillator, not RC).",
			"Do not apply when settling is multi-stage (multiple time constants).",
		],
		confidence: "medium",
	},
	{
		id: "markov-equilibrium",
		name: "Markov stationary distribution",
		domain: "general",
		requiredFeatures: [
			"has-stochastic-component",
			"has-equilibrium-state",
			"has-discrete-state-only",
		],
		excludingFeatures: [],
		semanticDescription:
			"A discrete-state stochastic system with time-homogeneous transition probabilities reaches a stationary distribution that the transition matrix predicts directly. Applies to user-session state machines, retry queues, page lifecycles.",
		mapping: [
			{
				physics: "transition matrix P",
				engineering: "table of per-step state-change probabilities",
			},
			{
				physics: "stationary distribution pi (pi*P = pi)",
				engineering: "long-run fraction of time in each state",
			},
		],
		translationBack:
			"Estimate the per-step transition probabilities. Compute the stationary distribution. Compare against observed long-run state proportions — divergence indicates non-stationarity or hidden state.",
		antiPatterns: [
			"Do not apply when transitions depend on history beyond current state (non-Markov).",
			"Do not apply when transition probabilities drift over time.",
		],
		confidence: "medium",
	},
];

export function validateEntry(
	e: MetaphorEntry,
): { ok: true } | { ok: false; reason: string } {
	if (!e.id) return { ok: false, reason: "empty id" };
	if (!e.name) return { ok: false, reason: "empty name" };
	if (!e.semanticDescription)
		return { ok: false, reason: "empty semanticDescription" };
	if (e.mapping.length === 0) return { ok: false, reason: "empty mapping" };
	if (e.antiPatterns.length === 0)
		return { ok: false, reason: "empty antiPatterns" };
	if (!e.translationBack) return { ok: false, reason: "empty translationBack" };
	if (e.confidence === "high") {
		if (!e.predictions?.length)
			return {
				ok: false,
				reason: "high-confidence entry needs predictions",
			};
		if (!e.evidenceNeeded?.length)
			return {
				ok: false,
				reason: "high-confidence entry needs evidenceNeeded",
			};
	}
	return { ok: true };
}
