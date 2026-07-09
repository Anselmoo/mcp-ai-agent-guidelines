import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/lead/lead-exec-briefing.js";
import {
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("lead-exec-briefing", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits an executive briefing template, worked example, and rubric", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"brief the c-suite on the AI platform investment, business outcomes, and key risks",
				context:
					"the platform team is proposing a 3-phase roadmap over 18 months",
				options: {
					audience: "c-suite" as const,
					briefingLength: "decision-memo" as const,
					includeRisks: true,
				},
			},
			{
				detailIncludes: [
					"Structure the decision-memo for a c-suite audience",
					"Include a short risk slide or section",
					"End with a single explicit ask",
				],
				recommendationCountAtLeast: 4,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"output-template",
			"worked-example",
			"eval-criteria",
		]);
		expect(result.artifacts?.[0]).toMatchObject({
			title: "Executive Briefing (c-suite, decision-memo)",
		});
		expect(result.artifacts?.[2]).toMatchObject({
			title: "Executive briefing quality rubric",
		});
	});

	it("infers a board audience from board/director/committee language when no audience option is given", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"prepare a briefing for the board and the audit committee on platform risk",
				context: "the director asked for a decision-ready summary",
			},
			{
				detailIncludes: ["Structure the decision-memo for a board audience"],
			},
		);

		expect(result.artifacts?.[0]).toMatchObject({
			title: "Executive Briefing (board, decision-memo)",
		});
	});

	it("infers a vp-staff audience from vp/staff/leadership team language when no audience option is given", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"summarize the platform status for the vp and the leadership team staff meeting",
			},
			{
				detailIncludes: ["Structure the decision-memo for a vp-staff audience"],
			},
		);

		expect(result.artifacts?.[0]).toMatchObject({
			title: "Executive Briefing (vp-staff, decision-memo)",
		});
	});

	it("reports insufficient signal when the request has no usable keywords and no context", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{ request: "is a to" },
			{},
		);

		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
		expect(result.summary).toContain(
			"Executive Technical Briefing needs the decision topic",
		);
	});

	it("falls back to a generic keyword summary when the request has context but no extractable keywords", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "is a to",
				context: "the leadership team needs a decision by Friday",
			},
			{
				detailIncludes: ['around "the requested decision"'],
			},
		);

		expect(result.executionMode).toBe("capability");
	});

	it("omits the context-anchoring guidance and defaults the audience when no context is provided", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{ request: "review the platform investment roadmap" },
			{},
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain(
			"Anchor the briefing in the provided current state",
		);
		expect(result.artifacts?.[0]).toMatchObject({
			title: "Executive Briefing (c-suite, decision-memo)",
		});
	});

	it("omits the risk section when includeRisks is explicitly false", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "brief the c-suite on the AI platform investment",
				options: { includeRisks: false },
			},
			{},
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("Include a short risk slide or section");
	});
});
