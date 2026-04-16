import { describe, it } from "vitest";
import { skillModule } from "../../../skills/adapt/adapt-hebbian-router.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("adapt-hebbian-router", () => {
	it("configures all-to-all softmax collaboration routing", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"learn agent pair collaboration weights with softmax policy and all-to-all matrix",
				options: {
					routingPolicy: "softmax",
					weightScope: "all-to-all",
				},
			},
			{
				summaryIncludes: [
					"Hebbian Router produced",
					"softmax sampling",
					"all-to-all",
				],
				detailIncludes: [
					"Hebbian routing advisory",
					"full N×N weight matrix W",
					"W[A][B] += η × quality × co_activation",
					"W *= (1 − decay_rate)",
					"P(B|A) = exp(W[A][B] / T)",
				],
				recommendationCountAtLeast: 4,
			},
		);
	});

	it("uses explicit epsilon-greedy options even when the request stays generic", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "adaptively route agents",
				options: {
					routingPolicy: "epsilon-greedy",
					weightScope: "pairwise",
				},
			},
			{
				summaryIncludes: ["Hebbian Router produced", "ε-greedy"],
				detailIncludes: [
					"ordered agent-pair weight map W[A][B]",
					"ε-greedy routing selects argmax_B W[A][B]",
				],
				recommendationCountAtLeast: 4,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});
});
