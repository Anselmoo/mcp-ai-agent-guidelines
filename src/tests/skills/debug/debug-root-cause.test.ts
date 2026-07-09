import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/debug/debug-root-cause.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("debug-root-cause", () => {
	it("switches to fishbone for multi-signal failures", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"timeouts started after dependency upgrade with stale cache config",
				options: {
					technique: "auto",
					maxDepth: 6,
				},
			},
			{
				summaryIncludes: ["Root Cause Analysis using fishbone", "depth: 6"],
				detailIncludes: [
					"state/concurrency, dependency/version, configuration/env",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("asks for more detail when the request is non-empty but has no keywords and no context", async () => {
		// "is it" tokenizes to zero keywords (both words are stop words / too
		// short), and no context is supplied, so the insufficient-signal gate
		// trips even though the request string itself passes zod's min(1) check
		// (unlike the plain-empty-string case covered above, which is rejected
		// by zod before this branch is ever reached).
		const result = await skillModule.run(
			{ request: "is it" },
			createMockSkillRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
			modelClass: skillModule.manifest.preferredModelClass,
		});
	});

	it("proceeds with guidance when the request has no keywords but context is provided", async () => {
		// "is it" tokenizes to zero keywords (both words are length <= 2), so the
		// insufficient-signal gate only stays open because hasContext is true.
		await expectSkillGuidance(
			skillModule,
			{
				request: "is it",
				context: "the deploy job hung after the last config change",
			},
			{
				summaryIncludes: ["Root Cause Analysis using"],
				recommendationCountAtLeast: 1,
			},
		);
	});

	it("detects the data/schema causal signal", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"the response payload has a null field and the schema is wrong",
			},
			{
				detailIncludes: ["data/schema"],
				recommendationCountAtLeast: 1,
			},
		);
	});

	it("falls back to the generic bone list when fishbone is forced with no detected causal signals", async () => {
		// Forcing technique to fishbone bypasses the auto-selection heuristic, so
		// a request with no matching causal signal words exercises the `|| "code,
		// environment, process, people"` fallback in the fishbone detail text.
		await expectSkillGuidance(
			skillModule,
			{
				request: "customers are unhappy with the onboarding experience",
				options: {
					technique: "fishbone",
				},
			},
			{
				summaryIncludes: ["Root Cause Analysis using fishbone"],
				detailIncludes: [
					"Use a fishbone (Ishikawa) diagram across these detected causal categories: code, environment, process, people.",
				],
				recommendationCountAtLeast: 1,
			},
		);
	});

	it("builds a fault-tree analysis when technique is explicitly fault-tree", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "the deployment crashes intermittently",
				options: {
					technique: "fault-tree",
				},
			},
			{
				summaryIncludes: ["Root Cause Analysis using fault-tree"],
				detailIncludes: [
					"Build a fault tree from the top event downward. Use AND gates for conditions that must all be true, OR gates for alternatives. Identify minimum cut sets — those are the root causes.",
				],
				recommendationCountAtLeast: 1,
			},
		);
	});
});
