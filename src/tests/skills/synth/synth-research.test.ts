import { describe, expect, it } from "vitest";
import { skillModule } from "../../../skills/synth/synth-research.js";
import {
	expectInsufficientSignalHandling,
	expectSkillGuidance,
} from "../test-helpers.js";

describe("synth-research", () => {
	it("limits deep research synthesis to a bounded source set", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "synthesize research evidence into concise direction",
				options: {
					researchDepth: "deep",
					maxSources: 5,
				},
			},
			{
				summaryIncludes: [
					"Research Assistant planned",
					"depth: deep",
					"max sources: 5",
				],
				detailIncludes: [
					"Cap the source set at 5 high-quality sources",
					"Hand off the organised, gap-annotated source set to synth-engine",
				],
				recommendationCountAtLeast: 2,
			},
		);
	});

	it("asks for more detail when the request is empty", async () => {
		await expectInsufficientSignalHandling(skillModule);
	});

	it("treats structured evidence as the initial research substrate", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "research the MCP evidence flow",
				options: {
					researchDepth: "standard",
					maxSources: 6,
					evidence: [
						{
							sourceType: "context7-docs",
							toolName: "mcp_context7_get-library-docs",
							locator: "/modelcontextprotocol/typescript-sdk",
							authority: "official",
							sourceTier: 1,
						},
					],
				},
			},
			{
				detailIncludes: [
					"Structured evidence is already attached",
					"/modelcontextprotocol/typescript-sdk",
				],
				recommendationCountAtLeast: 3,
			},
		);
	});

	it("routes comparison-heavy requests to synth-comparative after gathering", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "research vector store options and compare them for us",
			},
			{
				detailIncludes: [
					"reserve the scoring, ranking, and weighting work for synth-comparative",
				],
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

	it("asks for more detail when the request has no scored keywords and no context", async () => {
		// The request is a valid non-empty string (passes schema validation) but
		// is made up entirely of stop-words, so it yields zero keywords. With no
		// context supplied either, this exercises the true branch of
		// `signals.keywords.length === 0 && !signals.hasContext`, distinct from
		// the schema-rejection path covered by an empty request string.
		const result = await expectSkillGuidance(
			skillModule,
			{ request: "of the and" },
			{},
		);
		expect(result.recommendations[0]).toMatchObject({
			title: "Provide more detail",
		});
	});

	it("proceeds when the request has no scored keywords but context is present", async () => {
		// Same zero-keyword request, but context carries the signal, so the
		// short-circuit must evaluate to false via the hasContext side.
		await expectSkillGuidance(
			skillModule,
			{
				request: "of the and",
				context: "we need an evidence packet on vector databases",
			},
			{
				summaryIncludes: ["Research Assistant planned"],
				recommendationCountAtLeast: 2,
			},
		);
	});

	it("adds no RESEARCH_RULES detail when the request matches none of the rule patterns", async () => {
		const result = await expectSkillGuidance(
			skillModule,
			{
				request: "please help me understand the situation",
			},
			{
				summaryIncludes: ["Research Assistant planned"],
			},
		);

		const detailText = result.recommendations
			.map((recommendation) => recommendation.detail)
			.join("\n");
		// None of the RESEARCH_RULES patterns (gather/topic/source/organise/gap/
		// quality/scope) should have matched, so none of their detail strings
		// appear.
		expect(detailText).not.toContain("Structure gathering around");
		expect(detailText).not.toContain("Decompose the research topic");
	});

	it("filters retrieved evidence by stated constraints when both are present", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "research caching strategies for the API gateway",
				constraints: ["must support multi-region", "budget under $500/mo"],
				options: {
					evidence: [
						{
							sourceType: "context7-docs",
							toolName: "mcp_context7_get-library-docs",
							locator: "/vendor/caching-guide",
							authority: "official",
							sourceTier: 1,
						},
					],
				},
			},
			{
				detailIncludes: [
					"Apply the stated constraints as filters over the retrieved evidence set",
					"Validate which attached sources survive those filters",
				],
			},
		);
	});

	it("treats constraints as source-selection filters when no evidence is attached", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "research caching strategies for the API gateway",
				constraints: ["must support multi-region", "budget under $500/mo"],
			},
			{
				detailIncludes: [
					"Apply the stated constraints as source-selection filters",
					"Sources that violate constraints should be excluded",
				],
			},
		);
	});

	it("structures gathered material around a stated deliverable", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "research vector database options",
				deliverable: "a one-page evidence brief for the trade study",
			},
			{
				detailIncludes: [
					'Structure the gathered material to support the stated deliverable: "a one-page evidence brief for the trade study"',
				],
			},
		);
	});

	it("uses success criteria to decide when the evidence packet is complete", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "research vector database options",
				successCriteria: "every open question has a source or a documented gap",
			},
			{
				detailIncludes: [
					'Use the success criteria to decide when the evidence packet is complete: "every open question has a source or a documented gap"',
				],
			},
		);
	});

	it("appends matching RESEARCH_RULES detail when the request triggers rule patterns", async () => {
		// Exercises the RESEARCH_RULES.filter(...).map(({ detail }) => detail)
		// callback: this request matches the gather/quality/scope rule patterns,
		// so the map callback must actually run and produce detail strings.
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"gather sources on vector database quality and scope for our RAG system",
			},
			{
				detailIncludes: [
					"Structure gathering around a defined search scope",
					"Assess source quality before including it in the organised output",
					"Confirm the research scope before starting the gathering pass",
				],
			},
		);
	});

	it("defaults to deep research depth when the request complexity is complex", async () => {
		// A request with 18+ scored keywords and no explicit researchDepth
		// option exercises the `complexity === "complex" ? "deep" : "standard"`
		// ternary's true branch.
		await expectSkillGuidance(
			skillModule,
			{
				request:
					"gather comprehensive research evidence documentation benchmarks specifications case studies vendor reports academic papers industry analysis technical whitepapers production deployment guides",
			},
			{
				summaryIncludes: ["depth: deep"],
			},
		);
	});

	it("flags an existing synthesis handoff when the request already asks to synthesise", async () => {
		await expectSkillGuidance(
			skillModule,
			{
				request: "turn this research into a concise summary of insights",
			},
			{
				detailIncludes: [
					"The request already points toward synthesis. Keep this step focused on building the evidence packet",
				],
			},
		);
	});
});
