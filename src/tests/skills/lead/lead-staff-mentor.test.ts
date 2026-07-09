import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/lead/lead-staff-mentor.js";
import {
	createMockSkillRuntime,
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("lead-staff-mentor", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("returns the insufficient-signal guidance when the request has no keywords and no context", async () => {
		const result = await skillModule.run(
			{ request: "to on at" },
			createMockSkillRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
		expect(result.summary).toContain(
			"Staff Engineering Mentor needs the growth goal, current challenge, or operating context",
		);
	});

	it("emits a mentoring plan, worked example, and practice checklist", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"mentor a senior engineer on growing their influence and technical strategy at staff level",
				context:
					"the engineer produces good implementation work but struggles to lead cross-team design decisions",
				options: {
					growthFocus: "influence" as const,
					includePracticePlan: true,
				},
			},
			{
				detailIncludes: [
					"Frame the mentoring advice around influence",
					"Translate the advice into a short practice loop",
					"Use the provided context to calibrate scope honestly",
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
			title: "Mentoring Plan (influence)",
		});
		expect(result.artifacts?.[2]).toMatchObject({
			title: "Staff mentoring practice checklist",
		});
	});

	it("infers a career growth focus when no explicit option is provided", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"help me build a promotion packet and grow my career scope for the next level",
				context: "I have strong scope but no clear evidence trail yet",
			},
			{
				detailIncludes: ["Frame the mentoring advice around career"],
			},
		);

		expect(result.artifacts?.[0]).toMatchObject({
			title: "Mentoring Plan (career)",
		});
	});

	it("infers an execution growth focus when no explicit option is provided", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"I keep struggling with execution during incidents and operational ambiguity",
				context: "delivery has been inconsistent across the last few launches",
			},
			{
				detailIncludes: ["Frame the mentoring advice around execution"],
			},
		);

		expect(result.artifacts?.[0]).toMatchObject({
			title: "Mentoring Plan (execution)",
		});
	});

	it("falls back to technical-strategy when no focus keywords match and omits the practice plan", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "banana kayak umbrella",
				options: { includePracticePlan: false },
			},
			{
				detailIncludes: [
					"Frame the mentoring advice around technical-strategy",
				],
			},
		);

		expect(result.artifacts?.[0]).toMatchObject({
			title: "Mentoring Plan (technical-strategy)",
		});
		expect(result.summary).toContain("practice plan: omitted");
		expect(result.summary).not.toContain(
			"Translate the advice into a short practice loop",
		);
	});

	it("bypasses the insufficient-signal gate on context alone when the request has no keywords", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "to on at",
				context:
					"the engineer needs calibration given their current environment",
			},
			{
				detailIncludes: [
					'Frame the mentoring advice around technical-strategy for "the stated growth challenge"',
					"Use the provided context to calibrate scope honestly",
				],
			},
		);

		expect(result.summary).toContain("mentoring guardrail");
	});

	it("produces exactly one guardrail when nothing else applies (singular summary wording)", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "banana kayak umbrella",
				options: { includePracticePlan: false },
			},
			{},
		);

		expect(result.summary).toContain("1 mentoring guardrail (");
		expect(result.summary).not.toContain("mentoring guardrails");
	});
});
