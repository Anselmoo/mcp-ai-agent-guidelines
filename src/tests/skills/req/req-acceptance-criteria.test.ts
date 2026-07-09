import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/req/req-acceptance-criteria.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("req-acceptance-criteria", () => {
	it("formats gherkin acceptance criteria with constraints", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "define acceptance criteria for audit export",
				constraints: ["must be deterministic"],
				options: {
					format: "gherkin",
					includeSadPath: true,
				},
			},
			{
				summaryIncludes: [
					"Acceptance Criteria generated",
					"format: gherkin",
					"constraints: wired",
				],
				detailIncludes: [
					"Happy-path criterion (gherkin)",
					"Sad-path criterion",
				],
				recommendationCountAtLeast: 3,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"eval-criteria",
			"worked-example",
		]);
		expect(result.artifacts?.[1]).toMatchObject({
			kind: "output-template",
			title: "Acceptance criteria template",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("formats narrative acceptance criteria without sad path or constraints", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "define acceptance criteria for approval workflow",
				deliverable: "approval audit trail",
				options: {
					format: "narrative",
					includeSadPath: false,
				},
			},
			{
				summaryIncludes: [
					"Acceptance Criteria generated",
					"format: narrative",
					"constraints: none",
				],
				detailIncludes: [
					'produce "approval audit trail"',
					"No user-defined success criteria provided.",
				],
			},
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("Sad-path criterion");

		expect(result.artifacts?.[1]).toMatchObject({
			kind: "output-template",
			title: "Acceptance criteria template",
		});
		const template = result.artifacts?.[1] as { template?: string };
		expect(template.template).toContain("# Acceptance criteria");
		expect(template.template).toContain("## Error handling");

		const example = result.artifacts?.[3] as {
			expectedOutput?: { criteria?: string[] };
		};
		expect(example.expectedOutput?.criteria).toHaveLength(1);
	});

	it("formats checklist acceptance criteria by default with success criteria supplied", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "define acceptance criteria for export feature",
				successCriteria: "exported files include a timestamp",
			},
			{
				summaryIncludes: ["format: checklist"],
				detailIncludes: [
					'Validate that the user-defined success criteria are testable as written: "exported files include a timestamp',
				],
			},
		);

		const template = result.artifacts?.[1] as { template?: string };
		expect(template.template).toContain("# Acceptance checklist");

		const example = result.artifacts?.[3] as {
			expectedOutput?: { criteria?: string[] };
		};
		expect(example.expectedOutput?.criteria).toHaveLength(2);
	});

	it("falls back to a generic action phrase when no keywords are extracted", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "do it",
				deliverable: "a report",
			},
			{
				detailIncludes: [
					'When a user performs "the described action"',
					'produce "a report"',
				],
			},
		);
	});

	it("asks for more detail when the request has no usable keywords, deliverable, or context", async () => {
		const result = await skillModule.run(
			{ request: "do it" },
			createMockSkillRuntime(),
		);

		expect(result.summary).toContain(
			"Acceptance Criteria generation needs more detail.",
		);
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});

	it("rejects invalid acceptance criteria format options", async () => {
		const result = await skillModule.run(
			{
				request: "define acceptance criteria for audit export",
				options: { format: "invalid-format" },
			} as never,
			createMockSkillRuntime(),
		);

		expect(result.summary).toContain("Invalid input:");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});
});
