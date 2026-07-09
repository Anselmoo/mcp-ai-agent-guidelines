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

	it("infers greedy routing policy from request text without explicit options", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"route agents using greedy best-agent selection for hebbian collaboration weight learning",
			},
			{
				summaryIncludes: ["Hebbian Router produced", "greedy selection"],
				detailIncludes: [
					"Greedy routing reads row W[A] and deterministically selects",
				],
				recommendationCountAtLeast: 4,
			},
		);
	});

	it("infers broadcast weight scope from request text without explicit options", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"use broadcast weight matrix hebbian routing for agent collaboration",
			},
			{
				summaryIncludes: ["Hebbian Router produced", "broadcast"],
				detailIncludes: [
					"Broadcast scope is a compressed approximation of the full Hebbian pair matrix",
				],
				recommendationCountAtLeast: 4,
			},
		);
	});

	it("infers all-to-all weight scope from request text without explicit options", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"use a full N×N matrix hebbian routing for agent collaboration weight learning",
			},
			{
				summaryIncludes: ["Hebbian Router produced", "all-to-all"],
				detailIncludes: [
					"Use a full N×N weight matrix W where every ordered agent pair has its own learned affinity",
				],
				recommendationCountAtLeast: 4,
			},
		);
	});

	it("folds explicit constraints into the advisory output", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"hebbian synaptic weight matrix routing for agent collaboration",
				constraints: ["Must run within 100ms", "No external calls"],
			},
			{
				summaryIncludes: ["Hebbian Router produced"],
				detailIncludes: [
					"Apply Hebbian configuration within these constraints: Must run within 100ms; No external calls",
				],
				recommendationCountAtLeast: 4,
			},
		);
	});
});
