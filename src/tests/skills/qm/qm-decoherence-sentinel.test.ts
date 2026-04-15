import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/qm/qm-decoherence-sentinel.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("qm-decoherence-sentinel", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits channel triage artifacts and a static-evidence note", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "flaky async CI tests with timing and ordering failures",
				options: {
					primaryChannel: "timing",
					timingRate: 0.2,
					orderingRate: 0.1,
				},
			},
			{
				recommendationCountAtLeast: 4,
				detailIncludes: [
					"Illustrative T₂ computation",
					"The runtime bridge is still in progress",
				],
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.title)).toEqual(
			expect.arrayContaining([
				"Decoherence triage worked example",
				"Decoherence channel response matrix",
				"Coherence register template",
				"Decoherence evidence chain",
			]),
		);
	});
});
