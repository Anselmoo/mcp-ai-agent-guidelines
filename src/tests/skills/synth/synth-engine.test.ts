import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/synth/synth-engine.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("synth-engine", () => {
	it("expands synthesis depth and insight extraction", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"synthesize findings into a decision memo with extracted insights",
				deliverable: "decision memo",
				options: {
					summaryDepth: "comprehensive",
					extractInsights: true,
				},
			},
			{
				summaryIncludes: [
					"Synthesis Engine produced",
					"depth: comprehensive",
					"insights: enabled",
				],
				detailIncludes: [
					"full insight extraction, conflict analysis, gaps, and limitations",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("asks for more detail when the request has no keywords and no context", async () => {
		// Unlike the empty-string case above (which fails schema validation
		// before signals are even extracted), this request passes validation
		// but still yields zero keywords with no context — exercising the
		// true branch of the post-parse insufficient-signal guard.
		const result = await skillModule.run(
			{ request: "is it" },
			createMockSkillRuntime(),
		);
		expect(result.summary).toContain(
			"Synthesis Engine needs the source material",
		);
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});

	it("switches to theme-based synthesis when insight extraction is disabled", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "synthesise these findings into a board memo",
				options: {
					summaryDepth: "standard",
					extractInsights: false,
				},
			},
			{
				summaryIncludes: ["insights: disabled"],
				detailIncludes: [
					"theme-level summaries",
					"recommendation-ready handoff",
				],
				recommendationCountAtLeast: 3,
			},
		);

		const template = result.artifacts?.find(
			(artifact) => artifact.kind === "output-template",
		);
		expect(template).toMatchObject({
			kind: "output-template",
			title: "Synthesis Output Template",
		});
		expect((template as { template: string }).template).toContain('"themes"');
		expect((template as { template: string }).template).not.toContain(
			'"insights"',
		);
	});

	it("hands recommendation-heavy prompts to recommendation framing after synthesis", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request:
					"synthesise these findings and recommend what we should do next",
			},
			{
				detailIncludes: ["hand the final choice to recommendation framing"],
				recommendationCountAtLeast: 3,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"output-template",
			"tool-chain",
			"worked-example",
			"eval-criteria",
		]);
	});

	it("proceeds with guidance when the request has no keywords but context is present", async () => {
		// Request is all stop words / too-short tokens, so signals.keywords is
		// empty, but context is non-empty — this exercises the `!hasContext`
		// branch of the insufficient-signal guard (false) and the "the
		// provided topic" fallback in the summary line.
		await expectSkillGuidance(
			skillModule,
			{
				request: "is it",
				context: "background material from the last design review",
			},
			{
				summaryIncludes: ["Synthesis Engine produced"],
				detailIncludes: ['"the provided topic"'],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("defaults to comprehensive depth for complex requests without an explicit summaryDepth", async () => {
		// 18+ distinct keywords pushes signals.complexity to "complex", which
		// exercises the comprehensive branch of the depth fallback when no
		// options.summaryDepth is supplied.
		const complexRequest = [
			"synthesize",
			"architecture",
			"benchmark",
			"incident",
			"latency",
			"retries",
			"ownership",
			"ambiguity",
			"ledger",
			"insight",
			"conflict",
			"gap",
			"limitation",
			"stakeholder",
			"reviewer",
			"deployment",
			"rollback",
			"escalation",
		].join(" ");

		await expectSkillGuidance(
			skillModule,
			{ request: complexRequest },
			{
				summaryIncludes: ["depth: comprehensive"],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("applies stated constraints, deliverable, success criteria, and context to the synthesis", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "synthesise these architecture findings",
				context: "prior benchmark notes already exist",
				constraints: ["Keep it under one page", "Cite every source"],
				deliverable: "one-page decision brief",
				successCriteria: "board can decide without rereading the packet",
			},
			{
				detailIncludes: [
					"Apply the stated constraints to the synthesis scope",
					"Shape the synthesis to directly support the stated deliverable",
					"Evaluate the synthesis output against the success criteria",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("flags an incomplete source set that still needs research before synthesis", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"we still need to gather more sources before synthesising this topic",
			},
			{
				detailIncludes: [
					"If the source set is still incomplete, gather the missing evidence",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});

	// Note: the `details.length === 1 ? "" : "s"` singular-vs-plural branch in
	// the summary line is not exercised here. `details` always starts with two
	// unconditional entries (the topic line and the reference-intake line) and
	// always gains at least one more from the unconditional extractInsights
	// branch, plus the final handoff line — so `details.length` can never be
	// 1 given the current handler structure. That branch is unreachable
	// without restructuring the handler, so it is intentionally left
	// uncovered.
});
