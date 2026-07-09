import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/resil/resil-clone-mutate.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("resil-clone-mutate", () => {
	it("derives mutation guidance from degradation parameters", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"recover after repeated failures by mutating prompt templates and tracking quality threshold",
				options: {
					qualityThreshold: 0.65,
					consecutiveFailures: 6,
					nClones: 4,
					promoteThreshold: 0.03,
					mutationTypes: ["template", "concrete"],
				},
			},
			{
				summaryIncludes: ["Clone-Mutate produced", "recovery-cycle guideline"],
				detailIncludes: [
					"n_clones=4 is below the recommended 7",
					"promote_threshold=0.03 is very low",
					"Enabled mutation strategies: template, concrete",
					"held-out tournament set",
					"Keep an audit trail for every cycle",
				],
				recommendationCountAtLeast: 6,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("rejects invalid clone-mutate options", async () => {
		const result = await skillModule.run(
			{
				request: "self-heal a degraded prompt",
				options: { qualityThreshold: 2 },
			} as never,
			createMockSkillRuntime(),
		);

		expect(result.summary).toContain("Invalid input:");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});

	it("asks for more detail when the request has no keywords and no context", async () => {
		// "this is it" is entirely stop words, so keywords.length === 0 and
		// hasContext is false — this exercises the absolute minimum signal
		// check (stage 1) rather than the empty-string path.
		const result = await skillModule.run(
			{ request: "this is it" } as never,
			createMockSkillRuntime(),
		);

		expect(result.summary.length).toBeGreaterThan(0);
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});

	it("asks for more detail when the request is simple and off-domain", async () => {
		// "help plan team lunch" has some keywords (so it clears stage 1) but
		// does not match any clone-mutate domain signal, and stays under the
		// 6-keyword "simple" complexity ceiling — this exercises the
		// domain-relevance check (stage 2).
		const result = await skillModule.run(
			{ request: "help plan team lunch" } as never,
			createMockSkillRuntime(),
		);

		expect(result.summary).toContain(
			"Clone-Mutate targets automated prompt-recovery via clonal selection.",
		);
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});

	it("appends a constraint-aware guideline when constraints are supplied", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"self-heal the degraded summarizer node by mutating its prompt template",
				constraints: [
					"No live workflow mutation without human approval",
					"Keep the audit log immutable",
					"Stay within the existing model budget",
					"Do not exceed 24h between cycles",
				],
			},
			{
				detailIncludes: [
					"Apply the mutation cycle under the following constraints:",
					"No live workflow mutation without human approval",
					"Keep the audit log immutable",
					"Stay within the existing model budget",
				],
			},
		);
	});
});
