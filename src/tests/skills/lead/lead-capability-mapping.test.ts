import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/lead/lead-capability-mapping.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("lead-capability-mapping", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits a capability map template, rating guide, worked example, and checklist", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"map current and target AI platform capabilities across people, platform, and process",
				context:
					"the organisation is at the beginning of its AI platform transformation",
				deliverable: "capability heat map",
				options: {
					mappingDepth: "portfolio" as const,
					targetHorizonMonths: 18,
					includeHeatmap: true,
				},
			},
			{
				detailIncludes: [
					"Map capabilities for",
					"Use an evidence-based heatmap",
					"Attach observable evidence to every capability rating",
				],
				recommendationCountAtLeast: 4,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"output-template",
			"comparison-matrix",
			"worked-example",
			"eval-criteria",
		]);
		expect(result.artifacts?.[0]).toMatchObject({
			title: "Capability Map (portfolio, 18mo)",
		});
		expect(result.artifacts?.[3]).toMatchObject({
			title: "Capability mapping checklist",
		});
	});
});
