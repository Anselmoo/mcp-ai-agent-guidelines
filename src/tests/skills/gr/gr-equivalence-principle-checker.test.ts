import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/gr/gr-equivalence-principle-checker.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("gr-equivalence-principle-checker", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits an alignment worksheet and comparison matrix", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"check whether the module is locally coherent but globally alien",
				context: "the public interface feels out of step with repo conventions",
				options: {
					localConsistency: 1.2,
					globalConsistency: 0.5,
				},
			},
			{
				detailIncludes: [
					"Globally-alien modules (ratio > 1.5)",
					"Remediation: refactor the module's public interface to adopt global conventions",
				],
				recommendationCountAtLeast: 2,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"worked-example",
			"comparison-matrix",
			"output-template",
		]);
	});
});
