import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gr/gr-gravitational-lensing-tracer.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("gr-gravitational-lensing-tracer", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits hotspot artifacts for load-bearing modules", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "Find the load-bearing bottleneck in this subsystem",
				options: {
					complexity: 32,
					afferentCoupling: 18,
					betweenness: 0.34,
				},
			},
			{ recommendationCountAtLeast: 3 },
		);

		expect(result.artifacts?.map((artifact) => artifact.title)).toEqual(
			expect.arrayContaining([
				"Gravitational lensing worked example",
				"Lensing hotspot matrix",
				"Lensing evidence chain",
			]),
		);
	});
});
