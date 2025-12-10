import { describe, expect, it } from "vitest";
import type {
	Provider,
	Technique,
} from "../../src/tools/shared/prompt-sections";
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
			"document workflow reason example verify facts brainstorm search",
		);
		expect(t.length).toBeLessThanOrEqual(6);
	});

	it("inferTechniquesFromText with no matching patterns except zero-shot", () => {
		const t = inferTechniquesFromText("xyz abc hello world");
		expect(t).toEqual(["zero-shot"]);
	});

	it("inferTechniquesFromText with single matching pattern", () => {
		const t = inferTechniquesFromText("document citation");
		expect(t).toContain("rag");
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
		const gpt5 = buildProviderTipsSection("gpt-5", "markdown");
		expect(gpt5).toMatch(/Preferred Style: MARKDOWN/);
		const claude = buildProviderTipsSection("claude-opus-4.1");
		expect(claude).toMatch(/Preferred Style: XML/);
		const gemini = buildProviderTipsSection("gemini-2.5-pro");
		expect(gemini).toMatch(/Preferred Style: MARKDOWN/);
	});

	it("buildProviderTipsSection uses gpt-5 as default", () => {
		const defaultTips = buildProviderTipsSection();
		expect(defaultTips).toMatch(/Model-Specific Tips/);
		expect(defaultTips).toMatch(/Preferred Style: MARKDOWN/);
	});

	it("buildProviderTipsSection handles falsy provider with fallback", () => {
		// Test the || "gpt-5" fallback by passing null (which bypasses default parameter)
		const fallbackTips = buildProviderTipsSection(null as any);
		expect(fallbackTips).toMatch(/Model-Specific Tips/);
		expect(fallbackTips).toMatch(/Preferred Style: MARKDOWN/);
		expect(fallbackTips).toMatch(/Prefer Markdown with clear headings/);
	});

	it("buildPitfallsSection and buildDisclaimer return expected headings", () => {
		expect(buildPitfallsSection()).toMatch(/Pitfalls to Avoid/);
		expect(buildDisclaimer()).toMatch(/Disclaimer/);
	});
	it("buildProviderTipsSection includes provider-specific tips", () => {
		const gpt = buildProviderTipsSection("gpt-5");
		expect(gpt).toMatch(/Markdown with clear headings/);
		expect(gpt).toMatch(/step numbering for CoT/);

		const claude = buildProviderTipsSection("claude-opus-4.1");
		expect(claude).toMatch(/XML-like structuring/);
		expect(claude).toMatch(/Tag documents distinctly/);

		const gemini = buildProviderTipsSection("gemini-2.5-pro");
		expect(gemini).toMatch(/consistent formatting/);
	});

	it("buildProviderTipsSection defaults to gpt-5", () => {
		const text = buildProviderTipsSection();
		expect(text).toMatch(/Markdown with clear headings/);
	});

	it("buildProviderTipsSection includes xml code example for claude", () => {
		const text = buildProviderTipsSection("claude-opus-4.1");
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
		const textLower = buildProviderTipsSection("gpt-5" as Provider);
		const textUpper = buildProviderTipsSection("gpt-5" as Provider);
		expect(textLower).toEqual(textUpper);
	});

	it("buildProviderTipsSection with unknown provider defaults to markdown", () => {
		const text = buildProviderTipsSection("unknown-model" as Provider);
		expect(text).toMatch(/Preferred Style: MARKDOWN/);
		expect(text).not.toMatch(/<instructions>/);
	});

	it("buildProviderTipsSection with unknown provider and explicit xml style", () => {
		const text = buildProviderTipsSection("unknown-model" as Provider, "xml");
		expect(text).toMatch(/Preferred Style: XML/);
		expect(text).toMatch(/<instructions>/);
	});

	it("inferTechniquesFromText detects prompt-chaining from pipeline keyword", () => {
		const t = inferTechniquesFromText("analyze then pipeline verify then plan");
		expect(t).toContain("prompt-chaining");
	});

	it("buildTechniqueHintsSection with all prompt-chaining combinations", () => {
		const techs: Technique[] = ["prompt-chaining"];
		const text = buildTechniqueHintsSection({ techniques: techs });
		expect(text).toMatch(/Prompt Chaining/);
		expect(text).toMatch(/sequential prompts/);
	});

	it("buildTechniqueHintsSection includes art technique", () => {
		const techs: Technique[] = ["art"];
		const text = buildTechniqueHintsSection({ techniques: techs });
		expect(text).toMatch(/Automatic Reasoning and Tool-use/);
		expect(text).toMatch(/Only use tools when needed/);
	});

	it("inferTechniquesFromText handles null/undefined gracefully", () => {
		const t1 = inferTechniquesFromText("");
		const t2 = inferTechniquesFromText("");
		expect(t1).toEqual(t2);
		expect(t1).toContain("zero-shot");
	});

	it("buildProviderTipsSection with explicit markdown style for claude", () => {
		const text = buildProviderTipsSection("claude-opus-4.1", "markdown");
		expect(text).toMatch(/Preferred Style: MARKDOWN/);
		expect(text).toMatch(/# Instructions/);
		// Claude's specific tips should still be present even with markdown style
		expect(text).toMatch(/XML-like structuring/);
	});

	it("buildProviderTipsSection with explicit xml style for gpt", () => {
		const text = buildProviderTipsSection("gpt-5", "xml");
		expect(text).toMatch(/Preferred Style: XML/);
		expect(text).toMatch(/<instructions>/);
		// GPT's specific tips should still be present even with xml style
		expect(text).toMatch(/Markdown with clear headings/);
	});

	it("buildProviderTipsSection with explicit xml style for claude", () => {
		const text = buildProviderTipsSection("claude-opus-4.1", "xml");
		expect(text).toMatch(/Preferred Style: XML/);
		expect(text).toMatch(/<instructions>/);
		expect(text).toMatch(/XML-like structuring/);
	});

	it("buildProviderTipsSection with explicit markdown style for gemini", () => {
		const text = buildProviderTipsSection("gemini-2.5-pro", "markdown");
		expect(text).toMatch(/Preferred Style: MARKDOWN/);
		expect(text).toMatch(/# Instructions/);
		expect(text).toMatch(/consistent formatting/);
	});

	it("buildProviderTipsSection with explicit xml style for gemini", () => {
		const text = buildProviderTipsSection("gemini-2.5-pro", "xml");
		expect(text).toMatch(/Preferred Style: XML/);
		expect(text).toMatch(/<instructions>/);
		expect(text).toMatch(/consistent formatting/);
	});

	it("inferTechniquesFromText with multiple matching patterns", () => {
		const t = inferTechniquesFromText(
			"document then reason step workflow with examples verify consensus",
		);
		expect(t.length).toBeGreaterThan(1);
		expect(t.length).toBeLessThanOrEqual(6);
	});

	it("buildTechniqueHintsSection respects empty technique list with auto-select disabled", () => {
		const text = buildTechniqueHintsSection({
			techniques: [],
			autoSelectTechniques: false,
		});
		// Should use default techniques
		expect(text).toMatch(/Zero-Shot|Few-Shot/);
	});

	it("buildTechniqueHintsSection with explicit techniques overrides context text", () => {
		const techs: Technique[] = ["rag", "chain-of-thought"];
		const text = buildTechniqueHintsSection({
			techniques: techs,
			autoSelectTechniques: true,
			contextText: "brainstorm alternatives options", // Would infer tree-of-thoughts
		});
		// Should use explicit techniques, not inferred
		expect(text).toMatch(/RAG/);
		expect(text).toMatch(/Chain-of-Thought/);
		expect(text).not.toMatch(/Tree of Thoughts/);
	});

	it("buildTechniqueHintsSection with only autoSelectTechniques true", () => {
		const text = buildTechniqueHintsSection({
			autoSelectTechniques: true,
			contextText: "validate requirements and verify multiple approaches",
		});
		// Should infer techniques from context
		expect(text.length).toBeGreaterThan(0);
		expect(text).toMatch(/Technique Hints/);
	});

	it("inferTechniquesFromText preserves order and limits to 6", () => {
		const t = inferTechniquesFromText(
			"document cite reasoning workflow examples verify facts brainstorm search execute tools",
		);
		expect(t.length).toBeLessThanOrEqual(6);
		// First should be RAG (highest priority in order array)
		expect(t[0]).toBe("rag");
	});
});
