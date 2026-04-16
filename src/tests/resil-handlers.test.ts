/**
 * resil-handlers.test.ts
 *
 * Focused tests for the resil domain handwritten capability handlers:
 *   - resil-clone-mutate     (clonal selection / immune-system prompt recovery)
 *   - resil-homeostatic      (PID control loop for metric stabilisation)
 *   - resil-membrane         (data-boundary enforcement via clearance levels)
 *   - resil-redundant-voter  (ISS-style N-modular redundancy voting)
 *   - resil-replay           (hippocampal replay for routing-strategy improvement)
 *
 * Verified contracts per handler:
 *   1. Capability mode — promoted handler returns executionMode === "capability".
 *   2. Signal-driven recommendations — domain keyword rules fire; details
 *      reference domain-specific terms, not manifest text echo.
 *   3a. Insufficient-signal guard (stage 1) — stop-word-only request with no
 *       context fires the generic "provide more detail" advisory.
 *   3b. Insufficient-signal guard (stage 2) — request with generic resilience
 *       keywords but no domain-distinctive signal fires a skill-specific guard.
 *   4. Numeric options — when numeric parameters are provided via options, the
 *      advisory computation line appears in recommendations.
 *   5. Summary non-leakage — raw request text is not reproduced verbatim in
 *      the result summary field.
 *   6. Advisory wording — outputs contain advisory framing (RESIL_ADVISORY_DISCLAIMER
 *      language) and do not claim live runtime execution or enforcement.
 *   7. Sibling boundary — each handler stays within its declared scope and does
 *      not bleed into sibling resil skills' domains.
 *   8. Helper purity — numeric helper functions produce correct values.
 */

import { describe, expect, it } from "vitest";
import { InstructionRegistry } from "../instructions/instruction-registry.js";
import { ModelRouter } from "../models/model-router.js";
import { skillModule as resilCloneMutateModule } from "../skills/resil/resil-clone-mutate.js";
import {
	bufferFillLabel,
	byzantineFaultLimit,
	clampIntegral,
	fmtPct,
	fmtSig,
	hasCloneMutateSignal,
	hasHomeostaticSignal,
	hasMembraneSignal,
	hasRedundantVoterSignal,
	hasReplaySignal,
	majorityVoteCount,
	pidError,
	pidIntensityLabel,
	pidOutput,
	qualityRatioLabel,
	recommendedCloneCount,
	replayMixLabel,
	similarityLabel,
} from "../skills/resil/resil-helpers.js";
import { skillModule as resilHomeostaticModule } from "../skills/resil/resil-homeostatic.js";
import { skillModule as resilMembraneModule } from "../skills/resil/resil-membrane.js";
import { skillModule as resilRedundantVoterModule } from "../skills/resil/resil-redundant-voter.js";
import { skillModule as resilReplayModule } from "../skills/resil/resil-replay.js";
import { SkillRegistry } from "../skills/skill-registry.js";
import { WorkflowEngine } from "../workflows/workflow-engine.js";

// ─── Runtime Factory ──────────────────────────────────────────────────────────

function createRuntime() {
	return {
		sessionId: "test-resil-handlers",
		executionState: {
			instructionStack: [],
			progressRecords: [],
		},
		sessionStore: {
			async readSessionHistory() {
				return [];
			},
			async writeSessionHistory() {
				return;
			},
			async appendSessionHistory() {
				return;
			},
		},
		instructionRegistry: new InstructionRegistry(),
		skillRegistry: new SkillRegistry({ workspace: null }),
		modelRouter: new ModelRouter(),
		workflowEngine: new WorkflowEngine(),
	};
}

// ─── Helper Unit Tests ────────────────────────────────────────────────────────

describe("resil-helpers — numeric utilities", () => {
	it("fmtSig formats finite numbers to 3 sig figs", () => {
		expect(fmtSig(0.123456)).toBe("0.123");
		expect(fmtSig(12.3456)).toBe("12.3");
		expect(fmtSig(1234.56)).toBe("1230");
	});

	it("fmtSig returns ∞ for non-finite values", () => {
		expect(fmtSig(Number.POSITIVE_INFINITY)).toBe("∞");
		expect(fmtSig(Number.NaN)).toBe("∞");
	});

	it("fmtPct formats ratio as percentage string", () => {
		expect(fmtPct(0.75)).toBe("75.0%");
		expect(fmtPct(1.0)).toBe("100.0%");
		expect(fmtPct(0.0)).toBe("0.0%");
	});
});

describe("resil-helpers — PID control", () => {
	it("pidError computes target - measured", () => {
		expect(pidError(0.9, 0.7)).toBeCloseTo(0.2, 10);
		expect(pidError(2.0, 2.5)).toBeCloseTo(-0.5, 10);
		expect(pidError(1.0, 1.0)).toBe(0);
	});

	it("pidOutput computes Kp×e + Ki×integralE + Kd×deltaE", () => {
		// Kp=0.5, Ki=0.1, Kd=0.05; e=0.2, integralE=0.4, deltaE=0
		expect(pidOutput(0.5, 0.1, 0.05, 0.2, 0.4, 0)).toBeCloseTo(
			0.5 * 0.2 + 0.1 * 0.4 + 0.05 * 0,
			10,
		);
	});

	it("clampIntegral respects min and max bounds", () => {
		expect(clampIntegral(5.0, -2.0, 2.0)).toBe(2.0);
		expect(clampIntegral(-5.0, -2.0, 2.0)).toBe(-2.0);
		expect(clampIntegral(1.0, -2.0, 2.0)).toBe(1.0);
	});

	it("pidIntensityLabel classifies output magnitude", () => {
		expect(pidIntensityLabel(0.8)).toBe("aggressive");
		expect(pidIntensityLabel(-0.7)).toBe("aggressive");
		expect(pidIntensityLabel(0.3)).toBe("moderate");
		expect(pidIntensityLabel(0.1)).toBe("gentle");
		expect(pidIntensityLabel(0)).toBe("gentle");
	});
});

describe("resil-helpers — redundant voter", () => {
	it("majorityVoteCount returns floor(n/2) + 1", () => {
		expect(majorityVoteCount(3)).toBe(2);
		expect(majorityVoteCount(5)).toBe(3);
		expect(majorityVoteCount(7)).toBe(4);
		expect(majorityVoteCount(9)).toBe(5);
	});

	it("byzantineFaultLimit returns floor((n-1)/3)", () => {
		expect(byzantineFaultLimit(3)).toBe(0); // (3-1)/3 = 0.66 → 0
		expect(byzantineFaultLimit(4)).toBe(1); // (4-1)/3 = 1.0 → 1
		expect(byzantineFaultLimit(7)).toBe(2); // (7-1)/3 = 2.0 → 2
		expect(byzantineFaultLimit(10)).toBe(3); // (10-1)/3 = 3.0 → 3
		expect(byzantineFaultLimit(2)).toBe(0); // below BFT minimum
	});

	it("similarityLabel classifies agreement correctly", () => {
		expect(similarityLabel(0.95)).toBe("agreement");
		expect(similarityLabel(0.85)).toBe("agreement"); // at threshold
		expect(similarityLabel(0.65)).toBe("split"); // 0.85 × 0.7 = 0.595 → split
		expect(similarityLabel(0.3)).toBe("divergence");
	});
});

describe("resil-helpers — clone-mutate", () => {
	it("qualityRatioLabel classifies correctly", () => {
		expect(qualityRatioLabel(0.5)).toBe("degraded");
		expect(qualityRatioLabel(0.69)).toBe("degraded");
		expect(qualityRatioLabel(0.7)).toBe("borderline"); // 0.7 is not < 0.7
		expect(qualityRatioLabel(0.85)).toBe("borderline");
		expect(qualityRatioLabel(0.9)).toBe("healthy"); // not < 0.9
		expect(qualityRatioLabel(1.0)).toBe("healthy");
	});

	it("recommendedCloneCount scales with consecutive failures", () => {
		expect(recommendedCloneCount(1)).toBe(3);
		expect(recommendedCloneCount(2)).toBe(3);
		expect(recommendedCloneCount(3)).toBe(5);
		expect(recommendedCloneCount(5)).toBe(7);
		expect(recommendedCloneCount(10)).toBe(12);
	});
});

describe("resil-helpers — replay", () => {
	it("bufferFillLabel classifies fill ratio", () => {
		expect(bufferFillLabel(0.2)).toBe("sparse");
		expect(bufferFillLabel(0.5)).toBe("adequate");
		expect(bufferFillLabel(0.9)).toBe("full");
	});

	it("replayMixLabel classifies success fraction", () => {
		expect(replayMixLabel(0.8)).toBe("success-heavy");
		expect(replayMixLabel(0.5)).toBe("balanced");
		expect(replayMixLabel(0.3)).toBe("failure-heavy");
	});
});

describe("resil-helpers — domain signal detectors", () => {
	it("hasCloneMutateSignal detects mutation vocabulary", () => {
		expect(hasCloneMutateSignal("clonal selection immune system")).toBe(true);
		expect(hasCloneMutateSignal("mutate prompts automatically")).toBe(true);
		expect(
			hasCloneMutateSignal("quality degraded fix recover without manual"),
		).toBe(true);
		expect(hasCloneMutateSignal("improve latency")).toBe(false);
	});

	it("hasHomeostaticSignal detects PID / control-loop vocabulary", () => {
		expect(hasHomeostaticSignal("PID controller for latency")).toBe(true);
		expect(hasHomeostaticSignal("maintain quality setpoint homeostasis")).toBe(
			true,
		);
		expect(hasHomeostaticSignal("maintain slo quality drift auto-scale")).toBe(
			true,
		);
		expect(hasHomeostaticSignal("add more agents")).toBe(false);
	});

	it("hasMembraneSignal detects boundary / clearance vocabulary", () => {
		expect(hasMembraneSignal("membrane clearance P-systems")).toBe(true);
		expect(hasMembraneSignal("data isolation between stages workflow")).toBe(
			true,
		);
		expect(hasMembraneSignal("HIPAA boundaries redact PII")).toBe(true);
		expect(hasMembraneSignal("improve response quality")).toBe(false);
	});

	it("hasRedundantVoterSignal detects voting / redundancy vocabulary", () => {
		expect(hasRedundantVoterSignal("Byzantine fault tolerance N-modular")).toBe(
			true,
		);
		expect(hasRedundantVoterSignal("run 5 replicas and vote")).toBe(true);
		expect(
			hasRedundantVoterSignal(
				"hallucinations inconsistent structural fix parallel",
			),
		).toBe(true);
		expect(hasRedundantVoterSignal("retry on failure")).toBe(false);
	});

	it("hasReplaySignal detects replay / trace vocabulary", () => {
		expect(hasReplaySignal("hippocampal replay execution trace buffer")).toBe(
			true,
		);
		expect(hasReplaySignal("learn from past runs workflow memory")).toBe(true);
		expect(hasReplaySignal("inject strategy system prompt update fifo")).toBe(
			true,
		);
		expect(hasReplaySignal("add logging")).toBe(false);
	});
});

// ─── resil-clone-mutate ───────────────────────────────────────────────────────

describe("resil-clone-mutate handler", () => {
	it("returns executionMode capability", async () => {
		const result = await resilCloneMutateModule.run(
			{
				request:
					"Our translation node used to score 0.90 but has dropped to 0.65 for three consecutive runs — how do we trigger automatic prompt mutation?",
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("resil-clone-mutate");
	});

	it("fires quality-degradation rules on relevant keywords", async () => {
		const result = await resilCloneMutateModule.run(
			{
				request:
					"Workflow node quality degraded below threshold after consecutive failures — auto-fix with clonal selection and tournament",
				context:
					"Node produces summaries. Quality_threshold=0.70, consecutive_failures=3. Mutation strategies: rephrase, concrete.",
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/rolling quality|quality.threshold|consecutive/i);
		expect(details).toMatch(/tournament|clone|mutate/i);
	});

	it("stage 1 guard — empty request fires insufficient signal", async () => {
		const result = await resilCloneMutateModule.run(
			{ request: "it the is a" },
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("stage 2 guard — vague simple request fires domain-specific guard", async () => {
		const result = await resilCloneMutateModule.run(
			{ request: "make it better" },
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("numeric options produce advisory computation line", async () => {
		const result = await resilCloneMutateModule.run(
			{
				request:
					"Configure clone-mutate with quality_threshold 0.75 and 3 consecutive failures",
				options: {
					qualityThreshold: 0.75,
					consecutiveFailures: 3,
					nClones: 7,
					promoteThreshold: 0.08,
				},
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/quality_threshold=0\.75/i);
		expect(details).toMatch(/promote_threshold|promote/i);
	});

	it("promote_threshold warning fires when value is too low", async () => {
		const result = await resilCloneMutateModule.run(
			{
				request: "clone and mutate prompts on quality degradation",
				options: {
					qualityThreshold: 0.7,
					consecutiveFailures: 3,
					promoteThreshold: 0.01,
				},
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/too low|noise|recommend/i);
	});

	it("advisory disclaimer is always present", async () => {
		const result = await resilCloneMutateModule.run(
			{
				request:
					"Use clonal selection to recover from prompt quality degradation automatically",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory only/i);
	});

	it("summary does not echo raw request verbatim", async () => {
		const request =
			"Our translation node used to score 0.90 but keeps dropping below threshold";
		const result = await resilCloneMutateModule.run(
			{ request },
			createRuntime(),
		);
		expect(result.summary).not.toContain(request);
	});

	it("does not bleed into homeostatic PID advice", async () => {
		const result = await resilCloneMutateModule.run(
			{
				request:
					"Clonal selection for self-healing prompt recovery after consecutive quality failures",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Should NOT mention PID control terms as primary content
		// (advisory disclaimer might mention "advisory" but not PID gains)
		expect(details).not.toMatch(/\bKp\b|\bKi\b|\bKd\b|proportional.gain/);
	});
});

// ─── resil-homeostatic ────────────────────────────────────────────────────────

describe("resil-homeostatic handler", () => {
	it("returns executionMode capability", async () => {
		const result = await resilHomeostaticModule.run(
			{
				request:
					"Set up a PID controller to keep our pipeline quality above 0.85 by auto-scaling agents",
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("resil-homeostatic");
	});

	it("fires PID rules on control-loop keywords", async () => {
		const result = await resilHomeostaticModule.run(
			{
				request:
					"Configure a feedback control loop with PID gains to maintain quality setpoint and prevent windup",
				context:
					"We have a quality metric on [0,1]. Target setpoint is 0.88. Actuator: agent_count.",
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/pid|proportional|setpoint/i);
		expect(details).toMatch(/windup|integral/i);
	});

	it("numeric options produce PID advisory computation", async () => {
		const result = await resilHomeostaticModule.run(
			{
				request: "PID controller for quality metric with setpoint 0.9",
				options: {
					targetSetpoint: 0.9,
					measuredValue: 0.7,
					kp: 0.5,
					ki: 0.1,
					kd: 0.05,
					windupGuard: 2.0,
					primaryActuator: "agent_count",
				},
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/setpoint=0\.9|measured=0\.7/i);
		expect(details).toMatch(/agent_count|actuator/i);
	});

	it("stage 1 guard — empty request fires insufficient signal", async () => {
		const result = await resilHomeostaticModule.run(
			{ request: "and the is" },
			createRuntime(),
		);
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("stage 2 guard — vague simple request fires skill-specific guard", async () => {
		const result = await resilHomeostaticModule.run(
			{ request: "improve things" },
			createRuntime(),
		);
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("advisory disclaimer is always present", async () => {
		const result = await resilHomeostaticModule.run(
			{
				request:
					"PID homeostatic controller to maintain latency setpoint and prevent windup",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory only/i);
	});

	it("summary does not echo raw request verbatim", async () => {
		const request =
			"PID controller to maintain quality above 0.85 by auto-scaling agents";
		const result = await resilHomeostaticModule.run(
			{ request },
			createRuntime(),
		);
		expect(result.summary).not.toContain(request);
	});

	it("does not bleed into clone-mutate territory", async () => {
		const result = await resilHomeostaticModule.run(
			{
				request:
					"PID feedback control homeostasis setpoint quality maintain auto-scale agents",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Should NOT mention mutation tournament or clonal selection
		expect(details).not.toMatch(/tournament|clonal.selection|somatic.mutation/);
	});
});

// ─── resil-membrane ───────────────────────────────────────────────────────────

describe("resil-membrane handler", () => {
	it("returns executionMode capability", async () => {
		const result = await resilMembraneModule.run(
			{
				request:
					"Design membrane boundaries to isolate PII between our data-ingestion and analytics pipeline stages",
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("resil-membrane");
	});

	it("fires data-boundary rules on clearance/membrane keywords", async () => {
		const result = await resilMembraneModule.run(
			{
				request:
					"Use membrane computing with clearance levels and ingress checks to compartmentalise agent data — enforce egress exit-rule boundaries between stages",
				context:
					"Healthcare workflow with PHI fields. Stages: ingestion, enrichment, analytics. Need entry-rule and exit-rule controls.",
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/clearance|membrane|boundary/i);
		expect(details).toMatch(/entry|exit|ingress|egress/i);
	});

	it("HIPAA regulatory note appears when regulatoryFramework is HIPAA", async () => {
		const result = await resilMembraneModule.run(
			{
				request:
					"Enforce HIPAA data boundaries with membrane clearance levels for our healthcare pipeline",
				options: {
					regulatoryFramework: "HIPAA",
					defaultAction: "block",
					auditRequired: true,
				},
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/hipaa|phi|safe.harbor/i);
	});

	it("clearanceLevels advisory fires when levels are provided", async () => {
		const result = await resilMembraneModule.run(
			{
				request:
					"Set up membrane data compartments with clearance hierarchy for our regulated workflow",
				options: {
					clearanceLevels: ["public", "internal", "confidential", "restricted"],
					defaultAction: "block",
				},
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/public.*internal.*confidential.*restricted/i);
	});

	it("allow default action warning fires", async () => {
		const result = await resilMembraneModule.run(
			{
				request:
					"Configure membrane computing with clearance zones between compartmentalised stages",
				options: {
					defaultAction: "allow",
				},
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/warning|unsafe default|production/i);
	});

	it("stage 1 guard — empty request fires insufficient signal", async () => {
		const result = await resilMembraneModule.run(
			{ request: "the or and" },
			createRuntime(),
		);
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("advisory disclaimer is always present", async () => {
		const result = await resilMembraneModule.run(
			{
				request:
					"Membrane clearance zones with entry exit rules and compartmentalised data isolation between stages",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory only/i);
	});

	it("summary does not echo raw request verbatim", async () => {
		const request =
			"Enforce HIPAA boundaries between pipeline stages with clearance levels";
		const result = await resilMembraneModule.run({ request }, createRuntime());
		expect(result.summary).not.toContain(request);
	});
});

// ─── resil-redundant-voter ────────────────────────────────────────────────────

describe("resil-redundant-voter handler", () => {
	it("returns executionMode capability", async () => {
		const result = await resilRedundantVoterModule.run(
			{
				request:
					"Use N-modular redundancy with Byzantine fault tolerance — run 5 replicas and vote on the output",
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("resil-redundant-voter");
	});

	it("fires voting rules on NMR keywords", async () => {
		const result = await resilRedundantVoterModule.run(
			{
				request:
					"Reduce hallucinations using majority voting with semantic similarity clustering and a tiebreak strategy",
				context:
					"LLM node produces inconsistent medical summaries. n=5 replicas, similarity_threshold=0.85.",
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/replica|parallel|temperature/i);
		expect(details).toMatch(/majority|vote|cluster/i);
	});

	it("numeric n_replicas produces NMR advisory computation", async () => {
		const result = await resilRedundantVoterModule.run(
			{
				request:
					"Configure Byzantine fault tolerant voting with 7 replicas and semantic similarity",
				options: {
					nReplicas: 7,
					similarityThreshold: 0.85,
					tiebreakStrategy: "escalate",
					comparisonMode: "semantic",
					temperatureJitter: 0.15,
				},
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/n_replicas=7/i);
		expect(details).toMatch(/majority requires 4|byzantine fault limit f=2/i);
	});

	it("even n_replicas warning fires", async () => {
		const result = await resilRedundantVoterModule.run(
			{
				request: "run 4 replicas and vote majority",
				options: {
					nReplicas: 4,
					similarityThreshold: 0.9,
				},
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/even.*replica|prefer odd/i);
	});

	it("tiebreak strategy guidance appears when specified", async () => {
		const result = await resilRedundantVoterModule.run(
			{
				request: "voting with abstain tiebreak when no consensus forms",
				options: {
					nReplicas: 5,
					tiebreakStrategy: "abstain",
				},
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/abstain|no.consensus|human.review/i);
	});

	it("stage 1 guard — empty request fires insufficient signal", async () => {
		const result = await resilRedundantVoterModule.run(
			{ request: "is a or" },
			createRuntime(),
		);
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("advisory disclaimer is always present", async () => {
		const result = await resilRedundantVoterModule.run(
			{
				request:
					"Byzantine fault tolerance redundant voter N-modular majority voting replicas",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory only/i);
	});

	it("summary does not echo raw request verbatim", async () => {
		const request =
			"Use ISS-style redundancy with voting to reduce hallucination rates";
		const result = await resilRedundantVoterModule.run(
			{ request },
			createRuntime(),
		);
		expect(result.summary).not.toContain(request);
	});

	it("does not bleed into homeostatic PID advice", async () => {
		const result = await resilRedundantVoterModule.run(
			{
				request:
					"N-modular redundancy voting replicas majority Byzantine fault tolerance semantic similarity",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).not.toMatch(/\bKp\b|\bKi\b|\bKd\b|proportional.integral/);
	});
});

// ─── resil-replay ─────────────────────────────────────────────────────────────

describe("resil-replay handler", () => {
	it("returns executionMode capability", async () => {
		const result = await resilReplayModule.run(
			{
				request:
					"Buffer execution traces and run a reflection agent to improve our orchestrator routing strategy over time",
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.skillId).toBe("resil-replay");
	});

	it("fires trace-buffer rules on replay keywords", async () => {
		const result = await resilReplayModule.run(
			{
				request:
					"Use hippocampal replay with quality-weighted eviction to consolidate execution traces and inject a routing strategy update",
				context:
					"Buffer of 30 traces. Reflection agent outputs routing_strategy_update as JSON. Injection mode: prepend.",
			},
			createRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/trace|buffer|evict/i);
		expect(details).toMatch(/reflect|consolidat|strategy/i);
	});

	it("buffer fill advisory fires when capacity and size provided", async () => {
		const result = await resilReplayModule.run(
			{
				request: "replay consolidation from execution trace buffer",
				options: {
					bufferCapacity: 50,
					bufferSize: 15,
					successFraction: 0.8,
					evictionPolicy: "recency-quality",
					consolidationTrigger: "quality-degradation",
					injectionMode: "replace",
				},
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		// sparse fill advisory
		expect(details).toMatch(/sparse|defer consolidation/i);
		// success-heavy mix advisory
		expect(details).toMatch(/success.heavy|failure.*underrepresented/i);
	});

	it("injection mode guidance fires when specified", async () => {
		const result = await resilReplayModule.run(
			{
				request:
					"hippocampal replay routing strategy update with replace injection mode",
				options: {
					injectionMode: "replace",
					bufferCapacity: 30,
				},
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/replace.*strategy|fully replaced/i);
	});

	it("stage 1 guard — empty request fires insufficient signal", async () => {
		const result = await resilReplayModule.run(
			{ request: "the and is" },
			createRuntime(),
		);
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("stage 2 guard — vague simple request fires skill-specific guard", async () => {
		const result = await resilReplayModule.run(
			{ request: "log things" },
			createRuntime(),
		);
		const titles = result.recommendations.map((r) => r.title).join(" ");
		expect(titles).toMatch(/provide.more.detail/i);
	});

	it("advisory disclaimer is always present", async () => {
		const result = await resilReplayModule.run(
			{
				request:
					"Hippocampal replay execution trace buffer reflection agent routing strategy injection",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		expect(details).toMatch(/advisory only/i);
	});

	it("summary does not echo raw request verbatim", async () => {
		const request =
			"Learn from past runs and consolidate traces to improve routing strategy";
		const result = await resilReplayModule.run({ request }, createRuntime());
		expect(result.summary).not.toContain(request);
	});

	it("does not bleed into clone-mutate mutation territory", async () => {
		const result = await resilReplayModule.run(
			{
				request:
					"Replay consolidation hippocampal buffer execution traces reflection strategy update inject",
			},
			createRuntime(),
		);
		const details = result.recommendations.map((r) => r.detail).join(" ");
		// Should NOT mention tournament or clonal selection
		expect(details).not.toMatch(/tournament|clonal.selection|consecutive.fail/);
	});
});
