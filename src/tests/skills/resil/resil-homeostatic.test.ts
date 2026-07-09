import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/resil/resil-homeostatic.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

async function runHomeostatic(input: Parameters<typeof skillModule.run>[0]) {
	return skillModule.run(input, createMockSkillRuntime());
}

describe("resil-homeostatic", () => {
	it("computes pid-style actuator guidance", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"pid control latency and cost setpoint with batch size actuator",
				constraints: ["budget cap"],
				options: {
					targetSetpoint: 2,
					measuredValue: 3,
					kp: 1,
					ki: 0.5,
					kd: 0.1,
					windupGuard: 1,
					primaryActuator: "batch_size",
				},
			},
			{
				summaryIncludes: [
					"Homeostatic Controller produced",
					"PID configuration guideline",
				],
				detailIncludes: ["u≈-1.5", "batch_size actuator", "budget cap"],
				recommendationCountAtLeast: 4,
			},
		);
	});

	it("rejects invalid homeostatic options", async () => {
		// kp: -0.5 violates the `.positive()` constraint — must be surfaced, not silently swallowed
		const result = await skillModule.run(
			{
				request: "stabilise quality metric with pid setpoint control",
				options: { kp: -0.5 },
			} as never,
			createMockSkillRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Invalid input:");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("asks for more detail when the request has signal but is off-domain and simple", async () => {
		// "review this document" has keywords (passes stage 1) but no homeostatic
		// vocabulary and stays under the "simple" complexity threshold (<6
		// keywords) — must hit the Stage 2 domain-relevance rejection branch.
		const result = await runHomeostatic({
			request: "please review this document",
		});

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("targets PID-based metric stabilisation");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});

	it("surfaces actuator guidance alone when only primaryActuator is supplied", async () => {
		// No targetSetpoint/measuredValue pair, so the numeric PID branch is
		// skipped and the `else if (opts?.primaryActuator)` branch fires instead.
		await expectSkillGuidance(
			skillModule,
			{
				request: "pick a good actuator for this control loop",
				options: { primaryActuator: "model_tier" },
			},
			{
				summaryIncludes: ["Homeostatic Controller produced"],
				detailIncludes: ["Actuator guidance:", "model_tier actuator:"],
			},
		);
	});

	it("applies default PID gains and windup guard when omitted", async () => {
		// Only targetSetpoint/measuredValue are supplied — kp, ki, kd, windupGuard,
		// and primaryActuator are all omitted, forcing every `??` default
		// (0.5/0.1/0.05/2.0) and the falsy `actuatorNote` ternary branch.
		await expectSkillGuidance(
			skillModule,
			{
				request: "pid setpoint control for quality metric",
				options: { targetSetpoint: 0.9, measuredValue: 0.8 },
			},
			{
				summaryIncludes: ["Homeostatic Controller produced"],
				detailIncludes: ["Kp=0.5, Ki=0.1, Kd=0.05", "u≈0.06"],
			},
		);
	});

	it("uses singular 'guideline' wording when exactly one guidance is produced", async () => {
		// "correct" trips hasHomeostaticSignal's Cluster C so Stage 2 passes, but
		// it matches none of the HOMEOSTATIC_RULES patterns. With only
		// primaryActuator supplied, the only guidance is the actuator-guidance
		// unshift, giving guidances.length - 1 === 1 (singular "guideline").
		await expectSkillGuidance(
			skillModule,
			{
				request: "please correct this system behavior smoothly",
				options: { primaryActuator: "agent_count" },
			},
			{
				summaryIncludes: [
					"Homeostatic Controller produced 1 PID configuration guideline ",
				],
				detailIncludes: ["Actuator guidance:", "agent_count actuator:"],
			},
		);
	});

	it("falls back to generic configuration guidance when no rule pattern matches", async () => {
		// "regulate" satisfies hasHomeostaticSignal's Cluster C (error/correction
		// vocabulary) so Stage 2 passes, but it matches none of the
		// HOMEOSTATIC_RULES patterns and no options are supplied — this must hit
		// the `guidances.length === 0` fallback branch.
		await expectSkillGuidance(
			skillModule,
			{
				request: "please regulate my pipeline behavior smoothly over time",
			},
			{
				summaryIncludes: ["Homeostatic Controller produced"],
				detailIncludes: [
					"To configure a Homeostatic Controller:",
					"Start with P-only control",
				],
			},
		);
	});
});
