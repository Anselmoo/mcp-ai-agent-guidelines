import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/adapt/adapt-quorum.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("adapt-quorum", () => {
	it("builds weighted quorum and retry fallback guidance", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"route through specialist agents using quorum policy and retry fallback load balancing convergence",
				context: "fleet dynamics and agent signals",
				options: {
					quorumPolicy: "weighted",
					fallbackBehaviour: "retry",
				},
			},
			{
				summaryIncludes: [
					"Quorum Coordinator produced",
					"weighted contributions",
					"fallback: retry",
				],
				detailIncludes: ["Quorum sensing advisory", "Define a fallback path"],
				recommendationCountAtLeast: 4,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("returns quorum schema and coordination artifacts", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"route through specialist agents using quorum policy and retry fallback load balancing convergence",
				context: "fleet dynamics and agent signals",
				options: {
					quorumPolicy: "weighted",
					fallbackBehaviour: "retry",
				},
			},
			{
				summaryIncludes: ["Quorum Coordinator produced", "fallback: retry"],
				detailIncludes: ["Quorum sensing advisory", "fallback path"],
			},
		);

		expect(result.artifacts).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					kind: "output-template",
					title: "Quorum signal schema",
				}),
				expect.objectContaining({
					kind: "comparison-matrix",
					title: "Quorum policy matrix",
				}),
				expect.objectContaining({
					kind: "tool-chain",
					title: "Quorum coordination flow",
				}),
			]),
		);
	});
});
