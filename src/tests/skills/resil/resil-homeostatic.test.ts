import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/resil/resil-homeostatic.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

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
});
