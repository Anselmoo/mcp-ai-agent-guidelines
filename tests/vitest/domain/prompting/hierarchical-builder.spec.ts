import { describe, expect, it, vi } from "vitest";
import {
	buildHierarchicalPrompt,
	calculateComplexity,
	estimateTokens,
} from "../../../../src/domain/prompting/hierarchical-builder.js";
import * as techniqueModule from "../../../../src/tools/prompt/technique-applicator.js";
import * as sharedSections from "../../../../src/tools/shared/prompt-sections.js";

describe("domain/prompting/hierarchical-builder", () => {
	it("builds ordered sections with metadata", () => {
		const result = buildHierarchicalPrompt({
			context: "Microservice refactor",
			goal: "Ship resilient API gateway",
			requirements: ["Document APIs", "Add retries"],
			constraints: ["Keep backward compatibility"],
			issues: ["Timeouts observed"],
			outputFormat: "1. Steps, 2. Risks",
			audience: "Backend engineers",
			techniques: ["chain-of-thought"],
			provider: "gpt-4.1",
		});

		expect(result.sections.map((section) => section.title)).toEqual([
			"Context",
			"Goal",
			"Requirements",
			"Constraints",
			"Problem Indicators",
			"Output Format",
			"Target Audience",
			"Approach",
			"Model-Specific Tips",
			"Instructions",
		]);

		const requirements = result.sections.find(
			(section) => section.title === "Requirements",
		);
		expect(requirements?.body).toContain("1. Document APIs");

		const instructions = result.sections.find(
			(section) => section.title === "Instructions",
		);
		expect(instructions?.body).toContain("Follow the structure above");

		expect(result.metadata.complexity).toBeGreaterThanOrEqual(20);
		expect(result.metadata.tokenEstimate).toBe(estimateTokens(result.sections));
	});

	it("omits technique hints when disabled", () => {
		const result = buildHierarchicalPrompt({
			context: "Data pipeline tuning",
			goal: "Optimize throughput",
			includeTechniqueHints: false,
			techniques: ["chain-of-thought"],
		});

		expect(
			result.sections.some((section) => section.title === "Approach"),
		).toBe(false);
	});

	it("calculates complexity with constraints and issues", () => {
		const config = {
			context: "UI overhaul",
			goal: "Improve accessibility",
			requirements: ["Add keyboard navigation"],
			constraints: ["No breaking changes"],
			issues: ["Inconsistent focus states"],
		};

		const score = calculateComplexity(config);
		expect(score).toBeGreaterThan(20);
	});

	it("removes duplicated heading from technique content", () => {
		const spy = vi
			.spyOn(techniqueModule, "applyTechniques")
			.mockReturnValueOnce("# Approach\nApproach\nDetails\nMore\n");
		const result = buildHierarchicalPrompt({
			context: "ctx",
			goal: "goal",
			techniques: ["chain-of-thought"],
		});
		const approach = result.sections.find((s) => s.title === "Approach");
		expect(approach).toBeDefined();
		expect(approach?.body).toContain("Details");
		expect(approach?.body).not.toContain("Approach");
		spy.mockRestore();
	});

	it("removes duplicated heading from provider tips", () => {
		const spy = vi
			.spyOn(sharedSections, "buildProviderTipsSection")
			.mockReturnValueOnce(
				"# Model-Specific Tips\nModel-Specific Tips\n- Prefer Markdown\n",
			);
		const result = buildHierarchicalPrompt({
			context: "ctx",
			goal: "goal",
		});
		const tips = result.sections.find((s) => s.title === "Model-Specific Tips");
		expect(tips).toBeDefined();
		expect(tips?.body).toContain("- Prefer Markdown");
		expect(tips?.body).not.toContain("Model-Specific Tips");
		spy.mockRestore();
	});
});
