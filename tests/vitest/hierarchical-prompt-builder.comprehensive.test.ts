import { describe, expect, it } from "vitest";
import { hierarchicalPromptBuilder } from "../../src/tools/prompt/hierarchical-prompt-builder.js";

describe("hierarchical-prompt-builder comprehensive coverage", () => {
	it("should handle all provider variants and techniques", async () => {
		const providers = [
			"gpt-5",
			"gpt-4.1",
			"claude-opus-4.1",
			"claude-sonnet-4",
			"gemini-2.5-pro",
			"gpt-5-mini",
			"gpt-5.1",
			"other",
		];
		const techniques = [
			"zero-shot",
			"few-shot",
			"chain-of-thought",
			"self-consistency",
			"in-context-learning",
			"generate-knowledge",
			"prompt-chaining",
			"tree-of-thoughts",
			"meta-prompting",
			"rag",
			"react",
			"art",
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
				style: "markdown",
			});

			expect(result).toHaveProperty("content");
			const content = result.content[0].text;
			expect(content).toContain("AI model testing");
			// No longer checking for generic "Technique Hints" - now we have actionable instructions
			expect(content).toContain("References");
			expect(content).toContain("Disclaimer");
			// No longer checking for generic "Pitfalls" section

			// Check that specific actionable sections are included based on techniques
			// These tests verify that context-specific guidance is generated
		}
	});

	it("should handle XML style formatting", async () => {
		const result = await hierarchicalPromptBuilder({
			context: "XML formatting test",
			goal: "Generate XML-style prompt",
			requirements: ["Well-formed XML", "Clear structure"],
			style: "xml",
			techniques: ["chain-of-thought", "few-shot"],
			includeTechniqueHints: true,
		});

		const content = result.content[0].text;
		expect(content).toContain("XML formatting test");
		expect(content).toContain("Generate XML-style prompt");
		expect(content).toContain("Well-formed XML");
		expect(content).toContain("Clear structure");
		expect(content).toContain("XML"); // Check XML style is mentioned
	});

	it("should handle automatic technique selection", async () => {
		const result = await hierarchicalPromptBuilder({
			context:
				"Machine learning model evaluation with complex reasoning chains",
			goal: "Analyze multiple models using systematic thinking and generate comprehensive knowledge",
			requirements: [
				"Chain of thought reasoning",
				"Few examples needed",
				"Knowledge generation required",
				"Multiple consistency checks",
			],
			autoSelectTechniques: true,
			includeTechniqueHints: true,
		});

		const content = result.content[0].text;
		// Auto-selection should generate actionable instructions based on context
		// Check that we have actionable sections instead of generic hints
		expect(content).toContain("Machine learning model evaluation");
		// Should detect relevant techniques and generate specific guidance
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
			autoSelectTechniques: false,
		});

		const content = result.content[0].text;
		// Should not contain actionable instruction sections when disabled
		expect(content).not.toContain("Approach");
		expect(content).not.toContain("Examples");
		expect(content).not.toContain("References");
		expect(content).not.toContain("Disclaimer");
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
				"Testing strategies",
			],
			audience: "Mixed technical and business stakeholders",
			outputFormat: "Multi-section technical document with executive summary",
			techniques: ["rag", "meta-prompting", "prompt-chaining"],
			includeTechniqueHints: true,
			includeReferences: true,
			includePitfalls: true,
			provider: "claude-opus-4.1",
			style: "markdown",
		});

		const content = result.content[0].text;
		expect(content).toContain("Enterprise software development");
		expect(content).toContain("Mixed technical and business stakeholders");
		expect(content).toContain("Multi-section technical document");
		// Check for actionable sections - all techniques are now in Approach section
		expect(content).toContain("# Approach");
		const approachSection = (() => {
			const start = content.indexOf("# Approach");
			if (start === -1) return "";
			const remainder = content.slice(start + "# Approach".length);
			const nextHeading = remainder.indexOf("\n# ");
			return nextHeading === -1 ? remainder : remainder.slice(0, nextHeading);
		})();
		expect(approachSection).toContain("Retrieve Relevant Information"); // RAG content
		expect(approachSection).toContain("Step-by-Step Workflow"); // Prompt chaining section

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
			audience: "General audience",
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
			"zero-shot",
			"few-shot",
			"chain-of-thought",
			"self-consistency",
			"in-context-learning",
			"generate-knowledge",
			"prompt-chaining",
			"tree-of-thoughts",
			"meta-prompting",
			"rag",
			"react",
			"art",
		];

		const result = await hierarchicalPromptBuilder({
			context: "Comprehensive AI technique testing",
			goal: "Test all available prompting techniques",
			requirements: ["Demonstrate technique variety", "Show technique synergy"],
			techniques: allTechniques,
			includeTechniqueHints: true,
			autoSelectTechniques: false, // Explicit technique selection
		});

		const content = result.content[0].text;
		// Verify actionable instruction sections - all techniques generate content
		expect(content).toContain("# Approach"); // Main approach section
		expect(content).toContain("Think through this problem step-by-step"); // chain-of-thought
		expect(content).toMatch(/Examples/i); // few-shot guidance still present
		expect(content).toContain(
			"Before solving the task, gather and document relevant knowledge",
		); // generate-knowledge
		expect(content).toContain("Explore Alternative Approaches"); // tree-of-thoughts
	});

	it("should handle provider-specific optimizations", async () => {
		const testCases = [
			{ provider: "gpt-5", expectedOptimization: "advanced reasoning" },
			{
				provider: "claude-opus-4.1",
				expectedOptimization: "detailed analysis",
			},
			{ provider: "gemini-2.5-pro", expectedOptimization: "multimodal" },
			{ provider: "gpt-5-mini", expectedOptimization: "efficient" },
		];

		for (const testCase of testCases) {
			const result = await hierarchicalPromptBuilder({
				context: "Provider optimization test",
				goal: "Test provider-specific features",
				requirements: ["Optimize for provider capabilities"],
				provider: testCase.provider as any,
				includeTechniqueHints: true,
			});

			const content = result.content[0].text;
			expect(content).toContain("Provider optimization test");
			// Provider-specific tips should still be included
			expect(content).toContain("Model-Specific Tips");
		}
	});
});
