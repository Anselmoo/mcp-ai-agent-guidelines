import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/resil/resil-membrane.js";
import {
	createMockSkillRuntime,
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("resil-membrane", () => {
	it("applies masking at membrane boundaries", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"enforce membrane boundary for pii between workflow stages with masking",
				options: {
					defaultAction: "mask",
					regulatoryFramework: "HIPAA",
				},
			},
			{
				summaryIncludes: [
					"Membrane Orchestrator produced",
					"data-boundary guideline",
				],
				detailIncludes: [
					"Default action 'mask'",
					"HIPAA",
					"Define entry rules for every membrane boundary",
					"Define evolution rules for processing inside the membrane",
					"Define exit rules separately from entry rules",
					"fail closed on any unannotated field",
				],
				recommendationCountAtLeast: 5,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("rejects invalid membrane options", async () => {
		const result = await skillModule.run(
			{
				request: "enforce membrane boundaries for pii",
				options: { defaultAction: "scrub" },
			} as never,
			createMockSkillRuntime(),
		);

		expect(result.summary).toContain("Invalid input:");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});

	it("asks for more detail when the request has no extractable keywords and no context", async () => {
		// Non-empty request (passes schema validation) but made entirely of
		// punctuation, so extractRequestSignals yields zero keywords; no context
		// is supplied either, so Stage 1's `keywords.length === 0 && !hasContext`
		// must take its true arm and return early — distinct from the "" request
		// case, which fails schema validation before Stage 1 ever runs.
		const result = await skillModule.run(
			{ request: "??? --- !!!" },
			createMockSkillRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
		expect(result.summary).toContain(
			"Membrane Orchestrator needs a workflow boundary description",
		);
	});

	it("asks for more detail when the request has no keywords but context is present", async () => {
		// Request has only stop-words/punctuation (no extractable keywords), but
		// context is non-empty, so the Stage-1 "no keywords AND no context" check
		// must short-circuit on `!signals.hasContext` being false and fall through
		// to the Stage-2 domain-relevance check instead (which then also rejects
		// because the combined text has no membrane vocabulary and is "simple").
		const result = await skillModule.run(
			{
				request: "??? --- !!!",
				context: "some background info about the pipeline",
			},
			createMockSkillRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		expect(result.recommendations[0]?.title).toBe("Provide more detail");
	});

	it("asks for more detail when signal is complex but has no membrane vocabulary", async () => {
		// Enough distinct keywords to push complexity out of "simple", but none of
		// them reference membrane/boundary/clearance concepts, so hasMembraneSignal
		// is false while complexity !== "simple" — the Stage-2 gate must still let
		// this through rather than asking for more detail.
		const result = await skillModule.run(
			{
				request:
					"optimize database query performance across microservice replicas using caching layers and asynchronous batching",
			},
			createMockSkillRuntime(),
		);

		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Membrane Orchestrator produced");
	});

	it("does not duplicate the audit-logging note when a matched rule already mentions audit", async () => {
		// The base exit-rules guideline always mentions "audit" ("emit an audit
		// record for the crossing outcome"), so the auditRequired dedup check
		// (`!guidances.some(g => /audit/i.test(g))`) is always false in practice —
		// this exercises that guard and confirms no duplicate note is appended.
		const result = await skillModule.run(
			{
				request: "define entry rules for the payment processing stage",
				options: { auditRequired: true },
			},
			createMockSkillRuntime(),
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("Audit logging is enabled.");
	});

	it("prepends a clearance hierarchy note when clearanceLevels are provided", async () => {
		const result = await skillModule.run(
			{
				request:
					"annotate every field with its clearance level before crossing the membrane boundary",
				options: {
					clearanceLevels: ["public", "internal", "confidential", "restricted"],
				},
			},
			createMockSkillRuntime(),
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).toContain(
			"Clearance hierarchy (lowest to highest): public < internal < confidential < restricted",
		);
		// Also exercises the per-pattern MEMBRANE_RULES match/map path (the
		// request's "clearance level" phrasing matches the clearance-annotation rule).
		expect(detailText).toContain(
			"Define clearance levels as an ordered enumeration",
		);
	});

	it("appends a constraints note when the request carries constraints", async () => {
		const result = await skillModule.run(
			{
				request: "enforce membrane boundaries between workflow stages",
				constraints: [
					"Must comply with SOC2 audit requirements",
					"No PII may leave the internal zone",
				],
			},
			createMockSkillRuntime(),
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).toContain(
			"Apply membrane boundaries under the following constraints:",
		);
		expect(detailText).toContain("Must comply with SOC2 audit requirements");
	});
});
