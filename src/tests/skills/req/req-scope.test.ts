import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/req/req-scope.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("req-scope", () => {
	it("separates in-scope and out-of-scope work across phases", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"scope audit export for this release and leave analytics later",
				constraints: ["two engineers"],
				options: {
					includeOutOfScope: true,
					phaseCount: 3,
				},
			},
			{
				summaryIncludes: ["Scope Analysis identified", "constraints: provided"],
				detailIncludes: [
					"Document explicit out-of-scope items",
					"Structure delivery in 3 phases",
				],
				recommendationCountAtLeast: 4,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"output-template",
			"comparison-matrix",
			"eval-criteria",
			"worked-example",
		]);
		expect(result.artifacts?.[0]).toMatchObject({
			kind: "output-template",
			title: "Scope contract template",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("asks for more detail when the request has no keywords and no context", async () => {
		// Passes schema validation (non-empty string) but every token is a stop
		// word, so extractRequestSignals yields keywords.length === 0. With no
		// context either, this hits the insufficient-signal guard via a path
		// distinct from the schema-rejected empty string above.
		const result = await skillModule.run(
			{ request: "the and or but" },
			createMockSkillRuntime(),
		);
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
		expect(result.summary).toContain("Scope clarification needs more detail");
	});

	it("falls back to a generic focus label when context carries signal but no keywords", async () => {
		// hasContext keeps this past the insufficient-signal guard even though
		// keywords is empty, exercising the `|| "this work"` fallback text.
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "the and or but",
				context: "background info for the team",
			},
			{
				detailIncludes: [
					'Define the in-scope boundary: specifically what features, surfaces, or behaviours around "this work" are included in this iteration.',
				],
			},
		);
		expect(result.summary).toContain("Scope Analysis identified");
	});

	it("aligns scope with a stated deliverable", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "scope the reporting dashboard rollout",
				deliverable: "reporting dashboard v1 launch",
			},
			{
				summaryIncludes: ["deliverable: defined"],
				detailIncludes: [
					'Align scope with the stated deliverable: "reporting dashboard v1 launch"',
				],
			},
		);
		expect(result.summary).toContain("deliverable: defined");
	});

	// Note: buildScopePacket()'s `includeOutOfScope` false-branch and its
	// `keywords.join(", ") || "the requested capability"` fallback (lines
	// 44-51 and 37) are unreachable in practice: the only call site (the
	// worked-example artifact) always passes includeOutOfScope=true and a
	// fixed non-empty keyword array. No test can reach those branches without
	// changing the source, so they are intentionally left uncovered.
});
