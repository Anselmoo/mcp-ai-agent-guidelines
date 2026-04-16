import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/lead/lead-software-evangelist.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("lead-software-evangelist", () => {
	it("surfaces evangelist guidance for contracts, dependencies, and build discipline", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"define interface contracts before refactoring legacy dependencies and fix build regressions in parallel phases",
				context:
					"the migration still has dead code, package sprawl, and temporary workarounds",
				constraints: ["keep the build green"],
			},
			{
				summaryIncludes: [
					"Software Evangelist identified",
					"architectural guidance",
				],
				detailIncludes: [
					"Architecture first, implementation second",
					"Treat new dependencies as ecosystem citizens",
					"Zero-tolerance build gate",
					"Kill anti-patterns radically",
					"Apply evangelist constraints: keep the build green.",
				],
				recommendationCountAtLeast: 5,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"worked-example",
			"eval-criteria",
		]);
		expect(result.artifacts?.[0]).toMatchObject({
			title: "Migration strategy comparison",
		});
		expect(result.artifacts?.[1]).toMatchObject({
			title: "Contract-first migration playbook",
		});
	});

	it("falls back to the evangelist sequence when no rule-specific phrases match", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "help me set a technical direction for the platform",
			},
			{
				summaryIncludes: [
					"Software Evangelist identified 2 architectural guidances",
				],
				detailIncludes: [
					"identify duck-tape code, phantom features, and orphan dependencies",
					"INTERFACES → STUBS (compile) → REAL IMPL → TESTS → DOCS",
				],
				recommendationCountAtLeast: 2,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"worked-example",
			"eval-criteria",
		]);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
