import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/lead/lead-l9-engineer.js";
import {
	createMockSkillRuntime,
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("lead-l9-engineer", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits a worked example and rubric for senior decisions", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"review consistency versus availability tradeoff for a distributed model registry",
				context: "the platform team owns promotion, replication, and rollback",
				options: {
					reviewMode: "architecture",
					decisionHorizon: "annual",
				},
			},
			{
				detailIncludes: [
					"Identify the architectural invariants first",
					"Name the dominant tradeoff explicitly",
					"State the strongest rejected alternative",
				],
				recommendationCountAtLeast: 4,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"worked-example",
			"eval-criteria",
		]);
		expect(result.artifacts?.[1]).toMatchObject({
			title: "L9 decision quality rubric",
		});
	});

	it("returns the invalid-input path when the input shape fails schema validation", async () => {
		const result = await skillModule.run(
			// biome-ignore lint/suspicious/noExplicitAny: exercising invalid input shape
			{ request: 42 } as any,
			createMockSkillRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Invalid input:");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});

	it("falls back to 'the requested decision' framing when the request has no keywords but context supplies the signal", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "is a",
				context: "the platform team owns promotion, replication, and rollback",
			},
			{
				detailIncludes: ['Review "the requested decision" through an'],
			},
		);
		expect(result.summary).not.toContain("Invalid input");
	});

	it("reports insufficient signal for a non-empty request that has no keywords and no context", async () => {
		// "is" and "a" are stop words / too short, so keywords.length === 0, and no
		// context is supplied. This passes schema validation (min length 1) but
		// still fails the keyword/context signal check, unlike the fully empty
		// request case (which is rejected earlier by schema validation instead).
		const result = await skillModule.run(
			{ request: "is a" },
			createMockSkillRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
		expect(result.summary).not.toContain("Invalid input");
	});

	it("infers org-design review mode from organisational language", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"decide how the team should own the operating model for this platform",
			},
			{
				summaryIncludes: ["mode: org-design"],
			},
		);
		expect(result.summary).toContain("mode: org-design");
	});

	it("infers portfolio review mode from investment language", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"assess the enterprise portfolio investment across the programme",
			},
			{
				summaryIncludes: ["mode: portfolio"],
			},
		);
		expect(result.summary).toContain("mode: portfolio");
	});

	it("defaults to architecture review mode when no mode keywords are present", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "please take a look at this decision for us",
			},
			{
				summaryIncludes: ["mode: architecture"],
			},
		);
		expect(result.summary).toContain("mode: architecture");
	});

	it("omits counterpoints and uses singular guardrail wording when disabled and no rule matches", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "please take a look at this decision for us",
				options: {
					includeCounterpoints: false,
				},
			},
			{
				summaryIncludes: [
					"1 strategic engineering guardrail (",
					"counterpoints: omitted",
				],
			},
		);

		expect(result.summary).not.toContain("1 strategic engineering guardrails");
		expect(
			result.recommendations.map((r) => r.detail).join("\n"),
		).not.toContain("State the strongest rejected alternative");
	});

	it("omits deliverable, success-criteria, and constraint framing when none are provided", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "please take a look at this decision for us",
			},
			{},
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain(
			"Aim the guidance toward the stated deliverable",
		);
		expect(detailText).not.toContain(
			'define what "good enough to commit" means',
		);
		expect(detailText).not.toContain(
			"Treat the stated constraints as first-order design forces",
		);
	});

	it("includes deliverable, success-criteria, and constraint framing when all are provided", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"review consistency versus availability tradeoff for a distributed model registry",
				deliverable: "an architecture decision record",
				successCriteria: "the registry survives a region failover",
				constraints: ["no downtime", "must stay auditable", "budget neutral"],
			},
			{
				detailIncludes: [
					'Aim the guidance toward the stated deliverable: "an architecture decision record"',
					'define what "good enough to commit" means: "the registry survives a region failover"',
					"Treat the stated constraints as first-order design forces: no downtime; must stay auditable; budget neutral",
				],
			},
		);

		expect(result.executionMode).toBe("capability");
	});
});
