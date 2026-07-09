import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/lead/lead-digital-architect.js";
import {
	createMockSkillRuntime,
	expectEmptyRequestHandling,
	expectSkillGuidance,
	expectSkillModuleContract,
} from "../test-helpers.js";

describe("lead-digital-architect", () => {
	it("exports a manifest-backed capability module", async () => {
		await expectSkillModuleContract(skillModule);
	});

	it("returns structured guidance for an empty request", async () => {
		await expectEmptyRequestHandling(skillModule);
	});

	it("emits a concrete architecture matrix and brief template", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "design the enterprise ai platform layers and ownership model",
				context: "legacy systems still need a transition plan",
				options: {
					architectureLens: "platform",
					includeTransitionStates: true,
				},
			},
			{
				detailIncludes: [
					"Separate the enterprise AI platform into layers",
					"Add an operating-model overlay",
					"Describe at least one transition state",
				],
				recommendationCountAtLeast: 3,
			},
		);

		expect(result.artifacts?.map((artifact) => artifact.kind)).toEqual([
			"comparison-matrix",
			"output-template",
		]);
		expect(result.artifacts?.[0]).toMatchObject({
			title: "Enterprise AI architecture decision matrix",
		});
	});

	it("omits the operating-model overlay when includeOperatingModel is false", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "design the enterprise ai platform layers and routing",
				options: {
					includeOperatingModel: false,
				},
			},
			{
				summaryIncludes: ["operating model: omitted"],
			},
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("Add an operating-model overlay");
	});

	it("omits the transition-state guidance when includeTransitionStates is false", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "design the enterprise ai platform layers and routing",
				options: {
					includeTransitionStates: false,
				},
			},
			{
				summaryIncludes: ["transition states: omitted"],
			},
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		expect(detailText).not.toContain("Describe at least one transition state");
	});

	it("infers the governance architecture lens from governance-flavored requests", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "review our ai governance and compliance risk approach",
			},
			{
				summaryIncludes: ["lens: governance"],
			},
		);
	});

	it("infers the operating-model architecture lens from ownership-flavored requests", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "clarify team ownership and decision rights across ai squads",
			},
			{
				summaryIncludes: ["lens: operating-model"],
			},
		);
	});

	it("falls back to the portfolio architecture lens when no keyword set matches", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"plan the multi-year investment roadmap and budget allocation across our ai initiatives",
			},
			{
				summaryIncludes: ["lens: portfolio"],
			},
		);
	});

	it("shapes guidance toward a top-level deliverable", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "design the enterprise ai platform layers and routing",
				deliverable: "one-page architecture brief",
			},
			{
				detailIncludes: [
					'Shape the architecture guidance toward the stated deliverable: "one-page architecture brief"',
				],
			},
		);
	});

	it("turns top-level success criteria into architecture acceptance conditions", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "design the enterprise ai platform layers and routing",
				successCriteria: "every layer has a named owner",
			},
			{
				detailIncludes: [
					'Turn the success criteria into architecture acceptance conditions: "every layer has a named owner"',
				],
			},
		);
	});

	it("treats top-level constraints as architecture invariants", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "design the enterprise ai platform layers and routing",
				constraints: ["must reuse the existing identity provider"],
			},
			{
				detailIncludes: [
					"Treat the stated constraints as architecture invariants: must reuse the existing identity provider",
				],
			},
		);
	});

	it("surfaces structured evidence even without a context field", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "design the enterprise ai platform layers and routing",
				options: {
					evidence: [
						{
							sourceType: "webpage",
							toolName: "fetch_webpage",
							locator:
								"https://modelcontextprotocol.io/docs/learn/architecture",
							authority: "official",
							sourceTier: 1,
						},
					],
				},
			},
			{
				detailIncludes: ["Structured evidence is already attached:"],
			},
		);
	});

	it("returns the invalid-input path when request is missing entirely", async () => {
		const result = await skillModule.run(
			// biome-ignore lint/suspicious/noExplicitAny: exercising invalid input shape
			{} as any,
			createMockSkillRuntime(),
		);
		expect(result.executionMode).toBe("capability");
		expect(result.summary).toContain("Invalid input:");
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});

	it("uses singular guardrail wording when only the base framing line applies", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "outline the future ai capability roadmap for our small group",
				options: {
					includeOperatingModel: false,
					includeTransitionStates: false,
				},
			},
			{
				summaryIncludes: ["1 architecture guardrail ("],
			},
		);

		expect(result.summary).not.toContain("1 architecture guardrails");
		expect(
			result.recommendations.map((r) => r.detail).join("\n"),
		).not.toContain("Add an operating-model overlay");
	});
});
