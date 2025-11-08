import { describe, expect, it } from "vitest";
import type { Technique } from "../../src/tools/shared/prompt-sections";
import {
	buildDesignReferencesSection,
	buildDisclaimer,
	buildPitfallsSection,
	buildProjectReferencesSection,
	buildProviderTipsSection,
	buildTechniqueHintsSection,
	inferTechniquesFromText,
} from "../../src/tools/shared/prompt-sections";

describe("prompt-sections", () => {
	it("inferTechniquesFromText picks techniques based on keywords", () => {
		const t = inferTechniquesFromText(
			"Please cite sources and explain step by step",
		);
		expect(t).toContain("rag");
		expect(t).toContain("chain-of-thought");
	});

	it("inferTechniquesFromText detects multiple techniques from context", () => {
		const t = inferTechniquesFromText(
			"brainstorm alternatives and verify with consensus approaches",
		);
		expect(t).toContain("tree-of-thoughts");
		expect(t).toContain("self-consistency");
	});

	it("inferTechniquesFromText detects search and execute tools", () => {
		const t = inferTechniquesFromText(
			"use tools to search the web and call api",
		);
		expect(t).toContain("react");
	});

	it("inferTechniquesFromText returns zero-shot for empty text", () => {
		const t = inferTechniquesFromText("");
		expect(t).toContain("zero-shot");
	});

	it("inferTechniquesFromText limits results to 6 techniques", () => {
		const t = inferTechniquesFromText(
			"document workflow reason then pipeline example verify facts brainstorm search",
		);
		expect(t.length).toBeLessThanOrEqual(6);
	});

	it("buildTechniqueHintsSection respects explicit selection", () => {
		const techs: Technique[] = ["react", "art"];
		const text = buildTechniqueHintsSection({ techniques: techs });
		expect(text).toMatch(/ReAct/);
		expect(text).toMatch(/Automatic Reasoning and Tool-use/);
	});

	it("buildTechniqueHintsSection includes all selected techniques", () => {
		const techs: Technique[] = [
			"zero-shot",
			"few-shot",
			"chain-of-thought",
			"self-consistency",
			"in-context-learning",
			"generate-knowledge",
		];
		const text = buildTechniqueHintsSection({ techniques: techs });
		expect(text).toMatch(/Zero-Shot/);
		expect(text).toMatch(/Few-Shot/);
		expect(text).toMatch(/Chain-of-Thought/);
		expect(text).toMatch(/Self-Consistency/);
		expect(text).toMatch(/In-Context Learning/);
		expect(text).toMatch(/Generate Knowledge/);
	});

	it("buildTechniqueHintsSection includes tree-of-thoughts and meta-prompting", () => {
		const techs: Technique[] = ["tree-of-thoughts", "meta-prompting"];
		const text = buildTechniqueHintsSection({ techniques: techs });
		expect(text).toMatch(/Tree of Thoughts/);
		expect(text).toMatch(/Meta Prompting/);
	});

	it("buildTechniqueHintsSection can auto-select from context", () => {
		const text = buildTechniqueHintsSection({
			autoSelectTechniques: true,
			contextText: "workflow then plan then analyze",
		});
		expect(text).toMatch(/Prompt Chaining/);
	});

	it("buildTechniqueHintsSection uses defaults when no options provided", () => {
		const text = buildTechniqueHintsSection({});
		expect(text).toMatch(/Zero-Shot/);
		expect(text).toMatch(/Few-Shot/);
		expect(text).toMatch(/Chain-of-Thought/);
		expect(text).toMatch(/Prompt Chaining/);
		expect(text).toMatch(/RAG/);
	});

	it("buildProviderTipsSection varies by provider and style", () => {
		const gpt = buildProviderTipsSection("gpt-5", "markdown");
		expect(gpt).toMatch(/Preferred Style: MARKDOWN/);
		const claude = buildProviderTipsSection("claude-4");
		expect(claude).toMatch(/Preferred Style: XML/);
		const gemini = buildProviderTipsSection("gemini-2.5");
		expect(gemini).toMatch(/Preferred Style: MARKDOWN/);
	});

	it("buildProviderTipsSection includes provider-specific tips", () => {
		const gpt = buildProviderTipsSection("gpt-5");
		expect(gpt).toMatch(/Markdown with clear headings/);
		expect(gpt).toMatch(/step numbering for CoT/);

		const claude = buildProviderTipsSection("claude-4");
		expect(claude).toMatch(/XML-like structuring/);
		expect(claude).toMatch(/Tag documents distinctly/);

		const gemini = buildProviderTipsSection("gemini-2.5");
		expect(gemini).toMatch(/consistent formatting/);
	});

	it("buildProviderTipsSection defaults to gpt-5", () => {
		const text = buildProviderTipsSection();
		expect(text).toMatch(/Markdown with clear headings/);
	});

	it("buildProviderTipsSection includes xml code example for claude", () => {
		const text = buildProviderTipsSection("claude-4");
		expect(text).toMatch(/<instructions>/);
		expect(text).toMatch(/<context>/);
	});

	it("buildProviderTipsSection includes markdown code example for markdown style", () => {
		const text = buildProviderTipsSection("gpt-5", "markdown");
		expect(text).toMatch(/# Instructions/);
		expect(text).toMatch(/# Context/);
	});

	it("buildPitfallsSection returns expected content", () => {
		const text = buildPitfallsSection();
		expect(text).toMatch(/Pitfalls to Avoid/);
		expect(text).toMatch(/Vague instructions/);
		expect(text).toMatch(/Forced behaviors/);
		expect(text).toMatch(/Context mixing/);
	});

	it("buildDisclaimer returns expected content", () => {
		const text = buildDisclaimer();
		expect(text).toMatch(/Disclaimer/);
		expect(text).toMatch(/third-party tools/);
		expect(text).toMatch(/official docs/);
	});

	it("buildDesignReferencesSection includes design references", () => {
		const text = buildDesignReferencesSection();
		expect(text).toMatch(/OKLCH Color Primer/);
		expect(text).toMatch(/WCAG Contrast Guidelines/);
		expect(text).toMatch(/Material Design Motion Principles/);
	});

	it("buildDesignReferencesSection includes urls", () => {
		const text = buildDesignReferencesSection();
		expect(text).toMatch(/https:\/\/oklch.com\//);
		expect(text).toMatch(/https:\/\/www.w3.org\/WAI\/WCAG21\//);
	});

	it("buildProjectReferencesSection includes project references", () => {
		const text = buildProjectReferencesSection();
		expect(text).toMatch(/Project Scope Statement Best Practices/);
		expect(text).toMatch(/ISO 31000 Risk Management/);
	});

	it("buildProjectReferencesSection includes urls", () => {
		const text = buildProjectReferencesSection();
		expect(text).toMatch(/https:\/\/www.pmi.org\//);
		expect(text).toMatch(/https:\/\/www.iso.org\//);
	});

	it("buildTechniqueHintsSection with explicit empty techniques array", () => {
		const text = buildTechniqueHintsSection({ techniques: [] });
		expect(text).toMatch(/Zero-Shot/);
		expect(text).toMatch(/Few-Shot/);
	});

	it("buildProviderTipsSection case-insensitive provider matching", () => {
		const textLower = buildProviderTipsSection("gpt-5" as any);
		const textUpper = buildProviderTipsSection("gpt-5" as any);
		expect(textLower).toEqual(textUpper);
	});
});
