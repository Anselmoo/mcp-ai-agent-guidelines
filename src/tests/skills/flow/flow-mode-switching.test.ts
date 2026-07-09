import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/flow/flow-mode-switching.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("flow-mode-switching", () => {
	it("plans evidence-based mode transitions", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "switch from planning to code once scope is fixed",
				context: "accepted requirements and first validation target exist",
				options: {
					currentMode: "plan",
					targetMode: "code",
				},
			},
			{
				summaryIncludes: [
					"Mode Switching planned",
					"current: plan, next: code",
				],
				detailIncludes: [
					"exit criterion for plan mode before entering code mode",
					"freeze the handoff package",
				],
				recommendationCountAtLeast: 4,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
			"tool-chain",
			"worked-example",
			"eval-criteria",
		]);
		expect(result.artifacts?.[1]).toMatchObject({
			kind: "output-template",
			title: "Transition memo template",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("asks for more detail when the request has no keywords and no context", async () => {
		const result = await skillModule.run(
			{ request: "we can do it" },
			createMockSkillRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain(
			"Mode Switching needs either the current operating mode",
		);
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});

	it("normalizes implement/debug/research modes detected from free text without explicit options", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"debug the failure then review and approve the fix before shipping",
			},
			{
				summaryIncludes: ["current: review, next: review"],
				detailIncludes: ["Add a review gate with explicit entry conditions"],
			},
		);

		expect(result.summary).toContain("current: review, next: review");
	});

	it("falls back to plan/code defaults when no mode keywords are detected and no deliverable is set", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "assess the widget inventory levels for the quarterly report",
			},
			{
				summaryIncludes: ["current: plan, next: code"],
				detailIncludes: [
					"Do not leave planning mode",
					"freeze the handoff package",
					"No state snapshot was supplied",
				],
			},
		);

		expect(result.summary).toContain("current: plan, next: code");
	});

	it("falls back to code/review defaults when no mode keywords are detected but a deliverable is set", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "assess the widget inventory levels for the quarterly report",
				deliverable: "a finalized inventory report",
			},
			{
				summaryIncludes: ["current: code, next: review"],
				detailIncludes: [
					"freeze the handoff package",
					"Add a review gate with explicit entry conditions",
					'Anchor the transition to the stated deliverable: "a finalized inventory report"',
				],
			},
		);

		expect(result.summary).toContain("current: code, next: review");
	});

	it("covers success-criteria and constraints guidance and omits rollback criteria when disabled", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "switch from review to operate once the gate approves it",
				options: {
					currentMode: "review",
					targetMode: "operate",
					includeRollbackCriteria: false,
				},
				successCriteria: "All review checklist items are signed off",
				constraints: [
					"No unreviewed changes",
					"Keep the rollback path documented",
				],
			},
			{
				summaryIncludes: ["current: review, next: review"],
				detailIncludes: [
					"Add a review gate with explicit entry conditions",
					'Translate the success criteria into transition gates so the workflow knows when it is safe to move on: "All review checklist items are signed off".',
					"Apply the stated constraints when defining switch authority and timing: No unreviewed changes; Keep the rollback path documented.",
				],
			},
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain(
			"Define rollback criteria for the transition",
		);
		expect(detailText).not.toContain("Do not leave planning mode");
		expect(detailText).not.toContain("freeze the handoff package");
	});

	it("records the missing-snapshot guidance when context is omitted, without leaving plan or code modes", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "switch from review to operate once the gate approves it",
				options: {
					currentMode: "review",
					targetMode: "operate",
				},
			},
			{
				summaryIncludes: ["current: review, next: review"],
				detailIncludes: ["No state snapshot was supplied"],
			},
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain(
			"Carry forward the current state snapshot",
		);
	});
});
