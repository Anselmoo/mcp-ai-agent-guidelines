import { describe, expect, it } from "vitest";
import {
	buildHierarchicalPrompt,
	calculateComplexity,
	estimateTokens,
} from "../../../../src/domain/prompting/hierarchical-builder.js";

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
			techniqueContent: "# Approach\nStep 1\nStep 2\n",
			providerTipsContent: "# Model-Specific Tips\nUse markdown\n",
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
		const totalChars = result.sections.reduce(
			(sum, section) => sum + section.title.length + section.body.length,
			0,
		);
		const expectedEstimate = Math.max(50, Math.ceil(totalChars / 4));
		expect(result.metadata.tokenEstimate).toBe(expectedEstimate);
	});

	it("omits technique hints when disabled", () => {
		const result = buildHierarchicalPrompt({
			context: "Data pipeline tuning",
			goal: "Optimize throughput",
			includeTechniqueHints: false,
			techniques: ["chain-of-thought"],
			techniqueContent: "# Approach\ncontent",
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
		const result = buildHierarchicalPrompt({
			context: "ctx",
			goal: "goal",
			techniques: ["chain-of-thought"],
			techniqueContent: "# Approach\nApproach\nDetails\nMore\n",
		});
		const approach = result.sections.find((s) => s.title === "Approach");
		expect(approach).toBeDefined();
		expect(approach?.body).toContain("Details");
		expect(approach?.body).not.toContain("Approach");
	});

	it("removes duplicated heading from provider tips", () => {
		const result = buildHierarchicalPrompt({
			context: "ctx",
			goal: "goal",
			providerTipsContent:
				"# Model-Specific Tips\nModel-Specific Tips\n- Prefer Markdown\n",
		});
		const tips = result.sections.find((s) => s.title === "Model-Specific Tips");
		expect(tips).toBeDefined();
		expect(tips?.body).toContain("- Prefer Markdown");
		expect(tips?.body).not.toContain("Model-Specific Tips");
	});
});
