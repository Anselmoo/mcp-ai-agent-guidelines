import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/flow/flow-context-handoff.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("flow-context-handoff", () => {
	it("produces structured handoff safeguards", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "handoff workflow context and artifacts between agents",
				context:
					"The research phase is complete and implementation starts next.",
				options: {
					handoffStyle: "structured",
					maxContextItems: 4,
					includeValidation: true,
				},
			},
			{
				summaryIncludes: ["Context Handoff prepared", "style: structured"],
				detailIncludes: [
					"no more than 4 must-carry items",
					"structured handoff template",
					"handoff validation check",
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
			title: "Context resume packet template",
		});
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("asks for more detail when the request has no keywords or context", async () => {
		// A non-empty request passes schema validation, but if it's made up
		// entirely of stop-words and no context is supplied, keywords.length
		// is 0 and hasContext is false — the insufficient-signal guard should
		// still trigger (distinct from the empty-string case above, which is
		// rejected earlier by schema validation).
		const result = await skillModule.run(
			{ request: "the it" },
			createMockSkillRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
		expect(result.summary).toContain(
			"Context Handoff needs the current task state",
		);
	});

	it("proceeds when keywords are absent but context is present", async () => {
		// Request is all stop-words (keywords.length === 0) but context is
		// supplied, so the insufficient-signal guard's `&&` short-circuits to
		// false and execution continues past it.
		await expectSkillGuidance(
			skillModule,
			{
				request: "the it",
				context: "Some prior state to carry forward.",
			},
			{
				summaryIncludes: ["Context Handoff prepared", "context: present"],
				detailIncludes: ["the active workflow"],
			},
		);
	});

	it("falls back to defaults when no context or options are supplied", async () => {
		// No context, no options: exercises the `??` defaults for
		// maxContextItems/handoffStyle, the missing-context detail branch, and
		// the includeValidation default-true branch.
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "handoff the workflow state to the next agent",
			},
			{
				summaryIncludes: ["style: structured", "context: missing"],
				detailIncludes: [
					"no more than 5 must-carry items",
					"structured handoff template",
					"No current-state context was provided",
					"handoff validation check",
				],
			},
		);
		expect(result.summary).toContain("deliverable: undefined");
	});

	it("supports the brief handoff style", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "handoff workflow context between agents",
				context: "Prior investigation is complete.",
				options: { handoffStyle: "brief" },
			},
			{
				summaryIncludes: ["style: brief"],
				detailIncludes: ["Use a brief handoff format"],
			},
		);
	});

	it("supports the artifact-first handoff style", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "handoff workflow context between agents",
				context: "Prior investigation is complete.",
				options: { handoffStyle: "artifact-first" },
			},
			{
				summaryIncludes: ["style: artifact-first"],
				detailIncludes: ["Use an artifact-first handoff"],
			},
		);
	});

	it("carries deliverable, success criteria, and constraints into the handoff", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "handoff workflow context and artifacts between agents",
				context: "Prior investigation is complete.",
				deliverable: "a signed-off migration plan",
				successCriteria: "the plan passes review",
				constraints: ["Keep it under one page", "No new dependencies"],
			},
			{
				detailIncludes: [
					'Carry the deliverable target forward explicitly: "a signed-off migration plan"',
					'validate completion against "the plan passes review"',
					"Promote these constraints into the handoff header",
				],
			},
		);
		expect(result.summary).toContain("deliverable: defined");
	});

	it("omits the validation safeguards when includeValidation is false", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "handoff workflow context between agents",
				context: "Prior investigation is complete.",
				options: { includeValidation: false },
			},
			{},
		);
		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("Add a handoff validation check");
		expect(detailText).not.toContain(
			"Record the checkpoint the next owner should resume from",
		);
	});
});
