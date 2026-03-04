import { describe, expect, it } from "vitest";
import { generateRoadmap } from "../../../../../src/domain/speckit/generators/roadmap-generator.js";
import { createInitialSessionState } from "../../../../../src/domain/speckit/types.js";

describe("generateRoadmap", () => {
	it("should generate roadmap milestones", () => {
		const state = createInitialSessionState({
			title: "Roadmap Test",
			overview: "Overview",
			objectives: [
				{ description: "Milestone one", priority: "high" },
				{ description: "Milestone two", priority: "medium" },
			],
			requirements: [
				{ description: "Req", type: "functional", priority: "high" },
			],
			acceptanceCriteria: [],
			outOfScope: [],
			validateAgainstConstitution: false,
		});

		const result = generateRoadmap(state);
		expect(result.title).toBe("roadmap.md");
		expect(result.content).toContain("M1");
		expect(result.content).toContain("M2");
	});
});
