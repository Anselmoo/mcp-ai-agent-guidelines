/**
 * resil-homeostatic.ts
 *
 * Handwritten capability handler for the resil-homeostatic skill.
 *
 * Control-theory metaphor: PID (Proportional-Integral-Derivative) control loop
 * applied to LLM-pipeline metrics.  For each metric with a target setpoint:
 *   e = target − measured
 *   u = Kp×e + Ki×(Σe×dt) + Kd×(Δe/dt)
 * The output u is mapped to an actuator (chain_depth, agent_count, model_tier,
 * batch_size).  Integral windup is clamped by a configurable windup_guard.
 *
 * Scope boundaries — do NOT surface guidance belonging to:
 *   resil-clone-mutate    — clonal selection / prompt mutation on failure
 *   resil-redundant-voter — N-modular redundancy / output voting
 *   resil-replay          — execution-trace replay and strategy injection
 *   adapt-annealing       — topology optimisation via simulated annealing
 *
 * Outputs are ADVISORY ONLY — this handler does NOT execute PID updates,
 * adjust agent counts, or modify live workflow configuration.
 */

import { z } from "zod";
import { resil_homeostatic_manifest as skillManifest } from "../../generated/manifests/skill-manifests.js";
import { createSkillModule } from "../create-skill-module.js";
import type { SkillHandler } from "../runtime/contracts.js";
import {
	buildInsufficientSignalResult,
	buildOutputTemplateArtifact,
	buildWorkedExampleArtifact,
	createCapabilityResult,
	createFocusRecommendations,
} from "../shared/handler-helpers.js";
import {
	baseSkillInputSchema,
	parseSkillInput,
} from "../shared/input-schema.js";
import { extractRequestSignals } from "../shared/recommendations.js";
import {
	clampIntegral,
	fmtSig,
	hasHomeostaticSignal,
	pidError,
	pidIntensityLabel,
	pidOutput,
	RESIL_ADVISORY_DISCLAIMER,
} from "./resil-helpers.js";

// ─── Input Schema ─────────────────────────────────────────────────────────────

const homeostaticInputSchema = baseSkillInputSchema.extend({
	options: z
		.object({
			targetSetpoint: z
				.number()
				.optional()
				.describe(
					"Target value for the primary metric (e.g., 0.90 for 90% quality, 2.0 for 2-second latency ceiling). Must use the same unit as measuredValue.",
				),
			measuredValue: z
				.number()
				.optional()
				.describe(
					"Most recent measured value of the primary metric, in the same unit as targetSetpoint.",
				),
			kp: z
				.number()
				.positive()
				.optional()
				.describe(
					"Proportional gain Kp. Start at 0.5 for most LLM pipeline actuators; increase to 1.0–2.0 if the system responds sluggishly.",
				),
			ki: z
				.number()
				.min(0)
				.optional()
				.describe(
					"Integral gain Ki. Start at 0.1. Higher values eliminate steady-state error faster but risk integral windup when actuators are saturated.",
				),
			kd: z
				.number()
				.min(0)
				.optional()
				.describe(
					"Derivative gain Kd. Start at 0.05. Higher values dampen oscillation; too-high values amplify measurement noise.",
				),
			windupGuard: z
				.number()
				.positive()
				.optional()
				.describe(
					"Maximum absolute value of the integral accumulator before clamping. Prevents integral windup when the actuator is saturated. Recommended: 2–5× the expected steady-state error range.",
				),
			primaryActuator: z
				.enum([
					"chain_depth",
					"agent_count",
					"model_tier",
					"batch_size",
					"sampling_temperature",
				])
				.optional()
				.describe(
					"The actuator the controller should adjust in response to u. chain_depth: increase/decrease reasoning depth. agent_count: scale parallel agents. model_tier: upgrade/downgrade model class. batch_size: throttle input load. sampling_temperature: adjust output diversity.",
				),
		})
		.optional(),
});

type PrimaryActuator =
	| "chain_depth"
	| "agent_count"
	| "model_tier"
	| "batch_size"
	| "sampling_temperature";

// ─── Actuator Advice Map ──────────────────────────────────────────────────────

const ACTUATOR_GUIDANCE: Record<PrimaryActuator, string> = {
	chain_depth:
		"chain_depth actuator: increase by 1 step when quality is below setpoint (positive u), decrease by 1 step when latency is above setpoint (negative u). Clamp to [1, max_depth]. Chain depth is a coarse actuator — changes have high latency before effect; use sampling_temperature for fine-grained quality tuning.",
	agent_count:
		"agent_count actuator: round u to the nearest integer and apply as a delta to the current agent pool size. Enforce hard bounds [min_agents, max_agents] dictated by your infrastructure. Be aware of cold-start delays: newly spawned agents do not contribute to throughput for 2–3 seconds after launch. Never reduce below 1.",
	model_tier:
		"model_tier actuator: map u > 0.3 → upgrade one tier (cheap→standard→premium), u < −0.3 → downgrade one tier. Tier transitions have cost implications — add a cost guard that prevents upgrading when the budget_remaining < upgrade_cost. Log every tier transition with the triggering u value and current metric state.",
	batch_size:
		"batch_size actuator: reduce by round(|u| × 0.2 × current_batch_size) when latency exceeds setpoint (negative u), increase symmetrically when latency is well below setpoint. Batch size affects upstream throughput — coordinate with the queue producer before applying reductions to avoid starvation.",
	sampling_temperature:
		"sampling_temperature actuator: reduce by u × 0.05 when quality is below setpoint, increase by |u| × 0.05 when diversity is too low. Keep temperature in [0.1, 1.0]; values outside this range cause unpredictable output quality. Temperature is the lowest-latency actuator — changes take effect on the next call.",
};

// ─── Per-Pattern Advisory Rules ───────────────────────────────────────────────

const HOMEOSTATIC_RULES: ReadonlyArray<{ pattern: RegExp; detail: string }> = [
	{
		pattern:
			/\b(setpoint|target|goal|desired.level|slo|sla|maintain.below|maintain.above|keep.at|stay.within)\b/i,
		detail:
			"Define setpoints as concrete scalar values with explicit units before designing any control loop. 'Quality setpoint = 0.85' means measured_quality ≥ 0.85 is in-band; 'latency setpoint = 2.0 s' means measured_latency ≤ 2.0 s is in-band. Mixed-unit control loops (quality + latency simultaneously) require multi-variable PID with separate Kp/Ki/Kd per metric and a priority scheme for conflicting actuator signals. Start with a single setpoint and a single actuator to validate loop stability before adding dimensions.",
	},
	{
		pattern:
			/\b(pid|proportional|integral|derivative|gain|kp|ki|kd|tune|tuning|ziegler|nichols)\b/i,
		detail:
			"Start PID gain tuning with Kp = 0.5, Ki = 0.1, Kd = 0.05 and observe steady-state error and oscillation over 10 control cycles. If steady-state error persists (system settles at a value other than the setpoint), increase Ki. If the system overshoots the setpoint, increase Kd. If response is sluggish (takes many cycles to approach setpoint), increase Kp. Avoid the Ziegler-Nichols step-response method directly on production workflows — simulate the step response on a staging environment first. For LLM pipeline actuators, P-only control (Ki=0, Kd=0) is often sufficient and more stable than full PID.",
	},
	{
		pattern:
			/\b(windup|integral.windup|integral.saturation|anti.windup|clamp|saturate|bound.integral)\b/i,
		detail:
			"Integral windup occurs when the actuator is saturated (at its min or max bound) while the error persists: the integral term accumulates without bound, causing a large overshoot when the actuator is finally released. Prevent windup with a clamp: integralE = max(−windupGuard, min(windupGuard, integralE)). Set windupGuard to 2–5× the expected steady-state error range. Alternatively, pause integral accumulation whenever the actuator output is saturated (conditional integration). Log the integralE value every cycle so windup can be detected retroactively from the control trace.",
	},
	{
		pattern:
			/\b(actuator|chain.depth|agent.count|model.tier|batch.size|temperature|sampling|responsi)\b/i,
		detail:
			"Choose the primary actuator based on which metric is being controlled. For quality setpoints: sampling_temperature (fast, fine-grained) or model_tier (slow, coarse, expensive). For latency setpoints: agent_count (medium latency, medium cost) or chain_depth (fast, cheap). For cost setpoints: batch_size (fast, predictable) or model_tier (slowest, highest impact). Avoid using the same actuator to control two conflicting metrics simultaneously — stabilise one metric first, then introduce a second control loop with a lower priority.",
	},
	{
		pattern:
			/\b(sample|cadence|period|interval|frequency|how.often|polling|tick|cycle|dt)\b/i,
		detail:
			"Set the control sampling cadence based on the actuator's response latency. For sampling_temperature: 1-second cadence is appropriate. For agent_count: 5–10-second cadence (cold-start delay). For model_tier: 30–60-second cadence (tier transitions should not oscillate rapidly). For batch_size: 2–5-second cadence. The Nyquist criterion applies: sample at least 2× faster than the rate of the fastest expected metric change. Use a fixed-interval timer rather than an event-driven trigger so the integral term accumulates consistently and Δe/dt is computed from a stable dt.",
	},
	{
		pattern:
			/\b(oscillat|overshoot|undershoot|instab|unstab|hunt|oscillat|bounc|ringing)\b/i,
		detail:
			"Control loop oscillation is the dominant failure mode for LLM pipeline PID controllers. Symptoms: metric alternates between above and below setpoint without settling. Root causes: (1) Kd too low — increase derivative gain to dampen overshoot; (2) Kp too high — reduce proportional gain; (3) sampling cadence shorter than actuator response latency — slow the polling interval. Add a deadband: do not actuate when |e| < deadband_threshold (e.g., 0.02 for a quality metric on [0,1]) — small errors within the measurement noise floor should not trigger actuator changes.",
	},
	{
		pattern:
			/\b(multi.metric|multi.variable|multiple.setpoint|quality.and.cost|latency.and.quality|cost.and.latency|balance)\b/i,
		detail:
			"Multi-variable homeostasis requires priority ordering. Recommended order: (1) safety/compliance constraints (always satisfied first), (2) quality setpoint (user-facing), (3) latency setpoint (SLA-bound), (4) cost setpoint (budget-bound). When actuator signals conflict — e.g., quality control wants to increase chain_depth while latency control wants to decrease it — the higher-priority setpoint wins. Implement as a weighted priority sum or a cascaded control loop (inner loop stabilises quality; outer loop trims for latency only within the quality band).",
	},
	{
		pattern:
			/\b(cost|budget|token|expensive|affordable|budget.cap|spend|constrain)\b/i,
		detail:
			"Add a hard cost guard alongside the PID loop: if budget_remaining < per_cycle_budget_floor, freeze all actuator changes and emit an alert rather than continuing to actuate. The PID loop should operate within a cost envelope, not outside it. Parameterise the budget floor as a fraction of the total daily budget (e.g., 0.05 × daily_budget_cap) so it scales with budget allocation changes without requiring a manual update.",
	},
];

// ─── Handler ──────────────────────────────────────────────────────────────────

const resilHomeostaticHandler: SkillHandler = {
	async execute(input, context) {
		const signals = extractRequestSignals(input);

		// Stage 1 — absolute minimum signal check
		if (signals.keywords.length === 0 && !signals.hasContext) {
			return buildInsufficientSignalResult(
				context,
				"Homeostatic Controller needs a metric, setpoint, or control-loop description before it can produce targeted PID configuration guidance.",
			);
		}

		const combined = `${signals.rawRequest} ${signals.contextText}`;

		// Stage 2 — domain relevance check
		if (!hasHomeostaticSignal(combined) && signals.complexity === "simple") {
			return buildInsufficientSignalResult(
				context,
				"Homeostatic Controller targets PID-based metric stabilisation for LLM pipelines. Describe which metric needs a setpoint, what actuator is available, and what sampling cadence is feasible to receive specific configuration guidance.",
				"Mention the metric (quality, latency, or cost), the desired setpoint, and the available actuator (e.g., agent_count, model_tier) so the Homeostatic Controller can produce targeted PID configuration advice.",
			);
		}

		// Match keyword rules
		const guidances: string[] = HOMEOSTATIC_RULES.filter(({ pattern }) =>
			pattern.test(combined),
		).map(({ detail }) => detail);

		// Lightweight numeric advisory when parameters are provided
		const parsed = parseSkillInput(homeostaticInputSchema, input);
		if (!parsed.ok) {
			return buildInsufficientSignalResult(
				context,
				`Invalid input: ${parsed.error}`,
				"Correct the option types and ranges before retrying. kp must be positive; ki and kd must be ≥ 0; windupGuard must be positive; targetSetpoint and measuredValue must be numbers.",
			);
		}
		const opts = parsed.data.options;

		if (
			opts?.targetSetpoint !== undefined &&
			opts.measuredValue !== undefined
		) {
			const e = pidError(opts.targetSetpoint, opts.measuredValue);
			const kp = opts.kp ?? 0.5;
			const ki = opts.ki ?? 0.1;
			const kd = opts.kd ?? 0.05;
			const windupGuard = opts.windupGuard ?? 2.0;
			// Approximate single-step with zero integral and delta for advisory display
			const integralE = clampIntegral(e, -windupGuard, windupGuard);
			const u = pidOutput(kp, ki, kd, e, integralE, 0);
			const intensity = pidIntensityLabel(u);

			const actuatorNote = opts.primaryActuator
				? ` ${ACTUATOR_GUIDANCE[opts.primaryActuator as PrimaryActuator]}`
				: "";

			guidances.unshift(
				`Advisory PID computation — setpoint=${fmtSig(opts.targetSetpoint)}, measured=${fmtSig(opts.measuredValue)}, e=${fmtSig(e)}, u≈${fmtSig(u)} (${intensity} response with Kp=${kp}, Ki=${ki}, Kd=${kd}).${actuatorNote} These are single-step estimates for design guidance — implement a proper time-series loop before deploying. Validate against your metric's observed noise floor before setting these gains in production.`,
			);
		} else if (opts?.primaryActuator) {
			const guidance =
				ACTUATOR_GUIDANCE[opts.primaryActuator as PrimaryActuator];
			if (guidance) guidances.unshift(`Actuator guidance: ${guidance}`);
		}

		// Fallback guidance when no rules matched
		if (guidances.length === 0) {
			guidances.push(
				"To configure a Homeostatic Controller: (1) choose a primary metric and define its setpoint; (2) select an actuator that can influence that metric; (3) set initial PID gains (Kp=0.5, Ki=0.1, Kd=0.05); (4) set a windupGuard and sampling cadence; (5) run in shadow mode and observe the control trace before enabling live actuation.",
				"Start with P-only control (Ki=0, Kd=0) and a single metric/actuator pair. Full PID with multiple metrics is harder to tune and oscillates more easily. Introduce integral gain only after observing persistent steady-state error over multiple cycles.",
			);
		}

		if (signals.hasConstraints) {
			guidances.push(
				`Apply homeostatic control under the following constraints: ${signals.constraintList.slice(0, 3).join("; ")}. Constraints should define actuator bounds and the cost guard that prevents unbounded actuator adjustments.`,
			);
		}

		guidances.push(RESIL_ADVISORY_DISCLAIMER);

		// --- Machine-readable artifacts ---
		const artifacts = [
			// Worked example: PID control step
			buildWorkedExampleArtifact(
				"PID Control Step Example",
				{
					setpoint: 0.9,
					measured: 0.8,
					Kp: 0.5,
					Ki: 0.1,
					Kd: 0.05,
					windupGuard: 2.0,
				},
				{
					error: (0.9 - 0.8).toFixed(2),
					integralE: Math.max(-2.0, Math.min(2.0, 0.1)),
					output: (0.5 * (0.9 - 0.8) + 0.1 * 0.1 + 0.05 * 0).toFixed(3),
					intensity: "moderate",
				},
				"Given setpoint=0.9, measured=0.8, Kp=0.5, Ki=0.1, Kd=0.05, windupGuard=2.0, computes error, integral, output, and intensity.",
			),
			// Output template: PID configuration
			buildOutputTemplateArtifact(
				"PID Controller Configuration Template",
				"setpoint: <target value>\nmeasured: <current value>\nKp: <proportional gain>\nKi: <integral gain>\nKd: <derivative gain>\nwindupGuard: <max integral>\nprimaryActuator: <actuator type>",
				[
					"setpoint",
					"measured",
					"Kp",
					"Ki",
					"Kd",
					"windupGuard",
					"primaryActuator",
				],
				"Template for configuring a PID controller for workflow homeostasis.",
			),
		];

		return createCapabilityResult(
			context,
			`Homeostatic Controller produced ${guidances.length - 1} PID configuration guideline${guidances.length - 1 === 1 ? "" : "s"} for setpoint-driven workflow stabilisation. Results are advisory — validate PID gains and actuator bounds against your infrastructure before deploying.`,
			createFocusRecommendations(
				"Homeostatic guidance",
				guidances,
				context.model.modelClass,
			),
			artifacts,
		);
	},
};

export const skillModule = createSkillModule(
	skillManifest,
	resilHomeostaticHandler,
);
