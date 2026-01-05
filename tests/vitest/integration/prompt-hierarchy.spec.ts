/**
 * Integration: Unified prompt-hierarchy tool (P1-018)
 */
import { describe, expect, it } from "vitest";
import { promptHierarchy } from "../../../src/tools/prompt/prompt-hierarchy.js";

const TARGET_LEVELS = [
	"independent",
	"indirect",
	"direct",
	"modeling",
	"scaffolding",
	"full-physical",
];

describe("prompt-hierarchy integration", () => {
	it("handles build mode end-to-end", async () => {
		const result = await promptHierarchy({
			mode: "build",
			context: "Refactor authentication module",
			goal: "Adopt JWT tokens",
			requirements: ["maintain backward compatibility"],
			outputFormat: "markdown",
			audience: "backend engineers",
		});

		expect(result.content).toBeInstanceOf(Array);
		const text = result.content[0]?.text ?? "";
		expect(text).toContain("Refactor authentication module");
		expect(text).toContain("Adopt JWT tokens");
	});

	it("handles select mode end-to-end", async () => {
		const result = await promptHierarchy({
			mode: "select",
			taskDescription: "Implement payment processing",
			agentCapability: "intermediate",
			taskComplexity: "complex",
			autonomyPreference: "medium",
		});

		expect(result.content).toBeInstanceOf(Array);
		const text = result.content[0]?.text ?? "";
		expect(text).toMatch(/Hierarchy Level Recommendation/i);
		expect(text.length).toBeGreaterThan(0);
	});

	it("supports evaluation across all hierarchy levels", async () => {
		for (const level of TARGET_LEVELS) {
			const result = await promptHierarchy({
				mode: "evaluate",
				promptText: "Evaluate prompt quality",
				targetLevel: level,
				includeRecommendations: true,
			});

			expect(result.content).toBeInstanceOf(Array);
			const content = result.content[0];
			expect(content?.type).toBe("text");
			const normalizedText = (content?.text ?? "")
				.toLowerCase()
				.replace(/[^a-z]/g, "");
			expect(normalizedText).toContain(level.replace(/-/g, ""));
		}
	});
});
