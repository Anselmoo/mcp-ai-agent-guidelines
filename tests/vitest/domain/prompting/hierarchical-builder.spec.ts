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
});
