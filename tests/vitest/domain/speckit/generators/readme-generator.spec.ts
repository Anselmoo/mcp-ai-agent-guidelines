import { describe, expect, it } from "vitest";
import { generateReadme } from "../../../../../src/domain/speckit/generators/readme-generator.js";
import { createInitialSessionState } from "../../../../../src/domain/speckit/types.js";

describe("generateReadme", () => {
	it("should generate README artifact", () => {
		const state = createInitialSessionState({
			title: "Readme Test",
			overview: "Summary",
			objectives: [{ description: "Obj", priority: "medium" }],
			requirements: [
				{ description: "Req", type: "functional", priority: "medium" },
			],
			acceptanceCriteria: [],
			outOfScope: [],
			validateAgainstConstitution: false,
		});

		const result = generateReadme(state);
		expect(result.title).toBe("README.md");
		expect(result.content).toContain("# Readme Test");
		expect(result.tokenEstimate).toBeGreaterThan(0);
	});
});
