import { describe, it, expect } from "vitest";
import { hierarchicalPromptBuilder } from "../../src/tools/prompt/hierarchical-prompt-builder.js";

describe("hierarchical-prompt-builder comprehensive coverage", () => {
	it("should handle all provider variants and techniques", async () => {
		const providers = ["gpt-5", "gpt-4.1", "claude-4", "claude-3.7", "gemini-2.5", "o4-mini", "o3-mini", "other"];
		const techniques = [
			"zero-shot", "few-shot", "chain-of-thought", "self-consistency", 
			"in-context-learning", "generate-knowledge", "prompt-chaining", 
			"tree-of-thoughts", "meta-prompting", "rag", "react", "art"
		];

		for (const provider of providers) {
			const result = await hierarchicalPromptBuilder({
				context: "AI model testing",
				goal: `Test prompting for ${provider}`,
				requirements: ["High accuracy", "Fast response", "Cost effective"],
				provider: provider as any,
				techniques,
				includeTechniqueHints: true,
				autoSelectTechniques: true,
				includeReferences: true,
				includeDisclaimer: true,
				includePitfalls: true,
				style: "markdown"
			});

			expect(result).toHaveProperty("content");
			const content = result.content[0].text;
			expect(content).toContain("AI model testing");
			expect(content).toContain("Technique Hints");
			expect(content).toContain("References");
			expect(content).toContain("Disclaimer");
			expect(content).toContain("Pitfalls");

			// Check that techniques are included
			techniques.forEach(technique => {
				expect(content).toContain(technique);
			});
		}
	});

	it("should handle XML style formatting", async () => {
		const result = await hierarchicalPromptBuilder({
			context: "XML formatting test",
			goal: "Generate XML-style prompt",
			requirements: ["Well-formed XML", "Clear structure"],
			style: "xml",
			techniques: ["chain-of-thought", "few-shot"],
			includeTechniqueHints: true
		});

		const content = result.content[0].text;
		expect(content).toContain("<context>");
		expect(content).toContain("</context>");
		expect(content).toContain("<goal>");
		expect(content).toContain("</goal>");
		expect(content).toContain("<requirements>");
		expect(content).toContain("</requirements>");
	});

	it("should handle automatic technique selection", async () => {
		const result = await hierarchicalPromptBuilder({
			context: "Machine learning model evaluation with complex reasoning chains",
			goal: "Analyze multiple models using systematic thinking and generate comprehensive knowledge",
			requirements: [
				"Chain of thought reasoning",
				"Few examples needed", 
				"Knowledge generation required",
				"Multiple consistency checks"
			],
			autoSelectTechniques: true,
			includeTechniqueHints: true
		});

		const content = result.content[0].text;
		expect(content).toContain("Technique Hints");
		
		// Should automatically detect relevant techniques from keywords
		expect(content).toContain("chain-of-thought");
		expect(content).toContain("few-shot");
		expect(content).toContain("generate-knowledge");
		expect(content).toContain("self-consistency");
	});

	it("should handle all optional sections disabled", async () => {
		const result = await hierarchicalPromptBuilder({
			context: "Minimal prompt",
			goal: "Basic functionality test",
			requirements: ["Simple output"],
			includeDisclaimer: false,
			includeReferences: false,
			includeTechniqueHints: false,
			includePitfalls: false,
			autoSelectTechniques: false
		});

		const content = result.content[0].text;
		expect(content).not.toContain("Technique Hints");
		expect(content).not.toContain("References");
		expect(content).not.toContain("Disclaimer");
		expect(content).not.toContain("Pitfalls");
		expect(content).toContain("Minimal prompt");
		expect(content).toContain("Basic functionality test");
	});

	it("should handle complex requirements with audience specification", async () => {
		const result = await hierarchicalPromptBuilder({
			context: "Enterprise software development",
			goal: "Create comprehensive API documentation",
			requirements: [
				"Technical accuracy for developers",
				"Business value explanation for managers", 
				"Implementation timelines",
				"Security considerations",
				"Performance benchmarks",
				"Integration examples",
				"Error handling scenarios",
				"Testing strategies"
			],
			audience: "Mixed technical and business stakeholders",
			outputFormat: "Multi-section technical document with executive summary",
			techniques: ["rag", "meta-prompting", "prompt-chaining"],
			includeTechniqueHints: true,
			includeReferences: true,
			includePitfalls: true,
			provider: "claude-4",
			style: "markdown"
		});

		const content = result.content[0].text;
		expect(content).toContain("Enterprise software development");
		expect(content).toContain("Mixed technical and business stakeholders");
		expect(content).toContain("Multi-section technical document");
		expect(content).toContain("rag");
		expect(content).toContain("meta-prompting");
		expect(content).toContain("prompt-chaining");
		
		// Check all requirements are included
		expect(content).toContain("Technical accuracy");
		expect(content).toContain("Business value");
		expect(content).toContain("Security considerations");
		expect(content).toContain("Testing strategies");
	});

	it("should handle empty requirements array", async () => {
		const result = await hierarchicalPromptBuilder({
			context: "Basic context",
			goal: "Simple goal",
			requirements: [],
			outputFormat: "Plain text",
			audience: "General audience"
		});

		expect(result).toHaveProperty("content");
		const content = result.content[0].text;
		expect(content).toContain("Basic context");
		expect(content).toContain("Simple goal");
		expect(content).toContain("Plain text");
	});

	it("should handle technique combination edge cases", async () => {
		// Test with all techniques enabled
		const allTechniques = [
			"zero-shot", "few-shot", "chain-of-thought", "self-consistency", 
			"in-context-learning", "generate-knowledge", "prompt-chaining", 
			"tree-of-thoughts", "meta-prompting", "rag", "react", "art"
		];

		const result = await hierarchicalPromptBuilder({
			context: "Comprehensive AI technique testing",
			goal: "Test all available prompting techniques",
			requirements: ["Demonstrate technique variety", "Show technique synergy"],
			techniques: allTechniques,
			includeTechniqueHints: true,
			autoSelectTechniques: false // Explicit technique selection
		});

		const content = result.content[0].text;
		expect(content).toContain("Technique Hints");
		
		// Verify all techniques are mentioned
		allTechniques.forEach(technique => {
			expect(content).toContain(technique);
		});
	});

	it("should handle provider-specific optimizations", async () => {
		const testCases = [
			{ provider: "gpt-5", expectedOptimization: "advanced reasoning" },
			{ provider: "claude-4", expectedOptimization: "detailed analysis" },
			{ provider: "gemini-2.5", expectedOptimization: "multimodal" },
			{ provider: "o4-mini", expectedOptimization: "efficient" }
		];

		for (const testCase of testCases) {
			const result = await hierarchicalPromptBuilder({
				context: "Provider optimization test",
				goal: "Test provider-specific features",
				requirements: ["Optimize for provider capabilities"],
				provider: testCase.provider as any,
				includeTechniqueHints: true
			});

			const content = result.content[0].text;
			expect(content).toContain("Provider optimization test");
			expect(content).toContain("Technique Hints");
		}
	});
});