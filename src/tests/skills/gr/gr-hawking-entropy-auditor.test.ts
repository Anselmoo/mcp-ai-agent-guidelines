import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gr/gr-hawking-entropy-auditor.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("gr-hawking-entropy-auditor", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits a physics-to-engineering worksheet", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "audit module entropy for an overexposed public api surface",
				context: "the helper module has too many exports for its size",
				options: {
					publicExports: 12,
					internalLines: 600,
				},
			},
			{
				detailIncludes: [
					"Advisory computation",
					"Hawking entropy analogue",
					"API surface audit protocol",
				],
				recommendationCountAtLeast: 3,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"worked-example",
			"output-template",
		]);
	});
});
